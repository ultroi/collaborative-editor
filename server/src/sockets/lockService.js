const FileLock = require('../models/FileLock');
const { ApiError } = require('../utils/ApiError');

const HEARTBEAT_INTERVAL_MS = 20_000;
const LOCK_TTL_MS = 45_000;

function newExpiry() {
  return new Date(Date.now() + LOCK_TTL_MS);
}

function isExpired(lock) {
  return !lock || lock.expiresAt.getTime() < Date.now();
}

async function acquireLock({ fileId, projectId, userId, socketId }) {
  const existing = await FileLock.findOne({ fileId });

  if (existing && !isExpired(existing)) {
    if (existing.userId.equals(userId)) {
      existing.socketId = socketId;
      existing.expiresAt = newExpiry();
      await existing.save();
      return { granted: true, lock: existing };
    }

    return { granted: false, lock: existing };
  }

  // Delete stale locks first. The unique fileId index then guarantees that
  // only one active lock can exist for a file.
  if (existing) {
    await FileLock.deleteOne({ _id: existing._id });
  }

  try {
    const lock = await FileLock.create({
      fileId,
      projectId,
      userId,
      socketId,
      acquiredAt: new Date(),
      expiresAt: newExpiry(),
    });

    return { granted: true, lock };
  } catch (error) {
    // Another request may have won the race after the stale lock was deleted.
    if (error?.code === 11000) {
      const winner = await FileLock.findOne({ fileId });
      return { granted: false, lock: winner };
    }
    throw error;
  }
}

async function renewLock({ fileId, userId }) {
  return FileLock.findOneAndUpdate(
    {
      fileId,
      userId,
      expiresAt: { $gt: new Date() },
    },
    { expiresAt: newExpiry() },
    { new: true }
  );
}

async function releaseLock({ fileId, userId }) {
  return FileLock.findOneAndDelete({ fileId, userId });
}

async function releaseAllForSocketAndReturn(socketId) {
  const locks = await FileLock.find({ socketId });

  if (locks.length > 0) {
    await FileLock.deleteMany({ socketId });
  }

  return locks;
}

async function releaseAllForUserInProjectAndReturn(projectId, userId) {
  const locks = await FileLock.find({ projectId, userId });

  if (locks.length > 0) {
    await FileLock.deleteMany({ projectId, userId });
  }

  return locks;
}

async function getActiveLock(fileId) {
  const lock = await FileLock.findOne({
    fileId,
    expiresAt: { $gt: new Date() },
  });

  return lock;
}

async function getActiveLocksForProject(projectId) {
  return FileLock.find({
    projectId,
    expiresAt: { $gt: new Date() },
  });
}

async function assertHoldsLock(fileId, userId) {
  const lock = await FileLock.findOne({
    fileId,
    expiresAt: { $gt: new Date() },
  });

  if (!lock) {
    throw ApiError.conflict(
      'You do not currently hold the edit lock for this file.'
    );
  }

  if (!lock.userId.equals(userId)) {
    throw ApiError.conflict(
      'This file is currently locked by another user.'
    );
  }
}

module.exports = {
  HEARTBEAT_INTERVAL_MS,
  LOCK_TTL_MS,
  acquireLock,
  renewLock,
  releaseLock,
  releaseAllForSocketAndReturn,
  releaseAllForUserInProjectAndReturn,
  getActiveLock,
  getActiveLocksForProject,
  assertHoldsLock,
};
