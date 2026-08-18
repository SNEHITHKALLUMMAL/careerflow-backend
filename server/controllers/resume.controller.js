import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as resumeService from '../services/resume.service.js';
import * as resumeBuilderService from '../services/resumeBuilder.service.js';

export const history = asyncHandler(async (req, res) => {
  const resumes = await resumeService.listHistory(req.user._id);
  new ApiResponse(200, { resumes }).send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(req.user._id, req.params.id);
  new ApiResponse(200, { resume }).send(res);
});

export const atsScore = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(req.user._id, req.params.id);
  new ApiResponse(200, {
    atsScore: resume.atsScore,
    grammarSuggestions: resume.grammarSuggestions,
    keywordSuggestions: resume.keywordSuggestions,
  }).send(res);
});

export const download = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(req.user._id, req.params.id);
  res.redirect(resume.fileUrl);
});

export const build = asyncHandler(async (req, res) => {
  const resume = await resumeBuilderService.buildResume(req.user._id, req.body);
  new ApiResponse(201, { resume }, 'Resume built successfully.').send(res);
});

export const rebuild = asyncHandler(async (req, res) => {
  const resume = await resumeBuilderService.rebuildResume(req.user._id, req.params.id, req.body);
  new ApiResponse(201, { resume }, 'Resume rebuilt successfully.').send(res);
});
