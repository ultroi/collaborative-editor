const Project = require('../models/Project');

const {
  ApiError,
  ApiResponse,
  asyncHandler,
} = require('../utils');

const DEFAULT_SETTINGS = {
  visibility: 'private',

  collaboration: {
    enabled: true,

    presenceEnabled: true,

    fileLockingEnabled: true,

    teamChatEnabled: true,
  },

  editor: {
    autoSave: false,

    minimap: true,

    wordWrap: false,

    formatOnSave: false,
  },

  files: {
    confirmDelete: true,

    showHiddenFiles: true,
  },

  notifications: {
    memberJoin: true,

    fileLock: true,

    chat: true,
  },
};

function toPlainSettings(project) {
  const settings = project.settings?.toObject
    ? project.settings.toObject()
    : project.settings || {};

  return {
    visibility:
      settings.visibility ??
      DEFAULT_SETTINGS.visibility,

    collaboration: {
      ...DEFAULT_SETTINGS.collaboration,
      ...(settings.collaboration || {}),
    },

    editor: {
      ...DEFAULT_SETTINGS.editor,
      ...(settings.editor || {}),
    },

    files: {
      ...DEFAULT_SETTINGS.files,
      ...(settings.files || {}),
    },

    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(settings.notifications || {}),
    },
  };
}

function mergeSettings(current, patch) {
  return {
    visibility:
      patch.visibility !== undefined
        ? patch.visibility
        : current.visibility,

    collaboration: {
      ...current.collaboration,
      ...(patch.collaboration || {}),
    },

    editor: {
      ...current.editor,
      ...(patch.editor || {}),
    },

    files: {
      ...current.files,
      ...(patch.files || {}),
    },

    notifications: {
      ...current.notifications,
      ...(patch.notifications || {}),
    },
  };
}

const getProjectSettings = asyncHandler(
  async (req, res) => {
    const project =
      req.project ||
      (await Project.findById(req.params.projectId));

    if (!project) {
      throw new ApiError(
        404,
        'Project not found'
      );
    }

    res.json(
      new ApiResponse(
        200,
        {
          projectId: project._id,

          settings:
            toPlainSettings(project),
        }
      )
    );
  }
);

const updateProjectSettings = asyncHandler(
  async (req, res) => {
    const project =
      req.project ||
      (await Project.findById(req.params.projectId));

    if (!project) {
      throw new ApiError(
        404,
        'Project not found'
      );
    }

    const previous =
      toPlainSettings(project);

    const next =
      mergeSettings(
        previous,
        req.body
      );

    project.settings = next;

    await project.save();

    const io = req.app.get('io');

    if (io) {
      io
        .to(`project:${project._id}`)
        .emit(
          'project:settings_changed',
          {
            projectId:
              String(project._id),

            settings: next,

            changedBy: {
              userId:
                String(req.user._id),

              username:
                req.user.username,
            },
          }
        );
    }

    res.json(
      new ApiResponse(
        200,
        {
          projectId: project._id,

          settings: next,

          previousSettings:
            previous,
        },
        'Project settings updated'
      )
    );
  }
);

const resetProjectSettings = asyncHandler(
  async (req, res) => {
    const project =
      req.project ||
      (await Project.findById(req.params.projectId));

    if (!project) {
      throw new ApiError(
        404,
        'Project not found'
      );
    }

    project.settings =
      DEFAULT_SETTINGS;

    await project.save();

    const io = req.app.get('io');

    if (io) {
      io
        .to(`project:${project._id}`)
        .emit(
          'project:settings_changed',
          {
            projectId:
              String(project._id),

            settings:
              DEFAULT_SETTINGS,

            changedBy: {
              userId:
                String(req.user._id),

              username:
                req.user.username,
            },
          }
        );
    }

    res.json(
      new ApiResponse(
        200,
        {
          projectId:
            project._id,

          settings:
            DEFAULT_SETTINGS,
        },
        'Project settings reset'
      )
    );
  }
);

module.exports = {
  DEFAULT_SETTINGS,

  getProjectSettings,

  updateProjectSettings,

  resetProjectSettings,
};