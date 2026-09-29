const { Server } = require('socket.io');

const { socketAuth } = require('./socketAuth');
const {
  resolveProjectMembership,
} = require('./projectAuth');

const {
  resolveFileAccess,
} = require('../utils/permissionResolver');

const File = require('../models/File');
const Project = require('../models/Project');
const Message = require('../models/Message');

const presence = require('./presenceStore');
const lockService = require('./lockService');

const env = require('../config/env');

const roomName = (projectId) =>
  `project:${projectId}`;

function collaborationSettings(project) {
  const settings =
    project?.settings?.collaboration || {};

  return {
    enabled:
      settings.enabled !== false,

    presenceEnabled:
      settings.presenceEnabled !== false,

    fileLockingEnabled:
      settings.fileLockingEnabled !== false,

    teamChatEnabled:
      settings.teamChatEnabled !== false,
  };
}

async function getProject(projectId) {
  return Project.findOne({
    _id: projectId,
    status: 'active',
  });
}

function canUseRealtime(project) {
  return collaborationSettings(project).enabled;
}

function canUsePresence(project) {
  const settings =
    collaborationSettings(project);

  return (
    settings.enabled &&
    settings.presenceEnabled
  );
}

function canUseLocks(project) {
  const settings =
    collaborationSettings(project);

  return (
    settings.enabled &&
    settings.fileLockingEnabled
  );
}

function canUseChat(project) {
  const settings =
    collaborationSettings(project);

  return (
    settings.enabled &&
    settings.teamChatEnabled
  );
}

async function leaveProject(
  io,
  socket,
  projectId,
  { alreadyDisconnecting = false } = {}
) {
  const project =
    await getProject(projectId);

  if (
    project &&
    canUsePresence(project)
  ) {
    const stillOnline =
      !presence.removeSocket(
        projectId,
        socket.user.id,
        socket.id
      );

    io
      .to(roomName(projectId))
      .emit(
        'presence:update',
        presence.listProjectPresence(
          projectId
        )
      );

    if (!stillOnline) {
      io
        .to(roomName(projectId))
        .emit(
          'user_left_project',
          {
            userId:
              socket.user.id,
          }
        );
    }
  }

  socket.data.projects.delete(
    projectId
  );

  if (!alreadyDisconnecting) {
    socket.leave(
      roomName(projectId)
    );
  }
}

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    socket.data.projects =
      new Set();

    socket.on(
      'project:join',
      async (
        projectId,
        ack
      ) => {
        try {
          const access =
            await resolveProjectMembership(
              projectId,
              socket.user.id
            );

          if (!access) {
            return ack?.({
              ok: false,
              error:
                'You do not have access to this project',
            });
          }

          const project =
            await getProject(
              projectId
            );

          if (!project) {
            return ack?.({
              ok: false,
              error:
                'Project not found',
            });
          }

          socket.join(
            roomName(projectId)
          );

          socket.data.projects.add(
            projectId
          );

          const presenceEnabled =
            canUsePresence(project);

          if (presenceEnabled) {
            presence.addUser(
              projectId,
              socket.user,
              socket.id
            );

            io
              .to(
                roomName(projectId)
              )
              .emit(
                'user_joined_project',
                {
                  userId:
                    socket.user.id,

                  username:
                    socket.user.username,
                }
              );
          }

          ack?.({
            ok: true,

            presence:
              presenceEnabled
                ? presence.listProjectPresence(
                    projectId
                  )
                : [],
          });
        } catch (err) {
          ack?.({
            ok: false,
            error:
              'Failed to join project',
          });
        }
      }
    );

    socket.on(
      'project:leave',
      async (projectId) => {
        await leaveProject(
          io,
          socket,
          projectId
        );
      }
    );

    socket.on(
      'file:open',
      async (
        projectId,
        fileId,
        ack
      ) => {
        try {
          const access =
            await resolveProjectMembership(
              projectId,
              socket.user.id
            );

          if (!access) {
            return ack?.({
              ok: false,
              error:
                'No project access',
            });
          }

          const project =
            await getProject(
              projectId
            );

          if (!project) {
            return ack?.({
              ok: false,
              error:
                'Project not found',
            });
          }

          const file =
            await File.findOne({
              _id: fileId,
              projectId,
            });

          if (!file) {
            return ack?.({
              ok: false,
              error:
                'File not found',
            });
          }

          const fileAccess =
            await resolveFileAccess({
              file,

              membership:
                access.membership,

              userId:
                socket.user.id,
            });

          if (!fileAccess.read) {
            return ack?.({
              ok: false,
              error:
                'No access to this file',
            });
          }

          const presenceEnabled =
            canUsePresence(project);

          if (presenceEnabled) {
            presence.setViewingFile(
              projectId,
              socket.user.id,
              fileId
            );

            io
              .to(
                roomName(projectId)
              )
              .emit(
                'presence:update',
                presence.listProjectPresence(
                  projectId
                )
              );
          }

          const lockingEnabled =
            canUseLocks(project);

          const activeLock =
            lockingEnabled
              ? await lockService.getActiveLock(
                  fileId
                )
              : null;

          ack?.({
            ok: true,

            access:
              fileAccess,

            lock:
              activeLock
                ? {
                    userId:
                      activeLock.userId.toString(),

                    expiresAt:
                      activeLock.expiresAt,
                  }
                : null,
          });
        } catch (err) {
          ack?.({
            ok: false,
            error:
              'Failed to open file',
          });
        }
      }
    );

    socket.on(
      'file:close',
      async (
        projectId,
        fileId
      ) => {
        const project =
          await getProject(
            projectId
          );

        if (
          project &&
          canUsePresence(project)
        ) {
          presence.setViewingFile(
            projectId,
            socket.user.id,
            null
          );

          io
            .to(
              roomName(projectId)
            )
            .emit(
              'presence:update',
              presence.listProjectPresence(
                projectId
              )
            );
        }

        if (
          project &&
          canUseLocks(project)
        ) {
          const released =
            await lockService.releaseLock({
              fileId,

              userId:
                socket.user.id,
            });

          if (released) {
            io
              .to(
                roomName(projectId)
              )
              .emit(
                'file:lock_released',
                {
                  fileId,
                }
              );
          }
        }
      }
    );

    socket.on(
      'file:lock:acquire',
      async (
        projectId,
        fileId,
        ack
      ) => {
        try {
          const access =
            await resolveProjectMembership(
              projectId,
              socket.user.id
            );

          if (!access) {
            return ack?.({
              granted: false,
              error:
                'No project access',
            });
          }

          const project =
            await getProject(
              projectId
            );

          if (!project) {
            return ack?.({
              granted: false,
              error:
                'Project not found',
            });
          }

          const file =
            await File.findOne({
              _id: fileId,
              projectId,
            });

          if (
            !file ||
            file.type !== 'file'
          ) {
            return ack?.({
              granted: false,
              error:
                'File not found',
            });
          }

          const fileAccess =
            await resolveFileAccess({
              file,

              membership:
                access.membership,

              userId:
                socket.user.id,
            });

          if (!fileAccess.write) {
            return ack?.({
              granted: false,
              error:
                'You do not have write access to this file',
            });
          }

          /*
           * File locking disabled:
           * write permission alone is enough.
           */
          if (!canUseLocks(project)) {
            return ack?.({
              granted: true,
              expiresAt: null,
              lockingDisabled: true,
            });
          }

          const result =
            await lockService.acquireLock({
              fileId,

              projectId,

              userId:
                socket.user.id,

              socketId:
                socket.id,
            });

          if (result.granted) {
            io
              .to(
                roomName(projectId)
              )
              .emit(
                'file_lock_acquired',
                {
                  fileId,

                  userId:
                    socket.user.id,

                  username:
                    socket.user.username,

                  expiresAt:
                    result.lock.expiresAt,
                }
              );

            return ack?.({
              granted: true,

              expiresAt:
                result.lock.expiresAt,
            });
          }

          return ack?.({
            granted: false,

            heldBy: {
              userId:
                result.lock.userId.toString(),
            },
          });
        } catch (err) {
          ack?.({
            granted: false,
            error:
              'Failed to acquire lock',
          });
        }
      }
    );

    socket.on(
      'file:lock:heartbeat',
      async (
        fileId,
        ack
      ) => {
        const lock =
          await lockService.renewLock({
            fileId,

            userId:
              socket.user.id,
          });

        ack?.(
          lock
            ? {
                renewed: true,

                expiresAt:
                  lock.expiresAt,
              }
            : {
                renewed: false,
              }
        );
      }
    );

    socket.on(
      'file:lock:release',
      async (
        projectId,
        fileId
      ) => {
        const project =
          await getProject(
            projectId
          );

        if (
          !project ||
          !canUseLocks(project)
        ) {
          return;
        }

        const released =
          await lockService.releaseLock({
            fileId,

            userId:
              socket.user.id,
          });

        if (released) {
          io
            .to(
              roomName(projectId)
            )
            .emit(
              'file:lock_released',
              {
                fileId,
              }
            );
        }
      }
    );

    socket.on(
      'chat:send',
      async (
        projectId,
        content,
        ack
      ) => {
        try {
          const trimmed =
            typeof content === 'string'
              ? content.trim()
              : '';

          if (!trimmed) {
            return ack?.({
              ok: false,
              error:
                'Message cannot be empty',
            });
          }

          if (
            trimmed.length > 4000
          ) {
            return ack?.({
              ok: false,
              error:
                'Message is too long',
            });
          }

          const access =
            await resolveProjectMembership(
              projectId,
              socket.user.id
            );

          if (!access) {
            return ack?.({
              ok: false,
              error:
                'No project access',
            });
          }

          const project =
            await getProject(
              projectId
            );

          if (!project) {
            return ack?.({
              ok: false,
              error:
                'Project not found',
            });
          }

          if (!canUseChat(project)) {
            return ack?.({
              ok: false,
              error:
                'Team chat is disabled for this project',
            });
          }

          const message =
            await Message.create({
              projectId,

              userId:
                socket.user.id,

              content:
                trimmed,
            });

          const payload = {
            _id:
              message._id.toString(),

            content:
              message.content,

            createdAt:
              message.createdAt,

            user: {
              id:
                socket.user.id,

              username:
                socket.user.username,

              avatarUrl:
                socket.user.avatarUrl,
            },
          };

          io
            .to(
              roomName(projectId)
            )
            .emit(
              'chat:message',
              payload
            );

          ack?.({
            ok: true,

            message:
              payload,
          });
        } catch (err) {
          ack?.({
            ok: false,
            error:
              'Failed to send message',
          });
        }
      }
    );

    socket.on(
      'disconnect',
      async () => {
        const releasedLocks =
          await lockService
            .releaseAllForSocketAndReturn(
              socket.id
            );

        for (
          const lock of releasedLocks
        ) {
          io
            .to(
              roomName(
                lock.projectId.toString()
              )
            )
            .emit(
              'file:lock_released',
              {
                fileId:
                  lock.fileId.toString(),
              }
            );
        }

        for (
          const projectId of
            socket.data.projects
        ) {
          await leaveProject(
            io,
            socket,
            projectId,
            {
              alreadyDisconnecting:
                true,
            }
          );
        }
      }
    );
  });

  return io;
}

module.exports = {
  initSockets,
  roomName,
};