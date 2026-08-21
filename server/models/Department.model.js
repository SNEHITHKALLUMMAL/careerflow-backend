import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    name: { type: String, required: true, trim: true },
    hodName: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

departmentSchema.index({ collegeId: 1, name: 1 }, { unique: true });

export const Department = mongoose.model('Department', departmentSchema);
