import { computeProfileCompletion } from '../services/scoring.service.js';

function emptyStudent(overrides = {}) {
  return {
    rollNumber: null,
    graduationYear: null,
    departmentId: null,
    education: [],
    skills: [],
    projects: [],
    internships: [],
    experience: [],
    resumeId: null,
    careerInterests: [],
    portfolioUrl: null,
    githubUrl: null,
    linkedinUrl: null,
    ...overrides,
  };
}

describe('computeProfileCompletion', () => {
  it('is 0% for a completely empty profile', () => {
    const { percent, checklist } = computeProfileCompletion(emptyStudent());
    expect(percent).toBe(0);
    expect(checklist).toHaveLength(6);
    expect(checklist.every((item) => item.complete === false)).toBe(true);
  });

  it('is 100% when every checklist item is satisfied', () => {
    const student = emptyStudent({
      rollNumber: 'CS21B045',
      graduationYear: 2026,
      departmentId: '507f1f77bcf86cd799439011',
      education: [{ degree: 'B.Tech' }],
      skills: [{ name: 'JS' }, { name: 'React' }, { name: 'Node' }],
      projects: [{ title: 'CareerFlow' }],
      resumeId: '507f1f77bcf86cd799439012',
      careerInterests: ['Backend development'],
      githubUrl: 'https://github.com/example',
    });

    const { percent, checklist } = computeProfileCompletion(student);
    expect(percent).toBe(100);
    expect(checklist.every((item) => item.complete === true)).toBe(true);
  });

  it('counts experience OR internships OR projects toward the same checklist item', () => {
    const viaInternship = emptyStudent({ internships: [{ company: 'Acme' }] });
    const viaExperience = emptyStudent({ experience: [{ company: 'Acme' }] });

    expect(
      computeProfileCompletion(viaInternship).checklist.find((i) => i.key === 'experience').complete
    ).toBe(true);
    expect(
      computeProfileCompletion(viaExperience).checklist.find((i) => i.key === 'experience').complete
    ).toBe(true);
  });

  it('requires both career interests AND at least one profile link for the links item', () => {
    const interestsOnly = emptyStudent({ careerInterests: ['AI'] });
    const linkOnly = emptyStudent({ linkedinUrl: 'https://linkedin.com/in/example' });
    const both = emptyStudent({
      careerInterests: ['AI'],
      linkedinUrl: 'https://linkedin.com/in/example',
    });

    expect(
      computeProfileCompletion(interestsOnly).checklist.find((i) => i.key === 'links').complete
    ).toBe(false);
    expect(
      computeProfileCompletion(linkOnly).checklist.find((i) => i.key === 'links').complete
    ).toBe(false);
    expect(computeProfileCompletion(both).checklist.find((i) => i.key === 'links').complete).toBe(
      true
    );
  });

  it('requires at least 3 skills, not just 1', () => {
    const oneSkill = emptyStudent({ skills: [{ name: 'JS' }] });
    const threeSkills = emptyStudent({
      skills: [{ name: 'JS' }, { name: 'CSS' }, { name: 'HTML' }],
    });

    expect(
      computeProfileCompletion(oneSkill).checklist.find((i) => i.key === 'skills').complete
    ).toBe(false);
    expect(
      computeProfileCompletion(threeSkills).checklist.find((i) => i.key === 'skills').complete
    ).toBe(true);
  });

  it('rounds the percentage to the nearest whole number', () => {
    // 2 of 6 items complete = 33.33...% -> should round to 33
    const student = emptyStudent({
      education: [{ degree: 'B.Tech' }],
      skills: [{ name: 'JS' }, { name: 'React' }, { name: 'Node' }],
    });
    expect(computeProfileCompletion(student).percent).toBe(33);
  });
});
