import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as adminService from '../services/admin.service.js';

export const stats = asyncHandler(async (req, res) => {
  const data = await adminService.getPlatformStats();
  new ApiResponse(200, data).send(res);
});

export const activity = asyncHandler(async (req, res) => {
  const { limit, type, collegeId, sort } = req.query;
  const entries = await adminService.getRecentActivity({
    limit: limit ? Number(limit) : 20,
    type,
    collegeId,
    sort,
  });
  new ApiResponse(200, { entries }).send(res);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page, limit } = req.query;
  const result = await adminService.listUsers({
    role,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  new ApiResponse(200, result).send(res);
});

export const setUserActive = asyncHandler(async (req, res) => {
  const result = await adminService.setUserActive(req.user, req.params.id, req.body.isActive);
  new ApiResponse(200, result, 'User status updated.').send(res);
});

export const changeRole = asyncHandler(async (req, res) => {
  const result = await adminService.changeUserRole(
    req.user,
    req.params.id,
    req.body.role,
    req.body.collegeId
  );
  new ApiResponse(200, result, 'User role updated.').send(res);
});
