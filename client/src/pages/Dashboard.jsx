import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/useAuth";
import { getErrorMessage } from "../utils/getErrorMessage";
import * as githubService from "../services/githubService";
import "../styles/dashboard.css";

// --- SVG Icon Helper ---
function Icon({ name, size = 16, className = "", style = {} }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    style,
    "aria-hidden": true,
  };

  const paths = {
    code: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
    github: (
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </>
    ),
    close: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    signout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    external: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    unlink: (
      <>
        <path d="m18.84 12.25 1.72-1.71h-.01a5.001 5.001 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="m5.17 11.75-1.71 1.71a5.001 5.001 0 0 0 7.07 7.07l1.71-1.72" />
        <line x1="8" y1="2" x2="8" y2="5" />
        <line x1="2" y1="8" x2="5" y2="8" />
        <line x1="16" y1="2" x2="16" y2="5" />
        <line x1="19" y1="8" x2="22" y2="8" />
      </>
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

// --- Formatting Helpers ---
const formatUpdated = (date) => {
  if (!date) return "Recently";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "Recently";

  const diff = Date.now() - value.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name = "User") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const getDisplayName = (user) =>
  user?.name ||
  user?.fullName ||
  user?.displayName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.givenName ||
  user?.username ||
  "Developer";

const getProfileImage = (user) =>
  user?.avatar ||
  user?.avatarUrl ||
  user?.profilePicture ||
  user?.profileImage ||
  user?.picture ||
  user?.photoURL ||
  user?.photo ||
  null;

function ProfileAvatar({ src, initials, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={`avatar${className ? ` ${className}` : ""}${showImage ? " avatar-image" : ""}`}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

function extractGithubLogin(status) {
  if (!status) return "";
  return (
    status?.username ||
    status?.login ||
    status?.user?.login ||
    status?.user?.username ||
    status?.githubUsername ||
    status?.data?.username ||
    status?.data?.login ||
    status?.data?.user?.login ||
    status?.data?.githubUsername ||
    ""
  );
}

// --- Main Component ---
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated");

  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [openProjectMenu, setOpenProjectMenu] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [deletingProject, setDeletingProject] = useState(null);
  const [projectActionLoading, setProjectActionLoading] = useState(false);

  // --- GitHub State ---
  const [showGithubImport, setShowGithubImport] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubImporting, setGithubImporting] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubRepoSearch, setGithubRepoSearch] = useState("");
  const [selectedGithubRepo, setSelectedGithubRepo] = useState(null);
  const [githubError, setGithubError] = useState(null);

  // --- Profile Edit State ---
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", username: "" });
  const [profileDisplayName, setProfileDisplayName] = useState("");

  const loadProjects = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/projects");
      setProjects(data.data.projects || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load projects"));
    } finally {
      setLoading(false);
    }
  };

  const checkGithubStatus = async () => {
    try {
      const status = await githubService.getGithubStatus();
      const connected = Boolean(
        status?.connected ?? status?.githubConnected ?? status?.data?.connected,
      );
      setGithubConnected(connected);
      setGithubUsername(extractGithubLogin(status));
    } catch (err) {
      // Ignore initial check errors silently
    }
  };

  useEffect(() => {
    loadProjects();
    checkGithubStatus();
  }, []);

  useEffect(() => {
    setProfileDisplayName(getDisplayName(user));
  }, [user]);

  useEffect(() => {
    const handlePointerDown = () => {
      setOpenProjectMenu(null);
      setShowMenu(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpenProjectMenu(null);
      setShowMenu(false);
      if (!profileUpdating) setShowEditProfile(false);
      if (!projectActionLoading) {
        setEditingProject(null);
        setDeletingProject(null);
      }
      if (!creating) setShowCreate(false);
      if (!githubImporting) setShowGithubImport(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [creating, profileUpdating, projectActionLoading, githubImporting]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      await api.post("/projects", { name });
      setNewProjectName("");
      setShowCreate(false);
      await loadProjects({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create project"));
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...projects]
      .filter(
        (project) =>
          !query ||
          `${project.name || ""} ${project.description || ""}`
            .toLowerCase()
            .includes(query),
      )
      .sort((a, b) =>
        sortBy === "name"
          ? (a.name || "").localeCompare(b.name || "")
          : new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
      );
  }, [projects, search, sortBy]);

  const username = user?.username || "developer";
  const fullName = profileDisplayName || getDisplayName(user);
  const profileImage = getProfileImage(user);
  const accountRole = user?.role || user?.accountType || "Developer";
  const initials = getInitials(fullName);

  const handleEditProject = async (event) => {
    event.preventDefault();
    const name = editProjectName.trim();
    if (!editingProject || !name || projectActionLoading) return;
    setProjectActionLoading(true);
    setError(null);
    try {
      await api.patch(`/projects/${editingProject._id}`, { name });
      setEditingProject(null);
      setEditProjectName("");
      await loadProjects({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not update project"));
    } finally {
      setProjectActionLoading(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deletingProject || projectActionLoading) return;
    setProjectActionLoading(true);
    setError(null);
    try {
      await api.delete(`/projects/${deletingProject._id}`);
      setDeletingProject(null);
      await loadProjects({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete project"));
    } finally {
      setProjectActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const name = profileForm.name.trim();
    if (!name || profileUpdating) return;
    setProfileUpdating(true);
    setError(null);
    try {
      await api.patch("/users/profile", { name });
      setProfileDisplayName(name);
      setShowEditProfile(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update profile"));
    } finally {
      setProfileUpdating(false);
    }
  };

  // --- GitHub Handlers ---
  const connectGithub = () => {
    githubService.startGithubConnection();
  };

  const handleDisconnectGithub = async () => {
    if (githubLoading) return;
    setGithubLoading(true);
    setGithubError(null);
    try {
      if (githubService.disconnectGithub) {
        await githubService.disconnectGithub();
      } else {
        await api.post("/github/disconnect");
      }
      setGithubConnected(false);
      setGithubUsername("");
      setGithubRepos([]);
      setSelectedGithubRepo(null);
    } catch (err) {
      setGithubError(
        getErrorMessage(err, "Failed to disconnect GitHub account"),
      );
    } finally {
      setGithubLoading(false);
    }
  };

  const openGithubImport = async () => {
    setShowGithubImport(true);
    setGithubError(null);
    setGithubRepoSearch("");
    setSelectedGithubRepo(null);
    setGithubLoading(true);
    try {
      const status = await githubService.getGithubStatus();
      const connected = Boolean(
        status?.connected ?? status?.githubConnected ?? status?.data?.connected,
      );
      setGithubConnected(connected);
      let login = extractGithubLogin(status);
      setGithubUsername(login);

      if (!connected) return;

      const result = await githubService.listGithubRepositories();
      const repos =
        result?.repositories ||
        result?.repos ||
        result?.data?.repositories ||
        [];
      setGithubRepos(Array.isArray(repos) ? repos : []);

      if (!login && Array.isArray(repos) && repos.length > 0) {
        const ownerLogin = repos[0]?.owner?.login || repos[0]?.owner;
        if (typeof ownerLogin === "string") {
          setGithubUsername(ownerLogin);
        }
      }
    } catch (err) {
      setGithubError(getErrorMessage(err, "Could not connect to GitHub"));
    } finally {
      setGithubLoading(false);
    }
  };

  const refreshGithubRepositories = async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const result = await githubService.listGithubRepositories();
      const repos =
        result?.repositories ||
        result?.repos ||
        result?.data?.repositories ||
        [];
      setGithubRepos(Array.isArray(repos) ? repos : []);
    } catch (err) {
      setGithubError(
        getErrorMessage(err, "Could not load GitHub repositories"),
      );
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGithubImport = async () => {
    if (!selectedGithubRepo || githubImporting) return;
    setGithubImporting(true);
    setGithubError(null);
    try {
      const result = await githubService.importGithubRepository({
        owner: selectedGithubRepo.owner?.login || selectedGithubRepo.owner,
        repo: selectedGithubRepo.name,
        repositoryId: selectedGithubRepo.id,
      });
      const projectId =
        result?.project?._id || result?.data?.project?._id || result?.projectId;
      if (!projectId)
        throw new Error(
          "GitHub import completed but no project ID was returned.",
        );
      setShowGithubImport(false);
      await loadProjects({ silent: true });
      window.location.assign(`/project/${projectId}`);
    } catch (err) {
      setGithubError(getErrorMessage(err, "Could not import the repository"));
    } finally {
      setGithubImporting(false);
    }
  };

  const filteredGithubRepos = useMemo(() => {
    const query = githubRepoSearch.trim().toLowerCase();
    if (!query) return githubRepos;
    return githubRepos.filter((repo) =>
      `${repo.name || ""} ${repo.full_name || ""} ${repo.description || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [githubRepos, githubRepoSearch]);

  return (
    <div className="dashboard-shell">
      <header className="app-header">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark">
            <Icon name="code" size={16} />
          </span>
          <span className="brand-name">CodeSpace</span>
        </Link>

        <div className="header-actions">
          <div className="profile-wrap">
            <button
              type="button"
              className="profile-button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setShowMenu((value) => !value)}
              aria-expanded={showMenu}
            >
              <ProfileAvatar src={profileImage} initials={initials} />
              <span className="profile-name">{fullName}</span>
            </button>

            {showMenu && (
              <div
                className="profile-menu"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="profile-menu-head">
                  <ProfileAvatar
                    src={profileImage}
                    initials={initials}
                    className="profile-menu-avatar"
                  />
                  <div className="profile-menu-identity">
                    <strong>{fullName}</strong>
                    <span>@{username}</span>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="profile-detail-row">
                    <span>Full name</span>
                    <strong>{fullName}</strong>
                  </div>
                  <div className="profile-detail-row">
                    <span>Username</span>
                    <strong>@{username}</strong>
                  </div>
                  <div className="profile-detail-row">
                    <span>Email</span>
                    <strong>{user?.email || "Not provided"}</strong>
                  </div>
                  <div className="profile-detail-row">
                    <span>Role</span>
                    <strong>{accountRole}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={() => {
                    setShowMenu(false);
                    setProfileForm({
                      name:
                        fullName !== username && fullName !== "Developer"
                          ? fullName
                          : "",
                      username: user?.username || "",
                    });
                    setShowEditProfile(true);
                  }}
                >
                  <Icon name="edit" size={14} /> Edit profile
                </button>
                <button type="button" onClick={logout} className="menu-danger">
                  <Icon name="signout" size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-intro">
          <div>
            <p className="eyebrow">DEVELOPER WORKSPACE</p>
            <h1 className="welcome-heading">
              Welcome back,{" "}
              <span className="username-highlight">{fullName}</span>
            </h1>
            <p className="intro-copy">
              Your projects, code, and collaboration workspace are ready when
              you are.
            </p>
          </div>
          <div className="dashboard-create-actions">
            <button
  type="button"
  className="secondary-button github-connect-button"
  onClick={openGithubImport}
>
  <Icon name="github" size={16} />

  {githubConnected ? "GitHub Connected" : "Connect GitHub"}

  {githubConnected && (
    <span
      className="github-connected-dot"
      aria-hidden="true"
    />
  )}
</button>

            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreate(true)}
            >
              <Icon name="code" size={16} /> New project
            </button>
          </div>
        </section>

        {error && (
          <div className="alert form-error">
            <Icon name="close" size={16} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadProjects({ silent: true })}
            >
              Retry
            </button>
          </div>
        )}

        <section className="project-section">
          <div className="section-toolbar">
            <div className="section-heading">
              <h2>Your projects</h2>
              <span className="count-pill">{projects.length}</span>
            </div>
            <div className="toolbar-controls">
              <div className="search-box">
                <span>
                  <Icon name="search" size={14} />
                </span>
                <input
                  type="search"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearch("")}
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated">Recently updated</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="project-grid skeleton-grid">
              {[1, 2, 3].map((item) => (
                <div className="project-card skeleton-card" key={item}>
                  <div className="skeleton-icon skeleton" />
                  <div className="skeleton-title skeleton" />
                  <div className="skeleton-line skeleton" />
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-projects">
              <div className="empty-icon">
                <Icon name={search ? "search" : "code"} size={32} />
              </div>
              <h3>
                {search ? "No matching projects" : "Your workspace is empty"}
              </h3>
              <p>
                {search
                  ? "Try a different search term."
                  : "Create your first project and start building."}
              </p>
              {!search && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setShowCreate(true)}
                >
                  Create your first project
                </button>
              )}
            </div>
          ) : (
            <div className="project-grid">
              {filteredProjects.map((project) => (
                <article className="project-card" key={project._id}>
                  <div className="project-card-top">
                    <span className="project-icon">
                      <Icon name="code" size={18} />
                    </span>
                    <div className="project-card-top-actions">
                      <Link
                        className="project-open"
                        to={`/project/${project._id}`}
                        aria-label={`Open ${project.name}`}
                        title="Open project"
                      >
                        <Icon name="external" size={16} />
                      </Link>
                      <div className="project-menu-wrap">
                        <button
                          type="button"
                          className="project-menu-button"
                          aria-label={`Project actions for ${project.name}`}
                          aria-expanded={openProjectMenu === project._id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenProjectMenu(
                              openProjectMenu === project._id
                                ? null
                                : project._id,
                            );
                          }}
                        >
                          <Icon name="more" size={16} />
                        </button>
                        {openProjectMenu === project._id && (
                          <div
                            className="project-menu"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenProjectMenu(null);
                                setEditingProject(project);
                                setEditProjectName(project.name || "");
                              }}
                            >
                              <Icon name="edit" size={14} /> Rename project
                            </button>
                            <Link
                              to={`/project/${project._id}`}
                              onClick={() => setOpenProjectMenu(null)}
                            >
                              <Icon name="external" size={14} /> Open project
                            </Link>
                            <button
                              type="button"
                              className="project-menu-danger"
                              onClick={() => {
                                setOpenProjectMenu(null);
                                setDeletingProject(project);
                              }}
                            >
                              <Icon name="trash" size={14} /> Delete project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    className="project-card-main-link"
                    to={`/project/${project._id}`}
                  >
                    <div className="project-card-content">
                      <h3>{project.name}</h3>
                      <p>
                        {project.description || "No description added yet."}
                      </p>
                    </div>
                    <div className="project-card-footer">
                      <span className="project-status">
                        <i /> Active
                      </span>
                      <span className="project-meta">
                        {formatUpdated(project.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* --- Modals --- */}
      {showEditProfile && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !profileUpdating)
              setShowEditProfile(false);
          }}
        >
          <div className="create-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close"
              onClick={() => !profileUpdating && setShowEditProfile(false)}
            >
              <Icon name="close" size={20} />
            </button>
            <div className="modal-icon">
              <Icon name="user" size={24} />
            </div>
            <h2>Edit Profile</h2>
            <p className="modal-copy">Update your personal information.</p>
            <form onSubmit={handleUpdateProfile}>
              <div className="field">
                <label htmlFor="profile-name">Full Name</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon name="edit" size={14} />
                  </span>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="profile-username">Username</label>
                <div className="input-wrap profile-readonly-input">
                  <span className="input-icon">@</span>
                  <input
                    id="profile-username"
                    type="text"
                    value={profileForm.username}
                    readOnly
                  />
                </div>
                <small className="field-help">
                  Username is generated automatically for your account.
                </small>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowEditProfile(false)}
                  disabled={profileUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={profileUpdating}
                >
                  {profileUpdating ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProject && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !projectActionLoading)
              setEditingProject(null);
          }}
        >
          <div className="create-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close"
              onClick={() => !projectActionLoading && setEditingProject(null)}
            >
              <Icon name="close" size={20} />
            </button>
            <div className="modal-icon">
              <Icon name="edit" size={24} />
            </div>
            <h2>Edit project</h2>
            <p className="modal-copy">
              Update the project name shown across your workspace.
            </p>
            <form onSubmit={handleEditProject}>
              <div className="field">
                <label htmlFor="edit-project-name">Project name</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon name="code" size={14} />
                  </span>
                  <input
                    id="edit-project-name"
                    autoFocus
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingProject(null)}
                  disabled={projectActionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={projectActionLoading}
                >
                  {projectActionLoading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingProject && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !projectActionLoading)
              setDeletingProject(null);
          }}
        >
          <div
            className="create-modal delete-project-modal"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => !projectActionLoading && setDeletingProject(null)}
            >
              <Icon name="close" size={20} />
            </button>
            <div className="modal-icon modal-icon-danger">
              <Icon name="trash" size={24} />
            </div>
            <h2>Delete project?</h2>
            <p className="modal-copy">
              <strong>{deletingProject.name}</strong> will be permanently
              removed. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingProject(null)}
                disabled={projectActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={confirmDeleteProject}
                disabled={projectActionLoading}
              >
                {projectActionLoading ? "Deleting…" : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GitHub Import Modal --- */}
      {showGithubImport && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !githubImporting)
              setShowGithubImport(false);
          }}
        >
          <div
            className="create-modal github-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="github-import-title"
            style={{ maxWidth: 520, width: "min(520px, calc(100vw - 32px))" }}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => !githubImporting && setShowGithubImport(false)}
              aria-label="Close"
            >
              <Icon name="close" size={20} />
            </button>

            <div className="modal-icon">
              <Icon name="github" size={24} />
            </div>
            <h2 id="github-import-title">Import from GitHub</h2>
            <p className="modal-copy">
              {githubConnected
                ? "Choose a repository to import as a new CodeSpace project."
                : "Link your GitHub account to import repositories into CodeSpace."}
            </p>

            {githubError && (
              <div className="alert form-error">
                <Icon name="close" size={16} />
                <span>{githubError}</span>
                <button
                  type="button"
                  onClick={() => setGithubError(null)}
                  aria-label="Dismiss error"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}

            {githubLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "#8b949e",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    margin: "0 auto 12px",
                    border: "2.5px solid rgba(110,118,129,0.25)",
                    borderTopColor: "#58a6ff",
                    borderRadius: "50%",
                    animation: "github-spin 0.7s linear infinite",
                  }}
                />
                <p style={{ margin: 0, fontSize: 14 }}>Loading repositories…</p>
                <style>{`@keyframes github-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : !githubConnected ? (
              <div
                className="github-connect-panel"
                style={{ textAlign: "center", padding: "8px 0" }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 12px",
                    background: "rgba(110,118,129,0.12)",
                    color: "#c9d1d9",
                  }}
                >
                  <Icon name="github" size={40} />
                </div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "1.05rem",
                    color: "#e6edf3",
                  }}
                >
                  Connect your GitHub account
                </h3>
                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: 14,
                    color: "#8b949e",
                    lineHeight: 1.5,
                  }}
                >
                  CodeSpace needs repository access so you can import source
                  files and start coding right away.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={connectGithub}
                >
                  <Icon name="github" size={16} /> Connect GitHub
                </button>
              </div>
            ) : (
              <>
                {/* Connected account bar: username + disconnect */}
                <div
                  className="github-status-bar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    marginBottom: 14,
                    backgroundColor: "rgba(63, 185, 80, 0.08)",
                    border: "1px solid rgba(63, 185, 80, 0.22)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#3fb950",
                        boxShadow: "0 0 0 3px rgba(63, 185, 80, 0.2)",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#e6edf3",
                          lineHeight: 1.3,
                        }}
                      >
                        Connected to{" "}
                        {githubUsername ? `@${githubUsername}` : "GitHub"}
                      </strong>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#8b949e",
                          lineHeight: 1.3,
                        }}
                      >
                        {githubRepos.length}{" "}
                        {githubRepos.length === 1
                          ? "repository"
                          : "repositories"}{" "}
                        available
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnectGithub}
                    disabled={githubLoading || githubImporting}
                    title="Disconnect GitHub account"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 10px",
                      border: "1px solid rgba(244, 135, 113, 0.35)",
                      borderRadius: 6,
                      background: "rgba(244, 135, 113, 0.08)",
                      color: "#f48771",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor:
                        githubLoading || githubImporting
                          ? "not-allowed"
                          : "pointer",
                      opacity: githubLoading || githubImporting ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="unlink" size={13} />
                    Disconnect
                  </button>
                </div>

                {/* Search + refresh */}
                <div
                  className="github-toolbar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {/* Swapped "search-box" for "input-wrap" to inherit the strict modal padding */}
                  <div className="github-search-box input-wrap">
                    <span className="input-icon" aria-hidden="true">
                      <Icon name="search" size={14} />
                    </span>

                    <input
                      type="search"
                      placeholder="Search repositories…"
                      value={githubRepoSearch}
                      onChange={(e) => setGithubRepoSearch(e.target.value)}
                      disabled={githubImporting}
                    />

                    {githubRepoSearch && (
                      <button
                        type="button"
                        className="search-clear"
                        onClick={() => setGithubRepoSearch("")}
                        aria-label="Clear search"
                        style={{ right: 8 }}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={refreshGithubRepositories}
                    disabled={githubLoading || githubImporting}
                    title="Refresh repositories"
                    style={{ flexShrink: 0, padding: "0 10px", height: 36 }}
                  >
                    <Icon name="refresh" size={14} />
                  </button>
                </div>

                {/* Scrollable repo list */}
                <div
                  className="github-repository-list"
                  style={{
                    maxHeight: 280,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    marginBottom: 12,
                    paddingRight: 2,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(110, 118, 129, 0.45) transparent",
                  }}
                >
                  {filteredGithubRepos.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: "32px 16px",
                        gap: 8,
                        color: "#8b949e",
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(110,118,129,0.1)",
                          color: "#6e7681",
                          marginBottom: 4,
                        }}
                      >
                        <Icon
                          name={githubRepoSearch ? "search" : "github"}
                          size={28}
                        />
                      </div>
                      <strong style={{ fontSize: 15, color: "#c9d1d9" }}>
                        {githubRepoSearch
                          ? "No matching repositories"
                          : "No repositories found"}
                      </strong>
                      <small
                        style={{
                          fontSize: 13,
                          lineHeight: 1.45,
                          maxWidth: 280,
                        }}
                      >
                        {githubRepoSearch
                          ? "Try a different name or clear the search."
                          : "Your GitHub account doesn’t have any repositories yet, or they couldn’t be loaded."}
                      </small>
                      {!githubRepoSearch && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={refreshGithubRepositories}
                          disabled={githubLoading}
                          style={{ marginTop: 8 }}
                        >
                          <Icon name="refresh" size={14} /> Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredGithubRepos.map((repo) => {
                      const repoKey = repo.id || repo.full_name || repo.name;
                      const isSelected =
                        (selectedGithubRepo?.id ||
                          selectedGithubRepo?.full_name ||
                          selectedGithubRepo?.name) === repoKey;
                      const language = repo.language || null;
                      const stars =
                        typeof repo.stargazers_count === "number"
                          ? repo.stargazers_count
                          : null;
                      const isPrivate = Boolean(repo.private);

                      return (
                        <button
                          type="button"
                          key={repoKey}
                          className={`github-repository-row${isSelected ? " selected" : ""}`}
                          onClick={() => setSelectedGithubRepo(repo)}
                          disabled={githubImporting}
                          aria-pressed={isSelected}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            width: "100%",
                            padding: "10px 12px",
                            border: isSelected
                              ? "1px solid rgba(56, 139, 253, 0.35)"
                              : "1px solid transparent",
                            borderRadius: 8,
                            background: isSelected
                              ? "rgba(56, 139, 253, 0.1)"
                              : "rgba(110, 118, 129, 0.06)",
                            color: "inherit",
                            textAlign: "left",
                            cursor: githubImporting ? "not-allowed" : "pointer",
                            opacity: githubImporting ? 0.6 : 1,
                          }}
                        >
                          <span
                            style={{
                              display: "grid",
                              placeItems: "center",
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: isSelected
                                ? "rgba(56, 139, 253, 0.18)"
                                : "rgba(110, 118, 129, 0.12)",
                              color: isSelected ? "#58a6ff" : "#8b949e",
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            <Icon name="code" size={16} />
                          </span>
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <strong
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#e6edf3",
                                lineHeight: 1.3,
                                wordBreak: "break-all",
                              }}
                            >
                              {repo.full_name || repo.name}
                            </strong>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#8b949e",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {repo.description || "No description"}
                            </span>
                            <span
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: "6px 10px",
                                marginTop: 4,
                              }}
                            >
                              {isPrivate ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "rgba(210, 153, 34, 0.12)",
                                    color: "#d29922",
                                  }}
                                >
                                  <Icon name="lock" size={11} /> Private
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "rgba(63, 185, 80, 0.12)",
                                    color: "#3fb950",
                                  }}
                                >
                                  <Icon name="globe" size={11} /> Public
                                </span>
                              )}
                              {language && (
                                <span
                                  style={{ fontSize: 11, color: "#8b949e" }}
                                >
                                  {language}
                                </span>
                              )}
                              {stars !== null && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    fontSize: 11,
                                    color: "#8b949e",
                                  }}
                                >
                                  <Icon name="star" size={11} /> {stars}
                                </span>
                              )}
                            </span>
                          </span>
                          <span
                            style={{
                              display: "grid",
                              placeItems: "center",
                              width: 20,
                              height: 20,
                              flexShrink: 0,
                              marginTop: 6,
                              color: "#58a6ff",
                            }}
                            aria-hidden="true"
                          >
                            {isSelected ? (
                              <Icon name="check" size={16} />
                            ) : null}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {selectedGithubRepo && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      marginBottom: 12,
                      background: "rgba(56, 139, 253, 0.08)",
                      border: "1px solid rgba(56, 139, 253, 0.2)",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#58a6ff",
                        flexShrink: 0,
                      }}
                    >
                      Selected
                    </span>
                    <strong
                      style={{
                        color: "#e6edf3",
                        fontWeight: 550,
                        wordBreak: "break-all",
                        lineHeight: 1.3,
                      }}
                    >
                      {selectedGithubRepo.full_name || selectedGithubRepo.name}
                    </strong>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowGithubImport(false)}
                    disabled={githubImporting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleGithubImport}
                    disabled={!selectedGithubRepo || githubImporting}
                  >
                    {githubImporting ? (
                      "Importing…"
                    ) : (
                      <>
                        <Icon name="github" size={15} /> Import repository
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !creating) setShowCreate(false);
          }}
        >
          <div className="create-modal" role="dialog">
            <button
              type="button"
              className="modal-close"
              onClick={() => !creating && setShowCreate(false)}
            >
              <Icon name="close" size={20} />
            </button>
            <div className="modal-icon">
              <Icon name="code" size={24} />
            </div>
            <h2>Start something great.</h2>
            <p className="modal-copy">Give your project a name to begin.</p>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="project-name">Project name</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon name="code" size={14} />
                  </span>
                  <input
                    id="project-name"
                    autoFocus
                    type="text"
                    placeholder="e.g. portfolio-app"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
