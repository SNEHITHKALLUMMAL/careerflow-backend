import { StudentTask } from '../models/StudentTask.model.js';
import { Student } from '../models/Student.model.js';
import { Application } from '../models/Application.model.js';
import { Job } from '../models/Job.model.js';
import { Internship } from '../models/Internship.model.js';
import { Recruiter } from '../models/Recruiter.model.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyUser } from './notification.service.js';
import { logActivity } from './activityLog.service.js';

/**
 * Verifies the caller is allowed to assign a task to this student, and
 * returns the Student doc. Scope differs by role:
 * - mentor: only their own assigned students (Student.mentorId)
 * - recruiter: only students who've applied to one of their listings
 * - superAdmin: anyone
 */
async function assertCanAssign(user, studentId) {
  const student = await Student.findById(studentId).populate('userId', 'name email');
  if (!student) throw ApiError.notFound('Student not found.');

  if (user.role === 'superAdmin') return student;

  if (user.role === 'mentor') {
    if (String(student.mentorId) !== String(user._id)) {
      throw ApiError.forbidden('You can only assign tasks to your own assigned students.');
    }
    return student;
  }

  if (user.role === 'recruiter') {
    const recruiter = await Recruiter.findOne({ userId: user._id });
    if (!recruiter) throw ApiError.forbidden('No recruiter profile found.');

    const [jobIds, internshipIds] = await Promise.all([
      Job.find({ recruiterId: recruiter._id }).distinct('_id'),
      Internship.find({ recruiterId: recruiter._id }).distinct('_id'),
    ]);
    const hasApplied = await Application.exists({
      studentId: student._id,
      targetId: { $in: [...jobIds, ...internshipIds] },
    });
    if (!hasApplied) {
      throw ApiError.forbidden('You can only assign tasks to students who applied to your listings.');
    }
    return student;
  }

  throw ApiError.forbidden('You are not allowed to assign tasks.');
}

export async function createTask(user, { studentId, title, description, dueDate }) {
  const student = await assertCanAssign(user, studentId);

  const task = await StudentTask.create({
    studentId: student._id,
    assignedById: user._id,
    assignedByRole: user.role,
    title,
    description: description || '',
    dueDate: dueDate || null,
  });

  if (student.userId?._id) {
    await notifyUser(student.userId._id, {
      type: 'task',
      title: 'New task assigned',
      message: `${user.name} assigned you a new task: "${title}"`,
      link: '/dashboard/tasks',
    });
  }

  await logActivity({
    type: 'task.created',
    message: `${user.name} (${user.role}) assigned a task to ${student.userId?.name || 'a student'}: "${title}"`,
    actor: user,
    collegeId: student.collegeId,
    metadata: { taskId: task._id, studentId: student._id },
  });

  return task;
}

/** Tasks assigned to the calling student. Cancelled tasks are hidden — they were never meant for the student to see. */
export async function listMyTasks(user) {
  const student = await Student.findOne({ userId: user._id });
  if (!student) throw ApiError.notFound('Student profile not found.');
  return StudentTask.find({ studentId: student._id, status: { $ne: 'cancelled' } }).sort({
    createdAt: -1,
  });
}

/** Tasks the calling mentor/recruiter/superAdmin has assigned (includes cancelled, so they can see their own history). */
export async function listTasksCreatedByMe(user) {
  return StudentTask.find({ assignedById: user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
}

/** Finds a task and verifies the caller created it (or is superAdmin). */
async function findOwnedTask(user, taskId) {
  const task = await StudentTask.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found.');
  if (user.role !== 'superAdmin' && String(task.assignedById) !== String(user._id)) {
    throw ApiError.forbidden('You can only edit or cancel tasks you assigned.');
  }
  return task;
}

/** Edits a pending task's title/description/due date. The assigner (or superAdmin) only; completed/cancelled tasks can't be edited. */
export async function updateTask(user, taskId, { title, description, dueDate }) {
  const task = await findOwnedTask(user, taskId);
  if (task.status !== 'pending') {
    throw ApiError.badRequest('Only pending tasks can be edited.');
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  await task.save();

  return task;
}

/** Cancels a task — a soft delete so the assigner's history stays intact, but it disappears from the student's list. */
export async function cancelTask(user, taskId) {
  const task = await findOwnedTask(user, taskId);
  if (task.status === 'completed') {
    throw ApiError.badRequest('A completed task cannot be cancelled.');
  }

  task.status = 'cancelled';
  await task.save();

  await logActivity({
    type: 'task.cancelled',
    message: `${user.name} cancelled the task "${task.title}"`,
    actor: user,
    metadata: { taskId: task._id },
  });

  return task;
}

export async function markComplete(user, taskId) {
  const student = await Student.findOne({ userId: user._id });
  if (!student) throw ApiError.notFound('Student profile not found.');

  const task = await StudentTask.findOne({ _id: taskId, studentId: student._id });
  if (!task) throw ApiError.notFound('Task not found.');

  task.status = 'completed';
  task.completedAt = new Date();
  await task.save();

  await logActivity({
    type: 'task.completed',
    message: `${user.name} completed the task "${task.title}"`,
    actor: user,
    collegeId: student.collegeId,
    metadata: { taskId: task._id },
  });

  return task;
}
