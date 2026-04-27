import fs from 'fs';
import path from 'path';

/**
 * Deletes a file from the local storage (VPS)
 * @param {string} fileUrl - The full URL or filename of the image
 */
export const deleteFileByUrl = (fileUrl) => {
  if (!fileUrl) return;

  try {
    // 1. Extract filename from URL
    // Example URL: https://assets.dailyfreshkolkata.in/uploads/image-123.jpg
    const filename = fileUrl.split('/').pop();
    if (!filename) return;

    // 2. Resolve path
    const isWindows = process.platform === 'win32';
    const targetDir = process.env.UPLOAD_PATH || (isWindows ? './public/uploads' : '/var/www/dailyfresh/public/uploads');
    const filePath = path.join(path.resolve(targetDir), filename);

    // 3. Check and delete
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[STORAGE] Deleted file: ${filename}`);
    } else {
      console.warn(`[STORAGE] File not found for deletion: ${filename} at ${filePath}`);
    }
  } catch (error) {
    console.error('[STORAGE] Error deleting file:', error.message);
  }
};
