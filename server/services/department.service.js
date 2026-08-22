import { Department } from '../models/Department.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Lists departments for a college. A placement officer is implicitly scoped
 * to their own college; superAdmin may pass any collegeId (or omit it to get
 * every department on the platform, e.g. for a global picker).
 */
export async function listDepartments(user, { collegeId } = {}) {
  const query = {};

  if (user.role === 'superAdmin') {
    if (collegeId) query.collegeId = collegeId;
  } else {
    if (!user.collegeId) {
      throw ApiError.badRequest('Your account is not linked to a college.');
    }
    query.collegeId = user.collegeId;
  }

  return Department.find(query).sort({ name: 1 });
}
