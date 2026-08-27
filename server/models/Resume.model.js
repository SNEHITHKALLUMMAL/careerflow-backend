import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    fileUrl: { type: String, required: true },
    originalFileName: { type: String, default: null },
    // Populated later by the Resume module (Phase 11) via pdf-parse/mammoth + Gemini.
    parsedData: {
      rawText: { type: String, default: null },
      extractedSkills: { type: [String], default: [] },
      extractedEducation: { type: [String], default: [] },
      extractedExperience: { type: [String], default: [] },
    },
    atsScore: { type: Number, default: null },
    grammarSuggestions: { type: [String], default: [] },
    keywordSuggestions: { type: [String], default: [] },
    templateUsed: { type: String, default: null }, // set when built via the resume builder, not upload
    version: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

resumeSchema.index({ studentId: 1, version: -1 });
resumeSchema.index({ studentId: 1, version: 1 }, { unique: true });

export const Resume = mongoose.model('Resume', resumeSchema);
