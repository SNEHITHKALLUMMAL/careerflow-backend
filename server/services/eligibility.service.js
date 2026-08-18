/**
 * Checks a student against a job/internship's eligibility criteria.
 * Pure function — department name resolution (from the student's departmentId)
 * happens in the caller, since that needs a DB lookup; this stays testable without one.
 *
 * @param {{ education?: Array<{cgpa?: number}>, graduationYear?: number }} student
 * @param {string|null} studentDepartmentName
 * @param {{ minCgpa?: number, allowedDepartments?: string[], graduationYear?: number }} eligibility
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function checkEligibility(student, studentDepartmentName, eligibility) {
  if (!eligibility) return { eligible: true, reasons: [] };

  const reasons = [];

  if (eligibility.minCgpa !== undefined && eligibility.minCgpa !== null) {
    const highestCgpa = (student.education || []).reduce(
      (max, entry) => Math.max(max, entry.cgpa || 0),
      0
    );
    if (highestCgpa < eligibility.minCgpa) {
      reasons.push(`Requires a CGPA of at least ${eligibility.minCgpa}`);
    }
  }

  if (eligibility.allowedDepartments?.length) {
    if (!studentDepartmentName || !eligibility.allowedDepartments.includes(studentDepartmentName)) {
      reasons.push(`Open only to: ${eligibility.allowedDepartments.join(', ')}`);
    }
  }

  if (
    eligibility.graduationYear !== undefined &&
    eligibility.graduationYear !== null &&
    student.graduationYear !== eligibility.graduationYear
  ) {
    reasons.push(`Open only to the ${eligibility.graduationYear} graduating batch`);
  }

  return { eligible: reasons.length === 0, reasons };
}
