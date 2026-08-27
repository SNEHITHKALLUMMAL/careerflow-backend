import { sanitizeItemInput } from '../services/student.service.js';

describe('student.service — sanitizeItemInput (mass-assignment guard)', () => {
  it('strips verified from a skills payload — students cannot self-verify a skill', () => {
    const result = sanitizeItemInput('skills', {
      name: 'React',
      proficiency: 'advanced',
      verified: true,
    });

    expect(result).toEqual({ name: 'React', proficiency: 'advanced' });
    expect(result).not.toHaveProperty('verified');
  });

  it('leaves a legitimate skills payload with no protected fields untouched', () => {
    const result = sanitizeItemInput('skills', { name: 'React', proficiency: 'advanced' });
    expect(result).toEqual({ name: 'React', proficiency: 'advanced' });
  });

  it('does not mutate fields on sub-resources with no protected fields (e.g. education)', () => {
    const input = { degree: 'B.Tech', institution: 'NIT', startYear: 2020 };
    const result = sanitizeItemInput('education', input);
    expect(result).toEqual(input);
  });

  it('does not mutate the caller-supplied object in place', () => {
    const input = { name: 'React', verified: true };
    sanitizeItemInput('skills', input);
    expect(input).toHaveProperty('verified', true); // original object untouched
  });
});
