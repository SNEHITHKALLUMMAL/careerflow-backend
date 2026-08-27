import { jest } from '@jest/globals';

const SAMPLE_RESUME_TEXT = `Asha Verma
asha.verma@example.com | +91 98765 43210

Summary
Backend developer with a focus on scalable APIs.

Education
B.Tech Computer Science
NIT Calicut
2020-2024

Experience
Software Engineering Intern
Acme Corp
Built a Node.js and Express API that improved response times by 35%.
• Reduced query latency by 20%
• Automated 10 deployment steps

Skills
JavaScript, Node.js, React, MongoDB, Docker, AWS

Projects
CareerFlow
A React and Node.js placement platform.
`;

describe('pure scoring/extraction functions', () => {
  let mod;

  beforeAll(async () => {
    mod = await import('../services/resumeParser.service.js');
  });

  describe('extractSkills', () => {
    it('finds known skills case-insensitively', () => {
      const skills = mod.extractSkills('I know JAVASCRIPT, react, and Node.js very well.');
      expect(skills).toEqual(expect.arrayContaining(['javascript', 'react', 'node.js']));
    });

    it('does not double-count substring matches', () => {
      const skills = mod.extractSkills('I study javascriptology, not real javascript.');
      expect(skills.filter((s) => s === 'javascript')).toHaveLength(1);
    });

    it('returns an empty array when no known skills are present', () => {
      expect(mod.extractSkills('I enjoy hiking and painting.')).toEqual([]);
    });
  });

  describe('extractSections', () => {
    it('splits resume text into named sections', () => {
      const sections = mod.extractSections(SAMPLE_RESUME_TEXT);
      expect(sections.education.some((l) => l.includes('NIT Calicut'))).toBe(true);
      expect(sections.experience.some((l) => l.includes('Acme Corp'))).toBe(true);
      expect(sections.skills.some((l) => l.includes('JavaScript'))).toBe(true);
    });
  });

  describe('computeAtsScore', () => {
    it('scores a well-formed resume highly', () => {
      const sections = mod.extractSections(SAMPLE_RESUME_TEXT);
      const skills = mod.extractSkills(SAMPLE_RESUME_TEXT);
      const { score } = mod.computeAtsScore(SAMPLE_RESUME_TEXT, sections, skills.length);
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('scores a minimal resume low and explains why', () => {
      const minimal = 'Just some text with no structure.';
      const sections = mod.extractSections(minimal);
      const { score, notes } = mod.computeAtsScore(minimal, sections, 0);
      expect(score).toBeLessThan(40);
      expect(notes.some((n) => n.includes('email'))).toBe(true);
    });

    it('never exceeds 100 or goes below 0', () => {
      const sections = mod.extractSections(SAMPLE_RESUME_TEXT);
      const { score } = mod.computeAtsScore(SAMPLE_RESUME_TEXT.repeat(5), sections, 20);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('grammarSuggestions', () => {
    it('flags first-person pronouns', () => {
      const suggestions = mod.grammarSuggestions('I led a team of 5 engineers on my project.');
      expect(suggestions.some((s) => s.includes('first-person'))).toBe(true);
    });

    it('flags passive voice phrasing', () => {
      const suggestions = mod.grammarSuggestions('The project was completed by the team.');
      expect(suggestions.some((s) => s.includes('passive'))).toBe(true);
    });

    it('returns a positive message when nothing is flagged', () => {
      const suggestions = mod.grammarSuggestions('Led backend development for a new platform.');
      expect(suggestions).toContain('No major issues found — nice work!');
    });
  });

  describe('keywordSuggestions', () => {
    it('suggests related skills from the same category, excluding what is already listed', () => {
      const suggestions = mod.keywordSuggestions(['react']);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).not.toContain('react');
    });

    it('returns suggestions even when no skills are matched', () => {
      expect(mod.keywordSuggestions([]).length).toBeGreaterThan(0);
    });
  });

  describe('analyzeStructuredResume (used by the resume builder)', () => {
    it('scores structured profile data without ever generating or parsing a PDF', () => {
      const result = mod.analyzeStructuredResume({
        name: 'Asha Verma',
        email: 'asha@example.com',
        phone: '+91 98765 43210',
        education: [
          { degree: 'B.Tech', institution: 'NIT Calicut', startYear: 2020, endYear: 2024 },
        ],
        skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'MongoDB' }],
        projects: [{ title: 'CareerFlow', description: 'Improved matching accuracy by 20%.' }],
        experience: [],
        internships: [
          { role: 'SWE Intern', company: 'Acme', description: 'Automated 10 deployment steps.' },
        ],
      });

      expect(result.atsScore).toBeGreaterThan(0);
      expect(result.atsScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.grammarSuggestions)).toBe(true);
      expect(Array.isArray(result.keywordSuggestions)).toBe(true);
      expect(result.rawText).toContain('Asha Verma');
    });

    it('scores an empty profile low', () => {
      const result = mod.analyzeStructuredResume({ name: 'Test User', email: null });
      expect(result.atsScore).toBeLessThan(40);
    });
  });
});

describe('extractTextFromBuffer (library dispatch, mocked)', () => {
  const MOCK_PDF_TEXT = 'Extracted PDF text content';
  const MOCK_DOCX_TEXT = 'Extracted DOCX text content';

  beforeEach(() => {
    jest.resetModules();
  });

  it('routes PDF mimetypes to pdf-parse', async () => {
    jest.unstable_mockModule('pdf-parse', () => ({
      default: jest.fn(async () => ({ text: MOCK_PDF_TEXT })),
    }));
    jest.unstable_mockModule('mammoth', () => ({
      default: { extractRawText: jest.fn() },
    }));

    const { extractTextFromBuffer } = await import('../services/resumeParser.service.js');
    const text = await extractTextFromBuffer(Buffer.from('fake'), 'application/pdf');
    expect(text).toBe(MOCK_PDF_TEXT);
  });

  it('routes DOCX mimetypes to mammoth', async () => {
    jest.unstable_mockModule('pdf-parse', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('mammoth', () => ({
      default: {
        extractRawText: jest.fn(async () => ({ value: MOCK_DOCX_TEXT })),
      },
    }));

    const { extractTextFromBuffer } = await import('../services/resumeParser.service.js');
    const text = await extractTextFromBuffer(
      Buffer.from('fake'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(text).toBe(MOCK_DOCX_TEXT);
  });

  it('returns an empty string for unsupported mimetypes without calling either library', async () => {
    const pdfParseFn = jest.fn();
    const mammothFn = jest.fn();
    jest.unstable_mockModule('pdf-parse', () => ({ default: pdfParseFn }));
    jest.unstable_mockModule('mammoth', () => ({ default: { extractRawText: mammothFn } }));

    const { extractTextFromBuffer } = await import('../services/resumeParser.service.js');
    const text = await extractTextFromBuffer(Buffer.from('fake'), 'image/png');

    expect(text).toBe('');
    expect(pdfParseFn).not.toHaveBeenCalled();
    expect(mammothFn).not.toHaveBeenCalled();
  });
});

describe('analyzeResumeText (orchestration, with extraction mocked)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('assembles a full analysis from extracted text', async () => {
    jest.unstable_mockModule('pdf-parse', () => ({
      default: jest.fn(async () => ({ text: SAMPLE_RESUME_TEXT })),
    }));
    jest.unstable_mockModule('mammoth', () => ({ default: { extractRawText: jest.fn() } }));

    const { analyzeResumeText } = await import('../services/resumeParser.service.js');
    const result = await analyzeResumeText(Buffer.from('fake'), 'application/pdf');

    expect(result.rawText).toBe(SAMPLE_RESUME_TEXT);
    expect(result.extractedSkills).toEqual(
      expect.arrayContaining(['javascript', 'react', 'node.js'])
    );
    expect(result.extractedEducation.some((l) => l.includes('NIT Calicut'))).toBe(true);
    expect(result.atsScore).toBeGreaterThan(0);
  });

  it('returns a safe empty result when the underlying library throws', async () => {
    jest.unstable_mockModule('pdf-parse', () => ({
      default: jest.fn(async () => {
        throw new Error('corrupt PDF');
      }),
    }));
    jest.unstable_mockModule('mammoth', () => ({ default: { extractRawText: jest.fn() } }));

    const { analyzeResumeText } = await import('../services/resumeParser.service.js');
    const result = await analyzeResumeText(Buffer.from('fake'), 'application/pdf');

    expect(result.rawText).toBe('');
    expect(result.atsScore).toBeNull();
    expect(result.extractedSkills).toEqual([]);
  });
});
