const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: null },

    // Every user gets a unique referral code they can share. Kept on the
    // user (rather than derived) so it is stable even if the name changes.
    referralCode: {
      type: String,
      unique: true,
      default: () => uuidv4().split('-')[0],
      index: true,
    },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referralEarningsPaise: { type: Number, default: 0 }, // stored in paise to avoid float issues
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    referralCode: this.referralCode,
  };
};

module.exports = mongoose.model('User', userSchema);
