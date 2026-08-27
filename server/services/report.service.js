import { Report, REPORT_SCOPES } from '../models/Report.model.js';
import { ApiError } from '../utils/ApiError.js';
import { subDays } from '../utils/dateWindow.js';
import { getEmployabilitySnapshot } from './employability.service.js';
import { getPlacementAnalytics } from './placementAnalytics.service.js';

const STUDENT_SCOPE_WINDOW_DAYS = { student_weekly: 7, student_monthly: 30 };

/**
 * Reports are generated on-demand, not on a schedule — this environment has no cron/
 * task-queue infrastructure. A real deployment would call `POST /reports/generate`
 * periodically (e.g. a scheduled job on Render, or an external cron hitting the
 * endpoint) to build up a real history; calling it more than once within the same
 * period just creates another snapshot; nothing here assumes exactly-weekly cadence.
 */
export async function generateReport(user, scope) {
  if (!REPORT_SCOPES.includes(scope)) {
    throw ApiError.badRequest(`scope must be one of: ${REPORT_SCOPES.join(', ')}`);
  }

  const now = new Date();

  if (scope === 'student_weekly' || scope === 'student_monthly') {
    if (user.role !== 'student') {
      throw ApiError.forbidden('Only students can generate a student report.');
    }
    const data = await getEmployabilitySnapshot(user._id);
    return Report.create({
      scope,
      ownerId: user._id,
      data,
      periodStart: subDays(STUDENT_SCOPE_WINDOW_DAYS[scope], now),
      periodEnd: now,
    });
  }

  // scope === 'college'
  if (!['placementOfficer', 'superAdmin'].includes(user.role)) {
    throw ApiError.forbidden(
      'Only a placement officer or Super Admin can generate a college report.'
    );
  }
  const data = await getPlacementAnalytics(user);
  return Report.create({
    scope,
    ownerId: user._id,
    collegeId: user.collegeId || null,
    data,
    periodStart: subDays(30, now),
    periodEnd: now,
  });
}

export async function listMyReports(userId) {
  return Report.find({ ownerId: userId }).sort({ generatedAt: -1 }).limit(20);
}
