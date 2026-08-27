import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/** Place after express-validator chains to turn validation failures into an ApiError. */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  next(ApiError.badRequest('Validation failed', errors));
}
