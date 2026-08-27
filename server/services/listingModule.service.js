import { createListingService } from './listingFactory.service.js';
import { assertCanPostListings, getOwnRecruiterId } from './recruiter.service.js';

/**
 * @param {import('mongoose').Model} Model - Job or Internship
 * @param {string[]} fields - fields creatable/updatable by the recruiter
 */
export function createListingModule(Model, fields) {
  const listingService = createListingService(Model, {
    createFields: fields,
    updateFields: fields,
  });

  async function createListing(userId, data) {
    const recruiter = await assertCanPostListings(userId);
    return listingService.create(recruiter._id, data);
  }

  async function updateListing(userId, id, updates) {
    const recruiterId = await getOwnRecruiterId(userId);
    return listingService.update(recruiterId, id, updates);
  }

  async function changeListingStatus(userId, id, status) {
    const recruiterId = await getOwnRecruiterId(userId);
    return listingService.changeStatus(recruiterId, id, status);
  }

  async function getListing(id) {
    return listingService.getById(id);
  }

  async function listListings(user, params) {
    if (user.role === 'recruiter') {
      // A recruiter only ever sees their own listings (including drafts/closed) — resolved
      // server-side from their own profile, never from a client-supplied recruiterId, which
      // would otherwise let one recruiter browse another's unpublished listings.
      const recruiterId = await getOwnRecruiterId(user._id);
      return listingService.list(user, { ...params, recruiterId });
    }
    return listingService.list(user, params);
  }

  return { createListing, updateListing, changeListingStatus, getListing, listListings };
}
