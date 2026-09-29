const mongoose = require('mongoose');

const { Schema } = mongoose;

const fileLockSchema = new Schema(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      unique: true, // one active lock per file, enforced at the DB level
    },
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
    },
    socketId: {
      type: String,
      required: true,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    // Renewed by a heartbeat while the holder keeps the file open. If a
    // browser crashes or the network drops without a clean disconnect
    // event ever arriving, the lock still self-expires instead of
    // orphaning the file as permanently locked.
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileLock', fileLockSchema);