import { Certificate } from '../models/Certificate.model.js';
import { Student } from '../models/Student.model.js';
import { ApiError } from '../utils/ApiError.js';

async function getOwnedStudentId(userId) {
  const student = await Student.findOne({ userId }).select('_id');
  if (!student) throw ApiError.forbidden('No student profile found.');
  return student._id;
}

export async function listMyCertificates(userId) {
  const studentId = await getOwnedStudentId(userId);
  return Certificate.find({ studentId }).sort({ issuedAt: -1 });
}

export async function getCertificateForDownload(userId, certificateId) {
  const studentId = await getOwnedStudentId(userId);
  const certificate = await Certificate.findOne({ _id: certificateId, studentId });
  if (!certificate) throw ApiError.notFound('Certificate not found.');
  return certificate;
}
