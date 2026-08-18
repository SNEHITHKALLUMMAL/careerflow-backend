import mongoose from 'mongoose';

export const REPORT_SCOPES = ['student_weekly', 'student_monthly', 'college'];

const reportSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: REPORT_SCOPES, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

reportSchema.index({ ownerId: 1, scope: 1, generatedAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
