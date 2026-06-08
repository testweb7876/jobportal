const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'production' && process.env.MONGO_URI_PROD
      ? process.env.MONGO_URI_PROD
      : process.env.MONGO_URI;

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected. Retrying...'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected.'));
    mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
