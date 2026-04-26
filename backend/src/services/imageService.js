import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const uploadPath = process.env.UPLOAD_PATH;
const cdnBase = process.env.CDN_BASE_URL;

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/**
 * Process and Save Image
 * Converts to WebP, resizes (optional), and saves to disk
 */
export const processAndSaveImage = async (buffer, folder = 'general') => {
  try {
    const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const folderPath = path.join(uploadPath, folder);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, filename);

    // Process with Sharp
    await sharp(buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }) // Standard resize for web
      .toFormat('webp')
      .webp({ quality: 85 })
      .toFile(filePath);

    // Return the public CDN URL
    return `${cdnBase}/${folder}/${filename}`;
  } catch (error) {
    console.error('[ImageService Error]', error);
    throw new Error('Image processing failed');
  }
};

/**
 * Delete Image from Disk
 */
export const deleteImage = (imageUrl) => {
  try {
    const relativePath = imageUrl.replace(cdnBase, '');
    const fullPath = path.join(uploadPath, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[ImageDelete Error]', error);
    return false;
  }
};
