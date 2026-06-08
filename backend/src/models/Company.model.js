const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosePaginate = require('mongoose-paginate-v2');

const gallerySchema = new mongoose.Schema({
  publicId:   String,
  secureUrl:  String,
  caption:    String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const companySchema = new mongoose.Schema({
  uid:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:  { type: String, required: true, trim: true, maxlength: 255 },
  slug:  { type: String, unique: true },
  alias: String,

  // ── Contact & Web ─────────────────────────────────────────────────────────
  url:          String,
  contactEmail: String,
  tagline:      String,
  description:  { type: String, maxlength: 10000 },
  phone:        String,

  // ── Logo ─────────────────────────────────────────────────────────────────
  logo: {
    publicId:     String,
    secureUrl:    String,
    resourceType: { type: String, default: 'image' },
    fileSize:     Number,
  },
  smallLogo: { publicId: String, secureUrl: String },
  logoFilename:      String, // legacy
  smallLogoFilename: String, // legacy

  // ── Location ─────────────────────────────────────────────────────────────
  city:     String,
  address1: String,
  address2: String,
  // wp_wj_portal_companycities → embedded as array of City refs
  cities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],

  // ── Verification ──────────────────────────────────────────────────────────
  isVerified:         { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
  verificationNote:   String,
  verificationDocuments: [{ publicId: String, secureUrl: String, fileType: String, uploadedAt: Date }],

  // ── Status / Features ────────────────────────────────────────────────────
  status:           { type: Number, default: 0 }, // legacy: 0=inactive,1=active
  isActive:         { type: Boolean, default: true },
  isGoldCompany:    { type: Boolean, default: false },
  startGoldDate:    Date,
  endGoldDate:      Date,
  isFeaturedCompany: { type: Boolean, default: false },
  startFeaturedDate: Date,
  endFeaturedDate:   Date,

  // ── Social Media ─────────────────────────────────────────────────────────
  socialLinks: {
    facebook:  String,
    twitter:   String,
    linkedin:  String,
    youtube:   String,
    instagram: String,
    website:   String,
  },

  // ── Gallery ──────────────────────────────────────────────────────────────
  gallery: [gallerySchema],

  // ── SEO ──────────────────────────────────────────────────────────────────
  metaDescription: String,
  metaKeywords:    String,

  // ── Analytics ────────────────────────────────────────────────────────────
  hits:           { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  jobsCount:      { type: Number, default: 0 },

  // ── Package ──────────────────────────────────────────────────────────────
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:         Number,

  // ── Soft Delete ───────────────────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────────────────
  serverstatus: String,
  serverid:     { type: Number, default: 0 },
  params:       mongoose.Schema.Types.Mixed,

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ─── Indexes ──────────────────────────────────────────────────────────────────
companySchema.index({ slug: 1 });
companySchema.index({ uid: 1 });
companySchema.index({ name: 'text', description: 'text', tagline: 'text' });
companySchema.index({ status: 1, isDeleted: 1 });
companySchema.index({ isVerified: 1 });
companySchema.index({ isFeaturedCompany: -1, isGoldCompany: -1 });
companySchema.index({ createdAt: -1 });

companySchema.plugin(mongoosePaginate);

// ─── Slug ─────────────────────────────────────────────────────────────────────
companySchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  let slug = slugify(this.name, { lower: true, strict: true });
  const count = await mongoose.model('Company').countDocuments({ slug: new RegExp(`^${slug}`) });
  this.slug = count ? `${slug}-${Date.now()}` : slug;
  next();
});

companySchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Company', companySchema);
