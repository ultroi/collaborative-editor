const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * An explicit read/write grant for one user on one folder or file.
 * These layer on top of the coarse ProjectMember.role and are resolved by
 * utils/permissionResolver.js, which walks from the target node up through
 * its ancestor folders (and finally the project) and uses the FIRST
 * explicit override it finds. No override anywhere in that chain falls
 * back to the role default (see the resolver for exact defaults).
 */
const permissionSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['folder', 'file'],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    permissions: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One override per (user, resource) — updating a grant edits this row
// rather than stacking duplicates.
permissionSchema.index({ userId: 1, resourceId: 1 }, { unique: true });
permissionSchema.index({ projectId: 1, userId: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
