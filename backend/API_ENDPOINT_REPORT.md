# Daily Fresh API - MASTER ENDPOINT LIST

This is the definitive list of all API endpoints available in the Daily Fresh backend.

## 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register new Customer or Rider |
| `POST` | `/login` | Login & get JWT tokens |
| `PATCH` | `/profile` | Update basic profile (Name, Phone) |
| `PATCH` | `/password` | Update account password |

---

## 2. Customer Application (`/api/v1/customer`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/home` | Banners, Categories, Featured Products |
| `GET` | `/categories` | List all categories |
| `GET` | `/categories/tree` | Hierarchical category structure |
| `GET` | `/banners` | Fetch active promotional banners |
| `GET` | `/stores/nearest` | Find closest store by Geo-coordinates |
| `GET` | `/products` | List/Filter/Search products |
| `GET` | `/products/:id` | Detailed product information |
| `POST` | `/products/decrement-stock` | Manual stock reduction (internal/debug) |
| `GET` | `/profile` | Fetch customer profile & saved addresses |
| `PUT` | `/profile` | Update customer profile details |
| `GET` | `/addresses` | List all saved delivery addresses |
| `POST` | `/addresses` | Add new address with Lat/Lng |
| `PATCH` | `/addresses/:id` | Update existing address |
| `DELETE` | `/addresses/:id` | Delete saved address |
| `GET` | `/favorites` | List favorite products |
| `POST` | `/favorites/toggle` | Add/Remove favorite |
| `PATCH` | `/fcm-token` | Update Firebase token for push |
| `GET` | `/cart` | Fetch persistent server-side cart |
| `POST` | `/cart/sync` | Sync local mobile cart with server |
| `DELETE` | `/cart` | Clear entire cart |
| `POST` | `/coupons/validate` | Check if coupon is valid for current total |
| `GET` | `/coupons` | List available coupons for user |
| `POST` | `/orders` | **Place New Order** (with Cutoff Guard) |
| `POST` | `/payments/verify` | Verify online payment signature (Razorpay/etc) |
| `GET` | `/orders` | View order history |
| `GET` | `/orders/:id` | Tracking & item details for an order |
| `GET` | `/notifications` | Fetch customer notification feed |
| `PATCH` | `/notifications/:id/read` | Mark a notification as read |

---

## 3. Rider Application (`/api/v1/rider`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/profile` | Fetch rider profile & approval status |
| `GET` | `/dashboard` | Earnings, Stats, and Performance data |
| `PATCH` | `/status` | Toggle Online/Offline availability |
| `PATCH` | `/location` | Live GPS location broadcast |
| `PATCH` | `/fcm-token` | Update Firebase token for push |
| `GET` | `/orders/available` | Pool of orders ready for dispatch |
| `GET` | `/orders/active` | Orders currently in delivery (Accepted) |
| `GET` | `/orders/history` | Completed delivery history |
| `GET` | `/orders/:orderId` | Specific order details for rider |
| `POST` | `/orders/accept` | Accept an order from the available pool |
| `PATCH` | `/orders/:orderId/status` | Update delivery state (Picked Up / Delivered) |

---

## 4. Store Manager Dashboard (`/api/v1/store`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard` | Store-specific analytics & performance |
| `GET` | `/inventory` | Manage store-level product stock |
| `GET` | `/inventory/export` | Download inventory as CSV |
| `POST` | `/inventory` | Add new product to store (with Image upload) |
| `PUT` | `/inventory/:productId` | Update product info (with Image upload) |
| `PATCH` | `/inventory/:productId/stock` | Quick stock update |
| `PATCH` | `/inventory/:productId/status` | Toggle product visibility |
| `DELETE` | `/inventory/:productId` | Remove product from store |
| `GET` | `/orders` | Manage orders assigned to this store |
| `GET` | `/orders/export` | Download store orders as CSV |
| `PATCH` | `/orders/:orderId/status` | Update status (Processing -> Ready) |
| `GET` | `/customers` | List customers served by this store |
| `GET` | `/profile` | Fetch store details & location |
| `PATCH` | `/profile/status` | Toggle store Open/Closed status |
| `PATCH` | `/fcm-token` | Update Manager Firebase token |
| `GET` | `/categories` | List categories available for store |
| `GET` | `/sub-categories` | List sub-categories |

---

## 5. Super Admin Dashboard (`/api/v1/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/stats` | Global platform-wide analytics |
| `POST` | `/upload` | Common utility for uploading files to CDN |
| `GET` | `/orders` | Master list of all platform orders |
| `PATCH` | `/orders/:id/status` | Master status update (**READY triggers Rider broadcast**) |
| `GET` | `/stores` | List all physical stores |
| `POST` | `/stores` | Create a new store |
| `PATCH` | `/stores/:id` | Update store configuration |
| `DELETE` | `/stores/:id` | Remove a store from platform |
| `GET` | `/riders` | Master list of all registered riders |
| `PATCH` | `/riders/:riderId/approve` | Approve new rider registration |
| `PATCH` | `/riders/:riderId` | Update rider status/profile |
| `POST` | `/onboard-staff` | Create accounts for Store Managers/Admins |
| `GET` | `/staff` | List all backend staff accounts |
| `DELETE` | `/staff/:id" | Remove a staff member |
| `GET` | `/customers` | View all registered customers |
| `GET` | `/notifications` | List all sent/queued system notifications |
| `POST` | `/notifications/send` | Send a manual push notification to users/riders |
| `GET` | `/config" | Fetch global platform settings (cutoff, delivery fees) |
| `PATCH` | `/config" | Update global business rules |
| `GET` | `/categories` | Manage global category list |
| `POST" | `/categories` | Create category (with Image upload) |
| `PATCH` | `/categories/:id` | Update category (with Image upload) |
| `DELETE` | `/categories/:id` | Remove category |
| `GET" | `/sub-categories` | Manage global sub-categories |
| `POST` | `/sub-categories` | Create sub-category (with Image upload) |
| `PATCH` | `/sub-categories/:id` | Update sub-category (with Image upload) |
| `DELETE` | `/sub-categories/:id` | Remove sub-category |
| `GET` | `/products" | Master catalogue management |
| `POST` | `/products` | Create global product template |
| `PATCH` | `/products/:id` | Update global product info |
| `DELETE` | `/products/:id` | Delete product from system |
| `GET` | `/banners` | Manage Home Screen banners |
| `POST` | `/banners` | Create banner (with Image upload) |
| `PATCH` | `/banners/:id` | Update banner (with Image upload) |
| `DELETE` | `/banners/:id` | Remove banner |
| `GET` | `/home-sections` | Manage dynamic home screen layouts |
| `PATCH` | `/home-sections/:id` | Configure a home section |
| `GET` | `/coupons` | Manage platform-wide coupons |
| `POST` | `/coupons` | Create new discount coupon |
| `PATCH` | `/coupons/:id` | Update coupon rules |
| `DELETE` | `/coupons/:id` | Remove coupon |

---
**Base URL:** `https://api.dailyfreshkolkata.in/api/v1`
