const { AppError } = require('../utils/AppError');

// file-type is ESM only in v17+, we'll do magic bytes check
const SIGNATURES = {
  image: [
    [0xFF, 0xD8, 0xFF],          // JPEG
    [0x89, 0x50, 0x4E, 0x47],   // PNG
    [0x47, 0x49, 0x46],          // GIF
    [0x52, 0x49, 0x46, 0x46],   // WEBP (RIFF)
  ],
  pdf:  [[0x25, 0x50, 0x44, 0x46]], // %PDF
  doc:  [[0xD0, 0xCF, 0x11, 0xE0]], // DOC
  docx: [[0x50, 0x4B, 0x03, 0x04]], // DOCX (ZIP)
};

const matchesSignature = (buffer, sigs) => {
  return sigs.some(sig => sig.every((byte, i) => buffer[i] === byte));
};

const validateFileType = (allowedTypes = ['image', 'pdf', 'docx']) => (req, res, next) => {
  if (!req.file && !req.files) return next();

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  for (const file of files) {
    if (!file?.buffer) continue;
    const buf = file.buffer;
    let valid = false;

    for (const type of allowedTypes) {
      if (SIGNATURES[type] && matchesSignature(buf, SIGNATURES[type])) {
        valid = true;
        break;
      }
    }

    if (!valid) {
      return next(new AppError(`Invalid file type for ${file.originalname}. Allowed: ${allowedTypes.join(', ')}`, 400));
    }
  }
  next();
};

module.exports = { validateFileType };
