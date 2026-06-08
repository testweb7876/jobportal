const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

// ─── Generate Access Token ────────────────────────────────────────────────────
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

// ─── Generate & Store Refresh Token ──────────────────────────────────────────
const generateRefreshToken = async (userId, req) => {
  const token = uuidv4() + '-' + crypto.randomBytes(32).toString('hex');
  const ua = new UAParser(req?.headers?.['user-agent'] || '');
  const geo = geoip.lookup(req?.ip || '') || {};

  await RefreshToken.create({
    userId,
    token,
    deviceId:   req?.headers?.['x-device-id'] || uuidv4(),
    deviceName: req?.headers?.['x-device-name'] || 'Unknown Device',
    browser:    `${ua.getBrowser().name || 'Unknown'} ${ua.getBrowser().version || ''}`.trim(),
    os:         `${ua.getOS().name || 'Unknown'} ${ua.getOS().version || ''}`.trim(),
    ipAddress:  req?.ip || 'unknown',
    userAgent:  req?.headers?.['user-agent'] || '',
    expiresAt:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return token;
};

// ─── Send Tokens Response ─────────────────────────────────────────────────────
const sendTokenResponse = async (user, statusCode, res, req) => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = await generateRefreshToken(user._id, req);

  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
    lastActive: new Date(),
    $inc: { loginCount: 1 },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    signed: true,
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: parseInt(process.env.COOKIE_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000,
  });

  const userData = user.toPublicJSON ? user.toPublicJSON() : user.toObject();

  return res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Account created successfully.' : 'Login successful.',
    accessToken,
    refreshToken,
    user: userData,
  });
};

// ─── Rotate Refresh Token ─────────────────────────────────────────────────────
const rotateRefreshToken = async (oldToken, req) => {
  const existing = await RefreshToken.findOne({ token: oldToken });

  if (!existing || !existing.isValid()) {
    if (existing) {
      // Possible rotation attack — revoke all
      await RefreshToken.updateMany(
        { userId: existing.userId },
        { isRevoked: true, revokedReason: 'rotation_attack' }
      );
      logger.warn(`Token rotation attack detected for user ${existing.userId}`);
    }
    throw new Error('Invalid or expired refresh token');
  }

  existing.isRevoked = true;
  existing.revokedAt = new Date();
  existing.revokedReason = 'rotated';
  await existing.save();

  const user = await User.findById(existing.userId);
  if (!user || !['active'].includes(user.status)) throw new Error('User not found or inactive');

  const newAccessToken  = generateAccessToken(user._id, user.role);
  const newRefreshToken = await generateRefreshToken(user._id, req);

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── Revoke Access Token (Blacklist) ──────────────────────────────────────────
const revokeToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await cache.set(`blacklist:${token}`, '1', ttl);
    }
  } catch (err) {
    logger.error('Token revoke error:', err);
  }
};

// ─── Revoke All Refresh Tokens ────────────────────────────────────────────────
const revokeAllRefreshTokens = async (userId, reason = 'logout_all') => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
  );
};

module.exports = {
  generateAccessToken, generateRefreshToken, sendTokenResponse,
  rotateRefreshToken, revokeToken, revokeAllRefreshTokens,
};
