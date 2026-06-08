const cron = require('node-cron');
const logger = require('../config/logger');
const dayjs = require('dayjs');

const initCronJobs = () => {
  // ── Expire Jobs (every hour) ──────────────────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const Job = require('../models/Job.model');
      const result = await Job.updateMany(
        { status: 'approved', expiresAt: { $lt: new Date() } },
        { status: 'expired' }
      );
      if (result.modifiedCount > 0) logger.info(`Cron: Expired ${result.modifiedCount} jobs`);
    } catch (err) {
      logger.error('Cron job expiry error:', err.message);
    }
  });

  // ── Package Expiry Warnings (daily at 9am) ────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    try {
      const { UserPackage } = require('../models/Payment.model');
      const User = require('../models/User.model');
      const emailService = require('../services/email.service');

      const warningDate = dayjs().add(3, 'day').toDate();
      const expiringPkgs = await UserPackage.find({
        status: true, isActive: true,
        endDate: { $lte: warningDate, $gte: new Date() },
      }).populate('packageId', 'title').populate('uid', 'firstName email');

      for (const pkg of expiringPkgs) {
        if (pkg.uid?.email) {
          await emailService.sendPackageExpiryWarning(pkg.uid, pkg.packageId?.title, pkg.endDate);
          logger.info(`Cron: Sent expiry warning to ${pkg.uid.email}`);
        }
      }

      // Deactivate expired packages
      await UserPackage.updateMany(
        { status: true, endDate: { $lt: new Date() } },
        { status: false, isActive: false }
      );
    } catch (err) {
      logger.error('Cron package expiry error:', err.message);
    }
  });

  // ── Job Alerts (daily at 8am) ─────────────────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    try {
      const { JobAlert } = require('../models/Misc.model');
      const Job = require('../models/Job.model');
      const User = require('../models/User.model');
      const emailService = require('../services/email.service');

      const now = new Date();
      const alerts = await JobAlert.find({ status: 1, isDeleted: false, sendTime: { $lte: now } });

      for (const alert of alerts) {
        const filter = { status: 'approved', $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }] };
        if (alert.categoryId)    filter.categoryId = alert.categoryId;
        if (alert.keywords)      filter.$text = { $search: alert.keywords };
        if (alert.city)          filter.city = new RegExp(alert.city, 'i');
        if (alert.jobType)       filter.jobType = alert.jobType;
        if (alert.isUrgent)      filter.isUrgent = true;
        if (alert.lastMailSend)  filter.createdAt = { $gt: alert.lastMailSend };

        const jobs = await Job.find(filter).limit(10).populate('companyId', 'name').lean();
        if (!jobs.length) continue;

        const user = await User.findById(alert.uid);
        if (user?.email) {
          await emailService.sendJobAlert(user, jobs);
          await JobAlert.findByIdAndUpdate(alert._id, { lastMailSend: now });
          logger.info(`Cron: Sent ${jobs.length} job alerts to ${user.email}`);
        }
      }
    } catch (err) {
      logger.error('Cron job alerts error:', err.message);
    }
  });

  // ── Cleanup Old Notifications (weekly) ───────────────────────────────────
  cron.schedule('0 0 * * 0', async () => {
    try {
      const { Notification } = require('../models/Communication.model');
      const cutoff = dayjs().subtract(90, 'day').toDate();
      const result = await Notification.deleteMany({ createdAt: { $lt: cutoff }, isRead: true });
      logger.info(`Cron: Deleted ${result.deletedCount} old notifications`);
    } catch (err) {
      logger.error('Cron notification cleanup error:', err.message);
    }
  });

  // ── Cleanup Expired Refresh Tokens (daily at midnight) ───────────────────
  cron.schedule('0 0 * * *', async () => {
    try {
      const RefreshToken = require('../models/RefreshToken.model');
      const result = await RefreshToken.deleteMany({ $or: [{ expiresAt: { $lt: new Date() } }, { isRevoked: true }] });
      logger.info(`Cron: Cleaned ${result.deletedCount} expired tokens`);
    } catch (err) {
      logger.error('Cron token cleanup error:', err.message);
    }
  });

  logger.info('✅ Cron jobs initialized');
};

module.exports = { initCronJobs };
