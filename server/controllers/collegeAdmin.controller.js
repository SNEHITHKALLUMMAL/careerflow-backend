import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as collegeAdminService from '../services/collegeAdmin.service.js';

export const overview = asyncHandler(async (req, res) => {
  const data = await collegeAdminService.getCollegeOverview(req.user);
  new ApiResponse(200, data).send(res);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page, limit } = req.query;
  const result = await collegeAdminService.listCollegeUsers(req.user, {
    role,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  new ApiResponse(200, result).send(res);
});

export const setUserActive = asyncHandler(async (req, res) => {
  const result = await collegeAdminService.setCollegeUserActive(
    req.user,
    req.params.id,
    req.body.isActive
  );
  new ApiResponse(200, result, 'User status updated.').send(res);
});
