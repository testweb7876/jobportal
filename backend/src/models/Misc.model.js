const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// ─── CATEGORY (wp_wj_portal_categories) ──────────────────────────────────────
const categorySchema = new mongoose.Schema({
  catValue:  String,
  catTitle:  { type: String, required: true },
  alias:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  parentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  serverid:  Number,
}, { timestamps: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ alias: 1 });
categorySchema.index({ isActive: 1 });

// ─── JOB TYPE (wp_wj_portal_jobtypes) ────────────────────────────────────────
const jobTypeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  color:     String,
  alias:     String,
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  status:    { type: Boolean, default: true },
  serverid:  Number,
}, { timestamps: true });

// ─── JOB STATUS (wp_wj_portal_jobstatus) ─────────────────────────────────────
const jobStatusSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  Number,
}, { timestamps: true });

// ─── CAREER LEVEL (wp_wj_portal_careerlevels) ────────────────────────────────
const careerLevelSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  status:    { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  Number,
}, { timestamps: true });

// ─── EDUCATION (wp_wj_portal_heighesteducation) ───────────────────────────────
const educationSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  { type: Number, default: 0 },
}, { timestamps: true });

// ─── SALARY RANGE TYPE (wp_wj_portal_salaryrangetypes) ───────────────────────
const salaryRangeTypeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  status:    { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  Number,
}, { timestamps: true });

// ─── CURRENCY (wp_wj_portal_currencies) ──────────────────────────────────────
const currencySchema = new mongoose.Schema({
  title:        String,
  symbol:       String,
  code:         { type: String, required: true, unique: true },
  status:       { type: Boolean, default: true },
  isDefault:    Boolean,
  ordering:     Number,
  smallestUnit: { type: Number, default: 100 },
  serverid:     Number,
}, { timestamps: true });

// ─── COUNTRY (wp_wj_portal_countries) ────────────────────────────────────────
const countrySchema = new mongoose.Schema({
  name:              String,
  localName:         String,
  internationalName: String,
  nameCode:          String,
  shortCountry:      String,
  continentId:       Number,
  dialCode:          Number,
  enabled:           { type: Boolean, default: false },
  serverid:          Number,
}, { timestamps: true });
countrySchema.index({ name: 'text' });

// ─── STATE (wp_wj_portal_states) ─────────────────────────────────────────────
const stateSchema = new mongoose.Schema({
  name:              String,
  localName:         String,
  internationalName: String,
  shortRegion:       String,
  countryId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  enabled:           { type: Boolean, default: false },
  serverid:          Number,
}, { timestamps: true });
stateSchema.index({ countryId: 1 });
stateSchema.index({ name: 'text' });

// ─── CITY (wp_wj_portal_cities) ──────────────────────────────────────────────
const citySchema = new mongoose.Schema({
  cityName:          String,
  name:              String,
  localName:         String,
  internationalName: String,
  stateId:           { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  countryId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  isEdit:            { type: Boolean, default: false },
  enabled:           { type: Boolean, default: true },
  latitude:          String,
  longitude:         String,
  serverid:          Number,
}, { timestamps: true });
citySchema.index({ countryId: 1 });
citySchema.index({ stateId: 1 });
citySchema.index({ name: 'text' });

// ─── DEPARTMENT (wp_wj_portal_departments) ───────────────────────────────────
const departmentSchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:      { type: String, required: true, maxlength: 70 },
  alias:     String,
  description: String,
  status:    { type: Boolean, default: true },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:     Number,
  serverstatus: String,
  serverid:  { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });
departmentSchema.index({ companyId: 1 });
departmentSchema.index({ uid: 1 });

// ─── COVER LETTER (wp_wj_portal_coverletters) ────────────────────────────────
const coverLetterSchema = new mongoose.Schema({
  uid:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, maxlength: 300 },
  alias:       String,
  description: { type: String, required: true },
  hits:        { type: Number, default: 0 },
  published:   { type: Boolean, default: true },
  searchable:  { type: Boolean, default: true },
  status:      { type: Boolean, default: true },
  packageId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  paymentHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  serverstatus: String,
  serverid:    { type: Number, default: 0 },
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   Date,
}, { timestamps: true });
coverLetterSchema.index({ uid: 1 });
coverLetterSchema.plugin(mongoosePaginate);

// ─── JOB ALERT (wp_wj_portal_jobalertsetting + wp_wj_portal_jobalertcities) ──
const jobAlertSchema = new mongoose.Schema({
  uid:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name:          { type: String, required: true },
  contactEmail:  { type: String, required: true },
  country:       String,
  state:         String,
  county:        String,
  city:          String,
  zipcode:       String,
  // jobalertcities → embedded array
  cities:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
  keywords:      String,
  company:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  jobType:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobType' },
  workplaceType: Number,
  isUrgent:      { type: Boolean, default: false },
  tags:          [String],
  alertType:     Number,
  longitude:     String,
  latitude:      String,
  coordinatesRadius: { type: Number, default: 0 },
  sendTime:      Date,
  lastMailSend:  Date,
  status:        { type: Number, default: 1 },
  price:         { type: Number, default: 0 },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  serverid:      Number,
  serverstatus:  String,
  isDeleted:     { type: Boolean, default: false },
  deletedAt:     Date,
}, { timestamps: true });
jobAlertSchema.index({ uid: 1 });
jobAlertSchema.index({ sendTime: 1, status: 1 });

// ─── JOB SHORTLIST (wp_wj_portal_jobshortlist) ───────────────────────────────
const jobShortlistSchema = new mongoose.Schema({
  uid:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  comments: String,
  rate:     String,
  status:   { type: Boolean, default: true },
  serverid: Number,
  serverstatus: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });
jobShortlistSchema.index({ uid: 1 });
jobShortlistSchema.index({ jobId: 1 });
jobShortlistSchema.index({ uid: 1, jobId: 1 }, { unique: true });

// ─── ACTIVITY LOG (wp_wj_portal_activitylog) ─────────────────────────────────
const activityLogSchema = new mongoose.Schema({
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description:  { type: String, required: true },
  referenceFor: String,
  referenceId:  mongoose.Schema.Types.ObjectId,
  action:       String,
  ipAddress:    String,
  userAgent:    String,
  browser:      String,
  os:           String,
}, { timestamps: true });
activityLogSchema.index({ uid: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.plugin(mongoosePaginate);

// ─── TAG (wp_wj_portal_tags) ──────────────────────────────────────────────────
const tagSchema = new mongoose.Schema({
  tag:       { type: String, required: true, maxlength: 300 },
  alias:     String,
  tagFor:    Number, // 1=job, 2=resume
  status:    { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
tagSchema.index({ tag: 1 });
tagSchema.index({ tagFor: 1 });

// ─── FOLLOWER ─────────────────────────────────────────────────────────────────
const followerSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });
followerSchema.index({ followerId: 1, companyId: 1 }, { unique: true });
followerSchema.index({ companyId: 1 });

// ─── REPORT ───────────────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refModel:    { type: String, enum: ['Job', 'Company', 'Resume', 'User'] },
  refId:       mongoose.Schema.Types.ObjectId,
  reason:      { type: String, required: true },
  description: String,
  status:      { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote:  String,
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });
reportSchema.index({ status: 1 });
reportSchema.index({ refModel: 1, refId: 1 });

// ─── EMPLOYER VIEW RESUME (wp_wj_portal_employer_view_resume) ─────────────────
const employerViewResumeSchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:    { type: Boolean, default: true },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:     Number,
}, { timestamps: true });
employerViewResumeSchema.index({ uid: 1, resumeId: 1 });

// ─── JOBSEEKER VIEW COMPANY (wp_wj_portal_jobseeker_view_company) ─────────────
const jobseekerViewCompanySchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  status:    { type: Boolean, default: true },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:     { type: Number, default: 0 },
}, { timestamps: true });
jobseekerViewCompanySchema.index({ uid: 1, companyId: 1 });

// ─── SAVED SEARCH (wp_wj_portal_resumesearches) ──────────────────────────────
const savedSearchSchema = new mongoose.Schema({
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  searchName:   { type: String, required: true, maxlength: 50 },
  searchType:   { type: String, enum: ['job', 'resume'], default: 'job' },
  searchParams: mongoose.Schema.Types.Mixed,
  params:       mongoose.Schema.Types.Mixed,
  status:       { type: Boolean, default: true },
  price:        { type: Number, default: 0 },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
}, { timestamps: true });
savedSearchSchema.index({ uid: 1 });

// ─── FOLDER (wp_wj_portal_folders) ───────────────────────────────────────────
const folderSchema = new mongoose.Schema({
  uid:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  global:      { type: Boolean, default: false },
  jobId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  name:        { type: String, required: true, maxlength: 255 },
  alias:       String,
  description: String,
  status:      { type: Boolean, default: true },
  packageId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  paymentHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  serverid:    Number,
  serverstatus: String,
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   Date,
}, { timestamps: true });
folderSchema.index({ uid: 1 });

// ─── FOLDER RESUME (wp_wj_portal_folderresumes) ───────────────────────────────
const folderResumeSchema = new mongoose.Schema({
  uid:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
  serverid: Number,
  serverstatus: String,
}, { timestamps: true });
folderResumeSchema.index({ folderId: 1 });
folderResumeSchema.index({ uid: 1, resumeId: 1, folderId: 1 }, { unique: true });

// ─── EMAIL TEMPLATE (wp_wj_portal_emailtemplates) ────────────────────────────
const emailTemplateSchema = new mongoose.Schema({
  uid:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  templateFor: String,
  title:       String,
  subject:     String,
  body:        String,
  status:      { type: Boolean, default: true },
  variables:   [String], // available template variables
}, { timestamps: true });

const emailTemplateConfigSchema = new mongoose.Schema({
  emailFor:         { type: String, required: true },
  admin:            { type: Boolean, default: false },
  employer:         { type: Boolean, default: false },
  jobseeker:        { type: Boolean, default: false },
  jobseekerVisitor: { type: Boolean, default: false },
  employerVisitor:  { type: Number, default: 0 },
}, { timestamps: true });

// ─── FIELD ORDERING (wp_wj_portal_fieldsordering) ────────────────────────────
const fieldOrderingSchema = new mongoose.Schema({
  field:             { type: String, required: true },
  fieldTitle:        String,
  ordering:          Number,
  section:           String,
  isSectionHeadline: { type: Boolean, default: false },
  placeholder:       String,
  description:       String,
  fieldFor:          Number, // 1=job,2=resume,3=company
  published:         { type: Boolean, default: true },
  isVisitorPublished: { type: Boolean, default: false },
  sys:               { type: Boolean, default: false },
  cannotUnpublish:   { type: Boolean, default: false },
  required:          { type: Boolean, default: false },
  isUserField:       { type: Boolean, default: false },
  userFieldType:     String,
  userFieldParams:   mongoose.Schema.Types.Mixed,
  searchUser:        { type: Boolean, default: false },
  searchVisitor:     { type: Boolean, default: false },
  searchOrdering:    Number,
  cannotSearch:      { type: Boolean, default: false },
  showOnListing:     { type: Boolean, default: false },
  cannotShowOnListing: { type: Boolean, default: false },
  dependantField:    String,
  readonly:          { type: Boolean, default: false },
  size:              { type: Number, default: 0 },
  maxlength:         { type: Number, default: 0 },
  cols:              { type: Number, default: 0 },
  rows:              { type: Number, default: 0 },
  jScript:           String,
  visibleField:      String,
  visibleParams:     mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// ─── SYSTEM ERROR (wp_wj_portal_system_errors) ───────────────────────────────
const systemErrorSchema = new mongoose.Schema({
  uid:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  error:  String,
  stack:  String,
  isView: { type: Boolean, default: false },
}, { timestamps: true });

// ─── CONFIG (wp_wj_portal_config) ────────────────────────────────────────────
const configSchema = new mongoose.Schema({
  configName:  { type: String, required: true, unique: true },
  configValue: String,
  configFor:   String,
  addon:       String,
}, { timestamps: true });

// ─── AI WRAPPER MODELS (wp_wj_portal_zywrap_*) ───────────────────────────────
const aiModelSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true },
  name:       String,
  providerId: String,
  ordering:   Number,
  status:     { type: Boolean, default: true },
}, { timestamps: true });

const aiWrapperSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true },
  name:         String,
  description:  String,
  useCaseCode:  String,
  featured:     Boolean,
  base:         Boolean,
  ordering:     Number,
  status:       { type: Boolean, default: true },
}, { timestamps: true });

const aiLogSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:           String,
  action:           String,
  wrapperCode:      String,
  modelCode:        String,
  httpCode:         Number,
  errorMessage:     String,
  promptTokens:     Number,
  completionTokens: Number,
  totalTokens:      Number,
  tokenData:        mongoose.Schema.Types.Mixed,
}, { timestamps: true });
aiLogSchema.index({ userId: 1 });
aiLogSchema.index({ action: 1, status: 1 });

// ─── SLUG (wp_wj_portal_slug) ─────────────────────────────────────────────────
const slugModel = new mongoose.Schema({
  slug:             { type: String, required: true, unique: true },
  defaultSlug:      String,
  filename:         String,
  description:      String,
  status:           Boolean,
  pageTitle:        String,
  defaultPageTitle: String,
  moduleName:       String,
  titleOptions:     String,
}, { timestamps: true });

// ─── PAYMENT METHOD CONFIG (wp_wj_portal_paymentmethodconfig) ────────────────
const paymentMethodConfigSchema = new mongoose.Schema({
  configName:  { type: String, required: true, unique: true },
  configValue: String,
  configFor:   { type: String, enum: ['stripe', 'razorpay', 'paypal', 'bank'] },
}, { timestamps: true });

module.exports = {
  Category:            mongoose.model('Category', categorySchema),
  JobType:             mongoose.model('JobType', jobTypeSchema),
  JobStatus:           mongoose.model('JobStatus', jobStatusSchema),
  CareerLevel:         mongoose.model('CareerLevel', careerLevelSchema),
  Education:           mongoose.model('Education', educationSchema),
  SalaryRangeType:     mongoose.model('SalaryRangeType', salaryRangeTypeSchema),
  Currency:            mongoose.model('Currency', currencySchema),
  Country:             mongoose.model('Country', countrySchema),
  State:               mongoose.model('State', stateSchema),
  City:                mongoose.model('City', citySchema),
  Department:          mongoose.model('Department', departmentSchema),
  CoverLetter:         mongoose.model('CoverLetter', coverLetterSchema),
  JobAlert:            mongoose.model('JobAlert', jobAlertSchema),
  JobShortlist:        mongoose.model('JobShortlist', jobShortlistSchema),
  ActivityLog:         mongoose.model('ActivityLog', activityLogSchema),
  Tag:                 mongoose.model('Tag', tagSchema),
  Follower:            mongoose.model('Follower', followerSchema),
  Report:              mongoose.model('Report', reportSchema),
  EmployerViewResume:  mongoose.model('EmployerViewResume', employerViewResumeSchema),
  JobseekerViewCompany: mongoose.model('JobseekerViewCompany', jobseekerViewCompanySchema),
  SavedSearch:         mongoose.model('SavedSearch', savedSearchSchema),
  Folder:              mongoose.model('Folder', folderSchema),
  FolderResume:        mongoose.model('FolderResume', folderResumeSchema),
  EmailTemplate:       mongoose.model('EmailTemplate', emailTemplateSchema),
  EmailTemplateConfig: mongoose.model('EmailTemplateConfig', emailTemplateConfigSchema),
  FieldOrdering:       mongoose.model('FieldOrdering', fieldOrderingSchema),
  SystemError:         mongoose.model('SystemError', systemErrorSchema),
  Config:              mongoose.model('Config', configSchema),
  AiModel:             mongoose.model('AiModel', aiModelSchema),
  AiWrapper:           mongoose.model('AiWrapper', aiWrapperSchema),
  AiLog:               mongoose.model('AiLog', aiLogSchema),
  SlugModel:           mongoose.model('SlugModel', slugModel),
  PaymentMethodConfig: mongoose.model('PaymentMethodConfig', paymentMethodConfigSchema),
};
