import * as configService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

/**
 * GET /api/v1/app/config
 * Returns all live operational settings (currency, GST, delivery thresholds, contact info)
 */
export const getAppConfig = async (req, res) => {
  try {
    const config = await configService.getPublicConfig();
    return successResponse(res, { config }, 'Application configuration loaded');
  } catch (error) {
    console.error('[GetAppConfig Error]:', error);
    return errorResponse(res, 'Failed to fetch application config', 500, error.message);
  }
};

/**
 * GET /api/v1/app/version-check
 * Evaluates mandatory unskippable force updates & maintenance mode
 * Query params: ?app=customer&platform=android&version=1.0.0 (or current_version=1.0.0)
 */
export const checkVersion = async (req, res) => {
  let { app = 'customer', platform = 'android', current_version, version } = req.query;

  // Support composite platform parameter like platform=customer_android
  if (platform && platform.includes('_')) {
    const parts = platform.split('_');
    app = parts[0];
    platform = parts[1];
  }

  const resolvedVersion = version || current_version || '1.0.0';

  try {
    const result = await configService.checkAppVersionPolicy({
      app,
      platform,
      current_version: resolvedVersion
    });

    return successResponse(res, result, 'Version check completed');
  } catch (error) {
    console.error('[CheckVersion Error]:', error);
    return errorResponse(res, 'Failed to evaluate version policy', 500, error.message);
  }
};

/**
 * PUT /api/v1/app/settings/:key
 * Update an operational setting (Admin only)
 */
export const updateSetting = async (req, res) => {
  const { key } = req.params;
  const { value, data_type = 'string' } = req.body;

  if (value === undefined) {
    return errorResponse(res, 'Value is required', 400);
  }

  try {
    const updated = await configService.updateSettingValue(key, value, data_type);
    return successResponse(res, { setting: updated }, `Setting "${key}" updated successfully`);
  } catch (error) {
    console.error('[UpdateSetting Error]:', error);
    return errorResponse(res, 'Failed to update setting', 500, error.message);
  }
};
