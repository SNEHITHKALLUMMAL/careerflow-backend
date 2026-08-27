import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as collegeService from '../services/college.service.js';

export const list = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const result = await collegeService.listColleges({
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  new ApiResponse(200, result).send(res);
});

export const request = asyncHandler(async (req, res) => {
  const college = await collegeService.requestCollege(req.body);
  new ApiResponse(
    201,
    { college },
    'College request submitted. It will appear once a Super Admin approves it.'
  ).send(res);
});

export const listPending = asyncHandler(async (req, res) => {
  const colleges = await collegeService.listPendingColleges();
  new ApiResponse(200, { colleges }).send(res);
});

export const approve = asyncHandler(async (req, res) => {
  const college = await collegeService.approveCollege(req.user, req.params.id);
  new ApiResponse(200, { college }, 'College approved.').send(res);
});

export const reject = asyncHandler(async (req, res) => {
  await collegeService.rejectCollege(req.user, req.params.id);
  new ApiResponse(200, null, 'College request rejected.').send(res);
});
