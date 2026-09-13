import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { profiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'admin@dailyfresh.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'password@1';
const ADMIN_NAME = 'Daily Fresh Admin';
const ADMIN_PHONE = '9999999999';

async function setupAdmin() {
  console.log('--- Daily Fresh: Drizzle Admin Setup ---');

  try {
    const [existingUser] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, ADMIN_EMAIL)).limit(1);

    if (existingUser) {
      console.log(`[Info] Admin user ${ADMIN_EMAIL} already exists in database.`);
      process.exit(0);
    }

    console.log(`[Action] Creating new admin user: ${ADMIN_EMAIL}...`);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const [newProfile] = await db.insert(profiles).values({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      passwordHash,
      role: 'admin',
      authProvider: 'local',
      isActive: true,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ADMIN_NAME)}`
    }).returning();

    console.log(`[Success] Admin profile created with ID: ${newProfile.id}`);
    console.log('--- Setup Complete ---');
    process.exit(0);
  } catch (error) {
    console.error('[Error] Setup failed:', error.message);
    process.exit(1);
  }
}

setupAdmin();
