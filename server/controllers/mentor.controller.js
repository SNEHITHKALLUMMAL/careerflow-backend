import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as mentorService from '../services/mentor.service.js';

export const listMentors = asyncHandler(async (req, res) => {
  const mentors = await mentorService.listMentors(req.user);
  new ApiResponse(200, { mentors }).send(res);
});

export const getMentorStudents = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // A mentor may only ever view their own roster.
  if (req.user.role === 'mentor' && String(req.user._id) !== id) {
    throw ApiError.forbidden("You can only view your own assigned students.");
  }

  const asMentorSelf = req.user.role === 'mentor';
  const result = await mentorService.getMentorStudents(req.user, id, { asMentorSelf });
  new ApiResponse(200, result).send(res);
});

export const assignStudents = asyncHandler(async (req, res) => {
  const { mentorId } = req.params;
  const { studentIds } = req.body;

  const result = await mentorService.assignStudents(req.user, mentorId, studentIds);
  new ApiResponse(200, result, 'Students assigned successfully.').send(res);
});

export const bulkAutoAssign = asyncHandler(async (req, res) => {
  const { mentorIds, departmentId } = req.body;
  const result = await mentorService.bulkAutoAssign(req.user, { mentorIds, departmentId });
  new ApiResponse(200, result, `${result.assignedCount} student(s) auto-assigned.`).send(res);
});

export const unassignStudent = asyncHandler(async (req, res) => {
  const { mentorId, studentId } = req.params;

  await mentorService.unassignStudent(req.user, mentorId, studentId);
  new ApiResponse(200, null, 'Student unassigned successfully.').send(res);
});
