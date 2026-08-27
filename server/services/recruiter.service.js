import { Recruiter } from '../models/Recruiter.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function getOrCreateProfile(userId) {
  const recruiter = await Recruiter.findOne({ userId });
  if (recruiter) return recruiter;

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.role !== 'recruiter') {
    throw ApiError.forbidden('Only recruiter accounts have a recruiter profile.');
  }

  return Recruiter.create({ userId });
}

export async function updateProfile(userId, updates) {
  const recruiter = await getOrCreateProfile(userId);
  const allowed = ['companyName', 'companyLogoUrl', 'companyWebsite', 'industry'];
  for (const key of allowed) {
    if (updates[key] !== undefined) recruiter[key] = updates[key];
  }
  await recruiter.save();
  return recruiter;
}

export async function getOwnRecruiterId(userId) {
  const recruiter = await getOrCreateProfile(userId);
  return recruiter._id;
}

/** Throws unless the recruiter has completed their profile and is verified — required to post listings. */
export async function assertCanPostListings(userId) {
  const recruiter = await getOrCreateProfile(userId);

  if (!recruiter.companyName) {
    throw ApiError.badRequest('Add your company name to your recruiter profile before posting.');
  }
  if (!recruiter.isVerified) {
    throw ApiError.forbidden(
      'Your recruiter account is pending verification. An administrator needs to approve it before you can post jobs or internships.'
    );
  }

  return recruiter;
}

export async function verifyRecruiter(recruiterId) {
  const recruiter = await Recruiter.findById(recruiterId);
  if (!recruiter) throw ApiError.notFound('Recruiter not found.');
  recruiter.isVerified = true;
  await recruiter.save();
  return recruiter;
}
