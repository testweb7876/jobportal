const crypto = require('crypto');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { ActivityLog } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  const existing = await User.findOne({ email }).setOptions({ includeDeleted: true });
  if (existing) return next(new AppError('An account with this email already exists.', 409));

  const user = await User.create({ firstName, lastName, email, password, role, phone, status: 'pending' });

  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  try {
    await emailService.sendWelcome(user, verifyUrl);
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }

  await ActivityLog.create({
    uid: user._id, description: 'User registered',
    referenceFor: 'user', referenceId: user._id,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  await authService.sendTokenResponse(user, 201, res, req);
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (user.status === 'pending')    return next(new AppError('Please verify your email first.', 403));
  if (user.status === 'suspended')  return next(new AppError('Account suspended. Contact support.', 403));
  if (user.status === 'banned')     return next(new AppError('Account banned. Contact support.', 403));

  await ActivityLog.create({
    uid: user._id, description: 'User logged in',
    referenceFor: 'user', referenceId: user._id,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  await authService.sendTokenResponse(user, 200, res, req);
});

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────
exports.googleLogin = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) return next(new AppError('Google ID token required.', 400));

  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return next(new AppError('Invalid Google token.', 401));
  }

  const { name, email, picture, sub: googleId } = payload;
  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ') || '-';

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      firstName, lastName, email, googleId, isEmailVerified: true,
      status: 'active', role: 'jobseeker',
      avatar: { secureUrl: picture },
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (!user.avatar?.secureUrl) user.avatar = { secureUrl: picture };
    await user.save();
  }

  await authService.sendTokenResponse(user, 200, res, req);
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.body.refreshToken || req.signedCookies?.refreshToken;
  if (!token) return next(new AppError('No refresh token provided.', 401));

  try {
    const { user, accessToken, refreshToken } = await authService.rotateRefreshToken(token, req);
    const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', signed: true };
    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
    sendSuccess(res, { accessToken, refreshToken, user: user.toPublicJSON() }, 'Token refreshed');
  } catch (err) {
    return next(new AppError(err.message || 'Invalid refresh token.', 401));
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  if (req.token) await authService.revokeToken(req.token);

  const rt = req.body.refreshToken || req.signedCookies?.refreshToken;
  if (rt) {
    await RefreshToken.findOneAndUpdate({ token: rt }, { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendSuccess(res, {}, 'Logged out successfully');
});

// ─── LOGOUT ALL DEVICES ───────────────────────────────────────────────────────
exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.revokeAllRefreshTokens(req.user._id, 'logout_all');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendSuccess(res, {}, 'Logged out from all devices');
});

// ─── VERIFY EMAIL ────────────────────────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token invalid or expired.', 400));

  user.isEmailVerified = true;
  user.status = 'active';
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, {}, 'Email verified. You can now log in.');
});

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────
exports.resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No account with this email.', 404));
  if (user.isEmailVerified) return next(new AppError('Email already verified.', 400));

  const token = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  await emailService.sendWelcome(user, `${process.env.CLIENT_URL}/verify-email/${token}`);
  sendSuccess(res, {}, 'Verification email sent.');
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return sendSuccess(res, {}, 'If that email is registered, a reset link has been sent.');

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordReset(user, `${process.env.CLIENT_URL}/reset-password/${token}`);
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }
  sendSuccess(res, {}, 'If that email is registered, a reset link has been sent.');
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } });
  if (!user) return next(new AppError('Token invalid or expired.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await authService.revokeAllRefreshTokens(user._id, 'password_reset');
  sendSuccess(res, {}, 'Password reset successful. Please log in.');
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Current password incorrect.', 401));
  }
  user.password = req.body.newPassword;
  await user.save();
  await authService.revokeAllRefreshTokens(user._id, 'password_changed');
  sendSuccess(res, {}, 'Password changed. Please log in again.');
});

// ─── GET ME ──────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { user: user.toPublicJSON() }, 'Profile fetched');
});

// ─── ACTIVE SESSIONS ─────────────────────────────────────────────────────────
exports.getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await RefreshToken.find({
    userId: req.user._id, isRevoked: false, expiresAt: { $gt: new Date() },
  }).select('-token');
  sendSuccess(res, { sessions }, 'Sessions fetched');
});

// ─── REVOKE SESSION ───────────────────────────────────────────────────────────
exports.revokeSession = asyncHandler(async (req, res, next) => {
  const session = await RefreshToken.findOne({ _id: req.params.sessionId, userId: req.user._id });
  if (!session) return next(new AppError('Session not found.', 404));
  session.isRevoked = true;
  session.revokedAt = new Date();
  session.revokedReason = 'user_revoked';
  await session.save();
  sendSuccess(res, {}, 'Session revoked');
});
