const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

/**
 * Socket.IO connection-level auth. Mirrors middleware/auth.js's REST
 * behavior but as a Socket.IO middleware: the client sends its access
 * token in the handshake (`auth: { token }`), never as a URL/query param
 * (keeps it out of server access logs).
 */
async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('unauthorized'));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new Error('unauthorized'));
    }

    socket.user = { id: user._id.toString(), username: user.username, avatarUrl: user.avatarUrl };
    next();
  } catch (err) {
    next(new Error('unauthorized'));
  }
}

module.exports = { socketAuth };