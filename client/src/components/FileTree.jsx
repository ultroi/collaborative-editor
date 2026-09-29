import { useEffect, useMemo, useRef, useState } from "react";
import FileTreeNode from "./FileTreeNode";
import { buildTree } from "../utils/buildTree";
import * as fileService from "../services/fileService";
import { getErrorMessage } from "../utils/getErrorMessage";

function Icon({ name, size = 15 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    rename: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    cut: (
      <>
        <circle cx="6" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <path d="m8 7 11 11" />
        <path d="m8 17 5-5" />
        <path d="m13 12 6-6" />
      </>
    ),
    paste: (
      <>
        <path d="M9 4h6" />
        <path d="M9 4a2 2 0 0 0-2 2v14h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2" />
        <path d="M9 4V3h6v1" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H19A2 2 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.file}</svg>;
}

function findNode(tree, id) {
  for (const node of tree) {
    if (node._id === id) return node;

    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function containsNode(root, id) {
  if (!root) return false;
  if (root._id === id) return true;
  return (root.children || []).some((child) => containsNode(child, id));
}

function splitExtension(name = "") {
  const index = name.lastIndexOf(".");
  if (index <= 0) return { stem: name, ext: "" };
  return { stem: name.slice(0, index), ext: name.slice(index) };
}

function makeCopyName(name, siblings = []) {
  const used = new Set(
    siblings.map((node) => String(node.name || "").toLowerCase()),
  );

  if (!used.has(name.toLowerCase())) return name;

  const { stem, ext } = splitExtension(name);

  for (let index = 1; index < 9999; index += 1) {
    const suffix = index === 1 ? " copy" : ` copy ${index}`;
    const candidate = `${stem}${suffix}${ext}`;

    if (!used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${stem} copy${ext}`;
}

export default function FileTree({
  projectId,
  canManageRoot,
  selectedId,
  onSelect,
  locks = {},
  userById = {},
  treeVersion = 0,
  openFile,
  closeFile,
  acquireLock,
  releaseLock,
  currentUserId,
}) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creatingType, setCreatingType] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);

  const [menu, setMenu] = useState(null);
  const [menuLockInfo, setMenuLockInfo] = useState(null); // <-- ADDED state to hold lock info
  const menuRef = useRef(null);

  const [renamingId, setRenamingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [clipboard, setClipboard] = useState(null);
  const [clipboardBusy, setClipboardBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const flat = await fileService.getTree(projectId);
      setNodes(flat);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load files"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, treeVersion]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenu(null);
        setMenuLockInfo(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenu(null);
        setMenuLockInfo(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const rootSiblings = tree;

  const handleNewFileClick = () => {
    setError(null);
    setCreatingType("file");
    setInputValue("");
  };

  const handleNewFolderClick = () => {
    setError(null);
    setCreatingType("folder");
    setInputValue("");
  };

  const cancelRootCreation = () => {
    if (creating) return;
    setCreatingType(null);
    setInputValue("");
  };

  const submitRootNode = async () => {
    const name = inputValue.trim();
    if (!name || !creatingType || creating) return;

    setCreating(true);
    setError(null);

    try {
      await fileService.createNode(projectId, {
        name,
        type: creatingType,
        parentId: null,
      });

      setCreatingType(null);
      setInputValue("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, `Could not create ${creatingType}`));
    } finally {
      setCreating(false);
    }
  };

  const handleRootInputKeyDown = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await submitRootNode();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelRootCreation();
    }
  };

  const openActionMenu = (node, element, lockInfo = null) => {
    const rect = element.getBoundingClientRect();
    const menuWidth = 204;
    const extraHeight = lockInfo?.isLocked ? 36 : 0;
    const menuEstimatedHeight =
      (node.type === "folder" ? 310 : 262) + extraHeight;
    const gap = 6;

    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );

    const top = Math.max(
      8,
      Math.min(rect.bottom + gap, window.innerHeight - menuEstimatedHeight - 8),
    );

    setMenu({ node, left, top });
    setMenuLockInfo(lockInfo); // <-- Update state
  };

  const handleCopy = (node) => {
    setClipboard({ node, mode: "copy" });
    setMenu(null);
    showToast(`Copied "${node.name}"`, "copy");
  };

  const handleCut = (node) => {
    if (!node.access?.write) {
      showToast("You do not have write access to cut this item.", "error");
      setMenu(null);
      return;
    }

    setClipboard({ node, mode: "cut" });
    setMenu(null);
    showToast(`Cut "${node.name}"`, "cut");
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await fileService.deleteNode(projectId, deleteTarget._id);

      if (containsNode(deleteTarget, selectedId)) {
        onSelect(null);
      }

      setDeleteTarget(null);
      await load();

      showToast(`Deleted "${deleteTarget.name}"`, "delete");
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete item"));
      showToast(getErrorMessage(err, "Could not delete item"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const finishFileWrite = async (fileId, content) => {
    if (!content) return;
    if (!openFile || !closeFile || !acquireLock || !releaseLock) {
      throw new Error("Collaboration lock support is unavailable for paste.");
    }

    const openAck = await openFile(fileId);
    if (openAck && openAck.ok === false) {
      throw new Error(openAck.error || "Could not open copied file.");
    }

    const lockResult = await acquireLock(fileId);
    if (!lockResult?.granted) {
      throw new Error("Could not obtain a write lock for the copied file.");
    }

    try {
      await fileService.saveFileContent(projectId, fileId, content);
    } finally {
      releaseLock(fileId);
      closeFile(fileId);
    }
  };

  const cloneNode = async (source, parentId, preferredName) => {
    const created = await fileService.createNode(projectId, {
      name: preferredName || source.name,
      type: source.type,
      parentId: parentId || null,
    });

    if (source.type === "file") {
      const response = await fileService.getFileContent(projectId, source._id);
      const fullNode = response?.node || response;
      const sourceContent = fullNode?.content ?? "";
      await finishFileWrite(created._id, sourceContent);
      return created;
    }

    for (const child of source.children || []) {
      await cloneNode(child, created._id, child.name);
    }

    return created;
  };

  const pasteInto = async (targetFolder = null) => {
    if (!clipboard || clipboardBusy) return;

    const source = clipboard.node;
    const destinationId = targetFolder?._id || null;
    const destination = targetFolder ? findNode(tree, destinationId) : null;

    if (targetFolder && targetFolder.type !== "folder") {
      showToast("Paste is only available inside folders.", "error");
      return;
    }

    if (
      clipboard.mode === "cut" &&
      destinationId &&
      containsNode(source, destinationId)
    ) {
      showToast("You cannot paste a folder inside itself.", "error");
      setMenu(null);
      return;
    }

    if (clipboard.mode === "cut" && source._id === destinationId) {
      showToast("Choose a different destination folder.", "error");
      return;
    }

    const siblings = targetFolder ? destination?.children || [] : rootSiblings;
    const name =
      clipboard.mode === "copy"
        ? makeCopyName(source.name, siblings)
        : source.name;

    setClipboardBusy(true);
    setMenu(null);
    setError(null);

    try {
      if (clipboard.mode === "cut") {
        const destinationHasSameName = siblings.some(
          (item) =>
            String(item.name || "").toLowerCase() ===
            String(name).toLowerCase(),
        );
        if (destinationHasSameName) {
          throw new Error(
            `A ${source.type} named "${name}" already exists here.`,
          );
        }
      }

      await cloneNode(source, destinationId, name);

      if (clipboard.mode === "cut") {
        await fileService.deleteNode(projectId, source._id);
        if (containsNode(source, selectedId)) {
          onSelect(null);
        }
        setClipboard(null);
      }

      await load();
      showToast(
        clipboard.mode === "cut"
          ? `Moved "${source.name}"`
          : `Pasted "${name}"`,
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not paste item"));
      showToast(getErrorMessage(err, "Could not paste item"), "error");
    } finally {
      setClipboardBusy(false);
    }
  };

  const handleRenameSubmit = async (node, nextName) => {
    const name = nextName.trim();
    if (!name || name === node.name) {
      setRenamingId(null);
      return;
    }
    try {
      await fileService.renameNode(projectId, node._id, name);
      setRenamingId(null);
      await load();
      showToast(`Renamed to "${name}"`);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not rename item"), "error");
    }
  };

  const handleMenuRename = () => {
    if (!menu?.node) return;
    setRenamingId(menu.node._id);
    setMenu(null);
  };

  const handleMenuDelete = () => {
    if (!menu?.node) return;
    setDeleteTarget(menu.node);
    setMenu(null);
  };

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <div className="file-tree-title">
          <span>Files</span>
          {clipboard && (
            <span
              className={`tree-clipboard-indicator ${clipboard.mode}`}
              title={`${clipboard.mode === "cut" ? "Cut" : "Copied"}: ${clipboard.node.name}`}
            >
              {clipboard.mode === "cut" ? "Cut" : "Copied"}
            </span>
          )}
        </div>

        <div
          className="tree-actions tree-actions-custom"
          aria-label="File explorer actions"
        >
          {canManageRoot && clipboard && (
            <button
              type="button"
              className="tree-action-btn"
              aria-label="Paste into project root"
              title="Paste into project root"
              onClick={() => pasteInto(null)}
              disabled={clipboardBusy}
            >
              <Icon name="paste" size={15} />
            </button>
          )}

          {canManageRoot && (
            <>
              <button
                type="button"
                className="tree-action-btn"
                aria-label="New file"
                title="New file"
                onClick={handleNewFileClick}
                disabled={Boolean(creatingType) || clipboardBusy}
              >
                <span className="tree-action-plus">+</span>
                <Icon name="file" size={14} />
              </button>

              <button
                type="button"
                className="tree-action-btn"
                aria-label="New folder"
                title="New folder"
                onClick={handleNewFolderClick}
                disabled={Boolean(creatingType) || clipboardBusy}
              >
                <span className="tree-action-plus">+</span>
                <Icon name="folder" size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {creatingType && (
        <div className="tree-row tree-create-row">
          <span className="tree-chevron-spacer" />
          <span className="tree-create-icon">
            <Icon
              name={creatingType === "folder" ? "folder" : "file"}
              size={14}
            />
          </span>
          <input
            type="text"
            autoFocus
            value={inputValue}
            className="inline-file-input"
            placeholder={
              creatingType === "folder" ? "Folder name" : "File name"
            }
            disabled={creating}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleRootInputKeyDown}
            onBlur={() => {
              if (!creating && !inputValue.trim()) cancelRootCreation();
            }}
          />
        </div>
      )}

      {loading && <p className="tree-hint">Loading…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && tree.length === 0 && !creatingType && (
        <p className="tree-hint">No files yet.</p>
      )}

      {tree.map((node) => (
        <FileTreeNode
          key={node._id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={handleMenuDelete}
          projectId={projectId}
          onTreeChange={load}
          locks={locks}
          userById={userById}
          renamingId={renamingId}
          currentUserId={currentUserId}
          onRenameSubmit={handleRenameSubmit}
          onRenameCancel={() => setRenamingId(null)}
          onOpenMenu={openActionMenu}
          pasteAvailable={Boolean(clipboard && canManageRoot)}
        />
      ))}

      {menu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ left: menu.left, top: menu.top }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="context-menu-header">
            {menu.node.type === "folder" ? "Folder" : "File"} {menu.node.name}
          </div>

          {/* Render User Status if Locked */}
          {menuLockInfo?.isLocked && (
            <>
              <button
                type="button"
                style={{
                  cursor: "default",
                  pointerEvents: "none",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: menuLockInfo.ownerColor,
                    }}
                  />
                  Working: {menuLockInfo.ownerName}
                </span>
              </button>
              <div
                style={{
                  height: "1px",
                  background: "#333333",
                  margin: "4px 0",
                }}
              />
            </>
          )}

          {menu.node.type === "file" && (
            <button
              type="button"
              onClick={() => {
                onSelect(menu.node);
                setMenu(null);
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Icon name="file" /> Open
              </span>
            </button>
          )}

          <button
            type="button"
            disabled={!menu.node.access?.write}
            onClick={handleMenuRename}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="rename" /> Rename
            </span>
          </button>

          <button type="button" onClick={() => handleCopy(menu.node)}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="copy" /> Copy
            </span>
            <span className="context-menu-shortcut">Ctrl+C</span>
          </button>

          <button
            type="button"
            disabled={!menu.node.access?.write}
            onClick={() => handleCut(menu.node)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="cut" /> Cut
            </span>
            <span className="context-menu-shortcut">Ctrl+X</span>
          </button>

          {menu.node.type === "folder" && (
            <button
              type="button"
              disabled={!menu.node.access?.write || !clipboard || clipboardBusy}
              onClick={() => pasteInto(menu.node)}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Icon name="paste" /> Paste here
              </span>
              <span className="context-menu-shortcut">Ctrl+V</span>
            </button>
          )}

          <div
            style={{ height: "1px", background: "#333333", margin: "4px 0" }}
          />

          <button
            type="button"
            disabled={!menu.node.access?.write}
            onClick={handleMenuDelete}
            style={{ color: "var(--vscode-error)" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="trash" /> Delete
            </span>
            <span
              className="context-menu-shortcut"
              style={{ color: "var(--vscode-error)" }}
            >
              Del
            </span>
          </button>
        </div>
      )}

      {deleteTarget && (
        <div
          className="tree-modal-backdrop"
          onMouseDown={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="tree-delete-dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="tree-delete-icon-wrap">
              <Icon name="trash" size={18} />
            </div>

            <div className="tree-delete-copy">
              <h3>
                Delete {deleteTarget.type === "folder" ? "folder" : "file"}?
              </h3>
              <p>
                {deleteTarget.type === "folder"
                  ? `"${deleteTarget.name}" and everything inside it will be removed.`
                  : `"${deleteTarget.name}" will be permanently removed.`}
              </p>
            </div>

            <div className="tree-delete-actions">
              <button
                type="button"
                className="tree-dialog-btn secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tree-dialog-btn danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`tree-toast ${toast.type}`} role="status">
          <div className="tree-toast-icon">
            {toast.type === "copy" && <Icon name="copy" size={14} />}
            {toast.type === "cut" && <Icon name="cut" size={14} />}
            {toast.type === "delete" && <Icon name="trash" size={14} />}
            {toast.type === "error" && <span>!</span>}
            {toast.type === "info" && <span>✓</span>}
          </div>

          <div className="tree-toast-content">
            <span className="tree-toast-title">
              {toast.type === "copy" && "Copied"}
              {toast.type === "cut" && "Cut"}
              {toast.type === "delete" && "Deleted"}
              {toast.type === "error" && "Action failed"}
              {toast.type === "info" && "Done"}
            </span>

            <span className="tree-toast-message">
              {toast.message
                .replace(/^Copied\s*/, "")
                .replace(/^Cut\s*/, "")
                .replace(/^Deleted\s*/, "")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
