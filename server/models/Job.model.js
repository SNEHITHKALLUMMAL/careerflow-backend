import mongoose from 'mongoose';

const { Schema } = mongoose;

const eligibilitySchema = new Schema(
  {
    minCgpa: { type: Number, min: 0, max: 10, default: null },
    allowedDepartments: { type: [String], default: [] },
    graduationYear: { type: Number, default: null },
  },
  { _id: false }
);

export const JOB_TYPES = ['full-time', 'part-time', 'contract'];
export const LISTING_STATUSES = ['open', 'closed', 'draft'];

const jobSchema = new Schema(
  {
    recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requiredSkills: { type: [String], default: [] },
    jobType: { type: String, enum: JOB_TYPES, required: true },
    location: { type: String, trim: true, default: null },
    isRemote: { type: Boolean, default: false },
    salaryRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
    applicationDeadline: { type: Date, default: null },
    status: { type: String, enum: LISTING_STATUSES, default: 'draft' },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });
jobSchema.index({ recruiterId: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

export const Job = mongoose.model('Job', jobSchema);
