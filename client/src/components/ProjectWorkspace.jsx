import Editor from "@monaco-editor/react";
import { Link } from "react-router-dom";

import FileTree from "./FileTree";
import PresenceBar from "./PresenceBar";
import ChatPanel from "./ChatPanel";

import { detectLanguage } from "../utils/detectLanguage";

function SaveIcon({ state = "idle" }) {
  if (state === "saving") {
    return (
      <svg
        className="save-action-icon save-action-icon--spin"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="m16.24 16.24 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="m4.93 19.07 2.83-2.83" />
        <path d="m16.24 7.76 2.83-2.83" />
      </svg>
    );
  }

  if (state === "saved") {
    return (
      <svg
        className="save-action-icon save-action-icon--saved"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (state === "error") {
    return (
      <svg
        className="save-action-icon save-action-icon--error"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
    );
  }

  return (
    <svg
      className="save-action-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function SettingsIcon({
  size = 20, // Slightly increased from 17 for better visibility, adjust as needed
  color = "currentColor",
  className = "",
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5} // Thinner stroke prevents the lines from bleeding into a blob
      stroke={color}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}




function ChatIcon({ open = false }) {
  if (open) {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </svg>
    );
  }

  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.12 9.12 0 0 1-4-.9L3 21l1.9-4.3A8.2 8.2 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
      <path d="M8 11h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
    </svg>
  );
}

const SETTINGS_STORAGE_PREFIX = "codespace:project-settings:";

export default function ProjectWorkspace({
  project,
  role,
  projectId,
  user,
  selectedFile,
  content,
  dirty,
  saving,
  saveState,
  error,
  theme,
  settings,
  presence,
  connectionStatus,
  chatOpen,
  unreadCount,
  locks,
  treeVersion,
  fileViewers,
  userById,
  settingsOpen,
  canWriteRoot,
  canEditNow,
  lockOwnerName,
  saveButtonTitle,
  onToggleChat,
  onOpenSettings,
  onToggleTheme,
  onSelectFile,
  onSave,
  onEditorChange,
  onEditorMount,
  chatMessages,
  onSendChatMessage,
  onLoadOlderMessages,
  hasMoreMessages,
  loadingOlderMessages,
  onToggleEditMode,
}) {
  return (
    <div className="workspace">
      <header className="workspace-header">
        <Link to="/dashboard" className="back-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Dashboard
        </Link>

        <h2>{project?.name || "Loading…"}</h2>

        <div className="workspace-header-actions">
          {settings.collaboration && settings.presence && (
            <PresenceBar
              connectionStatus={connectionStatus}
              presence={presence}
              currentUserId={user.id}
            />
          )}

          {settings.teamChat && (
            <button
              type="button"
              className={`header-chat-toggle ${chatOpen ? "is-open" : ""}`}
              onClick={onToggleChat}
              title={chatOpen ? "Close project chat" : "Open project chat"}
              aria-label={chatOpen ? "Close project chat" : "Open project chat"}
              aria-pressed={chatOpen}
            >
              <ChatIcon open={chatOpen} />

              {settings.chatNotifications && unreadCount > 0 && !chatOpen && (
                <span className="header-chat-unread">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            className={`workspace-settings-button ${settingsOpen ? "is-active" : ""}`}
            onClick={onOpenSettings}
            title="Project settings"
            aria-label="Project settings"
            aria-pressed={settingsOpen}
          >
            <SettingsIcon />
          </button>

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title="Toggle editor theme"
            aria-label="Toggle editor theme"
          >
            {theme === "vs-dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <span className="role-badge">{role}</span>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="workspace-body">
        <div className="workspace-file-tree">
          <FileTree
            projectId={projectId}
            canWriteAtRoot={canWriteRoot}
            selectedId={selectedFile?._id}
            onSelect={onSelectFile}
            locks={locks}
            userById={userById}
            treeVersion={treeVersion}
            currentUserId={user.id}
          />
        </div>

        {settings.teamChat && (
          <aside
            className={`workspace-chat-shell ${chatOpen ? "is-open" : ""}`}
            aria-hidden={!chatOpen}
          >
            <div className="workspace-chat-inner">
              <ChatPanel
                messages={chatMessages}
                currentUserId={user.id}
                onSend={onSendChatMessage}
                onLoadOlder={onLoadOlderMessages}
                hasMore={hasMoreMessages}
                loadingOlder={loadingOlderMessages}
              />
            </div>
          </aside>
        )}

        <main className="editor-pane">
          {!selectedFile ? (
            <div className="editor-empty">
              <svg
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <p>Select a file to view or edit it.</p>
            </div>
          ) : (
            <>
              <div className="editor-tab-bar">
                <div className="editor-tab active">
                  <span className="file-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>

                  <span className="editor-filename">
                    {selectedFile.name || selectedFile.path.split("/").pop()}
                  </span>

                  {dirty && (
                    <span
                      className="dirty-dot"
                      title="Unsaved changes"
                      aria-label="Unsaved changes"
                    >
                      ●
                    </span>
                  )}
                </div>

                <div className="editor-actions">
                  {!selectedFile.access.write && (
                    <span className="lock-badge">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Read-only
                    </span>
                  )}

                  {selectedFile.access.write &&
                    lockOwnerName &&
                    !canEditNow && (
                      <span className="lock-badge">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Editing: {lockOwnerName}
                      </span>
                    )}

                  {selectedFile.access.write && !canEditNow && !lockOwnerName && (
                    <button
                      type="button"
                      className="editor-mode-toggle editor-mode-toggle--view"
                      onClick={onToggleEditMode}
                      title="Click to enter edit mode"
                      aria-label="Enter edit mode"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                      View only
                    </button>
                  )}

                  {canEditNow && (
                    <button
                      type="button"
                      className="editor-mode-toggle editor-mode-toggle--edit"
                      onClick={onToggleEditMode}
                      title={
                        dirty
                          ? "Save changes before leaving edit mode"
                          : "Click to leave edit mode"
                      }
                      aria-label="Leave edit mode"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                      Editing
                    </button>
                  )}

                  <div
                    className="file-viewers"
                    title={`${fileViewers.length} other ${fileViewers.length === 1 ? "person is" : "people are"} viewing this file`}
                  >
                    <div className="file-viewer-avatars">
                      {fileViewers.slice(0, 4).map((person) => (
                        <span
                          className="file-viewer-avatar"
                          key={person.userId}
                        >
                          {person.avatarUrl ? (
                            <img src={person.avatarUrl} alt="" />
                          ) : (
                            (person.username || "U").slice(0, 1).toUpperCase()
                          )}
                        </span>
                      ))}
                    </div>
                    {fileViewers.length > 0 && (
                      <span className="file-viewer-count">
                        {fileViewers.length}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`editor-icon-button save-action-button save-action-button--${saveState}`}
                    onClick={onSave}
                    disabled={!canEditNow || !dirty || saving}
                    title={saveButtonTitle}
                    aria-label={saveButtonTitle}
                  >
                    <SaveIcon state={saveState} />
                  </button>
                </div>
              </div>

              <div className="monaco-container">
                <Editor
                  height="100%"
                  theme={theme}
                  language={detectLanguage(selectedFile.name)}
                  value={content}
                  onChange={onEditorChange}
                  onMount={onEditorMount}
                  options={{
                    readOnly: !canEditNow,
                    minimap: { enabled: settings.minimap },
                    wordWrap: settings.wordWrap ? "on" : "off",
                    fontSize: 13,
                    fontFamily:
                      "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                  }}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}