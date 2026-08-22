import { College } from '../models/College.model.js';

export async function listColleges({ search, page = 1, limit = 20 }) {
  const query = { superAdminApproved: true };
  if (search) {
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
