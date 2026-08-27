import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as aiService from '../services/ai.service.js';

export const skillGap = asyncHandler(async (req, res) => {
  const result = await aiService.skillGapAnalysis(req.user._id, req.body.targetRole);
  new ApiResponse(200, result).send(res);
});

export const careerRecommendation = asyncHandler(async (req, res) => {
  const result = await aiService.careerRecommendation(req.user._id);
  new ApiResponse(200, result).send(res);
});

export const learningRoadmap = asyncHandler(async (req, res) => {
  const result = await aiService.learningRoadmap(req.user._id, req.body.goal);
  new ApiResponse(200, result).send(res);
});

export const resumeSuggestions = asyncHandler(async (req, res) => {
  const result = await aiService.resumeSuggestions(req.user._id);
  new ApiResponse(200, result).send(res);
});

export const chatbot = asyncHandler(async (req, res) => {
  const result = await aiService.careerChatbot(req.user._id, req.body);
  new ApiResponse(200, result).send(res);
});

export const technologyRecommendation = asyncHandler(async (req, res) => {
  const result = await aiService.technologyRecommendation(req.user._id, req.body.interest);
  new ApiResponse(200, result).send(res);
});

export const interviewQuestions = asyncHandler(async (req, res) => {
  const { targetRole, difficulty } = req.body;
  const result = await aiService.interviewQuestions(req.user._id, targetRole, difficulty);
  new ApiResponse(200, result).send(res);
});

export const salaryEstimation = asyncHandler(async (req, res) => {
  const result = await aiService.salaryEstimation(req.user._id, req.body);
  new ApiResponse(200, result).send(res);
});

export const startMockInterview = asyncHandler(async (req, res) => {
  const result = await aiService.startMockInterview(req.user._id, req.body.targetRole);
  new ApiResponse(201, result).send(res);
});

export const continueMockInterview = asyncHandler(async (req, res) => {
  const result = await aiService.continueMockInterview(req.user._id, req.body);
  new ApiResponse(200, result).send(res);
});
