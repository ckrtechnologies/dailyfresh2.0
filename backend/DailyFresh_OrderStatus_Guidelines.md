# DailyFresh — Order Status & Delivery Type Guidelines

**Project:** DailyFresh Quick Commerce Platform
**Prepared by:** ArgosMob Tech & AI Pvt Ltd
**Stack:** React Native · Express.js · Supabase · Cloudinary · Cashfree

---

## 1. Delivery Type Definitions

| Delivery Type | Enum Value | Description | Window |
|---|---|---|---|
| Express | `express` | ~60 min delivery, any time of day | ASAP |
| Tomorrow Morning | `tomorrow_morning` | Next-day morning delivery | 6:00 AM – 10:00 AM |
| Tomorrow Evening | `tomorrow_evening` | Next-day evening delivery | 5:00 PM – 9:00 PM |

---

## 2. Cutoff & Availability Logic

### Express
- Always available, no cutoff time.
- Shown on the customer app as long as stock exists for the requested items.
- No time-based restriction on the backend.



### Tomorrow Morning
- Always available for next-day selection.
- Orders locked for editing/cancellation after midnight (12:00 AM) the day of delivery.
- Delivery window: 6:00 AM – 10:00 AM.

### Tomorrow Evening
- Always available for next-day selection.
- Orders locked for editing/cancellation after midnight (12:00 AM) the day of delivery.
- Delivery window: 5:00 PM – 9:00 PM.

---

## 3. Order Status Lifecycle

All delivery types share the same status flow:

```
placed → confirmed → preparing → ready → out_for_delivery → delivered
                                       ↘ cancelled (admin/system)
placed → failed (payment failure)
```

### Status Descriptions

| Status | Enum Value | Description |
|---|---|---|
| Placed | `placed` | Order created, payment successful |
| Confirmed | `confirmed` | Store manager has accepted the order |
| Preparing | `preparing` | Store is actively packing the order |
| Ready | `ready` | Order packed, awaiting rider pickup |
| Out for Delivery | `out_for_delivery` | Rider has picked up, en route |
| Delivered | `delivered` | Order handed to customer with proof |
| Cancelled | `cancelled` | Cancelled by admin or system |
| Failed | `failed` | Payment failed, order not processed |

### Status Transition Rules

- Statuses must be updated **in sequence** — skipping is not allowed.
- The only exception: `placed → cancelled` or `placed → failed` (early termination).
- `cancelled` can be set from `placed`, `confirmed`, or `preparing` only (not after `ready`).
- `delivered` is a **terminal state** — no further updates allowed.

---

## 4. Who Can Update Each Status

| Status | Set By | Trigger | Notifications Sent To |
|---|---|---|---|
| `placed` | System | Payment success webhook (Cashfree) | Customer + Store Manager |
| `confirmed` | Store Manager | Manual accept tap in Store App | Customer |
| `preparing` | Store Manager | Tap "Start Preparing" in Store App | Customer |
| `ready` | Store Manager | Tap "Packed & Ready" in Store App | Customer + Assigned Rider |
| `out_for_delivery` | Rider | Tap "Picked Up" in Rider App | Customer (live tracking starts) |
| `delivered` | Rider | OTP match or photo proof upload | Customer + Admin |
| `cancelled` | Admin / System | Manual cancel or cron timeout | Customer + Store Manager |
| `failed` | System | Payment failure webhook | Customer |

---

## 5. Supabase — Database Schema

### `orders` Table — Key Fields

```sql
CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         uuid NOT NULL REFERENCES users(id),
  store_id            uuid NOT NULL REFERENCES stores(id),
  rider_id            uuid REFERENCES riders(id),

  delivery_type       text NOT NULL CHECK (delivery_type IN (
                        'express', 'tomorrow_morning', 'tomorrow_evening'
                      )),

  status              text NOT NULL DEFAULT 'placed' CHECK (status IN (
                        'placed', 'confirmed', 'preparing', 'ready',
                        'out_for_delivery', 'delivered', 'cancelled', 'failed'
                      )),

  scheduled_date      date NOT NULL,
  delivery_slot       text,                        -- e.g. "6:00 AM – 10:00 AM"



  status_updated_at   timestamptz DEFAULT now(),   -- auto-updated on status change
  status_updated_by   uuid,                        -- user/rider/admin who made the change
  status_updated_role text,                        -- 'system' | 'store' | 'rider' | 'admin'

  delivery_proof_url  text,                        -- Cloudinary URL, required for delivered
  delivery_otp        text,                        -- 4-digit OTP sent to customer
  delivery_otp_verified boolean DEFAULT false,

  subtotal            numeric(10,2) NOT NULL,
  delivery_fee        numeric(10,2) DEFAULT 0,
  total_amount        numeric(10,2) NOT NULL,

  payment_status      text DEFAULT 'pending' CHECK (payment_status IN (
                        'pending', 'paid', 'refunded', 'failed'
                      )),
  payment_reference   text,                        -- Cashfree order ID

  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

### `order_status_logs` Table — Audit Trail

```sql
CREATE TABLE order_status_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid,
  changed_role text,  -- 'system' | 'store' | 'rider' | 'admin'
  note        text,
  created_at  timestamptz DEFAULT now()
);
```

### Supabase Trigger — Auto-update `status_updated_at`

```sql
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_update
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_order_status_timestamp();
```

---

## 6. Backend API Routes (Express.js)

### Customer APIs

```
POST   /api/orders
       Body: { delivery_type, scheduled_date, items[], address_id, payment_reference }
       Validates cutoff for today_evening before creating.

GET    /api/orders/:id
       Customer fetches their own order detail.

GET    /api/orders/my
       Customer's order history with filters.

DELETE /api/orders/:id/cancel
       Customer cancels only if status = placed | confirmed.
```

### Store Manager APIs

```
GET    /api/store/orders
       Query: ?status=&delivery_type=&date=
       Returns orders assigned to the logged-in store.

PATCH  /api/store/orders/:id/status
       Body: { status: 'confirmed' | 'preparing' | 'ready' }
       Store can only move forward. Validates allowed transitions.
```

### Rider APIs

```
GET    /api/rider/orders
       Returns orders where rider_id = me AND status = ready | out_for_delivery.

PATCH  /api/rider/orders/:id/status
       Body: { status: 'out_for_delivery' | 'delivered', proof_url?, otp? }
       - out_for_delivery: no extra fields needed.
       - delivered: requires either proof_url (Cloudinary) or otp that matches delivery_otp.
```

### Admin APIs

```
GET    /api/admin/orders
       Query: ?delivery_type=&status=&date=&rider_id=&store_id=
       Full order list with all filters.

GET    /api/admin/orders/batch
       Query: ?slot=tmrw_morning&date=2026-05-02
       Batch view grouped by delivery slot.

PATCH  /api/admin/orders/:id/status
       Admin can set any status (including cancel).

PATCH  /api/admin/orders/:id/assign-rider
       Body: { rider_id }
       Assigns rider when order is in ready status.
```



### Status Transition Guard

```javascript
// utils/statusTransitions.js
const ALLOWED_TRANSITIONS = {
  placed:           ['confirmed', 'cancelled', 'failed'],
  confirmed:        ['preparing', 'cancelled'],
  preparing:        ['ready', 'cancelled'],
  ready:            ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
  failed:           [],
};

const ROLE_ALLOWED_STATUSES = {
  store:  ['confirmed', 'preparing', 'ready'],
  rider:  ['out_for_delivery', 'delivered'],
  admin:  ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
  system: ['placed', 'failed', 'cancelled'],
};

export const validateTransition = (currentStatus, newStatus, role) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  const roleAllowed = ROLE_ALLOWED_STATUSES[role] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}.`);
  }
  if (!roleAllowed.includes(newStatus)) {
    throw new Error(`Role '${role}' is not permitted to set status '${newStatus}'.`);
  }
};
```

---

## 7. Inventory Management

### Stock Deduction Flow

1. When an order reaches `confirmed`, deduct stock from inventory.
2. If stock is insufficient at confirmation time, store manager must partially cancel or contact customer (admin handles via panel).
3. On `cancelled` or `failed`, stock is restored via a compensating update.

### `inventory` Table Fields Relevant to Delivery Type

```sql
-- Track stock separately for express vs scheduled slots
ALTER TABLE products ADD COLUMN express_stock_qty   int DEFAULT 0;
ALTER TABLE products ADD COLUMN scheduled_stock_qty int DEFAULT 0;
```

- `express_stock_qty` — used for `express` orders (near-real-time deduction).
- `scheduled_stock_qty` — used for `tomorrow_morning`, `tomorrow_evening` orders (deducted at `confirmed`).

This split ensures express orders don't block out stock reserved for scheduled slots and vice versa.

---

## 8. Admin Panel Field Mapping (ADM-05 / ADM-06)

### Order Management Table (ADM-05)

| Admin Field Label | DB Column | Component Type | Notes |
|---|---|---|---|
| Delivery type | `delivery_type` | Coloured badge + filter dropdown | Express=coral, Evening=amber, Tmrw Morning=teal, Tmrw Evening=purple |
| Order status | `status` | Coloured status pill | Each status has a distinct colour |
| Scheduled date | `scheduled_date` | Date cell | Sortable column |
| Delivery slot | `delivery_slot` | Plain text | Shown in order detail drawer |
| Assigned rider | `rider_id` (joined) | Rider name + assign button | Button visible when status = ready |
| Delivery proof | `delivery_proof_url` | Photo thumbnail | Visible when status = delivered |
| Status last updated | `status_updated_at` | Relative timestamp | e.g. "2 mins ago" |

### Order Detail Drawer (ADM-06)

- **Status update dropdown:** Admin can manually override status (all values available).
- **Delivery type badge** shown prominently at the top of the drawer.
- **Slot tag** shown below the delivery address.
- **Status log timeline** pulled from `order_status_logs` — shows each transition with timestamp and actor role.
- **Assign Rider button** active only when `status = ready`.
- **Delivery proof image** shown at the bottom when available.

### Order Table Filter Tabs

```
All | Express | Tomorrow Morning | Tomorrow Evening
```

Each tab filters by `delivery_type`. Combined with date picker and status filter dropdown.

---

## 9. Rider App — Status Update Rules

### Order Visibility
- Rider sees an order **only when** `status = ready` AND `rider_id = their own ID`.
- Orders are pushed via FCM push notification and Socket.IO real-time event when status becomes `ready`.

### Pickup Flow
1. Rider receives push notification: "New order ready for pickup."
2. Rider opens the order card in the app.
3. Rider taps **"Picked Up"**.
4. API: `PATCH /api/rider/orders/:id/status` with `{ status: 'out_for_delivery' }`.
5. Status → `out_for_delivery`. Customer receives FCM: "Your order is on the way!" + live tracking activates.

### Delivery Flow
1. Rider arrives at customer location.
2. Rider taps **"Mark as Delivered"**.
3. App requires **one of the following:**
   - Photo proof → uploaded to Cloudinary → URL sent in API body as `proof_url`.
   - OTP entry → 4-digit OTP that was sent to the customer's phone at `out_for_delivery` status.
4. API: `PATCH /api/rider/orders/:id/status` with `{ status: 'delivered', proof_url? or otp? }`.
5. Backend validates proof/OTP. On success:
   - Status → `delivered`.
   - Customer FCM: "Your order has been delivered!"
   - Rider earnings record created/updated.
   - `order_status_logs` entry added.

### Rider Cannot
- Skip statuses (cannot go from `ready` directly to `delivered`).
- Cancel an order.
- Modify order contents.
- Mark delivered without proof or OTP.

---

## 10. Customer App — UX Rules

| Scenario | Behaviour |
|---|---|

| Order is `out_for_delivery` | Live tracking map appears in order detail screen |
| Order is `delivered` | Delivery proof photo shown in order detail + review prompt |
| Order is `cancelled` | Reason shown, refund timeline displayed if applicable |

---

## 11. FCM Push Notification Events

| Trigger | Recipient | Message |
|---|---|---|
| `placed` | Customer | "Order #XXX confirmed! We're getting it ready." |
| `confirmed` | Customer | "Your order has been accepted by the store." |
| `preparing` | Customer | "Your order is being packed." |
| `ready` | Rider | "New pickup ready at [Store Name]." |
| `out_for_delivery` | Customer | "Your order is on the way! Track live." |
| `delivered` | Customer | "Delivered! How was your experience?" |
| `cancelled` | Customer + Store | "Order #XXX has been cancelled." |

---

## 12. Cron Jobs

| Job | Schedule | Action |
|---|---|---|
| `lock_scheduled_orders` | Daily 12:00 AM IST | Locks tomorrow_morning and tomorrow_evening orders for editing/cancellation |
| `auto_cancel_unpaid` | Every 15 min | Cancels orders stuck in `placed` with `payment_status = pending` for > 30 mins |

---

*Document version: 1.0 — ArgosMob Tech & AI Pvt Ltd*
