const { Router } = require('express');

const {
  listTree,
  createNode,
  getNode,
  renameNode,
  deleteNode,
  updateContent,
  setPermission,
  listPermissions,
  listLocks,
} = require('../controllers/fileController');

const { validateBody } = require('../middleware/validate');

const {
  createNodeSchema,
  renameNodeSchema,
  updateContentSchema,
  setPermissionSchema,
} = require('../validators/fileValidators');

const { requireProjectRole } = require('../middleware/projectAccess');

const {
  loadFileNode,
  requireFileAccess,
} = require('../middleware/fileAccess');

const { PROJECT_ROLES } = require('../../../shared/constants/roles');


// Mounted at:
// /api/projects/:projectId/files
//
// projectId is already validated and access-checked
// by the parent router before these routes run.
const router = Router({
  mergeParams: true,
});


// ============================================================
// Project-level access
// ============================================================
//
// Minimum role required for every file operation.
//
// OWNER / ADMIN / MEMBER can access the router.
// Individual node permissions are checked separately below.
//
router.use(
  requireProjectRole(PROJECT_ROLES.VIEWER)
);


// ============================================================
// Project file tree
// ============================================================

router.get(
  '/',
  listTree
);

router.post(
  '/',
  validateBody(createNodeSchema),
  createNode
);


// ============================================================
// Active file locks
// ============================================================
//
// IMPORTANT:
// This must come BEFORE /:fileId.
//
// Otherwise:
//
// GET /locks
//
// could be interpreted as:
//
// GET /:fileId
//
// with fileId = "locks".
//
router.get(
  '/locks',
  listLocks
);


// ============================================================
// Single file / folder
// ============================================================

router.get(
  '/:fileId',
  loadFileNode,
  requireFileAccess('read'),
  getNode
);


// ============================================================
// File content
// ============================================================
//
// The controller returns the node including its content.
//
router.get(
  '/:fileId/content',
  loadFileNode,
  requireFileAccess('read'),
  getNode
);

router.patch(
  '/:fileId/content',
  loadFileNode,
  requireFileAccess('write'),
  validateBody(updateContentSchema),
  updateContent
);


// ============================================================
// Rename
// ============================================================

router.patch(
  '/:fileId',
  loadFileNode,
  requireFileAccess('write'),
  validateBody(renameNodeSchema),
  renameNode
);


// ============================================================
// Delete
// ============================================================

router.delete(
  '/:fileId',
  loadFileNode,
  requireFileAccess('write'),
  deleteNode
);


// ============================================================
// Permission management
// ============================================================
//
// Permission management is restricted to ADMIN / OWNER,
// regardless of the caller's own permission on the node.
//
// Therefore requireProjectRole(ADMIN) comes before
// loadFileNode.
//
// ============================================================

router.get(
  '/:fileId/permissions',
  requireProjectRole(PROJECT_ROLES.ADMIN),
  loadFileNode,
  listPermissions
);

router.put(
  '/:fileId/permissions',
  requireProjectRole(PROJECT_ROLES.ADMIN),
  loadFileNode,
  validateBody(setPermissionSchema),
  setPermission
);


// ============================================================
// Export
// ============================================================

module.exports = router;