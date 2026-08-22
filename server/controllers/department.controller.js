import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as departmentService from '../services/department.service.js';

export const list = asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments(req.user, {
    collegeId: req.query.collegeId,
  });
  new ApiResponse(200, { departments }).send(res);
});
