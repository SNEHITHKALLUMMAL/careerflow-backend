import mongoose from 'mongoose';

const { Schema } = mongoose;

const testCaseSchema = new Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '', select: false },
  },
  { _id: false }
);

const questionSchema = new Schema({
  questionText: { type: String, required: true, trim: true },
  options: { type: [String], default: [] }, // used by mcq/aptitude/technical_quiz/soft_skill_quiz
  // Hidden by default — must .select('+questions.correctAnswer') to read it server-side for grading.
  correctAnswer: { type: String, default: null, select: false },
  testCases: { type: [testCaseSchema], default: [] }, // used by 'coding' questions
  marks: { type: Number, required: true, min: 1, default: 1 },
});

export const ASSESSMENT_TYPES = ['coding', 'mcq', 'aptitude', 'technical_quiz', 'soft_skill_quiz'];
export const ASSESSMENT_CREATOR_ROLES = [
  'mentor',
  'placementOfficer',
  'collegeAdmin',
  'superAdmin',
];

const assessmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    type: { type: String, enum: ASSESSMENT_TYPES, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', default: null },
    questions: { type: [questionSchema], default: [] },
    durationMinutes: { type: Number, required: true, min: 1 },
    passingScore: { type: Number, required: true, min: 0, max: 100, default: 40 }, // percentage
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

assessmentSchema.virtual('totalMarks').get(function computeTotalMarks() {
  return (this.questions || []).reduce((sum, q) => sum + q.marks, 0);
});

assessmentSchema.virtual('questionCount').get(function computeQuestionCount() {
  return (this.questions || []).length;
});

assessmentSchema.index({ createdBy: 1, isPublished: 1 });
assessmentSchema.index({ type: 1, isPublished: 1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
