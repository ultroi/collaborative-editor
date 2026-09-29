import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const ACCESS_TOKEN_KEY = "codespace.accessToken";

export function useProjectSocket(projectId, currentUserId) {
  const socketRef = useRef(null);
  const heartbeatTimersRef = useRef(new Map());

  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [presence, setPresence] = useState([]);
  const [locks, setLocks] = useState({});
  const [treeVersion, setTreeVersion] = useState(0);
  const [lastFileUpdate, setLastFileUpdate] = useState(null);
  const [lastPermissionChange, setLastPermissionChange] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const clearHeartbeat = useCallback((resourceId) => {
    if (!resourceId) return;

    const key = String(resourceId);
    const timer = heartbeatTimersRef.current.get(key);

    if (timer) {
      clearInterval(timer);
      heartbeatTimersRef.current.delete(key);
    }
  }, []);

  const stopAllHeartbeats = useCallback(() => {
    heartbeatTimersRef.current.forEach((timer) => {
      clearInterval(timer);
    });

    heartbeatTimersRef.current.clear();
  }, []);

  const seedLocks = useCallback((incomingLocks) => {
    if (!incomingLocks) {
      setLocks({});
      return;
    }

    if (Array.isArray(incomingLocks)) {
      const mapped = {};

      incomingLocks.forEach((lock) => {
        const resourceId = lock?.resourceId || lock?.fileId || lock?.nodeId;

        if (!resourceId) return;

        mapped[String(resourceId)] = lock;
      });

      setLocks(mapped);
      return;
    }

    setLocks(incomingLocks);
  }, []);

  const openFile = useCallback(
    (resourceId) => {
      const socket = socketRef.current;

      if (!socket?.connected || !resourceId) {
        return Promise.resolve({
          ok: false,
          error: "Socket is not connected",
        });
      }

      return new Promise((resolve) => {
        socket.emit("file:open", projectId, resourceId, (response) => {
          if (!response?.ok) {
            console.warn(
              "[Socket.IO] file:open failed:",
              response?.error || "Unknown error",
            );

            resolve(
              response || {
                ok: false,
                error: "Could not open file",
              },
            );

            return;
          }

          if (response.lock) {
            setLocks((current) => ({
              ...current,
              [String(resourceId)]: {
                resourceId,
                fileId: resourceId,
                userId: response.lock.userId,
                expiresAt: response.lock.expiresAt,
              },
            }));
          }

          resolve(response);
        });
      });
    },
    [projectId],
  );
  const closeFile = useCallback(
    (resourceId) => {
      const socket = socketRef.current;

      if (!socket?.connected || !resourceId) return;

      clearHeartbeat(resourceId);

      socket.emit("file:close", projectId, resourceId);
    },
    [projectId, clearHeartbeat],
  );

  const acquireLock = useCallback(
    (resourceId) => {
      const socket = socketRef.current;

      if (!socket?.connected || !resourceId) {
        return Promise.resolve({
          granted: false,
          error: "Socket is not connected",
        });
      }

      return new Promise((resolve) => {
        socket.emit("file:lock:acquire", projectId, resourceId, (response) => {
          if (!response?.granted) {
            if (response?.error) {
              console.warn(
                "[Socket.IO] file:lock:acquire failed:",
                response.error,
              );
            }

            resolve(
              response || {
                granted: false,
                error: "Could not acquire lock",
              },
            );

            return;
          }

          const lock = {
            resourceId,
            fileId: resourceId,
            userId: currentUserId,
            expiresAt: response.expiresAt,
          };

          setLocks((current) => ({
            ...current,
            [String(resourceId)]: lock,
          }));

          resolve(response);
        });
      });
    },
    [projectId, currentUserId],
  );

  const releaseLock = useCallback(
    (resourceId) => {
      const socket = socketRef.current;

      clearHeartbeat(resourceId);

      if (!socket?.connected || !resourceId) return;

      socket.emit("file:lock:release", projectId, resourceId);

      setLocks((current) => {
        const next = { ...current };

        delete next[String(resourceId)];

        return next;
      });
    },
    [projectId, clearHeartbeat],
  );

  const heartbeatLock = useCallback(
    (resourceId) => {
      const socket = socketRef.current;

      if (!socket?.connected || !resourceId) return;

      const key = String(resourceId);

      clearHeartbeat(key);

      const sendHeartbeat = () => {
        const activeSocket = socketRef.current;

        if (!activeSocket?.connected) return;

        activeSocket.emit("file:lock:heartbeat", resourceId, (response) => {
          if (!response?.renewed) {
            clearHeartbeat(resourceId);
          }
        });
      };

      sendHeartbeat();

      const timer = setInterval(sendHeartbeat, 10_000);

      heartbeatTimersRef.current.set(key, timer);
    },
    [clearHeartbeat],
  );

  const seedMessages = useCallback((messages) => {
    if (!Array.isArray(messages)) {
      setChatMessages([]);
      return;
    }

    setChatMessages(messages);
  }, []);

  const prependMessages = useCallback((messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    setChatMessages((current) => {
      const existingIds = new Set(
        current
          .map((message) => message?._id)
          .filter(Boolean)
          .map(String),
      );

      const incoming = messages.filter((message) => {
        if (!message?._id) return true;

        return !existingIds.has(String(message._id));
      });

      return [...incoming, ...current];
    });
  }, []);

  const sendChatMessage = useCallback(
    (message) => {
      const socket = socketRef.current;

      if (!socket?.connected || !message) {
        return false;
      }

      socket.emit("chat:send", projectId, message, (response) => {
        if (!response?.ok) {
          console.warn(
            "[Socket.IO] chat:send failed:",
            response?.error || "Unknown error",
          );
        }
      });

      return true;
    },
    [projectId],
  );

  const [chatVisibleState, setChatVisibleStateInternal] = useState(false);
  const chatVisibleRef = useRef(false);

  const setChatVisible = useCallback((visible) => {
    const nextVisible = Boolean(visible);
    chatVisibleRef.current = nextVisible;
    setChatVisibleStateInternal(nextVisible);
  }, []);

  useEffect(() => {
    chatVisibleRef.current = chatVisibleState;

    if (chatVisibleState) {
      setUnreadCount(0);
    }
  }, [chatVisibleState]);

  useEffect(() => {
    if (!projectId) {
      return undefined;
    }

    /*
     * IMPORTANT:
     * The auth system stores the access token under
     * "codespace.accessToken".
     *
     * The backend socketAuth middleware expects:
     * socket.handshake.auth.token
     */
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      console.warn("[Socket.IO] No access token found.");

      console.warn(
        `[Socket.IO] Expected sessionStorage key: ${ACCESS_TOKEN_KEY}`,
      );

      setConnectionStatus("error");

      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],

      withCredentials: true,

      auth: {
        token,
      },
    });

    socketRef.current = socket;

    setConnectionStatus("connecting");

    const onConnect = () => {
      console.log("[Socket.IO] connected:", socket.id);

      setConnectionStatus("connected");

      /*
       * Backend expects:
       * socket.on("project:join", async (projectId, ack) => {})
       */
      socket.emit("project:join", projectId, (response) => {
        if (!response?.ok) {
          console.warn(
            "[Socket.IO] project:join failed:",
            response?.error || "Unknown error",
          );

          return;
        }

        if (Array.isArray(response.presence)) {
          setPresence(response.presence);
        }
      });
    };

    const onDisconnect = (reason) => {
      console.warn("[Socket.IO] disconnected:", reason);

      setConnectionStatus("disconnected");
    };

    const onConnectError = (error) => {
      console.error("[Socket.IO] connect_error:", error);

      console.error("[Socket.IO] message:", error?.message);

      console.error("[Socket.IO] description:", error?.description);

      console.error("[Socket.IO] context:", error?.context);

      setConnectionStatus("error");
    };

    const onPresenceUpdate = (payload) => {
      if (Array.isArray(payload)) {
        setPresence(payload);
        return;
      }

      if (Array.isArray(payload?.presence)) {
        setPresence(payload.presence);

        return;
      }

      if (Array.isArray(payload?.users)) {
        setPresence(payload.users);
      }
    };

    const onUserJoined = (payload) => {
      const joinedUser = payload?.user || payload;

      if (!joinedUser) return;

      setPresence((current) => {
        const userId = joinedUser.userId || joinedUser._id || joinedUser.id;

        if (!userId) {
          return current;
        }

        const exists = current.some(
          (user) =>
            String(user.userId || user._id || user.id) === String(userId),
        );

        if (exists) {
          return current;
        }

        return [...current, joinedUser];
      });
    };

    const onUserLeft = (payload) => {
      const leftUserId =
        payload?.userId || payload?.user?._id || payload?.user?.id;

      if (!leftUserId) return;

      setPresence((current) =>
        current.filter(
          (user) =>
            String(user.userId || user._id || user.id) !== String(leftUserId),
        ),
      );
    };

    const onLockState = (payload) => {
      if (!payload) return;

      const resourceId = payload.resourceId || payload.nodeId || payload.fileId;

      if (!resourceId) return;

      setLocks((current) => ({
        ...current,

        [String(resourceId)]: payload,
      }));
    };

    const onLockReleased = (payload) => {
      if (!payload) return;

      const resourceId = payload.resourceId || payload.nodeId || payload.fileId;

      if (!resourceId) return;

      clearHeartbeat(resourceId);

      setLocks((current) => {
        const next = {
          ...current,
        };

        delete next[String(resourceId)];

        return next;
      });
    };

    const onLocksState = (payload) => {
      seedLocks(payload?.locks || payload?.data || payload);
    };

    const onTreeChanged = (payload) => {
      setTreeVersion((value) => value + 1);

      if (payload) {
        setLastFileUpdate(payload);
      }
    };

    const onFileUpdate = (payload) => {
      if (!payload) return;

      setLastFileUpdate(payload);
    };

    const onPermissionChanged = (payload) => {
      if (!payload) return;

      setLastPermissionChange(payload);

      setTreeVersion((value) => value + 1);
    };

    const onChatMessage = (payload) => {
      const message = payload?.message || payload?.data || payload;

      if (!message) return;

      setChatMessages((current) => {
        const messageId = message?._id;

        if (
          messageId &&
          current.some((item) => String(item?._id) === String(messageId))
        ) {
          return current;
        }

        return [...current, message];
      });

      if (!chatVisibleRef.current) {
        setUnreadCount((value) => value + 1);
      }
    };

    const onChatMessages = (payload) => {
      const messages = payload?.messages || payload?.data || payload;

      if (!Array.isArray(messages)) {
        return;
      }

      seedMessages(messages);

      if (chatVisibleRef.current) {
        setUnreadCount(0);
      }
    };

    /*
     * Connection events
     */
    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    /*
     * Presence
     */
    socket.on("presence:update", onPresenceUpdate);
    socket.on("presence", onPresenceUpdate);
    socket.on("presence_update", onPresenceUpdate);
    socket.on("user_joined_project", onUserJoined);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left_project", onUserLeft);
    socket.on("user_left", onUserLeft);

    /*
     * Locks
     */
    socket.on("file_lock_acquired", onLockState);
    socket.on("lock_acquired", onLockState);
    socket.on("lock_state", onLockState);
    socket.on("lock_updated", onLockState);
    socket.on("file_lock_released", onLockReleased);
    socket.on("lock_released", onLockReleased);
    socket.on("locks", onLocksState);

    /*
     * Tree / file / permission events
     */

    socket.on("tree_changed", onTreeChanged);
    socket.on("file_tree_changed", onTreeChanged);
    socket.on("file_updated", onFileUpdate);
    socket.on("file_update", onFileUpdate);
    socket.on("permission_changed", onPermissionChanged);

    /*
     * Chat
     */
    socket.on("chat:message", onChatMessage);

    socket.on("chat_message", onChatMessage);

    socket.on("new_message", onChatMessage);

    socket.on("chat:messages", onChatMessages);

    socket.on("chat_messages", onChatMessages);

    return () => {
      stopAllHeartbeats();

      
      if (socket.connected) {
        socket.emit("project:leave", projectId);
      }

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("presence:update", onPresenceUpdate);
      socket.off("presence", onPresenceUpdate);

      socket.off("presence_update", onPresenceUpdate);

      socket.off("user_joined_project", onUserJoined);

      socket.off("user_joined", onUserJoined);

      socket.off("user_left_project", onUserLeft);

      socket.off("user_left", onUserLeft);

      socket.off("file_lock_acquired", onLockState);

      socket.off("lock_acquired", onLockState);

      socket.off("lock_state", onLockState);

      socket.off("lock_updated", onLockState);

      socket.off("file_lock_released", onLockReleased);

      socket.off("lock_released", onLockReleased);

      socket.off("locks", onLocksState);

      socket.off("tree_changed", onTreeChanged);

      socket.off("file_tree_changed", onTreeChanged);

      socket.off("file_updated", onFileUpdate);

      socket.off("file_update", onFileUpdate);

      socket.off("permission_changed", onPermissionChanged);

      socket.off("chat:message", onChatMessage);

      socket.off("chat_message", onChatMessage);

      socket.off("new_message", onChatMessage);

      socket.off("chat:messages", onChatMessages);

      socket.off("chat_messages", onChatMessages);

      socket.disconnect();

      socketRef.current = null;

      setConnectionStatus("disconnected");

      setPresence([]);

      setLocks({});
    };
  }, [
    projectId,
    clearHeartbeat,
    stopAllHeartbeats,
    seedLocks,
    seedMessages,
  ]);

  return {
    connectionStatus,

    presence,
    locks,

    treeVersion,
    lastFileUpdate,
    lastPermissionChange,

    chatMessages,
    unreadCount,

    seedLocks,

    openFile,
    closeFile,

    acquireLock,
    releaseLock,
    heartbeatLock,

    seedMessages,
    prependMessages,
    sendChatMessage,

    chatVisible: chatVisibleState,

    setChatVisible,
  };
}

export default useProjectSocket;
