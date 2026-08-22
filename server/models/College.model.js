import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    domainEmailSuffix: { type: String, trim: true, default: null }, // e.g. "@nit.edu"
    address: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    logoUrl: { type: String, default: null },
    superAdminApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

collegeSchema.index({ name: 'text', city: 'text' });

export const College = mongoose.model('College', collegeSchema);
