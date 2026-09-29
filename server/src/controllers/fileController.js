const mongoose = require('mongoose');

const File = require('../models/File');
const Permission = require('../models/Permission');
const ProjectMember = require('../models/ProjectMember');

const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { assertSafeName, buildPath } = require('../utils/pathUtils');
const { resolveFileAccess } = require('../utils/permissionResolver');

const { assertHoldsLock } = require('../sockets/lockService');
const lockService = require('../sockets/lockService');
const { roomName } = require('../sockets');

const { PROJECT_ROLES } = require('../../../shared/constants/roles');


// ============================================================
// Helpers
// ============================================================

function collaborationSettings(project) {
  const settings =
    project?.settings?.collaboration || {};

  return {
    enabled:
      settings.enabled !== false,

    presenceEnabled:
      settings.presenceEnabled !== false,

    fileLockingEnabled:
      settings.fileLockingEnabled !== false,

    teamChatEnabled:
      settings.teamChatEnabled !== false,
  };
}

function collaborationEnabled(project) {
  return collaborationSettings(project).enabled;
}

function fileLockingEnabled(project) {
  const settings =
    collaborationSettings(project);

  return (
    settings.enabled &&
    settings.fileLockingEnabled
  );
}


/**
 * Broadcasts an event to everyone currently connected
 * to the same project.
 *
 * Socket.IO is optional so this remains safe in unit tests
 * or environments where sockets are not initialized.
 *
 * Project collaboration can be disabled from project settings.
 */
function broadcast(req, event, payload) {
  const io = req.app.get('io');

  if (!io) {
    return;
  }

  if (!collaborationEnabled(req.project)) {
    return;
  }

  io
    .to(
      roomName(
        req.project._id.toString()
      )
    )
    .emit(
      event,
      payload
    );
}


// ============================================================
// Role defaults
// ============================================================

const ROLE_DEFAULTS = {
  [PROJECT_ROLES.OWNER]: {
    read: true,
    write: true,
  },

  [PROJECT_ROLES.ADMIN]: {
    read: true,
    write: true,
  },

  [PROJECT_ROLES.MEMBER]: {
    read: true,
    write: true,
  },
};


// ============================================================
// List project tree
// ============================================================

const listTree = asyncHandler(async (req, res) => {
  const nodes = await File.find({
    projectId: req.project._id,
  })
    .sort({ path: 1 })
    .lean();

  const isUnrestricted =
    req.membership.role === PROJECT_ROLES.OWNER ||
    req.membership.role === PROJECT_ROLES.ADMIN;

  // Owners and admins have unrestricted access.
  if (isUnrestricted) {
    const annotated = nodes.map((node) => ({
      ...node,
      access: {
        read: true,
        write: true,
      },
    }));

    return new ApiResponse(
      200,
      {
        nodes: annotated,
      }
    ).send(res);
  }

  // Load all explicit permissions for this user in one query.
  const overrides = await Permission.find({
    projectId: req.project._id,
    userId: req.user._id,
  }).lean();

  const overrideByResourceId = new Map(
    overrides.map((permission) => [
      permission.resourceId.toString(),
      permission,
    ])
  );

  const nodeById = new Map(
    nodes.map((node) => [
      node._id.toString(),
      node,
    ])
  );

  const memo = new Map();

  function resolve(nodeId) {
    if (memo.has(nodeId)) {
      return memo.get(nodeId);
    }

    const override =
      overrideByResourceId.get(nodeId);

    let result;

    if (override) {
      result = {
        read: override.permissions.read,
        write: override.permissions.write,
      };
    } else {
      const node = nodeById.get(nodeId);

      const parentId = node?.parentId
        ? node.parentId.toString()
        : null;

      result = parentId
        ? resolve(parentId)
        : (
            ROLE_DEFAULTS[
              req.membership.role
            ] || {
              read: false,
              write: false,
            }
          );
    }

    memo.set(
      nodeId,
      result
    );

    return result;
  }

  const annotated = nodes
    .map((node) => ({
      ...node,
      access: resolve(
        node._id.toString()
      ),
    }))
    .filter(
      (node) => node.access.read
    );

  return new ApiResponse(
    200,
    {
      nodes: annotated,
    }
  ).send(res);
});


// ============================================================
// Create file / folder
// ============================================================

const createNode = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    parentId,
    content,
  } = req.body;

  assertSafeName(name);

  let parent = null;
  let parentAccess;

  if (parentId) {
    parent = await File.findOne({
      _id: parentId,
      projectId: req.project._id,
    });

    if (
      !parent ||
      parent.type !== 'folder'
    ) {
      throw ApiError.badRequest(
        'parentId must reference an existing folder in this project'
      );
    }

    parentAccess =
      await resolveFileAccess({
        file: parent,
        membership: req.membership,
        userId: req.user._id,
      });
  } else {
    // Root creation follows the user's project role.
    parentAccess =
      ROLE_DEFAULTS[
        req.membership.role
      ] || {
        read: false,
        write: false,
      };
  }

  if (!parentAccess.write) {
    throw ApiError.forbidden(
      'You do not have write access to this location'
    );
  }

  const path = buildPath(
    parent?.path || null,
    name
  );

  const node = await File.create({
    projectId: req.project._id,
    parentId: parent?._id || null,
    name,
    path,
    type,
    content:
      type === 'file'
        ? content || ''
        : '',
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  new ApiResponse(
    201,
    {
      node,
    },
    `${
      type === 'folder'
        ? 'Folder'
        : 'File'
    } created`
  ).send(res);

  // Notify other users viewing this project.
  broadcast(
    req,
    'file_created',
    {
      node,
    }
  );
});


// ============================================================
// Get single node
// ============================================================

const getNode = asyncHandler(async (req, res) => {
  new ApiResponse(
    200,
    {
      node: req.node,
      access: req.fileAccess,
    }
  ).send(res);
});


// ============================================================
// Repath subtree
// ============================================================

/**
 * Recomputes paths for a node's descendants after
 * a folder rename/move.
 *
 * Descendants are updated using bulkWrite instead of
 * calling save() individually.
 */
async function repathSubtree(
  projectId,
  node,
  oldPath,
  newPath
) {
  const escapedOldPath =
    oldPath.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  const descendants =
    await File.find({
      projectId,
      path: {
        $regex:
          `^${escapedOldPath}/`,
      },
    });

  if (
    descendants.length === 0
  ) {
    return;
  }

  const operations =
    descendants.map(
      (descendant) => ({
        updateOne: {
          filter: {
            _id: descendant._id,
          },

          update: {
            path:
              newPath +
              descendant.path.slice(
                oldPath.length
              ),
          },
        },
      })
    );

  await File.bulkWrite(
    operations
  );
}


// ============================================================
// Rename node
// ============================================================

const renameNode = asyncHandler(async (req, res) => {
  const { name } = req.body;

  assertSafeName(name);

  const node = req.node;

  const oldPath = node.path;

  const parentPath =
    node.parentId
      ? (
          await File.findById(
            node.parentId
          )
        )?.path || null
      : null;

  const newPath = buildPath(
    parentPath,
    name
  );

  node.name = name;
  node.path = newPath;
  node.updatedBy = req.user._id;

  await node.save();

  // If a folder was renamed, update every descendant path.
  if (
    node.type === 'folder'
  ) {
    await repathSubtree(
      req.project._id,
      node,
      oldPath,
      newPath
    );
  }

  new ApiResponse(
    200,
    {
      node,
    },
    'Renamed'
  ).send(res);

  broadcast(
    req,
    'file_renamed',
    {
      fileId:
        node._id.toString(),
      name: node.name,
      path: node.path,
      oldPath,
    }
  );
});


// ============================================================
// Delete node
// ============================================================

const deleteNode = asyncHandler(async (req, res) => {
  const node = req.node;

  if (
    node.type === 'folder'
  ) {
    const escapedPath =
      node.path.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

    await File.deleteMany({
      projectId: req.project._id,
      path: {
        $regex:
          `^${escapedPath}(/|$)`,
      },
    });
  } else {
    await node.deleteOne();
  }

  // Remove permission overrides belonging to the deleted node.
  //
  // Note: this removes the direct Permission row for the deleted
  // node. Descendant permissions should also be cleaned if your
  // permission model creates overrides on descendants.
  await Permission.deleteMany({
    projectId: req.project._id,
    resourceId: node._id,
  });

  new ApiResponse(
    200,
    null,
    'Deleted'
  ).send(res);

  broadcast(
    req,
    'file_deleted',
    {
      fileId:
        node._id.toString(),
    }
  );
});


// ============================================================
// Update file content
// ============================================================

const updateContent = asyncHandler(async (req, res) => {
  if (
    req.node.type !== 'file'
  ) {
    throw ApiError.badRequest(
      'Only files have content'
    );
  }

  /**
   * A user must have write permission.
   *
   * When file locking is enabled, the user must ALSO hold
   * the active Socket.IO lock for this file.
   *
   * The permission check is expected to happen in the
   * middleware before this controller.
   *
   * Disabling file locking does NOT disable permissions.
   */
  const lockingEnabled =
    fileLockingEnabled(
      req.project
    );

  if (lockingEnabled) {
    await assertHoldsLock(
      req.node._id,
      req.user._id
    );
  }

  req.node.content =
    req.body.content;

  req.node.updatedBy =
    req.user._id;

  await req.node.save();

  new ApiResponse(
    200,
    {
      node: req.node,
    },
    'Saved'
  ).send(res);

  // Notify other clients about the updated content.
  broadcast(
    req,
    'file_updated',
    {
      fileId:
        req.node._id.toString(),

      content:
        req.node.content,

      updatedBy:
        req.user._id.toString(),
    }
  );
});


// ============================================================
// Set permission
// ============================================================

const setPermission = asyncHandler(async (req, res) => {
  const {
    userId,
    read,
    write,
  } = req.body;

  if (
    !mongoose.isValidObjectId(
      userId
    )
  ) {
    throw ApiError.badRequest(
      'Invalid user id'
    );
  }

  const isOwner =
    req.project.ownerId.equals(
      userId
    );

  const targetMembership =
    isOwner
      ? {
          role:
            PROJECT_ROLES.OWNER,
        }
      : await ProjectMember.findOne({
          projectId:
            req.project._id,
          userId,
        });

  if (!targetMembership) {
    throw ApiError.badRequest(
      'User is not a member of this project'
    );
  }

  if (isOwner) {
    throw ApiError.badRequest(
      'The project owner does not need file permissions'
    );
  }

  const permission =
    await Permission.findOneAndUpdate(
      {
        userId,
        resourceId:
          req.node._id,
      },

      {
        projectId:
          req.project._id,

        userId,

        resourceType:
          req.node.type,

        resourceId:
          req.node._id,

        permissions: {
          read,
          write,
        },

        grantedBy:
          req.user._id,
      },

      {
        upsert: true,
        new: true,
      }
    );

  new ApiResponse(
    200,
    {
      permission,
    },
    'Permission updated'
  ).send(res);

  broadcast(
    req,
    'permission_changed',
    {
      resourceId:
        req.node._id.toString(),

      userId,

      permissions: {
        read,
        write,
      },
    }
  );

  /*
   * If access is removed or write permission is removed,
   * release every lock belonging to that user in this project.
   *
   * This is intentionally retained even when collaboration
   * broadcasts are disabled because lock state must not remain
   * active after write access is removed.
   */
  if (
    !read ||
    !write
  ) {
    const released =
      await lockService
        .releaseAllForUserInProjectAndReturn(
          req.project._id,
          userId
        );

    for (
      const lock of released
    ) {
      broadcast(
        req,
        'file:lock_released',
        {
          fileId:
            lock.fileId.toString(),
        }
      );
    }
  }
});


// ============================================================
// List permissions
// ============================================================

const listPermissions = asyncHandler(async (req, res) => {
  const permissions =
    await Permission.find({
      resourceId:
        req.node._id,
    }).populate(
      'userId',
      'username email avatarUrl'
    );

  new ApiResponse(
    200,
    {
      permissions,
    }
  ).send(res);
});


// ============================================================
// List active locks
// ============================================================

/**
 * Returns active, non-expired locks for the entire project.
 *
 * This allows the frontend to display lock badges in the
 * file tree during the initial project load.
 *
 * Subsequent lock changes are delivered through Socket.IO.
 *
 * - file_lock_acquired
 * - file:lock_released
 *
 * If file locking is disabled, an empty array is returned.
 */
const listLocks = asyncHandler(async (req, res) => {
  if (
    !fileLockingEnabled(
      req.project
    )
  ) {
    return new ApiResponse(
      200,
      {
        locks: [],
      }
    ).send(res);
  }

  const locks =
    await lockService
      .getActiveLocksForProject(
        req.project._id
      );

  new ApiResponse(
    200,
    {
      locks: locks.map(
        (lock) => ({
          fileId:
            lock.fileId.toString(),

          userId:
            lock.userId.toString(),

          expiresAt:
            lock.expiresAt,
        })
      ),
    }
  ).send(res);
});


// ============================================================
// Exports
// ============================================================

module.exports = {
  listTree,
  createNode,
  getNode,
  renameNode,
  deleteNode,
  updateContent,
  setPermission,
  listPermissions,
  listLocks,
};