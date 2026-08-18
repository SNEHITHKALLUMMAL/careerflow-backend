import mongoose from 'mongoose';

const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    response: { type: String, default: null }, // selected option text, or submitted code for coding questions
    isCorrect: { type: Boolean, default: null }, // null = not yet graded (coding, pending manual review)
    marksAwarded: { type: Number, default: null },
  },
  { _id: false }
);

const assessmentAttemptSchema = new Schema(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    answers: { type: [answerSchema], default: [] },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    // 'in_progress' -> 'submitted' (has ungraded coding answers) -> 'graded' (fully scored)
    // Purely auto-graded assessments (no coding questions) go straight to 'graded' on submit.
    status: { type: String, enum: ['in_progress', 'submitted', 'graded'], default: 'in_progress' },
    hasPendingManualGrading: { type: Boolean, default: false },
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate', default: null },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One attempt per student per assessment.
assessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
assessmentAttemptSchema.index({ assessmentId: 1, totalScore: -1 }); // leaderboard sort

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
