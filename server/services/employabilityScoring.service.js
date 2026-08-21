/**
 * Weighted composite employability score. Each component is already a 0-100 value
 * (or null if unavailable, which contributes 0) — this function just combines them.
 * Weights: profile completion 25%, resume ATS score 25%, assessment average 30%,
 * application activity 20%.
 */
export function computeEmployabilityScore({
  profileCompletionPercent,
  resumeAtsScore,
  assessmentAveragePercent,
  applicationCount,
}) {
  const profileComponent = (profileCompletionPercent || 0) * 0.25;
  const resumeComponent = (resumeAtsScore ?? 0) * 0.25;
  const assessmentComponent = (assessmentAveragePercent ?? 0) * 0.3;

  // Rewards proactivity: applying to 5+ listings maxes out this component.
  const activityScore = (Math.min(applicationCount || 0, 5) / 5) * 100;
  const activityComponent = activityScore * 0.2;

  const total = profileComponent + resumeComponent + assessmentComponent + activityComponent;
  return Math.round(Math.min(100, Math.max(0, total)));
}

const READINESS_LEVELS = [
  {
    max: 39,
    label: 'Getting Started',
    description: 'Focus on completing your profile and building out your skills and projects.',
  },
  {
    max: 59,
    label: 'Building Readiness',
    description: 'Good progress — add a resume, take some assessments, and start applying.',
  },
  {
    max: 79,
    label: 'Placement Ready',
    description: "You're in good shape. Keep applying and practicing for interviews.",
  },
  {
    max: 100,
    label: 'Highly Competitive',
    description: 'Strong profile across the board — you stand out to recruiters.',
  },
];

/** @returns {{ label: string, description: string }} */
export function getReadinessLevel(score) {
  const level = READINESS_LEVELS.find((l) => score <= l.max);
  return level
    ? { label: level.label, description: level.description }
    : READINESS_LEVELS[READINESS_LEVELS.length - 1];
}

/**
 * Compares a student's skills against market-demand skill frequency data.
 * @param {string[]} studentSkillNames
 * @param {Array<{skill: string, count: number}>} marketDemand - pre-sorted desc by count
 */
export function computeSkillGap(studentSkillNames, marketDemand) {
  const studentSet = new Set(studentSkillNames.map((s) => s.toLowerCase()));
  const topDemand = marketDemand.slice(0, 15);

  const matched = topDemand.filter((d) => studentSet.has(d.skill.toLowerCase()));
  const missing = topDemand.filter((d) => !studentSet.has(d.skill.toLowerCase())).slice(0, 10);

  return { matched, missing };
}
