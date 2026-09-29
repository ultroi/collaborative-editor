const { ApiError } = require('./ApiError');

const RESERVED_NAMES = new Set(['.', '..']);

/**
 * Validates a single path segment (a file or folder name, not a full path).
 * This is the last line of defense against path traversal — called before
 * every create/rename, independent of the Mongoose schema validator.
 */
function assertSafeName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw ApiError.badRequest('Name is required');
  }
  if (name.length > 255) {
    throw ApiError.badRequest('Name is too long');
  }
  if (name.includes('/') || name.includes('\\')) {
    throw ApiError.badRequest('Name cannot contain path separators');
  }
  if (RESERVED_NAMES.has(name)) {
    throw ApiError.badRequest('Name cannot be "." or ".."');
  }
  // Strip control characters and null bytes.
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(name)) {
    throw ApiError.badRequest('Name contains invalid characters');
  }
}

function buildPath(parentPath, name) {
  return parentPath ? `${parentPath}/${name}` : name;
}

module.exports = { assertSafeName, buildPath };
