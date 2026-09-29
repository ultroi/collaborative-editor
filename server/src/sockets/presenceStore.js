// Presence is inherently ephemeral and per-process, so plain in-memory Maps
// are the right tool — no need to round-trip it through Mongo. If this
// server is ever horizontally scaled, this store (and Socket.IO's own
// room broadcasting) need a shared adapter (e.g. the Redis Socket.IO
// adapter) instead; noted here since it's the one piece of this phase
// that doesn't survive multiple server instances as-is.

// projectId -> Map<userId, { socketIds: Set<string>, username, avatarUrl, viewingFileId }>
const projectPresence = new Map();

function ensureProject(projectId) {
  if (!projectPresence.has(projectId)) {
    projectPresence.set(projectId, new Map());
  }
  return projectPresence.get(projectId);
}

function addUser(projectId, user, socketId) {
  const members = ensureProject(projectId);
  const existing = members.get(user.id);

  if (existing) {
    existing.socketIds.add(socketId);
  } else {
    members.set(user.id, {
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      socketIds: new Set([socketId]),
      viewingFileId: null,
    });
  }
}

/** Removes one socket for a user (e.g. one of several open tabs closed). Returns true if the user has no sockets left in this project. */
function removeSocket(projectId, userId, socketId) {
  const members = projectPresence.get(projectId);
  if (!members) return true;

  const entry = members.get(userId);
  if (!entry) return true;

  entry.socketIds.delete(socketId);
  if (entry.socketIds.size === 0) {
    members.delete(userId);
    if (members.size === 0) projectPresence.delete(projectId);
    return true;
  }
  return false;
}

function setViewingFile(projectId, userId, fileId) {
  const entry = projectPresence.get(projectId)?.get(userId);
  if (entry) entry.viewingFileId = fileId;
}

function listProjectPresence(projectId) {
  const members = projectPresence.get(projectId);
  if (!members) return [];
  return Array.from(members.values()).map((m) => ({
    userId: m.userId,
    username: m.username,
    avatarUrl: m.avatarUrl,
    viewingFileId: m.viewingFileId,
  }));
}

module.exports = { addUser, removeSocket, setViewingFile, listProjectPresence };