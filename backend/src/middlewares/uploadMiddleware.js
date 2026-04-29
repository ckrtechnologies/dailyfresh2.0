import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve and ensure directory exists
const isWindows = process.platform === 'win32';
let uploadDir;
try {
  const targetPath = process.env.UPLOAD_PATH || (isWindows ? './public/uploads' : '/var/www/dailyfresh/public/uploads');
  uploadDir = path.resolve(targetPath);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.warn(`[STORAGE] Failed to use UPLOAD_PATH (${process.env.UPLOAD_PATH}). Falling back to local ./public/uploads`);
  uploadDir = path.resolve('./public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
console.log(`[STORAGE] Upload directory active at: ${uploadDir}`);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
