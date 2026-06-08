const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'application_received', 'application_viewed', 'shortlisted', 'hired', 'rejected',
      'interview_scheduled', 'offer_received', 'package_expiry', 'package_expired',
      'payment_success', 'payment_failed', 'message_received', 'job_alert',
      'company_followed', 'resume_viewed', 'profile_viewed', 'job_approved',
      'job_rejected', 'system', 'custom',
    ],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  refModel: { type: String, enum: ['Job', 'Application', 'Company', 'Resume', 'Message', 'Package', 'Invoice'] },
  refId:    mongoose.Schema.Types.ObjectId,
  isRead:   { type: Boolean, default: false },
  readAt:   Date,
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push:  { type: Boolean, default: false },
    sms:   { type: Boolean, default: false },
  },
  emailSent: { type: Boolean, default: false },
  pushSent:  { type: Boolean, default: false },
  actionUrl:  String,
  actionText: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.plugin(mongoosePaginate);

// ─── CONVERSATION ─────────────────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  employerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobseekerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage:      { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt:    Date,
  lastMessageText:  String,
  unreadCount: { type: Map, of: Number, default: {} },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ employerId: 1, jobseekerId: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// ─── MESSAGE (wp_wj_portal_messages) ─────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sendBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobseekerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  replyToId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  subject:       String,
  message:       { type: String, required: true },
  attachments: [{
    publicId:     String,
    secureUrl:    String,
    filename:     String,
    fileType:     String,
    fileSize:     Number,
    resourceType: String,
  }],
  isRead:    { type: Boolean, default: false },
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readAt:    Date,
  isConflict:    { type: Boolean, default: false },
  conflictValue: String,
  status:        { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
  deletedFor:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedAt:     Date,
  serverstatus:  String,
  serverid:      Number,
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sendBy: 1 });
messageSchema.index({ jobId: 1 });
messageSchema.plugin(mongoosePaginate);

module.exports = {
  Notification: mongoose.model('Notification', notificationSchema),
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message:      mongoose.model('Message', messageSchema),
};
