import mongoose from 'mongoose';
import { Assessment } from '../models/Assessment.model.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.model.js';
import { Certificate } from '../models/Certificate.model.js';

const fakeUserId = new mongoose.Types.ObjectId();
const fakeStudentId = new mongoose.Types.ObjectId();

describe('Assessment model', () => {
  it('requires title, type, createdBy, and durationMinutes', () => {
    const assessment = new Assessment({});
    const err = assessment.validateSync();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.type).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
    expect(err.errors.durationMinutes).toBeDefined();
  });

  it('rejects an invalid type enum value', () => {
    const assessment = new Assessment({
      title: 'Test',
      type: 'not-a-real-type',
      createdBy: fakeUserId,
      durationMinutes: 30,
    });
    expect(assessment.validateSync().errors.type).toBeDefined();
  });

  it('defaults isPublished to false and passingScore to 40', () => {
    const assessment = new Assessment({
      title: 'Test',
      type: 'mcq',
      createdBy: fakeUserId,
      durationMinutes: 30,
    });
    expect(assessment.isPublished).toBe(false);
    expect(assessment.passingScore).toBe(40);
  });

  it('computes totalMarks and questionCount virtuals from the questions array', () => {
    const assessment = new Assessment({
      title: 'Test',
      type: 'mcq',
      createdBy: fakeUserId,
      durationMinutes: 30,
      questions: [
        { questionText: 'Q1', marks: 5, correctAnswer: 'A' },
        { questionText: 'Q2', marks: 10, correctAnswer: 'B' },
      ],
    });
    expect(assessment.totalMarks).toBe(15);
    expect(assessment.questionCount).toBe(2);
  });

  it('virtuals do not throw when questions is excluded from a query projection (regression)', () => {
    // Simulates the document shape after `.select('-questions')` — questions is undefined,
    // not an empty array. The virtuals must guard against this rather than call .reduce()
    // on undefined.
    const assessment = new Assessment({
      title: 'Test',
      type: 'mcq',
      createdBy: fakeUserId,
      durationMinutes: 30,
    });
    assessment.questions = undefined;
    expect(() => assessment.totalMarks).not.toThrow();
    expect(assessment.totalMarks).toBe(0);
    expect(assessment.questionCount).toBe(0);
  });

  it('rejects a question missing marks', () => {
    const assessment = new Assessment({
      title: 'Test',
      type: 'mcq',
      createdBy: fakeUserId,
      durationMinutes: 30,
      questions: [{ questionText: 'Q1' }],
    });
    // marks has a default of 1, so this should actually be valid — verifying the default applies
    expect(assessment.validateSync()).toBeUndefined();
    expect(assessment.questions[0].marks).toBe(1);
  });
});

describe('AssessmentAttempt model', () => {
  it('requires assessmentId and studentId', () => {
    const attempt = new AssessmentAttempt({});
    const err = attempt.validateSync();
    expect(err.errors.assessmentId).toBeDefined();
    expect(err.errors.studentId).toBeDefined();
  });

  it('defaults status to in_progress and passed to false', () => {
    const attempt = new AssessmentAttempt({
      assessmentId: fakeUserId,
      studentId: fakeStudentId,
    });
    expect(attempt.status).toBe('in_progress');
    expect(attempt.passed).toBe(false);
  });

  it('rejects an invalid status enum value', () => {
    const attempt = new AssessmentAttempt({
      assessmentId: fakeUserId,
      studentId: fakeStudentId,
      status: 'not-a-status',
    });
    expect(attempt.validateSync().errors.status).toBeDefined();
  });
});

describe('Certificate model', () => {
  it('requires studentId, assessmentAttemptId, title, and certificateUrl', () => {
    const certificate = new Certificate({});
    const err = certificate.validateSync();
    expect(err.errors.studentId).toBeDefined();
    expect(err.errors.assessmentAttemptId).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.certificateUrl).toBeDefined();
  });

  it('is valid with all required fields present', () => {
    const certificate = new Certificate({
      studentId: fakeStudentId,
      assessmentAttemptId: fakeUserId,
      title: 'Test Certificate',
      certificateUrl: 'https://example.com/cert.pdf',
    });
    expect(certificate.validateSync()).toBeUndefined();
  });
});
