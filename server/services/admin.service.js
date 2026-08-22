import { User } from '../models/User.model.js';
import { College } from '../models/College.model.js';
import { Job } from '../models/Job.model.js';
import { Application } from '../models/Application.model.js';
import { ApiError } from '../utils/ApiError.js';
import { listRecentActivity, logActivity } from './activityLog.service.js';

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
  if (role) query.role = role;
  if (search) {
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
