import mongoose from 'mongoose';

const { Schema } = mongoose;

// "Task" rather than "Assignment" in the schema name to avoid clashing with the
// unrelated mentor-student *assignment* concept (Student.mentorId) already in
// this codebase — both are colloquially "assignments" but are entirely
// different features.
export const TASK_ASSIGNER_ROLES = ['mentor', 'recruiter', 'superAdmin'];
export const TASK_STATUSES = ['pending', 'completed', 'cancelled'];

const studentTaskSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    assignedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedByRole: { type: String, enum: TASK_ASSIGNER_ROLES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: TASK_STATUSES, default: 'pending' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

studentTaskSchema.index({ studentId: 1, status: 1, createdAt: -1 });
studentTaskSchema.index({ assignedById: 1, createdAt: -1 });

export const StudentTask = mongoose.model('StudentTask', studentTaskSchema);
