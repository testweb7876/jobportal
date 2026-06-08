// ═══════════════════════════════════════════════════════════
// RESUME CONTROLLER
// ═══════════════════════════════════════════════════════════
const Resume = require('../models/Resume.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { cache } = require('../config/redis');
const crypto = require('crypto');
const dayjs = require('dayjs');

// Create Resume
exports.createResume = asyncHandler(async (req, res) => {
  const resume = await Resume.create({ ...req.body, uid: req.user._id });
  sendSuccess(res, { resume }, 'Resume created', 201);
});

// Get My Resumes
exports.getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ uid: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, { resumes }, 'Resumes fetched');
});

// Get Single Resume
exports.getResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id).populate('uid', 'firstName lastName email');
  if (!resume) return next(new AppError('Resume not found.', 404));

  const isOwner = resume.uid._id.toString() === req.user?._id?.toString();
  if (!isOwner && resume.visibility === 'private') return next(new AppError('Resume is private.', 403));

  if (!isOwner) await Resume.findByIdAndUpdate(resume._id, { $inc: { viewsCount: 1 } });
  sendSuccess(res, { resume }, 'Resume fetched');
});

// Update Resume
exports.updateResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));
  const updated = await Resume.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  sendSuccess(res, { resume: updated }, 'Resume updated');
});

// Delete Resume
exports.deleteResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));
  await Resume.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  sendSuccess(res, {}, 'Resume deleted');
});

// Upload Resume File
exports.uploadResumeFile = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const result = await uploadToCloudinary(req.file, 'resume_file', { resource_type: 'raw' });
  resume.files.push({ ...result, filename: req.file.originalname, uploadedAt: new Date() });
  await resume.save();
  sendSuccess(res, { file: result }, 'File uploaded');
});

// Delete Resume File
exports.deleteResumeFile = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));
  const file = resume.files.id(req.params.fileId);
  if (!file) return next(new AppError('File not found.', 404));
  await deleteFromCloudinary(file.publicId, 'raw');
  file.remove();
  await resume.save();
  sendSuccess(res, {}, 'File deleted');
});

// Generate Share Token
exports.generateShareToken = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));
  resume.shareToken = crypto.randomBytes(20).toString('hex');
  await resume.save();
  sendSuccess(res, { shareUrl: `${process.env.CLIENT_URL}/resume/share/${resume.shareToken}` }, 'Share link generated');
});

// Public resume via shareToken
exports.getSharedResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ shareToken: req.params.token, isDeleted: false })
    .populate('uid', 'firstName lastName avatar');
  if (!resume) return next(new AppError('Invalid or expired share link.', 404));
  await Resume.findByIdAndUpdate(resume._id, { $inc: { viewsCount: 1 } });
  sendSuccess(res, { resume }, 'Resume fetched');
});

// Search Resumes (Employer)
exports.searchResumes = asyncHandler(async (req, res) => {
  const { keyword, skills, city, jobCategory, page = 1, limit = 20 } = req.query;
  const filter = { status: 1, published: true, searchable: true, visibility: 'public', isDeleted: false };

  if (keyword) filter.$text = { $search: keyword };
  if (skills) filter.skills = new RegExp(skills, 'i');
  if (city) filter['addresses.addressCity'] = new RegExp(city, 'i');
  if (jobCategory) filter.jobCategory = jobCategory;

  const result = await Resume.paginate(filter, {
    page, limit, sort: { isFeaturedResume: -1, isGoldResume: -1, createdAt: -1 },
    populate: { path: 'uid', select: 'firstName lastName avatar' },
    lean: true,
  });
  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

module.exports.resumeController = {
  createResume: exports.createResume,
  getMyResumes: exports.getMyResumes,
  getResume: exports.getResume,
  updateResume: exports.updateResume,
  deleteResume: exports.deleteResume,
  uploadResumeFile: exports.uploadResumeFile,
  deleteResumeFile: exports.deleteResumeFile,
  generateShareToken: exports.generateShareToken,
  getSharedResume: exports.getSharedResume,
  searchResumes: exports.searchResumes,
};
