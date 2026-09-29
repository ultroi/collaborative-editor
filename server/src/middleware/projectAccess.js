const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');

// Higher number = higher project authority.
// Legacy "member" is treated as Editor for compatibility.
const ROLE_RANK = Object.freeze({
  [PROJECT_ROLES.VIEWER]: 1,
  [PROJECT_ROLES.MEMBER]: 2,
  [PROJECT_ROLES.EDITOR]: 2,
  [PROJECT_ROLES.ADMIN]: 3,
  [PROJECT_ROLES.OWNER]: 4,
});

function requireProjectRole(minRole = PROJECT_ROLES.VIEWER) {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      throw ApiError.badRequest('Invalid project id');
    }

    const project = await Project.findOne({
      _id: projectId,
      status: { $ne: 'archived' },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const isOwner = project.ownerId.equals(req.user._id);
    const membership = isOwner
      ? { role: PROJECT_ROLES.OWNER }
      : await ProjectMember.findOne({
          projectId,
          userId: req.user._id,
        });

    if (!membership) {
      // 404 prevents leaking the existence of a private project.
      throw ApiError.notFound('Project not found');
    }

    const actualRank = ROLE_RANK[membership.role];
    const requiredRank = ROLE_RANK[minRole];

    if (!actualRank || !requiredRank || actualRank < requiredRank) {
      throw ApiError.forbidden('You do not have permission to do that');
    }

    req.project = project;
    req.membership = membership;
    next();
  });
}

module.exports = { requireProjectRole, ROLE_RANK };
