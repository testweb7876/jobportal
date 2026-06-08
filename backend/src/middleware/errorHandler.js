const logger = require('../config/logger');

const handleCastError    = (err) => ({ statusCode: 400, message: `Invalid ${err.path}: ${err.value}` });
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return { statusCode: 409, message: `${field} already exists. Please use a different value.` };
};
const handleValidation   = (err) => ({
  statusCode: 400,
  message: Object.values(err.errors).map(e => e.message).join(', '),
});
const handleJWT          = ()    => ({ statusCode: 401, message: 'Invalid token. Please log in again.' });
const handleJWTExpired   = ()    => ({ statusCode: 401, message: 'Token expired. Please log in again.' });
const handleMulter       = (err) => ({ statusCode: 400, message: err.message || 'File upload error.' });

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    logger.error(`${statusCode} ${req.method} ${req.originalUrl} — ${message}`, { stack: err.stack });
    return res.status(statusCode).json({ success: false, status: err.status, message, stack: err.stack, error: err });
  }

  // Production — clean up known errors
  if (err.name === 'CastError')        ({ statusCode, message } = handleCastError(err));
  if (err.code === 11000)              ({ statusCode, message } = handleDuplicateKey(err));
  if (err.name === 'ValidationError')  ({ statusCode, message } = handleValidation(err));
  if (err.name === 'JsonWebTokenError') ({ statusCode, message } = handleJWT());
  if (err.name === 'TokenExpiredError') ({ statusCode, message } = handleJWTExpired());
  if (err.name === 'MulterError')       ({ statusCode, message } = handleMulter(err));

  if (!err.isOperational) {
    logger.error('UNEXPECTED ERROR:', err);
    statusCode = 500;
    message = 'Something went wrong. Please try again.';
  }

  res.status(statusCode).json({ success: false, message });
};
