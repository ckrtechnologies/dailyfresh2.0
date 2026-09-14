import { db } from '../../db/index.js';
import { notifications, profiles, riders } from '../../db/schema.js';
import { eq, and, desc, or, isNull } from 'drizzle-orm';

export const createNotification = async (data) => {
  const [row] = await db.insert(notifications).values(data).returning();
  return row;
};

export const getUserFcmProfile = async (userId) => {
  const [profile] = await db
    .select({
      fcmToken: profiles.fcmToken,
      avatarUrl: profiles.avatarUrl,
      fullName: profiles.fullName
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile || null;
};

export const getActiveUserProfilesByRole = async (role) => {
  return await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.role, role), eq(profiles.isActive, true)));
};

export const getAllActiveUserProfiles = async () => {
  return await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.isActive, true));
};

export const getOnlineApprovedRidersWithProfile = async () => {
  return await db.query.riders.findMany({
    where: and(
      eq(riders.isOnline, true),
      eq(riders.approvalStatus, 'approved')
    ),
    with: {
      profile: true
    }
  });
};

export const getUserNotifications = async (userId, limit = 50, offset = 0) => {
  return await db
    .select()
    .from(notifications)
    .where(or(eq(notifications.userId, userId), isNull(notifications.userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
};

export const markAsRead = async (id, userId) => {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();
  return updated || null;
};

export const getAllNotifications = async (limit = 100, offset = 0) => {
  return await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      title: notifications.title,
      body: notifications.body,
      type: notifications.type,
      data: notifications.data,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      profile: {
        id: profiles.id,
        fullName: profiles.fullName,
        full_name: profiles.fullName,
        role: profiles.role,
        email: profiles.email,
        phone: profiles.phone,
      }
    })
    .from(notifications)
    .leftJoin(profiles, eq(notifications.userId, profiles.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
};
