import mongoose from 'mongoose';

const { Schema } = mongoose;

// Every action type the platform currently logs. Keep this list in sync with
// wherever `logActivity()` is called from.
export const ACTIVITY_TYPES = [
  'mentor.assigned',
  'mentor.unassigned',
  'mentor.bulk_assigned',
  'task.created',
  'task.completed',
  'task.cancelled',
  'user.deactivated',
  'user.reactivated',
];

const activityLogSchema = new Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    // Free-text, already human-readable — kept simple on purpose so the
    // Super Admin feed and any future consumer don't need type-specific
    // rendering logic for every action.
    message: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Denormalized so the feed reads fine even if the actor is later deleted.
    actorName: { type: String, default: null },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ collegeId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
