import path from 'node:path';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Only PDF, DOC, or DOCX files are allowed.'));
    return;
  }
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(ApiError.badRequest('Only .pdf, .doc, or .docx files are allowed.'));
    return;
  }
  cb(null, true);
}

/**
 * Multer only ever sees the client-supplied Content-Type header for a
 * multipart field — that's just text the client typed, not a verified fact
 * about the file. An attacker can label anything (an executable, an HTML
 * file with a script tag, a polyglot file) as `application/pdf` and sail
 * straight through fileFilter above. This checks the actual first bytes of
 * the buffer against the real file-format signatures, after multer has
 * already loaded it into memory (fileFilter runs on headers only, before the
 * body is available, so signature checking has to happen post-upload).
 */
function detectSignature(buffer) {
  if (!buffer || buffer.length < 8) return null;

  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';

  // ZIP local-file-header signature — .docx is a zip archive.
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2])) {
    return 'docx';
  }

  // OLE Compound File signature — legacy .doc format.
  const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (buffer.subarray(0, 8).equals(OLE_SIGNATURE)) return 'doc';

  return null;
}

const MIME_TO_SIGNATURE = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

/**
 * Verifies the uploaded buffer's real signature matches what the client
 * claimed. Call this after the upload middleware, once req.file.buffer is
 * populated — it's the actual content-based check that fileFilter can't do.
 */
export function verifyFileSignature(req, res, next) {
  if (!req.file) return next();

  const detected = detectSignature(req.file.buffer);
  const expected = MIME_TO_SIGNATURE[req.file.mimetype];

  if (!detected || detected !== expected) {
    return next(ApiError.badRequest('This file does not appear to be a valid PDF, DOC, or DOCX.'));
  }

  next();
}

const MAX_FILENAME_LENGTH = 150;

/** Strips path separators/control characters and caps length before a filename is ever stored or shown back to a user. */
export function sanitizeFileName(originalName) {
  if (!originalName) return null;
  // Take only the last path segment — split on both separators explicitly,
  // since path.basename() on a Linux server only recognizes '/', not '\',
  // and resumes are routinely uploaded from Windows clients.
  const segments = originalName.split(/[/\\]+/);
  const base = segments[segments.length - 1] || '';
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f<>:"|?*]/g, '_').trim();
  return cleaned.slice(0, MAX_FILENAME_LENGTH) || 'resume';
}

/** Single-file upload middleware for the `resume` field. Buffer lives at req.file.buffer. */
export const uploadResumeFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('resume');
