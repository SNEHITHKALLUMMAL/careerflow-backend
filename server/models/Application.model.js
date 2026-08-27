import mongoose from 'mongoose';

const { Schema } = mongoose;

export const APPLICATION_STATUSES = [
  'applied',
  'shortlisted',
  'interview_scheduled',
  'offered',
  'rejected',
  'withdrawn',
];

const statusHistoryEntrySchema = new Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const interviewSchema = new Schema(
  {
    scheduledAt: { type: Date, default: null },
    mode: { type: String, enum: ['online', 'in-person', 'phone'], default: null },
    link: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { _id: false }
);

const applicationSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    targetType: { type: String, enum: ['job', 'internship'], required: true },
    // targetModel lets Mongoose populate() resolve targetId against the right collection.
    targetModel: { type: String, enum: ['Job', 'Internship'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, refPath: 'targetModel' },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied' },
    interview: { type: interviewSchema, default: () => ({}) },
    offerLetterUrl: { type: String, default: null },
    statusHistory: { type: [statusHistoryEntrySchema], default: [] },
  },
  { timestamps: true }
);

// One application per student per job/internship.
applicationSchema.index({ studentId: 1, targetType: 1, targetId: 1 }, { unique: true });
applicationSchema.index({ targetType: 1, targetId: 1, status: 1 });

export const Application = mongoose.model('Application', applicationSchema);
