const { createClient } = require('redis');
const logger = require('./logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Redis max retries reached');
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => logger.error('Redis error:', err.message));
    redisClient.on('connect', () => logger.info('✅ Redis Connected'));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    await redisClient.connect();
  } catch (error) {
    logger.warn(`Redis connection failed: ${error.message}. Running in degraded mode.`);
    redisClient = null;
  }
};

const getRedis = () => redisClient;

const cache = {
  async get(key) {
    try {
      if (!redisClient?.isReady) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (!redisClient?.isReady) return;
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch { /* silent */ }
  },

  async del(key) {
    try {
      if (!redisClient?.isReady) return;
      await redisClient.del(key);
    } catch { /* silent */ }
  },

  async delPattern(pattern) {
    try {
      if (!redisClient?.isReady) return;
      let cursor = 0;
      do {
        const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        if (result.keys.length) await redisClient.del(result.keys);
      } while (cursor !== 0);
    } catch { /* silent */ }
  },

  async exists(key) {
    try {
      if (!redisClient?.isReady) return false;
      return !!(await redisClient.exists(key));
    } catch { return false; }
  },

  async incr(key, ttlSeconds) {
    try {
      if (!redisClient?.isReady) return null;
      const val = await redisClient.incr(key);
      if (ttlSeconds && val === 1) await redisClient.expire(key, ttlSeconds);
      return val;
    } catch { return null; }
  },

  async setNX(key, value, ttlSeconds) {
    try {
      if (!redisClient?.isReady) return false;
      const result = await redisClient.set(key, value, { NX: true, EX: ttlSeconds });
      return result === 'OK';
    } catch { return false; }
  },
};

module.exports = connectRedis;
module.exports.getRedis = getRedis;
module.exports.cache = cache;
