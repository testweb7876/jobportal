require('express-async-errors');
require('dotenv').config();

// Validate env first
const env = require('./config/env');

const express       = require('express');
const http          = require('http');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const compression   = require('compression');
const cookieParser  = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp           = require('hpp');
const rateLimit     = require('express-rate-limit');
const slowDown      = require('express-slow-down');
const swaggerUi     = require('swagger-ui-express');
const path          = require('path');

const connectDB     = require('./config/database');
const connectRedis  = require('./config/redis');
const { initSocket } = require('./socket');
const { initQueues } = require('./queues');
const { initCronJobs } = require('./cron');
const logger        = require('./config/logger');
const errorHandler  = require('./middleware/errorHandler');
const xssSanitizer  = require('./middleware/xssSanitizer');
const swaggerSpec   = require('./config/swagger');

const {
  authRouter, jobRouter, appRouter, resumeRouter,
  companyRouter, msgRouter, notifRouter, pkgRouter,
  adminRouter, lookupRouter,
} = require('./routes');

// ─── Sentry (production only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
}

const app = express();
const server = http.createServer(app);

// ─── Connect DB & Cache ───────────────────────────────────────────────────────
connectDB();
connectRedis();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(xssSanitizer);
app.use(hpp({ whitelist: ['tags', 'skills', 'cities'] }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-device-id', 'x-device-name'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
});

app.use('/api/', globalLimiter);
app.use('/api/', speedLimiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Docs (protected in production) ──────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Job Portal API Docs',
  }));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const api = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${api}/auth`,          authRouter);
app.use(`${api}/jobs`,          jobRouter);
app.use(`${api}/applications`,  appRouter);
app.use(`${api}/resumes`,       resumeRouter);
app.use(`${api}/companies`,     companyRouter);
app.use(`${api}/messages`,      msgRouter);
app.use(`${api}/notifications`, notifRouter);
app.use(`${api}/packages`,      pkgRouter);
app.use(`${api}/admin`,         adminRouter);
app.use(`${api}/lookup`,        lookupRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocket(server);

// ─── Queues & Cron ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  initQueues();
  if (process.env.ENABLE_CRON === 'true') initCronJobs();
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`📚 API: http://localhost:${PORT}${api}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📖 Docs: http://localhost:${PORT}/api-docs`);
  }
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Graceful shutdown...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, server };
