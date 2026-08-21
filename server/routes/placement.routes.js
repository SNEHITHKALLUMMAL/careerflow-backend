import { Router } from 'express';
import * as placementController from '../controllers/placement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, authorize('placementOfficer', 'superAdmin'));

router.get('/analytics', placementController.analytics);
router.get('/students', placementController.studentAnalytics);
router.get('/recruiters', placementController.recruiters);
router.get('/career-analytics', placementController.careerAnalytics);

export default router;
