import { Job } from '../models/Job.model.js';
import { Internship } from '../models/Internship.model.js';

const TOP_N_SKILLS = 25; // headroom above every current caller's own top-10/15 slice

/**
 * Counts how often each skill appears across currently-open job and internship
 * postings, case-insensitively. Returns the top skills by demand, descending —
 * every current caller only ever uses the top 10-15 anyway, so this is capped
 * at the source rather than sorting and returning the entire (potentially
 * large, since requiredSkills is free text) skill universe on every call.
 */
export async function getMarketDemandSkills() {
  const [jobSkills, internshipSkills] = await Promise.all([
    Job.aggregate([
      { $match: { status: 'open' } },
      { $unwind: '$requiredSkills' },
      { $group: { _id: { $toLower: '$requiredSkills' }, count: { $sum: 1 } } },
    ]),
    Internship.aggregate([
      { $match: { status: 'open' } },
      { $unwind: '$requiredSkills' },
      { $group: { _id: { $toLower: '$requiredSkills' }, count: { $sum: 1 } } },
    ]),
  ]);

  const demandMap = new Map();
  for (const { _id: skill, count } of [...jobSkills, ...internshipSkills]) {
    demandMap.set(skill, (demandMap.get(skill) || 0) + count);
  }

  return [...demandMap.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N_SKILLS);
}
