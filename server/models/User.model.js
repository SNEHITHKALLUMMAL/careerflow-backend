import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['student', 'recruiter', 'mentor', 'placementOfficer', 'collegeAdmin', 'superAdmin'];

/** Roles a person can obtain through public self-registration / Google sign-in. */
export const SELF_REGISTERABLE_ROLES = ['student', 'recruiter', 'mentor'];

const otpSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['verify_email', 'reset_password'],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    deviceInfo: { type: String, default: 'unknown device' },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    // select: false — never returned by default queries; must opt in with .select('+passwordHash')
    passwordHash: { type: String, select: false, default: null },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ROLES, required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
    avatarUrl: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
    otp: { type: otpSchema, select: false, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ collegeId: 1, role: 1 });

userSchema.pre('save', async function hashPasswordIfModified(next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

/** Compares a plaintext candidate password against the stored hash. Returns false for Google-only accounts. */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

/** Shape returned to clients — strips password/OTP/refresh-token internals. */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    collegeId: this.collegeId,
    avatarUrl: this.avatarUrl,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
