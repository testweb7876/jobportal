// ════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════
const express = require('express');
const authRouter = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { protect, authLimiter } = require('../middleware/auth.middleware');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../validators');

authRouter.post('/register',            authLimiter, validate(registerSchema),       authCtrl.register);
authRouter.post('/login',               authLimiter, validate(loginSchema),           authCtrl.login);
authRouter.post('/google',              authLimiter,                                  authCtrl.googleLogin);
authRouter.get ('/verify-email/:token',                                               authCtrl.verifyEmail);
authRouter.post('/resend-verification',                                               authCtrl.resendVerification);
authRouter.post('/forgot-password',     authLimiter, validate(forgotPasswordSchema),  authCtrl.forgotPassword);
authRouter.post('/reset-password/:token',            validate(resetPasswordSchema),   authCtrl.resetPassword);
authRouter.post('/refresh-token',                                                     authCtrl.refreshToken);
authRouter.post('/logout',              protect,                                      authCtrl.logout);
authRouter.post('/logout-all',          protect,                                      authCtrl.logoutAll);
authRouter.patch('/change-password',    protect, validate(changePasswordSchema),      authCtrl.changePassword);
authRouter.get ('/me',                  protect,                                      authCtrl.getMe);
authRouter.get ('/sessions',            protect,                                      authCtrl.getActiveSessions);
authRouter.delete('/sessions/:sessionId', protect,                                   authCtrl.revokeSession);

// ════════════════════════════════════════════════════════════
// JOB ROUTES
// ════════════════════════════════════════════════════════════
const jobRouter = express.Router();
const jobCtrl = require('../controllers/job.controller');
const { protect: p, optionalAuth, employerOnly, jobseekerOnly, adminOnly } = require('../middleware/auth.middleware');
const { validate: v, createJobSchema, updateJobSchema } = require('../validators');

jobRouter.get ('/',                     optionalAuth,                        jobCtrl.getJobs);
jobRouter.get ('/featured',                                                  jobCtrl.getFeaturedJobs);
jobRouter.get ('/shortlisted',          p, jobseekerOnly,                    jobCtrl.getShortlistedJobs);
jobRouter.get ('/my-jobs',              p, employerOnly,                     jobCtrl.getMyJobs);
jobRouter.get ('/analytics/:id',        p, employerOnly,                     jobCtrl.getJobAnalytics);
jobRouter.post('/',                     p, employerOnly, v(createJobSchema),  jobCtrl.createJob);
jobRouter.get ('/:id',                  optionalAuth,                        jobCtrl.getJob);
jobRouter.patch('/:id',                 p, employerOnly,                     jobCtrl.updateJob);
jobRouter.delete('/:id',               p, employerOnly,                     jobCtrl.deleteJob);
jobRouter.post ('/:id/shortlist',       p, jobseekerOnly,                    jobCtrl.toggleShortlist);
// Admin moderation
jobRouter.patch('/:id/moderate',        p, adminOnly,                        jobCtrl.moderateJob);

// ════════════════════════════════════════════════════════════
// APPLICATION ROUTES
// ════════════════════════════════════════════════════════════
const appRouter = express.Router();
const appCtrl = require('../controllers/application.controller');
const { validate: vv, applyJobSchema, updateAppStatusSchema } = require('../validators');

// Candidate
appRouter.get  ('/mine',                  p, jobseekerOnly,                          appCtrl.getMyApplications);
appRouter.post ('/jobs/:id/apply',        p, jobseekerOnly, vv(applyJobSchema),      appCtrl.applyJob);
appRouter.patch('/:id/withdraw',          p, jobseekerOnly,                          appCtrl.withdraw);

// Employer
appRouter.get  ('/job/:jobId',            p, employerOnly,                           appCtrl.getJobApplicants);
appRouter.patch('/:id/status',            p, employerOnly, vv(updateAppStatusSchema), appCtrl.updateStatus);
appRouter.get  ('/:id/resume',            p, employerOnly,                           appCtrl.viewResume);
appRouter.get  ('/employer/stats',        p, employerOnly,                           appCtrl.getEmployerStats);

// ════════════════════════════════════════════════════════════
// RESUME ROUTES
// ════════════════════════════════════════════════════════════
const resumeRouter = express.Router();
const { resumeController: rc } = require('../controllers/resume.controller');
const { uploadDocument } = require('../config/cloudinary');
const { validateFileType } = require('../middleware/fileValidator');
const { validate: vr, createResumeSchema } = require('../validators');

resumeRouter.get  ('/search',               p, employerOnly,                          rc.searchResumes);
resumeRouter.get  ('/share/:token',                                                   rc.getSharedResume);
resumeRouter.get  ('/mine',                 p, jobseekerOnly,                         rc.getMyResumes);
resumeRouter.post ('/',                     p, jobseekerOnly, vr(createResumeSchema), rc.createResume);
resumeRouter.get  ('/:id',                  p,                                        rc.getResume);
resumeRouter.patch('/:id',                  p, jobseekerOnly,                         rc.updateResume);
resumeRouter.delete('/:id',                p, jobseekerOnly,                         rc.deleteResume);
resumeRouter.post ('/:id/share-token',      p, jobseekerOnly,                         rc.generateShareToken);
resumeRouter.post ('/:id/files',            p, jobseekerOnly, uploadDocument.single('file'), validateFileType(['pdf','docx','image']), rc.uploadResumeFile);
resumeRouter.delete('/:id/files/:fileId',  p, jobseekerOnly,                         rc.deleteResumeFile);

// ════════════════════════════════════════════════════════════
// COMPANY ROUTES
// ════════════════════════════════════════════════════════════
const companyRouter = express.Router();
const companyCtrl = require('../controllers/company.controller');
const { uploadImage } = require('../config/cloudinary');
const { validate: vc, createCompanySchema } = require('../validators');

companyRouter.get  ('/',                    optionalAuth,                              companyCtrl.getCompanies);
companyRouter.post ('/',                    p, employerOnly, vc(createCompanySchema),  companyCtrl.createCompany);
companyRouter.get  ('/me',                  p, employerOnly,                           companyCtrl.getMyCompany);
companyRouter.patch('/me',                  p, employerOnly,                           companyCtrl.updateCompany);
companyRouter.post ('/me/logo',             p, employerOnly, uploadImage.single('logo'), companyCtrl.uploadLogo);
companyRouter.post ('/me/gallery',          p, employerOnly, uploadImage.single('image'), companyCtrl.addGalleryImage);
companyRouter.delete('/me/gallery/:imageId', p, employerOnly,                         companyCtrl.removeGalleryImage);
companyRouter.get  ('/:id',                 optionalAuth,                              companyCtrl.getCompany);
companyRouter.post ('/:id/follow',          p, jobseekerOnly,                          companyCtrl.toggleFollow);

// ════════════════════════════════════════════════════════════
// MESSAGE ROUTES
// ════════════════════════════════════════════════════════════
const msgRouter = express.Router();
const { getOrCreateConversation, getConversations, getMessages, sendMessage } = require('../controllers/extra.controller');
const { validate: vm, startConversationSchema, sendMessageSchema } = require('../validators');
const { uploadAny } = require('../config/cloudinary');

msgRouter.get  ('/conversations',                        p,                             getConversations);
msgRouter.post ('/conversations',                        p, vm(startConversationSchema), getOrCreateConversation);
msgRouter.get  ('/conversations/:convId/messages',       p,                             getMessages);
msgRouter.post ('/conversations/:convId/messages',       p, uploadAny.array('files', 5), sendMessage);

// ════════════════════════════════════════════════════════════
// NOTIFICATION ROUTES
// ════════════════════════════════════════════════════════════
const notifRouter = express.Router();
const { getNotifications, markNotifRead, deleteNotif } = require('../controllers/extra.controller');

notifRouter.get   ('/',         p, getNotifications);
notifRouter.patch ('/read',     p, markNotifRead);
notifRouter.delete('/:id',      p, deleteNotif);

// ════════════════════════════════════════════════════════════
// PACKAGE / PAYMENT ROUTES
// ════════════════════════════════════════════════════════════
const pkgRouter = express.Router();
const { getPackages, createStripeOrder, createRazorpayOrder, verifyRazorpayPayment, getUserPackages, getInvoices } = require('../controllers/extra.controller');

pkgRouter.get ('/all',                                     getPackages);
pkgRouter.get ('/mine',              p,                    getUserPackages);
pkgRouter.get ('/invoices',          p,                    getInvoices);
pkgRouter.post('/stripe/order',      p, employerOnly,      createStripeOrder);
pkgRouter.post('/razorpay/order',    p, employerOnly,      createRazorpayOrder);
pkgRouter.post('/razorpay/verify',   p, employerOnly,      verifyRazorpayPayment);

// ════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════
const adminRouter = express.Router();
const { getDashboardStats, getUsers, updateUser, getAllJobs, verifyCompany, getSystemErrors, getConfig, updateConfig, getActivityLogs } = require('../controllers/extra.controller');

adminRouter.use(p, adminOnly);

adminRouter.get   ('/stats',                     getDashboardStats);
adminRouter.get   ('/users',                     getUsers);
adminRouter.patch ('/users/:id',                 updateUser);
adminRouter.get   ('/jobs',                      getAllJobs);
adminRouter.patch ('/companies/:id/verify',      verifyCompany);
adminRouter.get   ('/errors',                    getSystemErrors);
adminRouter.get   ('/config',                    getConfig);
adminRouter.patch ('/config',                    updateConfig);
adminRouter.get   ('/activity-logs',             getActivityLogs);

// ════════════════════════════════════════════════════════════
// CATEGORY / LOOKUP ROUTES
// ════════════════════════════════════════════════════════════
const lookupRouter = express.Router();
const { Category, JobType, CareerLevel, Education, SalaryRangeType, Currency, Country, State, City, Department, Tag, CoverLetter, JobAlert, SavedSearch } = require('../models/Misc.model');
const { asyncHandler: ah, sendSuccess: ss } = require('../utils/AppError');

const makeGet = (Model, filter = {}, populate = '') => ah(async (req, res) => {
  const docs = await Model.find(filter).sort({ ordering: 1, createdAt: -1 });
  ss(res, { data: docs }, 'Fetched');
});

lookupRouter.get('/categories',        makeGet(Category, { isActive: true }));
lookupRouter.get('/job-types',         makeGet(JobType, { isActive: true }));
lookupRouter.get('/career-levels',     makeGet(CareerLevel, { status: true }));
lookupRouter.get('/education-levels',  makeGet(Education, { isActive: true }));
lookupRouter.get('/salary-types',      makeGet(SalaryRangeType, { status: true }));
lookupRouter.get('/currencies',        makeGet(Currency, { status: true }));
lookupRouter.get('/countries',         makeGet(Country, { enabled: true }));
lookupRouter.get('/tags',              makeGet(Tag, { status: true }));

lookupRouter.get('/states', ah(async (req, res) => {
  const states = await State.find({ enabled: true, ...(req.query.countryId ? { countryId: req.query.countryId } : {}) });
  ss(res, { data: states }, 'Fetched');
}));

lookupRouter.get('/cities', ah(async (req, res) => {
  const filter = { enabled: true };
  if (req.query.stateId)   filter.stateId   = req.query.stateId;
  if (req.query.countryId) filter.countryId = req.query.countryId;
  if (req.query.search)    filter.name       = new RegExp(req.query.search, 'i');
  const cities = await City.find(filter).limit(100);
  ss(res, { data: cities }, 'Fetched');
}));

// Cover Letters
lookupRouter.get ('/cover-letters',       ah(async (req, res) => {
  const p2 = require('../middleware/auth.middleware');
  const docs = await CoverLetter.find({ uid: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
  ss(res, { data: docs }, 'Fetched');
}));

// Job Alerts
lookupRouter.get ('/job-alerts',          p, ah(async (req, res) => {
  const docs = await JobAlert.find({ uid: req.user._id, isDeleted: false });
  ss(res, { data: docs }, 'Fetched');
}));

// Departments
lookupRouter.get('/departments', p, ah(async (req, res) => {
  const company = await require('../models/Company.model').findOne({ uid: req.user._id });
  if (!company) return ss(res, { data: [] }, 'No company');
  const docs = await Department.find({ companyId: company._id, isDeleted: false });
  ss(res, { data: docs }, 'Fetched');
}));

// Search (advanced)
lookupRouter.get('/search', ah(async (req, res) => {
  const { q, type = 'jobs', limit = 10 } = req.query;
  if (!q) return ss(res, { data: [] }, 'No query');

  if (type === 'jobs') {
    const jobs = await require('../models/Job.model').find({
      $text: { $search: q }, status: 'approved',
    }).populate('companyId', 'name logo').limit(parseInt(limit)).lean();
    return ss(res, { data: jobs }, 'Results');
  }

  if (type === 'companies') {
    const companies = await require('../models/Company.model').find({
      $text: { $search: q },
    }).limit(parseInt(limit)).lean();
    return ss(res, { data: companies }, 'Results');
  }

  if (type === 'resumes') {
    const resumes = await require('../models/Resume.model').find({
      $text: { $search: q }, published: true, searchable: true, visibility: 'public',
    }).limit(parseInt(limit)).lean();
    return ss(res, { data: resumes }, 'Results');
  }

  ss(res, { data: [] }, 'Unknown type');
}));

module.exports = {
  authRouter, jobRouter, appRouter, resumeRouter,
  companyRouter, msgRouter, notifRouter, pkgRouter,
  adminRouter, lookupRouter,
};
