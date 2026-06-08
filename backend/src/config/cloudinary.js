const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

logger.info('✅ Cloudinary Configured');

// ─── Folder Map ───────────────────────────────────────────────────────────────
const FOLDERS = {
  avatar:       'jobportal/users/avatars',
  company_logo: 'jobportal/companies/logos',
  company_gallery: 'jobportal/companies/gallery',
  resume_file:  'jobportal/resumes/files',
  message:      'jobportal/messages',
  verification: 'jobportal/verifications',
  cover_letter: 'jobportal/coverletters',
  job_file:     'jobportal/jobs/files',
  invoice:      'jobportal/invoices',
};

// ─── File Filter ──────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files allowed (jpg, png, webp, gif)'), false);
};

const documentFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('File type not allowed. Use PDF, DOC, DOCX, or image.'), false);
};

// ─── Multer instances ─────────────────────────────────────────────────────────
const storage = multer.memoryStorage();

const uploadImage = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: documentFilter,
});

const uploadAny = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, files: 5 },
  fileFilter: documentFilter,
});

// ─── Stream Upload ────────────────────────────────────────────────────────────
const streamUpload = (buffer, options) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
    if (result) return resolve(result);
    reject(err);
  });
  streamifier.createReadStream(buffer).pipe(stream);
});

// ─── Upload to Cloudinary ─────────────────────────────────────────────────────
const uploadToCloudinary = async (file, folderKey = 'avatar', options = {}) => {
  try {
    const folder = FOLDERS[folderKey] || `jobportal/${folderKey}`;
    const uploadOptions = {
      folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    };

    if (file.mimetype?.startsWith('image/')) {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ];
    }

    const result = await streamUpload(file.buffer, uploadOptions);

    return {
      publicId:     result.public_id,
      secureUrl:    result.secure_url,
      fileType:     result.format || file.mimetype,
      fileSize:     result.bytes,
      resourceType: result.resource_type,
      width:        result.width,
      height:       result.height,
    };
  } catch (err) {
    logger.error('Cloudinary upload error:', err);
    throw new Error('File upload failed. Please try again.');
  }
};

// ─── Delete from Cloudinary ───────────────────────────────────────────────────
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) return;
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    logger.error('Cloudinary delete error:', err);
  }
};

const uploadMultiple = async (files, folderKey = 'message') =>
  Promise.all(files.map((f) => uploadToCloudinary(f, folderKey)));

const getResponsiveUrl = (publicId, width) =>
  cloudinary.url(publicId, { width, crop: 'scale', quality: 'auto', fetch_format: 'auto', secure: true });

module.exports = {
  cloudinary,
  uploadImage,
  uploadDocument,
  uploadAny,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultiple,
  getResponsiveUrl,
};
