import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { generateReportValidator } from '../validators/report.validator.js';

const router = Router();

router.use(authenticate);

// Authorization is scope-dependent (student vs placement/admin) and enforced inside the
// service, since a single 'generate' action serves multiple roles differently.
router.post('/generate', generateReportValidator, validate, reportController.generate);
router.get('/me', reportController.listMine);

export default router;
