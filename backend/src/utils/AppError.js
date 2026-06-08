class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(errors) {
    super('Validation failed', 422);
    this.errors = errors;
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page:     parseInt(page),
      limit:    parseInt(limit),
      pages:    Math.ceil(total / limit),
      hasMore:  page * limit < total,
      hasPrev:  page > 1,
    },
  });
};

module.exports = {
  AppError, ValidationError, AuthError, ForbiddenError, NotFoundError,
  asyncHandler, sendSuccess, sendPaginated,
};
