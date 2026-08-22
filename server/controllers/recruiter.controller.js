import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as recruiterService from '../services/recruiter.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const recruiter = await recruiterService.getOrCreateProfile(req.user._id);
  new ApiResponse(200, { recruiter }).send(res);
});

export const updateMe = asyncHandler(async (req, res) => {
  const recruiter = await recruiterService.updateProfile(req.user._id, req.body);
  new ApiResponse(200, { recruiter }, 'Profile updated.').send(res);
});

export const verify = asyncHandler(async (req, res) => {
  const recruiter = await recruiterService.verifyRecruiter(req.params.id);
  new ApiResponse(200, { recruiter }, 'Recruiter verified.').send(res);
});
