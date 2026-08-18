import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as certificateService from '../services/certificate.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const certificates = await certificateService.listMyCertificates(req.user._id);
  new ApiResponse(200, { certificates }).send(res);
});

export const download = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateForDownload(
    req.user._id,
    req.params.id
  );
  res.redirect(certificate.certificateUrl);
});
