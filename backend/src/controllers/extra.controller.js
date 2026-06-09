// ═══════════════════════════════════════════════════════════
// MESSAGE CONTROLLER
// ═══════════════════════════════════════════════════════════
const { Conversation, Message, Notification } = require('../models/Communication.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { uploadToCloudinary } = require('../config/cloudinary');
let ioRef;
const setIO = (io) => { ioRef = io; };

const getOrCreateConversation = asyncHandler(async (req, res, next) => {
  const { recipientId, jobId, resumeId, message: msgText } = req.body;
  if (req.user._id.toString() === recipientId) return next(new AppError('Cannot message yourself.', 400));

  let conv = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId] },
    ...(jobId ? { jobId } : {}),
  }).populate('participants', 'firstName lastName avatar role');

  if (!conv) {
    conv = await Conversation.create({
      participants: [req.user._id, recipientId],
      jobId: jobId || null,
      resumeId: resumeId || null,
    });
    conv = await conv.populate('participants', 'firstName lastName avatar role');
  }

  // Send first message if provided
  if (msgText) {
    const msg = await Message.create({
      conversationId: conv._id,
      sendBy: req.user._id,
      message: msgText,
      readBy: [req.user._id],
    });
    conv.lastMessage = msg._id;
    conv.lastMessageAt = new Date();
    conv.lastMessageText = msgText;
    conv.unreadCount.set(recipientId, (conv.unreadCount.get(recipientId) || 0) + 1);
    await conv.save();

    if (ioRef) ioRef.to(`user:${recipientId}`).emit('new_message', { message: msg, conversationId: conv._id });
  }

  sendSuccess(res, { conversation: conv }, 'Conversation ready');
});

const getConversations = asyncHandler(async (req, res) => {
  const convs = await Conversation.find({ participants: req.user._id, isDeleted: false })
    .populate('participants', 'firstName lastName avatar role')
    .populate('jobId', 'title')
    .sort({ lastMessageAt: -1 })
    .limit(50);
  sendSuccess(res, { conversations: convs }, 'Conversations fetched');
});

const getMessages = asyncHandler(async (req, res, next) => {
  const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id });
  if (!conv) return next(new AppError('Conversation not found.', 404));

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;

  const result = await Message.paginate({ conversationId: conv._id, isDeleted: false }, {
    page, limit, sort: { createdAt: -1 },
    populate: { path: 'sendBy', select: 'firstName lastName avatar' },
    lean: true,
  });

  // Mark read
  await Message.updateMany(
    { conversationId: conv._id, sendBy: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id }, isRead: true, readAt: new Date() }
  );
  conv.unreadCount.set(req.user._id.toString(), 0);
  await conv.save();

  sendSuccess(res, { messages: result.docs.reverse(), pagination: { total: result.totalDocs, page, hasMore: result.hasNextPage } }, 'Messages fetched');
});

const sendMessage = asyncHandler(async (req, res, next) => {
  const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id });
  if (!conv) return next(new AppError('Conversation not found.', 404));

  const { message: msgText, replyToId, subject } = req.body;

  let attachments = [];
  if (req.files?.length) {
    attachments = await Promise.all(req.files.map(f => uploadToCloudinary(f, 'message')));
  }

  const msg = await Message.create({
    conversationId: conv._id,
    sendBy: req.user._id,
    message: msgText,
    subject, replyToId: replyToId || null,
    attachments,
    readBy: [req.user._id],
  });

  await msg.populate('sendBy', 'firstName lastName avatar');

  conv.lastMessage = msg._id;
  conv.lastMessageAt = new Date();
  conv.lastMessageText = msgText;
  conv.participants.forEach(p => {
    if (p.toString() !== req.user._id.toString()) {
      conv.unreadCount.set(p.toString(), (conv.unreadCount.get(p.toString()) || 0) + 1);
      if (ioRef) ioRef.to(`user:${p}`).emit('new_message', { message: msg, conversationId: conv._id });
    }
  });
  await conv.save();

  sendSuccess(res, { message: msg }, 'Message sent', 201);
});

// ═══════════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ═══════════════════════════════════════════════════════════
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = { recipientId: req.user._id, isDeleted: false };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.unread === 'true') filter.isRead = false;

  const result = await Notification.paginate(filter, { page, limit, sort: { createdAt: -1 } });
  const unreadCount = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });

  sendSuccess(res, { notifications: result.docs, unreadCount, pagination: { total: result.totalDocs, page } }, 'Notifications fetched');
});

const markNotifRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (ids === 'all') {
    await Notification.updateMany({ recipientId: req.user._id }, { isRead: true, readAt: new Date() });
  } else {
    await Notification.updateMany({ _id: { $in: ids }, recipientId: req.user._id }, { isRead: true, readAt: new Date() });
  }
  sendSuccess(res, {}, 'Marked as read');
});

const deleteNotif = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipientId: req.user._id }, { isDeleted: true });
  sendSuccess(res, {}, 'Notification deleted');
});

// ═══════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ═══════════════════════════════════════════════════════════
const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const Application = require('../models/Application.model');
const { ActivityLog, SystemError, Config } = require('../models/Misc.model');
const { Invoice } = require('../models/Payment.model');
const dayjs = require('dayjs');

const getDashboardStats = asyncHandler(async (req, res) => {
  const since = dayjs().subtract(30, 'day').toDate();

  const [
    totalUsers, totalJobseekers, totalEmployers,
    totalJobs, activeJobs, pendingJobs,
    totalCompanies, verifiedCompanies,
    totalApps, totalRevenue,
    recentUsers, recentJobs,
    monthlySignups,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments().setOptions({ includeDeleted: false }),
    Job.countDocuments({ status: 'approved' }),
    Job.countDocuments({ status: 'pending' }),
    Company.countDocuments(),
    Company.countDocuments({ isVerified: true }),
    Application.countDocuments(),
    Invoice.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt status'),
    Job.find().sort({ createdAt: -1 }).limit(5).populate('companyId', 'name').select('title status createdAt companyId'),
    User.aggregate([
      { $match: { createdAt: { $gte: dayjs().subtract(6, 'month').toDate() } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
  ]);

  sendSuccess(res, {
    stats: {
      users: { total: totalUsers, jobseekers: totalJobseekers, employers: totalEmployers },
      jobs: { total: totalJobs, active: activeJobs, pending: pendingJobs },
      companies: { total: totalCompanies, verified: verifiedCompanies },
      applications: totalApps,
      revenue: totalRevenue[0]?.total || 0,
    },
    recentUsers, recentJobs, monthlySignups,
  }, 'Stats fetched');
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role)   filter.role = role;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { firstName: new RegExp(search, 'i') },
    { lastName: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
  ];

  const result = await User.paginate(filter, { page, limit, sort: { createdAt: -1 } });
  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

const updateUser = asyncHandler(async (req, res, next) => {
  const allowed = ['status', 'role', 'isEmailVerified'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return next(new AppError('User not found.', 404));
  sendSuccess(res, { user }, 'User updated');
});

const getAllJobs = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, 'i');

  const result = await Job.paginate(filter, {
    page, limit, sort: { createdAt: -1 },
    populate: { path: 'companyId', select: 'name' },
    lean: true,
  });
  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

const verifyCompany = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const company = await Company.findByIdAndUpdate(req.params.id, {
    isVerified: status === 'approved',
    verificationStatus: status,
    verificationNote: note,
  }, { new: true });
  if (!company) return next(new AppError('Company not found.', 404));
  sendSuccess(res, { company }, `Company ${status}`);
});

const getSystemErrors = asyncHandler(async (req, res) => {
  const errors = await SystemError.find({ isView: false }).sort({ createdAt: -1 }).limit(100);
  await SystemError.updateMany({ isView: false }, { isView: true });
  sendSuccess(res, { errors }, 'Errors fetched');
});

const getConfig = asyncHandler(async (req, res) => {
  const configs = await Config.find();
  const obj = configs.reduce((a, c) => ({ ...a, [c.configName]: c.configValue }), {});
  sendSuccess(res, { config: obj }, 'Config fetched');
});

const updateConfig = asyncHandler(async (req, res) => {
  const updates = Object.entries(req.body);
  await Promise.all(updates.map(([k, v]) =>
    Config.findOneAndUpdate({ configName: k }, { configValue: v }, { upsert: true })
  ));
  sendSuccess(res, {}, 'Config updated');
});

const getActivityLogs = asyncHandler(async (req, res) => {
  const { userId, action, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (userId) filter.uid = userId;
  if (action) filter.action = new RegExp(action, 'i');
  const result = await ActivityLog.paginate(filter, { page, limit, sort: { createdAt: -1 }, populate: { path: 'uid', select: 'firstName lastName email' } });
  sendPaginated(res, result.docs, result.totalDocs, page, limit);
});

// ═══════════════════════════════════════════════════════════
// PACKAGE CONTROLLER
// ═══════════════════════════════════════════════════════════
const { Package, UserPackage, Invoice: InvoiceModel, TransactionLog } = require('../models/Payment.model');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const crypto2 = require('crypto');

const getPackages = asyncHandler(async (req, res) => {
  const { packageFor } = req.query;
  const filter = { status: true, isDeleted: false };
  if (packageFor) filter.packageFor = { $in: [packageFor, 'both'] };
  const packages = await Package.find(filter).sort({ price: 1 }).populate('currencyId', 'symbol code');
  sendSuccess(res, { packages }, 'Packages fetched');
});

const createStripeOrder = asyncHandler(async (req, res, next) => {
  if (!stripe) return next(new AppError('Stripe not configured.', 500));
  const pkg = await Package.findById(req.body.packageId);
  if (!pkg || !pkg.status) return next(new AppError('Package not found.', 404));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'inr', product_data: { name: pkg.title }, unit_amount: Math.round(pkg.price * 100) }, quantity: 1 }],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    metadata: { packageId: pkg._id.toString(), userId: req.user._id.toString() },
  });

  const invoice = await InvoiceModel.create({
    uid: req.user._id, recordId: pkg._id,
    description: `Package: ${pkg.title}`,
    type: 'package', amount: pkg.price,
    payMethod: 'stripe',
    gatewayOrderId: session.id,
    paymentStatus: 'pending',
  });

  sendSuccess(res, { sessionId: session.id, sessionUrl: session.url, invoiceId: invoice._id }, 'Stripe session created');
});

const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  let Razorpay;
  try { Razorpay = require('razorpay'); } catch { return next(new AppError('Razorpay not installed.', 500)); }

  const rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const pkg = await Package.findById(req.body.packageId);
  if (!pkg) return next(new AppError('Package not found.', 404));

  const order = await rp.orders.create({ amount: Math.round(pkg.price * 100), currency: 'INR', receipt: `pkg_${pkg._id}_${Date.now()}` });

  const invoice = await InvoiceModel.create({
    uid: req.user._id, recordId: pkg._id,
    description: `Package: ${pkg.title}`, type: 'package',
    amount: pkg.price, payMethod: 'razorpay',
    gatewayOrderId: order.id, paymentStatus: 'pending',
  });

  sendSuccess(res, { orderId: order.id, amount: order.amount, currency: order.currency, invoiceId: invoice._id, key: process.env.RAZORPAY_KEY_ID }, 'Razorpay order created');
});

const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;

  const expectedSig = crypto2.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

  if (expectedSig !== razorpay_signature) return next(new AppError('Invalid payment signature.', 400));

  const invoice = await InvoiceModel.findById(invoiceId);
  if (!invoice) return next(new AppError('Invoice not found.', 404));

  const pkg = await Package.findById(invoice.recordId);
  if (!pkg) return next(new AppError('Package not found.', 404));

  // Activate package
  const dayUnit = pkg.packageTimeUnit === 'months' ? 'month' : pkg.packageTimeUnit === 'years' ? 'year' : 'day';
  const endDate = dayjs().add(pkg.packageTime, dayUnit).toDate();

  const userPkg = await UserPackage.create({
    uid: req.user._id, packageId: pkg._id, endDate, status: true, isActive: true,
    remainingJobs: pkg.job === -1 ? 999999 : pkg.job,
    remainingFeaturedJobs: pkg.featuredJob,
    remainingResumes: pkg.resume,
    remainingFeaturedResumes: pkg.featuredResume,
    remainingCompanies: pkg.companies,
    remainingJobAlerts: pkg.jobAlert,
    remainingJobApply: pkg.jobApply,
    remainingResumeSearch: pkg.resumeSearch,
    remainingCoverLetters: pkg.coverletter,
    remainingDepartments: pkg.department,
    paymentHistoryId: invoice._id,
  });

  invoice.paymentStatus = 'paid';
  invoice.gatewayPaymentId = razorpay_payment_id;
  invoice.gatewaySignature = razorpay_signature;
  invoice.paidAt = new Date();
  await invoice.save();

  await TransactionLog.create({ uid: req.user._id, userPackageId: userPkg._id, recordId: invoice._id, type: 'package_purchase', status: true });

  sendSuccess(res, { userPackage: userPkg, invoice }, 'Payment verified. Package activated!');
});

const getUserPackages = asyncHandler(async (req, res) => {
  const packages = await UserPackage.find({ uid: req.user._id }).sort({ createdAt: -1 }).populate('packageId', 'title price');
  sendSuccess(res, { packages }, 'User packages fetched');
});

const getInvoices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const result = await InvoiceModel.paginate({ uid: req.user._id }, { page, limit: 20, sort: { createdAt: -1 } });
  sendPaginated(res, result.docs, result.totalDocs, page, 20);
});

// const { sendPaginated: sp } = require('../utils/AppError');

module.exports = {
  // Message
  setMessageIO: setIO,
  getOrCreateConversation, getConversations, getMessages, sendMessage,
  // Notification
  getNotifications, markNotifRead, deleteNotif,
  // Admin
  getDashboardStats, getUsers, updateUser, getAllJobs, verifyCompany,
  getSystemErrors, getConfig, updateConfig, getActivityLogs,
  // Package/Payment
  getPackages, createStripeOrder, createRazorpayOrder, verifyRazorpayPayment,
  getUserPackages, getInvoices,
};
