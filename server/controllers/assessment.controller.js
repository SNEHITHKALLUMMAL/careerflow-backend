import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as assessmentService from '../services/assessment.service.js';

export const create = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.createAssessment(req.user, req.body);
  new ApiResponse(201, { assessment }, 'Assessment created.').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.updateAssessment(req.user, req.params.id, req.body);
  new ApiResponse(200, { assessment }, 'Assessment updated.').send(res);
});

export const publish = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.publishAssessment(req.user, req.params.id);
  new ApiResponse(200, { assessment }, 'Assessment published.').send(res);
});

export const list = asyncHandler(async (req, res) => {
  const { type, page, limit } = req.query;
  const result = await assessmentService.listAssessments(req.user, {
    type,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  new ApiResponse(200, result).send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.getAssessmentForViewing(req.user, req.params.id);
  new ApiResponse(200, { assessment }).send(res);
});

export const startAttempt = asyncHandler(async (req, res) => {
  const attempt = await assessmentService.startAttempt(req.user._id, req.params.id);
  new ApiResponse(201, { attempt }).send(res);
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await assessmentService.submitAttempt(req.user._id, req.params.id, req.body);
  new ApiResponse(200, { attempt }, 'Assessment submitted.').send(res);
});

export const gradeAttempt = asyncHandler(async (req, res) => {
  const attempt = await assessmentService.gradeCodingAnswers(
    req.user,
    req.params.id,
    req.params.attemptId,
    req.body.answers
  );
  new ApiResponse(200, { attempt }, 'Attempt graded.').send(res);
});

export const listAttempts = asyncHandler(async (req, res) => {
  const attempts = await assessmentService.listAttemptsForAssessment(req.user, req.params.id, {
    pendingOnly: req.query.pendingOnly === 'true',
  });
  new ApiResponse(200, { attempts }).send(res);
});

export const leaderboard = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const leaderboardData = await assessmentService.getLeaderboard(req.params.id, {
    limit: limit ? Number(limit) : 20,
  });
  new ApiResponse(200, { leaderboard: leaderboardData }).send(res);
});

export const result = asyncHandler(async (req, res) => {
  const data = await assessmentService.getResult(req.user, req.params.id, req.params.studentId);
  new ApiResponse(200, data).send(res);
});

export const myAttempts = asyncHandler(async (req, res) => {
  const attempts = await assessmentService.listMyAttempts(req.user._id);
  new ApiResponse(200, { attempts }).send(res);
});
