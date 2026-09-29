const mongoose = require('mongoose');
const File = require('../models/File');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { resolveFileAccess } = require('../utils/permissionResolver');

/**
 * Loads req.params.fileId, scoped to req.project (set by an earlier
 * requireProjectRole call), and attaches it as req.node. Does NOT check
 * permissions by itself — pair with requireFileAccess('read'|'write').
 */
const loadFileNode = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;

  if (!mongoose.isValidObjectId(fileId)) {
    throw ApiError.badRequest('Invalid file id');
  }

  const node = await File.findOne({ _id: fileId, projectId: req.project._id });
  if (!node) {
    throw ApiError.notFound('File or folder not found');
  }

  req.node = node;
  next();
});

/**
 * Requires req.node (see loadFileNode) to be readable/writable by req.user,
 * per the resolved effective permission (role default + any explicit
 * override on the node or an ancestor). The backend is authoritative here
 * — a client can never claim more access than this resolves.
 */
function requireFileAccess(action) {
  return asyncHandler(async (req, res, next) => {
    const access = await resolveFileAccess({
      file: req.node,
      membership: req.membership,
      userId: req.user._id,
    });

    if (!access[action]) {
      throw ApiError.forbidden(
        action === 'write'
          ? 'You do not have write access to this file'
          : 'You do not have access to this file'
      );
    }

    req.fileAccess = access;
    next();
  });
}

module.exports = { loadFileNode, requireFileAccess };
