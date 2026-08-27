import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as studentService from '../services/student.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const student = await studentService.getMyProfile(req.user._id);
  new ApiResponse(200, { student }).send(res);
});

export const updateMe = asyncHandler(async (req, res) => {
  const student = await studentService.updateProfile(req.user._id, req.body);
  new ApiResponse(200, { student }, 'Profile updated.').send(res);
});

export const getCompletion = asyncHandler(async (req, res) => {
  const completion = await studentService.getMyCompletion(req.user._id);
  new ApiResponse(200, completion).send(res);
});

export const uploadResume = asyncHandler(async (req, res) => {
  const resume = await studentService.uploadResume(req.user._id, req.file);
  new ApiResponse(201, { resume }, 'Resume uploaded.').send(res);
});

/** Factory: returns a POST handler bound to a specific sub-resource array field. */
export const addItem = (field) =>
  asyncHandler(async (req, res) => {
    const item = await studentService.addItem(req.user._id, field, req.body);
    new ApiResponse(201, { item }, `${field} entry added.`).send(res);
  });

/** Factory: returns a PATCH handler bound to a specific sub-resource array field. */
export const updateItem = (field) =>
  asyncHandler(async (req, res) => {
    const item = await studentService.updateItem(req.user._id, field, req.params.itemId, req.body);
    new ApiResponse(200, { item }, `${field} entry updated.`).send(res);
  });

/** Factory: returns a DELETE handler bound to a specific sub-resource array field. */
export const removeItem = (field) =>
  asyncHandler(async (req, res) => {
    await studentService.removeItem(req.user._id, field, req.params.itemId);
    new ApiResponse(200, null, `${field} entry removed.`).send(res);
  });
