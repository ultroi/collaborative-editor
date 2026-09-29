const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username may only contain letters, numbers, _ and -",
      ],
      index: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
      index: true,
    },

    // Optional because OAuth-only users do not have a password.
    passwordHash: {
      type: String,
      select: false,
      default: null,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    // OAuth identities.
    // These are intentionally not `unique` schema indexes so existing
    // documents with null values do not cause unique-index migration issues.
    googleId: {
      type: String,
      default: undefined,
      index: true,
    },

    githubId: {
      type: String,
      default: undefined,
      index: true,
    },

    githubAccessToken: {
      type: String,
      select: false,
      default: null,
    },

    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  const salt = await bcrypt.genSalt(12);

  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  if (!this.passwordHash) {
    return false;
  }

  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    avatarUrl: this.avatarUrl,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
