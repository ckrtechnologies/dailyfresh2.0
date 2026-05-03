/**
 * Safely parses a JSON string.
 * @param {string} jsonString - The string to parse.
 * @param {any} fallback - The value to return if parsing fails.
 * @returns {any}
 */
export const safeJsonParse = (jsonString, fallback = {}) => {
  try {
    if (!jsonString) return fallback;
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('[SafeUtils] JSON Parse Error:', e);
    return fallback;
  }
};

/**
 * Safely converts a value to a number.
 * @param {any} value - The value to convert.
 * @param {number} fallback - The value to return if conversion fails.
 * @returns {number}
 */
export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Safely formats a number to currency.
 * @param {number|string} amount - The amount to format.
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return `₹${safeNumber(amount).toFixed(2)}`;
};

/**
 * Safely accesses a nested property or returns a fallback.
 * @param {object} obj - The object to traverse.
 * @param {string} path - The path (e.g., 'user.profile.name').
 * @param {any} fallback - Fallback value.
 */
export const getSafe = (obj, path, fallback = null) => {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
};
