import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    assessmentAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    certificateUrl: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

certificateSchema.index({ studentId: 1, issuedAt: -1 });

export const Certificate = mongoose.model('Certificate', certificateSchema);
