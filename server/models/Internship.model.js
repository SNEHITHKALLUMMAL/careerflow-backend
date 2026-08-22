import mongoose from 'mongoose';
import { LISTING_STATUSES } from './Job.model.js';

const { Schema } = mongoose;

const eligibilitySchema = new Schema(
  {
    minCgpa: { type: Number, min: 0, max: 10, default: null },
    allowedDepartments: { type: [String], default: [] },
    graduationYear: { type: Number, default: null },
  },
  { _id: false }
);

const internshipSchema = new Schema(
  {
    recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requiredSkills: { type: [String], default: [] },
    location: { type: String, trim: true, default: null },
    isRemote: { type: Boolean, default: false },
    durationMonths: { type: Number, min: 1, max: 24, default: null },
    stipend: { type: Number, min: 0, default: null },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
    applicationDeadline: { type: Date, default: null },
    status: { type: String, enum: LISTING_STATUSES, default: 'draft' },
  },
  { timestamps: true }
);

internshipSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });
internshipSchema.index({ recruiterId: 1, status: 1 });
internshipSchema.index({ status: 1, createdAt: -1 });

export const Internship = mongoose.model('Internship', internshipSchema);
