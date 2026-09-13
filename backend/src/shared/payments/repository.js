import { db } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export const findOrderByRazorpayId = async (razorpayOrderId) => {
  return await db.query.orders.findFirst({
    where: eq(orders.razorpayOrderId, razorpayOrderId),
    with: { user: true, store: true }
  });
};

export const updateOrderPaymentStatus = async (orderId, { status, paymentId, signature }) => {
  const [updated] = await db
    .update(orders)
    .set({
      paymentStatus: status,
      razorpayPaymentId: paymentId || null,
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId))
    .returning();
  return updated;
};
