import { Student, STUDENT_ARRAY_FIELDS } from '../models/Student.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { applyProfileCompletion, computeProfileCompletion } from './scoring.service.js';
import { uploadResumeForStudent } from './resume.service.js';

const UPDATABLE_PROFILE_FIELDS = [
  'rollNumber',
  'graduationYear',
  'departmentId',
  'careerInterests',
  'portfolioUrl',
  'githubUrl',
  'linkedinUrl',
];

function assertKnownField(field) {
  if (!STUDENT_ARRAY_FIELDS.includes(field)) {
    throw ApiError.badRequest(`Unknown student resource: ${field}`);
  }
}

/**
 * Fields on a sub-resource that a student is never allowed to set directly,
 * even though the field lives on their own document. `skills[].verified` in
 * particular is meant to be set by a mentor or an assessment result, not by
 * the student self-reporting it — see the comment on skillSchema.
 */
const PROTECTED_ITEM_FIELDS = {
  skills: ['verified'],
};

/** Strips any field a student isn't allowed to set directly for this sub-resource. */
export function sanitizeItemInput(field, data) {
  const protectedFields = PROTECTED_ITEM_FIELDS[field];
  if (!protectedFields) return data;

  const sanitized = { ...data };
  for (const key of protectedFields) delete sanitized[key];
  return sanitized;
}

/** Fetches the student profile for a user, creating an empty one on first access. */
export async function getOrCreateProfile(userId) {
  let student = await Student.findOne({ userId });
  if (student) return student;

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.role !== 'student') {
    throw ApiError.forbidden('Only student accounts have a student profile.');
  }

  student = await Student.create({ userId, collegeId: user.collegeId });
  return student;
}

export async function getMyProfile(userId) {
  return getOrCreateProfile(userId);
}

export async function getMyCompletion(userId) {
  const student = await getOrCreateProfile(userId);
  return computeProfileCompletion(student);
}

export async function updateProfile(userId, updates) {
  const student = await getOrCreateProfile(userId);

  for (const key of UPDATABLE_PROFILE_FIELDS) {
    if (updates[key] !== undefined) {
      student[key] = updates[key];
    }
  }

  applyProfileCompletion(student);
  await student.save();
  return student;
}

export async function addItem(userId, field, itemData) {
  assertKnownField(field);
  const student = await getOrCreateProfile(userId);

  student[field].push(sanitizeItemInput(field, itemData));
  applyProfileCompletion(student);
  await student.save();

  return student[field][student[field].length - 1];
}

export async function updateItem(userId, field, itemId, updates) {
  assertKnownField(field);
  const student = await getOrCreateProfile(userId);

  const item = student[field].id(itemId);
  if (!item) throw ApiError.notFound(`Item not found in ${field}.`);

  Object.assign(item, sanitizeItemInput(field, updates));
  applyProfileCompletion(student);
  await student.save();

  return item;
}

export async function removeItem(userId, field, itemId) {
  assertKnownField(field);
  const student = await getOrCreateProfile(userId);

  const item = student[field].id(itemId);
  if (!item) throw ApiError.notFound(`Item not found in ${field}.`);

  item.deleteOne();
  applyProfileCompletion(student);
  await student.save();
}

export async function uploadResume(userId, file) {
  const student = await getOrCreateProfile(userId);

  const resume = await uploadResumeForStudent(student._id, file);

  student.resumeId = resume._id;
  applyProfileCompletion(student);
  await student.save();

  return resume;
}
