/**
 * ALLOWED_TRANSITIONS defines the valid next statuses for any given current status.
 */
export const ALLOWED_TRANSITIONS = {
  placed:           ['confirmed', 'cancelled', 'failed'],
  confirmed:        ['preparing', 'cancelled'],
  preparing:        ['ready', 'cancelled'],
  ready:            ['accepted', 'cancelled'],
  accepted:         ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered:        [],
  cancelled:        [],
  failed:           [],
};

/**
 * ROLE_ALLOWED_STATUSES defines which roles are permitted to set specific statuses.
 */
export const ROLE_ALLOWED_STATUSES = {
  store:  ['confirmed', 'preparing', 'ready'],
  rider:  ['accepted', 'out_for_delivery', 'delivered'],
  admin:  ['confirmed', 'preparing', 'ready', 'accepted', 'out_for_delivery', 'delivered', 'cancelled'],
  system: ['placed', 'failed', 'cancelled'],
};

/**
 * Validates if a status transition is permissible based on the current status and user role.
 * 
 * @param {string} currentStatus - The current status of the order.
 * @param {string} newStatus - The status to transition to.
 * @param {string} role - The role of the user attempting the transition.
 * @throws {Error} if the transition is invalid.
 */
export const validateTransition = (currentStatus, newStatus, role) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  const roleAllowed = ROLE_ALLOWED_STATUSES[role] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from '${currentStatus}' to '${newStatus}'.`);
  }
  
  if (!roleAllowed.includes(newStatus)) {
    throw new Error(`Role '${role}' is not permitted to set status '${newStatus}'.`);
  }
};
