import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as departmentService from '../services/department.service.js';

export const list = asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments(req.user, {
    collegeId: req.query.collegeId,
  });
  new ApiResponse(200, { departments }).send(res);
});

export const create = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.user, req.body);
  new ApiResponse(201, { department }, 'Department created.').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.user, req.params.id, req.body);
  new ApiResponse(200, { department }, 'Department updated.').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.user, req.params.id);
  new ApiResponse(200, null, 'Department deleted.').send(res);
});
