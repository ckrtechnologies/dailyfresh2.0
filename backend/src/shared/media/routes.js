import express from 'express';
import { upload } from './uploadMiddleware.js';
import * as mediaController from './controller.js';
import { authenticate } from '../auth/middleware.js';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), mediaController.uploadMedia);
router.post('/upload-multiple', authenticate, upload.array('files', 10), mediaController.uploadMedia);

export default router;
