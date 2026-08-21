import mongoose from 'mongoose';
import { Recruiter } from '../models/Recruiter.model.js';
import { Job } from '../models/Job.model.js';
import { Internship } from '../models/Internship.model.js';
import { Application } from '../models/Application.model.js';

const fakeUserId = new mongoose.Types.ObjectId();
const fakeRecruiterId = new mongoose.Types.ObjectId();
const fakeStudentId = new mongoose.Types.ObjectId();
const fakeTargetId = new mongoose.Types.ObjectId();

describe('Recruiter model', () => {
  it('requires userId but allows companyName to be unset (lazy-created profile)', () => {
    const recruiter = new Recruiter({ userId: fakeUserId });
    expect(recruiter.validateSync()).toBeUndefined();
    expect(recruiter.companyName).toBeNull();
    expect(recruiter.isVerified).toBe(false);
  });

  it('rejects a recruiter with no userId', () => {
    const recruiter = new Recruiter({});
    expect(recruiter.validateSync().errors.userId).toBeDefined();
  });
});

describe('Job model', () => {
  it('requires recruiterId, title, description, and jobType', () => {
    const job = new Job({});
    const err = job.validateSync();
    expect(err.errors.recruiterId).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.jobType).toBeDefined();
  });

  it('rejects an invalid jobType', () => {
    const job = new Job({
      recruiterId: fakeRecruiterId,
      title: 'SWE',
      description: 'desc',
      jobType: 'freelance',
    });
    expect(job.validateSync().errors.jobType).toBeDefined();
  });

  it('defaults status to draft and isRemote to false', () => {
    const job = new Job({
      recruiterId: fakeRecruiterId,
      title: 'SWE',
      description: 'desc',
      jobType: 'full-time',
    });
    expect(job.status).toBe('draft');
    expect(job.isRemote).toBe(false);
  });
});

describe('Internship model', () => {
  it('requires recruiterId, title, and description (no jobType)', () => {
    const internship = new Internship({});
    const err = internship.validateSync();
    expect(err.errors.recruiterId).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
  });

  it('rejects a durationMonths outside 1-24', () => {
    const internship = new Internship({
      recruiterId: fakeRecruiterId,
      title: 'Intern',
      description: 'desc',
      durationMonths: 36,
    });
    expect(internship.validateSync().errors.durationMonths).toBeDefined();
  });
});

describe('Application model', () => {
  it('requires studentId, targetType, targetModel, and targetId', () => {
    const application = new Application({});
    const err = application.validateSync();
    expect(err.errors.studentId).toBeDefined();
    expect(err.errors.targetType).toBeDefined();
    expect(err.errors.targetModel).toBeDefined();
    expect(err.errors.targetId).toBeDefined();
  });

  it('defaults status to applied', () => {
    const application = new Application({
      studentId: fakeStudentId,
      targetType: 'job',
      targetModel: 'Job',
      targetId: fakeTargetId,
    });
    expect(application.status).toBe('applied');
  });

  it('rejects an invalid targetType/targetModel combination value', () => {
    const application = new Application({
      studentId: fakeStudentId,
      targetType: 'gig', // not job/internship
      targetModel: 'Job',
      targetId: fakeTargetId,
    });
    expect(application.validateSync().errors.targetType).toBeDefined();
  });

  it('rejects an invalid interview mode', () => {
    const application = new Application({
      studentId: fakeStudentId,
      targetType: 'job',
      targetModel: 'Job',
      targetId: fakeTargetId,
      interview: { mode: 'telepathy' },
    });
    expect(application.validateSync().errors['interview.mode']).toBeDefined();
  });
});
