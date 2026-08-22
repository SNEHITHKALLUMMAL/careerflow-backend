import { Student } from '../models/Student.model.js';
import { Resume } from '../models/Resume.model.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.model.js';
import { Application } from '../models/Application.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
  computeEmployabilityScore,
  getReadinessLevel,
  computeSkillGap,
} from './employabilityScoring.service.js';
import { getMarketDemandSkills } from './skillDemand.service.js';

async function getOwnedStudent(userId) {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.forbidden('No student profile found.');
  return student;
}

/**
 * Computes (and persists) the student's employability score from real signals across
 * every module that now exists: profile completion (Student), resume ATS score
 * (Resume), assessment performance (Assessment), and application activity
 * (Recruiter/Applications). This replaces the placeholder left in the Student module
 * (Phase 9), which deliberately deferred this calculation until these pieces existed.
 */
export async function getEmployabilitySnapshot(userId) {
  const student = await getOwnedStudent(userId);

  let resumeAtsScore = null;
  if (student.resumeId) {
    const resume = await Resume.findById(student.resumeId).select('atsScore');
    resumeAtsScore = resume?.atsScore ?? null;
  }

  const gradedAttempts = await AssessmentAttempt.find({
    studentId: student._id,
    status: 'graded',
  }).select('percentage');
  const assessmentAveragePercent = gradedAttempts.length
    ? Math.round(gradedAttempts.reduce((sum, a) => sum + a.percentage, 0) / gradedAttempts.length)
    : null;

  const applicationCount = await Application.countDocuments({ studentId: student._id });

  const score = computeEmployabilityScore({
    profileCompletionPercent: student.profileCompletionPercent,
    resumeAtsScore,
    assessmentAveragePercent,
    applicationCount,
  });

  student.employabilityScore = score;
  await student.save();

  const marketDemand = await getMarketDemandSkills();
  const skillGap = computeSkillGap(
    student.skills.map((s) => s.name),
    marketDemand
  );

  return {
    score,
    readiness: getReadinessLevel(score),
    breakdown: {
      profileCompletionPercent: student.profileCompletionPercent,
      resumeAtsScore,
      assessmentAveragePercent,
      applicationCount,
    },
    skillGap,
  };
}
