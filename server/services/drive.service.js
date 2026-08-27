import { Drive } from '../models/Drive.model.js';
import { Job } from '../models/Job.model.js';
import { Student } from '../models/Student.model.js';
import { Department } from '../models/Department.model.js';
import { Recruiter } from '../models/Recruiter.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { checkEligibility } from './eligibility.service.js';
import { notifyUsersSafely } from './notification.service.js';
import { driveScheduledMessage } from '../utils/notificationMessages.js';

function scopedCollegeId(user) {
  if (user.role === 'superAdmin') return null; // null = unscoped, sees everything
  if (!user.collegeId) {
    throw ApiError.badRequest('Your account is not linked to a college.');
  }
  return user.collegeId;
}

export async function createDrive(user, { jobId, driveDate, notes, collegeId: bodyCollegeId }) {
  const ownCollegeId = scopedCollegeId(user);
  const collegeId = ownCollegeId || bodyCollegeId;
  if (!collegeId) {
    throw ApiError.badRequest('collegeId is required when creating a drive as Super Admin.');
  }

  const job = await Job.findById(jobId);
  if (!job) throw ApiError.notFound('Job not found.');

  const drive = await Drive.create({
    collegeId,
    recruiterId: job.recruiterId,
    jobId,
    driveDate,
    notes: notes || null,
    createdBy: user._id,
  });

  // Notify students at the college about the new drive.
  const students = await User.find({ collegeId: drive.collegeId, role: 'student' }).select('_id');
  const recruiter = await Recruiter.findById(job.recruiterId).select('companyName');
  await notifyUsersSafely(
    students.map((s) => s._id),
    driveScheduledMessage(recruiter?.companyName || 'A recruiter', driveDate)
  );

  return drive;
}

export async function listDrives(user) {
  const collegeId = scopedCollegeId(user);
  const query = collegeId ? { collegeId } : {};
  return Drive.find(query)
    .sort({ driveDate: 1 })
    .populate('jobId', 'title')
    .populate({ path: 'recruiterId', select: 'companyName' });
}

export async function getDrive(user, driveId) {
  const drive = await Drive.findById(driveId)
    .populate('jobId', 'title eligibility')
    .populate({ path: 'recruiterId', select: 'companyName' });
  if (!drive) throw ApiError.notFound('Drive not found.');

  const collegeId = scopedCollegeId(user);
  if (collegeId && String(drive.collegeId) !== String(collegeId)) {
    throw ApiError.forbidden('You do not have access to this drive.');
  }
  return drive;
}

export async function updateDriveStatus(user, driveId, status) {
  const drive = await getDrive(user, driveId);
  drive.status = status;
  await drive.save();
  return drive;
}

/**
 * Computes which students at the drive's college meet the linked job's eligibility
 * criteria. Straightforward per-student loop rather than a single aggregation — clear
 * and correct at the scale this MVP targets; a larger deployment would want this
 * pushed into an aggregation pipeline.
 */
export async function getEligibleStudents(user, driveId) {
  const drive = await getDrive(user, driveId);
  const job = drive.jobId;

  const students = await Student.find({ collegeId: drive.collegeId })
    .select('userId education graduationYear departmentId')
    .populate('userId', 'name email');

  const departmentCache = new Map();
  async function resolveDepartmentName(departmentId) {
    if (!departmentId) return null;
    const key = String(departmentId);
    if (!departmentCache.has(key)) {
      const department = await Department.findById(departmentId).select('name');
      departmentCache.set(key, department?.name || null);
    }
    return departmentCache.get(key);
  }

  const eligibleStudents = [];
  for (const student of students) {
    const departmentName = await resolveDepartmentName(student.departmentId);
    const { eligible } = checkEligibility(student, departmentName, job.eligibility);
    if (eligible) {
      eligibleStudents.push({
        studentId: student._id,
        name: student.userId?.name,
        email: student.userId?.email,
      });
    }
  }

  return eligibleStudents;
}
