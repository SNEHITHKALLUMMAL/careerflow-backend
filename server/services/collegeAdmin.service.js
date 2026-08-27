import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { listRecentActivity, logActivity } from './activityLog.service.js';

/**
 * The only roles a College Admin is ever allowed to see or manage. Deliberately
 * excludes 'recruiter' (not a college-scoped entity), 'collegeAdmin', and
 * 'superAdmin' — a College Admin must never be able to list, activate, or
 * deactivate another admin account, which is what "prevent global
 * administrative access" means in practice for this role.
 */
const COLLEGE_MANAGED_ROLES = ['student', 'mentor', 'placementOfficer'];

function requireCollegeId(user) {
  if (!user.collegeId) {
    throw ApiError.badRequest('Your account is not linked to a college.');
  }
  return user.collegeId;
}

/** College-scoped counts + recent activity for the College Admin dashboard. */
export async function getCollegeOverview(user) {
  const collegeId = requireCollegeId(user);

  const [totalStudents, totalMentors, totalPlacementOfficers] = await Promise.all([
    User.countDocuments({ collegeId, role: 'student' }),
    User.countDocuments({ collegeId, role: 'mentor' }),
    User.countDocuments({ collegeId, role: 'placementOfficer' }),
  ]);

  const recentActivity = await listRecentActivity({ limit: 15, collegeId });

  return { totalStudents, totalMentors, totalPlacementOfficers, recentActivity };
}

/**
 * Users within the caller's own college only, restricted to COLLEGE_MANAGED_ROLES.
 * Mirrors admin.service.js#listUsers but is forcibly college- and role-scoped —
 * this is what makes it safe for a non-superAdmin to call at all.
 */
export async function listCollegeUsers(user, { role, search, page = 1, limit = 20 } = {}) {
  const collegeId = requireCollegeId(user);
  const query = { collegeId, role: { $in: COLLEGE_MANAGED_ROLES } };

  if (role && typeof role === 'string' && COLLEGE_MANAGED_ROLES.includes(role)) {
    query.role = role;
  }
  if (search && typeof search === 'string') {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    items: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Activates/deactivates a user — but only within the caller's own college and
 * only for COLLEGE_MANAGED_ROLES. The query itself enforces both boundaries at
 * once: a targetUserId belonging to another college, a recruiter, or any
 * admin account simply won't match and comes back as a 404, not a 403 that
 * would confirm the account exists.
 */
export async function setCollegeUserActive(actingUser, targetUserId, isActive) {
  const collegeId = requireCollegeId(actingUser);

  if (String(actingUser._id) === String(targetUserId)) {
    throw ApiError.badRequest('You cannot deactivate your own account.');
  }

  const targetUser = await User.findOne({
    _id: targetUserId,
    collegeId,
    role: { $in: COLLEGE_MANAGED_ROLES },
  });
  if (!targetUser) {
    throw ApiError.notFound('User not found in your college.');
  }

  targetUser.isActive = isActive;
  await targetUser.save();

  await logActivity({
    type: isActive ? 'user.reactivated' : 'user.deactivated',
    message: `${actingUser.name} ${isActive ? 'reactivated' : 'deactivated'} ${targetUser.name}'s account`,
    actor: actingUser,
    collegeId,
    metadata: { targetUserId: targetUser._id },
  });

  return { id: targetUser._id, name: targetUser.name, isActive: targetUser.isActive };
}
