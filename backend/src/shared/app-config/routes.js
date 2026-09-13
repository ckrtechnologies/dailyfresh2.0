import express from 'express';
import * as controller from './controller.js';
import { authenticate, authorize } from '../auth/middleware.js';

const router = express.Router();

/**
 * Public Endpoints for mobile apps, web and kiosks
 */
router.get('/config', controller.getAppConfig);
router.get('/version-check', controller.checkVersion);

/**
 * Admin Protected Endpoints
 */
router.put('/settings/:key', authenticate, authorize(['admin']), controller.updateSetting);

export default router;
