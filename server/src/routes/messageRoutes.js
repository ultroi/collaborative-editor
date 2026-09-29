const { Router } = require('express');
const { listMessages } = require('../controllers/messageController');
const { requireProjectRole } = require('../middleware/projectAccess');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');

const router = Router({ mergeParams: true });

router.get('/', requireProjectRole(PROJECT_ROLES.MEMBER), listMessages);

module.exports = router;