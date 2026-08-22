import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as placementService from '../services/placementAnalytics.service.js';

export const analytics = asyncHandler(async (req, res) => {
  const data = await placementService.getPlacementAnalytics(req.user);
  new ApiResponse(200, data).send(res);
});

export const studentAnalytics = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await placementService.listStudentAnalytics(req.user, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  new ApiResponse(200, result).send(res);
});

export const recruiters = asyncHandler(async (req, res) => {
  const data = await placementService.listRecruitersForPlacement();
  new ApiResponse(200, { recruiters: data }).send(res);
});

export const careerAnalytics = asyncHandler(async (req, res) => {
  const data = await placementService.getCareerAnalytics(req.user);
  new ApiResponse(200, data).send(res);
});
