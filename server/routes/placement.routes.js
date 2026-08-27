import { Router } from 'express';
import * as placementController from '../controllers/placement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Genuinely college-scoped analytics — safe for collegeAdmin, since the
// underlying services scope every query to the caller's own college.
router.get('/analytics', authorize('placementOfficer', 'collegeAdmin', 'superAdmin'), placementController.analytics);
router.get('/students', authorize('placementOfficer', 'collegeAdmin', 'superAdmin'), placementController.studentAnalytics);
router.get('/career-analytics', authorize('placementOfficer', 'collegeAdmin', 'superAdmin'), placementController.careerAnalytics);

// Recruiters are NOT college-scoped entities (no collegeId on Recruiter at
// all) — this lists every recruiter on the platform. Deliberately excluded
// from collegeAdmin, which should never see cross-college/platform-wide data.
router.get('/recruiters', authorize('placementOfficer', 'superAdmin'), placementController.recruiters);

export default router;
