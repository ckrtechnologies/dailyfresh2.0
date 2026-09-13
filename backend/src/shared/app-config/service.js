import * as appConfigRepo from './repository.js';

// In-memory cache for fast config lookups (TTL: 60 seconds)
let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Compare two semver strings (e.g., "1.0.3" vs "1.1.0")
 * Returns true if v1 is strictly older than v2 (v1 < v2)
 */
export const isVersionOlder = (v1, v2) => {
  if (!v1 || !v2) return false;
  const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 < num2) return true;
    if (num1 > num2) return false;
  }
  return false;
};

/**
 * Invalidate the in-memory settings cache (called on admin updates)
 */
export const invalidateConfigCache = () => {
  cachedConfig = null;
  cacheTimestamp = 0;
};

/**
 * Fetch all operational settings
 */
export const getPublicConfig = async () => {
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedConfig;
  }

  const allSettings = await appConfigRepo.getAllSettings();
  const configMap = {};

  for (const s of allSettings) {
    let parsedVal = s.value;
    if (s.dataType === 'number') parsedVal = Number(s.value);
    else if (s.dataType === 'boolean') parsedVal = s.value === 'true' || s.value === '1';
    else if (s.dataType === 'json') {
      try {
        parsedVal = JSON.parse(s.value);
      } catch {
        parsedVal = s.value;
      }
    }
    configMap[s.key] = parsedVal;
  }

  const formatted = {
    currency: configMap['currency'] || 'INR',
    currency_symbol: configMap['currency_symbol'] || '₹',
    gst_rate: configMap['gst_rate'] !== undefined ? configMap['gst_rate'] : 5,
    min_order_value: configMap['min_order_value'] !== undefined ? configMap['min_order_value'] : 99,
    free_delivery_threshold: configMap['free_delivery_threshold'] !== undefined ? configMap['free_delivery_threshold'] : 499,
    default_delivery_charge: configMap['default_delivery_charge'] !== undefined ? configMap['default_delivery_charge'] : 60,
    support_phone: configMap['support_phone'] || '+91 98765 43210',
    support_email: configMap['support_email'] || 'support@dailyfreshkolkata.online',
    support_whatsapp: configMap['support_whatsapp'] || '+91 98765 43210',
    delivery_slots_config: configMap['delivery_slots_config'] || {},
    maintenance: configMap['maintenance_mode'] || { is_active: false, message: '' }
  };

  cachedConfig = formatted;
  cacheTimestamp = now;
  return formatted;
};

/**
 * Check App Version Policy (Mandatory Non-Skippable Update check)
 */
export const checkAppVersionPolicy = async ({ app = 'customer', platform = 'android', current_version = '1.0.0' }) => {
  const cleanApp = ['customer', 'rider', 'store'].includes(app.toLowerCase()) ? app.toLowerCase() : 'customer';
  const cleanPlatform = ['ios', 'android'].includes(platform.toLowerCase()) ? platform.toLowerCase() : 'android';
  const settingKey = `app_version_${cleanApp}_${cleanPlatform}`;

  const rows = await appConfigRepo.getSettingsByKeys([settingKey, 'maintenance_mode']);

  let policy = {
    min_supported_version: '1.0.0',
    latest_version: '1.0.0',
    force_update: false,
    update_url: '',
    title: 'Update Available',
    message: 'A new version of the app is available.'
  };

  let maintenance = { is_active: false, message: '' };

  for (const r of rows) {
    if (r.key === settingKey && r.value) {
      try {
        policy = { ...policy, ...JSON.parse(r.value) };
      } catch (err) {
        console.error(`[VersionCheck] Failed to parse ${settingKey}:`, err.message);
      }
    } else if (r.key === 'maintenance_mode' && r.value) {
      try {
        maintenance = JSON.parse(r.value);
      } catch (err) {
        console.error('[VersionCheck] Failed to parse maintenance_mode:', err.message);
      }
    }
  }

  const isForceRequired = isVersionOlder(current_version, policy.min_supported_version);
  const isUpdateAvailable = isVersionOlder(current_version, policy.latest_version);

  return {
    app: cleanApp,
    platform: cleanPlatform,
    current_version,
    min_supported_version: policy.min_supported_version,
    latest_version: policy.latest_version,
    force_update: isForceRequired,
    update_available: isUpdateAvailable || isForceRequired,
    update_url: policy.update_url,
    title: isForceRequired ? (policy.force_title || 'Mandatory Update Required') : policy.title,
    message: isForceRequired 
      ? (policy.force_message || 'This version of the app is no longer supported. You must update to continue.') 
      : policy.message,
    maintenance_mode: maintenance.is_active === true,
    maintenance_message: maintenance.message || ''
  };
};

/**
 * Update any setting dynamically (for Admin use)
 */
export const updateSettingValue = async (key, value, dataType = 'string') => {
  const updated = await appConfigRepo.upsertSetting(key, value, dataType);
  invalidateConfigCache();
  return updated;
};
