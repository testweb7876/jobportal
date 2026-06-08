const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User.model');
const { AppError } = require('../utils/AppError');
const { cache } = require('../config/redis');

// ─── PROTECT ──────────────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.signedCookies?.accessToken) {
      token = req.signedCookies.accessToken;
    }

    if (!token) return next(new AppError('Not logged in. Please log in to access this.', 401));

    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) return next(new AppError('Token revoked. Please log in again.', 401));

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User no longer exists.', 401));

    if (['suspended', 'banned'].includes(user.status)) {
      return next(new AppError(`Account ${user.status}. Contact support.`, 403));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password recently changed. Please log in again.', 401));
    }

    req.user  = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired. Please log in again.', 401));
    if (err.name === 'JsonWebTokenError')  return next(new AppError('Invalid token.', 401));
    next(err);
  }
};

// ─── OPTIONAL AUTH ────────────────────────────────────────────────────────────
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    else if (req.signedCookies?.accessToken) token = req.signedCookies.accessToken;

    if (token) {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.status === 'active') req.user = user;
    }
  } catch { /* ignore */ }
  next();
};

// ─── RESTRICT TO ROLES ────────────────────────────────────────────────────────
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission for this action.', 403));
  }
  next();
};

exports.employerOnly = (req, res, next) => {
  if (!['employer', 'admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('This route is for employers only.', 403));
  }
  next();
};

exports.jobseekerOnly = (req, res, next) => {
  if (!['jobseeker', 'admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('This route is for job seekers only.', 403));
  }
  next();
};

exports.adminOnly = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Admin access required.', 403));
  }
  next();
};

exports.verifiedOnly = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email to access this.', 403));
  }
  next();
};

// ─── AUTH RATE LIMITER ────────────────────────────────────────────────────────
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { success: false, message: 'Too many attempts. Try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
