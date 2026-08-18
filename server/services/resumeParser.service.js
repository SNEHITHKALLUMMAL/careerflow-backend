import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const PDF_MIME = 'application/pdf';
const DOC_MIMES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Extracts raw text from an uploaded resume buffer, based on its mimetype. */
export async function extractTextFromBuffer(buffer, mimetype) {
  if (mimetype === PDF_MIME) {
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (DOC_MIMES.has(mimetype)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  return '';
}

const SKILL_CATEGORIES = {
  frontend: [
    'react',
    'vue',
    'angular',
    'html',
    'css',
    'tailwind',
    'javascript',
    'typescript',
    'redux',
    'next.js',
  ],
  backend: [
    'node.js',
    'express',
    'django',
    'flask',
    'spring',
    'java',
    'python',
    'ruby on rails',
    '.net',
    'fastapi',
  ],
  database: ['mongodb', 'mysql', 'postgresql', 'sql', 'redis', 'sqlite', 'oracle', 'dynamodb'],
  devops: [
    'docker',
    'kubernetes',
    'aws',
    'azure',
    'gcp',
    'ci/cd',
    'jenkins',
    'terraform',
    'linux',
    'git',
  ],
  dataAndAi: [
    'machine learning',
    'tensorflow',
    'pytorch',
    'pandas',
    'numpy',
    'data structures',
    'algorithms',
  ],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Finds which known IT skills appear in the resume text (case-insensitive, whole-word/phrase). */
export function extractSkills(text) {
  const lower = text.toLowerCase();
  return ALL_SKILLS.filter((skill) => new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(lower));
}

const SECTION_HEADERS = [
  'education',
  'experience',
  'work experience',
  'employment',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'summary',
  'objective',
];

/** Best-effort split of resume text into named sections based on common resume headers. */
export function extractSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = { header: [] };
  let current = 'header';

  for (const line of lines) {
    const normalized = line
      .toLowerCase()
      .replace(/[^a-z ]/g, '')
      .trim();
    const matchedHeader = SECTION_HEADERS.find((h) => normalized === h);

    if (matchedHeader && line.length < 40) {
      current = matchedHeader;
      sections[current] = sections[current] || [];
      continue;
    }
    if (line) {
      sections[current] = sections[current] || [];
      sections[current].push(line);
    }
  }

  return sections;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
const BULLET_REGEX = /^[•*-]\s+/m;
const ACHIEVEMENT_NUMBER_REGEX = /\b\d+(\.\d+)?%?\b/g;

/**
 * Rule-based ATS score out of 100. Deliberately deterministic (not AI-based) — this
 * mirrors how most real ATS-compatibility checkers work, and keeps the score
 * consistent, explainable, and testable without a network dependency.
 */
export function computeAtsScore(text, sections, skillCount) {
  const notes = [];
  let score = 0;

  if (EMAIL_REGEX.test(text)) {
    score += 15;
  } else {
    notes.push('Add a professional email address.');
  }

  if (PHONE_REGEX.test(text)) {
    score += 10;
  } else {
    notes.push('Add a phone number.');
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 300 && wordCount <= 1200) {
    score += 15;
  } else if (wordCount < 300) {
    score += Math.round((wordCount / 300) * 15);
    notes.push('Your resume looks short — add more detail on projects and experience.');
  } else {
    score += 8;
    notes.push('Your resume looks long — consider trimming it to 1-2 pages.');
  }

  const requiredSections = ['education', 'experience', 'skills', 'projects'];
  const presentSections = requiredSections.filter((s) => (sections[s] || []).length > 0);
  score += Math.round((presentSections.length / requiredSections.length) * 15);
  const missingSections = requiredSections.filter((s) => !presentSections.includes(s));
  if (missingSections.length > 0) {
    notes.push(`Add a clear section for: ${missingSections.join(', ')}.`);
  }

  const achievementMatches = (text.match(ACHIEVEMENT_NUMBER_REGEX) || []).length;
  if (achievementMatches >= 3) {
    score += 15;
  } else {
    score += achievementMatches * 5;
    notes.push('Quantify your achievements with numbers or percentages where possible.');
  }

  if (BULLET_REGEX.test(text)) {
    score += 10;
  } else {
    notes.push('Use bullet points to list responsibilities and achievements.');
  }

  score += Math.min(20, skillCount * 2);
  if (skillCount < 5) {
    notes.push('List more relevant technical skills so keyword matching picks them up.');
  }

  return { score: Math.min(100, Math.max(0, Math.round(score))), notes };
}

/** Rule-based grammar/style suggestions. */
export function grammarSuggestions(text) {
  const suggestions = [];

  if (/\b(I|my|me)\b/i.test(text)) {
    suggestions.push(
      'Avoid first-person pronouns ("I", "my") — resumes typically use implied-subject, action-verb phrasing.'
    );
  }

  if (/\b(was|were)\s+\w+ed\b/i.test(text)) {
    suggestions.push(
      'Some phrasing looks passive (e.g. "was responsible for") — use active verbs instead ("Led", "Built", "Managed").'
    );
  }

  const longLines = text.split(/\r?\n/).filter((l) => l.length > 180);
  if (longLines.length > 0) {
    suggestions.push(
      'Some lines are quite long — break them into shorter, scannable bullet points.'
    );
  }

  if (suggestions.length === 0) {
    suggestions.push('No major issues found — nice work!');
  }

  return suggestions;
}

/** Suggests skills from categories the student already has some presence in, that aren't yet listed. */
export function keywordSuggestions(matchedSkills) {
  const matchedSet = new Set(matchedSkills.map((s) => s.toLowerCase()));
  const relevantCategories = Object.values(SKILL_CATEGORIES).filter((skills) =>
    skills.some((s) => matchedSet.has(s))
  );
  const pool = relevantCategories.length
    ? relevantCategories.flat()
    : Object.values(SKILL_CATEGORIES).flat();

  const suggestions = [];
  for (const skill of pool) {
    if (!matchedSet.has(skill) && !suggestions.includes(skill)) {
      suggestions.push(skill);
    }
    if (suggestions.length >= 5) break;
  }

  return suggestions;
}

/**
 * Runs the full parsing + scoring pipeline on a resume buffer. Never throws for
 * unreadable/malformed content — returns a low-confidence empty result instead,
 * so a parsing hiccup never blocks the upload itself.
 */
export async function analyzeResumeText(buffer, mimetype) {
  let rawText = '';
  try {
    rawText = await extractTextFromBuffer(buffer, mimetype);
  } catch {
    rawText = '';
  }

  if (!rawText.trim()) {
    return {
      rawText: '',
      extractedSkills: [],
      extractedEducation: [],
      extractedExperience: [],
      atsScore: null,
      grammarSuggestions: [],
      keywordSuggestions: [],
    };
  }

  const sections = extractSections(rawText);
  const skills = extractSkills(rawText);
  const { score, notes } = computeAtsScore(rawText, sections, skills.length);

  return {
    rawText,
    extractedSkills: skills,
    extractedEducation: sections.education || [],
    extractedExperience: [
      ...(sections.experience || []),
      ...(sections['work experience'] || []),
      ...(sections.employment || []),
    ],
    atsScore: score,
    grammarSuggestions: [...grammarSuggestions(rawText), ...notes],
    keywordSuggestions: keywordSuggestions(skills),
  };
}

/**
 * Renders the resume builder's structured profile data into resume-shaped plain
 * text, so it can be scored with the exact same functions used for uploaded
 * resumes — rather than generating a PDF and parsing it back, which is both
 * wasteful (the structured data is already known) and fragile (see
 * analyzeStructuredResume's doc comment below for why round-tripping through
 * a freshly-generated PDF isn't safe here).
 */
export function structuredDataToText(data) {
  const lines = [data.name || '', [data.email, data.phone].filter(Boolean).join(' | '), ''];

  if ((data.education || []).length) {
    lines.push('EDUCATION');
    for (const e of data.education) {
      lines.push(`${e.degree} - ${e.institution} ${e.startYear || ''}-${e.endYear || ''}`);
    }
    lines.push('');
  }

  if ((data.skills || []).length) {
    lines.push('SKILLS');
    lines.push(data.skills.map((s) => s.name).join(', '));
    lines.push('');
  }

  const workEntries = [...(data.experience || []), ...(data.internships || [])];
  if (workEntries.length) {
    lines.push('EXPERIENCE');
    for (const w of workEntries) {
      lines.push(`${w.role} - ${w.company}`);
      if (w.description) lines.push(`• ${w.description}`);
    }
    lines.push('');
  }

  if ((data.projects || []).length) {
    lines.push('PROJECTS');
    for (const p of data.projects) {
      lines.push(p.title);
      if (p.description) lines.push(`• ${p.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Scores a resume the builder is about to generate (or just generated) directly
 * from its structured data — deliberately does NOT generate a PDF and parse it
 * back through pdf-parse. pdf-parse's vendored PDF.js cannot reliably read
 * pdfkit's output (confirmed independently: even a minimal hand-built PDF trips
 * the same "bad XRef entry" error), so re-parsing our own generated file is
 * both unnecessary — the structured data is already on hand — and unsafe.
 */
export function analyzeStructuredResume(data) {
  const text = structuredDataToText(data);
  const sections = extractSections(text);
  const skillNames = (data.skills || []).map((s) => s.name.toLowerCase());
  const { score, notes } = computeAtsScore(text, sections, skillNames.length);

  return {
    rawText: text,
    atsScore: score,
    grammarSuggestions: [...grammarSuggestions(text), ...notes],
    keywordSuggestions: keywordSuggestions(skillNames),
  };
}
