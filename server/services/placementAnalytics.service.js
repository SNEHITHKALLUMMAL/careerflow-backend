import { Student } from '../models/Student.model.js';
import { Application } from '../models/Application.model.js';
import { Drive } from '../models/Drive.model.js';
import { Recruiter } from '../models/Recruiter.model.js';
import { Job } from '../models/Job.model.js';
import { Internship } from '../models/Internship.model.js';
import { AIUsageLog } from '../models/AIUsageLog.model.js';
import { ApiError } from '../utils/ApiError.js';
import { getMarketDemandSkills } from './skillDemand.service.js';

function scopedCollegeId(user) {
  if (user.role === 'superAdmin') return null;
  if (!user.collegeId) throw ApiError.badRequest('Your account is not linked to a college.');
  return user.collegeId;
}

export async function getPlacementAnalytics(user) {
  const collegeId = scopedCollegeId(user);
  const studentQuery = collegeId ? { collegeId } : {};

  const totalStudents = await Student.countDocuments(studentQuery);
  const studentIds = await Student.find(studentQuery).distinct('_id');

  const statusBreakdown = await Application.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const applicationsByStatus = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));
  const placedCount = applicationsByStatus.offered || 0;
  const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;

  const driveQuery = collegeId ? { collegeId } : {};
  const totalDrives = await Drive.countDocuments(driveQuery);

  return {
    totalStudents,
    placedCount,
    placementRate,
    totalDrives,
    totalApplications: Object.values(applicationsByStatus).reduce((sum, n) => sum + n, 0),
    applicationsByStatus,
  };
}

export async function listStudentAnalytics(user, { page = 1, limit = 20 } = {}) {
  const collegeId = scopedCollegeId(user);
  const query = collegeId ? { collegeId } : {};
  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate('userId', 'name email')
      .sort({ profileCompletionPercent: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(query),
  ]);

  const studentIds = students.map((s) => s._id);
  const applicationCounts = await Application.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $group: { _id: '$studentId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(applicationCounts.map((a) => [String(a._id), a.count]));

  const items = students.map((s) => ({
    studentId: s._id,
    name: s.userId?.name,
    email: s.userId?.email,
    profileCompletionPercent: s.profileCompletionPercent,
    hasResume: Boolean(s.resumeId),
    applicationCount: countMap.get(String(s._id)) || 0,
  }));

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function listRecruitersForPlacement() {
  const recruiters = await Recruiter.find({})
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  const recruiterIds = recruiters.map((r) => r._id);

  const [jobCounts, internshipCounts] = await Promise.all([
    Job.aggregate([
      { $match: { recruiterId: { $in: recruiterIds } } },
      { $group: { _id: '$recruiterId', count: { $sum: 1 } } },
    ]),
    Internship.aggregate([
      { $match: { recruiterId: { $in: recruiterIds } } },
      { $group: { _id: '$recruiterId', count: { $sum: 1 } } },
    ]),
  ]);

  const jobCountMap = new Map(jobCounts.map((j) => [String(j._id), j.count]));
  const internshipCountMap = new Map(internshipCounts.map((i) => [String(i._id), i.count]));

  return recruiters.map((r) => ({
    recruiterId: r._id,
    companyName: r.companyName,
    contactName: r.userId?.name,
    contactEmail: r.userId?.email,
    isVerified: r.isVerified,
    jobCount: jobCountMap.get(String(r._id)) || 0,
    internshipCount: internshipCountMap.get(String(r._id)) || 0,
  }));
}

export async function getCareerAnalytics(user) {
  const collegeId = scopedCollegeId(user);
  const studentQuery = collegeId ? { collegeId } : {};

  const interestAgg = await Student.aggregate([
    { $match: studentQuery },
    { $unwind: '$careerInterests' },
    { $group: { _id: { $toLower: '$careerInterests' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const aiUsageAgg = await AIUsageLog.aggregate([
    { $group: { _id: '$feature', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const topDemandSkills = await getMarketDemandSkills();

  return {
    topCareerInterests: interestAgg.map((i) => ({ interest: i._id, count: i.count })),
    aiFeatureUsage: aiUsageAgg.map((a) => ({ feature: a._id, count: a.count })),
    topDemandSkills: topDemandSkills.slice(0, 10),
  };
}
