import { Notification } from '../models/Notification.model.js';
import { User } from '../models/User.model.js';
import { Student } from '../models/Student.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function notifyUser(userId, { type, title, message, link = null }) {
  return Notification.create({ userId, type, title, message, link });
}

export async function notifyUsers(userIds, payload) {
  if (userIds.length === 0) return [];
  const docs = userIds.map((userId) => ({ userId, link: null, ...payload }));
  return Notification.insertMany(docs);
}

/**
 * Safe variants for the common case: notifying someone is a side effect of
 * some other action (a status change, a task assignment, an offer letter)
 * that has ALREADY succeeded by the time this runs. A failure here should
 * never make the caller think the real action failed — so it's logged and
 * swallowed instead of thrown. Use the raw notifyUser/notifyUsers above only
 * where sending the notification IS the primary action (e.g.
 * sendManualNotification below), so a real failure there is still reported.
 */
export async function notifyUserSafely(userId, payload) {
  try {
    return await notifyUser(userId, payload);
  } catch (err) {
    console.error(`Notification delivery failed (${payload?.type}):`, err.message);
    return null;
  }
}

export async function notifyUsersSafely(userIds, payload) {
  try {
    return await notifyUsers(userIds, payload);
  } catch (err) {
    console.error(`Notification delivery failed (${payload?.type}):`, err.message);
    return [];
  }
}

export async function listMyNotifications(userId, { unreadOnly = false } = {}) {
  const query = { userId };
  if (unreadOnly) query.isRead = false;
  return Notification.find(query).sort({ createdAt: -1 }).limit(100);
}

export async function markRead(userId, notificationId) {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) throw ApiError.notFound('Notification not found.');
  notification.isRead = true;
  await notification.save();
  return notification;
}

export async function markAllRead(userId) {
  await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
}

/**
 * Sends a manual notification to specific students, or broadcasts to every
 * student in a college. Non-superAdmin senders (mentor/placementOfficer/
 * collegeAdmin) are always confined to their own college — collegeId is
 * force-set to the caller's own, and any explicit userIds are filtered down
 * to students who actually belong to that college. superAdmin retains
 * unrestricted platform-wide targeting.
 */
export async function sendManualNotification(actingUser, { userIds, collegeId, title, message, link }) {
  const isSuperAdmin = actingUser.role === 'superAdmin';
  const scopedCollegeId = isSuperAdmin ? collegeId || null : actingUser.collegeId;

  if (!isSuperAdmin && !scopedCollegeId) {
    throw ApiError.badRequest('Your account is not linked to a college.');
  }

  let targetUserIds = [];

  if (userIds && userIds.length > 0) {
    if (isSuperAdmin) {
      targetUserIds = userIds;
    } else {
      // Drop any requested id that doesn't belong to a student in the
      // caller's own college — never trust client-supplied recipient ids.
      const scopedStudents = await Student.find({
        userId: { $in: userIds },
        collegeId: scopedCollegeId,
      }).select('userId');
      targetUserIds = scopedStudents.map((s) => s.userId);
    }
  }

  if (scopedCollegeId) {
    const collegeUsers = await User.find({ collegeId: scopedCollegeId, role: 'student' }).select('_id');
    targetUserIds = [...targetUserIds, ...collegeUsers.map((u) => u._id)];
  }

  if (targetUserIds.length === 0) {
    throw ApiError.badRequest('No recipients specified — provide userIds or a collegeId.');
  }

  return notifyUsers(targetUserIds, { type: 'system', title, message, link: link || null });
}
