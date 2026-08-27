import { Department } from '../models/Department.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from './activityLog.service.js';

function resolveCollegeId(user, bodyCollegeId) {
  if (user.role === 'superAdmin') {
    if (!bodyCollegeId) {
      throw ApiError.badRequest('collegeId is required when creating a department as Super Admin.');
    }
    return bodyCollegeId;
  }
  if (!user.collegeId) {
    throw ApiError.badRequest('Your account is not linked to a college.');
  }
  return user.collegeId;
}

async function findOwnedDepartment(user, departmentId) {
  const department = await Department.findById(departmentId);
  if (!department) throw ApiError.notFound('Department not found.');

  if (user.role !== 'superAdmin' && String(department.collegeId) !== String(user.collegeId)) {
    throw ApiError.forbidden('You do not have access to this department.');
  }
  return department;
}

/**
 * Lists departments for a college. A placement officer or college admin is
 * implicitly scoped to their own college; superAdmin may pass any collegeId
 * (or omit it to get every department on the platform, e.g. for a global picker).
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

/** Creates a department in the caller's own college (or an explicit college for superAdmin). */
export async function createDepartment(user, { name, hodName, collegeId: bodyCollegeId }) {
  const collegeId = resolveCollegeId(user, bodyCollegeId);

  const department = await Department.create({ collegeId, name, hodName: hodName || null });

  await logActivity({
    type: 'department.created',
    message: `${user.name} created the ${department.name} department`,
    actor: user,
    collegeId,
    metadata: { departmentId: department._id },
  });

  return department;
}

/** Updates a department's name/HOD. Only within the caller's own college (or superAdmin, any college). */
export async function updateDepartment(user, departmentId, { name, hodName }) {
  const department = await findOwnedDepartment(user, departmentId);

  if (name !== undefined) department.name = name;
  if (hodName !== undefined) department.hodName = hodName || null;
  await department.save();

  return department;
}

/** Deletes a department. Only within the caller's own college (or superAdmin, any college). */
export async function deleteDepartment(user, departmentId) {
  const department = await findOwnedDepartment(user, departmentId);

  await department.deleteOne();

  await logActivity({
    type: 'department.deleted',
    message: `${user.name} deleted the ${department.name} department`,
    actor: user,
    collegeId: department.collegeId,
    metadata: { departmentId: department._id },
  });
}
