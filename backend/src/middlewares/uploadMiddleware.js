import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve and ensure directory exists
const isWindows = process.platform === 'win32';
const targetPath = process.env.UPLOAD_PATH || (isWindows ? './public/uploads' : '/var/www/dailyfresh/public/uploads');
const uploadDir = path.resolve(targetPath);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
