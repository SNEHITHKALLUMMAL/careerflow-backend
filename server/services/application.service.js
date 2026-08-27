import { Application, APPLICATION_STATUSES } from '../models/Application.model.js';
import { Job } from '../models/Job.model.js';
import { Internship } from '../models/Internship.model.js';
import { Student } from '../models/Student.model.js';
import { Department } from '../models/Department.model.js';
import { Recruiter } from '../models/Recruiter.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { checkEligibility } from './eligibility.service.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { generateOfferLetterPdfBuffer } from './offerLetterPdf.service.js';
import { notifyUserSafely } from './notification.service.js';
import {
  applicationStatusMessage,
  interviewScheduledMessage,
  offerIssuedMessage,
} from '../utils/notificationMessages.js';

const TARGET_MODELS = { job: Job, internship: Internship };
const TARGET_MODEL_NAME = { job: 'Job', internship: 'Internship' };

async function getOwnedStudent(userId) {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.forbidden('No student profile found.');
  return student;
}

async function getTargetOrThrow(targetType, targetId) {
  const Model = TARGET_MODELS[targetType];
  if (!Model) throw ApiError.badRequest('targetType must be job or internship.');
  const target = await Model.findById(targetId);
  if (!target) throw ApiError.notFound(`${targetType === 'job' ? 'Job' : 'Internship'} not found.`);
  return target;
}

export async function apply(userId, targetType, targetId) {
  const student = await getOwnedStudent(userId);
  const target = await getTargetOrThrow(targetType, targetId);

  if (target.status !== 'open') {
    throw ApiError.badRequest('This listing is not currently accepting applications.');
  }

  const existing = await Application.findOne({ studentId: student._id, targetType, targetId });
  if (existing) throw ApiError.conflict('You have already applied to this listing.');

  let departmentName = null;
  if (student.departmentId) {
    const department = await Department.findById(student.departmentId).select('name');
    departmentName = department?.name || null;
  }

  const { eligible, reasons } = checkEligibility(student, departmentName, target.eligibility);
  if (!eligible) {
    throw new ApiError(
      422,
      'You do not meet the eligibility criteria for this listing.',
      reasons.map((message) => ({ field: 'eligibility', message }))
    );
  }

  return Application.create({
    studentId: student._id,
    targetType,
    targetModel: TARGET_MODEL_NAME[targetType],
    targetId,
    resumeId: student.resumeId,
    status: 'applied',
    statusHistory: [{ status: 'applied', changedBy: userId }],
  });
}

export async function withdraw(userId, applicationId) {
  const student = await getOwnedStudent(userId);
  const application = await Application.findOne({ _id: applicationId, studentId: student._id });
  if (!application) throw ApiError.notFound('Application not found.');
  if (application.status === 'withdrawn') {
    throw ApiError.conflict('This application is already withdrawn.');
  }

  application.status = 'withdrawn';
  application.statusHistory.push({ status: 'withdrawn', changedBy: userId });
  await application.save();
  return application;
}

export async function listMyApplications(userId) {
  const student = await getOwnedStudent(userId);
  return Application.find({ studentId: student._id }).sort({ createdAt: -1 }).populate('targetId');
}

async function assertRecruiterOwnsTarget(userId, targetType, targetId) {
  const recruiter = await Recruiter.findOne({ userId });
  if (!recruiter) throw ApiError.forbidden('No recruiter profile found.');

  const target = await getTargetOrThrow(targetType, targetId);
  if (String(target.recruiterId) !== String(recruiter._id)) {
    throw ApiError.forbidden('You do not have access to this listing.');
  }
  return { recruiter, target };
}

export async function listApplicantsForListing(userId, targetType, targetId) {
  await assertRecruiterOwnsTarget(userId, targetType, targetId);
  return Application.find({ targetType, targetId })
    .sort({ createdAt: -1 })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
}

async function getApplicationOwnedByRecruiter(userId, applicationId) {
  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found.');
  await assertRecruiterOwnsTarget(userId, application.targetType, application.targetId);
  return application;
}

async function getStudentUserIdAndTargetTitle(application) {
  const student = await Student.findById(application.studentId).select('userId');
  const target = await getTargetOrThrow(application.targetType, application.targetId);
  return { studentUserId: student?.userId, targetTitle: target.title };
}

export async function updateStatus(userId, applicationId, status) {
  if (!APPLICATION_STATUSES.includes(status)) throw ApiError.badRequest('Invalid status.');

  const application = await getApplicationOwnedByRecruiter(userId, applicationId);
  application.status = status;
  application.statusHistory.push({ status, changedBy: userId });
  await application.save();

  const { studentUserId, targetTitle } = await getStudentUserIdAndTargetTitle(application);
  if (studentUserId) {
    await notifyUserSafely(studentUserId, applicationStatusMessage(status, targetTitle));
  }

  return application;
}

export async function scheduleInterview(userId, applicationId, { scheduledAt, mode, link, notes }) {
  const application = await getApplicationOwnedByRecruiter(userId, applicationId);

  application.interview = { scheduledAt, mode, link: link || null, notes: notes || null };
  application.status = 'interview_scheduled';
  application.statusHistory.push({ status: 'interview_scheduled', changedBy: userId });
  await application.save();

  const { studentUserId, targetTitle } = await getStudentUserIdAndTargetTitle(application);
  if (studentUserId) {
    await notifyUserSafely(studentUserId, interviewScheduledMessage(targetTitle, scheduledAt));
  }

  return application;
}

export async function issueOfferLetter(userId, applicationId, { position, salary, startDate }) {
  const application = await getApplicationOwnedByRecruiter(userId, applicationId);
  const student = await Student.findById(application.studentId);
  const studentUser = await User.findById(student.userId);
  const recruiter = await Recruiter.findOne({ userId });

  const pdfBuffer = await generateOfferLetterPdfBuffer({
    studentName: studentUser.name,
    companyName: recruiter.companyName || 'Our Company',
    position,
    salary,
    startDate,
    issuedDate: new Date(),
  });

  const uploadResult = await uploadBufferToCloudinary(pdfBuffer, {
    folder: 'careerflow/offer-letters',
    resource_type: 'raw',
    format: 'pdf',
    public_id: `offer-${application._id}`,
  });

  application.offerLetterUrl = uploadResult.secure_url;
  application.status = 'offered';
  application.statusHistory.push({ status: 'offered', changedBy: userId });
  await application.save();

  const { targetTitle } = await getStudentUserIdAndTargetTitle(application);
  await notifyUserSafely(studentUser._id, offerIssuedMessage(targetTitle));

  return application;
}

export async function toggleBookmark(userId, targetType, targetId, action) {
  const student = await getOwnedStudent(userId);
  await getTargetOrThrow(targetType, targetId); // validate it exists

  const field = targetType === 'job' ? 'bookmarkedJobs' : 'bookmarkedInternships';
  const alreadyBookmarked = student[field].some((id) => String(id) === String(targetId));

  if (action === 'add' && !alreadyBookmarked) {
    student[field].push(targetId);
  } else if (action === 'remove') {
    student[field] = student[field].filter((id) => String(id) !== String(targetId));
  }

  await student.save();
  return student[field];
}

export async function listBookmarked(userId, targetType) {
  const student = await getOwnedStudent(userId);
  const field = targetType === 'job' ? 'bookmarkedJobs' : 'bookmarkedInternships';
  const Model = TARGET_MODELS[targetType];
  return Model.find({ _id: { $in: student[field] } });
}
