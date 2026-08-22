import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as internshipService from '../services/internship.service.js';
import * as applicationService from '../services/application.service.js';

export const create = asyncHandler(async (req, res) => {
  const internship = await internshipService.createInternship(req.user._id, req.body);
  new ApiResponse(201, { internship }, 'Internship posted.').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const internship = await internshipService.updateInternship(
    req.user._id,
    req.params.id,
    req.body
  );
  new ApiResponse(200, { internship }, 'Internship updated.').send(res);
});

export const changeStatus = asyncHandler(async (req, res) => {
  const internship = await internshipService.changeInternshipStatus(
    req.user._id,
    req.params.id,
    req.body.status
  );
  new ApiResponse(200, { internship }, 'Internship status updated.').send(res);
});

export const list = asyncHandler(async (req, res) => {
  const result = await internshipService.listInternships(req.user, req.query);
  new ApiResponse(200, result).send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const internship = await internshipService.getInternship(req.params.id);
  new ApiResponse(200, { internship }).send(res);
});

export const bookmark = asyncHandler(async (req, res) => {
  await applicationService.toggleBookmark(req.user._id, 'internship', req.params.id, 'add');
  new ApiResponse(200, null, 'Internship bookmarked.').send(res);
});

export const unbookmark = asyncHandler(async (req, res) => {
  await applicationService.toggleBookmark(req.user._id, 'internship', req.params.id, 'remove');
  new ApiResponse(200, null, 'Bookmark removed.').send(res);
});

export const listBookmarked = asyncHandler(async (req, res) => {
  const internships = await applicationService.listBookmarked(req.user._id, 'internship');
  new ApiResponse(200, { internships }).send(res);
});

export const apply = asyncHandler(async (req, res) => {
  const application = await applicationService.apply(req.user._id, 'internship', req.params.id);
  new ApiResponse(201, { application }, 'Application submitted.').send(res);
});

export const listApplicants = asyncHandler(async (req, res) => {
  const applications = await applicationService.listApplicantsForListing(
    req.user._id,
    'internship',
    req.params.id
  );
  new ApiResponse(200, { applications }).send(res);
});
