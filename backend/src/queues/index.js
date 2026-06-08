const { Queue, Worker, QueueEvents } = require('bullmq');
const logger = require('../config/logger');
const emailService = require('../services/email.service');

let emailQueue;
let notifQueue;

const REDIS_CONNECTION = {
  host: (process.env.REDIS_URL || 'redis://localhost:6379').replace('redis://', '').split(':')[0],
  port: parseInt((process.env.REDIS_URL || ':6379').split(':').pop()) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const initQueues = () => {
  try {
    // ── Email Queue ────────────────────────────────────────────────────────
    emailQueue = new Queue('emails', { connection: REDIS_CONNECTION, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } } });

    new Worker('emails', async (job) => {
      const { type, data } = job.data;
      logger.info(`Processing email job: ${type}`);

      switch (type) {
        case 'welcome':           await emailService.sendWelcome(data.user, data.url); break;
        case 'password_reset':    await emailService.sendPasswordReset(data.user, data.url); break;
        case 'application_confirm': await emailService.sendApplicationConfirmation(data.user, data.job, data.company); break;
        case 'status_update':     await emailService.sendApplicationStatusUpdate(data.user, data.job, data.status, data.note); break;
        case 'job_alert':         await emailService.sendJobAlert(data.user, data.jobs); break;
        case 'package_expiry':    await emailService.sendPackageExpiryWarning(data.user, data.packageName, data.expiresAt); break;
        case 'payment_confirm':   await emailService.sendPaymentConfirmation(data.user, data.invoice); break;
        case 'interview':         await emailService.sendInterviewScheduled(data.user, data.job, data.interview); break;
        case 'new_application':   await emailService.sendNewApplicationAlert(data.employer, data.jobTitle, data.applicantName); break;
        default: logger.warn(`Unknown email type: ${type}`);
      }
    }, {
      connection: REDIS_CONNECTION,
      concurrency: 5,
    }).on('failed', (job, err) => logger.error(`Email job failed: ${err.message}`, { jobId: job?.id }));

    // ── Notification Queue ────────────────────────────────────────────────
    notifQueue = new Queue('notifications', { connection: REDIS_CONNECTION });

    new Worker('notifications', async (job) => {
      const notifService = require('../services/notification.service');
      await notifService.create(job.data);
    }, { connection: REDIS_CONNECTION, concurrency: 10 });

    logger.info('✅ BullMQ Queues initialized');
  } catch (err) {
    logger.warn(`Queue init failed: ${err.message}. Running without queues.`);
  }
};

// ── Helper to add email jobs ──────────────────────────────────────────────────
const addEmailJob = async (type, data, opts = {}) => {
  try {
    if (!emailQueue) {
      // Fallback: send directly
      return emailService.send({ to: data.user?.email, subject: type, html: JSON.stringify(data) });
    }
    await emailQueue.add(type, { type, data }, { delay: opts.delay || 0, priority: opts.priority || 0 });
  } catch (err) {
    logger.error('Add email job error:', err.message);
  }
};

const addNotifJob = async (data) => {
  try {
    if (!notifQueue) return;
    await notifQueue.add('notify', data);
  } catch (err) {
    logger.error('Add notif job error:', err.message);
  }
};

module.exports = { initQueues, addEmailJob, addNotifJob };
