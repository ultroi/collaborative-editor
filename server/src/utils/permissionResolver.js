const File = require('../models/File');
const Permission = require('../models/Permission');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');

const ROLE_DEFAULTS = Object.freeze({
  [PROJECT_ROLES.OWNER]: { read: true, write: true },
  [PROJECT_ROLES.ADMIN]: { read: true, write: true },
  [PROJECT_ROLES.EDITOR]: { read: true, write: true },
  [PROJECT_ROLES.VIEWER]: { read: true, write: false },

  // Existing "member" records remain valid and behave like Editor.
  [PROJECT_ROLES.MEMBER]: { read: true, write: true },
});

async function getAncestorChain(file) {
  const chain = [file];
  let current = file;

  while (current.parentId) {
    // eslint-disable-next-line no-await-in-loop
    current = await File.findById(current.parentId);
    if (!current) break;
    chain.push(current);
  }

  return chain;
}

/**
 * Effective access precedence:
 * 1. Owner is unrestricted.
 * 2. Closest explicit Permission override wins.
 * 3. Otherwise the project role default is used.
 */
async function resolveFileAccess({ file, membership, userId }) {
  if (membership.role === PROJECT_ROLES.OWNER) {
    return { read: true, write: true };
  }

  const chain = await getAncestorChain(file);
  const resourceIds = chain.map((node) => node._id);

  const overrides = await Permission.find({
    userId,
    resourceId: { $in: resourceIds },
  }).lean();

  if (overrides.length > 0) {
    const overrideByResourceId = new Map(
      overrides.map((override) => [override.resourceId.toString(), override])
    );

    for (const node of chain) {
      const match = overrideByResourceId.get(node._id.toString());
      if (match) {
        return {
          read: Boolean(match.permissions.read),
          write: Boolean(match.permissions.write),
        };
      }
    }
  }

  return ROLE_DEFAULTS[membership.role] || { read: false, write: false };
}

module.exports = {
  ROLE_DEFAULTS,
  resolveFileAccess,
  getAncestorChain,
};
