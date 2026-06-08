require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const User = require('./models/User.model');

const seedUsers = async () => {
  try {
    await connectDB();

    logger.info('Starting user seeder...');

    const users = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@jobportal.com',
        password: 'Admin@123456',
        role: 'superadmin',
        status: 'active',
        isEmailVerified: true,
        isVerified: true,
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@jobportal.com',
        password: 'Admin@123456',
        role: 'admin',
        status: 'active',
        isEmailVerified: true,
        isVerified: true,
      },
      {
        firstName: 'Demo',
        lastName: 'Employer',
        email: 'employer@jobportal.com',
        password: 'Employer@123',
        role: 'employer',
        status: 'active',
        isEmailVerified: true,
        isVerified: true,
      },
      {
        firstName: 'Demo',
        lastName: 'Jobseeker',
        email: 'jobseeker@jobportal.com',
        password: 'Jobseeker@123',
        role: 'jobseeker',
        status: 'active',
        isEmailVerified: true,
        isVerified: true,
      },
    ];

    for (const userData of users) {
      const existing = await User.findOne({
        email: userData.email,
      }).setOptions({ includeDeleted: true });

      if (!existing) {
        await User.create(userData);
        logger.info(`✅ Created: ${userData.email}`);
      } else {
        logger.info(`ℹ️ Already exists: ${userData.email}`);
      }
    }

    logger.info('🎉 User seeding completed');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    logger.error('Seeder failed:', error);
    process.exit(1);
  }
};

seedUsers();