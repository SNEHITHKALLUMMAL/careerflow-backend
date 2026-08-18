import { Router } from 'express';
import { query } from 'express-validator';
import * as collegeController from '../controllers/college.controller.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get(
  '/',
  [
    query('search').optional().trim().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  collegeController.list
);

export default router;
