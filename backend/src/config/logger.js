const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const logDir = path.join(__dirname, '../../logs');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const requestIdFormat = winston.format((info) => {
  if (!info.requestId) info.requestId = uuidv4();
  return info;
});

const consoleFormat = printf(({ level, message, timestamp, stack, requestId }) => {
  return `${timestamp} [${level}]${requestId ? ` [${requestId.slice(0, 8)}]` : ''}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(requestIdFormat(), timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'job-portal-api' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m',
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
  }));
}

module.exports = logger;
