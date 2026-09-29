import { useMemo } from "react";

import * as fileService from "../services/fileService";

const PROJECT_SETTING_SECTIONS = [
  { id: "overview", group: "GENERAL", label: "Overview" },
  { id: "details", group: "GENERAL", label: "Project Details" },
  { id: "members", group: "ACCESS", label: "Members" },
  { id: "roles", group: "ACCESS", label: "Roles & Permissions" },
  { id: "invitations", group: "ACCESS", label: "Invitations" },
  { id: "file-access", group: "ACCESS", label: "File & Folder Access" },
  { id: "collaboration", group: "COLLABORATION", label: "Collaboration" },
  { id: "chat", group: "COLLABORATION", label: "Team Chat" },
  { id: "github", group: "GIT", label: "GitHub" },
  { id: "repository", group: "GIT", label: "Repository" },
  { id: "editor", group: "EDITOR", label: "Editor" },
  { id: "appearance", group: "EDITOR", label: "Appearance" },
  { id: "files", group: "EDITOR", label: "Files" },
  { id: "notifications", group: "NOTIFICATIONS", label: "Notifications" },
  { id: "security", group: "ADVANCED", label: "Security" },
  { id: "activity", group: "ADVANCED", label: "Activity" },
  { id: "danger", group: "DANGER", label: "Danger Zone" },
];

const SETTING_ROLE_ROWS = [
  ["View project", true, true, true, true],
  ["Open files", true, true, true, true],
  ["Edit files", true, true, true, false],
  ["Save files", true, true, true, false],
  ["Create / delete files", true, true, false, false],
  ["Invite members", true, true, false, false],
  ["Manage permissions", true, true, false, false],
  ["Project settings", true, true, false, false],
  ["Delete project", true, false, false, false],
];

function SettingsIcon({ type }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 17a1.7 1.7 0 0 0-1.56-1.03H6.7v-2.4h.2A1.7 1.7 0 0 0 8.46 12a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.73 7.2V7h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 12c.18.6.73 1 1.36 1h.2v2.4h-.2c-.63 0-1.18.4-1.36 1.03Z" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
      </>
    ),
    collaboration: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M15 20a5 5 0 0 1 6 0" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-4 .9-4-2-5.5-2.5" />
        <path d="M14.5 21v-3.2c0-.9.1-1.8-.5-2.3 2.9-.3 5.9-1.4 5.9-6.2 0-1.4-.5-2.6-1.4-3.5.1-.3.6-1.7-.1-3.5 0 0-1.1-.4-3.6 1.4a12.3 12.3 0 0 0-6.5 0C5.8 1.9 4.7 2.3 4.7 2.3c-.7 1.8-.2 3.2-.1 3.5-.9.9-1.4 2.1-1.4 3.5 0 4.8 3 5.9 5.9 6.2-.4.4-.6 1-.6 2v3.5" />
      </>
    ),
    git: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v6" />
        <path d="M12 15v6" />
        <path d="m5.6 6.2 4.2 3" />
        <path d="m14.2 14.8 4.2 3" />
      </>
    ),
    editor: (
      <>
        <path d="m4 20 4.2-1 9.9-9.9a2.8 2.8 0 0 0-4-4L4.2 15 4 20Z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 15H6L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
  };

  return <svg {...common}>{paths[type] || paths.settings}</svg>;
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      className={`project-settings-toggle ${checked ? "is-on" : ""}`}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function SettingsRow({ title, description, children }) {
  return (
    <div className="project-settings-row">
      <div className="project-settings-row-copy">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <div className="project-settings-row-control">{children}</div>
    </div>
  );
}

function SettingPill({ children, tone = "neutral" }) {
  return <span className={`project-settings-pill ${tone}`}>{children}</span>;
}

export default function ProjectSettings({
  open,
  project,
  role,
  user,
  presence,
  connectionStatus,
  selectedFile,
  theme,
  settings,
  projectDraft,
  settingsSection,
  settingsSaved,
  settingsNotice,
  canManageSettings,
  onClose,
  onSectionChange,
  onProjectDraftChange,
  onSettingChange,
  onThemeChange,
  onSave,
}) {
  const settingsGroups = useMemo(() => {
    return PROJECT_SETTING_SECTIONS.reduce((groups, item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
      return groups;
    }, {});
  }, []);

  const activeSettingsSection =
    PROJECT_SETTING_SECTIONS.find((item) => item.id === settingsSection) ||
    PROJECT_SETTING_SECTIONS[0];

  const renderSettingsContent = () => {
    switch (activeSettingsSection.id) {
      case "overview":
        return (
          <>
            <div className="project-settings-hero">
              <div className="project-settings-project-icon">
                <SettingsIcon type="settings" />
              </div>
              <div>
                <h3>{project?.name || "Project"}</h3>
                <p>
                  {project?.description || "Collaborative CodeSpace project"}
                </p>
              </div>
              <SettingPill tone="success">{role || "member"}</SettingPill>
            </div>

            <div className="project-settings-card">
              <div className="project-settings-card-head">
                <div>
                  <h4>Project status</h4>
                  <p>Current workspace and collaboration state.</p>
                </div>
              </div>
              <div className="project-settings-stat-grid">
                <div>
                  <span>Role</span>
                  <strong>{role || "—"}</strong>
                </div>
                <div>
                  <span>Connection</span>
                  <strong>{connectionStatus || "—"}</strong>
                </div>
                <div>
                  <span>Online members</span>
                  <strong>{presence.length}</strong>
                </div>
                <div>
                  <span>Open file</span>
                  <strong>{selectedFile?.name || "None"}</strong>
                </div>
              </div>
            </div>
          </>
        );

      case "details":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Project details</h4>
                <p>
                  Update the project identity. Only owners and admins can change
                  these fields.
                </p>
              </div>
            </div>
            <label className="project-settings-field">
              <span>Project name</span>
              <input
                value={projectDraft.name}
                onChange={(event) =>
                  onProjectDraftChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                disabled={!canManageSettings}
                placeholder="Project name"
              />
            </label>
            <label className="project-settings-field">
              <span>Description</span>
              <textarea
                value={projectDraft.description}
                onChange={(event) =>
                  onProjectDraftChange((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                disabled={!canManageSettings}
                placeholder="Describe this project"
                rows={4}
              />
            </label>
            <div className="project-settings-inline-note">
              <SettingsIcon type="info" />
              <span>
                Project identity changes are saved through the authenticated
                project API.
              </span>
            </div>
          </div>
        );

      case "members":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Members & access</h4>
                <p>
                  Live presence is available here. Full member management
                  requires the project-member API.
                </p>
              </div>
              <SettingPill>{presence.length} online</SettingPill>
            </div>
            <div className="project-settings-member-list">
              {presence.length ? (
                presence.map((person) => (
                  <div className="project-settings-member" key={person.userId}>
                    <div className="project-settings-avatar">
                      {person.avatarUrl ? (
                        <img src={person.avatarUrl} alt="" />
                      ) : (
                        (person.username || "U").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="project-settings-member-copy">
                      <strong>{person.username || "Unknown user"}</strong>
                      <span>
                        {String(person.userId) === String(user.id)
                          ? "You"
                          : person.viewingFileId
                            ? "Viewing a file"
                            : "In project"}
                      </span>
                    </div>
                    {String(person.userId) === String(user.id) && (
                      <SettingPill tone="success">You</SettingPill>
                    )}
                  </div>
                ))
              ) : (
                <div className="project-settings-empty">
                  No other members are currently online.
                </div>
              )}
            </div>
            <div className="project-settings-inline-note">
              <SettingsIcon type="users" />
              <span>
                Invite, remove, and role-change controls should be backed by
                ProjectMember / ProjectInvitation endpoints before they are
                enabled.
              </span>
            </div>
          </div>
        );

      case "roles":
        return (
          <div className="project-settings-card project-settings-table-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Roles & permissions</h4>
                <p>Current UI permission model for this workspace.</p>
              </div>
            </div>
            <div className="project-settings-table-wrap">
              <table className="project-settings-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Owner</th>
                    <th>Admin</th>
                    <th>Editor</th>
                    <th>Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {SETTING_ROLE_ROWS.map(([label, ...values]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      {values.map((allowed, index) => (
                        <td key={`${label}-${index}`}>{allowed ? "✓" : "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "invitations":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Invitations</h4>
                <p>
                  Invitation management is intentionally read-only until the
                  invitation service is connected to this screen.
                </p>
              </div>
            </div>
            <div className="project-settings-empty large">
              <SettingsIcon type="users" />
              <strong>
                No invitation data available in the current ProjectPage API.
              </strong>
              <span>
                Connect ProjectInvitation endpoints to enable invite, resend,
                cancel, and accept tracking here.
              </span>
            </div>
          </div>
        );

      case "file-access":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>File & folder access</h4>
                <p>
                  Permission inheritance remains enforced by the existing file
                  access model.
                </p>
              </div>
            </div>
            <div className="project-settings-access-flow">
              <div>
                <span>1</span>
                <strong>Project</strong>
                <small>Default permissions</small>
              </div>
              <b>→</b>
              <div>
                <span>2</span>
                <strong>Folder</strong>
                <small>Optional override</small>
              </div>
              <b>→</b>
              <div>
                <span>3</span>
                <strong>File</strong>
                <small>Optional override</small>
              </div>
            </div>
            <div className="project-settings-inline-note">
              <SettingsIcon type="shield" />
              <span>
                Use the file tree's existing permission controls for individual
                resources. This section documents the inheritance model without
                bypassing server authorization.
              </span>
            </div>
          </div>
        );

      case "collaboration":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Collaboration</h4>
                <p>
                  Control the server-enforced realtime collaboration features
                  for this project.
                </p>
              </div>
            </div>
            <SettingsRow
              title="Realtime collaboration"
              description="Keep the project connected to live socket updates."
            >
              <Toggle
                checked={settings.collaboration}
                onChange={(v) => onSettingChange("collaboration", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Presence"
              description="Show members who are currently active."
            >
              <Toggle
                checked={settings.presence}
                onChange={(v) => onSettingChange("presence", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="File locking"
              description="Use the existing single-editor lock workflow."
            >
              <Toggle
                checked={settings.fileLocking}
                onChange={(v) => onSettingChange("fileLocking", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Team chat"
              description="Show the project chat control and panel."
            >
              <Toggle
                checked={settings.teamChat}
                onChange={(v) => onSettingChange("teamChat", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
          </div>
        );

      case "chat":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Team Chat</h4>
                <p>
                  Project chat preferences. The existing socket chat service
                  remains authoritative for messages.
                </p>
              </div>
            </div>
            <SettingsRow
              title="Enable team chat"
              description="Allow the chat panel to be opened from the workspace."
            >
              <Toggle
                checked={settings.teamChat}
                onChange={(v) => onSettingChange("teamChat", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Chat notifications"
              description="Show unread chat indicators in the workspace."
            >
              <Toggle
                checked={settings.chatNotifications}
                onChange={(v) => onSettingChange("chatNotifications", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
          </div>
        );

      case "github":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>GitHub</h4>
                <p>
                  GitHub account connection is separate from CodeSpace
                  authentication.
                </p>
              </div>
              <SettingPill>Separate connection</SettingPill>
            </div>
            <div className="project-settings-github">
              <div className="project-settings-github-icon">
                <SettingsIcon type="github" />
              </div>
              <div>
                <strong>GitHub integration</strong>
                <span>
                  Connect your GitHub account from the Dashboard import flow.
                </span>
              </div>
            </div>
            <div className="project-settings-inline-note">
              <SettingsIcon type="info" />
              <span>
                Repository import and account-linking APIs are not part of the
                current ProjectPage service contract, so this screen does not
                fake connection state.
              </span>
            </div>
          </div>
        );

      case "repository":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Repository</h4>
                <p>
                  Repository metadata currently available on the loaded project.
                </p>
              </div>
            </div>
            <div className="project-settings-readonly-grid">
              <div>
                <span>Repository</span>
                <strong>
                  {project?.repository?.fullName ||
                    project?.githubRepository?.fullName ||
                    project?.repositoryName ||
                    "Not connected"}
                </strong>
              </div>
              <div>
                <span>Branch</span>
                <strong>
                  {project?.repository?.defaultBranch ||
                    project?.githubRepository?.defaultBranch ||
                    project?.defaultBranch ||
                    "main"}
                </strong>
              </div>
              <div>
                <span>URL</span>
                <strong className="truncate">
                  {project?.repository?.url ||
                    project?.githubRepository?.url ||
                    project?.repositoryUrl ||
                    "—"}
                </strong>
              </div>
            </div>
          </div>
        );

      case "editor":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Editor</h4>
                <p>Preferences used by the Monaco editor.</p>
              </div>
            </div>
            <SettingsRow title="Minimap" description="Show the code minimap.">
              <Toggle
                checked={settings.minimap}
                onChange={(v) => onSettingChange("minimap", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Word wrap"
              description="Wrap long lines inside the editor."
            >
              <Toggle
                checked={settings.wordWrap}
                onChange={(v) => onSettingChange("wordWrap", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Format on save"
              description="Preference only until a formatter is configured for the project."
            >
              <Toggle
                checked={settings.formatOnSave}
                onChange={(v) => onSettingChange("formatOnSave", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Auto save"
              description="Preference only; automatic server saves are not enabled by this page."
            >
              <Toggle
                checked={settings.autoSave}
                onChange={(v) => onSettingChange("autoSave", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
          </div>
        );

      case "appearance":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Appearance</h4>
                <p>Workspace editor appearance.</p>
              </div>
            </div>
            <div className="project-settings-theme-grid">
              <button
                type="button"
                className={`project-settings-theme-option ${theme === "vs-dark" ? "is-active" : ""}`}
                onClick={() => onThemeChange("vs-dark")}
              >
                <span className="theme-preview dark" />
                <strong>Dark</strong>
                <small>VS Code Dark</small>
              </button>
              <button
                type="button"
                className={`project-settings-theme-option ${theme === "vs-light" ? "is-active" : ""}`}
                onClick={() => onThemeChange("vs-light")}
              >
                <span className="theme-preview light" />
                <strong>Light</strong>
                <small>VS Code Light</small>
              </button>
            </div>
          </div>
        );

      case "files":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Files</h4>
                <p>File explorer behavior.</p>
              </div>
            </div>
            <SettingsRow
              title="Show hidden files"
              description="Keep hidden files visible in the explorer."
            >
              <Toggle
                checked={settings.showHiddenFiles}
                onChange={(v) => onSettingChange("showHiddenFiles", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Confirm file deletion"
              description="Ask before destructive file operations."
            >
              <Toggle
                checked={settings.confirmDelete}
                onChange={(v) => onSettingChange("confirmDelete", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
          </div>
        );

      case "notifications":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Notifications</h4>
                <p>Choose which collaboration indicators are shown.</p>
              </div>
            </div>
            <SettingsRow
              title="Member joined / left"
              description="Presence changes."
            >
              <Toggle
                checked={settings.memberJoinNotifications}
                onChange={(v) => onSettingChange("memberJoinNotifications", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="File lock changes"
              description="Lock acquired/released activity."
            >
              <Toggle
                checked={settings.fileLockNotifications}
                onChange={(v) => onSettingChange("fileLockNotifications", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
            <SettingsRow
              title="Chat messages"
              description="Unread chat indicators."
            >
              <Toggle
                checked={settings.chatNotifications}
                onChange={(v) => onSettingChange("chatNotifications", v)}
                disabled={!canManageSettings}
              />
            </SettingsRow>
          </div>
        );

      case "security":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Security</h4>
                <p>
                  Security controls that are already enforced by the server.
                </p>
              </div>
            </div>
            <SettingsRow
              title="Server-side authorization"
              description="Permissions must be validated by the backend."
            >
              <SettingPill tone="success">Enforced</SettingPill>
            </SettingsRow>
            <SettingsRow
              title="Project membership"
              description="Project socket access is checked against membership."
            >
              <SettingPill tone="success">Enforced</SettingPill>
            </SettingsRow>
            <SettingsRow
              title="File locks"
              description="Lock ownership is coordinated through the project socket."
            >
              <SettingPill tone="success">Enforced</SettingPill>
            </SettingsRow>
          </div>
        );

      case "activity":
        return (
          <div className="project-settings-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Activity</h4>
                <p>
                  Live activity visible from the current collaboration session.
                </p>
              </div>
            </div>
            <div className="project-settings-activity">
              {presence.length ? (
                presence.map((person) => (
                  <div key={person.userId}>
                    <span className="activity-dot" />
                    <strong>{person.username || "User"}</strong>
                    <span>
                      {person.viewingFileId
                        ? "is viewing a file"
                        : "is in the project"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="project-settings-empty">
                  No live activity right now.
                </div>
              )}
            </div>
          </div>
        );

      case "danger":
        return (
          <div className="project-settings-danger-card">
            <div className="project-settings-card-head">
              <div>
                <h4>Danger Zone</h4>
                <p>
                  Destructive project operations must be implemented through
                  authenticated server endpoints.
                </p>
              </div>
            </div>
            <div className="project-settings-danger-row">
              <div>
                <strong>Transfer ownership</strong>
                <span>Move project ownership to another member.</span>
              </div>
              <button type="button" disabled={!canManageSettings}>
                Transfer
              </button>
            </div>
            <div className="project-settings-danger-row">
              <div>
                <strong>Archive project</strong>
                <span>Hide the project without deleting its files.</span>
              </div>
              <button type="button" disabled={!canManageSettings}>
                Archive
              </button>
            </div>
            <div className="project-settings-danger-row">
              <div>
                <strong>Delete project</strong>
                <span>Permanently delete the project and its files.</span>
              </div>
              <button
                type="button"
                className="danger"
                disabled={
                  !canManageSettings ||
                  typeof fileService.deleteProject !== "function"
                }
                title={
                  typeof fileService.deleteProject !== "function"
                    ? "Delete API is not available in fileService"
                    : "Delete project"
                }
              >
                Delete
              </button>
            </div>
            <div className="project-settings-inline-note warning">
              <SettingsIcon type="info" />
              <span>
                Delete / archive / transfer controls stay disabled until the
                corresponding server methods exist. This prevents a UI-only
                destructive action from creating inconsistent project state.
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {open && (
        <div
          className="project-settings-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Project settings"
        >
          <div className="project-settings-shell">
            <header className="project-settings-header">
              <div className="project-settings-header-left">
                <button
                  type="button"
                  className="project-settings-back"
                  onClick={onClose}
                  title="Back to project"
                >
                  <SettingsIcon type="back" />
                </button>
                <div>
                  <span>Project Settings</span>
                  <strong>{project?.name || "Project"}</strong>
                </div>
              </div>
              <button
                type="button"
                className="project-settings-close"
                onClick={onClose}
                title="Close settings"
                aria-label="Close settings"
              >
                <SettingsIcon type="close" />
              </button>
            </header>

            <div className="project-settings-body">
              <aside className="project-settings-sidebar">
                {Object.entries(settingsGroups).map(([group, items]) => (
                  <div className="project-settings-nav-group" key={group}>
                    <div className="project-settings-nav-label">{group}</div>
                    {items.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`project-settings-nav-item ${settingsSection === item.id ? "is-active" : ""} ${item.id === "danger" ? "is-danger" : ""}`}
                        onClick={() => onSectionChange(item.id)}
                      >
                        <SettingsIcon
                          type={
                            item.id === "members" || item.id === "invitations"
                              ? "users"
                              : item.id === "roles" || item.id === "security"
                                ? "shield"
                                : item.id === "file-access" ||
                                    item.id === "files"
                                  ? "folder"
                                  : item.id === "collaboration" ||
                                      item.id === "chat"
                                    ? "collaboration"
                                    : item.id === "github"
                                      ? "github"
                                      : item.id === "repository"
                                        ? "git"
                                        : item.id === "editor" ||
                                            item.id === "appearance"
                                          ? "editor"
                                          : item.id === "notifications"
                                            ? "bell"
                                            : item.id === "activity"
                                              ? "activity"
                                              : item.id === "danger"
                                                ? "trash"
                                                : "info"
                          }
                        />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </aside>

              <main className="project-settings-content">
                <div className="project-settings-content-head">
                  <div>
                    <span className="project-settings-eyebrow">
                      {activeSettingsSection.group}
                    </span>
                    <h2>{activeSettingsSection.label}</h2>
                    <p>
                      Configure this CodeSpace project without leaving your
                      workspace.
                    </p>
                  </div>
                  <div className="project-settings-content-actions">
                    {settingsSaved && (
                      <SettingPill tone="success">Saved</SettingPill>
                    )}
                    <button
                      type="button"
                      className="project-settings-save"
                      onClick={onSave}
                      disabled={!canManageSettings}
                    >
                      Save changes
                    </button>
                  </div>
                </div>

                {settingsNotice && (
                  <div
                    className={`project-settings-notice ${settingsNotice.includes("not available") ? "is-warning" : ""}`}
                  >
                    <SettingsIcon
                      type={
                        settingsNotice.includes("not available")
                          ? "info"
                          : "shield"
                      }
                    />
                    <span>{settingsNotice}</span>
                  </div>
                )}

                <div className="project-settings-scroll">
                  {renderSettingsContent()}
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
