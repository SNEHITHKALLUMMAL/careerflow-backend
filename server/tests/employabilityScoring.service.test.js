import {
  computeEmployabilityScore,
  getReadinessLevel,
  computeSkillGap,
} from '../services/employabilityScoring.service.js';

describe('computeEmployabilityScore', () => {
  it('is 0 for a completely empty profile', () => {
    const score = computeEmployabilityScore({
      profileCompletionPercent: 0,
      resumeAtsScore: null,
      assessmentAveragePercent: null,
      applicationCount: 0,
    });
    expect(score).toBe(0);
  });

  it('is 100 when every component maxes out', () => {
    const score = computeEmployabilityScore({
      profileCompletionPercent: 100,
      resumeAtsScore: 100,
      assessmentAveragePercent: 100,
      applicationCount: 10, // above the cap of 5, should still just max the activity component
    });
    expect(score).toBe(100);
  });

  it('weights assessment performance more heavily than any single other component', () => {
    const withAssessment = computeEmployabilityScore({
      profileCompletionPercent: 0,
      resumeAtsScore: null,
      assessmentAveragePercent: 100,
      applicationCount: 0,
    });
    const withProfile = computeEmployabilityScore({
      profileCompletionPercent: 100,
      resumeAtsScore: null,
      assessmentAveragePercent: null,
      applicationCount: 0,
    });
    expect(withAssessment).toBeGreaterThan(withProfile);
  });

  it('caps application activity contribution at 5 applications', () => {
    const at5 = computeEmployabilityScore({
      profileCompletionPercent: 0,
      resumeAtsScore: null,
      assessmentAveragePercent: null,
      applicationCount: 5,
    });
    const at50 = computeEmployabilityScore({
      profileCompletionPercent: 0,
      resumeAtsScore: null,
      assessmentAveragePercent: null,
      applicationCount: 50,
    });
    expect(at5).toBe(at50);
  });

  it('never exceeds 100 or goes below 0', () => {
    const score = computeEmployabilityScore({
      profileCompletionPercent: 100,
      resumeAtsScore: 100,
      assessmentAveragePercent: 100,
      applicationCount: 100,
    });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('treats missing/null components as 0 contribution rather than throwing', () => {
    expect(() =>
      computeEmployabilityScore({
        profileCompletionPercent: undefined,
        resumeAtsScore: null,
        assessmentAveragePercent: null,
        applicationCount: undefined,
      })
    ).not.toThrow();
  });
});

describe('getReadinessLevel', () => {
  it('returns the correct band for boundary and mid-range scores', () => {
    expect(getReadinessLevel(0).label).toBe('Getting Started');
    expect(getReadinessLevel(39).label).toBe('Getting Started');
    expect(getReadinessLevel(40).label).toBe('Building Readiness');
    expect(getReadinessLevel(59).label).toBe('Building Readiness');
    expect(getReadinessLevel(60).label).toBe('Placement Ready');
    expect(getReadinessLevel(79).label).toBe('Placement Ready');
    expect(getReadinessLevel(80).label).toBe('Highly Competitive');
    expect(getReadinessLevel(100).label).toBe('Highly Competitive');
  });

  it('always returns a label and description', () => {
    for (const score of [0, 25, 50, 75, 100]) {
      const level = getReadinessLevel(score);
      expect(typeof level.label).toBe('string');
      expect(typeof level.description).toBe('string');
    }
  });
});

describe('computeSkillGap', () => {
  const marketDemand = [
    { skill: 'react', count: 40 },
    { skill: 'node.js', count: 35 },
    { skill: 'typescript', count: 30 },
    { skill: 'python', count: 25 },
  ];

  it('separates matched and missing skills', () => {
    const { matched, missing } = computeSkillGap(['React', 'Python'], marketDemand);
    expect(matched.map((m) => m.skill)).toEqual(expect.arrayContaining(['react', 'python']));
    expect(missing.map((m) => m.skill)).toEqual(expect.arrayContaining(['node.js', 'typescript']));
  });

  it('is case-insensitive when matching student skills against market demand', () => {
    const { matched } = computeSkillGap(['REACT'], marketDemand);
    expect(matched.some((m) => m.skill === 'react')).toBe(true);
  });

  it('treats no student skills as everything missing', () => {
    const { matched, missing } = computeSkillGap([], marketDemand);
    expect(matched).toHaveLength(0);
    expect(missing.length).toBeGreaterThan(0);
  });

  it('limits missing to the top 10 highest-demand gaps', () => {
    const bigDemand = Array.from({ length: 20 }, (_, i) => ({
      skill: `skill-${i}`,
      count: 20 - i,
    }));
    const { missing } = computeSkillGap([], bigDemand);
    expect(missing).toHaveLength(10);
  });
});
