const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const Application = require('../models/Application.model');
const { UserPackage } = require('../models/Payment.model');
const { JobShortlist, ActivityLog } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { cache } = require('../config/redis');
const notifService = require('../services/notification.service');
const dayjs = require('dayjs');

// ─── Build Filter ─────────────────────────────────────────────────────────────
const buildFilter = (q) => {
  const f = { status: 'approved', isDeleted: false };
  const now = new Date();

  if (q.keyword)       f.$text = { $search: q.keyword };
  if (q.category)      f.categoryId = q.category;
  if (q.subcategory)   f.subcategoryId = q.subcategory;
  if (q.jobType)       f.jobType = q.jobType;
  if (q.careerLevel)   f.careerLevel = q.careerLevel;
  if (q.city)          f.city = new RegExp(q.city, 'i');
  if (q.country)       f.country = new RegExp(q.country, 'i');
  if (q.workplaceType) f.workplaceType = q.workplaceType;
  if (q.isUrgent === 'true') f.isUrgent = true;
  if (q.isFeatured === 'true') f.isFeaturedJob = true;
  if (q.company)       f.companyId = q.company;
  if (q.experience !== undefined) f.experience = { $lte: parseInt(q.experience) };
  if (q.tags) f.tags = { $in: Array.isArray(q.tags) ? q.tags : q.tags.split(',') };

  if (q.salaryMin) f.salaryMin = { $gte: parseFloat(q.salaryMin) };
  if (q.salaryMax) f.salaryMax = { $lte: parseFloat(q.salaryMax) };

  // Not expired
  f.$or = [{ expiresAt: { $gt: now } }, { expiresAt: null }];

  return f;
};

// ─── GET ALL JOBS (Public) ────────────────────────────────────────────────────
exports.getJobs = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);

  const cacheKey = `jobs:list:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendPaginated(res, cached.docs, cached.total, page, limit);

  const filter = buildFilter(req.query);

  const sortMap = {
    newest:      { isFeaturedJob: -1, isGoldJob: -1, isUrgent: -1, createdAt: -1 },
    oldest:      { createdAt: 1 },
    salary_high: { salaryMax: -1 },
    salary_low:  { salaryMin: 1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const result = await Job.paginate(filter, {
    page, limit, sort,
    populate: [
      { path: 'companyId', select: 'name logo slug isVerified city' },
      { path: 'categoryId', select: 'catTitle' },
      { path: 'jobType', select: 'title color' },
    ],
    lean: true,
  });

  await cache.set(cacheKey, { docs: result.docs, total: result.totalDocs }, 120);
  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

// ─── GET SINGLE JOB ──────────────────────────────────────────────────────────
exports.getJob = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

  const job = await Job.findOne({ ...query, status: 'approved' })
    .populate('companyId', 'name logo slug isVerified city description socialLinks followersCount')
    .populate('categoryId', 'catTitle alias')
    .populate('subcategoryId', 'catTitle alias')
    .populate('jobType', 'title color')
    .populate('careerLevel', 'title')
    .populate('educationId', 'title')
    .populate('departmentId', 'name');

  if (!job) return next(new AppError('Job not found.', 404));

  await Job.findByIdAndUpdate(job._id, { $inc: { viewsCount: 1, hits: 1 } });

  let isShortlisted = false;
  let hasApplied    = false;

  if (req.user) {
    const [sl, app] = await Promise.all([
      JobShortlist.findOne({ uid: req.user._id, jobId: job._id, status: true }),
      Application.findOne({ jobId: job._id, uid: req.user._id }),
    ]);
    isShortlisted = !!sl;
    hasApplied    = !!app;
  }

  const similar = await Job.find({
    _id: { $ne: job._id }, categoryId: job.categoryId, status: 'approved',
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  }).populate('companyId', 'name logo').limit(5).lean();

  sendSuccess(res, { job, isShortlisted, hasApplied, similarJobs: similar }, 'Job fetched');
});

// ─── CREATE JOB ───────────────────────────────────────────────────────────────
exports.createJob = asyncHandler(async (req, res, next) => {
  // Check package
  const pkg = await UserPackage.findOne({
    uid: req.user._id, status: true, isActive: true, endDate: { $gt: new Date() },
    remainingJobs: { $gt: 0 },
  });

  if (!pkg && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('No active package or job limit reached. Please purchase a package.', 403));
  }

  const company = await Company.findOne({ uid: req.user._id });
  if (!company && req.user.role === 'employer') {
    return next(new AppError('Please create a company profile first.', 400));
  }

  const jobDays = pkg ? 30 : 0; // use package job time
  const jobData = {
    ...req.body,
    uid:       req.user._id,
    companyId: company?._id,
    company:   company?.name,
    status:    ['admin', 'superadmin'].includes(req.user.role) ? 'approved' : 'pending',
    expiresAt: jobDays ? dayjs().add(jobDays, 'day').toDate() : undefined,
  };

  const job = await Job.create(jobData);

  if (pkg) await UserPackage.findByIdAndUpdate(pkg._id, { $inc: { remainingJobs: -1 } });
  if (company) await Company.findByIdAndUpdate(company._id, { $inc: { jobsCount: 1 } });

  await ActivityLog.create({ uid: req.user._id, description: `Created job: ${job.title}`, referenceFor: 'job', referenceId: job._id, ipAddress: req.ip });
  await cache.delPattern('jobs:list:*');

  sendSuccess(res, { job }, 'Job created. Pending admin review.', 201);
});

// ─── UPDATE JOB ───────────────────────────────────────────────────────────────
exports.updateJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  const isOwner = job.uid.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwner && !isAdmin) return next(new AppError('Not authorized.', 403));

  if (!isAdmin) {
    delete req.body.status;
    delete req.body.isFeaturedJob;
    delete req.body.isGoldJob;
  }

  const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  await cache.delPattern('jobs:list:*');
  await cache.del(`job:${job.slug}`);

  sendSuccess(res, { job: updated }, 'Job updated');
});

// ─── DELETE JOB (Soft) ────────────────────────────────────────────────────────
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  const isOwner = job.uid.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  if (!isOwner && !isAdmin) return next(new AppError('Not authorized.', 403));

  await Job.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date(), status: 'deleted' });
  await cache.delPattern('jobs:list:*');
  sendSuccess(res, {}, 'Job deleted');
});

// ─── MY JOBS (Employer) ───────────────────────────────────────────────────────
exports.getMyJobs = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filter = { uid: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const result = await Job.paginate(filter, {
    page, limit, sort: { createdAt: -1 },
    populate: [{ path: 'categoryId', select: 'catTitle' }, { path: 'jobType', select: 'title' }],
    lean: true,
  });

  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

// ─── TOGGLE SHORTLIST ─────────────────────────────────────────────────────────
exports.toggleShortlist = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  const existing = await JobShortlist.findOne({ uid: req.user._id, jobId: req.params.id });

  if (existing) {
    await JobShortlist.findByIdAndDelete(existing._id);
    return sendSuccess(res, { shortlisted: false }, 'Job removed from shortlist');
  }

  await JobShortlist.create({ uid: req.user._id, jobId: req.params.id, status: true });
  sendSuccess(res, { shortlisted: true }, 'Job added to shortlist');
});

// ─── GET SHORTLISTED JOBS ────────────────────────────────────────────────────
exports.getShortlistedJobs = asyncHandler(async (req, res) => {
  const list = await JobShortlist.find({ uid: req.user._id, status: true })
    .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name logo' } })
    .sort({ createdAt: -1 });

  const jobs = list.map(s => s.jobId).filter(Boolean);
  sendSuccess(res, { jobs }, 'Shortlisted jobs');
});

// ─── FEATURED JOBS ────────────────────────────────────────────────────────────
exports.getFeaturedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({
    status: 'approved', isFeaturedJob: true,
    endFeaturedDate: { $gt: new Date() },
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  }).populate('companyId', 'name logo city').populate('jobType', 'title color')
    .limit(parseInt(req.query.limit) || 8).lean();

  sendSuccess(res, { jobs }, 'Featured jobs');
});

// ─── ADMIN: MODERATE ─────────────────────────────────────────────────────────
exports.moderateJob = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected', 'paused'].includes(status)) return next(new AppError('Invalid status.', 400));

  const job = await Job.findByIdAndUpdate(
    req.params.id, { status, moderationNote: note }, { new: true }
  ).populate('uid', 'email firstName');

  if (!job) return next(new AppError('Job not found.', 404));

  if (job.uid) {
    await notifService.create({
      recipientId: job.uid._id,
      type: status === 'approved' ? 'job_approved' : 'job_rejected',
      title: `Job "${job.title}" ${status}`,
      message: note || `Your job posting has been ${status}.`,
      refModel: 'Job', refId: job._id,
    });
  }

  sendSuccess(res, { job }, `Job ${status}`);
});

// ─── JOB ANALYTICS ───────────────────────────────────────────────────────────
exports.getJobAnalytics = asyncHandler(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, uid: req.user._id });
  if (!job) return next(new AppError('Job not found.', 404));

  const [statusBreakdown, daily] = await Promise.all([
    Application.aggregate([
      { $match: { jobId: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { jobId: job._id, createdAt: { $gte: dayjs().subtract(30, 'day').toDate() } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  sendSuccess(res, {
    viewsCount: job.viewsCount,
    applicationsCount: job.applicationsCount,
    statusBreakdown: statusBreakdown.reduce((a, { _id, count }) => ({ ...a, [_id]: count }), {}),
    dailyApplications: daily,
  }, 'Analytics fetched');
});
