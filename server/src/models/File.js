const mongoose = require('mongoose');

const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    // null = lives at the project root
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      // No path separators or traversal sequences in a single tree node's
      // name — "a/b" or ".." must never reach here (also re-checked in the
      // controller before every write, since this is the authoritative
      // guard against path traversal).
      validate: {
        validator: (v) => !/[/\\]/.test(v) && v !== '.' && v !== '..',
        message: 'Name cannot contain path separators or be "." or ".."',
      },
    },
    // Full materialized path from project root, e.g. "src/components/Navbar.jsx".
    // Denormalized for fast lookups and to avoid walking parentId chains on
    // every read; kept in sync by the controller on create/rename/move.
    path: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    // Only meaningful for type: 'file'. Storing content inline in Mongo is
    // fine at this scale (per the spec); if files grow large this becomes
    // a pointer into object storage instead — nothing else needs to change.
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: null, // inferred from extension client-side; stored for convenience
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Two siblings under the same parent can't share a name.
fileSchema.index({ projectId: 1, parentId: 1, name: 1 }, { unique: true });
// Fast "everything under this project, by path" for tree rendering.
fileSchema.index({ projectId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('File', fileSchema);
