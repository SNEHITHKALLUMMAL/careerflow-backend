import { Job } from '../models/Job.model.js';
import { Internship } from '../models/Internship.model.js';

/**
 * Counts how often each skill appears across currently-open job and internship
 * postings, case-insensitively. Returns results sorted by demand, descending.
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
    .sort((a, b) => b.count - a.count);
}
