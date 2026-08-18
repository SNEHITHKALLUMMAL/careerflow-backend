import mongoose from 'mongoose';
import { Report } from '../models/Report.model.js';

const fakeId = new mongoose.Types.ObjectId();

describe('Report model', () => {
  it('requires scope, ownerId, data, periodStart, and periodEnd', () => {
    const report = new Report({});
    const err = report.validateSync();
    expect(err.errors.scope).toBeDefined();
    expect(err.errors.ownerId).toBeDefined();
    expect(err.errors.data).toBeDefined();
    expect(err.errors.periodStart).toBeDefined();
    expect(err.errors.periodEnd).toBeDefined();
  });

  it('rejects an invalid scope enum value', () => {
    const report = new Report({
      scope: 'yearly',
      ownerId: fakeId,
      data: {},
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    expect(report.validateSync().errors.scope).toBeDefined();
  });

  it('accepts a Mixed data payload of arbitrary shape', () => {
    const report = new Report({
      scope: 'student_weekly',
      ownerId: fakeId,
      data: { score: 72, nested: { a: [1, 2, 3] } },
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    expect(report.validateSync()).toBeUndefined();
    expect(report.data.nested.a).toEqual([1, 2, 3]);
  });
});
