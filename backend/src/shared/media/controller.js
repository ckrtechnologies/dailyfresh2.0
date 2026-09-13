import { successResponse, errorResponse } from "../../utils/response.js";

export const formatAssetUrl = (filename, req = null) => {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  
  const cleanName = filename.startsWith("/uploads/") ? filename.slice(9) : (filename.startsWith("uploads/") ? filename.slice(8) : filename.replace(/^\//, ""));
  
  if (process.env.CDN_BASE_URL) {
    const cdn = process.env.CDN_BASE_URL.replace(/\/+$/, "");
    return cdn.endsWith("/uploads") ? `${cdn}/${cleanName}` : `${cdn}/uploads/${cleanName}`;
  }
  
  if (process.env.API_URL) {
    const apiUrl = process.env.API_URL.replace(/\/+$/, "");
    return `${apiUrl}/uploads/${cleanName}`;
  }

  if (req) {
    const protocol = req.protocol || "http";
    const host = req.get ? req.get("host") : (req.headers?.host || "localhost:4002");
    return `${protocol}://${host}/uploads/${cleanName}`;
  }

  return `/uploads/${cleanName}`;
};

export const uploadMedia = async (req, res) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return errorResponse(res, "No media file provided", 400);
  }

  if (req.file) {
    const url = formatAssetUrl(req.file.filename, req);
    return successResponse(res, { url, filename: req.file.filename, size: req.file.size }, "File uploaded successfully", 201);
  }

  const files = req.files.map(f => ({
    url: formatAssetUrl(f.filename, req),
    filename: f.filename,
    size: f.size
  }));

  return successResponse(res, { files }, "Files uploaded successfully", 201);
};
