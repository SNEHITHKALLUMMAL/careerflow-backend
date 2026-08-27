import mongoose from 'mongoose';

const { Schema } = mongoose;

const educationSchema = new Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, default: null },
    cgpa: { type: Number, min: 0, max: 10, default: null },
  },
  { timestamps: true }
);

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    // Not settable by the student directly — set by mentors/assessments in later phases.
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const languageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native'],
      default: 'conversational',
    },
  },
  { timestamps: true }
);

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    techStack: { type: [String], default: [] },
    githubUrl: { type: String, default: null },
    liveUrl: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const workEntrySchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = ongoing
    description: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

const certificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date, default: null },
    certificateUrl: { type: String, default: null },
  },
  { timestamps: true }
);

const achievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    date: { type: Date, default: null },
  },
  { timestamps: true }
);

const studentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    rollNumber: { type: String, trim: true, default: null },
    graduationYear: { type: Number, default: null },

    education: { type: [educationSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    internships: { type: [workEntrySchema], default: [] },
    experience: { type: [workEntrySchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },

    careerInterests: { type: [String], default: [] },
    portfolioUrl: { type: String, default: null },
    githubUrl: { type: String, default: null },
    linkedinUrl: { type: String, default: null },

    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },

    // Mentor-student assignment — set by a placement officer (or super admin).
    // References User (role: 'mentor'), not a separate Mentor model, since
    // mentors don't have their own sub-profile collection.
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Atomically incremented via findOneAndUpdate($inc) on each resume upload —
    // see resume.service.js. Using a counter field instead of counting existing
    // Resume documents avoids a race where two concurrent uploads could both
    // read the same count and get assigned the same version number.
    resumeVersionCounter: { type: Number, default: 0 },

    bookmarkedJobs: { type: [Schema.Types.ObjectId], ref: 'Job', default: [] },
    bookmarkedInternships: { type: [Schema.Types.ObjectId], ref: 'Internship', default: [] },

    employabilityScore: { type: Number, default: 0 }, // full calculation lands with the Employability module
    profileCompletionPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studentSchema.index({ collegeId: 1, departmentId: 1 });
studentSchema.index({ mentorId: 1 });


export const Student = mongoose.model('Student', studentSchema);

/** Sub-resource array field names, used by the generic CRUD routes/controllers. */
export const STUDENT_ARRAY_FIELDS = [
  'education',
  'skills',
  'languages',
  'projects',
  'internships',
  'experience',
  'certifications',
  'achievements',
];
