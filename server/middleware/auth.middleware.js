import { User } from '../models/User.model.js';
import { verifyAccessToken } from '../services/token.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Requires a valid access token; attaches the authenticated user to req.user. */
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication required.');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account not found or disabled.');
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Use after `authenticate`.
 * @param {...string} roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action.');
    }
    next();
  };
}

/** Restricts a route to users belonging to the same college as the target resource, or Super Admin. */
export function scopeToCollege(getResourceCollegeId) {
  return asyncHandler(async (req, res, next) => {
    if (req.user.role === 'superAdmin') return next();

    const resourceCollegeId = await getResourceCollegeId(req);
    if (!resourceCollegeId || String(resourceCollegeId) !== String(req.user.collegeId)) {
      throw ApiError.forbidden('You do not have access to this college.');
    }
    next();
  });
}
