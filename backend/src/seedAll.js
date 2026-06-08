
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./config/database');
const logger = require('./config/logger');

// ================= MODELS =================
const User = require('./models/User.model');

const Company = require('./models/Company.model');

const {
  Category,
  JobType,
  CareerLevel,
  Country,
  State,
  City,
  Department
} = require('./models/Misc.model');

const Job = require('./models/Job.model');
const Resume = require('./models/Resume.model');
const Application = require('./models/Application.model');

const {
  Notification,
  Conversation,
  Message
} = require('./models/Communication.model');

const {
  Package,
  UserPackage,
  Invoice
} = require('./models/Payment.model');

// ================= HELPERS =================
const clean = async (model) => {
  await model.deleteMany({});
};

// ================= SEED =================
const seed = async () => {
  try {
    await connectDB();

    logger.info('🚀 Seeding started...');

    // ================= CLEANUP =================
    await clean(Application);
    await clean(Conversation);
    await clean(Message);
    await clean(Notification);

    await clean(Job);
    await clean(Resume);

    await clean(Department);
    await clean(Company);

    await clean(Category);
    await clean(JobType);
    await clean(CareerLevel);

    await clean(City);
    await clean(State);
    await clean(Country);

    await clean(Package);
    await clean(UserPackage);
    await clean(Invoice);

    await clean(User);

    // ================= USERS =================
    const users = await User.insertMany([
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@test.com',
        password: 'Admin@123456',
        role: 'superadmin',
        status: 'active',
        isEmailVerified: true
      },
      {
        firstName: 'Employer',
        lastName: 'One',
        email: 'employer@test.com',
        password: 'Employer@123',
        role: 'employer',
        status: 'active',
        isEmailVerified: true
      },
      {
        firstName: 'Job',
        lastName: 'Seeker',
        email: 'jobseeker@test.com',
        password: 'Job@123456',
        role: 'jobseeker',
        status: 'active',
        isEmailVerified: true
      }
    ]);

    const admin = users[0];
    const employer = users[1];
    const jobseeker = users[2];

    logger.info('✅ Users seeded');

    // ================= MASTER DATA =================
    const country = await Country.create({
      name: 'India',
      nameCode: 'IN',
      enabled: true
    });

    const state = await State.create({
      name: 'Punjab',
      countryId: country._id,
      enabled: true
    });

    const city = await City.create({
      name: 'Ludhiana',
      stateId: state._id,
      countryId: country._id,
      enabled: true
    });

    const category = await Category.create({
      catTitle: 'Software Development',
      alias: 'software-dev'
    });

    const jobType = await JobType.create({
      title: 'Full Time'
    });

    const career = await CareerLevel.create({
      title: 'Mid Level'
    });

    logger.info('✅ Master data seeded');

    // ================= COMPANY =================
    const company = await Company.create({
      uid: employer._id,
      name: 'Tech Solutions Pvt Ltd',
      city: 'Ludhiana',
      isActive: true
    });

    logger.info('✅ Company seeded');

    // ================= DEPARTMENT =================
    await Department.create({
      uid: employer._id,
      companyId: company._id,
      name: 'Engineering'
    });

    logger.info('✅ Department seeded');

    // ================= JOB =================
    const job = await Job.create({
      uid: employer._id,
      companyId: company._id,
      title: 'MERN Stack Developer',
      description: 'Build scalable web apps',
      categoryId: category._id,
      jobType: jobType._id,
      careerLevel: career._id,
      city: 'Ludhiana',
      status: 'approved',
      salaryMin: 30000,
      salaryMax: 80000
    });

    logger.info('✅ Job seeded');

    // ================= RESUME =================
    const resume = await Resume.create({
      uid: jobseeker._id,
      applicationTitle: 'Full Stack Developer Resume',
      firstName: 'Demo',
      lastName: 'User',
      skills: 'Node.js, React, MongoDB',
      jobCategory: category._id
    });

    logger.info('✅ Resume seeded');

    // ================= APPLICATION =================
    await Application.create({
      jobId: job._id,
      uid: jobseeker._id,
      companyId: company._id,
      applyMessage: 'Interested in this role',
      status: 'applied'
    });

    logger.info('✅ Application seeded');

    // ================= NOTIFICATION =================
    await Notification.create({
      recipientId: jobseeker._id,
      type: 'application_received',
      title: 'Application Submitted',
      message: 'Your application has been submitted successfully'
    });

    logger.info('✅ Notification seeded');

    // ================= CONVERSATION =================
    const conversation = await Conversation.create({
      participants: [employer._id, jobseeker._id],
      jobId: job._id,
      employerId: employer._id,
      jobseekerId: jobseeker._id
    });

    await Message.create({
      conversationId: conversation._id,
      sendBy: employer._id,
      message: 'Hello, we received your application'
    });

    logger.info('✅ Chat seeded');

    // ================= PACKAGE =================
    const pkg = await Package.create({
      title: 'Starter Plan',
      packageTime: 30,
      packageTimeUnit: 'days',
      job: 10,
      packageFor: 'employer'
    });

    await UserPackage.create({
      uid: employer._id,
      packageId: pkg._id,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remainingJobs: 10
    });

    await Invoice.create({
      uid: employer._id,
      recordId: pkg._id,
      type: 'package',
      amount: 999,
      paymentStatus: 'paid'
    });

    logger.info('✅ Package system seeded');

    // ================= DONE =================
    logger.info('🎉 ALL COLLECTIONS SEEDED SUCCESSFULLY');

    await mongoose.disconnect();

    process.exit(0);

  } catch (err) {
    console.error(err);

    process.exit(1);
  }
};

seed();