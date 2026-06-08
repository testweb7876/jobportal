const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:         { type: String, required: true, unique: true },
  deviceId:      String,
  deviceName:    String,
  browser:       String,
  os:            String,
  ipAddress:     String,
  userAgent:     String,
  isRevoked:     { type: Boolean, default: false },
  revokedAt:     Date,
  revokedReason: String,
  expiresAt:     { type: Date, required: true },
  lastUsedAt:    { type: Date, default: Date.now },
}, { timestamps: true });

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.methods.isValid = function () {
  return !this.isRevoked && new Date() < this.expiresAt;
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
