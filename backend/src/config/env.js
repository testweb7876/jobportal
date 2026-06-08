const { cleanEnv, str, num, bool, url, email } = require('envalid');

const env = cleanEnv(process.env, {
  NODE_ENV:    str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT:        num({ default: 5000 }),
  API_VERSION: str({ default: 'v1' }),

  // MongoDB
  MONGO_URI:      str(),
  MONGO_URI_PROD: str({ default: '' }),

  // JWT
  JWT_SECRET:         str(),
  JWT_EXPIRES_IN:     str({ default: '15m' }),
  JWT_REFRESH_EXPIRE: str({ default: '7d' }),
  COOKIE_SECRET:      str(),
  COOKIE_EXPIRES_DAYS: num({ default: 7 }),

  // Redis
  REDIS_URL:      str({ default: 'redis://localhost:6379' }),
  REDIS_PASSWORD: str({ default: '' }),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY:    str(),
  CLOUDINARY_API_SECRET: str(),

  // Email
  SMTP_HOST:       str(),
  SMTP_PORT:       num({ default: 587 }),
  SMTP_USER:       str(),
  SMTP_PASS:       str(),
  EMAIL_FROM:      str(),
  EMAIL_FROM_NAME: str({ default: 'JobPortal' }),

  // Client
  CLIENT_URL: str({ default: 'http://localhost:3000' }),

  // Payments
  STRIPE_SECRET_KEY:      str({ default: '' }),
  STRIPE_WEBHOOK_SECRET:  str({ default: '' }),
  RAZORPAY_KEY_ID:        str({ default: '' }),
  RAZORPAY_KEY_SECRET:    str({ default: '' }),

  // Rate Limit
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX:       num({ default: 100 }),
  AUTH_RATE_LIMIT_MAX:  num({ default: 5 }),

  // Features
  BCRYPT_ROUNDS:  num({ default: 12 }),
  ENABLE_CRON:    bool({ default: false }),
  MAX_IMAGE_SIZE: num({ default: 5242880 }),
  MAX_FILE_SIZE:  num({ default: 10485760 }),

  // Optional
  SENTRY_DSN: str({ default: '' }),
  OPENAI_API_KEY: str({ default: '' }),
}, { strict: false });

module.exports = env;
