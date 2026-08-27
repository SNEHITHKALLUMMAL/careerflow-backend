import { User } from '../models/User.model.js';
import { Student } from '../models/Student.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from './activityLog.service.js';

/** superAdmin sees every college; everyone else is scoped to their own. */
function scopedCollegeId(user) {
  if (user.role === 'superAdmin') return null;
  if (!user.collegeId) throw ApiError.badRequest('Your account is not linked to a college.');
  return user.collegeId;
}

async function findMentorInScope(user, mentorId) {
  const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  const collegeId = scopedCollegeId(user);
  if (collegeId && String(mentor.collegeId) !== String(collegeId)) {
    throw ApiError.forbidden("You can't manage mentors outside your college.");
  }
  return mentor;
}

/** List mentors visible to the caller, each with how many students are currently assigned. */
export async function listMentors(user) {
  const collegeId = scopedCollegeId(user);
  const query = { role: 'mentor', ...(collegeId ? { collegeId } : {}) };

  const mentors = await User.find(query).sort({ name: 1 });
  const mentorIds = mentors.map((m) => m._id);

  const counts = await Student.aggregate([
    { $match: { mentorId: { $in: mentorIds } } },
    { $group: { _id: '$mentorId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return mentors.map((m) => ({
    id: m._id,
    name: m.name,
    email: m.email,
    collegeId: m.collegeId,
    assignedStudentCount: countMap.get(String(m._id)) || 0,
  }));
}

/**
 * Students currently assigned to a mentor.
 * `asMentorSelf` is true when a mentor is fetching their own roster — in that
 * case there's no college-scope check, since a mentor only ever sees their own id.
 */
export async function getMentorStudents(user, mentorId, { asMentorSelf = false } = {}) {
  const mentor = asMentorSelf
    ? await User.findOne({ _id: mentorId, role: 'mentor' })
    : await findMentorInScope(user, mentorId);
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  const students = await Student.find({ mentorId })
    .populate('userId', 'name email')
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 });

  return {
    mentor: { id: mentor._id, name: mentor.name, email: mentor.email },
    students: students.map((s) => ({
      studentId: s._id,
      name: s.userId?.name,
      email: s.userId?.email,
      department: s.departmentId?.name || null,
      graduationYear: s.graduationYear,
      skills: s.skills.map((sk) => sk.name),
      profileCompletionPercent: s.profileCompletionPercent,
    })),
  };
}

/** Assigns one or more students to a mentor. Both must be in the caller's college (unless superAdmin). */
export async function assignStudents(user, mentorId, studentIds) {
  const mentor = await findMentorInScope(user, mentorId);
  const collegeId = scopedCollegeId(user);

  const students = await Student.find({ _id: { $in: studentIds } });
  if (students.length !== studentIds.length) {
    throw ApiError.badRequest('One or more students were not found.');
  }
  if (collegeId) {
    const outOfScope = students.some((s) => String(s.collegeId) !== String(collegeId));
    if (outOfScope) {
      throw ApiError.forbidden("You can't assign students outside your college.");
    }
  }

  await Student.updateMany({ _id: { $in: studentIds } }, { $set: { mentorId: mentor._id } });

  await logActivity({
    type: 'mentor.assigned',
    message: `${user.name} assigned ${studentIds.length} student${studentIds.length > 1 ? 's' : ''} to mentor ${mentor.name}`,
    actor: user,
    collegeId: collegeId || mentor.collegeId,
    metadata: { mentorId: mentor._id, studentIds },
  });

  return getMentorStudents(user, mentorId);
}

/** Unassigns a single student from a mentor. */
export async function unassignStudent(user, mentorId, studentId) {
  const mentor = await findMentorInScope(user, mentorId);

  const student = await Student.findOne({ _id: studentId, mentorId });
  if (!student) {
    throw ApiError.notFound('That student is not assigned to this mentor.');
  }

  student.mentorId = null;
  await student.save();

  await logActivity({
    type: 'mentor.unassigned',
    message: `${user.name} unassigned a student from mentor ${mentor.name}`,
    actor: user,
    collegeId: student.collegeId,
    metadata: { mentorId: mentor._id, studentId },
  });
}

/**
 * Auto-assigns every currently-unassigned student (optionally filtered to one
 * department) across the given mentors, round-robin, in a single call. Useful
 * for onboarding a whole cohort at once instead of assigning one-by-one.
 */
export async function bulkAutoAssign(user, { mentorIds, departmentId } = {}) {
  if (!mentorIds || mentorIds.length === 0) {
    throw ApiError.badRequest('Select at least one mentor to distribute students across.');
  }

  const collegeId = scopedCollegeId(user);
  const mentors = await User.find({ _id: { $in: mentorIds }, role: 'mentor' });
  if (mentors.length !== mentorIds.length) {
    throw ApiError.badRequest('One or more mentors were not found.');
  }
  if (collegeId) {
    const outOfScope = mentors.some((m) => String(m.collegeId) !== String(collegeId));
    if (outOfScope) throw ApiError.forbidden("You can't assign mentors outside your college.");
  }

  const studentQuery = {
    mentorId: null,
    ...(collegeId ? { collegeId } : {}),
    ...(departmentId ? { departmentId } : {}),
  };
  const unassignedStudents = await Student.find(studentQuery).select('_id');

  if (unassignedStudents.length === 0) {
    return { assignedCount: 0, perMentor: mentors.map((m) => ({ mentorId: m._id, count: 0 })) };
  }

  // Round-robin: student i goes to mentor (i % mentors.length).
  const bulkOps = unassignedStudents.map((student, i) => ({
    updateOne: {
      filter: { _id: student._id },
      update: { $set: { mentorId: mentors[i % mentors.length]._id } },
    },
  }));
  await Student.bulkWrite(bulkOps);

  const perMentorCounts = new Map(mentors.map((m) => [String(m._id), 0]));
  unassignedStudents.forEach((_, i) => {
    const mentorId = String(mentors[i % mentors.length]._id);
    perMentorCounts.set(mentorId, perMentorCounts.get(mentorId) + 1);
  });

  await logActivity({
    type: 'mentor.bulk_assigned',
    message: `${user.name} bulk-assigned ${unassignedStudents.length} students across ${mentors.length} mentor${mentors.length > 1 ? 's' : ''}`,
    actor: user,
    collegeId,
    metadata: { mentorIds, departmentId, assignedCount: unassignedStudents.length },
  });

  return {
    assignedCount: unassignedStudents.length,
    perMentor: mentors.map((m) => ({
      mentorId: m._id,
      name: m.name,
      count: perMentorCounts.get(String(m._id)) || 0,
    })),
  };
}
