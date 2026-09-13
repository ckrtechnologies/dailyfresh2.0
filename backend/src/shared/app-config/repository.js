import { db } from '../../db/index.js';
import { settings } from '../../db/schema.js';
import { inArray, eq } from 'drizzle-orm';

/**
 * Fetch all platform settings
 */
export const getAllSettings = async () => {
  return await db.select().from(settings);
};

/**
 * Fetch settings matching specific keys
 */
export const getSettingsByKeys = async (keys) => {
  return await db.select().from(settings).where(inArray(settings.key, keys));
};

/**
 * Get setting by exact key
 */
export const getSettingByKey = async (key) => {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row || null;
};

/**
 * Upsert setting by key
 */
export const upsertSetting = async (key, value, dataType = 'string') => {
  const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const [updated] = await db.insert(settings).values({
    key,
    value: strVal,
    dataType,
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: settings.key,
    set: { value: strVal, dataType, updatedAt: new Date() }
  }).returning();

  return updated;
};
