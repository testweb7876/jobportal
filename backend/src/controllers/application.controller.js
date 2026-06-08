const Application = require('../models/Application.model');
const Job = require('../models/Job.model');
const Resume = require('../models/Resume.model');
const { UserPackage } = require('../models/Payment.model');
const { ActivityLog } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const notifService = require('../services/notification.service');
const emailService = require('../services/email.service');
const User = require('../models/User.model');

// ─── APPLY JOB ───────────────────────────────────────────────────────────────
exports.applyJob = asyncHandler(async (req, res, next) => {
  const { id: jobId } = req.params;
  const { cvId, coverLetterId, applyMessage, quickApply } = req.body;

  const job = await Job.findOne({ _id: jobId, status: 'approved' }).populate('companyId', 'name uid');
  if (!job) return next(new AppError('Job not found or closed.', 404));

  if (job.expiresAt && new Date() > job.expiresAt) {
    return next(new AppError('Application deadline passed.', 400));
  }

  const existing = await Application.findOne({ jobId, uid: req.user._id });
  if (existing) return next(new AppError('You have already applied for this job.', 409));

  // Package check
  const pkg = await UserPackage.findOne({
    uid: req.user._id, status: true, isActive: true,
    endDate: { $gt: new Date() }, remainingJobApply: { $gt: 0 },
  });
  // Allow apply if no package only on free jobs, else check
  // (for simplicity: allow if pkg exists OR if job has no price)
  if (!pkg && job.price > 0) {
    return next(new AppError('Please purchase a package to apply for this job.', 403));
  }

  // Get resume if cvId not specified
  let resumeId = cvId;
  if (!resumeId) {
    const defaultResume = await Resume.findOne({ uid: req.user._id, status: 1 }).sort({ createdAt: -1 });
    if (!defaultResume) return next(new AppError('Please create a resume before applying.', 400));
    resumeId = defaultResume._id;
  }

  const application = await Application.create({
    jobId,
    uid:           req.user._id,
    companyId:     job.companyId?._id,
    cvId:          resumeId,
    coverLetterId: coverLetterId || null,
    applyMessage,
    quickApply:    quickApply || false,
    statusHistory: [{ status: 'applied', note: 'Application submitted' }],
    applyDate:     new Date(),
  });

  // Update counts
  await Promise.all([
    Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } }),
    pkg && UserPackage.findByIdAndUpdate(pkg._id, { $inc: { remainingJobApply: -1 } }),
  ]);

  // Log
  await ActivityLog.create({ uid: req.user._id, description: `Applied to job: ${job.title}`, referenceFor: 'application', referenceId: application._id, ipAddress: req.ip });

  // Notify employer
  if (job.companyId?.uid) {
    const employer = await User.findById(job.companyId.uid);
    if (employer) {
      await Promise.all([
        notifService.create({
          recipientId: employer._id,
          senderId:    req.user._id,
          type:        'application_received',
          title:       `New application for ${job.title}`,
          message:     `${req.user.fullName || req.user.firstName} applied for your job.`,
          refModel:    'Application', refId: application._id,
          actionUrl:   `/employer/applications/${application._id}`,
        }),
        emailService.sendNewApplicationAlert(employer, job.title, req.user.firstName),
      ]);
    }
  }

  // Confirm to candidate
  await emailService.sendApplicationConfirmation(req.user, job, job.companyId?.name || job.company);

  sendSuccess(res, { application }, 'Application submitted successfully.', 201);
});

// ─── MY APPLICATIONS (Candidate) ─────────────────────────────────────────────
exports.getMyApplications = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filter = { uid: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const result = await Application.paginate(filter, {
    page, limit, sort: { createdAt: -1 },
    populate: [
      { path: 'jobId', select: 'title city workplaceType salary status companyId expiresAt', populate: { path: 'companyId', select: 'name logo' } },
    ],
    lean: true,
  });

  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

// ─── JOB APPLICANTS (Employer) ───────────────────────────────────────────────
exports.getJobApplicants = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const page  = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const job = await Job.findOne({ _id: jobId, uid: req.user._id });
  if (!job) return next(new AppError('Job not found.', 404));

  const filter = { jobId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.rating) filter.rating = { $gte: parseFloat(req.query.rating) };

  const result = await Application.paginate(filter, {
    page, limit, sort: { createdAt: -1 },
    populate: [
      { path: 'uid', select: 'firstName lastName email avatar phone' },
      { path: 'cvId', select: 'applicationTitle skills tags files' },
    ],
    lean: true,
  });

  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

// ─── UPDATE STATUS (Employer) ─────────────────────────────────────────────────
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { status, note, rating, interview } = req.body;

  const application = await Application.findById(req.params.id)
    .populate('uid', 'email firstName lastName')
    .populate('jobId', 'title uid');

  if (!application) return next(new AppError('Application not found.', 404));

  // Verify employer owns the job
  if (application.jobId.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized.', 403));
  }

  application.status = status;
  application.statusHistory.push({ status, note, changedBy: req.user._id });
  if (note) application.employerNotes = note;
  if (rating !== undefined) application.rating = rating;
  if (interview && status === 'interview_scheduled') {
    application.interview = { ...interview, conductedAt: null };
  }
  await application.save();

  // Update job count if hired
  if (status === 'hired') await Job.findByIdAndUpdate(application.jobId._id, { $inc: { noOfJobs: -1 } });

  // Notify candidate
  await Promise.all([
    notifService.create({
      recipientId: application.uid._id,
      type: status === 'shortlisted' ? 'shortlisted' : status === 'hired' ? 'hired' : status === 'rejected' ? 'rejected' : status === 'interview_scheduled' ? 'interview_scheduled' : 'application_viewed',
      title: `Application update: ${status.replace('_', ' ')}`,
      message: note || `Your application has been updated to ${status}.`,
      refModel: 'Application', refId: application._id,
    }),
    emailService.sendApplicationStatusUpdate(application.uid, application.jobId, status, note),
    status === 'interview_scheduled' && application.interview?.scheduledAt
      ? emailService.sendInterviewScheduled(application.uid, application.jobId, application.interview)
      : Promise.resolve(),
  ]);

  sendSuccess(res, { application }, 'Status updated');
});

// ─── WITHDRAW (Candidate) ─────────────────────────────────────────────────────
exports.withdraw = asyncHandler(async (req, res, next) => {
  const application = await Application.findOne({ _id: req.params.id, uid: req.user._id });
  if (!application) return next(new AppError('Application not found.', 404));

  if (['hired', 'rejected'].includes(application.status)) {
    return next(new AppError('Cannot withdraw at this stage.', 400));
  }

  application.status = 'withdrawn';
  application.withdrawReason = req.body.reason;
  application.statusHistory.push({ status: 'withdrawn', note: req.body.reason || 'Withdrawn by candidate' });
  await application.save();

  await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationsCount: -1 } });
  sendSuccess(res, {}, 'Application withdrawn');
});

// ─── VIEW RESUME (Employer) ───────────────────────────────────────────────────
exports.viewResume = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id).populate('jobId', 'uid');
  if (!application) return next(new AppError('Not found.', 404));
  if (application.jobId.uid.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));

  application.resumeView = true;
  application.resumeViewedAt = new Date();
  await application.save();

  const resume = await Resume.findById(application.cvId).populate('uid', 'firstName lastName email phone');
  sendSuccess(res, { resume }, 'Resume fetched');
});

// ─── EMPLOYER DASHBOARD STATS ─────────────────────────────────────────────────
exports.getEmployerStats = asyncHandler(async (req, res) => {
  const [totalJobs, totalApps, statusBreakdown, unread] = await Promise.all([
    Job.countDocuments({ uid: req.user._id }),
    Application.countDocuments({ companyId: { $in: (await Job.distinct('companyId', { uid: req.user._id })) } }),
    Application.aggregate([
      { $match: { jobId: { $in: await Job.distinct('_id', { uid: req.user._id }) } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ jobId: { $in: await Job.distinct('_id', { uid: req.user._id }) }, resumeView: false }),
  ]);

  sendSuccess(res, {
    totalJobs, totalApplications: totalApps, unreadApplications: unread,
    statusBreakdown: statusBreakdown.reduce((a, { _id, count }) => ({ ...a, [_id]: count }), {}),
  }, 'Stats fetched');
});
