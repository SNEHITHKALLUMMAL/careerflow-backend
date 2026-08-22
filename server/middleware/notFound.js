import { ApiError } from '../utils/ApiError.js';

/** Mounted after all routes — anything that reaches here didn't match a route. */
export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
