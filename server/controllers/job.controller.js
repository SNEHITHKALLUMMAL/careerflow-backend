import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as jobService from '../services/job.service.js';
import * as applicationService from '../services/application.service.js';

export const create = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.user._id, req.body);
  new ApiResponse(201, { job }, 'Job posted.').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.user._id, req.params.id, req.body);
  new ApiResponse(200, { job }, 'Job updated.').send(res);
});

export const changeStatus = asyncHandler(async (req, res) => {
  const job = await jobService.changeJobStatus(req.user._id, req.params.id, req.body.status);
  new ApiResponse(200, { job }, 'Job status updated.').send(res);
});

export const list = asyncHandler(async (req, res) => {
  const result = await jobService.listJobs(req.user, req.query);
  new ApiResponse(200, result).send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const job = await jobService.getJob(req.params.id);
  new ApiResponse(200, { job }).send(res);
});

export const bookmark = asyncHandler(async (req, res) => {
  await applicationService.toggleBookmark(req.user._id, 'job', req.params.id, 'add');
  new ApiResponse(200, null, 'Job bookmarked.').send(res);
});

export const unbookmark = asyncHandler(async (req, res) => {
  await applicationService.toggleBookmark(req.user._id, 'job', req.params.id, 'remove');
  new ApiResponse(200, null, 'Bookmark removed.').send(res);
});

export const listBookmarked = asyncHandler(async (req, res) => {
  const jobs = await applicationService.listBookmarked(req.user._id, 'job');
  new ApiResponse(200, { jobs }).send(res);
});

export const apply = asyncHandler(async (req, res) => {
  const application = await applicationService.apply(req.user._id, 'job', req.params.id);
  new ApiResponse(201, { application }, 'Application submitted.').send(res);
});

export const listApplicants = asyncHandler(async (req, res) => {
  const applications = await applicationService.listApplicantsForListing(
    req.user._id,
    'job',
    req.params.id
  );
  new ApiResponse(200, { applications }).send(res);
});
