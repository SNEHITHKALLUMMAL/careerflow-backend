import { canViewResults } from '../services/assessment.service.js';

const COLLEGE_A = '507f1f77bcf86cd799439011';
const COLLEGE_B = '507f1f77bcf86cd799439012';
const CREATOR_ID = '507f1f77bcf86cd799439021';
const OTHER_USER_ID = '507f1f77bcf86cd799439022';

const baseAssessment = { createdBy: CREATOR_ID, collegeId: COLLEGE_A };

describe('assessment.service — canViewResults (result-viewing IDOR guard)', () => {
  it('allows superAdmin regardless of college or authorship', () => {
    const user = { _id: OTHER_USER_ID, role: 'superAdmin', collegeId: COLLEGE_B };
    expect(canViewResults(user, baseAssessment)).toBe(true);
  });

  it('allows the assessment creator regardless of role or college on file', () => {
    const user = { _id: CREATOR_ID, role: 'mentor', collegeId: null };
    expect(canViewResults(user, baseAssessment)).toBe(true);
  });

  it('allows privileged staff at the SAME college as the assessment', () => {
    const user = { _id: OTHER_USER_ID, role: 'placementOfficer', collegeId: COLLEGE_A };
    expect(canViewResults(user, baseAssessment)).toBe(true);
  });

  it('denies privileged staff at a DIFFERENT college — this is the bug that was fixed', () => {
    const user = { _id: OTHER_USER_ID, role: 'mentor', collegeId: COLLEGE_B };
    expect(canViewResults(user, baseAssessment)).toBe(false);
  });

  it('denies privileged staff with no college on file, even against a college-scoped assessment', () => {
    const user = { _id: OTHER_USER_ID, role: 'collegeAdmin', collegeId: null };
    expect(canViewResults(user, baseAssessment)).toBe(false);
  });

  it('denies privileged-role staff when the assessment itself has no collegeId (legacy/platform-wide data)', () => {
    const user = { _id: OTHER_USER_ID, role: 'mentor', collegeId: COLLEGE_A };
    expect(canViewResults(user, { createdBy: CREATOR_ID, collegeId: null })).toBe(false);
  });

  it('denies a recruiter outright — not a privileged role for assessments at all', () => {
    const user = { _id: OTHER_USER_ID, role: 'recruiter', collegeId: COLLEGE_A };
    expect(canViewResults(user, baseAssessment)).toBe(false);
  });

  // getAssessmentForViewing() reuses this same function to decide whether to
  // include the answer-key fields (correctAnswer / testCases.expectedOutput)
  // when returning an assessment for editing — the exact same scope rules
  // apply there, so no separate test suite is needed for that call site.
});
