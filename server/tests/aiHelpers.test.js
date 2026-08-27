import { extractJson, summarizeProfile } from '../utils/aiHelpers.js';

describe('extractJson', () => {
  it('parses plain JSON with no fences', () => {
    const result = extractJson('{"a": 1, "b": "two"}');
    expect(result).toEqual({ a: 1, b: 'two' });
  });

  it('strips markdown json fences before parsing', () => {
    const text = '```json\n{"a": 1}\n```';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it('strips plain fences without a language tag', () => {
    const text = '```\n{"a": 1}\n```';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it('handles leading/trailing commentary text around fences', () => {
    const text = 'Here is the result:\n```json\n{"a": 1}\n```\nLet me know if you need more.';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it('throws an ApiError for unparseable text', () => {
    expect(() => extractJson('not json at all')).toThrow();
  });
});

describe('summarizeProfile', () => {
  it('produces a readable summary from a fully populated profile', () => {
    const student = {
      skills: [{ name: 'React', proficiency: 'advanced' }],
      education: [{ degree: 'B.Tech', institution: 'MIT' }],
      projects: [{ title: 'CareerFlow' }],
      internships: [{ role: 'SWE Intern', company: 'Acme' }],
      experience: [],
      careerInterests: ['Backend development'],
    };

    const summary = summarizeProfile(student);

    expect(summary).toContain('React (advanced)');
    expect(summary).toContain('B.Tech at MIT');
    expect(summary).toContain('CareerFlow');
    expect(summary).toContain('SWE Intern at Acme');
    expect(summary).toContain('Backend development');
  });

  it('falls back to "none listed" for every empty section', () => {
    const summary = summarizeProfile({
      skills: [],
      education: [],
      projects: [],
      internships: [],
      experience: [],
      careerInterests: [],
    });

    expect(summary.match(/none listed/g)).toHaveLength(5);
  });

  it('does not throw when array fields are missing entirely', () => {
    expect(() => summarizeProfile({})).not.toThrow();
  });
});
