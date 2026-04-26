import express from 'express';
import * as authController from '../controllers/authController.js';

import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated routes
router.patch('/profile', authenticate, authController.updateProfile);
router.patch('/password', authenticate, authController.updatePassword);

export default router;
