import mongoose from 'mongoose';

const recruiterSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, default: null, trim: true },
    companyLogoUrl: { type: String, default: null },
    companyWebsite: { type: String, default: null },
    industry: { type: String, default: null, trim: true },
    // Gates job/internship posting — see README for how this is bootstrapped without a
    // Super Admin dashboard yet.
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Recruiter = mongoose.model('Recruiter', recruiterSchema);
