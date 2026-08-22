import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import collegeRoutes from './college.routes.js';
import aiRoutes from './ai.routes.js';
import resumeRoutes from './resume.routes.js';
import assessmentRoutes from './assessment.routes.js';
import certificateRoutes from './certificate.routes.js';
import recruiterRoutes from './recruiter.routes.js';
import jobRoutes from './job.routes.js';
import internshipRoutes from './internship.routes.js';
import applicationRoutes from './application.routes.js';
import notificationRoutes from './notification.routes.js';
import driveRoutes from './drive.routes.js';
import placementRoutes from './placement.routes.js';
import employabilityRoutes from './employability.routes.js';
import reportRoutes from './report.routes.js';
import mentorRoutes from './mentor.routes.js';
import adminRoutes from './admin.routes.js';
import studentTaskRoutes from './studentTask.routes.js';
import departmentRoutes from './department.routes.js';

const router = Router();

/**
 * Each module's routes are mounted here as they're built out in later
 * phases (auth, students, jobs, ...). Keeping this file as the single
 * place routes are wired keeps app.js free of per-module knowledge.
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/colleges', collegeRoutes);
router.use('/ai', aiRoutes);
router.use('/resumes', resumeRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/certificates', certificateRoutes);
router.use('/recruiters', recruiterRoutes);
router.use('/jobs', jobRoutes);
router.use('/internships', internshipRoutes);
router.use('/applications', applicationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/drives', driveRoutes);
router.use('/placement', placementRoutes);
router.use('/employability', employabilityRoutes);
router.use('/reports', reportRoutes);
router.use('/mentors', mentorRoutes);
router.use('/admin', adminRoutes);
router.use('/tasks', studentTaskRoutes);
router.use('/departments', departmentRoutes);

export default router;
