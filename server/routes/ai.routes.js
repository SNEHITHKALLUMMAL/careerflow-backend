import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  skillGapValidator,
  learningRoadmapValidator,
  chatbotValidator,
  technologyRecommendationValidator,
  interviewQuestionsValidator,
  salaryEstimationValidator,
  startMockInterviewValidator,
  continueMockInterviewValidator,
} from '../validators/ai.validator.js';

const router = Router();

router.use(authenticate, authorize('student'), aiLimiter);

router.post('/skill-gap', skillGapValidator, validate, aiController.skillGap);
router.post('/career-recommendation', aiController.careerRecommendation);
router.post('/learning-roadmap', learningRoadmapValidator, validate, aiController.learningRoadmap);
router.post('/resume-suggestions', aiController.resumeSuggestions);
router.post('/chatbot', chatbotValidator, validate, aiController.chatbot);
router.post(
  '/technology-recommendation',
  technologyRecommendationValidator,
  validate,
  aiController.technologyRecommendation
);
router.post(
  '/interview-questions',
  interviewQuestionsValidator,
  validate,
  aiController.interviewQuestions
);
router.post(
  '/salary-estimation',
  salaryEstimationValidator,
  validate,
  aiController.salaryEstimation
);
router.post(
  '/mock-interview/start',
  startMockInterviewValidator,
  validate,
  aiController.startMockInterview
);
router.post(
  '/mock-interview/answer',
  continueMockInterviewValidator,
  validate,
  aiController.continueMockInterview
);

export default router;
