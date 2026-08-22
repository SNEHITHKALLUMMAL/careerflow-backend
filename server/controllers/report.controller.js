import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as reportService from '../services/report.service.js';

export const generate = asyncHandler(async (req, res) => {
  const report = await reportService.generateReport(req.user, req.body.scope);
  new ApiResponse(201, { report }, 'Report generated.').send(res);
});

export const listMine = asyncHandler(async (req, res) => {
  const reports = await reportService.listMyReports(req.user._id);
  new ApiResponse(200, { reports }).send(res);
});
