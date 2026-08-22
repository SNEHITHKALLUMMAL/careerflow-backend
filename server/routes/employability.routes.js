import { Router } from 'express';
import * as employabilityController from '../controllers/employability.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, authorize('student'));

router.get('/me', employabilityController.getMe);

export default router;
