import { db } from '../../db/index.js';
import { profiles, stores } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Find user profile by email address
 */
export const findByEmail = async (email) => {
  const [user] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  return user || null;
};

/**
 * Find user profile by primary UUID
 */
export const findById = async (id) => {
  const [user] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return user || null;
};

/**
 * Create a new user profile
 */
export const createProfile = async (profileData) => {
  const [newProfile] = await db.insert(profiles).values(profileData).returning();
  return newProfile;
};

/**
 * Update existing profile by ID
 */
export const updateProfile = async (id, updateData) => {
  const [updated] = await db.update(profiles)
    .set(updateData)
    .where(eq(profiles.id, id))
    .returning();
  return updated || null;
};

/**
 * Find store assigned to a store manager user ID
 */
export const findStoreByManagerUserId = async (managerUserId) => {
  const [store] = await db.select({ id: stores.id })
    .from(stores)
    .where(eq(stores.managerUserId, managerUserId))
    .limit(1);
  return store || null;
};
