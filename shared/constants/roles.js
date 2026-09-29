// Shared across client and server so role names never drift out of sync.

const PROJECT_ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',

  // Backwards compatibility for existing projects/members created before
  // Editor/Viewer were introduced. Treat legacy "member" as Editor.
  MEMBER: 'member',
});

const ROLE_CAPABILITIES = Object.freeze({
  [PROJECT_ROLES.OWNER]: {
    manageMembers: true,
    managePermissions: true,
    manageProjectSettings: true,
    deleteProject: true,
  },
  [PROJECT_ROLES.ADMIN]: {
    manageMembers: true,
    managePermissions: true,
    manageProjectSettings: false,
    deleteProject: false,
  },
  [PROJECT_ROLES.EDITOR]: {
    manageMembers: false,
    managePermissions: false,
    manageProjectSettings: false,
    deleteProject: false,
  },
  [PROJECT_ROLES.VIEWER]: {
    manageMembers: false,
    managePermissions: false,
    manageProjectSettings: false,
    deleteProject: false,
  },
  [PROJECT_ROLES.MEMBER]: {
    manageMembers: false,
    managePermissions: false,
    manageProjectSettings: false,
    deleteProject: false,
  },
});

module.exports = { PROJECT_ROLES, ROLE_CAPABILITIES };
