import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as employabilityService from '../services/employability.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const snapshot = await employabilityService.getEmployabilitySnapshot(req.user._id);
  new ApiResponse(200, snapshot).send(res);
});
