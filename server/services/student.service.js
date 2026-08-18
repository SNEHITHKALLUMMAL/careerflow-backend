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

  student[field].push(itemData);
  applyProfileCompletion(student);
  await student.save();

  return student[field][student[field].length - 1];
}

export async function updateItem(userId, field, itemId, updates) {
  assertKnownField(field);
  const student = await getOrCreateProfile(userId);

  const item = student[field].id(itemId);
  if (!item) throw ApiError.notFound(`Item not found in ${field}.`);

  Object.assign(item, updates);
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
