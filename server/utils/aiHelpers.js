import { ApiError } from './ApiError.js';

/**
 * Gemini sometimes wraps JSON in markdown code fences despite instructions not to.
 * Strips those fences (if present) and parses the result.
 */
export function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const raw = (fenced ? fenced[1] : text).trim();

  try {
    return JSON.parse(raw);
  } catch {
    throw ApiError.internal('The AI returned an unexpected response format. Please try again.');
  }
}

/** Turns a Student profile into a compact plain-text summary for use in AI prompts. */
export function summarizeProfile(student) {
  const skills =
    (student.skills || []).map((s) => `${s.name} (${s.proficiency})`).join(', ') || 'none listed';
  const education =
    (student.education || []).map((e) => `${e.degree} at ${e.institution}`).join('; ') ||
    'none listed';
  const projects = (student.projects || []).map((p) => p.title).join(', ') || 'none listed';
  const experience =
    [...(student.internships || []), ...(student.experience || [])]
      .map((e) => `${e.role} at ${e.company}`)
      .join('; ') || 'none listed';
  const interests = (student.careerInterests || []).join(', ') || 'none listed';

  return [
    `Skills: ${skills}`,
    `Education: ${education}`,
    `Projects: ${projects}`,
    `Experience: ${experience}`,
    `Career interests: ${interests}`,
  ].join('\n');
}
