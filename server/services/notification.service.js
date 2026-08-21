import { Notification } from '../models/Notification.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function notifyUser(userId, { type, title, message, link = null }) {
  return Notification.create({ userId, type, title, message, link });
}

export async function notifyUsers(userIds, payload) {
  if (userIds.length === 0) return [];
  const docs = userIds.map((userId) => ({ userId, link: null, ...payload }));
  return Notification.insertMany(docs);
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

/** Sends a manual notification to a specific student, or broadcasts to every student in a college. */
export async function sendManualNotification({ userIds, collegeId, title, message, link }) {
  let targetUserIds = userIds || [];

  if (collegeId) {
    const collegeUsers = await User.find({ collegeId, role: 'student' }).select('_id');
    targetUserIds = [...targetUserIds, ...collegeUsers.map((u) => u._id)];
  }

  if (targetUserIds.length === 0) {
    throw ApiError.badRequest('No recipients specified — provide userIds or a collegeId.');
  }

  return notifyUsers(targetUserIds, { type: 'system', title, message, link: link || null });
}
