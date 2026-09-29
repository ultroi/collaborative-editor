# CodeMesh — Phases 1 & 3: Foundation + File System

Real-time collaborative code editor platform. This covers Phase 1
(auth, projects, roles) and Phase 3 (file/folder tree, permission
resolver). No Monaco editor or Socket.IO real-time layer yet — that's
Phases 4 and 5.

## Stack

- **Server**: Node.js, Express, MongoDB/Mongoose, JWT (access + rotating
  refresh token in an httpOnly cookie), Zod validation, Helmet, rate
  limiting.
- **Client**: React 18, Vite, React Router. Access token kept in memory only
  (never localStorage) and refreshed silently via the httpOnly cookie.

## What's implemented

- Register / login / logout / silent session refresh
- `User`, `Project`, `ProjectMember` models with proper indexes
- Role-based project access: **owner > admin > member**, enforced entirely
  server-side (`requireProjectRole` middleware) — the frontend never
  decides permissions, only reflects what the API returns
- Project CRUD (create, list mine, get, update, archive)
- Member management (add / change role / remove), with the owner protected
  from demotion or removal
- Centralized error handling with a consistent `{ success, data, message }`
  response envelope
- `shared/constants/roles.js` — single source of truth for role names,
  imported by both the server and (eventually) the client, so they can't
  drift apart

**Phase 3 — File System:**

- `File` model — a single collection for both files and folders, with a
  denormalized `path` field kept in sync on create/rename/move, and a
  uniqueness index preventing two siblings sharing a name
- `Permission` model — explicit per-user read/write overrides on a folder
  or file, layered on top of the project role
- `resolveFileAccess()` (`utils/permissionResolver.js`) — walks from a node
  up through its ancestor folders to find the nearest explicit override;
  falls back to the role default (owner/admin: full access everywhere;
  member: read-only) if none exists anywhere in the chain
- Path-traversal guard (`utils/pathUtils.js`) — rejects `..`, `.`, and any
  name containing `/` or `\`, both at the Mongoose schema level and again
  explicitly in the controller
- Full file/folder CRUD: create, rename (cascades path updates to every
  descendant of a renamed folder), delete (cascading for folders, with
  orphaned Permission rows cleaned up), get/save content
- `GET /projects/:id/files` returns the whole tree pre-annotated with each
  node's effective `{read, write}` for the caller, resolved in one batched
  pass rather than one DB round-trip per node
- Client: a file-tree sidebar (create/rename/delete, permission-aware —
  write controls only render where the user actually has write access)
  wired to a basic content viewer/editor at `/project/:id`. This is a plain
  `<textarea>`, not Monaco yet — that's Phase 4. It's also last-write-wins;
  the file-locking that prevents two people clobbering the same file is
  Phase 5.

## Running it locally

```bash
# 1. Install
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
# Fill in MONGODB_URI (local mongod or an Atlas cluster) and generate
# JWT_ACCESS_SECRET / JWT_REFRESH_SECRET with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Run both
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

The server module graph and the client production build have both been
verified to build/load cleanly, and every route (including the new file
routes) has been confirmed to register correctly. I was not able to test
the full request flow against a live MongoDB in this sandbox — there's no
`mongod` available, and `mongodb-memory-server`'s binary download is
blocked by the environment's network allowlist. The path-traversal guard
and path-building logic *were* unit-tested directly (see the guard reject
`../`, `.`, `..`, and embedded separators correctly). Run a smoke test
against your own DB — especially the permission-inheritance walk and the
folder-rename cascade — before building further on top of it.

## Next: Phase 2 → Phase 4

- Phase 2 (project settings screens at `/project/:id/settings`) can reuse
  the member-management and now the permission-management endpoints
  already built.
- Phase 4 (Code Editor) swaps the placeholder `<textarea>` in `ProjectPage`
  for Monaco — the content load/save API it needs already exists.

## Project structure

```
collaborative-editor/
├── client/          React + Vite frontend
├── server/          Express + MongoDB backend
└── shared/
    └── constants/roles.js   role names shared by both
```
