import { checkEligibility } from '../services/eligibility.service.js';

const BASE_STUDENT = { education: [{ cgpa: 8.5 }], graduationYear: 2026 };

describe('checkEligibility', () => {
  it('is eligible when there is no eligibility criteria at all', () => {
    expect(checkEligibility(BASE_STUDENT, 'Computer Science', null)).toEqual({
      eligible: true,
      reasons: [],
    });
  });

  it('is eligible when criteria is an empty object', () => {
    expect(checkEligibility(BASE_STUDENT, 'Computer Science', {})).toEqual({
      eligible: true,
      reasons: [],
    });
  });

  describe('minCgpa', () => {
    it('passes when the highest education entry meets the minimum', () => {
      const result = checkEligibility(BASE_STUDENT, null, { minCgpa: 8 });
      expect(result.eligible).toBe(true);
    });

    it('fails when no education entry meets the minimum', () => {
      const result = checkEligibility(BASE_STUDENT, null, { minCgpa: 9 });
      expect(result.eligible).toBe(false);
      expect(result.reasons[0]).toMatch(/CGPA of at least 9/);
    });

    it('uses the highest cgpa across multiple education entries', () => {
      const student = { education: [{ cgpa: 6 }, { cgpa: 9.2 }], graduationYear: 2026 };
      expect(checkEligibility(student, null, { minCgpa: 9 }).eligible).toBe(true);
    });

    it('treats missing education as a 0 cgpa', () => {
      const result = checkEligibility({ education: [], graduationYear: 2026 }, null, {
        minCgpa: 5,
      });
      expect(result.eligible).toBe(false);
    });
  });

  describe('allowedDepartments', () => {
    it('passes when the student department name is in the allowed list', () => {
      const result = checkEligibility(BASE_STUDENT, 'Computer Science', {
        allowedDepartments: ['Computer Science', 'IT'],
      });
      expect(result.eligible).toBe(true);
    });

    it('fails when the department is not in the allowed list', () => {
      const result = checkEligibility(BASE_STUDENT, 'Mechanical', {
        allowedDepartments: ['Computer Science', 'IT'],
      });
      expect(result.eligible).toBe(false);
      expect(result.reasons[0]).toMatch(/Open only to: Computer Science, IT/);
    });

    it('fails when the student has no resolved department name', () => {
      const result = checkEligibility(BASE_STUDENT, null, {
        allowedDepartments: ['Computer Science'],
      });
      expect(result.eligible).toBe(false);
    });

    it('is ignored when the allowed list is empty', () => {
      const result = checkEligibility(BASE_STUDENT, null, { allowedDepartments: [] });
      expect(result.eligible).toBe(true);
    });
  });

  describe('graduationYear', () => {
    it('passes for a matching graduation year', () => {
      expect(checkEligibility(BASE_STUDENT, null, { graduationYear: 2026 }).eligible).toBe(true);
    });

    it('fails for a mismatched graduation year', () => {
      const result = checkEligibility(BASE_STUDENT, null, { graduationYear: 2025 });
      expect(result.eligible).toBe(false);
      expect(result.reasons[0]).toMatch(/2025 graduating batch/);
    });
  });

  it('combines multiple failing criteria into multiple reasons', () => {
    const result = checkEligibility(BASE_STUDENT, 'Mechanical', {
      minCgpa: 9.5,
      allowedDepartments: ['Computer Science'],
      graduationYear: 2027,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(3);
  });
});
