const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const {
  register,
  login,

  googleStart,
  googleCallback,

  githubStart,
  githubCallback,

  refresh,
  logout,
  me,
} = require('../controllers/authController');

const {
  validateBody,
} = require('../middleware/validate');

const {
  registerSchema,
  loginSchema,
} = require('../validators/authValidators');

const {
  requireAuth,
} = require('../middleware/auth');

const {
  githubConnectionStatus,
  listGithubRepositories,
  importGithubRepository,
} = require('../controllers/githubController');

const router = Router();

const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 20,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      success: false,
      message:
        'Too many attempts. Try again later.',
    },
  });


/* Manual authentication */

router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  register
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  login
);


/* Google */

router.get(
  '/google',
  googleStart
);

router.get(
  '/google/callback',
  googleCallback
);


/* GitHub */

router.get(
  '/github',
  githubStart
);

router.get(
  '/github/callback',
  githubCallback
);

router.get(
  '/github/status',
  requireAuth,
  githubConnectionStatus
);

router.get(
  '/github/repositories',
  requireAuth,
  listGithubRepositories
);

router.post(
  '/github/import',
  requireAuth,
  importGithubRepository
);


/* Session */

router.post(
  '/refresh',
  refresh
);

router.post(
  '/logout',
  logout
);

router.get(
  '/me',
  requireAuth,
  me
);

module.exports = router;