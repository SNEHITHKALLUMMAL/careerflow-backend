import { College } from '../models/College.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from './activityLog.service.js';

export async function listColleges({ search, page = 1, limit = 20 }) {
  const query = { superAdminApproved: true };
  if (search && typeof search === 'string') {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [colleges, total] = await Promise.all([
    College.find(query).sort({ name: 1 }).skip(skip).limit(limit),
    College.countDocuments(query),
  ]);

  return {
    colleges,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/**
 * Anyone can request a new college be added to the platform — most commonly
 * someone in the middle of registering who can't find their college yet, so
 * this is deliberately not behind authentication. It's created unapproved
 * and invisible to `listColleges` (and therefore to registration) until a
 * superAdmin approves it.
 */
export async function requestCollege({ name, domainEmailSuffix, address, city, state, requesterName, requesterEmail }) {
  const existing = await College.findOne({ name: name.trim() });
  if (existing) {
    throw ApiError.conflict('A college with this name already exists or is pending approval.');
  }

  const college = await College.create({
    name: name.trim(),
    domainEmailSuffix: domainEmailSuffix || null,
    address: address || null,
    city: city || null,
    state: state || null,
    superAdminApproved: false,
  });

  const who = requesterName || requesterEmail || 'Someone';
  await logActivity({
    type: 'college.requested',
    message: `${who} requested a new college: ${college.name}`,
    actor: null,
    metadata: { collegeId: college._id, requesterName, requesterEmail },
  });

  return college;
}

/** superAdmin-only: every college awaiting approval. */
export async function listPendingColleges() {
  return College.find({ superAdminApproved: false }).sort({ createdAt: -1 });
}

/** superAdmin-only: approves a pending college, making it visible on the platform. */
export async function approveCollege(actingUser, collegeId) {
  const college = await College.findById(collegeId);
  if (!college) throw ApiError.notFound('College not found.');
  if (college.superAdminApproved) throw ApiError.badRequest('This college is already approved.');

  college.superAdminApproved = true;
  await college.save();

  await logActivity({
    type: 'college.approved',
    message: `${actingUser.name} approved ${college.name}`,
    actor: actingUser,
    metadata: { collegeId: college._id },
  });

  return college;
}

/**
 * superAdmin-only: rejects a pending college request. A rejected request is
 * simply deleted — there's nothing worth keeping (no users can reference an
 * unapproved college yet, since it never appeared in the public list).
 */
export async function rejectCollege(actingUser, collegeId) {
  const college = await College.findById(collegeId);
  if (!college) throw ApiError.notFound('College not found.');
  if (college.superAdminApproved) {
    throw ApiError.badRequest('An already-approved college cannot be rejected.');
  }

  await college.deleteOne();

  await logActivity({
    type: 'college.rejected',
    message: `${actingUser.name} rejected the request for ${college.name}`,
    actor: actingUser,
    metadata: { collegeName: college.name },
  });
}
