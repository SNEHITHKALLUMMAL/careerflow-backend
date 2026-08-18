import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as applicationService from '../services/application.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const applications = await applicationService.listMyApplications(req.user._id);
  new ApiResponse(200, { applications }).send(res);
});

export const withdraw = asyncHandler(async (req, res) => {
  const application = await applicationService.withdraw(req.user._id, req.params.id);
  new ApiResponse(200, { application }, 'Application withdrawn.').send(res);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateStatus(
    req.user._id,
    req.params.id,
    req.body.status
  );
  new ApiResponse(200, { application }, 'Application status updated.').send(res);
});

export const scheduleInterview = asyncHandler(async (req, res) => {
  const application = await applicationService.scheduleInterview(
    req.user._id,
    req.params.id,
    req.body
  );
  new ApiResponse(200, { application }, 'Interview scheduled.').send(res);
});

export const issueOfferLetter = asyncHandler(async (req, res) => {
  const application = await applicationService.issueOfferLetter(
    req.user._id,
    req.params.id,
    req.body
  );
  new ApiResponse(200, { application }, 'Offer letter issued.').send(res);
});
