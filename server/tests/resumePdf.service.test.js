import { generateResumePdfBuffer, RESUME_TEMPLATES } from '../services/resumePdf.service.js';

const SAMPLE_DATA = {
  name: 'Asha Verma',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  linkedinUrl: 'https://linkedin.com/in/asha',
  githubUrl: 'https://github.com/asha',
  education: [{ degree: 'B.Tech', institution: 'NIT Calicut', startYear: 2020, endYear: 2024 }],
  skills: [{ name: 'React' }, { name: 'Node.js' }],
  projects: [
    { title: 'CareerFlow', techStack: ['React', 'Node.js'], description: 'A placement platform.' },
  ],
  experience: [],
  internships: [
    { role: 'SWE Intern', company: 'Acme', startDate: '2023-06-01', endDate: '2023-08-01' },
  ],
};

describe('generateResumePdfBuffer', () => {
  it.each(RESUME_TEMPLATES)(
    'produces a valid PDF buffer for the "%s" template',
    async (template) => {
      const buffer = await generateResumePdfBuffer(SAMPLE_DATA, template);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(500);
      // Every valid PDF file starts with this signature.
      expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    }
  );

  it('handles a minimal profile with empty arrays without throwing', async () => {
    const buffer = await generateResumePdfBuffer(
      {
        name: 'Test User',
        email: 't@example.com',
        education: [],
        skills: [],
        projects: [],
        experience: [],
        internships: [],
      },
      'classic'
    );
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });
});
