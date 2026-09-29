const { z } = require('zod');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const assignableRoles = [
  PROJECT_ROLES.ADMIN,
  PROJECT_ROLES.EDITOR,
  PROJECT_ROLES.VIEWER,
  PROJECT_ROLES.MEMBER, // legacy compatibility
];

const addMemberSchema = z.object({
  userId: objectId,
  role: z.enum(assignableRoles).default(PROJECT_ROLES.EDITOR),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(assignableRoles),
});

module.exports = {
  addMemberSchema,
  updateMemberRoleSchema,
};
