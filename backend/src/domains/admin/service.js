import bcrypt from 'bcryptjs';
import * as adminRepo from './repository.js';
import * as notifService from '../../shared/notifications/service.js';
import { db } from '../../db/index.js';
import { profiles, riders, stores } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export const onboardStaffMember = async ({ email, password, full_name, phone, role, store_id, vehicle_type, vehicle_number }) => {
  const cleanEmail = email.trim().toLowerCase();

  const [existing] = await db.select().from(profiles).where(eq(profiles.email, cleanEmail)).limit(1);
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return await db.transaction(async (tx) => {
    const [newProfile] = await tx.insert(profiles).values({
      fullName: full_name,
      email: cleanEmail,
      phone: phone || null,
      passwordHash,
      role,
      isActive: true,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`
    }).returning();

    if (role === 'rider') {
      await tx.insert(riders).values({
        userId: newProfile.id,
        assignedStoreId: store_id || null,
        vehicleType: vehicle_type || 'bike',
        vehicleNumber: vehicle_number || 'N/A',
        approvalStatus: 'approved',
        isOnline: false
      });
    }

    if (role === 'store_manager' && store_id) {
      await tx.update(stores).set({ managerUserId: newProfile.id }).where(eq(stores.id, store_id));
    }

    return newProfile;
  });
};

export const updateOrderStatusWorkflow = async (orderId, status, riderId = null) => {
  const extraFields = {};
  if (riderId) {
    extraFields.riderId = riderId;
  }
  const updated = await adminRepo.updateOrderStatus(orderId, status, extraFields);
  if (!updated) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  // Send push notification to customer
  try {
    let title = '';
    let body = '';
    if (status === 'accepted' || status === 'confirmed') {
      title = 'Order Confirmed! 🛒';
      body = `Your order #${updated.orderNumber} has been confirmed.`;
    } else if (status === 'preparing') {
      title = 'Order Being Prepared 🍳';
      body = `Your items for order #${updated.orderNumber} are being packed fresh.`;
    } else if (status === 'out_for_delivery') {
      title = 'Out For Delivery! 🛵';
      body = `Your order #${updated.orderNumber} is on its way to you.`;
    } else if (status === 'delivered') {
      title = 'Order Delivered! 🎉';
      body = `Your order #${updated.orderNumber} has been delivered successfully.`;
    } else if (status === 'cancelled') {
      title = 'Order Cancelled ❌';
      body = `Your order #${updated.orderNumber} was cancelled.`;
    }

    const customerUserId = updated.userId || updated.customerId;
    if (title && customerUserId) {
      await notifService.sendToUser(customerUserId, title, body, {
        type: 'order_status_update',
        status,
        order_id: updated.id
      });
    }

    if (riderId) {
      await notifService.sendToUser(riderId, 'New Delivery Assigned! 🚀', `Order #${updated.orderNumber} has been assigned to you.`, {
        type: 'order_assigned',
        order_id: updated.id
      });
    }
  } catch (err) {
    console.error('[Admin Order Notification Error]', err.message);
  }

  return updated;
};
