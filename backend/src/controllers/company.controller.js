const Company = require('../models/Company.model');
const { Follower } = require('../models/Misc.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { cache } = require('../config/redis');

exports.createCompany = asyncHandler(async (req, res, next) => {
  const existing = await Company.findOne({ uid: req.user._id });
  if (existing) return next(new AppError('You already have a company registered.', 409));
  const company = await Company.create({ ...req.body, uid: req.user._id });
  sendSuccess(res, { company }, 'Company created', 201);
});

exports.getCompany = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  const company = await Company.findOne(query).populate('uid', 'firstName lastName email');
  if (!company) return next(new AppError('Company not found.', 404));

  await Company.findByIdAndUpdate(company._id, { $inc: { hits: 1 } });

  let isFollowing = false;
  if (req.user) {
    isFollowing = !!(await Follower.findOne({ followerId: req.user._id, companyId: company._id }));
  }
  sendSuccess(res, { company, isFollowing }, 'Company fetched');
});

exports.updateCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));

  const restricted = ['uid', 'isVerified', 'verificationStatus', 'isFeaturedCompany', 'isGoldCompany'];
  restricted.forEach(f => delete req.body[f]);

  const updated = await Company.findByIdAndUpdate(company._id, req.body, { new: true, runValidators: true });
  sendSuccess(res, { company: updated }, 'Company updated');
});

exports.uploadLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));

  if (company.logo?.publicId) await deleteFromCloudinary(company.logo.publicId);

  const result = await uploadToCloudinary(req.file, 'company_logo', {
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  });

  await Company.findByIdAndUpdate(company._id, { logo: result });
  sendSuccess(res, { logo: result }, 'Logo uploaded');
});

exports.addGalleryImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file.', 400));
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.gallery.length >= 10) return next(new AppError('Gallery limit (10) reached.', 400));

  const result = await uploadToCloudinary(req.file, 'company_gallery');
  company.gallery.push({ ...result, caption: req.body.caption });
  await company.save();
  sendSuccess(res, { gallery: company.gallery }, 'Gallery image added');
});

exports.removeGalleryImage = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));
  const img = company.gallery.id(req.params.imageId);
  if (!img) return next(new AppError('Image not found.', 404));
  await deleteFromCloudinary(img.publicId);
  img.remove();
  await company.save();
  sendSuccess(res, {}, 'Image removed');
});

exports.getCompanies = asyncHandler(async (req, res) => {
  const { search, industry, city, page = 1, limit = 12 } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$text = { $search: search };
  if (city) filter.city = new RegExp(city, 'i');

  const result = await Company.paginate(filter, {
    page, limit, sort: { isFeaturedCompany: -1, isGoldCompany: -1, createdAt: -1 },
    select: '-logo.publicId -gallery', lean: true,
  });
  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

exports.toggleFollow = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));

  const existing = await Follower.findOne({ followerId: req.user._id, companyId: company._id });

  if (existing) {
    await Follower.findByIdAndDelete(existing._id);
    await Company.findByIdAndUpdate(company._id, { $inc: { followersCount: -1 } });
    return sendSuccess(res, { following: false }, 'Unfollowed');
  }

  await Follower.create({ followerId: req.user._id, companyId: company._id });
  await Company.findByIdAndUpdate(company._id, { $inc: { followersCount: 1 } });
  sendSuccess(res, { following: true }, 'Following');
});

exports.getMyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('No company found. Please create one.', 404));
  sendSuccess(res, { company }, 'Company fetched');
});
