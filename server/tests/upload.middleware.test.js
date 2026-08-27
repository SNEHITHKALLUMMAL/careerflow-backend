import { verifyFileSignature, sanitizeFileName } from '../middleware/upload.js';

function makeReq(mimetype, buffer) {
  return { file: { mimetype, buffer } };
}

function run(req) {
  let error = null;
  let calledNext = false;
  verifyFileSignature(req, {}, (err) => {
    calledNext = true;
    error = err || null;
  });
  return { calledNext, error };
}

describe('upload middleware — verifyFileSignature (magic-byte guard)', () => {
  it('passes a real PDF buffer claiming to be application/pdf', () => {
    const buffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(10)]);
    const { error } = run(makeReq('application/pdf', buffer));
    expect(error).toBeNull();
  });

  it('passes a real DOCX (zip) buffer claiming to be the docx mimetype', () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    const { error } = run(
      makeReq('application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer)
    );
    expect(error).toBeNull();
  });

  it('passes a real legacy DOC (OLE) buffer claiming to be application/msword', () => {
    const buffer = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const { error } = run(makeReq('application/msword', buffer));
    expect(error).toBeNull();
  });

  it('rejects a file whose bytes do not match its claimed PDF mimetype (spoofed Content-Type)', () => {
    // An executable/script masquerading as a PDF by lying about its Content-Type.
    const buffer = Buffer.from('#!/bin/sh\necho pwned\n');
    const { error } = run(makeReq('application/pdf', buffer));
    expect(error).not.toBeNull();
    expect(error.statusCode).toBe(400);
  });

  it('rejects a plain-text/HTML file spoofed as a docx', () => {
    const buffer = Buffer.from('<html><script>alert(1)</script></html>');
    const { error } = run(
      makeReq('application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer)
    );
    expect(error).not.toBeNull();
  });

  it('passes through with no error when there is no file on the request', () => {
    const { calledNext, error } = run({});
    expect(calledNext).toBe(true);
    expect(error).toBeNull();
  });
});

describe('upload middleware — sanitizeFileName', () => {
  it('strips directory components (path traversal attempt)', () => {
    expect(sanitizeFileName('../../etc/passwd')).not.toContain('/');
    expect(sanitizeFileName('..\\..\\windows\\system32\\evil.pdf')).toBe('evil.pdf');
  });

  it('replaces control and reserved characters', () => {
    expect(sanitizeFileName('resume<script>.pdf')).not.toMatch(/[<>]/);
  });

  it('caps length to a reasonable maximum', () => {
    const huge = 'a'.repeat(500) + '.pdf';
    expect(sanitizeFileName(huge).length).toBeLessThanOrEqual(150);
  });

  it('returns null for an empty/missing name', () => {
    expect(sanitizeFileName('')).toBeNull();
    expect(sanitizeFileName(null)).toBeNull();
  });

  it('leaves an ordinary filename untouched', () => {
    expect(sanitizeFileName('john-doe-resume.pdf')).toBe('john-doe-resume.pdf');
  });
});
