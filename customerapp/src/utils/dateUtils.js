/**
 * Safe Date Formatting Utilities
 * Guarantees zero "RangeError: Invalid time value" crashes across Hermes / Android / iOS
 */

/**
 * Parses any date input safely into a valid Date object or null
 * Handles ISO strings, Postgres space-separated timestamps ('YYYY-MM-DD HH:mm:ss'), timestamps, etc.
 */
export const parseSafeDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Fix Postgres space-delimited timestamps 'YYYY-MM-DD HH:mm:ss' to 'YYYY-MM-DDTHH:mm:ss'
    const normalized = trimmed.includes(' ') && !trimmed.includes('T')
      ? trimmed.replace(' ', 'T')
      : trimmed;

    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;

    // Fallback: try raw Date
    const raw = new Date(trimmed);
    if (!isNaN(raw.getTime())) return raw;
  }
  return null;
};

/**
 * Format a date safely into human readable date: e.g. "14 Sep 2026"
 */
export const formatSafeDate = (val, fallback = '') => {
  const d = parseSafeDate(val);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return fallback;
  }
};

/**
 * Format a time safely: e.g. "10:30 AM"
 */
export const formatSafeTime = (val, fallback = '') => {
  const d = parseSafeDate(val);
  if (!d) return fallback;
  try {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return fallback;
  }
};

/**
 * Format both date and time: e.g. "14 Sep 2026 • 10:30 AM"
 */
export const formatSafeDateTime = (val, fallback = 'Recently') => {
  const d = parseSafeDate(val);
  if (!d) return fallback;
  try {
    const datePart = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  } catch (e) {
    return fallback;
  }
};

/**
 * Calculate relative time safely without throwing
 */
export const safeDistanceToNow = (val, fallback = 'Just now') => {
  const d = parseSafeDate(val);
  if (!d) return fallback;
  try {
    const now = Date.now();
    const diffSecs = Math.floor((now - d.getTime()) / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatSafeDate(d, fallback);
  } catch (e) {
    return fallback;
  }
};
