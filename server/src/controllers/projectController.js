const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');
const lockService = require('../sockets/lockService');

const listProjects = asyncHandler(async (req, res) => {
  const memberships = await ProjectMember.find({
    userId: req.user._id,
  }).select('projectId');

  const memberProjectIds = memberships.map(
    (m) => m.projectId
  );

  const projects = await Project.find({
    status: 'active',
    $or: [
      { ownerId: req.user._id },
      { _id: { $in: memberProjectIds } },
    ],
  }).sort({
    updatedAt: -1,
  });

  new ApiResponse(
    200,
    { projects }
  ).send(res);
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    ownerId: req.user._id,
    memberIds: [req.user._id],
  });

  await ProjectMember.create({
    projectId: project._id,
    userId: req.user._id,
    role: PROJECT_ROLES.OWNER,
  });

  new ApiResponse(
    201,
    { project },
    'Project created'
  ).send(res);
});

// req.project is already loaded + access-checked
// by requireProjectRole.
const getProject = asyncHandler(async (req, res) => {
  new ApiResponse(
    200,
    {
      project: req.project,
      role: req.membership.role,
    }
  ).send(res);
});

const updateProject = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    settings,
  } = req.body;

  /*
   * Keep project updates explicit instead of assigning
   * arbitrary request-body fields to the mongoose document.
   */
  if (name !== undefined) {
    req.project.name = name;
  }

  if (description !== undefined) {
    req.project.description = description;
  }

  if (settings !== undefined) {
    if (
      !settings ||
      typeof settings !== 'object' ||
      Array.isArray(settings)
    ) {
      throw ApiError.badRequest(
        'Settings must be an object'
      );
    }

    const currentSettings =
      req.project.settings
        ? req.project.settings.toObject
          ? req.project.settings.toObject()
          : req.project.settings
        : {};

    /*
     * Visibility
     */
    if (
      settings.visibility !== undefined
    ) {
      if (
        !['private', 'team'].includes(
          settings.visibility
        )
      ) {
        throw ApiError.badRequest(
          'Invalid project visibility'
        );
      }

      currentSettings.visibility =
        settings.visibility;
    }

    /*
     * Collaboration settings
     */
    if (
      settings.collaboration !== undefined
    ) {
      if (
        !settings.collaboration ||
        typeof settings.collaboration !== 'object' ||
        Array.isArray(settings.collaboration)
      ) {
        throw ApiError.badRequest(
          'Collaboration settings must be an object'
        );
      }

      currentSettings.collaboration = {
        ...(currentSettings.collaboration || {}),
      };

      const collaborationKeys = [
        'enabled',
        'presenceEnabled',
        'fileLockingEnabled',
        'teamChatEnabled',
      ];

      for (
        const key of collaborationKeys
      ) {
        if (
          settings.collaboration[key] !==
          undefined
        ) {
          if (
            typeof settings.collaboration[key] !==
            'boolean'
          ) {
            throw ApiError.badRequest(
              `${key} must be a boolean`
            );
          }

          currentSettings.collaboration[key] =
            settings.collaboration[key];
        }
      }
    }

    /*
     * Editor settings
     */
    if (
      settings.editor !== undefined
    ) {
      if (
        !settings.editor ||
        typeof settings.editor !== 'object' ||
        Array.isArray(settings.editor)
      ) {
        throw ApiError.badRequest(
          'Editor settings must be an object'
        );
      }

      currentSettings.editor = {
        ...(currentSettings.editor || {}),
      };

      const editorKeys = [
        'autoSave',
        'minimap',
        'wordWrap',
        'formatOnSave',
      ];

      for (
        const key of editorKeys
      ) {
        if (
          settings.editor[key] !==
          undefined
        ) {
          if (
            typeof settings.editor[key] !==
            'boolean'
          ) {
            throw ApiError.badRequest(
              `${key} must be a boolean`
            );
          }

          currentSettings.editor[key] =
            settings.editor[key];
        }
      }
    }

    /*
     * File settings
     */
    if (
      settings.files !== undefined
    ) {
      if (
        !settings.files ||
        typeof settings.files !== 'object' ||
        Array.isArray(settings.files)
      ) {
        throw ApiError.badRequest(
          'File settings must be an object'
        );
      }

      currentSettings.files = {
        ...(currentSettings.files || {}),
      };

      const fileKeys = [
        'confirmDelete',
        'showHiddenFiles',
      ];

      for (
        const key of fileKeys
      ) {
        if (
          settings.files[key] !==
          undefined
        ) {
          if (
            typeof settings.files[key] !==
            'boolean'
          ) {
            throw ApiError.badRequest(
              `${key} must be a boolean`
            );
          }

          currentSettings.files[key] =
            settings.files[key];
        }
      }
    }

    /*
     * Notification settings
     */
    if (
      settings.notifications !== undefined
    ) {
      if (
        !settings.notifications ||
        typeof settings.notifications !== 'object' ||
        Array.isArray(settings.notifications)
      ) {
        throw ApiError.badRequest(
          'Notification settings must be an object'
        );
      }

      currentSettings.notifications = {
        ...(currentSettings.notifications || {}),
      };

      const notificationKeys = [
        'memberJoin',
        'fileLock',
        'chat',
      ];

      for (
        const key of notificationKeys
      ) {
        if (
          settings.notifications[key] !==
          undefined
        ) {
          if (
            typeof settings.notifications[key] !==
            'boolean'
          ) {
            throw ApiError.badRequest(
              `${key} must be a boolean`
            );
          }

          currentSettings.notifications[key] =
            settings.notifications[key];
        }
      }
    }

    req.project.settings =
      currentSettings;
  }

  await req.project.save();

  new ApiResponse(
    200,
    {
      project: req.project,
    },
    'Project updated'
  ).send(res);
});

const deleteProject = asyncHandler(async (req, res) => {
  // Soft delete: archive rather than destroy, so file history/audit trail
  // (added in a later phase) survives.
  req.project.status = 'archived';

  await req.project.save();

  new ApiResponse(
    200,
    null,
    'Project archived'
  ).send(res);
});

const listMembers = asyncHandler(async (req, res) => {
  const members =
    await ProjectMember.find({
      projectId: req.project._id,
    })
      .populate(
        'userId',
        'username email avatarUrl'
      )
      .sort({
        createdAt: 1,
      });

  new ApiResponse(
    200,
    { members }
  ).send(res);
});

const addMember = asyncHandler(async (req, res) => {
  const {
    userId,
    role,
  } = req.body;

  if (
    !mongoose.isValidObjectId(userId)
  ) {
    throw ApiError.badRequest(
      'Invalid user id'
    );
  }

  if (
    role === PROJECT_ROLES.OWNER
  ) {
    throw ApiError.badRequest(
      'Ownership cannot be assigned directly'
    );
  }

  if (
    role === PROJECT_ROLES.ADMIN &&
    req.membership.role !==
      PROJECT_ROLES.OWNER
  ) {
    throw ApiError.forbidden(
      'Only the project owner can assign the admin role'
    );
  }

  const existing =
    await ProjectMember.findOne({
      projectId: req.project._id,
      userId,
    });

  if (existing) {
    throw ApiError.conflict(
      'User is already a member of this project'
    );
  }

  const membership =
    await ProjectMember.create({
      projectId: req.project._id,
      userId,
      role:
        role ||
        PROJECT_ROLES.EDITOR,
      invitedBy: req.user._id,
    });

  await Project.findByIdAndUpdate(
    req.project._id,
    {
      $addToSet: {
        memberIds: userId,
      },
    }
  );

  new ApiResponse(
    201,
    { membership },
    'Member added'
  ).send(res);
});

const updateMemberRole =
  asyncHandler(async (req, res) => {
    const {
      userId,
    } = req.params;

    const {
      role,
    } = req.body;

    if (
      !mongoose.isValidObjectId(userId)
    ) {
      throw ApiError.badRequest(
        'Invalid user id'
      );
    }

    if (
      req.project.ownerId.equals(userId)
    ) {
      throw ApiError.badRequest(
        "The project owner's role cannot be changed"
      );
    }

    if (
      role === PROJECT_ROLES.OWNER
    ) {
      throw ApiError.badRequest(
        'Ownership cannot be assigned directly'
      );
    }

    if (
      role === PROJECT_ROLES.ADMIN &&
      req.membership.role !==
        PROJECT_ROLES.OWNER
    ) {
      throw ApiError.forbidden(
        'Only the project owner can assign the admin role'
      );
    }

    const membership =
      await ProjectMember.findOneAndUpdate(
        {
          projectId:
            req.project._id,
          userId,
        },
        {
          role,
        },
        {
          new: true,
        }
      );

    if (!membership) {
      throw ApiError.notFound(
        'Membership not found'
      );
    }

    // A viewer cannot retain an existing write lock after losing write access.
    if (
      role === PROJECT_ROLES.VIEWER
    ) {
      const released =
        await lockService
          .releaseAllForUserInProjectAndReturn(
            req.project._id,
            userId
          );

      const io =
        req.app.get('io');

      if (io) {
        const {
          roomName,
        } = require('../sockets');

        for (
          const lock of released
        ) {
          io
            .to(
              roomName(
                req.project._id.toString()
              )
            )
            .emit(
              'file:lock_released',
              {
                fileId:
                  lock.fileId.toString(),
              }
            );
        }
      }
    }

    new ApiResponse(
      200,
      { membership },
      'Role updated'
    ).send(res);
  });

const removeMember =
  asyncHandler(async (req, res) => {
    const {
      userId,
    } = req.params;

    if (
      !mongoose.isValidObjectId(userId)
    ) {
      throw ApiError.badRequest(
        'Invalid user id'
      );
    }

    if (
      req.project.ownerId.equals(userId)
    ) {
      throw ApiError.badRequest(
        'The project owner cannot be removed'
      );
    }

    const membership =
      await ProjectMember.findOneAndDelete({
        projectId:
          req.project._id,
        userId,
      });

    if (!membership) {
      throw ApiError.notFound(
        'Membership not found'
      );
    }

    await Project.findByIdAndUpdate(
      req.project._id,
      {
        $pull: {
          memberIds: userId,
        },
      }
    );

    const released =
      await lockService
        .releaseAllForUserInProjectAndReturn(
          req.project._id,
          userId
        );

    const io =
      req.app.get('io');

    if (io) {
      const {
        roomName,
      } = require('../sockets');

      for (
        const lock of released
      ) {
        io
          .to(
            roomName(
              req.project._id.toString()
            )
          )
          .emit(
            'file:lock_released',
            {
              fileId:
                lock.fileId.toString(),
            }
          );
      }
    }

    new ApiResponse(
      200,
      null,
      'Member removed'
    ).send(res);
  });

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
};