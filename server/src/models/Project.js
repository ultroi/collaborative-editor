const mongoose = require('mongoose');

const { Schema } = mongoose;

const projectSettingsSchema = new Schema(
  {
    visibility: {
      type: String,
      enum: ['private', 'team'],
      default: 'private',
    },

    collaboration: {
      enabled: {
        type: Boolean,
        default: true,
      },

      presenceEnabled: {
        type: Boolean,
        default: true,
      },

      fileLockingEnabled: {
        type: Boolean,
        default: true,
      },

      teamChatEnabled: {
        type: Boolean,
        default: true,
      },
    },

    editor: {
      autoSave: {
        type: Boolean,
        default: false,
      },

      minimap: {
        type: Boolean,
        default: true,
      },

      wordWrap: {
        type: Boolean,
        default: false,
      },

      formatOnSave: {
        type: Boolean,
        default: false,
      },
    },

    files: {
      confirmDelete: {
        type: Boolean,
        default: true,
      },

      showHiddenFiles: {
        type: Boolean,
        default: true,
      },
    },

    notifications: {
      memberJoin: {
        type: Boolean,
        default: true,
      },

      fileLock: {
        type: Boolean,
        default: true,
      },

      chat: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    _id: false,
  }
);

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Denormalized member id list for fast project lookup.
    // ProjectMember remains the source of truth for roles.
    memberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    repository: {
      isImported: {
        type: Boolean,
        default: false,
      },

      githubRepoId: {
        type: String,
        default: null,
      },

      fullName: {
        type: String,
        default: null,
      },

      defaultBranch: {
        type: String,
        default: 'main',
      },
    },

    settings: {
      type: projectSettingsSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({
  ownerId: 1,
  status: 1,
});

projectSchema.index({
  memberIds: 1,
  status: 1,
});

module.exports = mongoose.model(
  'Project',
  projectSchema
);