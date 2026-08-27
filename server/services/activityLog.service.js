import { ActivityLog } from '../models/ActivityLog.model.js';

/**
 * Records an activity log entry. Fire-and-forget by design — logging should
 * never be able to fail the action it's describing, so callers `await` it
 * for ordering but a thrown error here is caught and swallowed (with a
 * console warning) rather than propagated.
 */
export async function logActivity({ type, message, actor, collegeId = null, metadata = {} }) {
  try {
    await ActivityLog.create({
      type,
      message,
      actorId: actor?._id || null,
      actorName: actor?.name || null,
      collegeId,
      metadata,
    });
  } catch (err) {
    // eslint-disable-next-line no-console -- logging failures shouldn't break the request, but shouldn't be silent either
    console.warn('Failed to record activity log:', err.message);
  }
}

/**
 * Platform activity, filterable and sortable. superAdmin-only consumer —
 * unscoped by college unless `collegeId` is given.
 */
export async function listRecentActivity({
  limit = 20,
  type,
  collegeId,
  sort = 'desc',
} = {}) {
  const query = {};
  if (type) query.type = type;
  if (collegeId) query.collegeId = collegeId;

  return ActivityLog.find(query)
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .limit(Math.min(limit, 100));
}
