import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listMyNotifications(req.user._id, {
    unreadOnly: req.query.unreadOnly === 'true',
  });
  new ApiResponse(200, { notifications }).send(res);
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.params.id);
  new ApiResponse(200, { notification }).send(res);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  new ApiResponse(200, null, 'All notifications marked as read.').send(res);
});

export const send = asyncHandler(async (req, res) => {
  const notifications = await notificationService.sendManualNotification(req.user, req.body);
  new ApiResponse(201, { count: notifications.length }, 'Notification sent.').send(res);
});
