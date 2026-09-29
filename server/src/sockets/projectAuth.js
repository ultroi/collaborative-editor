const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');

/**
 * Returns { project, membership } if the user has access to the project,
 * or null. Same rule as requireProjectRole: owner counts as a member with
 * an implicit OWNER role, everyone else needs a ProjectMember row.
 */
async function resolveProjectMembership(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, status: { $ne: 'archived' } });
  if (!project) return null;

  if (project.ownerId.equals(userId)) {
    return { project, membership: { role: PROJECT_ROLES.OWNER } };
  }

  const membership = await ProjectMember.findOne({ projectId, userId });
  if (!membership) return null;

  return { project, membership };
}

module.exports = { resolveProjectMembership };