import mongoose from 'mongoose';

export const DRIVE_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'];

const driveSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driveDate: { type: Date, required: true },
    status: { type: String, enum: DRIVE_STATUSES, default: 'scheduled' },
    notes: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

driveSchema.index({ collegeId: 1, driveDate: 1 });

export const Drive = mongoose.model('Drive', driveSchema);
