import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import ProjectWorkspace from "../components/ProjectWorkspace";
import ProjectSettings from "../components/ProjectSettings";

import * as fileService from "../services/fileService";
import * as messageService from "../services/messageService";

import { useProjectSocket } from "../hooks/useProjectSocket";
import { useAuth } from "../context/useAuth";

import { getErrorMessage } from "../utils/getErrorMessage";

import "../styles/ProjectPage.css";

const HEARTBEAT_INTERVAL_MS = 20_000;
const SAVE_FEEDBACK_MS = 2_200;

const SETTINGS_STORAGE_PREFIX = "codespace:project-settings:";

function normalizeProjectSettings(serverSettings = {}) {
  return {
    collaboration: serverSettings.collaboration?.enabled !== false,
    presence: serverSettings.collaboration?.presenceEnabled !== false,
    fileLocking: serverSettings.collaboration?.fileLockingEnabled !== false,
    teamChat: serverSettings.collaboration?.teamChatEnabled !== false,

    autoSave: serverSettings.editor?.autoSave === true,
    minimap: serverSettings.editor?.minimap !== false,
    wordWrap: serverSettings.editor?.wordWrap === true,
    formatOnSave: serverSettings.editor?.formatOnSave === true,

    confirmDelete: serverSettings.files?.confirmDelete !== false,
    showHiddenFiles: serverSettings.files?.showHiddenFiles !== false,

    memberJoinNotifications: serverSettings.notifications?.memberJoin !== false,
    fileLockNotifications: serverSettings.notifications?.fileLock !== false,
    chatNotifications: serverSettings.notifications?.chat !== false,
  };
}

export default function ProjectPage() {

  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [lockInfo, setLockInfo] = useState(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("vs-dark");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("overview");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settings, setSettings] = useState({
    collaboration: true,
    presence: true,
    fileLocking: true,
    teamChat: true,

    autoSave: false,
    minimap: true,
    wordWrap: false,
    formatOnSave: false,

    confirmDelete: true,
    showHiddenFiles: true,

    memberJoinNotifications: true,
    fileLockNotifications: true,
    chatNotifications: true,
  });
  const [projectDraft, setProjectDraft] = useState({
    name: "",
    description: "",
  });
  const [settingsNotice, setSettingsNotice] = useState(null);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNode, setPendingNode] = useState(null);

  const {
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
    setChatVisible,
  } = useProjectSocket(projectId, user.id);

  const [chatOpen, setChatOpen] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  const saveRef = useRef(() => {});
  const heartbeatTimerRef = useRef(null);
  const selectedFileRef = useRef(null);
  const lockInfoRef = useRef(null);
  const saveFeedbackTimerRef = useRef(null);
  const skipDirtyPromptRef = useRef(false);
  const savedContentRef = useRef("");

  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  useEffect(() => {
    lockInfoRef.current = lockInfo;
  }, [lockInfo]);

  useEffect(() => {
    fileService
      .getProject(projectId)
      .then(({ project: loadedProject, role: loadedRole }) => {
        setProject(loadedProject);
        setRole(loadedRole);

        setProjectDraft({
          name: loadedProject?.name || "",
          description: loadedProject?.description || "",
        });

        setSettings(normalizeProjectSettings(loadedProject?.settings || {}));
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Could not load project"));
      });

    fileService
      .getLocks(projectId)
      .then(seedLocks)
      .catch(() => {});

    messageService
      .getMessages(projectId)
      .then((newestFirst) => {
        setHasMoreMessages(newestFirst.length >= 50);
        seedMessages([...newestFirst].reverse());
      })
      .catch(() => {});

    // projectId is intentionally the only dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current);
      }
    };
  }, []);

  const handleLoadOlderMessages = useCallback(async () => {
    if (chatMessages.length === 0 || loadingOlderMessages) return;

    setLoadingOlderMessages(true);
    try {
      const oldest = chatMessages[0];
      const olderNewestFirst = await messageService.getMessages(projectId, {
        before: oldest.createdAt,
      });

      if (olderNewestFirst.length < 50) {
        setHasMoreMessages(false);
      }

      prependMessages([...olderNewestFirst].reverse());
    } catch (err) {
      // Non-fatal — history just doesn't extend further back this time.
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [projectId, chatMessages, loadingOlderMessages, prependMessages]);

  const handleToggleChat = useCallback(() => {
    if (!settings.teamChat) return;

    setChatOpen((open) => {
      const next = !open;
      setChatVisible(next);
      return next;
    });
  }, [setChatVisible, settings.teamChat]);

  useEffect(() => {
    if (settings.teamChat) return;

    setChatOpen(false);
    setChatVisible(false);
  }, [settings.teamChat, setChatVisible]);

  const fileViewers = useMemo(() => {
    if (!selectedFile?._id) return [];

    return presence.filter(
      (person) =>
        String(person.viewingFileId) === String(selectedFile._id) &&
        String(person.userId) !== String(user.id),
    );
  }, [presence, selectedFile, user.id]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(
    (fileId) => {
      stopHeartbeat();

      heartbeatTimerRef.current = setInterval(async () => {
        const result = await heartbeatLock(fileId);

        if (!result?.renewed) {
          stopHeartbeat();

          setLockInfo((current) =>
            current?.heldByMe
              ? { heldByMe: false, heldByUserId: null }
              : current,
          );
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    [heartbeatLock, stopHeartbeat],
  );

  const releaseCurrentFile = useCallback(
    (fileId) => {
      stopHeartbeat();

      if (fileId) {
        releaseLock(fileId);
        closeFile(fileId);
      }
    },
    [releaseLock, closeFile, stopHeartbeat],
  );

  useEffect(() => {
    return () => {
      const current = selectedFileRef.current;

      if (current) {
        releaseCurrentFile(current._id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performFileSwitch = useCallback(
    async (node) => {
      skipDirtyPromptRef.current = true;
      const previous = selectedFileRef.current;

      if (previous && String(previous._id) !== String(node?._id)) {
        releaseCurrentFile(previous._id);
      }

      if (!node) {
        setSelectedFile(null);
        setContent("");
        savedContentRef.current = "";
        setLockInfo(null);
        setDirty(false);
        setSaveState("idle");
        return;
      }

      setError(null);
      setSaveState("idle");

      try {
        const [{ node: full, access }, openAck] = await Promise.all([
          fileService.getFileContent(projectId, node._id),
          openFile(node._id),
        ]);

        if (!openAck?.ok) {
          throw new Error(openAck?.error || "Could not open file");
        }

        const nextFile = {
          _id: node._id,
          name: node.name,
          path: node.path,
          access,
        };

        // Update refs immediately so Monaco's controlled-value update
        // cannot be mistaken for a user edit while switching files.
        selectedFileRef.current = nextFile;
        lockInfoRef.current = null;

        setSelectedFile(nextFile);
        setContent(full.content);
        savedContentRef.current = full.content ?? "";
        setDirty(false);

        // Fix: Accurately set state if the server says we already own the lock
        const activeLock = openAck.lock;
        if (activeLock) {
          const isMe = String(activeLock.userId) === String(user.id);
          setLockInfo({
            heldByMe: isMe,
            heldByUserId: activeLock.userId,
          });
          if (isMe) startHeartbeat(node._id);
        } else {
          setLockInfo(null);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Could not open file"));
      } finally {
        skipDirtyPromptRef.current = false;
      }
    },
    [projectId, openFile, startHeartbeat, releaseCurrentFile, user.id],
  );

  const handleSelect = useCallback(
    (node) => {
      const previous = selectedFileRef.current;
      const isSameFile = Boolean(
        previous && node && String(previous._id) === String(node._id),
      );

      if (isSameFile) {
        return;
      }

      if (skipDirtyPromptRef.current) {
        performFileSwitch(node);
        return;
      }

      if (
        dirty &&
        previous &&
        node &&
        String(previous._id) !== String(node._id)
      ) {
        setPendingNode(node);
        setShowUnsavedModal(true);
        return;
      }

      performFileSwitch(node);
    },
    [dirty, performFileSwitch],
  );

  const handleConfirmSwitch = useCallback(() => {
    setShowUnsavedModal(false);
    setDirty(false);
    setSaveState("idle");

    if (pendingNode) {
      performFileSwitch(pendingNode);
      setPendingNode(null);
    }
  }, [pendingNode, performFileSwitch]);

  const handleCancelSwitch = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNode(null);
  }, []);

  const toggleEditMode = useCallback(async () => {
    if (!selectedFile?.access?.write) return;

    const lockingEnabled = settings.collaboration && settings.fileLocking;

    const currentlyEditing = Boolean(
      selectedFile?.access?.write && (!lockingEnabled || lockInfo?.heldByMe),
    );

    // Collaboration/file locking disabled:
    // editing is controlled only by file write permission.
    if (!lockingEnabled) {
      if (currentlyEditing) {
        if (dirty) {
          setError("Save your changes before leaving edit mode.");
          return;
        }

        setLockInfo(null);
        setError(null);
        return;
      }

      setError(null);
      setLockInfo({
        heldByMe: true,
        heldByUserId: user.id,
      });

      return;
    }

    // Normal lock-based editing.
    if (lockInfo?.heldByMe) {
      if (dirty) {
        setError("Save your changes before leaving edit mode.");
        return;
      }

      stopHeartbeat();
      releaseLock(selectedFile._id);

      setLockInfo(null);
      setError(null);
      return;
    }

    setError(null);

    const result = await acquireLock(selectedFile._id);

    if (result?.granted) {
      const nextLockInfo = {
        heldByMe: true,
        heldByUserId: user.id,
      };

      lockInfoRef.current = nextLockInfo;
      setLockInfo(nextLockInfo);

      startHeartbeat(selectedFile._id);

      return;
    }

    setLockInfo({
      heldByMe: false,
      heldByUserId: result?.heldBy?.userId || null,
    });

    if (result?.error) {
      setError(result.error);
    }
  }, [
    selectedFile,
    lockInfo,
    dirty,
    settings.collaboration,
    settings.fileLocking,
    stopHeartbeat,
    releaseLock,
    acquireLock,
    startHeartbeat,
    user.id,
  ]);

  const doSave = useCallback(async () => {
    const lockingEnabled = settings.collaboration && settings.fileLocking;

    const canSave =
      selectedFile?.access?.write && (!lockingEnabled || lockInfo?.heldByMe);

    if (!selectedFile || !canSave || !dirty || saving) {
      return;
    }

    if (saveFeedbackTimerRef.current) {
      clearTimeout(saveFeedbackTimerRef.current);
    }

    setSaving(true);
    setSaveState("saving");
    setError(null);

    try {
      await fileService.saveFileContent(projectId, selectedFile._id, content);

      savedContentRef.current = content;
      setDirty(false);
      setSaveState("saved");

      saveFeedbackTimerRef.current = setTimeout(() => {
        setSaveState("idle");
        saveFeedbackTimerRef.current = null;
      }, SAVE_FEEDBACK_MS);
    } catch (err) {
      setSaveState("error");
      setError(getErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  }, [
    projectId,
    selectedFile,
    content,
    lockInfo,
    dirty,
    saving,
    settings.collaboration,
    settings.fileLocking,
  ]);

  useEffect(() => {
    saveRef.current = doSave;
  }, [doSave]);

  const handleEditorMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveRef.current();
    });
  };

  useEffect(() => {
    const handler = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Someone else saved the file we're currently viewing.
  useEffect(() => {
    if (!lastFileUpdate || !selectedFile) return;

    // Fix: Stringify IDs to ensure proper matching
    if (String(lastFileUpdate.fileId) !== String(selectedFile._id)) return;
    if (String(lastFileUpdate.updatedBy) === String(user.id)) return;

    setContent(lastFileUpdate.content);
    savedContentRef.current = lastFileUpdate.content ?? "";
    setDirty(false);
    setSaveState("idle");
  }, [lastFileUpdate, selectedFile, user.id]);

  // Keep the local edit state synchronized with live lock broadcasts.
  useEffect(() => {
    if (!selectedFile?._id) return;

    // Fix: Force `_id` to be a string so it matches `useProjectSocket` keys
    const activeLock = locks[String(selectedFile._id)];

    if (!activeLock) {
      lockInfoRef.current = null;
      setLockInfo(null);
      return;
    }

    if (String(activeLock.userId) === String(user.id)) {
      const nextLockInfo = {
        heldByMe: true,
        heldByUserId: user.id,
      };
      lockInfoRef.current = nextLockInfo;
      setLockInfo(nextLockInfo);
      return;
    }

    const nextLockInfo = {
      heldByMe: false,
      heldByUserId: activeLock.userId,
    };
    lockInfoRef.current = nextLockInfo;
    setLockInfo(nextLockInfo);
  }, [locks, selectedFile, user.id]);

  // Our access to the open file was changed by an admin/owner.
  useEffect(() => {
    if (!lastPermissionChange || !selectedFile) return;

    // Fix: Stringify IDs to ensure proper matching
    if (String(lastPermissionChange.resourceId) !== String(selectedFile._id))
      return;
    if (String(lastPermissionChange.userId) !== String(user.id)) return;

    performFileSwitch({
      _id: selectedFile._id,
      name: selectedFile.name,
      path: selectedFile.path,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPermissionChange, user.id, performFileSwitch]);

  const handleEditorChange = useCallback(
    (value) => {
      if (!selectedFileRef.current?.access?.write) return;

      if (
        settings.collaboration &&
        settings.fileLocking &&
        !lockInfoRef.current?.heldByMe
      ) {
        return;
      }

      const nextContent = value ?? "";

      setContent(nextContent);

      const hasChanges = nextContent !== savedContentRef.current;

      setDirty(hasChanges);
      setSaveState(hasChanges ? "idle" : "saved");

      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current);
        saveFeedbackTimerRef.current = null;
      }
    },
    [settings.collaboration, settings.fileLocking],
  );

  const updateSetting = useCallback((key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSettingsSaved(false);
    setSettingsNotice(null);
  }, []);

  const canManageSettings = role === "owner" || role === "admin";

  const persistSettings = useCallback(async () => {
    if (!canManageSettings) {
      setSettingsNotice(
        "Only project admins and owners can save project settings.",
      );
      return;
    }

    try {
      setSettingsNotice(null);
      setSettingsSaved(false);

      const serverSettings = {
        collaboration: {
          enabled: settings.collaboration,
          presenceEnabled: settings.presence,
          fileLockingEnabled: settings.fileLocking,
          teamChatEnabled: settings.teamChat,
        },

        editor: {
          autoSave: settings.autoSave,
          minimap: settings.minimap,
          wordWrap: settings.wordWrap,
          formatOnSave: settings.formatOnSave,
        },

        files: {
          confirmDelete: settings.confirmDelete,
          showHiddenFiles: settings.showHiddenFiles,
        },

        notifications: {
          memberJoin: settings.memberJoinNotifications,
          fileLock: settings.fileLockNotifications,
          chat: settings.chatNotifications,
        },
      };

      const settingsResult = await fileService.updateProjectSettings(
        projectId,
        serverSettings,
      );

      let updatedProject = project;

      const nameChanged = projectDraft.name.trim() !== (project?.name || "");

      const descriptionChanged =
        projectDraft.description.trim() !== (project?.description || "");

      if (nameChanged || descriptionChanged) {
        const projectResult = await fileService.updateProject(projectId, {
          name: projectDraft.name.trim(),
          description: projectDraft.description.trim(),
        });

        updatedProject =
          projectResult?.project ||
          projectResult?.data?.project ||
          projectResult ||
          project;
      }

      if (updatedProject && typeof updatedProject === "object") {
        setProject((current) => ({
          ...current,
          ...updatedProject,
        }));
      }

      // Keep the existing local cache as a convenience,
      // but the server remains the source of truth.
      window.localStorage.setItem(
        `${SETTINGS_STORAGE_PREFIX}${projectId}`,
        JSON.stringify(settings),
      );

      if (settingsResult?.settings) {
        setSettings(normalizeProjectSettings(settingsResult.settings));
      }

      setSettingsSaved(true);
      setSettingsNotice("Settings saved.");
    } catch (err) {
      setSettingsNotice(getErrorMessage(err, "Could not save settings"));
    }
  }, [canManageSettings, projectId, settings, projectDraft, project]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setSettingsNotice(null);
  }, []);


  const userById = useMemo(() => {
    return presence.reduce((map, person) => {
      map[String(person.userId)] = person.username || "someone";
      return map;
    }, {});
  }, [presence]);

  const canWriteRoot = role === "owner" || role === "admin";
  const lockingEnabled = settings.collaboration && settings.fileLocking;

  const canEditNow = Boolean(
    selectedFile?.access?.write && (!lockingEnabled || lockInfo?.heldByMe),
  );

  const lockOwnerName = lockInfo?.heldByUserId
    ? userById[String(lockInfo.heldByUserId)] || "someone"
    : null;

  const saveButtonTitle =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : dirty
            ? "Save changes"
            : "No changes to save";


  return (
    <>
      <ProjectWorkspace
        project={project}
        role={role}
        projectId={projectId}
        user={user}
        selectedFile={selectedFile}
        content={content}
        dirty={dirty}
        saving={saving}
        saveState={saveState}
        error={error}
        theme={theme}
        settings={settings}
        presence={presence}
        connectionStatus={connectionStatus}
        chatOpen={chatOpen}
        unreadCount={unreadCount}
        locks={locks}
        treeVersion={treeVersion}
        fileViewers={fileViewers}
        userById={userById}
        settingsOpen={settingsOpen}
        canWriteRoot={canWriteRoot}
        canEditNow={canEditNow}
        lockOwnerName={lockOwnerName}
        saveButtonTitle={saveButtonTitle}
        onToggleChat={handleToggleChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTheme={() =>
          setTheme((current) =>
            current === "vs-dark" ? "vs-light" : "vs-dark",
          )
        }
        onSelectFile={handleSelect}
        onSave={doSave}
        onEditorChange={handleEditorChange}
        onEditorMount={handleEditorMount}
        chatMessages={chatMessages}
        onSendChatMessage={sendChatMessage}
        onLoadOlderMessages={handleLoadOlderMessages}
        hasMoreMessages={hasMoreMessages}
        loadingOlderMessages={loadingOlderMessages}
        onToggleEditMode={toggleEditMode}
      />

      <ProjectSettings
        open={settingsOpen}
        project={project}
        role={role}
        user={user}
        presence={presence}
        connectionStatus={connectionStatus}
        selectedFile={selectedFile}
        theme={theme}
        settings={settings}
        projectDraft={projectDraft}
        settingsSection={settingsSection}
        settingsSaved={settingsSaved}
        settingsNotice={settingsNotice}
        canManageSettings={canManageSettings}
        onClose={closeSettings}
        onSectionChange={(section) => {
          setSettingsSection(section);
          setSettingsSaved(false);
          setSettingsNotice(null);
        }}
        onProjectDraftChange={setProjectDraft}
        onSettingChange={updateSetting}
        onThemeChange={setTheme}
        onSave={persistSettings}
      />

      {showUnsavedModal && (
        <div className="tree-modal-backdrop" role="presentation">
          <div
            className="tree-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-changes-title"
            aria-describedby="unsaved-changes-description"
          >
            <div
              className="tree-delete-icon-wrap"
              style={{
                color: "#f0c674",
                background: "rgba(204, 167, 0, 0.10)",
                borderColor: "rgba(204, 167, 0, 0.28)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className="tree-delete-copy">
              <h3 id="unsaved-changes-title">Unsaved Changes</h3>
              <p id="unsaved-changes-description">
                You have unsaved changes in the current file. If you switch
                files now, these changes will be lost. Do you want to proceed?
              </p>
            </div>

            <div className="tree-delete-actions">
              <button
                type="button"
                className="tree-dialog-btn secondary"
                onClick={handleCancelSwitch}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tree-dialog-btn danger"
                style={{ backgroundColor: "#c9a945", borderColor: "#c9a945" }}
                onClick={handleConfirmSwitch}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
