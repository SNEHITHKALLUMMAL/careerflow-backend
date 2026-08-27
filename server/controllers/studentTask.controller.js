import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as taskService from '../services/studentTask.service.js';

export const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user, req.body);
  new ApiResponse(201, { task }, 'Task assigned successfully.').send(res);
});

export const listMine = asyncHandler(async (req, res) => {
  const tasks = await taskService.listMyTasks(req.user);
  new ApiResponse(200, { tasks }).send(res);
});

export const listCreated = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasksCreatedByMe(req.user);
  new ApiResponse(200, { tasks }).send(res);
});

export const complete = asyncHandler(async (req, res) => {
  const task = await taskService.markComplete(req.user, req.params.id);
  new ApiResponse(200, { task }, 'Task marked complete.').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user, req.params.id, req.body);
  new ApiResponse(200, { task }, 'Task updated.').send(res);
});

export const cancel = asyncHandler(async (req, res) => {
  const task = await taskService.cancelTask(req.user, req.params.id);
  new ApiResponse(200, { task }, 'Task cancelled.').send(res);
});
