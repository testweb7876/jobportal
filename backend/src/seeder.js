require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./config/logger');

const connectDB = require('./config/database');

const seed = async () => {
  await connectDB();
  logger.info('Starting seed...');

  const {
    Category, JobType, CareerLevel, Education,
    SalaryRangeType, Currency, Country, Config,
  } = require('./models/Misc.model');
  const { Package } = require('./models/Payment.model');
  const User = require('./models/User.model');

  // ── Categories ─────────────────────────────────────────────────────────────
  await Category.deleteMany({});
  const categories = await Category.insertMany([
    { catTitle: 'Information Technology', alias: 'it', isActive: true, ordering: 1, parentId: null },
    { catTitle: 'Marketing & Sales',       alias: 'marketing', isActive: true, ordering: 2, parentId: null },
    { catTitle: 'Finance & Accounting',    alias: 'finance', isActive: true, ordering: 3, parentId: null },
    { catTitle: 'Human Resources',         alias: 'hr', isActive: true, ordering: 4, parentId: null },
    { catTitle: 'Engineering',             alias: 'engineering', isActive: true, ordering: 5, parentId: null },
    { catTitle: 'Healthcare',              alias: 'healthcare', isActive: true, ordering: 6, parentId: null },
    { catTitle: 'Education & Training',    alias: 'education', isActive: true, ordering: 7, parentId: null },
    { catTitle: 'Design & Creative',       alias: 'design', isActive: true, ordering: 8, parentId: null },
    { catTitle: 'Operations & Logistics',  alias: 'operations', isActive: true, ordering: 9, parentId: null },
    { catTitle: 'Customer Service',        alias: 'customer-service', isActive: true, ordering: 10, parentId: null },
  ]);
  logger.info(`✅ ${categories.length} categories seeded`);

  // ── Job Types ─────────────────────────────────────────────────────────────
  await JobType.deleteMany({});
  await JobType.insertMany([
    { title: 'Full Time',   alias: 'full-time',   color: '#059669', isActive: true, ordering: 1 },
    { title: 'Part Time',   alias: 'part-time',   color: '#2563eb', isActive: true, ordering: 2 },
    { title: 'Contract',    alias: 'contract',    color: '#d97706', isActive: true, ordering: 3 },
    { title: 'Internship',  alias: 'internship',  color: '#7c3aed', isActive: true, ordering: 4 },
    { title: 'Freelance',   alias: 'freelance',   color: '#db2777', isActive: true, ordering: 5 },
    { title: 'Remote',      alias: 'remote',      color: '#0891b2', isActive: true, ordering: 6 },
    { title: 'Temporary',   alias: 'temporary',   color: '#ea580c', isActive: true, ordering: 7 },
  ]);
  logger.info('✅ Job types seeded');

  // ── Career Levels ──────────────────────────────────────────────────────────
  await CareerLevel.deleteMany({});
  await CareerLevel.insertMany([
    { title: 'Entry Level',       status: true, ordering: 1 },
    { title: 'Mid Level',         status: true, ordering: 2 },
    { title: 'Senior Level',      status: true, ordering: 3 },
    { title: 'Team Lead',         status: true, ordering: 4 },
    { title: 'Manager',           status: true, ordering: 5 },
    { title: 'Senior Manager',    status: true, ordering: 6 },
    { title: 'Director',          status: true, ordering: 7 },
    { title: 'VP / C-Level',      status: true, ordering: 8 },
    { title: 'Executive',         status: true, ordering: 9 },
    { title: 'Student / Intern',  status: true, ordering: 10 },
  ]);
  logger.info('✅ Career levels seeded');

  // ── Education ─────────────────────────────────────────────────────────────
  await Education.deleteMany({});
  await Education.insertMany([
    { title: 'High School',       isActive: true, ordering: 1 },
    { title: 'Diploma',           isActive: true, ordering: 2 },
    { title: 'Bachelor\'s Degree', isActive: true, ordering: 3, isDefault: true },
    { title: 'Master\'s Degree',  isActive: true, ordering: 4 },
    { title: 'PhD / Doctorate',   isActive: true, ordering: 5 },
    { title: 'Professional Certification', isActive: true, ordering: 6 },
    { title: 'Any',               isActive: true, ordering: 7 },
  ]);
  logger.info('✅ Education levels seeded');

  // ── Salary Range Types ─────────────────────────────────────────────────────
  await SalaryRangeType.deleteMany({});
  await SalaryRangeType.insertMany([
    { title: 'Per Month', status: true, ordering: 1, isDefault: true },
    { title: 'Per Year',  status: true, ordering: 2 },
    { title: 'Per Hour',  status: true, ordering: 3 },
    { title: 'Per Day',   status: true, ordering: 4 },
    { title: 'Fixed',     status: true, ordering: 5 },
  ]);
  logger.info('✅ Salary types seeded');

  // ── Currencies ────────────────────────────────────────────────────────────
  await Currency.deleteMany({});
  await Currency.insertMany([
    { title: 'Indian Rupee', symbol: '₹', code: 'INR', status: true, isDefault: true, ordering: 1 },
    { title: 'US Dollar',    symbol: '$', code: 'USD', status: true, ordering: 2 },
    { title: 'Euro',         symbol: '€', code: 'EUR', status: true, ordering: 3 },
    { title: 'British Pound', symbol: '£', code: 'GBP', status: true, ordering: 4 },
    { title: 'UAE Dirham',   symbol: 'AED', code: 'AED', status: true, ordering: 5 },
    { title: 'Saudi Riyal',  symbol: 'SAR', code: 'SAR', status: true, ordering: 6 },
  ]);
  logger.info('✅ Currencies seeded');

  // ── Packages ──────────────────────────────────────────────────────────────
  await Package.deleteMany({});
  await Package.insertMany([
    // Jobseeker Packages
    {
      title: 'Jobseeker Free', isFree: true, price: 0,
      packageTime: 9999, packageTimeUnit: 'days',
      resume: 1, jobApply: 5, jobAlert: 1, coverletter: 1,
      packageFor: 'jobseeker', status: true,
    },
    {
      title: 'Jobseeker Basic', price: 299,
      packageTime: 30, packageTimeUnit: 'days',
      resume: 5, featuredResume: 1, jobApply: 50, jobAlert: 5, coverletter: 5,
      packageFor: 'jobseeker', status: true,
    },
    {
      title: 'Jobseeker Premium', price: 799,
      packageTime: 90, packageTimeUnit: 'days',
      resume: 20, featuredResume: 3, jobApply: 999, jobAlert: 20, coverletter: 20,
      packageFor: 'jobseeker', status: true,
    },
    // Employer Packages
    {
      title: 'Employer Free', isFree: true, price: 0,
      packageTime: 9999, packageTimeUnit: 'days',
      job: 1, featuredJob: 0, companies: 1, resumeSearch: 5, jobAlert: 0,
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Basic', price: 999,
      packageTime: 30, packageTimeUnit: 'days',
      job: 10, featuredJob: 1, companies: 1, department: 3,
      resumeSearch: 50, coverletter: 0,
      jobTime: 30, jobTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Pro', price: 2999,
      packageTime: 30, packageTimeUnit: 'days',
      job: 50, featuredJob: 5, companies: 1, department: 10,
      resumeSearch: 999, featuredCompany: 1,
      jobTime: 60, jobTimeUnit: 'days',
      packageFor: 'employer', status: true,
    },
    {
      title: 'Employer Enterprise', price: 7999,
      packageTime: 90, packageTimeUnit: 'days',
      job: -1, featuredJob: 20, companies: 3, department: 50,
      resumeSearch: -1, featuredCompany: 3,
      jobTime: 90, jobTimeUnit: 'days',
      packageFor: 'employer', status: true,
      stripeSubscription: true,
    },
  ]);
  logger.info('✅ Packages seeded');

  // ── Config ────────────────────────────────────────────────────────────────
  await Config.deleteMany({});
  await Config.insertMany([
    { configName: 'site_name',          configValue: 'JobPortal',          configFor: 'general' },
    { configName: 'site_email',         configValue: 'info@jobportal.com', configFor: 'general' },
    { configName: 'jobs_per_page',      configValue: '20',                 configFor: 'jobs' },
    { configName: 'resumes_per_page',   configValue: '20',                 configFor: 'resumes' },
    { configName: 'allow_guest_apply',  configValue: 'false',              configFor: 'applications' },
    { configName: 'require_approval',   configValue: 'true',               configFor: 'jobs' },
    { configName: 'maintenance_mode',   configValue: 'false',              configFor: 'general' },
  ]);
  logger.info('✅ Config seeded');

  // ── Admin User ────────────────────────────────────────────────────────────
  const existing = await User.findOne({ email: 'admin@jobportal.com' }).setOptions({ includeDeleted: true });
  if (!existing) {
    await User.create({
      firstName: 'Admin', lastName: 'User',
      email: 'admin@jobportal.com',
      password: 'Admin@123456',
      role: 'admin', isEmailVerified: true, status: 'active',
    });
    logger.info('✅ Admin created: admin@jobportal.com / Admin@123456');
  } else {
    logger.info('ℹ️  Admin already exists');
  }

  logger.info('🎉 Seed complete!');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
