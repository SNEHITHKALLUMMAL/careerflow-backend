import { createListingService } from '../services/listingFactory.service.js';

/**
 * Builds a fake Mongoose Model whose .find() chain records the query object
 * it was called with, so we can assert on exactly what reaches the database
 * without needing a real MongoDB connection.
 */
function makeFakeModel() {
  let lastQuery = null;
  const chain = {
    sort: () => chain,
    skip: () => chain,
    limit: () => Promise.resolve([]),
  };
  const Model = {
    find: (query) => {
      lastQuery = query;
      return chain;
    },
    countDocuments: () => Promise.resolve(0),
    getLastQuery: () => lastQuery,
  };
  return Model;
}

describe('listingFactory.service — list() query-operator injection guard', () => {
  const recruiterUser = { role: 'recruiter', _id: 'recruiter-1' };

  test('drops an object-typed status filter (Mongo operator injection attempt)', async () => {
    const Model = makeFakeModel();
    const { list } = createListingService(Model, { createFields: [], updateFields: [] });

    // Simulates a request like GET /jobs?status[$ne]=closed — Express's query
    // parser turns that into { status: { $ne: 'closed' } }.
    await list(recruiterUser, { status: { $ne: 'closed' } });

    expect(Model.getLastQuery()).not.toHaveProperty('status');
  });

  test('drops an object-typed recruiterId filter', async () => {
    const Model = makeFakeModel();
    const { list } = createListingService(Model, { createFields: [], updateFields: [] });

    await list(recruiterUser, { recruiterId: { $ne: null } });

    expect(Model.getLastQuery()).not.toHaveProperty('recruiterId');
  });

  test('drops any extra object-typed query param instead of spreading it into the filter', async () => {
    const Model = makeFakeModel();
    const { list } = createListingService(Model, { createFields: [], updateFields: [] });

    await list(recruiterUser, { salaryRange: { $gt: 0 } });

    expect(Model.getLastQuery()).not.toHaveProperty('salaryRange');
  });

  test('still accepts legitimate primitive filters', async () => {
    const Model = makeFakeModel();
    const { list } = createListingService(Model, { createFields: [], updateFields: [] });

    await list(recruiterUser, { status: 'open', recruiterId: 'abc123', isRemote: true });

    const query = Model.getLastQuery();
    expect(query.status).toBe('open');
    expect(query.recruiterId).toBe('abc123');
    expect(query.isRemote).toBe(true);
  });

  test('students are always forced to status: open regardless of what they pass', async () => {
    const Model = makeFakeModel();
    const { list } = createListingService(Model, { createFields: [], updateFields: [] });

    await list({ role: 'student', _id: 's1' }, { status: 'closed' });

    expect(Model.getLastQuery().status).toBe('open');
  });
});
