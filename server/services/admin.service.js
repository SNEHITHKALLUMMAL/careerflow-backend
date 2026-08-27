import { User, ROLES } from '../models/User.model.js';
import { College } from '../models/College.model.js';
import { Job } from '../models/Job.model.js';
import { Application } from '../models/Application.model.js';
import { ApiError } from '../utils/ApiError.js';
import { listRecentActivity, logActivity } from './activityLog.service.js';

// Roles that belong to a specific college — changing a user into one of these
// requires a collegeId; changing out of one clears it.
const COLLEGE_SCOPED_ROLES = ['student', 'mentor', 'placementOfficer', 'collegeAdmin'];

/** Platform-wide counts for the Super Admin dashboard. superAdmin-only — unscoped by college. */
export async function getPlatformStats() {
  const [totalStudents, totalRecruiters, totalMentors, totalColleges, totalJobs, totalApplications] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'mentor' }),
      College.countDocuments({}),
      Job.countDocuments({}),
      Application.countDocuments({}),
    ]);

  return {
    totalStudents,
    totalRecruiters,
    totalMentors,
    totalColleges,
    totalJobs,
    totalApplications,
  };
}

/** Recent platform-wide activity for the Super Admin dashboard feed. */
export async function getRecentActivity({ limit = 20, type, collegeId, sort } = {}) {
  return listRecentActivity({ limit, type, collegeId, sort });
}

/** Every user on the platform, with optional role/search filtering and pagination. superAdmin-only. */
export async function listUsers({ role, search, page = 1, limit = 20 } = {}) {
  const query = {};
  // Guard against Mongo query-operator injection (e.g. ?role[$ne]=x parses to an
  // object via Express's query parser) — only plain strings are valid filter values here.
  if (role && typeof role === 'string') query.role = role;
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
      collegeId: u.collegeId,
      createdAt: u.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Activates or deactivates any user account — the platform-wide "kill switch"
 * a super admin needs to disable a misbehaving or compromised account. A
 * superAdmin cannot deactivate their own account (guards against accidental
 * self-lockout).
 */
export async function setUserActive(actingUser, targetUserId, isActive) {
  if (String(actingUser._id) === String(targetUserId)) {
    throw ApiError.badRequest('You cannot deactivate your own account.');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw ApiError.notFound('User not found.');

  targetUser.isActive = isActive;
  await targetUser.save();

  await logActivity({
    type: isActive ? 'user.reactivated' : 'user.deactivated',
    message: `${actingUser.name} ${isActive ? 'reactivated' : 'deactivated'} ${targetUser.name}'s account`,
    actor: actingUser,
    collegeId: targetUser.collegeId,
    metadata: { targetUserId: targetUser._id },
  });

  return { id: targetUser._id, name: targetUser.name, isActive: targetUser.isActive };
}

/**
 * Changes a user's role — the "role management" capability the SRS requires.
 * Guards mirror setUserActive's self-lockout protection, plus two more that
 * are specific to a role change:
 *  - a superAdmin can never change their own role (same reasoning as never
 *    being able to deactivate themselves — avoids accidental self-lockout);
 *  - demoting the *last* active superAdmin away from that role is refused,
 *    which is what actually implements the SRS's "prevent deactivation of the
 *    final active super administrator" now that role changes exist as a
 *    second way an account could stop being a superAdmin.
 * A role change into/out of a college-scoped role also updates collegeId
 * accordingly — a newly-promoted collegeAdmin needs one, a demoted recruiter
 * shouldn't keep one.
 */
export async function changeUserRole(actingUser, targetUserId, newRole, collegeId) {
  if (String(actingUser._id) === String(targetUserId)) {
    throw ApiError.badRequest('You cannot change your own role.');
  }
  if (!ROLES.includes(newRole)) {
    throw ApiError.badRequest(`role must be one of: ${ROLES.join(', ')}`);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw ApiError.notFound('User not found.');

  if (targetUser.role === 'superAdmin' && newRole !== 'superAdmin') {
    const otherActiveSuperAdmins = await User.countDocuments({
      role: 'superAdmin',
      isActive: true,
      _id: { $ne: targetUser._id },
    });
    if (otherActiveSuperAdmins === 0) {
      throw ApiError.badRequest('Cannot change the role of the last active Super Admin.');
    }
  }

  const resolvedCollegeId = collegeId || targetUser.collegeId;
  if (COLLEGE_SCOPED_ROLES.includes(newRole) && !resolvedCollegeId) {
    throw ApiError.badRequest(`A collegeId is required to assign the ${newRole} role.`);
  }
  if (resolvedCollegeId) {
    const college = await College.findById(resolvedCollegeId);
    if (!college) throw ApiError.badRequest('collegeId does not refer to a real college.');
  }

  const previousRole = targetUser.role;
  targetUser.role = newRole;
  targetUser.collegeId = COLLEGE_SCOPED_ROLES.includes(newRole) ? resolvedCollegeId : null;
  await targetUser.save();

  await logActivity({
    type: 'user.role_changed',
    message: `${actingUser.name} changed ${targetUser.name}'s role from ${previousRole} to ${newRole}`,
    actor: actingUser,
    collegeId: targetUser.collegeId,
    metadata: { targetUserId: targetUser._id, previousRole, newRole },
  });

  return {
    id: targetUser._id,
    name: targetUser.name,
    role: targetUser.role,
    collegeId: targetUser.collegeId,
  };
}
