const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosePaginate = require('mongoose-paginate-v2');

const jobSchema = new mongoose.Schema({
  // ── Core ─────────────────────────────────────────────────────────────────
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  title:     { type: String, required: true, trim: true, maxlength: 255 },
  slug:      { type: String, unique: true },

  // ── Classification ────────────────────────────────────────────────────────
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  jobCategory:   String, // legacy text
  jobType:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobType' },
  careerLevel:   { type: mongoose.Schema.Types.ObjectId, ref: 'CareerLevel' },
  educationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Education' },
  degreetitle:   String,
  departmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  tags:          [String],

  // ── Status ───────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'expired', 'paused', 'deleted'],
    default: 'pending',
  },
  jobStatus:      { type: Number, default: 1 }, // legacy
  moderationNote: String,
  rejectedReason: String,
  isUrgent:       { type: Boolean, default: false },
  urgentUntil:    Date,

  // ── Content ──────────────────────────────────────────────────────────────
  description:     { type: String, required: true },
  qualifications:  String,
  prefferdSkills:  String,
  applyInfo:       String,
  metaDescription: String,
  metaKeywords:    String,
  reference:       String,
  duration:        String,

  // ── Location ─────────────────────────────────────────────────────────────
  company:       String,
  city:          String,
  zipcode:       String,
  address1:      String,
  address2:      String,
  longitude:     String,
  latitude:      String,
  map:           String,
  // wp_wj_portal_jobcities → cities array
  cities:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
  workplaceType: { type: String, enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' },

  // ── Contact ───────────────────────────────────────────────────────────────
  companyUrl:   String,
  contactName:  String,
  contactPhone: String,
  contactEmail: String,
  showContact:  { type: Boolean, default: false },
  jobApplyLink: { type: Boolean, default: false },
  jobLink:      String,

  // ── Salary ───────────────────────────────────────────────────────────────
  hideSalaryRange: { type: Boolean, default: true },
  salaryType:     { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryRangeType' },
  salaryMin:      Number,
  salaryMax:      Number,
  salaryDuration: Number,
  currency:       String,

  // ── Requirements ──────────────────────────────────────────────────────────
  experience:              { type: Number, default: 0 },
  heighestfinishEducation: String,
  noOfJobs:                { type: Number, default: 1 },

  // ── Scheduling / Expiry ───────────────────────────────────────────────────
  startPublishing: Date,
  stopPublishing:  Date,
  expiresAt:       Date,
  scheduledAt:     Date,
  sendemail:       { type: Boolean, default: false },
  ordering:        { type: Number, default: 0 },

  // ── Featured & Gold ───────────────────────────────────────────────────────
  isGoldJob:         { type: Boolean, default: false },
  startGoldDate:     Date,
  endGoldDate:       Date,
  isFeaturedJob:     { type: Boolean, default: false },
  startFeaturedDate: Date,
  endFeaturedDate:   Date,
  featuredUntil:     Date,

  // ── RAF (Recommended Applicant Filters) ───────────────────────────────────
  raf: {
    gender:      Boolean,
    degreeLevel: Boolean,
    experience:  Boolean,
    age:         Boolean,
    education:   Boolean,
    category:    Boolean,
    subcategory: Boolean,
    location:    Boolean,
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  viewsCount:        { type: Number, default: 0 },
  applicationsCount: { type: Number, default: 0 },
  hits:              { type: Number, default: 0 },

  // ── AI Fields ────────────────────────────────────────────────────────────
  aiJobSearchText:        String,
  aiJobSearchDescription: String,

  // ── Attachments ───────────────────────────────────────────────────────────
  aboutJobFile: { publicId: String, secureUrl: String, fileType: String },

  // ── Package & Payment ────────────────────────────────────────────────────
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:         Number,

  // ── Soft Delete ───────────────────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────────────────
  serverstatus: String,
  serverid:     { type: Number, default: 0 },
  jobid:        String,
  params:       mongoose.Schema.Types.Mixed,

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ─── Indexes ──────────────────────────────────────────────────────────────────
jobSchema.index({ title: 'text', description: 'text', aiJobSearchText: 'text', tags: 'text', prefferdSkills: 'text' });
jobSchema.index({ slug: 1 });
jobSchema.index({ status: 1, isDeleted: 1 });
jobSchema.index({ uid: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ categoryId: 1, subcategoryId: 1 });
jobSchema.index({ city: 1 });
jobSchema.index({ workplaceType: 1 });
jobSchema.index({ isFeaturedJob: -1, isGoldJob: -1, isUrgent: -1 });
jobSchema.index({ expiresAt: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });
jobSchema.index({ experience: 1 });

jobSchema.plugin(mongoosePaginate);

// ─── Virtuals ────────────────────────────────────────────────────────────────
jobSchema.virtual('isExpired').get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});
jobSchema.virtual('isActive').get(function () {
  return this.status === 'approved' && !this.isExpired;
});

// ─── Hooks ───────────────────────────────────────────────────────────────────
// jobSchema.pre('save', async function (next) {
//   if (!this.isModified('title')) return next();
//   let slug = slugify(this.title, { lower: true, strict: true });
//   const count = await mongoose.model('Job').countDocuments({ slug: new RegExp(`^${slug}`) });
//   this.slug = count ? `${slug}-${Date.now()}` : slug;
//   next();
// });

jobSchema.pre('save', async function () {

  if (!this.isModified('title')) return;

  let slug = slugify(this.title, {
    lower: true,
    strict: true
  });

  const count = await mongoose
    .model('Job')
    .countDocuments({
      slug: new RegExp(`^${slug}`)
    });

  this.slug = count
    ? `${slug}-${Date.now()}`
    : slug;
});



jobSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Job', jobSchema);
