require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('./config/logger');
const connectDB = require('./config/database');

const seed = async () => {
  await connectDB();
  logger.info('🌱 Starting full seed...');

  // ── Model Imports ──────────────────────────────────────────────────────────
  const User        = require('./models/User.model');
  const RefreshToken = require('./models/RefreshToken.model');
  const Job         = require('./models/Job.model');
  const Resume      = require('./models/Resume.model');
  const Company     = require('./models/Company.model');
  const Application = require('./models/Application.model');
  const { Package, UserPackage, Invoice, TransactionLog, Subscription } = require('./models/Payment.model');
  const { Notification, Conversation, Message } = require('./models/Communication.model');
  const {
    Category, JobType, JobStatus, CareerLevel, Education,
    SalaryRangeType, Currency, Country, State, City,
    Department, CoverLetter, JobAlert, JobShortlist,
    ActivityLog, Tag, Follower, Report,
    EmployerViewResume, JobseekerViewCompany,
    SavedSearch, Folder, FolderResume,
    EmailTemplate, EmailTemplateConfig, FieldOrdering,
    SystemError, Config, AiModel, AiWrapper, AiLog,
    SlugModel, PaymentMethodConfig,
  } = require('./models/Misc.model');

  // ── Helper ─────────────────────────────────────────────────────────────────
  const clean = async (...models) => {
    for (const m of models) await m.deleteMany({});
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Config);
  await Config.insertMany([
    { configName: 'site_name',            configValue: 'HireHub',               configFor: 'general' },
    { configName: 'site_email',           configValue: 'hello@hirehub.io',      configFor: 'general' },
    { configName: 'site_url',             configValue: 'https://hirehub.io',    configFor: 'general' },
    { configName: 'site_logo',            configValue: '/assets/logo.png',      configFor: 'general' },
    { configName: 'jobs_per_page',        configValue: '20',                    configFor: 'jobs' },
    { configName: 'resumes_per_page',     configValue: '20',                    configFor: 'resumes' },
    { configName: 'allow_guest_apply',    configValue: 'false',                 configFor: 'applications' },
    { configName: 'require_approval',     configValue: 'true',                  configFor: 'jobs' },
    { configName: 'maintenance_mode',     configValue: 'false',                 configFor: 'general' },
    { configName: 'google_analytics_id',  configValue: 'G-XXXXXXXXXX',         configFor: 'analytics' },
    { configName: 'max_resume_size_mb',   configValue: '5',                     configFor: 'resumes' },
    { configName: 'max_logo_size_mb',     configValue: '2',                     configFor: 'company' },
    { configName: 'default_currency',     configValue: 'INR',                   configFor: 'payment' },
    { configName: 'smtp_host',            configValue: 'smtp.mailgun.org',      configFor: 'email' },
    { configName: 'smtp_port',            configValue: '587',                   configFor: 'email' },
    { configName: 'job_expiry_days',      configValue: '30',                    configFor: 'jobs' },
    { configName: 'featured_job_days',    configValue: '7',                     configFor: 'jobs' },
    { configName: 'featured_resume_days', configValue: '14',                    configFor: 'resumes' },
    { configName: 'social_login_google',  configValue: 'true',                  configFor: 'auth' },
    { configName: 'social_login_linkedin',configValue: 'true',                  configFor: 'auth' },
  ]);
  logger.info('✅ Config seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CURRENCIES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Currency);
  const currencies = await Currency.insertMany([
    { title: 'Indian Rupee',    symbol: '₹',   code: 'INR', status: true, isDefault: true,  ordering: 1 },
    { title: 'US Dollar',       symbol: '$',   code: 'USD', status: true, isDefault: false, ordering: 2 },
    { title: 'Euro',            symbol: '€',   code: 'EUR', status: true, isDefault: false, ordering: 3 },
    { title: 'British Pound',   symbol: '£',   code: 'GBP', status: true, isDefault: false, ordering: 4 },
    { title: 'UAE Dirham',      symbol: 'د.إ', code: 'AED', status: true, isDefault: false, ordering: 5 },
    { title: 'Saudi Riyal',     symbol: '﷼',   code: 'SAR', status: true, isDefault: false, ordering: 6 },
    { title: 'Singapore Dollar',symbol: 'S$',  code: 'SGD', status: true, isDefault: false, ordering: 7 },
    { title: 'Australian Dollar',symbol:'A$',  code: 'AUD', status: true, isDefault: false, ordering: 8 },
  ]);
  logger.info('✅ Currencies seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Category);
  const parentCats = await Category.insertMany([
    { catTitle: 'Information Technology', alias: 'it',               isActive: true, ordering: 1,  parentId: null },
    { catTitle: 'Marketing & Sales',      alias: 'marketing',        isActive: true, ordering: 2,  parentId: null },
    { catTitle: 'Finance & Accounting',   alias: 'finance',          isActive: true, ordering: 3,  parentId: null },
    { catTitle: 'Human Resources',        alias: 'hr',               isActive: true, ordering: 4,  parentId: null },
    { catTitle: 'Engineering',            alias: 'engineering',      isActive: true, ordering: 5,  parentId: null },
    { catTitle: 'Healthcare',             alias: 'healthcare',       isActive: true, ordering: 6,  parentId: null },
    { catTitle: 'Education & Training',   alias: 'education',        isActive: true, ordering: 7,  parentId: null },
    { catTitle: 'Design & Creative',      alias: 'design',           isActive: true, ordering: 8,  parentId: null },
    { catTitle: 'Operations & Logistics', alias: 'operations',       isActive: true, ordering: 9,  parentId: null },
    { catTitle: 'Customer Service',       alias: 'customer-service', isActive: true, ordering: 10, parentId: null },
    { catTitle: 'Legal',                  alias: 'legal',            isActive: true, ordering: 11, parentId: null },
    { catTitle: 'Media & Communications', alias: 'media',            isActive: true, ordering: 12, parentId: null },
  ]);

  // Sub-categories for IT
  await Category.insertMany([
    { catTitle: 'Software Development', alias: 'software-dev',   isActive: true, ordering: 1, parentId: parentCats[0]._id },
    { catTitle: 'Data Science & AI',    alias: 'data-science',   isActive: true, ordering: 2, parentId: parentCats[0]._id },
    { catTitle: 'DevOps & Cloud',       alias: 'devops',         isActive: true, ordering: 3, parentId: parentCats[0]._id },
    { catTitle: 'Cybersecurity',        alias: 'cybersecurity',  isActive: true, ordering: 4, parentId: parentCats[0]._id },
    { catTitle: 'QA & Testing',         alias: 'qa-testing',     isActive: true, ordering: 5, parentId: parentCats[0]._id },
    { catTitle: 'Mobile Development',   alias: 'mobile-dev',     isActive: true, ordering: 6, parentId: parentCats[0]._id },
    // Sub-categories for Design
    { catTitle: 'UI/UX Design',         alias: 'ui-ux',          isActive: true, ordering: 1, parentId: parentCats[7]._id },
    { catTitle: 'Graphic Design',       alias: 'graphic-design', isActive: true, ordering: 2, parentId: parentCats[7]._id },
    { catTitle: 'Video & Animation',    alias: 'video-animation',isActive: true, ordering: 3, parentId: parentCats[7]._id },
    // Sub-categories for Finance
    { catTitle: 'Accounting',           alias: 'accounting',     isActive: true, ordering: 1, parentId: parentCats[2]._id },
    { catTitle: 'Investment Banking',   alias: 'investment',     isActive: true, ordering: 2, parentId: parentCats[2]._id },
  ]);
  logger.info('✅ Categories seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. JOB TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(JobType);
  const jobTypes = await JobType.insertMany([
    { title: 'Full Time',  alias: 'full-time',  color: '#059669', isActive: true, ordering: 1 },
    { title: 'Part Time',  alias: 'part-time',  color: '#2563eb', isActive: true, ordering: 2 },
    { title: 'Contract',   alias: 'contract',   color: '#d97706', isActive: true, ordering: 3 },
    { title: 'Internship', alias: 'internship', color: '#7c3aed', isActive: true, ordering: 4 },
    { title: 'Freelance',  alias: 'freelance',  color: '#db2777', isActive: true, ordering: 5 },
    { title: 'Remote',     alias: 'remote',     color: '#0891b2', isActive: true, ordering: 6 },
    { title: 'Temporary',  alias: 'temporary',  color: '#ea580c', isActive: true, ordering: 7 },
  ]);
  logger.info('✅ Job types seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CAREER LEVELS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(CareerLevel);
  const careerLevels = await CareerLevel.insertMany([
    { title: 'Entry Level',      status: true, ordering: 1 },
    { title: 'Mid Level',        status: true, ordering: 2 },
    { title: 'Senior Level',     status: true, ordering: 3 },
    { title: 'Team Lead',        status: true, ordering: 4 },
    { title: 'Manager',          status: true, ordering: 5 },
    { title: 'Senior Manager',   status: true, ordering: 6 },
    { title: 'Director',         status: true, ordering: 7 },
    { title: 'VP / C-Level',     status: true, ordering: 8 },
    { title: 'Executive',        status: true, ordering: 9 },
    { title: 'Student / Intern', status: true, ordering: 10 },
  ]);
  logger.info('✅ Career levels seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EDUCATION
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Education);
  const educations = await Education.insertMany([
    { title: 'High School',               isActive: true, ordering: 1 },
    { title: 'Diploma',                   isActive: true, ordering: 2 },
    { title: "Bachelor's Degree",         isActive: true, ordering: 3, isDefault: true },
    { title: "Master's Degree",           isActive: true, ordering: 4 },
    { title: 'PhD / Doctorate',           isActive: true, ordering: 5 },
    { title: 'Professional Certification',isActive: true, ordering: 6 },
    { title: 'Any',                       isActive: true, ordering: 7 },
  ]);
  logger.info('✅ Education seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SALARY RANGE TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(SalaryRangeType);
  const salaryTypes = await SalaryRangeType.insertMany([
    { title: 'Per Month', status: true, ordering: 1, isDefault: true },
    { title: 'Per Year',  status: true, ordering: 2 },
    { title: 'Per Hour',  status: true, ordering: 3 },
    { title: 'Per Day',   status: true, ordering: 4 },
    { title: 'Fixed',     status: true, ordering: 5 },
  ]);
  logger.info('✅ Salary range types seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. COUNTRIES / STATES / CITIES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Country, State, City);
  const [india, usa, uk] = await Country.insertMany([
    { name: 'India',          nameCode: 'IN', shortCountry: 'IND', dialCode: 91,  enabled: true },
    { name: 'United States',  nameCode: 'US', shortCountry: 'USA', dialCode: 1,   enabled: true },
    { name: 'United Kingdom', nameCode: 'GB', shortCountry: 'GBR', dialCode: 44,  enabled: true },
    { name: 'United Arab Emirates', nameCode: 'AE', shortCountry: 'ARE', dialCode: 971, enabled: true },
    { name: 'Singapore',      nameCode: 'SG', shortCountry: 'SGP', dialCode: 65,  enabled: true },
  ]);

  const [mh, ka, dl, ca, ny] = await State.insertMany([
    { name: 'Maharashtra',  shortRegion: 'MH', countryId: india._id, enabled: true },
    { name: 'Karnataka',    shortRegion: 'KA', countryId: india._id, enabled: true },
    { name: 'Delhi',        shortRegion: 'DL', countryId: india._id, enabled: true },
    { name: 'California',   shortRegion: 'CA', countryId: usa._id,   enabled: true },
    { name: 'New York',     shortRegion: 'NY', countryId: usa._id,   enabled: true },
    { name: 'England',      shortRegion: 'ENG', countryId: uk._id,   enabled: true },
  ]);

  const cities = await City.insertMany([
    { name: 'Mumbai',    cityName: 'Mumbai',    stateId: mh._id, countryId: india._id, enabled: true, latitude: '19.0760', longitude: '72.8777' },
    { name: 'Pune',      cityName: 'Pune',      stateId: mh._id, countryId: india._id, enabled: true, latitude: '18.5204', longitude: '73.8567' },
    { name: 'Bangalore', cityName: 'Bangalore', stateId: ka._id, countryId: india._id, enabled: true, latitude: '12.9716', longitude: '77.5946' },
    { name: 'New Delhi', cityName: 'New Delhi', stateId: dl._id, countryId: india._id, enabled: true, latitude: '28.6139', longitude: '77.2090' },
    { name: 'Hyderabad', cityName: 'Hyderabad', stateId: ka._id, countryId: india._id, enabled: true, latitude: '17.3850', longitude: '78.4867' },
    { name: 'Chennai',   cityName: 'Chennai',   stateId: ka._id, countryId: india._id, enabled: true, latitude: '13.0827', longitude: '80.2707' },
    { name: 'San Francisco', cityName: 'San Francisco', stateId: ca._id, countryId: usa._id, enabled: true, latitude: '37.7749', longitude: '-122.4194' },
    { name: 'New York City', cityName: 'New York City', stateId: ny._id, countryId: usa._id, enabled: true, latitude: '40.7128', longitude: '-74.0060' },
    { name: 'London',    cityName: 'London',    stateId: null, countryId: uk._id, enabled: true, latitude: '51.5074', longitude: '-0.1278' },
  ]);
  logger.info('✅ Countries / States / Cities seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. PACKAGES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Package);
  const packages = await Package.insertMany([
    // Jobseeker
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
    // Employer
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
      resumeSearch: 50, jobTime: 30, jobTimeUnit: 'days',
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
      packageFor: 'employer', status: true, stripeSubscription: true,
    },
  ]);
  logger.info('✅ Packages seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. TAGS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Tag);
  await Tag.insertMany([
    { tag: 'JavaScript', alias: 'javascript', tagFor: 1, status: true },
    { tag: 'Python',     alias: 'python',     tagFor: 1, status: true },
    { tag: 'React',      alias: 'react',      tagFor: 1, status: true },
    { tag: 'Node.js',    alias: 'nodejs',     tagFor: 1, status: true },
    { tag: 'MongoDB',    alias: 'mongodb',    tagFor: 1, status: true },
    { tag: 'AWS',        alias: 'aws',        tagFor: 1, status: true },
    { tag: 'Docker',     alias: 'docker',     tagFor: 1, status: true },
    { tag: 'Kubernetes', alias: 'kubernetes', tagFor: 1, status: true },
    { tag: 'TypeScript', alias: 'typescript', tagFor: 1, status: true },
    { tag: 'GraphQL',    alias: 'graphql',    tagFor: 1, status: true },
    { tag: 'Machine Learning', alias: 'machine-learning', tagFor: 2, status: true },
    { tag: 'Data Analysis',   alias: 'data-analysis',    tagFor: 2, status: true },
    { tag: 'SQL',             alias: 'sql',               tagFor: 2, status: true },
    { tag: 'Excel',           alias: 'excel',             tagFor: 2, status: true },
    { tag: 'Communication',   alias: 'communication',     tagFor: 2, status: true },
    { tag: 'Leadership',      alias: 'leadership',        tagFor: 2, status: true },
    { tag: 'Project Management', alias: 'project-management', tagFor: 2, status: true },
    { tag: 'Agile',           alias: 'agile',             tagFor: 2, status: true },
  ]);
  logger.info('✅ Tags seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. EMAIL TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(EmailTemplate, EmailTemplateConfig);
  await EmailTemplate.insertMany([
    {
      templateFor: 'welcome',
      title: 'Welcome Email',
      subject: 'Welcome to HireHub!',
      body: `<h2>Welcome {{firstName}}!</h2><p>We're excited to have you on HireHub. Start exploring thousands of opportunities today.</p>`,
      status: true,
      variables: ['firstName', 'lastName', 'email'],
    },
    {
      templateFor: 'email_verification',
      title: 'Email Verification',
      subject: 'Verify your HireHub email',
      body: `<p>Hi {{firstName}}, please verify your email by clicking: <a href="{{verificationLink}}">Verify Email</a></p>`,
      status: true,
      variables: ['firstName', 'verificationLink'],
    },
    {
      templateFor: 'password_reset',
      title: 'Password Reset',
      subject: 'Reset your HireHub password',
      body: `<p>Hi {{firstName}}, reset your password: <a href="{{resetLink}}">Reset Password</a>. Valid for 1 hour.</p>`,
      status: true,
      variables: ['firstName', 'resetLink'],
    },
    {
      templateFor: 'application_received',
      title: 'Application Received (Employer)',
      subject: 'New application for {{jobTitle}}',
      body: `<p>{{applicantName}} has applied for <strong>{{jobTitle}}</strong>. <a href="{{applicationLink}}">View Application</a></p>`,
      status: true,
      variables: ['applicantName', 'jobTitle', 'applicationLink'],
    },
    {
      templateFor: 'application_status',
      title: 'Application Status Update (Jobseeker)',
      subject: 'Your application status has been updated',
      body: `<p>Hi {{firstName}}, your application for <strong>{{jobTitle}}</strong> at {{companyName}} has been updated to: <strong>{{status}}</strong>.</p>`,
      status: true,
      variables: ['firstName', 'jobTitle', 'companyName', 'status'],
    },
    {
      templateFor: 'interview_scheduled',
      title: 'Interview Scheduled',
      subject: 'Interview Scheduled for {{jobTitle}}',
      body: `<p>Hi {{firstName}}, your interview for {{jobTitle}} is scheduled on {{interviewDate}} at {{interviewTime}}. Type: {{interviewType}}.</p>`,
      status: true,
      variables: ['firstName', 'jobTitle', 'interviewDate', 'interviewTime', 'interviewType'],
    },
    {
      templateFor: 'package_expiry',
      title: 'Package Expiry Warning',
      subject: 'Your HireHub package expires soon',
      body: `<p>Hi {{firstName}}, your {{packageName}} package expires on {{expiryDate}}. <a href="{{renewLink}}">Renew Now</a></p>`,
      status: true,
      variables: ['firstName', 'packageName', 'expiryDate', 'renewLink'],
    },
    {
      templateFor: 'job_alert',
      title: 'Job Alert',
      subject: 'New jobs matching your alert: {{alertName}}',
      body: `<p>Hi {{firstName}}, {{jobCount}} new jobs match your alert "{{alertName}}". <a href="{{jobsLink}}">View Jobs</a></p>`,
      status: true,
      variables: ['firstName', 'alertName', 'jobCount', 'jobsLink'],
    },
  ]);

  await EmailTemplateConfig.insertMany([
    { emailFor: 'welcome',              admin: false, employer: true,  jobseeker: true  },
    { emailFor: 'email_verification',   admin: false, employer: true,  jobseeker: true  },
    { emailFor: 'password_reset',       admin: false, employer: true,  jobseeker: true  },
    { emailFor: 'application_received', admin: true,  employer: true,  jobseeker: false },
    { emailFor: 'application_status',   admin: false, employer: false, jobseeker: true  },
    { emailFor: 'interview_scheduled',  admin: false, employer: false, jobseeker: true  },
    { emailFor: 'package_expiry',       admin: true,  employer: true,  jobseeker: true  },
    { emailFor: 'job_alert',            admin: false, employer: false, jobseeker: true  },
  ]);
  logger.info('✅ Email templates seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. AI MODELS & WRAPPERS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(AiModel, AiWrapper);
  await AiModel.insertMany([
    { code: 'gpt-4o',           name: 'GPT-4o',               providerId: 'openai',    ordering: 1, status: true },
    { code: 'gpt-4-turbo',      name: 'GPT-4 Turbo',          providerId: 'openai',    ordering: 2, status: true },
    { code: 'claude-3-5-sonnet',name: 'Claude 3.5 Sonnet',    providerId: 'anthropic', ordering: 3, status: true },
    { code: 'gemini-1.5-pro',   name: 'Gemini 1.5 Pro',       providerId: 'google',    ordering: 4, status: true },
  ]);

  await AiWrapper.insertMany([
    { code: 'job_description_writer',  name: 'Job Description Writer',  description: 'Write compelling job descriptions',     useCaseCode: 'jd_write',      featured: true,  base: true,  ordering: 1, status: true },
    { code: 'resume_scorer',           name: 'Resume ATS Scorer',       description: 'Score resume against job description',  useCaseCode: 'resume_score',  featured: true,  base: true,  ordering: 2, status: true },
    { code: 'cover_letter_writer',     name: 'Cover Letter Writer',     description: 'Generate personalised cover letters',   useCaseCode: 'cover_write',   featured: false, base: true,  ordering: 3, status: true },
    { code: 'interview_questions',     name: 'Interview Q Generator',   description: 'Generate role-specific questions',      useCaseCode: 'interview_qs',  featured: true,  base: false, ordering: 4, status: true },
    { code: 'salary_estimator',        name: 'Salary Estimator',        description: 'Estimate market salary for a role',     useCaseCode: 'salary_est',    featured: false, base: false, ordering: 5, status: true },
    { code: 'skill_gap_analyzer',      name: 'Skill Gap Analyzer',      description: 'Identify missing skills for a role',    useCaseCode: 'skill_gap',     featured: false, base: false, ordering: 6, status: true },
  ]);
  logger.info('✅ AI models & wrappers seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. PAYMENT METHOD CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(PaymentMethodConfig);
  await PaymentMethodConfig.insertMany([
    { configName: 'stripe_publishable_key', configValue: 'pk_test_xxxxxxxxxxxx', configFor: 'stripe' },
    { configName: 'stripe_secret_key',      configValue: 'sk_test_xxxxxxxxxxxx', configFor: 'stripe' },
    { configName: 'stripe_webhook_secret',  configValue: 'whsec_xxxxxxxxxxxx',   configFor: 'stripe' },
    { configName: 'razorpay_key_id',        configValue: 'rzp_test_xxxxxxxxxx',  configFor: 'razorpay' },
    { configName: 'razorpay_key_secret',    configValue: 'xxxxxxxxxxxxxxxxxx',   configFor: 'razorpay' },
    { configName: 'paypal_client_id',       configValue: 'AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxW', configFor: 'paypal' },
    { configName: 'paypal_client_secret',   configValue: 'ExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxT', configFor: 'paypal' },
    { configName: 'bank_account_name',      configValue: 'HireHub Pvt Ltd',      configFor: 'bank' },
    { configName: 'bank_account_number',    configValue: '1234567890',           configFor: 'bank' },
    { configName: 'bank_ifsc_code',         configValue: 'HDFC0001234',          configFor: 'bank' },
  ]);
  logger.info('✅ Payment method config seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. USERS (Admin + Employer + Jobseeker)
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(User, RefreshToken);

  const hashedPw = await bcrypt.hash('Pass@123456', 12);

  const [admin, employer, jobseeker, employer2, jobseeker2] = await User.insertMany([
    // ── ADMIN ────────────────────────────────────────────────────────────────
    {
      firstName: 'Arjun', lastName: 'Sharma',
      email: 'admin@hirehub.io',
      password: hashedPw,
      phone: '+91-9800000001',
      role: 'admin',
      status: 'active',
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: 100,
      avatar: { publicId: 'avatars/admin', secureUrl: 'https://ui-avatars.com/api/?name=Arjun+Sharma&background=6366f1&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(),
      lastActive: new Date(),
      loginCount: 45,
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },

    // ── EMPLOYER 1 ───────────────────────────────────────────────────────────
    {
      firstName: 'Priya', lastName: 'Mehta',
      email: 'employer@hirehub.io',
      password: hashedPw,
      phone: '+91-9800000002',
      role: 'employer',
      status: 'active',
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: 90,
      avatar: { publicId: 'avatars/employer1', secureUrl: 'https://ui-avatars.com/api/?name=Priya+Mehta&background=10b981&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActive: new Date(),
      loginCount: 22,
      socialLinks: { linkedin: 'https://linkedin.com/in/priyamehta', website: 'https://techcorp.io' },
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: false, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },

    // ── JOBSEEKER 1 ──────────────────────────────────────────────────────────
    {
      firstName: 'Rahul', lastName: 'Verma',
      email: 'jobseeker@hirehub.io',
      password: hashedPw,
      phone: '+91-9800000003',
      role: 'jobseeker',
      status: 'active',
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: 85,
      avatar: { publicId: 'avatars/jobseeker1', secureUrl: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000),
      lastActive: new Date(),
      loginCount: 18,
      socialLinks: { linkedin: 'https://linkedin.com/in/rahulverma', github: 'https://github.com/rahulverma' },
      notificationSettings: { emailOnApplication: true, emailOnMessage: true, emailOnJobAlert: true, emailOnPackageExpiry: true, pushNotifications: true, smsNotifications: false },
    },

    // ── EMPLOYER 2 ───────────────────────────────────────────────────────────
    {
      firstName: 'Vikram', lastName: 'Singh',
      email: 'vikram.employer@hirehub.io',
      password: hashedPw,
      phone: '+91-9800000004',
      role: 'employer',
      status: 'active',
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: 80,
      avatar: { publicId: 'avatars/employer2', secureUrl: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=3b82f6&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastActive: new Date(),
      loginCount: 10,
    },

    // ── JOBSEEKER 2 ──────────────────────────────────────────────────────────
    {
      firstName: 'Sneha', lastName: 'Kapoor',
      email: 'sneha.jobseeker@hirehub.io',
      password: hashedPw,
      phone: '+91-9800000005',
      role: 'jobseeker',
      status: 'active',
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: 70,
      avatar: { publicId: 'avatars/jobseeker2', secureUrl: 'https://ui-avatars.com/api/?name=Sneha+Kapoor&background=ec4899&color=fff&size=200', resourceType: 'image' },
      lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000),
      lastActive: new Date(),
      loginCount: 7,
    },
  ], { ordered: true });

  logger.info('✅ Users seeded: admin / employer / jobseeker (password: Pass@123456)');

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. USER PACKAGES (assign packages to users)
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(UserPackage, Invoice, TransactionLog);

  const empPkg = packages.find(p => p.title === 'Employer Pro');
  const jsPkg  = packages.find(p => p.title === 'Jobseeker Premium');
  const emp2Pkg = packages.find(p => p.title === 'Employer Basic');
  const js2Pkg  = packages.find(p => p.title === 'Jobseeker Free');

  const pkgEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // +60 days

  const [empUserPkg, jsUserPkg, emp2UserPkg, js2UserPkg] = await UserPackage.insertMany([
    {
      uid: employer._id, packageId: empPkg._id,
      endDate: pkgEndDate, status: true, isActive: true,
      remainingJobs: 48, remainingFeaturedJobs: 4, remainingCompanies: 1,
      remainingResumeSearch: 980, remainingDepartments: 9,
    },
    {
      uid: jobseeker._id, packageId: jsPkg._id,
      endDate: pkgEndDate, status: true, isActive: true,
      remainingResumes: 18, remainingFeaturedResumes: 2,
      remainingJobApply: 970, remainingJobAlerts: 18, remainingCoverLetters: 17,
    },
    {
      uid: employer2._id, packageId: emp2Pkg._id,
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: true, isActive: true,
      remainingJobs: 8, remainingFeaturedJobs: 1, remainingCompanies: 1,
      remainingResumeSearch: 40, remainingDepartments: 2,
    },
    {
      uid: jobseeker2._id, packageId: js2Pkg._id,
      endDate: new Date(Date.now() + 9999 * 24 * 60 * 60 * 1000),
      status: true, isActive: true,
      remainingResumes: 1, remainingJobApply: 3, remainingJobAlerts: 1,
    },
  ]);

  // Invoices
  const [empInvoice, jsInvoice] = await Invoice.insertMany([
    {
      uid: employer._id, recordId: empUserPkg._id,
      description: 'Employer Pro Package - 30 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 2999,
      payMethod: 'stripe', paymentStatus: 'paid',
      transactionId: 'ch_3OxTest' + Date.now(),
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      payerName: 'Priya Mehta', payerEmail: 'employer@hirehub.io',
      status: true,
    },
    {
      uid: jobseeker._id, recordId: jsUserPkg._id,
      description: 'Jobseeker Premium Package - 90 Days',
      type: 'package', currencyId: currencies[0]._id, amount: 799,
      payMethod: 'razorpay', paymentStatus: 'paid',
      transactionId: 'pay_' + Date.now(),
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      payerName: 'Rahul Verma', payerEmail: 'jobseeker@hirehub.io',
      status: true,
    },
  ]);

  await TransactionLog.insertMany([
    { uid: employer._id,  userPackageId: empUserPkg._id, recordId: empInvoice._id, type: 'package_purchase', status: true },
    { uid: jobseeker._id, userPackageId: jsUserPkg._id,  recordId: jsInvoice._id,  type: 'package_purchase', status: true },
  ]);
  logger.info('✅ User packages & invoices seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. COMPANIES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Company);

  const [company1, company2] = await Company.insertMany([
    {
      uid: employer._id,
      name: 'TechCorp Solutions Pvt Ltd',
      slug: 'techcorp-solutions',
      alias: 'TechCorp',
      url: 'https://techcorp.io',
      contactEmail: 'hr@techcorp.io',
      tagline: 'Building the Future, One Line at a Time',
      description: `<p>TechCorp Solutions is a leading software product company headquartered in Bangalore, India. Founded in 2015, we specialise in cloud-native SaaS products, enterprise integrations, and AI-driven analytics platforms. Our 500+ engineers work on cutting-edge technologies serving Fortune 500 clients globally.</p><p>We believe in a culture of continuous learning, radical transparency, and shipping great products fast. Our engineering blog is read by 50,000+ developers monthly.</p>`,
      phone: '+91-80-40001234',
      city: 'Bangalore',
      address1: '4th Floor, Tower B, Embassy Tech Village',
      address2: 'Outer Ring Road, Devarabisanahalli',
      cities: [cities[2]._id],
      logo: { publicId: 'companies/techcorp/logo', secureUrl: 'https://ui-avatars.com/api/?name=TechCorp&background=6366f1&color=fff&size=200&bold=true', resourceType: 'image', fileSize: 45000 },
      isVerified: true,
      verificationStatus: 'approved',
      isActive: true,
      isGoldCompany: true,
      startGoldDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endGoldDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isFeaturedCompany: true,
      startFeaturedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endFeaturedDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      socialLinks: {
        linkedin: 'https://linkedin.com/company/techcorp-solutions',
        twitter: 'https://twitter.com/techcorpio',
        website: 'https://techcorp.io',
        facebook: 'https://facebook.com/techcorpio',
      },
      gallery: [
        { publicId: 'companies/techcorp/g1', secureUrl: 'https://picsum.photos/seed/techcorp1/800/400', caption: 'Our Bangalore HQ', uploadedAt: new Date() },
        { publicId: 'companies/techcorp/g2', secureUrl: 'https://picsum.photos/seed/techcorp2/800/400', caption: 'Team Offsite 2024',  uploadedAt: new Date() },
        { publicId: 'companies/techcorp/g3', secureUrl: 'https://picsum.photos/seed/techcorp3/800/400', caption: 'Hackathon Winners',  uploadedAt: new Date() },
      ],
      metaDescription: 'TechCorp Solutions - Leading software company hiring top engineers in India',
      metaKeywords: 'software jobs, bangalore jobs, tech company, react jobs, nodejs jobs',
      hits: 1240,
      followersCount: 342,
      jobsCount: 8,
      userpackageId: empUserPkg._id,
      status: 1,
    },
    {
      uid: employer2._id,
      name: 'InnovateMind Digital',
      slug: 'innovatemind-digital',
      alias: 'InnovateMind',
      url: 'https://innovatemind.in',
      contactEmail: 'careers@innovatemind.in',
      tagline: 'Digital Transformation. Reimagined.',
      description: `<p>InnovateMind Digital is a full-service digital agency based in Mumbai, specialising in e-commerce, digital marketing, and mobile applications. With a portfolio of 200+ successful projects, we are the go-to partner for brands looking to dominate the digital landscape.</p>`,
      phone: '+91-22-40005678',
      city: 'Mumbai',
      address1: 'Unit 301, Sunshine Business Park',
      address2: 'Andheri East, Mumbai',
      cities: [cities[0]._id],
      logo: { publicId: 'companies/innovatemind/logo', secureUrl: 'https://ui-avatars.com/api/?name=IM&background=10b981&color=fff&size=200&bold=true', resourceType: 'image', fileSize: 38000 },
      isVerified: true,
      verificationStatus: 'approved',
      isActive: true,
      isGoldCompany: false,
      isFeaturedCompany: false,
      socialLinks: {
        linkedin: 'https://linkedin.com/company/innovatemind',
        website: 'https://innovatemind.in',
      },
      hits: 460,
      followersCount: 88,
      jobsCount: 3,
      userpackageId: emp2UserPkg._id,
      status: 1,
    },
  ]);
  logger.info('✅ Companies seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Department);
  const departments = await Department.insertMany([
    { uid: employer._id,  companyId: company1._id, name: 'Engineering',       alias: 'engineering', description: 'Product and platform engineering teams', status: true },
    { uid: employer._id,  companyId: company1._id, name: 'Product',           alias: 'product',     description: 'Product management and strategy',        status: true },
    { uid: employer._id,  companyId: company1._id, name: 'Design',            alias: 'design',      description: 'UI/UX and brand design',                  status: true },
    { uid: employer._id,  companyId: company1._id, name: 'Marketing',         alias: 'marketing',   description: 'Growth, content, and performance marketing', status: true },
    { uid: employer._id,  companyId: company1._id, name: 'Human Resources',   alias: 'hr',          description: 'Talent acquisition and people ops',      status: true },
    { uid: employer._id,  companyId: company1._id, name: 'Finance',           alias: 'finance',     description: 'Finance, accounts, and legal',            status: true },
    { uid: employer2._id, companyId: company2._id, name: 'Development',       alias: 'development', description: 'Web and mobile development',              status: true },
    { uid: employer2._id, companyId: company2._id, name: 'Creative',          alias: 'creative',    description: 'Design and creative team',                status: true },
  ]);
  logger.info('✅ Departments seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. JOBS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Job);

  const itCat     = parentCats[0]._id;
  const designCat = parentCats[7]._id;
  const mktCat    = parentCats[1]._id;
  const hrCat     = parentCats[3]._id;
  const finCat    = parentCats[2]._id;
  const ftType    = jobTypes[0]._id;
  const ptType    = jobTypes[1]._id;
  const remoteType = jobTypes[5]._id;

  const jobs = await Job.insertMany([
    // ── TechCorp Jobs ─────────────────────────────────────────────────────────
    {
      uid: employer._id, companyId: company1._id,
      title: 'Senior Full Stack Developer (React + Node.js)',
      slug: 'senior-full-stack-developer-react-nodejs-techcorp',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: departments[0]._id,
      tags: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
      status: 'approved',
      description: `<h3>About the Role</h3><p>We are looking for an experienced Senior Full Stack Developer to join our core product team. You will be responsible for building scalable, performant web applications using React on the frontend and Node.js on the backend.</p><h3>Responsibilities</h3><ul><li>Design and implement new product features end-to-end</li><li>Review code and mentor junior developers</li><li>Architect scalable backend services using Node.js and MongoDB</li><li>Collaborate with Product and Design teams</li><li>Improve test coverage and CI/CD pipelines</li></ul><h3>Tech Stack</h3><p>React, TypeScript, Node.js, Express, MongoDB, Redis, Docker, AWS (ECS, S3, CloudFront)</p>`,
      qualifications: 'B.E./B.Tech in Computer Science or related field. 4+ years of experience.',
      prefferdSkills: 'React, Node.js, TypeScript, MongoDB, AWS, Docker, REST APIs, GraphQL',
      city: 'Bangalore', address1: '4th Floor, Embassy Tech Village', latitude: '12.9716', longitude: '77.5946',
      cities: [cities[2]._id],
      workplaceType: 'hybrid',
      contactEmail: 'jobs@techcorp.io', showContact: false,
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 18, salaryMax: 28, salaryDuration: 100000, currency: 'INR',
      experience: 4, noOfJobs: 2,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isGoldJob: true, startGoldDate: new Date(), endGoldDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isFeaturedJob: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isUrgent: true, urgentUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      viewsCount: 380, applicationsCount: 12,
      userpackageId: empUserPkg._id,
      aiJobSearchText: 'senior full stack developer react nodejs javascript typescript mongodb aws bangalore',
      metaDescription: 'Join TechCorp as Senior Full Stack Developer. React, Node.js, MongoDB. Hybrid - Bangalore.',
    },
    {
      uid: employer._id, companyId: company1._id,
      title: 'DevOps Engineer - AWS & Kubernetes',
      slug: 'devops-engineer-aws-kubernetes-techcorp',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: departments[0]._id,
      tags: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      status: 'approved',
      description: `<h3>About the Role</h3><p>We're hiring a DevOps Engineer to manage and scale our cloud infrastructure on AWS. You'll own our Kubernetes clusters, CI/CD pipelines, and infrastructure-as-code setup.</p><h3>Responsibilities</h3><ul><li>Manage EKS clusters and containerised workloads</li><li>Automate infrastructure using Terraform and Ansible</li><li>Build and maintain CI/CD pipelines (GitHub Actions)</li><li>Implement monitoring with Datadog and PagerDuty</li><li>Ensure security and compliance of cloud infrastructure</li></ul>`,
      prefferdSkills: 'AWS, Kubernetes, Docker, Terraform, GitHub Actions, Linux, Python',
      city: 'Bangalore', workplaceType: 'remote',
      cities: [cities[2]._id],
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 20, salaryMax: 32, salaryDuration: 100000, currency: 'INR',
      experience: 3, noOfJobs: 1,
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      isFeaturedJob: true, startFeaturedDate: new Date(), endFeaturedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      viewsCount: 220, applicationsCount: 7,
      userpackageId: empUserPkg._id,
      status: 'approved',
    },
    {
      uid: employer._id, companyId: company1._id,
      title: 'Product Designer (UI/UX)',
      slug: 'product-designer-ui-ux-techcorp',
      categoryId: designCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: departments[2]._id,
      tags: ['Figma', 'UI/UX', 'Design System', 'Prototyping'],
      status: 'approved',
      description: `<h3>About the Role</h3><p>We are looking for a Product Designer with a strong portfolio in SaaS product design. You will own the design process from research to high-fidelity prototypes.</p><h3>Responsibilities</h3><ul><li>Conduct user research and usability testing</li><li>Design intuitive interfaces in Figma</li><li>Maintain and evolve our design system</li><li>Collaborate closely with engineering and product</li></ul>`,
      prefferdSkills: 'Figma, User Research, Prototyping, Design Systems, Accessibility, Motion Design',
      city: 'Bangalore', workplaceType: 'onsite',
      cities: [cities[2]._id],
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 12, salaryMax: 20, salaryDuration: 100000, currency: 'INR',
      experience: 2, noOfJobs: 1,
      expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      viewsCount: 145, applicationsCount: 5,
      userpackageId: empUserPkg._id,
      status: 'approved',
    },
    {
      uid: employer._id, companyId: company1._id,
      title: 'Data Scientist - NLP & LLMs',
      slug: 'data-scientist-nlp-llms-techcorp',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[3]._id,
      departmentId: departments[0]._id,
      tags: ['Python', 'Machine Learning', 'NLP', 'LLM', 'PyTorch'],
      status: 'approved',
      description: `<h3>About the Role</h3><p>Join our AI team to build production NLP and LLM-powered features. You will fine-tune large language models, build retrieval-augmented generation pipelines, and ship AI features used by millions.</p>`,
      prefferdSkills: 'Python, PyTorch, Transformers, RAG, OpenAI API, LangChain, SQL, MLflow',
      city: 'Bangalore', workplaceType: 'hybrid',
      cities: [cities[2]._id],
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 2400000, salaryMax: 4000000, currency: 'INR',
      experience: 3, noOfJobs: 2,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isUrgent: true, urgentUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      viewsCount: 510, applicationsCount: 18,
      userpackageId: empUserPkg._id,
      status: 'approved',
    },
    {
      uid: employer._id, companyId: company1._id,
      title: 'Engineering Manager - Platform Team',
      slug: 'engineering-manager-platform-techcorp',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[4]._id, educationId: educations[2]._id,
      departmentId: departments[0]._id,
      tags: ['Leadership', 'Node.js', 'AWS', 'Agile', 'System Design'],
      status: 'approved',
      description: `<p>Lead a team of 8-12 engineers building our core platform. Own roadmap, architecture decisions, and engineering quality for the Platform squad.</p>`,
      prefferdSkills: 'Technical Leadership, System Design, Node.js, AWS, Agile, Mentoring',
      city: 'Bangalore', workplaceType: 'hybrid',
      cities: [cities[2]._id],
      hideSalaryRange: false, salaryType: salaryTypes[1]._id,
      salaryMin: 4000000, salaryMax: 7000000, currency: 'INR',
      experience: 8, noOfJobs: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      viewsCount: 290, applicationsCount: 6,
      userpackageId: empUserPkg._id,
      status: 'approved',
    },
    // ── InnovateMind Jobs ─────────────────────────────────────────────────────
    {
      uid: employer2._id, companyId: company2._id,
      title: 'React Native Developer',
      slug: 'react-native-developer-innovatemind',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: departments[6]._id,
      tags: ['React Native', 'JavaScript', 'iOS', 'Android', 'REST API'],
      status: 'approved',
      description: `<p>We are looking for a React Native Developer to build cross-platform mobile apps for our e-commerce clients. You will be responsible for delivering polished, performant apps on both iOS and Android.</p>`,
      prefferdSkills: 'React Native, JavaScript, Redux, REST APIs, Firebase, Push Notifications',
      city: 'Mumbai', workplaceType: 'onsite',
      cities: [cities[0]._id],
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 8, salaryMax: 14, salaryDuration: 100000, currency: 'INR',
      experience: 2, noOfJobs: 2,
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      viewsCount: 180, applicationsCount: 9,
      userpackageId: emp2UserPkg._id,
      status: 'approved',
    },
    {
      uid: employer2._id, companyId: company2._id,
      title: 'Digital Marketing Specialist',
      slug: 'digital-marketing-specialist-innovatemind',
      categoryId: mktCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: departments[6]._id,
      tags: ['SEO', 'Google Ads', 'Meta Ads', 'Analytics', 'Content Marketing'],
      status: 'approved',
      description: `<p>Drive growth for our clients through data-driven digital marketing campaigns across SEO, PPC, social media, and email marketing.</p>`,
      prefferdSkills: 'Google Ads, Meta Ads Manager, SEO, Google Analytics 4, Email Marketing, Copywriting',
      city: 'Mumbai', workplaceType: 'hybrid',
      cities: [cities[0]._id],
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 6, salaryMax: 10, salaryDuration: 100000, currency: 'INR',
      experience: 2, noOfJobs: 1,
      expiresAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      viewsCount: 95, applicationsCount: 4,
      userpackageId: emp2UserPkg._id,
      status: 'approved',
    },
    {
      uid: employer2._id, companyId: company2._id,
      title: 'UI/UX Designer - E-Commerce',
      slug: 'ui-ux-designer-ecommerce-innovatemind',
      categoryId: designCat, jobType: ptType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: departments[7]._id,
      tags: ['Figma', 'E-Commerce', 'Wireframing', 'User Research'],
      status: 'approved',
      description: `<p>Design exceptional shopping experiences for India's top e-commerce brands. You'll work on web and app designs across mobile and desktop.</p>`,
      prefferdSkills: 'Figma, Adobe XD, Wireframing, Prototyping, User Testing, Shopify',
      city: 'Mumbai', workplaceType: 'hybrid',
      cities: [cities[0]._id],
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 5, salaryMax: 9, salaryDuration: 100000, currency: 'INR',
      experience: 1, noOfJobs: 1,
      expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      viewsCount: 72, applicationsCount: 3,
      userpackageId: emp2UserPkg._id,
      status: 'approved',
    },
    // Pending / Draft jobs for realism
    {
      uid: employer._id, companyId: company1._id,
      title: 'Senior Backend Engineer - Go',
      slug: 'senior-backend-engineer-go-techcorp-draft',
      categoryId: itCat, jobType: ftType,
      careerLevel: careerLevels[2]._id, educationId: educations[2]._id,
      departmentId: departments[0]._id,
      tags: ['Go', 'gRPC', 'Kubernetes', 'PostgreSQL'],
      status: 'draft',
      description: `<p>We are building our next-generation microservices platform in Go. Looking for an experienced backend engineer.</p>`,
      prefferdSkills: 'Go, gRPC, PostgreSQL, Redis, Kubernetes, Docker',
      city: 'Bangalore', workplaceType: 'remote',
      hideSalaryRange: true, experience: 5, noOfJobs: 1,
      userpackageId: empUserPkg._id,
    },
    {
      uid: employer._id, companyId: company1._id,
      title: 'HR Business Partner',
      slug: 'hr-business-partner-techcorp',
      categoryId: hrCat, jobType: ftType,
      careerLevel: careerLevels[1]._id, educationId: educations[2]._id,
      departmentId: departments[4]._id,
      tags: ['HR', 'Talent Acquisition', 'HRBP', 'Employee Engagement'],
      status: 'pending',
      description: `<p>Drive strategic HR initiatives as an HRBP for our Engineering and Product divisions at TechCorp.</p>`,
      prefferdSkills: 'HR Business Partnering, Talent Acquisition, Performance Management, HRMS',
      city: 'Bangalore', workplaceType: 'onsite',
      hideSalaryRange: false, salaryType: salaryTypes[0]._id,
      salaryMin: 10, salaryMax: 15, salaryDuration: 100000, currency: 'INR',
      experience: 3, noOfJobs: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userpackageId: empUserPkg._id,
    },
  ]);
  logger.info('✅ Jobs seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. RESUMES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Resume);

  const [resume1, resume2] = await Resume.insertMany([
    {
      uid: jobseeker._id,
      applicationTitle: 'Senior Full Stack Developer',
      firstName: 'Rahul', lastName: 'Verma',
      gender: 'male',
      emailAddress: 'jobseeker@hirehub.io',
      cell: '+91-9800000003',
      nationality: 'Indian',
      photo: { publicId: 'resumes/rahul/photo', secureUrl: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff&size=200' },
      jobCategory: itCat, jobType: ftType,
      keywords: 'Full Stack Developer, React, Node.js, MongoDB, AWS, TypeScript',
      tags: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'TypeScript', 'Docker'],
      published: true, searchable: true, visibility: 'public',
      quickApply: true,
      resume: `<p>Experienced Full Stack Developer with 5+ years building scalable web applications. Strong expertise in React, Node.js, and MongoDB. Passionate about clean code, performance optimisation, and mentoring junior developers. Led multiple product launches from 0 to 100K+ users.</p>`,
      skills: 'React.js, Next.js, TypeScript, Node.js, Express.js, MongoDB, PostgreSQL, Redis, AWS (EC2, S3, Lambda, CloudFront), Docker, Kubernetes, Git, REST APIs, GraphQL, Jest, CI/CD',
      institutes: [
        {
          institute: 'Indian Institute of Technology, Delhi',
          instituteCertificateName: "Bachelor of Technology",
          instituteStudyArea: 'Computer Science & Engineering',
          fromDate: '2015', toDate: '2019',
        },
      ],
      employers: [
        {
          employer: 'TechStartup Pvt Ltd',
          employerFromDate: '2022-06', employerToDate: '',
          employerCurrentStatus: 1,
          employerCity: 'Bangalore',
          employerPosition: 'Senior Software Engineer',
          employerPhone: '+91-80-12345678',
          employerAddress: 'Koramangala, Bangalore',
        },
        {
          employer: 'Infosys Ltd',
          employerFromDate: '2019-07', employerToDate: '2022-05',
          employerCurrentStatus: 0,
          employerCity: 'Bangalore',
          employerPosition: 'Software Engineer',
        },
      ],
      languages: [
        { language: 'English',    proficiency: 'fluent' },
        { language: 'Hindi',      proficiency: 'native' },
        { language: 'Kannada',    proficiency: 'beginner' },
      ],
      addresses: [
        { address: 'Flat 302, Green Residency', addressCity: 'Bangalore', latitude: '12.9716', longitude: '77.5946' },
      ],
      isFeaturedResume: true,
      startFeaturedDate: new Date(),
      endFeaturedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      atsScore: 82, completionPercentage: 90,
      hits: 240, viewsCount: 38, downloadCount: 5,
      aiResumeSearchText: 'senior full stack developer react nodejs typescript mongodb aws bangalore 5 years iit',
      userpackageId: jsUserPkg._id,
    },
    {
      uid: jobseeker2._id,
      applicationTitle: 'UI/UX Designer',
      firstName: 'Sneha', lastName: 'Kapoor',
      gender: 'female',
      emailAddress: 'sneha.jobseeker@hirehub.io',
      cell: '+91-9800000005',
      nationality: 'Indian',
      photo: { publicId: 'resumes/sneha/photo', secureUrl: 'https://ui-avatars.com/api/?name=Sneha+Kapoor&background=ec4899&color=fff&size=200' },
      jobCategory: designCat, jobType: ftType,
      keywords: 'UI UX Designer, Figma, Design Systems, User Research, Product Design',
      tags: ['Figma', 'UI/UX', 'Prototyping', 'Design System', 'Adobe XD'],
      published: true, searchable: true, visibility: 'public',
      quickApply: false,
      resume: `<p>Creative UI/UX Designer with 3 years of experience crafting delightful digital experiences for mobile and web. Strong foundation in user research, information architecture, and interaction design. Currently designing for fintech and edtech clients.</p>`,
      skills: 'Figma, Adobe XD, Sketch, Prototyping, Wireframing, User Research, Usability Testing, Design Systems, HTML/CSS, Zeplin, Principle, Miro',
      institutes: [
        {
          institute: 'National Institute of Design, Ahmedabad',
          instituteCertificateName: 'Post Graduate Diploma',
          instituteStudyArea: 'Interaction Design',
          fromDate: '2019', toDate: '2021',
        },
        {
          institute: 'University of Mumbai',
          instituteCertificateName: "Bachelor of Fine Arts",
          instituteStudyArea: 'Visual Communication',
          fromDate: '2016', toDate: '2019',
        },
      ],
      employers: [
        {
          employer: 'DesignStudio Co',
          employerFromDate: '2021-09', employerToDate: '',
          employerCurrentStatus: 1,
          employerCity: 'Mumbai',
          employerPosition: 'UI/UX Designer',
        },
      ],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Hindi',   proficiency: 'native' },
        { language: 'Marathi', proficiency: 'native' },
      ],
      addresses: [
        { address: 'A-14, Shiv Nagar Society', addressCity: 'Mumbai', latitude: '19.0760', longitude: '72.8777' },
      ],
      atsScore: 68, completionPercentage: 75,
      hits: 90, viewsCount: 15, downloadCount: 2,
      aiResumeSearchText: 'ui ux designer figma design systems user research prototyping mumbai 3 years nid',
      userpackageId: js2UserPkg._id,
    },
  ]);
  logger.info('✅ Resumes seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. COVER LETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(CoverLetter);
  const [coverLetter1] = await CoverLetter.insertMany([
    {
      uid: jobseeker._id,
      title: 'General Cover Letter - Full Stack Developer',
      alias: 'general-cover-letter-full-stack-developer',
      description: `<p>Dear Hiring Manager,</p><p>I am excited to apply for the Full Stack Developer position. With 5+ years of hands-on experience in React and Node.js, I have built and scaled production systems serving hundreds of thousands of users. I thrive in fast-paced environments and bring a strong track record of shipping high-quality code.</p><p>At my current company, I led the rewrite of our core API layer, reducing latency by 40% and cutting infrastructure costs by 25%. I am deeply passionate about clean architecture, developer experience, and collaborative team culture.</p><p>I would love the opportunity to bring this energy to your team. Please find my resume attached.</p><p>Warm regards,<br/>Rahul Verma</p>`,
      published: true, searchable: true, status: true, hits: 3,
      userpackageId: jsUserPkg._id,
    },
    {
      uid: jobseeker._id,
      title: 'Startup Cover Letter - Engineering Roles',
      alias: 'startup-cover-letter-engineering',
      description: `<p>Dear Team,</p><p>I love building things from scratch, and that is why I am drawn to your startup. I bring full-stack expertise, a bias for action, and the ability to wear multiple hats. Let's build something great together.</p><p>Rahul Verma</p>`,
      published: true, searchable: false, status: true, hits: 1,
      userpackageId: jsUserPkg._id,
    },
    {
      uid: jobseeker2._id,
      title: 'Designer Cover Letter',
      alias: 'designer-cover-letter',
      description: `<p>Dear Hiring Manager,</p><p>As a UI/UX Designer with a background in visual communication, I bring both aesthetic sensibility and user-centred thinking to every project. I am excited to contribute to your product design team.</p><p>Sneha Kapoor</p>`,
      published: true, searchable: true, status: true, hits: 0,
      userpackageId: js2UserPkg._id,
    },
  ]);
  logger.info('✅ Cover letters seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. APPLICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Application);

  const approvedJobs = jobs.filter(j => j.status === 'approved');

  const [app1, app2, app3, app4, app5] = await Application.insertMany([
    {
      jobId: approvedJobs[0]._id, // Senior Full Stack
      uid: jobseeker._id,
      cvId: resume1._id,
      companyId: company1._id,
      applyMessage: 'I am very excited about this role! I have been following TechCorp for years and this position is a perfect match for my skills in React and Node.js.',
      coverLetterId: coverLetter1._id,
      quickApply: false,
      status: 'shortlisted',
      statusHistory: [
        { status: 'applied',     note: 'Application submitted',             changedBy: jobseeker._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { status: 'reviewed',    note: 'Resume reviewed by HR',              changedBy: employer._id,  changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { status: 'shortlisted', note: 'Strong profile, shortlisted',        changedBy: employer._id,  changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
      resumeView: true,
      resumeViewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      rating: 4,
      employerNotes: 'Strong React and Node.js background. Has IIT degree. Call for technical screen.',
      candidateNotes: 'First choice company. Very interested.',
      interview: {
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        type: 'video',
        link: 'https://meet.google.com/abc-defg-hij',
        notes: 'Round 1 - Technical Interview with Platform Team Lead',
      },
      userpackageId: jsUserPkg._id,
      activityLog: [
        { action: 'apply',         description: 'Application submitted by candidate', performedBy: jobseeker._id, ipAddress: '106.51.0.1',  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { action: 'resume_viewed', description: 'Employer viewed resume',             performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { action: 'status_change', description: 'Status changed to shortlisted',      performedBy: employer._id,  ipAddress: '49.205.1.100', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      jobId: approvedJobs[3]._id, // Data Scientist
      uid: jobseeker._id,
      cvId: resume1._id,
      companyId: company1._id,
      applyMessage: 'I have been working on NLP projects for 2 years and have hands-on experience with Transformers and LangChain.',
      quickApply: true,
      status: 'applied',
      statusHistory: [
        { status: 'applied', note: 'Quick apply', changedBy: jobseeker._id, changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      ],
      resumeView: false, rating: 0,
      userpackageId: jsUserPkg._id,
    },
    {
      jobId: approvedJobs[5]._id, // React Native
      uid: jobseeker._id,
      cvId: resume1._id,
      companyId: company2._id,
      applyMessage: 'I have built 3 React Native apps in production with 50K+ downloads each.',
      quickApply: false,
      status: 'reviewed',
      statusHistory: [
        { status: 'applied',  note: 'Application submitted', changedBy: jobseeker._id, changedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
        { status: 'reviewed', note: 'Under review',          changedBy: employer2._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      ],
      resumeView: true, resumeViewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rating: 3,
      userpackageId: jsUserPkg._id,
    },
    {
      jobId: approvedJobs[2]._id, // Product Designer
      uid: jobseeker2._id,
      cvId: resume2._id,
      companyId: company1._id,
      applyMessage: 'Product design is my passion and TechCorp design culture is something I deeply admire.',
      quickApply: false,
      status: 'interview_scheduled',
      statusHistory: [
        { status: 'applied',              note: 'Applied',                     changedBy: jobseeker2._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'reviewed',             note: 'Reviewed',                    changedBy: employer._id,   changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { status: 'shortlisted',          note: 'Portfolio looks great',        changedBy: employer._id,   changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { status: 'interview_scheduled',  note: 'Design challenge + HR round',  changedBy: employer._id,   changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
      resumeView: true, resumeViewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rating: 4,
      employerNotes: 'Excellent Figma portfolio. NID graduate. Strong candidate.',
      interview: {
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: 'video',
        link: 'https://zoom.us/j/1234567890',
        notes: 'Design challenge (1hr) followed by HR conversation (30 min)',
      },
      userpackageId: js2UserPkg._id,
    },
    {
      jobId: approvedJobs[7]._id, // UI/UX Designer InnovateMind
      uid: jobseeker2._id,
      cvId: resume2._id,
      companyId: company2._id,
      applyMessage: 'I love e-commerce design challenges and would be thrilled to join InnovateMind.',
      quickApply: true,
      status: 'applied',
      statusHistory: [
        { status: 'applied', note: 'Quick apply', changedBy: jobseeker2._id, changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
      resumeView: false, rating: 0,
      userpackageId: js2UserPkg._id,
    },
  ]);
  logger.info('✅ Applications seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. JOB SHORTLIST (Saved Jobs)
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(JobShortlist);
  await JobShortlist.insertMany([
    { uid: jobseeker._id,  jobId: approvedJobs[1]._id, comments: 'DevOps role - looks perfect!', rate: '5', status: true },
    { uid: jobseeker._id,  jobId: approvedJobs[4]._id, comments: 'Engineering Manager - stretch goal', rate: '4', status: true },
    { uid: jobseeker2._id, jobId: approvedJobs[2]._id, comments: 'Already applied, keeping track', rate: '5', status: true },
    { uid: jobseeker2._id, jobId: approvedJobs[7]._id, comments: 'Backup option', rate: '3', status: true },
  ]);
  logger.info('✅ Job shortlists seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. JOB ALERTS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(JobAlert);
  await JobAlert.insertMany([
    {
      uid: jobseeker._id,
      categoryId: itCat, name: 'Full Stack Jobs - Bangalore',
      contactEmail: 'jobseeker@hirehub.io',
      city: 'Bangalore', keywords: 'full stack react nodejs',
      alertType: 1, status: 1,
      sendTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userpackageId: jsUserPkg._id,
    },
    {
      uid: jobseeker._id,
      categoryId: itCat, name: 'Remote DevOps Jobs',
      contactEmail: 'jobseeker@hirehub.io',
      keywords: 'devops aws kubernetes remote',
      alertType: 2, status: 1,
      sendTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userpackageId: jsUserPkg._id,
    },
    {
      uid: jobseeker2._id,
      categoryId: designCat, name: 'UI/UX Designer Jobs - Mumbai',
      contactEmail: 'sneha.jobseeker@hirehub.io',
      city: 'Mumbai', keywords: 'ui ux designer figma',
      alertType: 1, status: 1,
      sendTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userpackageId: js2UserPkg._id,
    },
  ]);
  logger.info('✅ Job alerts seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. FOLLOWERS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Follower);
  await Follower.insertMany([
    { followerId: jobseeker._id,  companyId: company1._id },
    { followerId: jobseeker._id,  companyId: company2._id },
    { followerId: jobseeker2._id, companyId: company1._id },
  ]);
  logger.info('✅ Followers seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. EMPLOYER VIEW RESUME / JOBSEEKER VIEW COMPANY
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(EmployerViewResume, JobseekerViewCompany);
  await EmployerViewResume.insertMany([
    { uid: employer._id,  resumeId: resume1._id, profileId: jobseeker._id,  status: true, userpackageId: empUserPkg._id },
    { uid: employer._id,  resumeId: resume2._id, profileId: jobseeker2._id, status: true, userpackageId: empUserPkg._id },
    { uid: employer2._id, resumeId: resume1._id, profileId: jobseeker._id,  status: true, userpackageId: emp2UserPkg._id },
  ]);
  await JobseekerViewCompany.insertMany([
    { uid: jobseeker._id,  companyId: company1._id, status: true, userpackageId: jsUserPkg._id },
    { uid: jobseeker._id,  companyId: company2._id, status: true, userpackageId: jsUserPkg._id },
    { uid: jobseeker2._id, companyId: company1._id, status: true, userpackageId: js2UserPkg._id },
  ]);
  logger.info('✅ Resume / company views seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. SAVED SEARCHES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(SavedSearch);
  await SavedSearch.insertMany([
    {
      uid: jobseeker._id, searchName: 'React Jobs Bangalore',
      searchType: 'job', status: true,
      searchParams: { keyword: 'react', city: 'Bangalore', categoryId: itCat },
      userpackageId: jsUserPkg._id,
    },
    {
      uid: jobseeker._id, searchName: 'Remote Senior Roles',
      searchType: 'job', status: true,
      searchParams: { workplaceType: 'remote', careerLevel: 'senior' },
      userpackageId: jsUserPkg._id,
    },
    {
      uid: employer._id, searchName: 'Senior Developers India',
      searchType: 'resume', status: true,
      searchParams: { keyword: 'senior developer', country: 'India', experience: 4 },
      userpackageId: empUserPkg._id,
    },
  ]);
  logger.info('✅ Saved searches seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 27. FOLDERS & FOLDER RESUMES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Folder, FolderResume);
  const [folder1, folder2] = await Folder.insertMany([
    {
      uid: employer._id, jobId: approvedJobs[0]._id,
      name: 'Senior Full Stack - Shortlisted',
      alias: 'senior-full-stack-shortlisted',
      description: 'Shortlisted candidates for Senior Full Stack Developer role',
      status: true,
    },
    {
      uid: employer._id, global: true,
      name: 'Top Candidates 2025',
      alias: 'top-candidates-2025',
      description: 'Global pool of top candidates across all open roles',
      status: true,
    },
  ]);
  await FolderResume.insertMany([
    { uid: employer._id, jobId: approvedJobs[0]._id, resumeId: resume1._id, folderId: folder1._id },
    { uid: employer._id, resumeId: resume1._id, folderId: folder2._id },
    { uid: employer._id, resumeId: resume2._id, folderId: folder2._id },
  ]);
  logger.info('✅ Folders & folder resumes seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 28. NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Notification);
  await Notification.insertMany([
    // For employer
    {
      recipientId: employer._id, senderId: jobseeker._id,
      type: 'application_received',
      title: 'New Application Received',
      message: 'Rahul Verma has applied for Senior Full Stack Developer.',
      refModel: 'Application', refId: app1._id,
      isRead: false,
      channels: { inApp: true, email: true },
      emailSent: true,
      actionUrl: `/employer/applications/${app1._id}`,
      actionText: 'View Application',
    },
    {
      recipientId: employer._id, senderId: jobseeker._id,
      type: 'application_received',
      title: 'New Application Received',
      message: 'Rahul Verma has applied for Data Scientist - NLP & LLMs.',
      refModel: 'Application', refId: app2._id,
      isRead: true, readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      channels: { inApp: true, email: true },
      emailSent: true,
      actionUrl: `/employer/applications/${app2._id}`,
      actionText: 'View Application',
    },
    {
      recipientId: employer._id,
      type: 'resume_viewed',
      title: 'Package Usage Alert',
      message: 'You have used 20 of your 50 job postings in this package cycle.',
      refModel: 'Package', refId: empUserPkg._id,
      isRead: false,
      channels: { inApp: true },
      actionUrl: '/employer/packages',
      actionText: 'Manage Package',
    },
    // For jobseeker
    {
      recipientId: jobseeker._id, senderId: employer._id,
      type: 'shortlisted',
      title: 'You have been shortlisted!',
      message: 'TechCorp Solutions shortlisted you for Senior Full Stack Developer.',
      refModel: 'Application', refId: app1._id,
      isRead: false,
      channels: { inApp: true, email: true },
      emailSent: true,
      actionUrl: `/jobseeker/applications/${app1._id}`,
      actionText: 'View Details',
    },
    {
      recipientId: jobseeker._id, senderId: employer._id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: 'Your interview for Senior Full Stack Developer at TechCorp is on ' + new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString(),
      refModel: 'Application', refId: app1._id,
      isRead: false,
      channels: { inApp: true, email: true },
      emailSent: true,
      actionUrl: `/jobseeker/applications/${app1._id}`,
      actionText: 'View Interview Details',
    },
    {
      recipientId: jobseeker._id,
      type: 'job_alert',
      title: 'New Jobs Matching Your Alert',
      message: '3 new jobs match your alert "Full Stack Jobs - Bangalore". Check them out!',
      refModel: 'Job',
      isRead: true, readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      channels: { inApp: true, email: true },
      emailSent: true,
      actionUrl: '/jobs?keyword=full+stack&city=Bangalore',
      actionText: 'View Jobs',
    },
    // For jobseeker2
    {
      recipientId: jobseeker2._id, senderId: employer._id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled!',
      message: 'TechCorp Solutions has scheduled your interview for Product Designer role.',
      refModel: 'Application', refId: app4._id,
      isRead: false,
      channels: { inApp: true, email: true },
      emailSent: true,
      actionUrl: `/jobseeker/applications/${app4._id}`,
      actionText: 'View Details',
    },
    // Admin notification
    {
      recipientId: admin._id,
      type: 'job_approved',
      title: 'New Company Registered',
      message: 'InnovateMind Digital has completed registration and is awaiting verification.',
      refModel: 'Company', refId: company2._id,
      isRead: false,
      channels: { inApp: true },
      actionUrl: `/admin/companies/${company2._id}`,
      actionText: 'Review Company',
    },
  ]);
  logger.info('✅ Notifications seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 29. CONVERSATIONS & MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Conversation, Message);

  const conv1 = await new Conversation({
    participants: [employer._id, jobseeker._id],
    jobId: approvedJobs[0]._id,
    employerId: employer._id,
    jobseekerId: jobseeker._id,
    lastMessageText: 'We look forward to meeting you on the video call!',
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: new Map([[jobseeker._id.toString(), 1]]),
  }).save();

  const messages1 = await Message.insertMany([
    {
      conversationId: conv1._id,
      sendBy: employer._id, employerId: employer._id, jobseekerId: jobseeker._id,
      jobId: approvedJobs[0]._id,
      subject: 'Regarding your application - Senior Full Stack Developer',
      message: 'Hi Rahul! Thank you for applying for the Senior Full Stack Developer position at TechCorp. We have reviewed your resume and are very impressed with your profile. We would like to schedule a technical interview. Are you available this Thursday at 3 PM IST for a 60-minute video call?',
      isRead: true, readBy: [jobseeker._id], readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      conversationId: conv1._id,
      sendBy: jobseeker._id, employerId: employer._id, jobseekerId: jobseeker._id,
      jobId: approvedJobs[0]._id,
      message: 'Hi Priya! Thank you so much for considering my application. I am really excited about this opportunity. Yes, Thursday at 3 PM IST works perfectly for me. I will be prepared with my laptop and a stable internet connection. Looking forward to the interview!',
      isRead: true, readBy: [employer._id], readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      conversationId: conv1._id,
      sendBy: employer._id, employerId: employer._id, jobseekerId: jobseeker._id,
      jobId: approvedJobs[0]._id,
      message: 'We look forward to meeting you on the video call! Here is the meeting link: https://meet.google.com/abc-defg-hij . The interview will be with our Platform Team Lead. Good luck!',
      isRead: false,
      status: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  await Conversation.findByIdAndUpdate(conv1._id, { lastMessage: messages1[2]._id });

  const conv2 = await new Conversation({
    participants: [employer2._id, jobseeker2._id],
    jobId: approvedJobs[7]._id,
    employerId: employer2._id,
    jobseekerId: jobseeker2._id,
    lastMessageText: 'Please send your Figma portfolio link.',
    lastMessageAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    unreadCount: new Map([[jobseeker2._id.toString(), 1]]),
  }).save();

  const msg2 = await Message.create({
    conversationId: conv2._id,
    sendBy: employer2._id, employerId: employer2._id, jobseekerId: jobseeker2._id,
    jobId: approvedJobs[7]._id,
    subject: 'Application - UI/UX Designer',
    message: 'Hi Sneha, thank you for applying! We love your profile. Before we proceed, could you please share your Figma portfolio link? We would like to review some of your recent projects.',
    isRead: false,
    status: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  });

  await Conversation.findByIdAndUpdate(conv2._id, { lastMessage: msg2._id });
  logger.info('✅ Conversations & messages seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 30. ACTIVITY LOG
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(ActivityLog);
  await ActivityLog.insertMany([
    { uid: admin._id,       performedBy: admin._id,       description: 'Admin logged in',                         action: 'login',          ipAddress: '127.0.0.1',    userAgent: 'Mozilla/5.0', browser: 'Chrome', os: 'Windows' },
    { uid: employer._id,    performedBy: employer._id,    description: 'Employer logged in',                      action: 'login',          ipAddress: '49.205.1.100', userAgent: 'Mozilla/5.0', browser: 'Chrome', os: 'macOS' },
    { uid: employer._id,    performedBy: employer._id,    description: 'Posted job: Senior Full Stack Developer',  action: 'job_post',       referenceFor: 'Job', referenceId: approvedJobs[0]._id, ipAddress: '49.205.1.100' },
    { uid: employer._id,    performedBy: employer._id,    description: 'Posted job: DevOps Engineer',              action: 'job_post',       referenceFor: 'Job', referenceId: approvedJobs[1]._id, ipAddress: '49.205.1.100' },
    { uid: jobseeker._id,   performedBy: jobseeker._id,   description: 'Jobseeker logged in',                     action: 'login',          ipAddress: '106.51.0.1',   userAgent: 'Mozilla/5.0', browser: 'Chrome', os: 'Android' },
    { uid: jobseeker._id,   performedBy: jobseeker._id,   description: 'Applied for Senior Full Stack Developer',  action: 'job_apply',      referenceFor: 'Application', referenceId: app1._id, ipAddress: '106.51.0.1' },
    { uid: jobseeker._id,   performedBy: jobseeker._id,   description: 'Applied for Data Scientist - NLP & LLMs', action: 'job_apply',      referenceFor: 'Application', referenceId: app2._id, ipAddress: '106.51.0.1' },
    { uid: jobseeker._id,   performedBy: jobseeker._id,   description: 'Saved job: DevOps Engineer',               action: 'job_save',       referenceFor: 'Job', ipAddress: '106.51.0.1' },
    { uid: jobseeker2._id,  performedBy: jobseeker2._id,  description: 'Jobseeker Sneha logged in',                action: 'login',          ipAddress: '115.240.0.1',  userAgent: 'Mozilla/5.0', browser: 'Safari', os: 'iOS' },
    { uid: jobseeker2._id,  performedBy: jobseeker2._id,  description: 'Applied for Product Designer role',        action: 'job_apply',      referenceFor: 'Application', referenceId: app4._id, ipAddress: '115.240.0.1' },
    { uid: employer._id,    performedBy: employer._id,    description: 'Purchased Employer Pro package',           action: 'package_buy',    referenceFor: 'Invoice', referenceId: empInvoice._id, ipAddress: '49.205.1.100' },
    { uid: admin._id,       performedBy: admin._id,       description: 'Company TechCorp marked as verified',      action: 'company_verify', referenceFor: 'Company', referenceId: company1._id, ipAddress: '127.0.0.1' },
  ]);
  logger.info('✅ Activity log seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 31. REPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(Report);
  await Report.insertMany([
    {
      reportedBy: jobseeker._id,
      refModel: 'Job', refId: approvedJobs[5]._id,
      reason: 'Misleading job description',
      description: 'The salary range shown in the listing is different from what was communicated during screening.',
      status: 'pending',
    },
    {
      reportedBy: jobseeker2._id,
      refModel: 'Company', refId: company2._id,
      reason: 'Slow response time',
      description: 'Applied 2 weeks ago, no response at all despite follow-ups.',
      status: 'reviewed',
      reviewedBy: admin._id,
      reviewNote: 'Contacted company. They have been informed to respond promptly.',
    },
  ]);
  logger.info('✅ Reports seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 32. FIELD ORDERING
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(FieldOrdering);
  await FieldOrdering.insertMany([
    // Job fields (fieldFor: 1)
    { field: 'title',       fieldTitle: 'Job Title',          ordering: 1,  section: 'basic',    fieldFor: 1, published: true, required: true,  sys: true,  cannotUnpublish: true },
    { field: 'categoryId',  fieldTitle: 'Category',           ordering: 2,  section: 'basic',    fieldFor: 1, published: true, required: true,  sys: false, showOnListing: true },
    { field: 'jobType',     fieldTitle: 'Job Type',           ordering: 3,  section: 'basic',    fieldFor: 1, published: true, required: false, sys: false, showOnListing: true },
    { field: 'description', fieldTitle: 'Job Description',    ordering: 4,  section: 'content',  fieldFor: 1, published: true, required: true,  sys: true,  cannotUnpublish: true },
    { field: 'salaryMin',   fieldTitle: 'Salary Min',         ordering: 5,  section: 'salary',   fieldFor: 1, published: true, required: false, sys: false },
    { field: 'salaryMax',   fieldTitle: 'Salary Max',         ordering: 6,  section: 'salary',   fieldFor: 1, published: true, required: false, sys: false },
    { field: 'workplaceType',fieldTitle: 'Workplace Type',    ordering: 7,  section: 'location', fieldFor: 1, published: true, required: false, sys: false, showOnListing: true },
    { field: 'experience',  fieldTitle: 'Experience (Years)', ordering: 8,  section: 'requirements', fieldFor: 1, published: true, required: false, sys: false },
    { field: 'expiresAt',   fieldTitle: 'Expiry Date',        ordering: 9,  section: 'schedule', fieldFor: 1, published: true, required: false, sys: false },
    // Resume fields (fieldFor: 2)
    { field: 'applicationTitle', fieldTitle: 'Resume Title',  ordering: 1,  section: 'basic',    fieldFor: 2, published: true, required: true,  sys: true,  cannotUnpublish: true },
    { field: 'firstName',   fieldTitle: 'First Name',         ordering: 2,  section: 'personal', fieldFor: 2, published: true, required: true,  sys: true },
    { field: 'lastName',    fieldTitle: 'Last Name',          ordering: 3,  section: 'personal', fieldFor: 2, published: true, required: true,  sys: true },
    { field: 'resume',      fieldTitle: 'Summary / Bio',      ordering: 4,  section: 'content',  fieldFor: 2, published: true, required: false, sys: false },
    { field: 'skills',      fieldTitle: 'Skills',             ordering: 5,  section: 'content',  fieldFor: 2, published: true, required: false, sys: false, showOnListing: true },
    // Company fields (fieldFor: 3)
    { field: 'name',        fieldTitle: 'Company Name',       ordering: 1,  section: 'basic',    fieldFor: 3, published: true, required: true,  sys: true,  cannotUnpublish: true },
    { field: 'description', fieldTitle: 'About Company',      ordering: 2,  section: 'content',  fieldFor: 3, published: true, required: false, sys: false },
    { field: 'url',         fieldTitle: 'Website',            ordering: 3,  section: 'contact',  fieldFor: 3, published: true, required: false, sys: false },
    { field: 'city',        fieldTitle: 'City',               ordering: 4,  section: 'location', fieldFor: 3, published: true, required: false, sys: false, showOnListing: true },
  ]);
  logger.info('✅ Field ordering seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 33. SLUG MODEL
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(SlugModel);
  await SlugModel.insertMany([
    { slug: 'jobs',      defaultSlug: 'jobs',     filename: 'jobs',      description: 'All Jobs Listing',        status: true, pageTitle: 'Browse Jobs',       moduleName: 'jobs' },
    { slug: 'companies', defaultSlug: 'companies',filename: 'companies', description: 'All Companies Listing',   status: true, pageTitle: 'Browse Companies',  moduleName: 'companies' },
    { slug: 'resumes',   defaultSlug: 'resumes',  filename: 'resumes',   description: 'Resume Search',           status: true, pageTitle: 'Search Resumes',    moduleName: 'resumes' },
    { slug: 'packages',  defaultSlug: 'packages', filename: 'packages',  description: 'Packages & Pricing',      status: true, pageTitle: 'Packages',          moduleName: 'packages' },
    { slug: 'about',     defaultSlug: 'about',    filename: 'about',     description: 'About Us',                status: true, pageTitle: 'About HireHub',     moduleName: 'cms' },
    { slug: 'contact',   defaultSlug: 'contact',  filename: 'contact',   description: 'Contact Us',              status: true, pageTitle: 'Contact Us',        moduleName: 'cms' },
    { slug: 'blog',      defaultSlug: 'blog',     filename: 'blog',      description: 'Career Blog',             status: true, pageTitle: 'Career Blog',       moduleName: 'cms' },
  ]);
  logger.info('✅ Slug model seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // 34. SYSTEM ERRORS (sample)
  // ═══════════════════════════════════════════════════════════════════════════
  await clean(SystemError);
  await SystemError.insertMany([
    {
      uid: null,
      error: 'MongoServerError: E11000 duplicate key error collection: hirehub.applications index: jobId_1_uid_1 dup key',
      stack: 'Error: duplicate at Application.save (/src/controllers/application.controller.js:42:15)',
      isView: true,
    },
  ]);
  logger.info('✅ System errors seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // DONE ✅
  // ═══════════════════════════════════════════════════════════════════════════
  logger.info('');
  logger.info('🎉 ========================================');
  logger.info('🎉  FULL SEED COMPLETE!');
  logger.info('🎉 ========================================');
  logger.info('');
  logger.info('📋  Test Credentials (password: Pass@123456)');
  logger.info('   👑 Admin     → admin@hirehub.io');
  logger.info('   🏢 Employer  → employer@hirehub.io       (TechCorp Solutions)');
  logger.info('   🏢 Employer  → vikram.employer@hirehub.io (InnovateMind Digital)');
  logger.info('   👤 Jobseeker → jobseeker@hirehub.io       (Rahul Verma - Full Stack Dev)');
  logger.info('   👤 Jobseeker → sneha.jobseeker@hirehub.io  (Sneha Kapoor - UI/UX Designer)');
  logger.info('');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});