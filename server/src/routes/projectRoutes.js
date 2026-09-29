const { Router } = require('express');

const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
} = require('../controllers/projectController');

const {
  validateBody,
} = require('../middleware/validate');

const {
  createProjectSchema,
  updateProjectSchema,
} = require('../validators/projectValidators');

const {
  addMemberSchema,
  updateMemberRoleSchema,
} = require('../validators/memberValidators');

const {
  requireProjectRole,
} = require('../middleware/projectAccess');

const {
  PROJECT_ROLES,
} = require('../../../shared/constants/roles');

const fileRoutes = require('./fileRoutes');

const messageRoutes = require('./messageRoutes');

const projectSettingsRoutes = require('./projectSettingsRoutes');

const router = Router();

router.get(
  '/',
  listProjects
);

router.post(
  '/',
  validateBody(createProjectSchema),
  createProject
);

router.get(
  '/:projectId',
  requireProjectRole(
    PROJECT_ROLES.VIEWER
  ),
  getProject
);

router.patch(
  '/:projectId',
  requireProjectRole(
    PROJECT_ROLES.ADMIN
  ),
  validateBody(
    updateProjectSchema
  ),
  updateProject
);

router.delete(
  '/:projectId',
  requireProjectRole(
    PROJECT_ROLES.OWNER
  ),
  deleteProject
);

/*
 * ============================================================
 * PROJECT SETTINGS
 * ============================================================
 *
 * GET:
 *   /api/projects/:projectId/settings
 *
 * PATCH:
 *   /api/projects/:projectId/settings
 *
 * RESET:
 *   /api/projects/:projectId/settings/reset
 */

router.use(
  '/:projectId/settings',
  projectSettingsRoutes
);

/*
 * ============================================================
 * MEMBERS
 * ============================================================
 */

router.get(
  '/:projectId/members',
  requireProjectRole(
    PROJECT_ROLES.VIEWER
  ),
  listMembers
);

router.post(
  '/:projectId/members',
  requireProjectRole(
    PROJECT_ROLES.ADMIN
  ),
  validateBody(
    addMemberSchema
  ),
  addMember
);

router.patch(
  '/:projectId/members/:userId',
  requireProjectRole(
    PROJECT_ROLES.ADMIN
  ),
  validateBody(
    updateMemberRoleSchema
  ),
  updateMemberRole
);

router.delete(
  '/:projectId/members/:userId',
  requireProjectRole(
    PROJECT_ROLES.ADMIN
  ),
  removeMember
);

/*
 * ============================================================
 * FILES
 * ============================================================
 */

router.use(
  '/:projectId/files',
  fileRoutes
);

/*
 * ============================================================
 * TEAM CHAT
 * ============================================================
 */

router.use(
  '/:projectId/messages',
  messageRoutes
);

module.exports = router;