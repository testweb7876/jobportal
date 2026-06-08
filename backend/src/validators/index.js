const Joi = require('joi');
const { AppError } = require('../utils/AppError');

// ─── Validate middleware ───────────────────────────────────────────────────────
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map(d => d.message.replace(/"/g, '')).join(', ');
    return next(new AppError(msg, 400));
  }
  req[source] = value;
  next();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName:  Joi.string().min(1).max(100).required(),
  email:     Joi.string().email().required(),
  password:  Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and a number' }),
  role:  Joi.string().valid('jobseeker', 'employer').default('jobseeker'),
  phone: Joi.string().allow('', null),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({ email: Joi.string().email().required() });

const resetPasswordSchema = Joi.object({
  password:        Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
});

// ─── Job ──────────────────────────────────────────────────────────────────────
const createJobSchema = Joi.object({
  title:        Joi.string().min(3).max(255).required(),
  description:  Joi.string().min(20).required(),
  categoryId:   Joi.string().hex().length(24),
  subcategoryId: Joi.string().hex().length(24),
  jobType:      Joi.string().hex().length(24),
  careerLevel:  Joi.string().hex().length(24),
  educationId:  Joi.string().hex().length(24),
  departmentId: Joi.string().hex().length(24),
  city:         Joi.string().allow('', null),
  workplaceType: Joi.string().valid('onsite', 'remote', 'hybrid'),
  salaryMin:    Joi.number().min(0),
  salaryMax:    Joi.number().min(0),
  currency:     Joi.string().max(10),
  experience:   Joi.number().min(0).max(50),
  noOfJobs:     Joi.number().min(1),
  tags:         Joi.array().items(Joi.string()),
  qualifications: Joi.string().allow('', null),
  prefferdSkills: Joi.string().allow('', null),
  isUrgent:     Joi.boolean(),
  workplaceType: Joi.string().valid('onsite', 'remote', 'hybrid'),
  applicationDeadline: Joi.date().min('now').allow(null),
  jobApplyLink: Joi.boolean(),
  jobLink:      Joi.string().uri().allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  hideSalaryRange: Joi.boolean(),
  status:       Joi.string().valid('draft', 'pending'),
});

const updateJobSchema = createJobSchema.fork(Object.keys(createJobSchema.describe().keys), k => k.optional());

// ─── Application ──────────────────────────────────────────────────────────────
const applyJobSchema = Joi.object({
  cvId:          Joi.string().hex().length(24),
  coverLetterId: Joi.string().hex().length(24).allow(null),
  applyMessage:  Joi.string().max(2000).allow('', null),
  quickApply:    Joi.boolean(),
});

const updateAppStatusSchema = Joi.object({
  status: Joi.string().valid('reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected').required(),
  note:   Joi.string().max(1000).allow('', null),
  rating: Joi.number().min(0).max(5),
  interview: Joi.object({
    scheduledAt: Joi.date(),
    type:        Joi.string().valid('in_person', 'phone', 'video', 'technical'),
    link:        Joi.string().uri().allow('', null),
    location:    Joi.string().allow('', null),
    notes:       Joi.string().allow('', null),
  }),
});

// ─── Resume ───────────────────────────────────────────────────────────────────
const createResumeSchema = Joi.object({
  applicationTitle: Joi.string().min(2).max(255).required(),
  firstName:   Joi.string().allow('', null),
  lastName:    Joi.string().allow('', null),
  gender:      Joi.string().allow('', null),
  emailAddress: Joi.string().email().allow('', null),
  cell:        Joi.string().allow('', null),
  nationality: Joi.string().allow('', null),
  jobCategory: Joi.string().hex().length(24).allow(null),
  salaryFixed: Joi.string().allow('', null),
  keywords:    Joi.string().allow('', null),
  tags:        Joi.array().items(Joi.string()),
  resume:      Joi.string().allow('', null),
  skills:      Joi.string().allow('', null),
  searchable:  Joi.boolean(),
  visibility:  Joi.string().valid('public', 'private', 'restricted'),
  quickApply:  Joi.boolean(),
});

// ─── Company ──────────────────────────────────────────────────────────────────
const createCompanySchema = Joi.object({
  name:         Joi.string().min(2).max(255).required(),
  description:  Joi.string().allow('', null),
  url:          Joi.string().uri().allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  tagline:      Joi.string().max(255).allow('', null),
  city:         Joi.string().allow('', null),
  address1:     Joi.string().allow('', null),
  socialLinks: Joi.object({
    facebook:  Joi.string().uri().allow('', null),
    twitter:   Joi.string().uri().allow('', null),
    linkedin:  Joi.string().uri().allow('', null),
    youtube:   Joi.string().uri().allow('', null),
    instagram: Joi.string().uri().allow('', null),
  }),
});

// ─── Cover Letter ─────────────────────────────────────────────────────────────
const coverLetterSchema = Joi.object({
  title:       Joi.string().min(2).max(300).required(),
  description: Joi.string().min(10).required(),
  published:   Joi.boolean(),
  searchable:  Joi.boolean(),
});

// ─── Job Alert ────────────────────────────────────────────────────────────────
const jobAlertSchema = Joi.object({
  name:          Joi.string().min(2).required(),
  contactEmail:  Joi.string().email().required(),
  categoryId:    Joi.string().hex().length(24).allow(null),
  subcategoryId: Joi.string().hex().length(24).allow(null),
  keywords:      Joi.string().allow('', null),
  city:          Joi.string().allow('', null),
  country:       Joi.string().allow('', null),
  jobType:       Joi.string().hex().length(24).allow(null),
  workplaceType: Joi.number(),
  isUrgent:      Joi.boolean(),
  tags:          Joi.array().items(Joi.string()),
  alertType:     Joi.number(),
});

// ─── Message ──────────────────────────────────────────────────────────────────
const sendMessageSchema = Joi.object({
  message:  Joi.string().min(1).max(5000).required(),
  subject:  Joi.string().max(500).allow('', null),
  replyToId: Joi.string().hex().length(24).allow(null),
});

const startConversationSchema = Joi.object({
  recipientId: Joi.string().hex().length(24).required(),
  jobId:       Joi.string().hex().length(24).allow(null),
  resumeId:    Joi.string().hex().length(24).allow(null),
  message:     Joi.string().min(1).max(5000).required(),
});

module.exports = {
  validate,
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema,
  createJobSchema, updateJobSchema,
  applyJobSchema, updateAppStatusSchema,
  createResumeSchema,
  createCompanySchema,
  coverLetterSchema,
  jobAlertSchema,
  sendMessageSchema, startConversationSchema,
};
