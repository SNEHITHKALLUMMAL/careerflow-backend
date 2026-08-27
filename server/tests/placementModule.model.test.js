import mongoose from 'mongoose';
import { Notification } from '../models/Notification.model.js';
import { Drive } from '../models/Drive.model.js';

const fakeId = new mongoose.Types.ObjectId();

describe('Notification model', () => {
  it('requires userId, type, title, and message', () => {
    const notification = new Notification({});
    const err = notification.validateSync();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.type).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.message).toBeDefined();
  });

  it('rejects an invalid type enum value', () => {
    const notification = new Notification({
      userId: fakeId,
      type: 'carrier_pigeon',
      title: 'x',
      message: 'y',
    });
    expect(notification.validateSync().errors.type).toBeDefined();
  });

  it('defaults isRead to false', () => {
    const notification = new Notification({
      userId: fakeId,
      type: 'system',
      title: 'x',
      message: 'y',
    });
    expect(notification.isRead).toBe(false);
  });
});

describe('Drive model', () => {
  it('requires collegeId, recruiterId, jobId, createdBy, and driveDate', () => {
    const drive = new Drive({});
    const err = drive.validateSync();
    expect(err.errors.collegeId).toBeDefined();
    expect(err.errors.recruiterId).toBeDefined();
    expect(err.errors.jobId).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
    expect(err.errors.driveDate).toBeDefined();
  });

  it('defaults status to scheduled', () => {
    const drive = new Drive({
      collegeId: fakeId,
      recruiterId: fakeId,
      jobId: fakeId,
      createdBy: fakeId,
      driveDate: new Date(),
    });
    expect(drive.status).toBe('scheduled');
  });

  it('rejects an invalid status enum value', () => {
    const drive = new Drive({
      collegeId: fakeId,
      recruiterId: fakeId,
      jobId: fakeId,
      createdBy: fakeId,
      driveDate: new Date(),
      status: 'maybe',
    });
    expect(drive.validateSync().errors.status).toBeDefined();
  });
});
