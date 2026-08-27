import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Converts thrown Mongoose/JWT/generic errors into an ApiError so the
 * final handler below always deals with a consistent shape.
 */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest('Validation failed', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already in use`);
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expired');
  }

  // Anything else: in production, never forward the raw error message to the
  // client — an unhandled driver/SDK error or a genuine bug could otherwise
  // leak internal details (connection info, file paths, internal identifiers)
  // that ApiError-wrapped errors are specifically designed to avoid. Development
  // keeps the real message (and the stack, below) for debuggability.
  const statusCode = err.statusCode || 500;
  const message =
    env.nodeEnv === 'production' && statusCode >= 500
      ? 'Internal server error'
      : err.message || 'Internal server error';
  return new ApiError(statusCode, message);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err);

  if (apiError.statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: apiError.errors,
    ...(env.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}
