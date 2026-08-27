import { Resume } from '../models/Resume.model.js';
import { Student } from '../models/Student.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { sanitizeFileName } from '../middleware/upload.js';
import { analyzeResumeText } from './resumeParser.service.js';

async function getOwnedStudentId(userId) {
  const student = await Student.findOne({ userId }).select('_id');
  if (!student) throw ApiError.forbidden('No student profile found.');
  return student._id;
}

export async function listHistory(userId) {
  const studentId = await getOwnedStudentId(userId);
  return Resume.find({ studentId }).sort({ version: -1 });
}

export async function getResumeById(userId, resumeId) {
  const studentId = await getOwnedStudentId(userId);
  const resume = await Resume.findOne({ _id: resumeId, studentId });
  if (!resume) throw ApiError.notFound('Resume not found.');
  return resume;
}

/**
 * Uploads a resume file for a student, creates a new versioned Resume record, and
 * deactivates any previous active resume. Immediately runs the parsing/ATS-scoring
 * pipeline (Phase 11) so the record comes back fully analyzed — parsing failures
 * are swallowed by analyzeResumeText itself so they never block the upload.
 */
export async function uploadResumeForStudent(studentId, file) {
  if (!file) {
    throw ApiError.badRequest('No resume file was provided.');
  }

  const [uploadResult, analysis] = await Promise.all([
    uploadBufferToCloudinary(file.buffer, {
      folder: 'careerflow/resumes',
      resource_type: 'raw',
      public_id: `${studentId}-${Date.now()}`,
    }),
    analyzeResumeText(file.buffer, file.mimetype),
  ]);

  // Atomic increment — two concurrent uploads for the same student can never
  // be assigned the same version number, unlike the previous
  // countDocuments()-then-create() approach which had a real race window.
  const updatedStudent = await Student.findOneAndUpdate(
    { _id: studentId },
    { $inc: { resumeVersionCounter: 1 } },
    { new: true }
  ).select('resumeVersionCounter');
  const nextVersion = updatedStudent.resumeVersionCounter;

  await Resume.updateMany({ studentId, isActive: true }, { $set: { isActive: false } });

  const resume = await Resume.create({
    studentId,
    fileUrl: uploadResult.secure_url,
    originalFileName: sanitizeFileName(file.originalname),
    version: nextVersion,
    isActive: true,
    parsedData: {
      rawText: analysis.rawText,
      extractedSkills: analysis.extractedSkills,
      extractedEducation: analysis.extractedEducation,
      extractedExperience: analysis.extractedExperience,
    },
    atsScore: analysis.atsScore,
    grammarSuggestions: analysis.grammarSuggestions,
    keywordSuggestions: analysis.keywordSuggestions,
  });

  return resume;
}
