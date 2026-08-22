import { ApiError } from '../utils/ApiError.js';

/**
 * @param {import('mongoose').Model} Model - Job or Internship
 * @param {{ createFields: string[], updateFields: string[] }} config
 */
export function createListingService(Model, { createFields, updateFields }) {
  async function create(recruiterId, data) {
    const payload = {};
    for (const field of createFields) {
      if (data[field] !== undefined) payload[field] = data[field];
    }
    return Model.create({ ...payload, recruiterId });
  }

  async function findOwned(recruiterId, id) {
    const doc = await Model.findOne({ _id: id, recruiterId });
    if (!doc) throw ApiError.notFound('Listing not found, or you do not have access to it.');
    return doc;
  }

  async function update(recruiterId, id, updates) {
    const doc = await findOwned(recruiterId, id);
    for (const field of updateFields) {
      if (updates[field] !== undefined) doc[field] = updates[field];
    }
    await doc.save();
    return doc;
  }

  async function changeStatus(recruiterId, id, status) {
    const doc = await findOwned(recruiterId, id);
    doc.status = status;
    await doc.save();
    return doc;
  }

  async function getById(id) {
    const doc = await Model.findById(id);
    if (!doc) throw ApiError.notFound('Listing not found.');
    return doc;
  }

  /**
   * @param {{role, _id}} user
   * @param {{search?, status?, page?, limit?, recruiterId?, isRemote?, [k:string]: any}} params
   */
  async function list(
    user,
    { search, status, page = 1, limit = 20, recruiterId, isRemote, ...rest } = {}
  ) {
    const query = {};

    if (user.role === 'student') {
      query.status = 'open'; // students only ever see open listings
    } else if (status) {
      query.status = status;
    }

    if (recruiterId) query.recruiterId = recruiterId;
    if (isRemote !== undefined) query.isRemote = isRemote === true || isRemote === 'true';
    if (search) query.$text = { $search: search };

    Object.assign(query, rest);

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(query),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  return { create, update, changeStatus, getById, list, findOwned };
}
