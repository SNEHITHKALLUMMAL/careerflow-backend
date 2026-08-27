import { Resume } from '../models/Resume.model.js';
import { Student } from '../models/Student.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { generateResumePdfBuffer, RESUME_TEMPLATES } from './resumePdf.service.js';
import { analyzeStructuredResume } from './resumeParser.service.js';
import { applyProfileCompletion } from './scoring.service.js';

function buildStructuredData(user, student, overrides = {}) {
  return {
    name: user.name,
    email: user.email,
    phone: overrides.phone || null,
    linkedinUrl: student.linkedinUrl,
    githubUrl: student.githubUrl,
    education: student.education,
    skills: student.skills,
    projects: student.projects,
    experience: student.experience,
    internships: student.internships,
    ...overrides,
  };
}

async function createResumeFromPdf({ studentId, pdfBuffer, template, fileName, structuredData }) {
  const analysis = analyzeStructuredResume(structuredData);

  const uploadResult = await uploadBufferToCloudinary(pdfBuffer, {
    folder: 'careerflow/resumes',
    resource_type: 'raw',
    format: 'pdf',
    public_id: `${studentId}-built-${Date.now()}`,
  });

  const previousCount = await Resume.countDocuments({ studentId });
  await Resume.updateMany({ studentId, isActive: true }, { $set: { isActive: false } });

  return Resume.create({
    studentId,
    fileUrl: uploadResult.secure_url,
    originalFileName: fileName,
    version: previousCount + 1,
    isActive: true,
    templateUsed: template,
    parsedData: { rawText: analysis.rawText },
    atsScore: analysis.atsScore,
    grammarSuggestions: analysis.grammarSuggestions,
    keywordSuggestions: analysis.keywordSuggestions,
  });
}

export async function buildResume(userId, { template = 'classic', phone } = {}) {
  if (!RESUME_TEMPLATES.includes(template)) {
    throw ApiError.badRequest(`template must be one of: ${RESUME_TEMPLATES.join(', ')}`);
  }

  const [user, student] = await Promise.all([User.findById(userId), Student.findOne({ userId })]);
  if (!student)
    throw ApiError.badRequest('Complete your student profile before building a resume.');

  const data = buildStructuredData(user, student, { phone });
  const pdfBuffer = await generateResumePdfBuffer(data, template);

  const resume = await createResumeFromPdf({
    studentId: student._id,
    pdfBuffer,
    template,
    fileName: `${user.name.replace(/\s+/g, '_')}_Resume_${template}.pdf`,
    structuredData: data,
  });

  student.resumeId = resume._id;
  applyProfileCompletion(student);
  await student.save();

  return resume;
}

export async function rebuildResume(userId, resumeId, { template } = {}) {
  const student = await Student.findOne({ userId });
  if (!student) throw ApiError.forbidden('No student profile found.');

  const existing = await Resume.findOne({ _id: resumeId, studentId: student._id });
  if (!existing) throw ApiError.notFound('Resume not found.');

  const chosenTemplate = template || existing.templateUsed || 'classic';
  if (!RESUME_TEMPLATES.includes(chosenTemplate)) {
    throw ApiError.badRequest(`template must be one of: ${RESUME_TEMPLATES.join(', ')}`);
  }

  const user = await User.findById(userId);
  const data = buildStructuredData(user, student);
  const pdfBuffer = await generateResumePdfBuffer(data, chosenTemplate);

  const resume = await createResumeFromPdf({
    studentId: student._id,
    pdfBuffer,
    template: chosenTemplate,
    fileName: `${user.name.replace(/\s+/g, '_')}_Resume_${chosenTemplate}.pdf`,
    structuredData: data,
  });

  student.resumeId = resume._id;
  applyProfileCompletion(student);
  await student.save();

  return resume;
}
