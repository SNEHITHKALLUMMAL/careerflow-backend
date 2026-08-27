import { Internship } from '../models/Internship.model.js';
import { createListingModule } from './listingModule.service.js';

const FIELDS = [
  'title',
  'description',
  'requiredSkills',
  'location',
  'isRemote',
  'durationMonths',
  'stipend',
  'eligibility',
  'applicationDeadline',
];

const internshipModule = createListingModule(Internship, FIELDS);

export const createInternship = internshipModule.createListing;
export const updateInternship = internshipModule.updateListing;
export const changeInternshipStatus = internshipModule.changeListingStatus;
export const getInternship = internshipModule.getListing;
export const listInternships = internshipModule.listListings;
