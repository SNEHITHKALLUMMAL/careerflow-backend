import mongoose from 'mongoose';

const AI_FEATURES = [
  'skill_gap',
  'career_recommendation',
  'learning_roadmap',
  'resume_suggestions',
  'chatbot',
  'technology_recommendation',
  'interview_questions',
  'salary_estimation',
  'mock_interview',
];

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    feature: { type: String, enum: AI_FEATURES, required: true },
    status: { type: String, enum: ['success', 'error'], required: true },
    promptChars: { type: Number, default: null },
    responseChars: { type: Number, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

aiUsageLogSchema.index({ userId: 1, createdAt: -1 });
aiUsageLogSchema.index({ feature: 1, status: 1 });

export const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);
export { AI_FEATURES };
