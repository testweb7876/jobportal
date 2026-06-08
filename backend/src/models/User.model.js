const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const deviceSchema = new mongoose.Schema({
  deviceId:   String,
  deviceName: String,
  browser:    String,
  os:         String,
  ip:         String,
  location:   String,
  lastActive: { type: Date, default: Date.now },
  isActive:   { type: Boolean, default: true },
}, { _id: false });

const notifSettingsSchema = new mongoose.Schema({
  emailOnApplication:   { type: Boolean, default: true },
  emailOnMessage:       { type: Boolean, default: true },
  emailOnJobAlert:      { type: Boolean, default: true },
  emailOnPackageExpiry: { type: Boolean, default: true },
  pushNotifications:    { type: Boolean, default: true },
  smsNotifications:     { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // ── Core ─────────────────────────────────────────────────────────────────
  uid:       Number,            // legacy MySQL UID
  firstName: { type: String, required: true, trim: true, maxlength: 100 },
  lastName:  { type: String, required: true, trim: true, maxlength: 100 },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, minlength: 8, select: false },
  phone:     { type: String, trim: true },
  role:      { type: String, enum: ['jobseeker', 'employer', 'admin', 'superadmin'], default: 'jobseeker' },

  // ── Status ───────────────────────────────────────────────────────────────
  status:           { type: String, enum: ['pending', 'active', 'suspended', 'banned'], default: 'pending' },
  isVerified:       { type: Boolean, default: false },
  isEmailVerified:  { type: Boolean, default: false },
  isPhoneVerified:  { type: Boolean, default: false },
  profileCompleted: { type: Number, default: 0, min: 0, max: 100 },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatar: {
    publicId:     String,
    secureUrl:    String,
    resourceType: { type: String, default: 'image' },
  },
  photo: String, // legacy

  // ── Social Auth ──────────────────────────────────────────────────────────
  googleId:    String,
  linkedinId:  String,
  facebookId:  String,
  socialId:    String,  // legacy
  socialMedia: { type: String, enum: ['google', 'linkedin', 'facebook', ''], default: '' },

  // ── Settings ─────────────────────────────────────────────────────────────
  notificationSettings: { type: notifSettingsSchema, default: {} },
  socialLinks: {
    linkedin:  { type: String, default: '' },
    github:    { type: String, default: '' },
    twitter:   { type: String, default: '' },
    facebook:  { type: String, default: '' },
    website:   { type: String, default: '' },
  },
  deviceHistory: [deviceSchema],

  // ── Analytics ────────────────────────────────────────────────────────────
  profileViews: { type: Number, default: 0 },
  lastLogin:    Date,
  lastActive:   Date,
  loginCount:   { type: Number, default: 0 },

  // ── Password Reset ────────────────────────────────────────────────────────
  passwordResetToken:      { type: String, select: false },
  passwordResetExpires:    { type: Date, select: false },
  passwordChangedAt:       Date,

  // ── Email Verification ────────────────────────────────────────────────────
  emailVerificationToken:   { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  // ── 2FA ──────────────────────────────────────────────────────────────────
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret:  { type: String, select: false },

  // ── Soft Delete ───────────────────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────────────────
  roleid: Number,
  params: mongoose.Schema.Types.Mixed,

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Hooks ───────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    return parseInt(this.passwordChangedAt.getTime() / 1000) > jwtTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken   = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1h
  return token;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken   = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return token;
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  const remove = ['password', 'passwordResetToken', 'passwordResetExpires',
    'emailVerificationToken', 'emailVerificationExpires', 'twoFactorSecret', '__v'];
  remove.forEach(k => delete obj[k]);
  return obj;
};

// ─── Query Middleware ─────────────────────────────────────────────────────────
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('User', userSchema);
