const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// ─── PACKAGE (wp_wj_portal_packages) ─────────────────────────────────────────
const packageSchema = new mongoose.Schema({
  title:  { type: String, required: true, maxlength: 45 },
  isFree: { type: Boolean, default: false },
  price:  { type: Number, default: 0 },

  // ── Duration ──────────────────────────────────────────────────────────────
  packageTime:     { type: Number, required: true },
  packageTimeUnit: { type: String, enum: ['days', 'months', 'years'], required: true },

  // ── Feature Limits ────────────────────────────────────────────────────────
  companies:            { type: Number, default: 0 },
  featuredCompany:      { type: Number, default: 0 },
  job:                  { type: Number, default: 0 },  // -1 = unlimited
  featuredJob:          { type: Number, default: 0 },
  resume:               { type: Number, default: 0 },
  featuredResume:       { type: Number, default: 0 },
  department:           { type: Number, default: 0 },
  coverletter:          { type: Number, default: 0 },
  jobSearch:            { type: Number, default: 0 },
  resumeSearch:         { type: Number, default: 0 },
  jobAlert:             { type: Number, default: 0 },
  jobApply:             { type: Number, default: 0 },
  resumeContactDetail:  { type: Number, default: 0 },
  companyContactDetail: { type: Number, default: 0 },

  // ── Job Publish Duration ──────────────────────────────────────────────────
  jobTime:     { type: Number, default: 30 },
  jobTimeUnit: { type: String, enum: ['days', 'months', 'years'], default: 'days' },

  // ── Featured Durations ────────────────────────────────────────────────────
  featuredCompanyTime:     Number,
  featuredCompanyTimeUnit: String,
  featuredJobTime:         Number,
  featuredJobTimeUnit:     String,
  featuredResumeTime:      Number,
  featuredResumeTimeUnit:  String,

  // ── Discount ──────────────────────────────────────────────────────────────
  discount:          Number,
  discountType:      { type: String, enum: ['fixed', 'percent'] },
  renewDiscount:     Number,
  renewDiscountType: { type: String, enum: ['fixed', 'percent'] },

  // ── Stripe / PayPal ───────────────────────────────────────────────────────
  currencyId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  packageFor:         { type: String, enum: ['employer', 'jobseeker', 'both'], required: true },
  paypalSubscription: { type: Boolean, default: false },
  stripeSubscription: { type: Boolean, default: false },
  stripePlanId:       String,
  stripePlanName:     String,

  status:    { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

packageSchema.index({ packageFor: 1, status: 1 });

// ─── USER PACKAGE (wp_wj_portal_userpackages) ────────────────────────────────
const userPackageSchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  endDate:   { type: Date, required: true },
  status:    { type: Boolean, default: true },
  isActive:  { type: Boolean, default: true },

  // ── Usage Counters ────────────────────────────────────────────────────────
  remainingJobs:            { type: Number, default: 0 },
  remainingFeaturedJobs:    { type: Number, default: 0 },
  remainingResumes:         { type: Number, default: 0 },
  remainingFeaturedResumes: { type: Number, default: 0 },
  remainingCompanies:       { type: Number, default: 0 },
  remainingJobAlerts:       { type: Number, default: 0 },
  remainingJobApply:        { type: Number, default: 0 },
  remainingResumeSearch:    { type: Number, default: 0 },
  remainingCoverLetters:    { type: Number, default: 0 },
  remainingDepartments:     { type: Number, default: 0 },

  // ── Auto Renew ────────────────────────────────────────────────────────────
  autoRenew:        { type: Boolean, default: false },
  subscriptionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  paymentHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

userPackageSchema.index({ uid: 1, status: 1, isActive: 1 });
userPackageSchema.index({ endDate: 1 });
userPackageSchema.plugin(mongoosePaginate);

// ─── INVOICE (wp_wj_portal_invoices) ─────────────────────────────────────────
const invoiceSchema = new mongoose.Schema({
  uid:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordId:    mongoose.Schema.Types.ObjectId,
  description: String,
  type:        { type: String, enum: ['package', 'boost', 'addon', 'featured'], required: true },
  currencyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  amount:      { type: Number, required: true },

  // ── Payment ───────────────────────────────────────────────────────────────
  payMethod:     { type: String, enum: ['stripe', 'razorpay', 'paypal', 'bank', 'free', 'manual'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'], default: 'pending' },
  transactionId: String,
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  paidAt:        Date,
  refundStatus:  { type: String, enum: ['none', 'requested', 'processing', 'refunded'], default: 'none' },
  refundedAt:    Date,
  refundReason:  String,
  refundId:      String,

  // ── Payer Details ─────────────────────────────────────────────────────────
  payerName:              String,
  payerEmail:             String,
  payerAddress:           String,
  payerTransactionNumber: String,
  payerContactNumber:     String,
  paymentProof:           String, // URL for bank transfer proof

  status: { type: Boolean, default: true },
}, { timestamps: true });

invoiceSchema.index({ uid: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.plugin(mongoosePaginate);

// ─── TRANSACTION LOG (wp_wj_portal_transactionlog) ───────────────────────────
const transactionLogSchema = new mongoose.Schema({
  uid:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  recordId:      mongoose.Schema.Types.ObjectId,
  type:          String,
  status:        Boolean,
}, { timestamps: true });

transactionLogSchema.index({ uid: 1 });
transactionLogSchema.index({ userPackageId: 1 });

// ─── SUBSCRIPTION (wp_wj_portal_subscriptions) ───────────────────────────────
const subscriptionSchema = new mongoose.Schema({
  subId:          { type: String, required: true },
  custId:         String,
  uid:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  payMethod:      { type: String, enum: ['stripe', 'razorpay', 'paypal'] },
  nextBillingDate: Date,
  status:         { type: Boolean, default: true },
}, { timestamps: true });

subscriptionSchema.index({ uid: 1 });
subscriptionSchema.index({ subId: 1 });

module.exports = {
  Package:        mongoose.model('Package', packageSchema),
  UserPackage:    mongoose.model('UserPackage', userPackageSchema),
  Invoice:        mongoose.model('Invoice', invoiceSchema),
  TransactionLog: mongoose.model('TransactionLog', transactionLogSchema),
  Subscription:   mongoose.model('Subscription', subscriptionSchema),
};
