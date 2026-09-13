import { successResponse, errorResponse } from '../../utils/response.js';

export const uploadMedia = async (req, res) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return errorResponse(res, 'No media file provided', 400);
  }

  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

  if (req.file) {
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    return successResponse(res, { url, filename: req.file.filename, size: req.file.size }, 'File uploaded successfully', 201);
  }

  const files = req.files.map(f => ({
    url: `${baseUrl}/uploads/${f.filename}`,
    filename: f.filename,
    size: f.size
  }));

  return successResponse(res, { files }, 'Files uploaded successfully', 201);
};
