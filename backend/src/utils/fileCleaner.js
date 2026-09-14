import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getUploadDir = () => {
  if (process.env.UPLOAD_PATH && fs.existsSync(process.env.UPLOAD_PATH)) {
    return path.resolve(process.env.UPLOAD_PATH);
  }
  return path.resolve(path.join(__dirname, '../../public/uploads'));
};

/**
 * Safely delete an uploaded file from disk given its URL or filename.
 * Handles:
 * - Full CDN URLs: https://cdn.dailyfreshkolkata.online/uploads/xyz.jpg
 * - Local API URLs: http://localhost:4002/uploads/xyz.jpg
 * - Relative paths: /uploads/xyz.jpg
 * - Bare filenames: xyz.jpg
 * Safely ignores external CDNs (Unsplash, DiceBear, etc.)
 */
export const deleteFileFromDisk = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return false;

  // Safeguard: Do not attempt to delete external URLs
  if (
    fileUrl.includes('images.unsplash.com') ||
    fileUrl.includes('dicebear.com') ||
    fileUrl.includes('placeholder.com') ||
    fileUrl.includes('via.placeholder')
  ) {
    return false;
  }

  try {
    let filename = fileUrl;
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      const parsed = new URL(filename);
      filename = parsed.pathname;
    }

    filename = filename.replace(/^\/?uploads\//, '').replace(/^\//, '');

    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    if (!safeFilename || safeFilename === '.' || safeFilename === '..') return false;

    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[STORAGE] Deleted orphaned file from disk: ${safeFilename}`);
      return true;
    }
  } catch (err) {
    console.warn(`[STORAGE] Failed to delete file (${fileUrl}):`, err.message);
  }
  return false;
};

/**
 * Batch delete multiple files from disk
 */
export const deleteFilesFromDisk = (urls = []) => {
  if (!Array.isArray(urls)) return;
  urls.forEach(url => deleteFileFromDisk(url));
};
