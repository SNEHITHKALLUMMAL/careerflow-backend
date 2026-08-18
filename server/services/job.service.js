import { Job } from '../models/Job.model.js';
import { createListingModule } from './listingModule.service.js';

const FIELDS = [
  'title',
  'description',
  'requiredSkills',
  'jobType',
  'location',
  'isRemote',
  'salaryRange',
  'eligibility',
  'applicationDeadline',
];

const jobModule = createListingModule(Job, FIELDS);

export const createJob = jobModule.createListing;
export const updateJob = jobModule.updateListing;
export const changeJobStatus = jobModule.changeListingStatus;
export const getJob = jobModule.getListing;
export const listJobs = jobModule.listListings;
