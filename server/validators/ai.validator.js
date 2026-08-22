import { body } from 'express-validator';

export const skillGapValidator = [
  body('targetRole').trim().notEmpty().withMessage('targetRole is required').isLength({ max: 150 }),
];

export const learningRoadmapValidator = [
  body('goal').trim().notEmpty().withMessage('goal is required').isLength({ max: 200 }),
];

export const chatbotValidator = [
  body('message').trim().notEmpty().withMessage('message is required').isLength({ max: 2000 }),
  body('chatId').optional().isMongoId().withMessage('Invalid chatId'),
];

export const technologyRecommendationValidator = [
  body('interest').trim().notEmpty().withMessage('interest is required').isLength({ max: 150 }),
];

export const interviewQuestionsValidator = [
  body('targetRole').trim().notEmpty().withMessage('targetRole is required').isLength({ max: 150 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
];

export const salaryEstimationValidator = [
  body('role').trim().notEmpty().withMessage('role is required').isLength({ max: 150 }),
  body('location').trim().notEmpty().withMessage('location is required').isLength({ max: 150 }),
  body('experienceYears').optional().isInt({ min: 0, max: 50 }).toInt(),
];

export const startMockInterviewValidator = [
  body('targetRole').trim().notEmpty().withMessage('targetRole is required').isLength({ max: 150 }),
];

export const continueMockInterviewValidator = [
  body('chatId').isMongoId().withMessage('A valid chatId is required'),
  body('answer').trim().notEmpty().withMessage('answer is required').isLength({ max: 3000 }),
];
