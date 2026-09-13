import * as storeRepo from './repository.js';
import * as notifService from '../../shared/notifications/service.js';
import { validateTransition } from '../../utils/statusTransitions.js';

export const resolveStoreId = async (managerUserId, headerStoreId) => {
  const managerStores = await storeRepo.getStoresByManagerUserId(managerUserId);
  if (!managerStores || managerStores.length === 0) return null;

  if (headerStoreId) {
    const matched = managerStores.find(s => s.id === headerStoreId);
    if (matched) return matched.id;
  }

  return managerStores[0].id;
};

export const updateStoreOrderStatus = async (orderId, storeId, newStatus) => {
  const existingOrder = await storeRepo.findOrderWithDetails(orderId, storeId);
  if (!existingOrder) {
    const err = new Error('Order not found for this store');
    err.status = 404;
    throw err;
  }

  const transitionCheck = validateTransition(existingOrder.status, newStatus);
  if (!transitionCheck.valid) {
    const err = new Error(transitionCheck.message);
    err.status = 400;
    throw err;
  }

  const updated = await storeRepo.updateOrderStatus(orderId, storeId, newStatus);

  // If ready, notify riders
  if (newStatus === 'ready') {
    const store = await storeRepo.getStoreById(storeId);
    const storeName = store?.name || 'Store';
    const storeAddress = store?.address || '';
    const itemsSummary = existingOrder.items?.map(i => `${i.product?.name || 'Item'} x${i.quantity}`).join(', ') || '';

    notifService.notifyAvailableRiders(orderId, updated.orderNumber, storeName, storeAddress, itemsSummary).catch(err => {
      console.error('[Store Order Status Error] Rider notify failed:', err.message);
    });
  }

  return updated;
};

export const generateInventoryCsv = async (storeId) => {
  const { items } = await storeRepo.getStoreProducts(storeId, { limit: 1000 });
  const rows = ['Product ID,Name,Category,Variant Name,SKU,Price,Stock,Status'];

  for (const p of items) {
    for (const v of p.variants || []) {
      rows.push([
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category?.name || ''}"`,
        `"${v.name || ''}"`,
        v.sku || '',
        v.price,
        v.stockQuantity,
        p.isActive ? 'Active' : 'Inactive'
      ].join(','));
    }
  }

  return rows.join('\n');
};
