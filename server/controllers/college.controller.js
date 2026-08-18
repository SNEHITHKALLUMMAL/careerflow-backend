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
