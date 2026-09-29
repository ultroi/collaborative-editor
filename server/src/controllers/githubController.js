const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const File = require('../models/File');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { PROJECT_ROLES } = require('../../../shared/constants/roles');
const { githubApi } = require('../utils/oauthProviders');

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 5000;

function safeProjectName(name) {
  const cleaned = String(name || 'GitHub Project')
    .replace(/[^\w .-]/g, '')
    .trim()
    .slice(0, 80);

  return cleaned || 'GitHub Project';
}

function languageFromPath(path) {
  const ext = path.includes('.') ? path.split('.').pop().toLowerCase() : '';

  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    sql: 'sql',
    sh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
  };

  return map[ext] || null;
}

function assertSafeRelativePath(path) {
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.split('/').some((part) => part === '..' || part === '.')
  ) {
    throw ApiError.badRequest('GitHub repository contains an invalid path');
  }
}

function shouldSkipPath(path) {
  return path.split('/').some((part) => IGNORED_DIRS.has(part));
}

function decodeBlob(blob) {
  if (blob.size > MAX_FILE_BYTES) {
    return null;
  }

  if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {
    return null;
  }

  const buffer = Buffer.from(blob.content.replace(/\n/g, ''), 'base64');

  // Do not put binary data into the text editor.
  if (buffer.includes(0)) {
    return null;
  }

  return buffer.toString('utf8');
}

const listGithubRepositories = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+githubAccessToken');

  if (!user?.githubAccessToken) {
    throw ApiError.badRequest('Connect GitHub before listing repositories');
  }

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const perPage = Math.min(
    Math.max(Number.parseInt(req.query.perPage, 10) || 30, 1),
    100
  );

  const repositories = await githubApi(
    `/user/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
    user.githubAccessToken
  );

  new ApiResponse(200, {
    repositories: repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: Boolean(repo.private),
      defaultBranch: repo.default_branch,
      htmlUrl: repo.html_url,
      updatedAt: repo.updated_at,
      owner: repo.owner?.login || null,
    })),
    page,
    perPage,
  }).send(res);
});

const githubConnectionStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '+githubAccessToken githubId'
  );

  new ApiResponse(200, {
    connected: Boolean(user?.githubId && user?.githubAccessToken),
    githubId: user?.githubId || null,
  }).send(res);
});

const importGithubRepository = asyncHandler(async (req, res) => {
  const { owner, repo, branch } = req.body;

  if (!owner || !repo) {
    throw ApiError.badRequest('owner and repo are required');
  }

  const user = await User.findById(req.user._id).select('+githubAccessToken');

  if (!user?.githubAccessToken) {
    throw ApiError.badRequest('Connect GitHub before importing a repository');
  }

  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);

  const repository = await githubApi(
    `/repos/${encodedOwner}/${encodedRepo}`,
    user.githubAccessToken
  );

  const selectedBranch = branch || repository.default_branch;

  const tree = await githubApi(
    `/repos/${encodedOwner}/${encodedRepo}/git/trees/${encodeURIComponent(
      selectedBranch
    )}?recursive=1`,
    user.githubAccessToken
  );

  if (tree.truncated) {
    throw ApiError.badRequest(
      'GitHub returned a truncated repository tree. Import a smaller repository or branch.'
    );
  }

  const entries = (tree.tree || [])
    .filter((entry) => entry.type === 'blob' && entry.path)
    .filter((entry) => !shouldSkipPath(entry.path))
    .slice(0, MAX_FILES);

  if (!entries.length) {
    throw ApiError.badRequest('No importable text files were found');
  }

  const project = await Project.create({
    name: safeProjectName(repository.name),
    description:
      repository.description ||
      `Imported from GitHub: ${repository.full_name}`,
    ownerId: req.user._id,
    memberIds: [req.user._id],
  });

  await ProjectMember.create({
    projectId: project._id,
    userId: req.user._id,
    role: PROJECT_ROLES.OWNER,
  });

  const pathToId = new Map();

  try {
    const directories = new Set();

    for (const entry of entries) {
      const parts = entry.path.split('/');
      parts.pop();

      for (let i = 1; i <= parts.length; i += 1) {
        directories.add(parts.slice(0, i).join('/'));
      }
    }

    const sortedDirectories = [...directories].sort(
      (a, b) => a.split('/').length - b.split('/').length
    );

    for (const dirPath of sortedDirectories) {
      assertSafeRelativePath(dirPath);

      const parts = dirPath.split('/');
      const name = parts.pop();
      const parentPath = parts.join('/') || null;
      const parentId = parentPath ? pathToId.get(parentPath) : null;

      const node = await File.create({
        projectId: project._id,
        parentId,
        name,
        path: dirPath,
        type: 'folder',
        content: '',
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      pathToId.set(dirPath, node._id);
    }

    for (const entry of entries) {
      assertSafeRelativePath(entry.path);

      const parts = entry.path.split('/');
      const name = parts.pop();
      const parentPath = parts.join('/') || null;
      const parentId = parentPath ? pathToId.get(parentPath) : null;

      const blob = await githubApi(
        `/repos/${encodedOwner}/${encodedRepo}/git/blobs/${entry.sha}`,
        user.githubAccessToken
      );

      const content = decodeBlob(blob);

      if (content === null) {
        continue;
      }

      const node = await File.create({
        projectId: project._id,
        parentId,
        name,
        path: entry.path,
        type: 'file',
        content,
        language: languageFromPath(entry.path),
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      pathToId.set(entry.path, node._id);
    }
  } catch (error) {
    await File.deleteMany({ projectId: project._id });
    await ProjectMember.deleteMany({ projectId: project._id });
    await Project.deleteOne({ _id: project._id });
    throw error;
  }

  new ApiResponse(
    201,
    {
      project,
      imported: pathToId.size,
      repository: {
        fullName: repository.full_name,
        branch: selectedBranch,
      },
    },
    'GitHub repository imported'
  ).send(res);
});

module.exports = {
  listGithubRepositories,
  githubConnectionStatus,
  importGithubRepository,
};
