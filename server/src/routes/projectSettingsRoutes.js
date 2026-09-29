const { Router } = require('express');

const {
  getProjectSettings,
  updateProjectSettings,
  resetProjectSettings,
} = require('../controllers/projectSettingsController');

const {
  validateBody,
} = require('../middleware/validate');

const {
  updateProjectSettingsSchema,
} = require('../validators/projectSettingsValidators');

const {
  requireProjectRole,
} = require('../middleware/projectAccess');

const {
  PROJECT_ROLES,
} = require('../../../shared/constants/roles');

const router = Router();

router.get(
  '/',
  requireProjectRole(
    PROJECT_ROLES.VIEWER
  ),
  getProjectSettings
);

router.patch(
  '/',
  requireProjectRole(
    PROJECT_ROLES.ADMIN
  ),
  validateBody(
    updateProjectSettingsSchema
  ),
  updateProjectSettings
);

router.post(
  '/reset',
  requireProjectRole(
    PROJECT_ROLES.OWNER
  ),
  resetProjectSettings
);

module.exports = router;