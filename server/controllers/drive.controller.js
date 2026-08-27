import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as driveService from '../services/drive.service.js';

export const create = asyncHandler(async (req, res) => {
  const drive = await driveService.createDrive(req.user, req.body);
  new ApiResponse(201, { drive }, 'Drive scheduled.').send(res);
});

export const list = asyncHandler(async (req, res) => {
  const drives = await driveService.listDrives(req.user);
  new ApiResponse(200, { drives }).send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const drive = await driveService.getDrive(req.user, req.params.id);
  new ApiResponse(200, { drive }).send(res);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const drive = await driveService.updateDriveStatus(req.user, req.params.id, req.body.status);
  new ApiResponse(200, { drive }, 'Drive status updated.').send(res);
});

export const eligibleStudents = asyncHandler(async (req, res) => {
  const students = await driveService.getEligibleStudents(req.user, req.params.id);
  new ApiResponse(200, { students }).send(res);
});
