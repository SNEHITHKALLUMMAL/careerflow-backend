/**
 * Six equally-weighted checklist items make up a student's profile completion percentage.
 * This mirrors the "placement journey" checklist shown on the marketing site, so the
 * concept is consistent end to end. Full employabilityScore (which also factors in
 * assessments, resume ATS score, and application activity) is computed by the
 * Employability module once those pieces exist.
 */
const CHECKLIST = [
  {
    key: 'basicInfo',
    label: 'Basic info added',
    check: (s) => Boolean(s.rollNumber && s.graduationYear && s.departmentId),
  },
  {
    key: 'education',
    label: 'Education added',
    check: (s) => s.education.length > 0,
  },
  {
    key: 'skills',
    label: 'At least 3 skills added',
    check: (s) => s.skills.length >= 3,
  },
  {
    key: 'experience',
    label: 'A project, internship, or work experience added',
    check: (s) => s.projects.length > 0 || s.internships.length > 0 || s.experience.length > 0,
  },
  {
    key: 'resume',
    label: 'Resume uploaded',
    check: (s) => Boolean(s.resumeId),
  },
  {
    key: 'links',
    label: 'Career interests and at least one profile link added',
    check: (s) =>
      s.careerInterests.length > 0 && Boolean(s.portfolioUrl || s.githubUrl || s.linkedinUrl),
  },
];

/**
 * @param {import('../models/Student.model.js').Student} student
 * @returns {{ percent: number, checklist: Array<{key: string, label: string, complete: boolean}> }}
 */
export function computeProfileCompletion(student) {
  const checklist = CHECKLIST.map(({ key, label, check }) => ({
    key,
    label,
    complete: check(student),
  }));

  const completedCount = checklist.filter((item) => item.complete).length;
  const percent = Math.round((completedCount / CHECKLIST.length) * 100);

  return { percent, checklist };
}

/** Mutates student.profileCompletionPercent in place — call before save(). */
export function applyProfileCompletion(student) {
  const { percent } = computeProfileCompletion(student);
  student.profileCompletionPercent = percent;
  return student;
}
