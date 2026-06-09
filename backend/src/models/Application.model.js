const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const statusHistorySchema = new mongoose.Schema({
  status:    String,
  note:      String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const activitySchema = new mongoose.Schema({
  action:      String,
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress:   String,
  createdAt:   { type: Date, default: Date.now },
}, { _id: false });

// wp_wj_portal_jobapply
const applicationSchema = new mongoose.Schema({
  jobId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cvId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // ── Content ───────────────────────────────────────────────────────────────
  applyMessage:  String,
  comments:      { type: String, maxlength: 1000 },
  coverLetterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter' },
  quickApply:    { type: Boolean, default: false },

  // ── Social Apply ──────────────────────────────────────────────────────────
  socialApplied:   { type: Boolean, default: false },
  socialProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Status (wp_wj_portal_jobapply.action_status / status) ─────────────────
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'],
    default: 'applied',
  },
  actionStatus:   Number, // legacy
  statusHistory:  [statusHistorySchema],
  withdrawReason: String,

  // ── Resume View (wp_wj_portal_employer_view_resume) ──────────────────────
  resumeView:     { type: Boolean, default: false },
  resumeViewedAt: Date,

  // ── Rating ────────────────────────────────────────────────────────────────
  rating: { type: Number, default: 0, min: 0, max: 5 },

  // ── Notes ─────────────────────────────────────────────────────────────────
  employerNotes:  String,
  candidateNotes: String,

  // ── Interview Scheduling ──────────────────────────────────────────────────
  interview: {
    scheduledAt: Date,
    type:        { type: String, enum: ['in_person', 'phone', 'video', 'technical'] },
    link:        String,
    location:    String,
    notes:       String,
    conductedAt: Date,
    feedback:    String,
  },

  // ── Resume Snapshot (at time of apply) ────────────────────────────────────
  resumeSnapshot: mongoose.Schema.Types.Mixed,

  // ── Activity Log ──────────────────────────────────────────────────────────
  activityLog: [activitySchema],

  // ── Package & Payment ────────────────────────────────────────────────────
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:         Number,

  // ── Soft Delete ───────────────────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────────────────
  serverstatus: String,
  serverid:     Number,
  applyDate:    Date,

}, { timestamps: true });

// Prevent duplicate applications
applicationSchema.index({ jobId: 1, uid: 1 }, { unique: true });
applicationSchema.index({ uid: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ companyId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

applicationSchema.plugin(mongoosePaginate);

// applicationSchema.pre(/^find/, function (next) {
//   if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
//   next();
// });

applicationSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model('Application', applicationSchema);
