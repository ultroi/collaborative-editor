const { verifyAccessToken } = require('../utils/tokens');
const { ApiError } = require('../utils/ApiError');
const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * Requires a valid Bearer access token. Never trusts a userId supplied by
 * the client body/query for identity — req.user is always derived from the
 * verified token.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User for this token no longer exists');
  }

  req.user = user;
  next();
});

module.exports = { requireAuth };
