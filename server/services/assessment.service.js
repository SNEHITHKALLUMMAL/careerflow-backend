import { Assessment, ASSESSMENT_CREATOR_ROLES } from '../models/Assessment.model.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.model.js';
import { Certificate } from '../models/Certificate.model.js';
import { Student } from '../models/Student.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { generateCertificatePdfBuffer } from './certificatePdf.service.js';
import { gradeAnswers, computeOutcome, applyManualGrading } from './assessmentGrading.service.js';

function isPrivilegedRole(role) {
  return ASSESSMENT_CREATOR_ROLES.includes(role);
}

async function getOwnedStudent(userId) {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.forbidden('No student profile found.');
  return student;
}

function assertCanManage(user, assessment) {
  if (user.role === 'superAdmin') return;
  if (String(assessment.createdBy) === String(user._id)) return;
  throw ApiError.forbidden('You do not have permission to manage this assessment.');
}

export async function createAssessment(userId, data) {
  return Assessment.create({ ...data, createdBy: userId });
}

export async function updateAssessment(user, assessmentId, updates) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw ApiError.notFound('Assessment not found.');
  assertCanManage(user, assessment);

  const allowed = ['title', 'description', 'questions', 'durationMinutes', 'passingScore'];
  for (const key of allowed) {
    if (updates[key] !== undefined) assessment[key] = updates[key];
  }
  await assessment.save();
  return assessment;
}

export async function publishAssessment(user, assessmentId) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw ApiError.notFound('Assessment not found.');
  assertCanManage(user, assessment);

  if (assessment.questions.length === 0) {
    throw ApiError.badRequest('Add at least one question before publishing.');
  }

  assessment.isPublished = true;
  await assessment.save();
  return assessment;
}

export async function listAssessments(user, { type, page = 1, limit = 20 } = {}) {
  const query = {};
  if (type) query.type = type;

  if (user.role === 'student') {
    query.isPublished = true;
  } else if (user.role !== 'superAdmin') {
    query.createdBy = user._id;
  }

  const skip = (page - 1) * limit;
  const [assessments, total] = await Promise.all([
    Assessment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Assessment.countDocuments(query),
  ]);

  return {
    assessments,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getAssessmentForViewing(user, assessmentId) {
  const privileged = isPrivilegedRole(user.role);
  let query = Assessment.findById(assessmentId);
  if (privileged) {
    query = query.select('+questions.correctAnswer +questions.testCases.expectedOutput');
  }
  const assessment = await query;
  if (!assessment) throw ApiError.notFound('Assessment not found.');

  if (user.role === 'student' && !assessment.isPublished) {
    throw ApiError.forbidden('This assessment is not available.');
  }

  return assessment;
}

export async function startAttempt(userId, assessmentId) {
  const student = await getOwnedStudent(userId);
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.isPublished) {
    throw ApiError.notFound('Assessment not found.');
  }

  const existing = await AssessmentAttempt.findOne({ assessmentId, studentId: student._id });
  if (existing) {
    if (existing.status !== 'in_progress') {
      throw ApiError.conflict('You have already attempted this assessment.');
    }
    return existing; // resume an in-progress attempt
  }

  const maxScore = assessment.questions.reduce((sum, q) => sum + q.marks, 0);
  return AssessmentAttempt.create({
    assessmentId,
    studentId: student._id,
    maxScore,
    status: 'in_progress',
  });
}

async function issueCertificateIfNeeded(attempt, assessment, student) {
  const existing = await Certificate.findOne({ assessmentAttemptId: attempt._id });
  if (existing) return existing;

  const user = await User.findById(student.userId);
  const pdfBuffer = await generateCertificatePdfBuffer({
    studentName: user.name,
    assessmentTitle: assessment.title,
    percentage: attempt.percentage,
    date: attempt.submittedAt,
  });

  const uploadResult = await uploadBufferToCloudinary(pdfBuffer, {
    folder: 'careerflow/certificates',
    resource_type: 'raw',
    format: 'pdf',
    public_id: `cert-${attempt._id}`,
  });

  const certificate = await Certificate.create({
    studentId: student._id,
    assessmentAttemptId: attempt._id,
    title: `${assessment.title} — Certificate of Completion`,
    certificateUrl: uploadResult.secure_url,
  });

  attempt.certificateId = certificate._id;
  await attempt.save();

  return certificate;
}

export async function submitAttempt(userId, assessmentId, { answers }) {
  const student = await getOwnedStudent(userId);
  const attempt = await AssessmentAttempt.findOne({ assessmentId, studentId: student._id });
  if (!attempt) throw ApiError.badRequest('Start the assessment before submitting.');
  if (attempt.status !== 'in_progress') {
    throw ApiError.conflict('This attempt has already been submitted.');
  }

  const assessment = await Assessment.findById(assessmentId).select(
    '+questions.correctAnswer +questions.testCases.expectedOutput'
  );
  if (!assessment) throw ApiError.notFound('Assessment not found.');

  let gradedAnswers, totalScore, maxScore, hasPendingManualGrading;
  try {
    ({ gradedAnswers, totalScore, maxScore, hasPendingManualGrading } = gradeAnswers(
      assessment.questions,
      answers,
      assessment.type
    ));
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }

  const { percentage, passed } = computeOutcome(totalScore, maxScore, assessment.passingScore);

  attempt.answers = gradedAnswers;
  attempt.totalScore = totalScore;
  attempt.maxScore = maxScore;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.hasPendingManualGrading = hasPendingManualGrading;
  attempt.status = hasPendingManualGrading ? 'submitted' : 'graded';
  attempt.submittedAt = new Date();
  await attempt.save();

  if (!hasPendingManualGrading && passed) {
    await issueCertificateIfNeeded(attempt, assessment, student);
  }

  return attempt;
}

export async function gradeCodingAnswers(user, assessmentId, attemptId, gradedItems) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw ApiError.notFound('Assessment not found.');
  assertCanManage(user, assessment);

  const attempt = await AssessmentAttempt.findOne({ _id: attemptId, assessmentId });
  if (!attempt) throw ApiError.notFound('Attempt not found.');

  const { totalScore } = applyManualGrading(attempt.answers, assessment.questions, gradedItems);
  const { percentage, passed } = computeOutcome(
    totalScore,
    attempt.maxScore,
    assessment.passingScore
  );

  attempt.totalScore = totalScore;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.status = 'graded';
  attempt.hasPendingManualGrading = false;
  await attempt.save();

  if (attempt.passed) {
    const student = await Student.findById(attempt.studentId);
    await issueCertificateIfNeeded(attempt, assessment, student);
  }

  return attempt;
}

export async function getLeaderboard(assessmentId, { limit = 20 } = {}) {
  const attempts = await AssessmentAttempt.find({
    assessmentId,
    status: { $in: ['submitted', 'graded'] },
  })
    .sort({ totalScore: -1, submittedAt: 1 })
    .limit(limit)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } });

  return attempts.map((attempt, index) => ({
    rank: index + 1,
    studentName: attempt.studentId?.userId?.name || 'Unknown',
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    passed: attempt.passed,
  }));
}

export async function getResult(requestingUser, assessmentId, studentId) {
  const attempt = await AssessmentAttempt.findOne({ assessmentId, studentId });
  if (!attempt) throw ApiError.notFound('No attempt found for this student.');

  const isPrivileged = isPrivilegedRole(requestingUser.role);
  let isOwner = false;
  if (requestingUser.role === 'student') {
    const requestingStudent = await Student.findOne({ userId: requestingUser._id }).select('_id');
    isOwner = requestingStudent && String(requestingStudent._id) === String(studentId);
  }

  if (!isOwner && !isPrivileged) {
    throw ApiError.forbidden('You cannot view this result.');
  }

  if (attempt.status === 'in_progress') {
    throw ApiError.badRequest('This assessment has not been submitted yet.');
  }

  const assessment = await Assessment.findById(assessmentId).select(
    '+questions.correctAnswer +questions.testCases.expectedOutput'
  );

  const breakdown = attempt.answers.map((answer) => {
    const question = assessment.questions.id(answer.questionId);
    return {
      questionText: question?.questionText,
      response: answer.response,
      correctAnswer: assessment.type === 'coding' ? null : question?.correctAnswer,
      isCorrect: answer.isCorrect,
      marksAwarded: answer.marksAwarded,
      maxMarks: question?.marks,
    };
  });

  return {
    assessmentTitle: assessment.title,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    passed: attempt.passed,
    status: attempt.status,
    breakdown,
  };
}

export async function listMyAttempts(userId) {
  const student = await getOwnedStudent(userId);
  return AssessmentAttempt.find({ studentId: student._id })
    .sort({ createdAt: -1 })
    .populate('assessmentId', 'title type passingScore');
}
