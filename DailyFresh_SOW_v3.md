---
title: "Daily Fresh — Statement of Work"
client: "Abir"
agency: "ArgosMob Tech & AI Pvt Ltd"
version: "v4.0 — April 2026"
classification: "CONFIDENTIAL"
---

# STATEMENT OF WORK
**Daily Fresh**

*Single-Vendor · Multi-Store Fresh Grocery Delivery*

Customer App · Store Manager App · Rider App · Web Admin Panel · Backend API

| **Prepared By** | **Client** | **Version** | **Classification** |
|---|---|---|---|
| ArgosMob Tech & AI Pvt Ltd | Abir | v4.0 — April 2026 | CONFIDENTIAL |

**Project Cost: INR 1,00,000 | Timeline: 30 Calendar Days | Status: Finalized — Ready for Handoff**

## Table of Contents
- SECTION 1 — Project Overview & Business Context
- SECTION 2 — Stakeholder Matrix
- SECTION 3 — Project Scope (In-Scope & Out-of-Scope)
- SECTION 4 — Customer App — All Screens & UI Elements (FreshToHome-style clone)
- SECTION 5 — Store Manager App — All Screens & UI Elements
- SECTION 6 — Rider App — All Screens & UI Elements
- SECTION 7 — Web Admin Panel — All Screens & UI Elements
- SECTION 8 — Technology Stack (Deep Dive)
- SECTION 9 — System Architecture & Request Flow
- SECTION 10 — Database Schema — All Tables & SQL Scripts
- SECTION 11 — API Specification — Complete Reference (All Endpoints)
- SECTION 12 — Razorpay Payment Integration (Full Spec)
- SECTION 13 — Supabase Auth & Storage Setup
- SECTION 14 — Real-Time (Socket.IO) Specification
- SECTION 15 — Third-Party APIs & Services
- SECTION 16 — Non-Functional Requirements
- SECTION 17 — UI/UX Design Guidelines & Screen Inventory
- SECTION 18 — Project Timeline — 30-Day Delivery Plan
- SECTION 19 — VPS Hosting & DevOps
- SECTION 20 — Security & Performance
- SECTION 21 — Testing & QA Strategy
- SECTION 22 — Postman Collection — Complete Setup Guide
- SECTION 23 — Environment Variables Reference
- SECTION 24 — Error Codes & API Standards
- SECTION 25 — Assumptions, Risks & Change Control
- SECTION 26 — Commercial Terms & Sign-Off


---

# SECTION 1 — PROJECT OVERVIEW & BUSINESS CONTEXT
## 1.1 Project Summary
ArgosMob Tech & AI Pvt Ltd has been commissioned by Abir to design, develop, and deliver a full-stack Daily Fresh platform. Daily Fresh is a single-vendor brand that operates multiple physical stores. The platform serves Customers who order from Daily Fresh stores, Store Managers who manage individual store inventory and orders, and Delivery Riders — through dedicated React Native mobile apps, complemented by a React.js + Express.js Web Admin Panel.

The platform allows customers to browse and order fresh groceries from Daily Fresh stores near them, enables store managers to manage their store's inventory and prepare orders, and empowers riders to fulfil deliveries with real-time navigation.

**This document is the SINGLE SOURCE OF TRUTH for the project — covering all screen specifications, API contracts, database schemas, deployment procedures, QA test cases, and commercial terms.**

## 1.2 Project Details
|                       |  **Project Name**      | Daily Fresh — Single-Vendor Multi-Store Fresh Grocery Delivery Platform                                                                   |
| **Client Entity**     | Abir (legal entity to be confirmed at kickoff)                                                                                            |
| **Agency**            | ArgosMob Tech & AI Pvt Ltd                                                                                                                |
| **Document Version**  | v1.0 — April 2026                                                                                                                         |
| **Document Status**   | Draft — Awaiting Client Approval                                                                                                          |
| **Project Type**      | New Development (Greenfield)                                                                                                              |
| **Engagement Model**  | Fixed Scope, Milestone-Based Billing                                                                                                      |
| **Business Model**    | Single-vendor (Daily Fresh owns all stores); each physical store is managed by an assigned Store Manager. No external vendor marketplace. |
| **Target Platforms**  | Android & iOS (React Native) + Web Admin Panel (React.js) + Backend API (Express.js)                                                      |
| **Payment Gateway**   | Razorpay (India) — UPI, Cards, Net Banking, Wallets, EMI, COD                                                                             |
| **Database**          | Supabase (PostgreSQL 15) as primary; Redis for caching & sessions                                                                         |
| **File Storage**      | Daily Fresh CDN (assets.dailyfresh.in) — self-hosted S3-compatible storage behind Nginx                                                   |
| **Real-Time**         | Socket.IO for live order tracking & rider location updates                                                                                |
| **Hosting**           | AWS EC2 / DigitalOcean Droplet — Ubuntu 22.04 LTS                                                                                         |
| **Project Cost**      | INR 1,00,000 (One Lakh Rupees Only)                                                                                                       |
| **Delivery Timeline** | 30 Calendar Days from Project Kick-off                                                                                                    |

## 1.3 Business Objectives
- Establish a production-ready quick-commerce platform for rapid grocery and fresh product delivery.

- Deliver a mobile-first, intuitive shopping experience across Customer, Store Manager, and Rider apps on Android & iOS.

- Provide platform administrators full operational control through a centralised Web Admin Panel.

- Enable secure cashless digital payments (UPI, Cards, Net Banking, Wallets, EMI, COD) via Razorpay.

- Support store managers with inventory management, order acceptance, and per-store performance tracking.

- Empower delivery riders with real-time task management, Google Maps navigation, and earnings visibility.

- Build a scalable, maintainable codebase that supports adding more Daily Fresh store locations without architectural changes.

- Achieve 99.5% monthly uptime SLA for all backend services.

## 1.4 Project Success Criteria
| **ID** | **Success Criterion**                                                                                 | **Measurement**                      |
|--------|-------------------------------------------------------------------------------------------------------|--------------------------------------|
| SC-01  | All 4 products delivered: Customer App (FreshToHome-style), Store Manager App, Rider App, Admin Panel | Manual UAT sign-off on all 4         |
| SC-02  | End-to-end order → delivery flow functional on Android & iOS                                          | Passed TC-002 & TC-003               |
| SC-03  | Razorpay payment in production with HMAC webhook verification                                         | Live payment test in production      |
| SC-04  | Admin manages users/stores/store-managers/riders/orders without developer help                        | UAT test by client                   |
| SC-05  | Live rider GPS tracking updates customer map in real-time                                             | Socket.IO latency < 5s verified     |
| SC-06  | API response time < 500ms at 95th percentile                                                         | Measured via load test               |
| SC-07  | Android APK/AAB + iOS IPA both build and run successfully                                             | TestFlight & direct APK install      |
| SC-08  | All API endpoints documented and tested in Postman                                                    | Postman collection exported & shared |
| SC-09  | SSL active on all production domains                                                                  | Browser padlock + curl HTTPS check   |
| SC-10  | Zero P1/P2 bugs at go-live sign-off                                                                   | QA bug tracker cleared               |


---

# SECTION 2 — STAKEHOLDER MATRIX
| **Stakeholder**                    | **Role**                        | **Platform**          | **Key Responsibilities**                                                | **Deliverables**                                                                  |
|------------------------------------|---------------------------------|-----------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| Abir (Client)                      | Product Owner / Business Owner  | All                   | Final approval on scope, designs, content, business rules               | Signed SOW, brand assets (logo, colours), Razorpay keys, product data spreadsheet |
| ArgosMob PM                        | Project Manager                 | All                   | Sprint planning, milestone tracking, client comms, risk management      | Weekly status reports, milestone sign-offs, CR documentation                      |
| UI/UX Designer                     | ArgosMob Design                 | Figma                 | Wireframes, high-fidelity designs, design system, prototypes            | Figma file with all screens, design system, handoff specs                         |
| Backend Dev                        | ArgosMob Dev                    | Express.js / Supabase | API development, DB schema, auth, Razorpay, Socket.IO, webhooks         | All API endpoints, Postman collection, DB migrations, .env template               |
| Mobile Dev                         | ArgosMob Dev                    | React Native          | All 3 mobile apps, navigation, payments, push notifications, maps       | APK + IPA builds, OTA update config                                               |
| Frontend Dev                       | ArgosMob Dev                    | React.js              | Admin Panel, API integration, state management                          | Admin panel build deployed on VPS                                                 |
| DevOps Eng.                        | ArgosMob Dev                    | KVM2 VPS              | VPS setup, Nginx, SSL, PM2, domain routing, CI/CD                       | Server live, all domains HTTPS, PM2 running                                       |
| QA Engineer                        | ArgosMob QA                     | All                   | Test cases, functional testing, regression, UAT support, bug reports    | Test report, UAT sign-off sheet, bug tracker populated                            |
| End Customers                      | Primary App Users               | Customer App          | Browse products, place orders, track deliveries                         | N/A                                                                               |
| Store Managers (Daily Fresh Staff) | Store-Level Operations Managers | Store Manager App     | Manage store inventory, accept orders, update stock, coordinate pickups | Staff credentials provided by Daily Fresh owner                                   |
| Delivery Riders                    | Fulfilment Partners             | Rider App             | Receive tasks, navigate, deliver, update status                         | Licence + vehicle documents for verification                                      |
| Platform Admin                     | ArgosMob / Client Ops Team      | Web Admin Panel       | Manage all users, analytics, payouts, platform settings                 | N/A                                                                               |


---

# SECTION 3 — PROJECT SCOPE
## 3.1 In-Scope Deliverables
The following four products are included within the defined scope:

- Customer Mobile App (Android & iOS — React Native) — FreshToHome-style clone with location gating, delivery slots, cut & cleaning preferences, quality trust badges, VIP membership, Notify Me for out-of-stock

- Store Manager App (Android & iOS — React Native) — store-level inventory and order management app (for Daily Fresh store staff)

- Rider / Delivery Partner Mobile App (Android & iOS — React Native) — delivery management and navigation app

- Web Admin Panel (React.js + Express.js Backend) — centralised platform management interface

- Backend REST API (Express.js + Supabase/PostgreSQL) — single API powering all four frontends; single-vendor architecture (no vendor KYC/approval flow)

- Socket.IO real-time layer for live order tracking and rider location broadcast

- Custom CDN integration (assets.dailyfresh.in) for product images, store photos, and delivery proof uploads

- Razorpay payment gateway integration with webhook signature verification

- Firebase Cloud Messaging (FCM) for push notifications on all 3 mobile apps

- Google Maps SDK for rider navigation, address autocomplete, and live tracking

- Production deployment on VPS with Nginx, PM2, SSL via Let's Encrypt

- Postman collection covering all API endpoints

- 30-day bug-fix warranty post go-live

## 3.2 Out of Scope
The following items are explicitly excluded. A separate Change Order is required to include any of these:

- Custom ERP or Inventory Management System integration

- AI/ML-based product recommendation engine

- Loyalty or rewards programme

- Multi-language (i18n) support beyond English and Hindi

- Third-party marketplace integrations (Swiggy, Zomato, ONDC)

- Hardware provisioning (POS terminals, printers, barcode scanners)

- Logistics API integration (Shiprocket, Delhivery, Ecom Express) — tracking link supported only

- WhatsApp Business API (beyond OTP SMS via MSG91)

- App Store / Play Store submission (ArgosMob provides build files and guidance; submission is client's responsibility)

- Content writing (product descriptions, legal pages, blog posts)

- Product photography or image editing

- Accounting software integration (Tally, Zoho Books)

- Multi-currency or international shipping support

- Post-launch maintenance beyond 30-day warranty period (AMC available separately)


---

# SECTION 4 — CUSTOMER APP — ALL SCREENS & UI ELEMENTS
The Customer App is a FreshToHome-style clone built in React Native (CLI). Single codebase for Android & iOS. Green + White brand palette. Bottom Tab navigation: Home | Categories | Cart (badge) | Orders | Account. Key FreshToHome-specific features: location-gated catalogue, delivery slot selection at cart, cut & cleaning preferences on each product, 'Notify Me' for out-of-stock, express delivery option, quality trust badges, VIP membership upsell.

## 4.1 Navigation Structure
Root Navigator → LocationGateScreen (first launch) | AuthStack (unauthenticated) | AppStack (authenticated)

- AuthStack: SplashScreen → LocationPickerScreen → OnboardingScreen → LoginScreen → OTPVerifyScreen → RegisterScreen

- AppStack → BottomTabNavigator (5 tabs): Home | Categories | Cart (badge count) | Orders | Account

- HomeStack: HomeScreen → ProductListingScreen (by category/collection) → ProductDetailScreen

- CategoriesStack: CategoriesScreen → SubCategoryScreen → ProductListingScreen → ProductDetailScreen

- CartStack: CartScreen (with delivery slot overlay) → AddressScreen → PaymentScreen → OrderSuccessScreen

- OrdersStack: OrdersScreen → OrderDetailScreen (with live tracking)

- AccountStack: AccountScreen → EditProfileScreen → AddressBookScreen → WishlistScreen → NotificationsScreen → HelpScreen → VIPMembershipScreen

## 4.2 Screen-by-Screen Specification
**<u>APP-C-01: Splash Screen</u>**

| **Element**            | **Type** | **Behaviour / Content**                                                                                     |
|------------------------|----------|-------------------------------------------------------------------------------------------------------------|
| Full-screen background | View     | Brand green (#1B8B3B) — matches FreshToHome colour                                                          |
| Daily Fresh logo (PNG) | Image    | Centred, 130×130px white logo on green                                                                      |
| Tagline                | Text     | '100% Fresh. Zero Chemicals.' — white, Poppins Medium 14pt                                                  |
| Auto-navigate logic    | Logic    | After 2s: if no location set → LocationPickerScreen; if token in MMKV → HomeScreen; else → OnboardingScreen |

**<u>APP-C-02: Location Picker Screen (FreshToHome's first-launch gate)</u>**

*Just like FreshToHome, the app is LOCATION-GATED. Users must set their delivery location before seeing the product catalogue. This filters which store and which products are serviceable for the user's pincode.*

| **Element**                 | **Type**                             | **Behaviour / Content**                                                                                                                                        |
|-----------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Header                      | Text                                 | 'Where do you want your order delivered?' — Poppins Bold 18pt                                                                                                  |
| 'Use My Location' button    | Primary button with GPS icon         | Calls Expo Location API to get current coordinates → reverse geocode via Google Geocoding API → extract pincode → validate serviceability against stores table |
| 'Enter Pincode' input       | TextInput                            | 6-digit numeric; real-time validation; shows 'Delivery available' (green tick) or 'Not serviceable yet' (red) on blur                                          |
| Address search bar          | Google Places Autocomplete TextInput | Type partial address → live suggestions; select → extract pincode → check serviceability                                                                       |
| Serviceable area map        | MapView (static)                     | Shows approximate delivery zone radius for the nearest Daily Fresh store                                                                                       |
| 'Not in our zone yet?' text | Text + CTA                           | 'We're expanding! Get notified when we reach you.' → email capture modal                                                                                       |
| Confirm button              | Primary button                       | Only active when serviceability confirmed; saves pincode + store_id to MMKV + Redux; navigates → HomeScreen                                                    |

**<u>APP-C-03: Onboarding Screen (3 slides — shown only on first install)</u>**

| **Slide** | **Illustration**            | **Headline**             | **Sub-text**                                                               |
|-----------|-----------------------------|--------------------------|----------------------------------------------------------------------------|
| Slide 1   | Fish/seafood illustration   | 100% Fresh, 0% Chemicals | Direct from farm and sea to your door. No middlemen, no preservatives.     |
| Slide 2   | Delivery slot illustration  | Pick Your Delivery Slot  | Choose a 1-hour window that suits you — morning, afternoon or evening.     |
| Slide 3   | Cut preference illustration | Cleaned & Cut Your Way   | Tell us how you want your meat — we'll prep it just right before delivery. |

UI Elements: dot indicators, Next button, Skip button (top-right), Get Started button (slide 3). Stored in MMKV — never shown again.

**<u>APP-C-04: Login Screen</u>**

| **Element**               | **Type**             | **Behaviour / Validation**                                                           |
|---------------------------|----------------------|--------------------------------------------------------------------------------------|
| Tab bar                   | TabView              | Phone OTP (default, like FreshToHome) | Email & Password                            |
| Phone input (OTP tab)     | +91 prefix TextInput | 10-digit validation; 'Send OTP' button → POST /auth/otp/send; 30s cooldown countdown |
| Email input (email tab)   | TextInput            | Email format validation                                                              |
| Password input            | TextInput            | secureTextEntry; eye icon; 'Forgot Password?' link                                   |
| Login / Send OTP button   | Primary button       | Loading spinner; error inline below field                                            |
| 'New user? Register' link | Text link            | → RegisterScreen                                                                     |
| Google Sign-in button     | OAuth button         | Firebase Google auth                                                                 |

**<u>APP-C-05: OTP Verify Screen</u>**

| **Element**        | **Type**               | **Behaviour / Validation**                                           |
|--------------------|------------------------|----------------------------------------------------------------------|
| Title              | Text                   | 'Enter OTP sent to +91 XXXXXXXXXX'                                   |
| 6-cell OTP input   | OTPInputView           | Auto-advance on digit; auto-submit on last digit                     |
| Countdown + Resend | Animated text + button | 'Resend in 00:XX'; Resend active after 30s                           |
| Verify button      | Primary button         | POST /auth/otp/verify; on success → saves token to MMKV → HomeScreen |
| Wrong OTP error    | Inline red text        | 'Incorrect OTP. X attempts remaining.'                               |

**<u>APP-C-06: Register Screen</u>**

| **Element**      | **Type**       | **Behaviour / Validation**            |
|------------------|----------------|---------------------------------------|
| Full name input  | TextInput      | Required; min 2 chars                 |
| Email input      | TextInput      | Optional; email format                |
| Phone input      | TextInput      | 10-digit; required                    |
| Password input   | TextInput      | Min 8 chars; strength bar             |
| Confirm password | TextInput      | Must match                            |
| Terms checkbox   | CheckBox       | Required to enable Register button    |
| Register button  | Primary button | POST /auth/register → OTPVerifyScreen |

**<u>APP-C-07: Home Screen (FreshToHome-style layout)</u>**

The Home Screen mirrors FreshToHome's structure: green top bar with location + search, horizontal category chips, banner carousel, deal of the day, product collections by category.

| **Element**                          | **Type**                              | **Behaviour / Content**                                                                                                                                            |
|--------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Top bar — location button            | Pressable View (green background)     | Shows 'Deliver to: [Area, Pincode]'; tap → opens LocationPickerSheet to change delivery location                                                                 |
| Top bar — search icon                | Icon button                           | Tap → SearchScreen with autofocus; same green bar                                                                                                                  |
| Top bar — cart icon                  | Icon button with badge                | Shows cart item count; navigates → CartScreen                                                                                                                      |
| Category chips strip                 | Horizontal FlatList (scrollable)      | Quick-jump pills: All | Fish & Seafood | Chicken | Mutton | Ready to Cook | Marinated | Eggs | Fruits & Veg | Groceries; tap filters product section below |
| Hero banner carousel                 | Auto-play FlatList                    | 3–5 full-width promotional banners; auto-scroll every 4s; dot indicators; data from GET /banners?placement=hero                                                    |
| 'Deal of the Day' section            | Horizontal FlatList + countdown timer | Limited-time discounted products; timer shows time remaining for deal; data from GET /products?is_deal=true                                                        |
| 'Fresh Catch Today' / 'New Arrivals' | Horizontal FlatList                   | Products added today or this week; freshness badge                                                                                                                 |
| Category sections (stacked)          | FlatList of sections                  | Each section: section title + 'View All' link + horizontal ProductCard row. Sections: Fish & Seafood, Chicken, Mutton, Ready to Cook, Marinated, Fruits & Veg      |
| 'Why Daily Fresh?' trust strip       | View                                  | 3 horizontal badges: '100% Chemical-Free', 'Cleaned & Cut', 'Delivery Slots'                                                                                       |
| 'Subscribe & Save' banner            | Pressable banner                      | Promotes VIP membership; navigates → VIPMembershipScreen                                                                                                           |
| Pull-to-refresh                      | RefreshControl                        | Re-fetches all sections                                                                                                                                            |
| Skeleton loading                     | ShimmerPlaceholder                    | Full home layout skeleton while API loads                                                                                                                          |

**<u>APP-C-08: Categories Screen (FreshToHome-style grid)</u>**

Dedicated tab showing all product categories as a grid — matches FreshToHome's category browser tab.

| **Element**             | **Type**              | **Behaviour / Content**                                                                                                                                                                                                                                                                      |
|-------------------------|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Search bar              | TextInput at top      | 'Search for fish, chicken...' — navigates to SearchScreen                                                                                                                                                                                                                                    |
| Category grid           | FlatList numColumns=3 | Square rounded cards (like FreshToHome): category image + category name below; categories: Fish & Seafood, Fresh Chicken, Mutton & Lamb, Ready to Cook, Marinated, Steaks & Fillets, Eggs & Poultry, Fruits & Vegetables, Groceries, Special Indian Menu, Cutlets & Snacks, Festive Specials |
| Sub-category drill-down | Navigation            | Tap category → SubCategoryScreen showing sub-category chips + product grid                                                                                                                                                                                                                   |

**<u>APP-C-09: Sub-Category / Product Listing Screen</u>**

| **Element**                     | **Type**              | **Behaviour / Content**                                                                                                                                                                                                                                                |
|---------------------------------|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Header                          | NavBar                | Category name; Back; Search; Cart icon with badge                                                                                                                                                                                                                      |
| Sub-category horizontal chips   | FlatList horizontal   | e.g. under Fish & Seafood: All | Marine Fish | Freshwater Fish | Shellfish | Cleaned & Whole | Fillets; tap filters list below                                                                                                                                    |
| Sort & Filter bar               | Row                   | Sort: Popularity | Price Low-High | Price High-Low | New Arrivals. Filter bottom sheet: Sub-category, Weight/Pack Size, Type (Cleaned/Uncleaned), Price range                                                                                                       |
| Product grid                    | FlatList numColumns=2 | ProductCard × N; pagination via onEndReached                                                                                                                                                                                                                           |
| ProductCard (FreshToHome-style) | View                  | Product image, freshness badge ('Caught Today' / 'Farm Fresh'), product name, weight/pack size (e.g. '500g'), price, compare price (MRP strikethrough), discount badge, +/- stepper (shows Add button initially; becomes stepper after first tap), 'Chemical-Free' tag |
| Out-of-stock overlay            | View                  | Greyed-out card with 'Notify Me' button overlay; tap → POST /wishlist/notify (stores email + product_id for back-in-stock alert)                                                                                                                                       |
| Empty state                     | View                  | 'No products in this category yet' + 'Browse other categories' CTA                                                                                                                                                                                                     |

**<u>APP-C-10: Product Detail Screen (FreshToHome-style)</u>**

This is the most FreshToHome-specific screen. Key features: cut preferences, cleaning preferences, weight selector, freshness guarantee, recipe link, quality test report link.

| **Element**                                         | **Type**                                             | **Behaviour / Content**                                                                                                                                                                            |
|-----------------------------------------------------|------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Image gallery                                       | PagerView (swipeable)                                | Full-width images; dot indicators; zoom on double-tap                                                                                                                                              |
| Quality trust badges                                | Horizontal badge row                                 | 'Chemical-Free', 'Antibiotic-Free', 'Humanely Raised', 'Cleaned & Cut' — small green chip badges                                                                                                   |
| 'Freshness Guaranteed' label                        | View                                                 | Green tag: 'Delivered within 24–36 hrs of sourcing'                                                                                                                                                |
| Product name                                        | Text                                                 | Poppins Bold 20pt — e.g. 'Surmai / King Fish (Whole)'                                                                                                                                              |
| Price + weight                                      | Row                                                  | ₹ price large; pack size (e.g. '500g', '1 piece ~700g')                                                                                                                                            |
| MRP strikethrough + discount badge                  | Row                                                  | Compare price with red strike; green '20% Off' badge                                                                                                                                               |
| Stock status                                        | View                                                 | 'In Stock' (green) / 'Only 5 left!' (orange) / 'Out of Stock' with 'Notify Me' button (red)                                                                                                        |
| Weight / Pack Size selector                         | Chip buttons horizontal                              | e.g. '500g | ₹299', '1kg | ₹549', '2kg | ₹999'; selecting recalculates price                                                                                                                    |
| CUT PREFERENCE selector (FreshToHome-specific)      | SegmentedControl or RadioGroup                       | Options vary by product. For fish: 'Whole', 'Cross Cuts', 'Curry Cut', 'Fillets'. For chicken: 'Whole', 'Curry Cut (8 pcs)', 'Boneless Cubes', 'Keema/Mince'. Stored in order_items.cut_preference |
| CLEANING PREFERENCE selector (FreshToHome-specific) | RadioGroup                                           | Options: 'Cleaned & Ready to Cook' (default, most common) | 'Uncleaned (for those who prefer to clean at home)'. Stored in order_items.cleaning_preference                                        |
| Quantity stepper                                    | Row: – / count / +                                   | Min 1 pack; max = stock_quantity                                                                                                                                                                   |
| 'Add to Cart' sticky button                         | Primary button (green, full-width, sticky at bottom) | Includes cut + cleaning preference in cart item; POST /cart/items {product_id, quantity, cut_preference, cleaning_preference, weight_variant}                                                      |
| 'Add to Wishlist' icon                              | Heart icon                                           | Toggle; filled = wishlisted                                                                                                                                                                        |
| 'View Recipe' icon link                             | Pressable row                                        | Opens a recipe modal or WebView with suggested recipes for this product — differentiator feature                                                                                                   |
| Delivery slot info row                              | Row with clock icon                                  | 'Next available slot: Today 4:00–5:00 PM' — pulled from GET /stores/slots                                                                                                                          |
| '100+ Quality Checks' row                           | Pressable                                            | Opens modal or WebView with Daily Fresh quality assurance documentation                                                                                                                            |
| Product description                                 | Collapsible section                                  | Rich text about sourcing, how it's cleaned, shelf life                                                                                                                                             |
| Nutritional info                                    | Collapsible table                                    | Per 100g: Protein, Fat, Carbs, Calories, Sodium                                                                                                                                                    |
| Customer reviews section                            | FlatList                                             | Avg rating stars, rating distribution bars, review cards with rating, title, body, date                                                                                                            |
| 'Write a Review' button                             | Button                                               | Verified purchase only; opens ReviewFormScreen                                                                                                                                                     |
| Related products row                                | Horizontal FlatList                                  | Same category; GET /products/:slug/related                                                                                                                                                         |

**<u>APP-C-11: Search Screen</u>**

| **Element**         | **Type**              | **Behaviour / Content**                                                       |
|---------------------|-----------------------|-------------------------------------------------------------------------------|
| Search bar          | TextInput (autofocus) | Debounce 300ms; placeholder: 'Search for pomfret, chicken...'                 |
| Popular searches    | Chip row              | e.g. 'King Fish', 'Chicken Breast', 'Tiger Prawns', 'Boneless Mutton'         |
| Recent searches     | FlatList              | Stored in MMKV; 'X' to remove; 'Clear All'                                    |
| Live suggestions    | FlatList              | Product name + category + thumbnail as user types                             |
| Search results grid | FlatList numColumns=2 | ProductCard grid on submit/suggestion tap                                     |
| No results state    | View                  | 'No results for X' + 'Try searching for: Chicken / Fish / Mutton' suggestions |

**<u>APP-C-12: Cart Screen (FreshToHome-style — delivery slot selection here)</u>**

FreshToHome places delivery slot selection on the Cart screen itself (not at checkout), as an overlay bottom sheet. We replicate this UX.

| **Element**                                              | **Type**                    | **Behaviour / Content**                                                                                                                                                                                                                                                                                    |
|----------------------------------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Cart items list                                          | SwipeableList               | Swipe left → Delete; each row: product image, name, cut preference shown (e.g. 'Curry Cut'), cleaning preference, weight variant, quantity stepper, line total                                                                                                                                             |
| Cut/Cleaning preference inline                           | View below product name     | Shows chosen preference; tap to edit opens bottom sheet to change cut/cleaning                                                                                                                                                                                                                             |
| Checkbox per item (FreshToHome feature)                  | Checkbox top-left of image  | User can uncheck items to exclude from this checkout while keeping them in cart                                                                                                                                                                                                                            |
| DELIVERY SLOT SELECTOR (FreshToHome UX — bottom overlay) | Pressable row → BottomSheet | Shows selected slot summary: 'Deliver Today, 4:00–5:00 PM'; tap opens full slot picker sheet                                                                                                                                                                                                               |
| Delivery slot bottom sheet                               | BottomSheet                 | Tabs: Today | Tomorrow | Day After. Under each day: available 1-hour slots from store (e.g. 8–9 AM, 10–11 AM, 12–1 PM, 2–3 PM, 4–5 PM, 6–7 PM); Express slot (30–90 min, extra charge) shown at top if available; slots greyed if store not accepting; tap to select → sheet closes → slot shown in cart |
| Express delivery badge                                   | Badge on Express slot       | '⚡ Express — within 60 min' with extra delivery charge shown                                                                                                                                                                                                                                              |
| Coupon code input                                        | TextInput + 'Apply' button  | POST /coupons/validate; green discount row appears on success                                                                                                                                                                                                                                              |
| Order summary card                                       | View                        | Subtotal, Coupon Discount (green negative), Delivery Charge (waived if above ₹499), GST, Grand Total                                                                                                                                                                                                       |
| 'Free delivery on orders above ₹499' note                | Text                        | Green info text if cart below threshold; shows amount needed for free delivery                                                                                                                                                                                                                             |
| Minimum order notice                                     | View                        | Red notice if cart below minimum order value (configurable)                                                                                                                                                                                                                                                |
| 'Proceed to Pay' button                                  | Primary button full-width   | Navigates → AddressScreen; validates stock first                                                                                                                                                                                                                                                           |
| Empty cart state                                         | View                        | 'Your cart is empty' + 'Start Shopping' CTA → HomeScreen                                                                                                                                                                                                                                                   |

**<u>APP-C-13: Address Screen (Checkout Step 1)</u>**

| **Element**                   | **Type**            | **Behaviour / Content**                                                                                                                                                       |
|-------------------------------|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Delivery details summary card | View (read-only)    | Selected slot shown at top: e.g. 'Delivering Today, 4:00–5:00 PM'; 'Change Slot' link                                                                                         |
| Saved addresses list          | RadioGroup FlatList | Each: label (Home/Work/Other), recipient name, phone, full address; 'Edit' button                                                                                             |
| Default address               | Pre-selected        | is_default=true auto-selected                                                                                                                                                 |
| '+ Add New Address' button    | Button              | Opens inline form or navigates → AddressFormScreen                                                                                                                            |
| Address form                  | Form                | Label (dropdown), Full Name, Phone, Line1 (with Google Places autocomplete), Line2/Landmark, City, State, Pincode; pincode validated against serviceable zones; 'Save' button |
| Serviceability warning        | View                | If added pincode not serviceable: 'Sorry, we don't deliver to this pincode yet.'                                                                                              |
| 'Continue to Payment' button  | Primary button      | → PaymentScreen                                                                                                                                                               |

**<u>APP-C-14: Payment Screen (Razorpay SDK)</u>**

| **Element**              | **Type**                           | **Behaviour / Content**                                                                              |
|--------------------------|------------------------------------|------------------------------------------------------------------------------------------------------|
| Order summary header     | View                               | Order items count, delivery slot, delivery address — final review before paying                      |
| Items list (compact)     | FlatList                           | Product name, cut/cleaning preference, qty, line total                                               |
| Price breakdown          | View                               | Subtotal, Discount, Delivery, GST, Grand Total                                                       |
| Razorpay checkout launch | Button → RazorpayCheckout.open()   | Loads Razorpay native sheet with all payment methods (UPI / Card / Wallet / Net Banking / EMI / COD) |
| COD option               | Radio in Razorpay or pre-selection | If COD enabled by admin for this pincode; order confirmed without Razorpay                           |
| 'Place Order' button     | Primary button                     | Launches Razorpay or confirms COD order                                                              |
| Loading overlay          | ActivityIndicator                  | While POST /orders and Razorpay session create                                                       |
| Failure state            | View                               | 'Payment failed' + error reason + 'Retry' button                                                     |

**<u>APP-C-15: Order Success Screen</u>**

| **Element**                          | **Type**         | **Behaviour / Content**                                       |
|--------------------------------------|------------------|---------------------------------------------------------------|
| Lottie success animation             | LottieView       | Green checkmark + sparkles (~2s)                              |
| 'Order Placed! 🎉' title             | Text             | Poppins Bold 22pt                                             |
| Order number                         | Text             | 'Order #DF-20260410-0042' — tappable → OrderDetailScreen     |
| Delivery slot confirmation           | Text             | 'Your order will be delivered Today, 4:00–5:00 PM'            |
| Preparation note (FreshToHome-style) | Text             | 'We'll clean and cut your order fresh before dispatching. 🔪' |
| 'Track Order' button                 | Primary button   | → OrderDetailScreen                                           |
| 'Continue Shopping' button           | Secondary button | → HomeScreen; clears cart navigation stack                    |

**<u>APP-C-16: Orders Screen</u>**

| **Element**          | **Type**                 | **Behaviour / Content**                                                                                                       |
|----------------------|--------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Top tab bar          | TopTabNavigator          | Active | Delivered | Cancelled                                                                                              |
| Order card           | Pressable View           | Order #, date placed, delivery slot, item summary (e.g. 'Surmai 500g Curry Cut + Chicken 1kg Boneless'), total, status badge |
| Status badges        | Colour-coded             | Pending=Orange, Confirmed=Blue, Packed=Purple, Out for Delivery=Teal, Delivered=Green, Cancelled=Red                          |
| 'Track Order' button | Button on Active card    | → OrderDetailScreen tracking tab                                                                                              |
| 'Reorder' button     | Button on Delivered card | POST /orders/:id/reorder — adds same items + preferences to cart                                                              |
| 'Rate Order' prompt  | Inline banner            | Shown on recently-delivered orders; 'Rate your experience' → ReviewFormScreen                                                 |
| Empty state          | View                     | 'No orders yet — start shopping for fresh produce!'                                                                           |

**<u>APP-C-17: Order Detail Screen</u>**

| **Element**                                         | **Type**                                | **Behaviour / Content**                                                                                                       |
|-----------------------------------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Status stepper                                      | Horizontal or vertical animated stepper | Order Placed → Confirmed → Being Prepared (FreshToHome-specific: cleaning/cutting in progress) → Out for Delivery → Delivered |
| 'Being Prepared' step detail (FreshToHome-specific) | Text below step                         | 'Your order is being cleaned, cut, and packed fresh at our store.'                                                            |
| Live tracking map                                   | MapView                                 | Only when 'Out for Delivery'; rider pin + customer drop pin + route polyline; updates every 5s via Socket.IO                  |
| Rider info card                                     | View                                    | Rider name, photo, phone; 'Call' button; only shown when Out for Delivery                                                     |
| Delivery slot row                                   | View                                    | 'Scheduled for Today, 4:00–5:00 PM' — always visible                                                                          |
| Delivery address card                               | View                                    | Full snapshot address from order.shipping_address                                                                             |
| Order items table                                   | FlatList                                | Product image, name, cut preference, cleaning preference, weight, qty, unit price, line total                                 |
| Financial summary                                   | View                                    | Subtotal, Discount, Delivery, GST, Grand Total, Payment method                                                                |
| Missing item complaint button                       | Button                                  | 'Missing / Wrong item?' → raises complaint ticket; POST /orders/:id/complaint                                                 |
| Cancel order button                                 | Button (red outline)                    | Only if status = pending or confirmed and more than 2 hrs before slot; POST /orders/:id/cancel with reason                    |
| 'Rate & Review' button                              | Button                                  | Visible after Delivered; → ReviewFormScreen                                                                                   |
| 'Reorder' button                                    | Secondary button                        | Adds same items + preferences to cart                                                                                         |

**<u>APP-C-18: Account Screen (FreshToHome sidebar-style)</u>**

| **Element**                 | **Type**       | **Behaviour / Content**                                                                                                                      |
|-----------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Avatar + Name + phone/email | View           | Profile photo (editable); name; phone number                                                                                                 |
| VIP Membership banner       | Pressable card | If not VIP: 'Unlock free delivery + exclusive deals — Join VIP' with green CTA → VIPMembershipScreen. If VIP: 'You're a VIP Member ⭐' badge |
| Menu list                   | FlatList       | My Orders, My Addresses, My Wishlist, Notifications, Rate the App, Help & Support, Terms & Conditions, Privacy Policy, Logout                |
| App version                 | Footer text    | 'Daily Fresh v1.0.0'                                                                                                                         |

**<u>APP-C-19: VIP Membership Screen (FreshToHome's 'FTH VIP' equivalent)</u>**

| **Element**            | **Type**       | **Behaviour / Content**                                                                                       |
|------------------------|----------------|---------------------------------------------------------------------------------------------------------------|
| Hero banner            | View           | 'Daily Fresh VIP — Unlimited Free Delivery + Exclusive Deals'                                                 |
| Benefits list          | FlatList       | Free delivery on all orders, Early access to new products, Extra 5% off all orders, Priority customer support |
| Pricing plans          | View           | Monthly (₹99/month), Quarterly (₹249/3 months), Annual (₹799/year — best value badge)                         |
| 'Subscribe' button     | Primary button | Opens Razorpay subscription checkout; POST /membership/subscribe                                              |
| Active membership card | View           | If already subscribed: expiry date, plan name, 'Cancel Membership' link                                       |

**<u>APP-C-20: Wishlist / Saved Products Screen</u>**

| **Element**          | **Type**              | **Behaviour / Content**                                                           |
|----------------------|-----------------------|-----------------------------------------------------------------------------------|
| Tabs                 | TabView               | Wishlist | Notify Me (out-of-stock items they want to be notified about)         |
| Wishlist grid        | FlatList numColumns=2 | ProductCard with 'Remove' icon; 'Add to Cart' button directly on card             |
| Notify Me list       | FlatList              | Products marked for back-in-stock alert; shows 'In Stock!' badge if now available |
| Empty wishlist state | View                  | 'Nothing saved yet — heart products you love!'                                    |

**<u>APP-C-21: Notifications Screen</u>**

| **Element**       | **Type**            | **Behaviour / Content**                                                                  |
|-------------------|---------------------|------------------------------------------------------------------------------------------|
| Notification list | FlatList            | Icon (by type), title, body, relative time                                               |
| Types             | View                | Order updates (🚚), Deals & Offers (🏷️), Back-in-Stock alerts (🔔), System messages (ℹ️) |
| Unread blue dot   | View                | Left side of unread notifications                                                        |
| 'Mark all read'   | Header button       | PATCH /notifications/read-all                                                            |
| Swipe to delete   | ReanimatedSwipeable | DELETE /notifications/:id                                                                |

**<u>APP-C-22: Address Book Screen</u>**

| **Element**                | **Type** | **Behaviour / Content**                                                                                                          |
|----------------------------|----------|----------------------------------------------------------------------------------------------------------------------------------|
| Address list               | FlatList | Label badge (Home/Work/Other), name, phone, full address, 'Edit' + 'Delete' + 'Set Default' actions; serviceability status shown |
| Default badge              | View     | 'Default' chip on is_default=true address                                                                                        |
| '+ Add New Address' button | FAB      | → AddressFormScreen                                                                                                              |

**<u>APP-C-23: Review / Rate Order Screen</u>**

| **Element**        | **Type**               | **Behaviour / Content**                        |
|--------------------|------------------------|------------------------------------------------|
| Star rating input  | Star row (1–5)         | Tappable stars; required                       |
| Review title input | TextInput              | Optional; max 60 chars                         |
| Review body input  | TextArea               | Min 10 chars                                   |
| Photo upload       | ImagePicker (optional) | Attach photo proof; POST /uploads/review-photo |
| Submit button      | Primary button         | POST /products/:id/reviews; navigates back     |


---

# SECTION 5 — STORE MANAGER APP — ALL SCREENS & UI ELEMENTS
The Store Manager App is built in React Native. It is used by Daily Fresh store staff to manage inventory, accept and prepare orders, and coordinate rider pickups. Store accounts are created by the Admin (no self-registration KYC flow). Uses Bottom Tab Navigator: Dashboard | Orders | Inventory | Earnings | Profile.

**<u>APP-S-01: Store Manager Login Screen (Admin-created accounts — no self-registration)</u>**

Store managers do not self-register. The Daily Fresh Admin creates their account via the Admin Panel and shares credentials. This screen is a standard email/password login.

| **Element**                                    | **Type**                  | **Behaviour / Content**                                                             |
|------------------------------------------------|---------------------------|-------------------------------------------------------------------------------------|
| App logo + 'Daily Fresh — Store Manager' title | Image + Text              | Centred on login card; distinguishes from customer app                              |
| Email input                                    | TextInput                 | Pre-assigned by admin; email format validation                                      |
| Password input                                 | TextInput                 | secureTextEntry; eye toggle; 'Forgot Password?' link sends reset to email           |
| 'Login' button                                 | Primary button full-width | Calls POST /auth/login; validates role='store_manager'; navigates → DashboardScreen |
| Error state                                    | Inline text               | 'Invalid credentials' or 'Account inactive — contact Daily Fresh admin'             |
| 5 failed attempts → lockout                    | Logic                     | 15-minute lockout; countdown shown                                                  |

**<u>APP-S-02: Store Home / Dashboard Screen</u>**

| **Element**                 | **Type**          | **Behaviour / Content**                                                         |
|-----------------------------|-------------------|---------------------------------------------------------------------------------|
| Header                      | View              | Store name + logo; 'Open / Closed' toggle for store availability                |
| Today's KPI row             | Horizontal scroll | Orders Today, Revenue Today, Pending Orders, Items Low on Stock — as stat cards |
| Pending orders alert banner | View              | Red banner if pending orders > 0; 'View Orders' CTA                            |
| Recent orders list (top 5)  | FlatList          | Order #, time placed, items count, total; 'View All' link                      |
| Low stock panel             | View              | Products with stock ≤ threshold; 'Restock' link                                 |
| Store info card             | View              | Store name, address, working hours; 'Edit Store Profile' link                   |
| Pull-to-refresh             | RefreshControl    | Re-fetches GET /store/dashboard                                                 |

**<u>APP-S-03: Store Dashboard Screen</u>**

| **Element**           | **Type**                     | **Behaviour / Content**                                                                |
|-----------------------|------------------------------|----------------------------------------------------------------------------------------|
| Header                | View                         | Store name, logo, online/offline toggle badge                                          |
| Period selector       | SegmentedControl             | Today | This Week | This Month | Custom range                                       |
| KPI cards row         | Horizontal scroll            | Total Revenue, Orders Fulfilled, Avg Order Value, Pending Orders — each as a stat card |
| Revenue chart         | LineChart (Recharts/Victory) | Revenue per day for selected period                                                    |
| Recent orders list    | FlatList (top 5)             | Order number, items count, total, status; 'View All Orders' link                       |
| Low stock alert panel | View                         | Products with stock ≤ threshold; 'Restock' link per item                               |
| Pull-to-refresh       | RefreshControl               | Re-fetches GET /store/dashboard                                                        |

**<u>APP-S-04: Store Orders Screen</u>**

| **Element**                    | **Type**        | **Behaviour / Content**                                                                                                 |
|--------------------------------|-----------------|-------------------------------------------------------------------------------------------------------------------------|
| Tab bar                        | TopTabNavigator | New | Preparing | Ready | Completed | Cancelled                                                                     |
| Order card                     | Pressable View  | Order #, time since placed, items list summary, customer name, total, status badge, Accept/Reject buttons (on New tab) |
| Accept button                  | Button (green)  | PATCH /store/orders/:id/accept; moves to Preparing tab                                                                  |
| Reject button                  | Button (red)    | PATCH /store/orders/:id/reject; requires reason dropdown                                                                |
| 'Mark Ready for Pickup' button | Button          | PATCH /store/orders/:id/ready; visible on Preparing tab; notifies rider                                                 |
| Order detail modal             | BottomSheet     | Full itemised order view: product images, names, variants, quantities, delivery address, customer phone                 |
| Pending orders badge           | FCM + badge     | Real-time push on new order; badge on Orders tab icon                                                                   |

**<u>APP-S-05: Inventory / Product Catalogue Screen</u>**

| **Element**              | **Type**             | **Behaviour / Content**                                                                 |
|--------------------------|----------------------|-----------------------------------------------------------------------------------------|
| Search bar               | TextInput            | Search within own products                                                              |
| Filter bar               | HorizontalScrollView | All | Active | Inactive | Low Stock                                                  |
| Product list             | FlatList             | Each row: thumbnail, name, SKU, price, stock qty, status toggle, Edit icon, Delete icon |
| Stock quick-edit         | Inline TextInput     | Tap stock number → editable inline → save on blur                                       |
| Status toggle            | Switch               | is_active toggle; PATCH /store/products/:id/toggle                                      |
| '+ Add Product' FAB      | FloatingActionButton | Navigates → AddEditProductScreen                                                        |
| 'Bulk Upload CSV' button | Button               | DocumentPicker for CSV; POST /store/products/bulk-upload                                |
| Low stock badge          | Red badge            | Stock ≤ low_stock_threshold shows red dot                                               |

**<u>APP-S-06: Add / Edit Product Screen</u>**

| **Element**                  | **Type**                          | **Behaviour / Content**                                                    |
|------------------------------|-----------------------------------|----------------------------------------------------------------------------|
| Product images               | ImagePicker (multi-select, max 5) | Drag to reorder; first image = thumbnail; POST /uploads/product-image each |
| Product name input           | TextInput                         | Required, max 100 chars                                                    |
| Category selector            | Dropdown BottomSheet              | Single select from GET /categories                                         |
| Description input            | TextInput multiline               | Min 20 chars                                                               |
| Short description            | TextInput                         | 1-liner, max 80 chars, shown on product card                               |
| Price input                  | TextInput (numeric)               | Required; INR; decimal allowed                                             |
| Compare price (MRP) input    | TextInput (numeric)               | Optional; must be ≥ price if set                                           |
| Cost price input             | TextInput (numeric)               | Internal only; not shown to customers                                      |
| SKU input                    | TextInput                         | Required; unique; auto-suggest button                                      |
| Stock quantity input         | TextInput (numeric)               | Integer ≥ 0                                                                |
| Low stock threshold          | TextInput (numeric)               | Default 10; alert triggers when stock ≤ this                               |
| Flavours input               | TagInput                          | Comma-separated or add-chip UI: Chocolate, Vanilla, etc.                   |
| Sizes input                  | TagInput                          | e.g. 500g, 1kg, 2kg                                                        |
| Weight (grams) input         | TextInput (numeric)               | For shipping weight                                                        |
| Nutritional info             | Dynamic form                      | Key-value pairs: Protein, Carbs, Fat, Calories, etc.                       |
| Ingredients                  | TextInput multiline               | Plain text ingredients list                                                |
| Tags input                   | TagInput                          | For search indexing                                                        |
| is_active toggle             | Switch                            | Publish/unpublish immediately                                              |
| is_featured toggle           | Switch                            | Request to be featured (Admin approves)                                    |
| SEO meta title + description | TextInput x2                      | Optional; for web storefront                                               |
| Save button                  | Primary button                    | POST /store/products (create) or PUT /store/products/:id (edit)            |

**<u>APP-S-07: Earnings Screen</u>**

| **Element**              | **Type**         | **Behaviour / Content**                                       |
|--------------------------|------------------|---------------------------------------------------------------|
| Period selector          | SegmentedControl | Today | Week | Month | Custom                              |
| Total earnings card      | StatCard         | Large INR value; commission deducted shown below              |
| Pending settlement card  | StatCard         | Amount not yet transferred to bank                            |
| Next payout date         | Text             | e.g. 'Next payout: 15 April 2026'                             |
| Earnings breakdown chart | BarChart         | Per day/week revenue bars                                     |
| Transaction list         | FlatList         | Order #, date, order total, settlement status (Pending/Paid) |
| Export CSV button        | Button           | Downloads earnings CSV for selected period                    |
| Bank account card        | View             | Masked account number; 'Edit Bank Details' link               |


---

# SECTION 6 — RIDER APP — ALL SCREENS & UI ELEMENTS
The Rider App is built in React Native. Uses Stack Navigator. Riders must be approved by Admin before going online.

**<u>APP-R-01: Rider Registration & Document Upload</u>**

| **Element**                    | **Type**       | **Behaviour / Content**                                 |
|--------------------------------|----------------|---------------------------------------------------------|
| Full name, phone, email inputs | TextInputs     | Standard validation                                     |
| Vehicle type selector          | Dropdown       | 2-Wheeler | 3-Wheeler | 4-Wheeler | Cycle            |
| Vehicle number input           | TextInput      | Format: XX-00-XX-0000                                   |
| Driving licence number         | TextInput      | Alphanumeric                                            |
| Licence photo (front & back)   | ImagePicker x2 | POST /uploads/rider-doc                                 |
| Government ID (Aadhaar/PAN)    | ImagePicker    | POST /uploads/rider-doc                                 |
| Vehicle RC upload              | ImagePicker    | POST /uploads/rider-doc                                 |
| Bank account details           | Form           | Account holder, Number, IFSC, Bank name                 |
| Profile photo                  | ImagePicker    | POST /uploads/avatar                                    |
| Submit button                  | Primary button | POST /rider/register → navigate → RiderKYCPendingScreen |

**<u>APP-R-02: Rider Home / Availability Screen</u>**

| **Element**                   | **Type**       | **Behaviour / Content**                                                                                                                                           |
|-------------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Online/Offline toggle (large) | AnimatedSwitch | Large central toggle; PATCH /rider/availability; green when online                                                                                                |
| Status text                   | Text           | 'You are ONLINE — Ready to receive orders' or 'You are OFFLINE'                                                                                                   |
| Today's stats bar             | View           | Today's earnings | Deliveries completed | Hours online                                                                                                          |
| Map background                | MapView        | Shows rider's current location; updates via GPS every 10s                                                                                                         |
| Active delivery card          | View           | Shown if rider has an active delivery; order details + navigation button                                                                                          |
| Incoming order modal          | Animated Modal | Auto-pops when new task assigned (via Socket.IO event); order details, pickup/drop address, estimated earning, distance; Accept/Reject buttons with 30s countdown |

**<u>APP-R-03: Active Delivery Screen</u>**

| **Element**                         | **Type**           | **Behaviour / Content**                                                                                                    |
|-------------------------------------|--------------------|----------------------------------------------------------------------------------------------------------------------------|
| Map with route                      | MapView            | Turn-by-turn route polyline from current location to pickup, then to drop                                                  |
| Current step indicator              | View               | 'Go to Store: [Daily Fresh Store Name]' or 'Go to Customer: [Area]'                                                    |
| Turn-by-turn directions panel       | View               | Next instruction from Google Maps Directions API                                                                           |
| 'Open in Google Maps'/'Waze' button | Pressable          | Deep link to native maps app with destination                                                                              |
| Pickup confirmation button          | Primary button     | 'Confirm Pickup' (after reaching store); PATCH /deliveries/:id/status {status:'picked_up'}; OTP confirmation if applicable |
| Delivery proof section (at drop)    | View               | 'Confirm Delivery' button → Photo capture or OTP input; POST /deliveries/:id/proof                                         |
| Customer contact card               | View               | Customer name + masked phone; 'Call Customer' button                                                                       |
| Order items summary                 | Collapsible        | Items in this delivery for reference                                                                                       |
| SOS button                          | Destructive button | Fixed at bottom-right; POST /rider/sos; sends location to Admin                                                            |

**<u>APP-R-04: Delivery History Screen</u>**

| **Element**           | **Type**        | **Behaviour / Content**                                              |
|-----------------------|-----------------|----------------------------------------------------------------------|
| Date filter           | DateRangePicker | Filter by date range                                                 |
| Delivery cards        | FlatList        | Delivery #, date/time, from-to locations, distance, earning, status |
| Total earnings footer | View            | Sum of earnings for filtered period                                  |

**<u>APP-R-05: Rider Earnings Screen</u>**

| **Element**             | **Type** | **Behaviour / Content**                                                       |
|-------------------------|----------|-------------------------------------------------------------------------------|
| Earnings summary card   | View     | Total earned today/week/month; wallet balance                                 |
| Incentive breakdown     | View     | Base pay per delivery + bonus for completing X deliveries/day                 |
| Payout history list     | FlatList | Date, amount, bank reference, status (Pending/Paid)                           |
| 'Request Payout' button | Button   | Available when wallet balance ≥ minimum threshold; POST /rider/payout/request |

**<u>APP-R-06: Rider Profile Screen</u>**

| **Element**              | **Type** | **Behaviour / Content**                                       |
|--------------------------|----------|---------------------------------------------------------------|
| Avatar + Name + Rating   | View     | Star rating from customer reviews                             |
| Edit personal details    | Form     | Name, phone, email                                            |
| Edit vehicle details     | Form     | Vehicle type, number, RC photo update                         |
| Edit bank details        | Form     | Masked account; 'Update Bank Account' with OTP verification   |
| Document status          | List     | Each document: Approved / Pending / Rejected with expiry date |
| Notification preferences | Toggles  | Order alerts, payout alerts, promo notifications              |
| Logout button            | Button   | Clears tokens, navigate → LoginScreen                         |


---

# SECTION 7 — WEB ADMIN PANEL — ALL SCREENS & UI ELEMENTS
The Web Admin Panel is a React.js (Next.js) SPA served on admin.dailyfresh.com. Exclusively for the Daily Fresh owner. Since Daily Fresh is a single-vendor brand, the Admin creates all stores, assigns store managers, and manages orders, riders, analytics, and payouts. There is NO external vendor self-registration.

**<u>ADM-01: Admin Login Screen</u>**

| **Element**                 | **Type**         | **Behaviour / Content**                                   |
|-----------------------------|------------------|-----------------------------------------------------------|
| Logo + 'Admin Panel' title  | Image + Text     | Centred on login card                                     |
| Email input                 | Input            | Email format validation                                   |
| Password input              | Input.Password   | Show/hide toggle                                          |
| Login button                | Button (primary) | POST /auth/login; role check (must be 'admin')            |
| Error message               | Alert            | 'Invalid credentials' or 'Access denied — admin only'     |
| 5 failed attempts → lockout | Logic            | 15-minute lockout; countdown shown                        |
| 'Forgot Password?' link     | Link             | Opens email input modal; calls POST /auth/forgot-password |

**<u>ADM-02: Dashboard Screen (Elite Command Center)</u>**

| **Element**                   | **Type**               | **Behaviour / Content**                                                                                                                                                                    |
|-------------------------------|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Elite UI Layer                | Style System           | Premium High-Contrast Dark Theme; Glassmorphism on sidebar/cards; Radial light-leak gradients.                                                                                             |
| Date Preset Quick-Select      | Dropdown               | Options: **Today, Last 7 Days, Last 30 Days, This Month**. Automatically updates all KPIs and charts; provides faster workflow than manual date picking.                                   |
| high-density KPI Grid         | StatCard (Metric Hub)  | 5 Core Metrics: **Total Revenue**, **Order Count**, **Register Customers**, **Active Riders**, **VIP Subscriptions**. Includes count numbers and period-relative trend markers.            |
| Revenue Line Chart            | Recharts LineChart     | Dual-line: Gross Revenue vs Net Revenue; Cross-hair tooltips for detailed per-day analysis.                                                                                                |
| Orders Workflow Donut Chart   | Recharts PieChart      | Shows order distribution by logistics stage (Pending, Processing, In Transit, Delivered).                                                                                                  |
| Top Sellers Heatmap           | Recharts BarChart      | Products sorted by volume; high-contrast bars with value labels.                                                                                                                           |
| Low Stock Intelligence        | Alert List (Critical)  | Automated scanning: products with stock ≤ 10 units (global setting). Shows SKU, current count, and direct link to restock.                                                                 |
| Recent Orders Table           | Premium Table          | Last 15 orders; inline status badges; quick "View" drawer action.                                                                                                                         |
| Order Management Shortcut     | Quick Actions          | Button group: "New Order Command Center", "Add New Product", "System Status".                                                                                                              |

**<u>ADM-03: Product Management Screen</u>**

| **Element**                | **Type**                   | **Behaviour / Content**                                                                    |
|----------------------------|----------------------------|--------------------------------------------------------------------------------------------|
| Searchable data table      | AntD Table                 | Columns: Thumbnail, Name, SKU, Category, Store, Price, Stock, Status, Actions              |
| Search + filter bar        | Input + Select dropdowns   | Search by name/SKU; Filter by Category, Store, Status (active/inactive/deleted), Low Stock |
| Inline stock edit          | Editable cell              | Click stock number → input → Enter to save (PATCH /admin/products/:id/stock)               |
| Status toggle              | Switch                     | is_active PATCH /admin/products/:id/toggle                                                 |
| 'Add Product' button       | Button                     | Opens AddEditProductDrawer (Ant Design Drawer)                                             |
| Bulk select + bulk actions | Checkbox column + Dropdown | Select multiple → bulk activate/deactivate/delete                                          |
| 'Export CSV' button        | Button                     | Downloads product list as CSV                                                              |
| View/Edit modal            | Drawer                     | Full product form (same fields as Store Manager App product form)                          |
| Product moderation filter  | Tab                        | Tabs: All | Active | Inactive — (single-vendor; no external product approval needed)     |
| Approve/Reject buttons     | Button                     | PATCH /admin/products/:id/approve or /reject with optional reason                          |

**<u>ADM-04: Order Command Center</u>**

| **Element**                 | **Type**                | **Behaviour / Content**                                                                                                                                                                                                    |
|-----------------------------|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Operational Pipeline Tabs   | Segmented Control       | **New Orders** | **Processing** | **In Transit** | **Finalized**. Aligned with logistics workflow instead of simple status filters.                                                                                   |
| Real-Time Sync Hub          | Logic                   | **60-Second Auto-Refresh Engine**: Background synchronization without page reloads to ensure logistics team sees new orders instantly.                                                                                    |
| "NEW" Order Pulse           | Animated Badge          | Orders created within the last 60 minutes display a pulsing premium badge to alert the admin to immediate fulfillment priorities.                                                                                          |
| Grid View (Data Table)      | Premium Table           | Aligned with User Rules: S.No, Order #, Created Date (DD MMM YYYY), Customer, Amount, Logistics Stage, Rider, Actions.                                                                                                     |
| Filter & Search Bar         | Search + Date Presets   | Global search (Order ID/Customer Name) + Date presets + Store filter.                                                                                                                                                      |
| Order Action Drawer         | Drawer                  | High-resolution summary: Item breakdown with cut/cleaning preferences, delivery slot visualization, status transition timeline, and Rider assigning unit.                                                                   |
| Fulfillment Controls        | Multi-Action Menu       | One-click transitions based on current stage (e.g., "Confirm Order", "Ready for Pickup", "Mark Delivered").                                                                                                                |
| Logistics Integration       | Rider Modal             | Real-time availability check for riders during assignment; distance-to-store calculations.                                                                                                                                 |

**<u>ADM-05: User Management Screen (Customers / Vendors / Riders)</u>**

| **Element**                              | **Type**   | **Behaviour / Content**                                                                                                                   |
|------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Tab bar                                  | Tabs       | Customers | Store Managers | Riders                                                                                                     |
| Customers table                          | AntD Table | Name, Email, Phone, Registered Date, Total Orders, Total Spent, Status, Actions                                                           |
| Store Managers table                     | AntD Table | Name, Email, Assigned Store, Phone, Status (Active/Inactive), Orders Handled, Actions — Admin can create/edit store manager accounts here |
| Riders table                             | AntD Table | Name, Phone, Vehicle Type, Status (Pending/Approved/Active/Inactive), Deliveries Count, Rating, Actions                                   |
| 'View Profile' action                    | Drawer     | Full profile + order history (customers), assigned store + performance (store managers), delivery history (riders)                        |
| 'Create Store Manager' button            | Button     | POST /admin/store-managers — Admin creates staff account; assigns to a store; emails credentials                                          |
| 'Approve / Reject' buttons (Riders only) | Button     | PATCH /admin/riders/:id/approve or /reject with reason                                                                                    |
| 'Block / Unblock' toggle                 | Switch     | PATCH /admin/users/:id/toggle                                                                                                             |
| Document verification view (Riders)      | View       | Renders uploaded documents (licence, vehicle RC, ID) for review                                                                           |

**<u>ADM-06: Live Delivery Tracking Screen</u>**

| **Element**               | **Type**        | **Behaviour / Content**                                                   |
|---------------------------|-----------------|---------------------------------------------------------------------------|
| Google Maps full-screen   | Map component   | Shows all active deliveries; rider pins update in real-time via Socket.IO |
| Rider marker              | Custom MapPin   | Rider profile photo in circular pin; colour = online status               |
| Active deliveries sidebar | List            | Each delivery: rider name, order #, pickup location, drop location, ETA  |
| Click rider pin           | Map interaction | Opens rider info card: name, phone, current order, earnings today         |
| Filter by zone            | Dropdown        | Filter map to specific delivery zones                                     |
| Refresh rate indicator    | Text            | 'Live — updating every 5s'                                                |

**<u>ADM-07: Category Management Screen</u>**

| **Element**            | **Type**      | **Behaviour / Content**                                                                                        |
|------------------------|---------------|----------------------------------------------------------------------------------------------------------------|
| Category list          | DragDrop list | Drag-and-drop to reorder display_order; PUT /admin/categories/reorder                                          |
| Category row           | View          | Image, Name, Slug, Products Count, Status toggle, Edit + Delete actions                                        |
| Add/Edit Category form | Drawer        | Name, Slug (auto-generated), Description, Image upload, Display Order, is_active, meta_title, meta_description |
| Sub-categories section | Nested list   | Add/remove/reorder sub-categories per parent                                                                   |
| Delete protection      | Logic         | Cannot delete if products assigned; shows count of assigned products                                           |

**<u>ADM-08: Coupon Management Screen</u>**

| **Element**            | **Type**      | **Behaviour / Content**                                                                                                                                                 |
|------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Coupons table          | AntD Table    | Code, Type, Value, Min Order, Uses (used/max), Validity, Status, Actions                                                                                                |
| Create Coupon form     | Drawer        | Code, Description, Type (flat/percent), Value, Max Discount Cap, Min Order Value, Max Total Uses, Max Per User, Valid From, Valid Until, Applicable Products/Categories |
| Usage stats            | Click to view | Shows list of users who used the coupon with order references                                                                                                           |
| Toggle active/inactive | Switch        | PATCH /admin/coupons/:id/toggle                                                                                                                                         |

**<u>ADM-09: Banner Management Screen</u>**

| **Element**             | **Type**   | **Behaviour / Content**                                                                                                                    |
|-------------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Banners table           | AntD Table | Title, Placement, Image Preview, Display Order, Valid From/Until, Status                                                                   |
| Create/Edit Banner form | Drawer     | Title, Alt Text, Image upload (desktop + mobile versions), Link URL, Placement dropdown, Display Order, Valid From, Valid Until, is_active |
| Drag to reorder         | DragDrop   | PUT /admin/banners/reorder within same placement group                                                                                     |

**<u>ADM-10: Analytics Screen</u>**

| **Element**               | **Type**   | **Behaviour / Content**                 |
|---------------------------|------------|-----------------------------------------|
| Revenue chart             | LineChart  | Date range, granularity: Day/Week/Month |
| New customers chart       | BarChart   | Registrations over time                 |
| Top products table        | AntD Table | Rank, Product, Units Sold, Revenue      |
| Orders by status chart    | DonutChart | Status breakdown                        |
| Revenue by category chart | PieChart   | Category breakdown                      |
| Low stock report          | Table      | Product, SKU, Stock, Threshold          |
| Failed payments report    | Table      | Order #, Amount, Date, Failure reason  |
| Export buttons            | Button     | Download each chart/table as CSV or PDF |

**<u>ADM-11: Settings Screen</u>**

| **Element**       | **Type** | **Behaviour / Content**                                                                         |
|-------------------|----------|-------------------------------------------------------------------------------------------------|
| General tab       | Form     | Store Name, Store Email, Store Phone, Store Address, Store Logo upload, Favicon upload          |
| Financial tab     | Form     | GST Rate (%), Free Delivery Above (INR), Default Delivery Charge (INR), Platform Commission (%) |
| Inventory tab     | Form     | Low Stock Alert Threshold (units), Auto low-stock notification toggle                           |
| Zones tab         | Form     | Define delivery zones by pincode/area; set delivery charge per zone; min order per zone         |
| Notifications tab | Form     | Admin email for order alerts, SMS alerts toggle                                                 |
| Save button       | Button   | PUT /admin/settings (bulk update key-value pairs)                                               |

**<u>ADM-12: Push Notification Broadcast Screen</u>**

| **Element**                | **Type**       | **Behaviour / Content**                                                      |
|----------------------------|----------------|------------------------------------------------------------------------------|
| Target selector            | RadioGroup     | All Users | All Customers | All Vendors | All Riders | Specific User IDs |
| User ID input              | TagInput       | Visible when 'Specific User IDs' selected                                    |
| Title input                | TextInput      | Max 60 chars; character counter                                              |
| Body input                 | TextArea       | Max 150 chars                                                                |
| Notification type          | Select         | order_update | promo | system                                              |
| Data payload               | JSON editor    | Optional extra data (e.g. {order_id: '...'})                                 |
| Schedule option            | DateTimePicker | Optional: send now vs schedule for later                                     |
| 'Send Notification' button | Primary button | POST /admin/notifications/broadcast                                          |
| History table              | AntD Table     | Past broadcasts: title, target, sent_count, date                             |


---

# SECTION 8 — TECHNOLOGY STACK (DEEP DIVE)
## 8.1 Mobile Applications (Customer, Vendor, Rider)
| **Layer**          | **Technology**                           | **Version** | **Rationale**                                                           |
|--------------------|------------------------------------------|-------------|-------------------------------------------------------------------------|
| Framework          | React Native (CLI)                       | 0.74+       | Single codebase for Android & iOS; bare workflow for full native access |
| State Management   | Redux Toolkit + RTK Query                | 2.x         | Predictable state; RTK Query for API caching + optimistic updates       |
| Navigation         | React Navigation                         | v6          | Stack + Bottom Tab + Drawer navigators                                  |
| Maps & Location    | Google Maps SDK (react-native-maps)      | 1.x         | Real-time tracking, route optimisation, geocoding                       |
| Push Notifications | Firebase Cloud Messaging (FCM)           | Latest      | Reliable cross-platform; handles background + foreground                |
| Authentication     | Firebase Auth / Supabase Auth            | Latest      | OTP login, social auth, JWT management                                  |
| Local Storage      | MMKV                                     | 2.x         | 10x faster than AsyncStorage; for session tokens, cart, settings        |
| HTTP Client        | Axios                                    | 1.x         | Interceptors for JWT injection, 401 → token refresh → retry             |
| Real-Time          | Socket.IO Client                         | 4.x         | Subscribes to rider location events and order status events             |
| Camera / Media     | react-native-image-picker                | 7.x         | Profile photos, product images, delivery proof (POD)                    |
| Document Picker    | react-native-document-picker             | 9.x         | KYC document uploads (PDF)                                              |
| Payments           | Razorpay React Native SDK                | Latest      | Native UPI, card, wallet, netbanking checkout; WebView fallback         |
| Lottie Animations  | lottie-react-native                      | 6.x         | Splash, success, empty state animations                                 |
| Skeleton Loading   | react-native-skeleton-placeholder        | 5.x         | Shimmer loading screens                                                 |
| Swipeable Rows     | react-native-gesture-handler (Swipeable) | 2.x         | Cart item delete/save, notification delete                              |
| Build System       | EAS Build (Expo Application Services)    | Latest      | Android APK/AAB + iOS IPA cloud builds                                  |
| OTA Updates        | EAS Update                               | Latest      | JS bundle OTA push without app store submission                         |
| Deep Linking       | React Navigation Linking                 | v6          | Handle universal links and URI scheme links                             |

## 8.2 Web Admin Panel
| **Layer**                          | **Technology**                   | **Version** | **Rationale**                                                 |
|------------------------------------|----------------------------------|-------------|---------------------------------------------------------------|
| Frontend Framework                 | React.js (Next.js 14 App Router) | 14.x        | SSR for SEO-irrelevant admin; fast routing; server components |
| UI Component Library               | Ant Design                       | 5.x         | Production-ready admin UI; Table, Form, Drawer, Modal, Charts |
| Charts                             | Recharts                         | 2.x         | LineChart, BarChart, PieChart for analytics dashboards        |
| State Management                   | Zustand                          | 4.x         | Lightweight; no boilerplate; global auth + UI state           |
| Data Fetching                      | React Query (TanStack)           | 5.x         | Server state, caching, background refetch, optimistic updates |
| Forms                              | React Hook Form + Zod            | 7.x + 3.x   | Performant forms; schema-based validation                     |
| HTTP Client                        | Axios                            | 1.x         | Centralised API layer with JWT interceptors                   |
| Authentication                     | JWT (httpOnly cookie)            | —           | Secure session; auto-refresh on 401                           |
| Maps (Admin tracking)              | @react-google-maps/api           | 2.x         | Live delivery tracking map                                    |
| DragDrop (category/banner reorder) | @dnd-kit/core                    | 6.x         | Accessible drag and drop                                      |
| Rich Text (product description)    | Tiptap                           | 2.x         | Product description rich text editor                          |
| Image Upload                       | react-dropzone                   | 14.x        | Drag-and-drop image upload to assets.dailyfresh.in            |
| Date/Time                          | Day.js                           | 1.x         | Lightweight Moment.js alternative                             |
| Elite UI System (Glassmorphic) | Vanilla CSS + React Custom Tokens | 1.0 (Production) | Premium, high-density aesthetics; superior engagement over generic frameworks |
| Notifications (toast)              | react-hot-toast                  | 2.x         | Success/error toast messages                                  |

## 8.4 UI & Interaction Standards (Admin)
To maintain the 'Elite' experience, all admin interfaces must adhere to these unified standards:

### 8.4.1 Data Table Standards (Mandatory)
| **Feature** | **Implementation Rule** |
|:---:|:---|
| **Core Engine** | **TanStack Table** + React Virtual for high-performance rendering of large datasets. |
| **Mandatory Columns** | First Column: **S.No** (Auto-increment); Last Column: **Actions** (Sticky). |
| **Pagination** | Server-side only. Page sizes: **50, 100, 200, 500**. Format: "Showing 1–50 of X records". |
| **Alignment** | Text/IDs: Left; Numbers/Currency: Right; Dates/Status/Actions: Center. |
| **Date Format** | Standard: **DD MMM YYYY** (e.g., 10 Mar 2026). Time: **HH:mm A**. |
| **Exporting** | Every table must support **CSV** and **PDF** export of filtered/sorted data. |
| **Empty State** | Must show a professional "No records found" illustration with a "Create New" CTA. |

### 8.4.2 Design Tokens & Aesthetics
- **Theme**: High-contrast dark-mode baseline with custom semantic secondary colors.
- **Glassmorphism**: Sidebar and primary Hub cards use `backdrop-filter: blur(12px)` with subtle border highlights.
- **Micro-Animations**: Success pulses, skeleton loading shimmers, and smooth scale transitions on hover.
- **Typography**: Precision weights (Inter/Outfit suggested) for maximum clarity in high-density data views.

## 8.3 Backend & Infrastructure
| **Layer**          | **Technology**                           | **Version** | **Rationale**                                                                                                 |
|--------------------|------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------|
| Runtime            | Node.js LTS                              | 20.x        | Non-blocking I/O; ideal for real-time delivery platform                                                       |
| Framework          | Express.js                               | 4.x         | Minimal, flexible REST API; MVC structure                                                                     |
| Database (Primary) | Supabase (PostgreSQL 15)                 | 15          | Managed PostgreSQL; Row Level Security; Realtime subscriptions                                                |
| Database (Cache)   | Redis (Upstash / AWS ElastiCache)        | 7.x         | Session cache, rate limiting, cart storage, Socket.IO pub/sub adapter                                         |
| Real-Time          | Socket.IO                                | 4.x         | Rider location broadcast; order status events; Redis adapter for scaling                                      |
| File Storage       | Custom CDN (assets.dailyfresh.in)        | —           | Self-hosted Nginx-served media storage; product images, delivery proof; WebP served via Nginx + Sharp         |
| Authentication     | Supabase Auth                            | Latest      | JWT issuance; phone OTP; email/password; service_role on backend                                              |
| Auth Middleware    | @supabase/supabase-js (server)           | 2.x         | JWT verification; extracts user.id, user.role                                                                 |
| Input Validation   | Zod                                      | 3.x         | Schema validation on all req.body and query params; 422 on fail                                               |
| Error Handling     | Custom middleware                        | —           | Centralised; formats all errors as { success:false, error:{code,msg,details} }                                |
| Data Integrity     | Date range expansion logic               | —           | **Inclusive Filtering**: Expands all `endDate` params to `T23:59:59Z` to ensure full-day analytics capture.                      |
| Rate Limiting      | express-rate-limit                       | 7.x         | Global: 100 req/15min; Auth: 10 req/15min; Redis store                                                        |
| CORS               | cors                                     | 2.x         | Whitelist: customer app origin, admin domain, configurable via .env                                           |
| File Upload (API)  | multer                                   | 1.x         | Memory storage → upload to assets.dailyfresh.in (Nginx file server + local disk/S3); fileFilter + size limits |
| Email              | Resend SDK                               | Latest      | Transactional: order confirm, status update, password reset, OTP fallback                                     |
| SMS / OTP          | MSG91 SDK                                | Latest      | Phone OTP for auth; order status SMS alerts                                                                   |
| Logging            | Morgan + Winston                         | Latest      | Morgan HTTP access logs; Winston app logs to file + console                                                   |
| Security           | helmet.js                                | 7.x         | HTTP security headers: X-Frame-Options, CSP, HSTS, X-Content-Type                                             |
| Payments           | Razorpay Node.js SDK                     | Latest      | Order creation, payment capture, HMAC webhook verification, refunds                                           |
| Geospatial         | Google Maps Geocoding API                | Latest      | Convert GPS coords to addresses for rider/customer display                                                    |
| API Gateway        | Nginx (reverse proxy)                    | 1.24+       | Load balancing, SSL termination, rate limiting at edge                                                        |
| Hosting            | AWS EC2 t3.medium / DigitalOcean Droplet | —           | 4 vCPU, 8GB RAM, 100GB SSD NVMe; Ubuntu 22.04 LTS                                                             |
| Process Manager    | PM2                                      | 5.x         | Cluster mode (one instance per CPU); auto-restart; log rotation                                               |
| CI/CD              | GitHub Actions                           | —           | On push to main: lint, test, build, deploy to VPS via SSH                                                     |
| Containerisation   | Docker + Docker Compose                  | 24.x        | Dev/staging environment consistency; easy local setup                                                         |


---

# SECTION 9 — SYSTEM ARCHITECTURE & REQUEST FLOW
## 9.1 High-Level Architecture
The platform follows a strict three-tier decoupled architecture.

- Presentation Layer: Customer App, Store Manager App, Rider App (React Native) + Web Admin Panel (React.js)

- Application Layer: Express.js REST API + Socket.IO real-time server on Node.js

- Data Layer: Supabase (PostgreSQL) as primary DB + Redis for cache + assets.dailyfresh.in for file storage

***RULE: Frontend apps NEVER connect to Supabase or Redis directly. All data flows through Express.js API. Only Supabase Auth token issuance and verification is handled server-side.***

## 9.2 Request Flow — Standard API Call
1.  1\. User opens app → React Native loads from local bundle (OTA updated)

2.  2\. User logs in → Firebase Auth / Supabase Auth issues JWT access_token → stored in MMKV

3.  3\. Frontend makes API call → Axios attaches 'Authorization: Bearer <token>' header

4.  4\. Nginx receives request → reverse-proxies to Express.js on port 5000

5.  5\. Express auth middleware: verifies JWT with Supabase secret → extracts user.id, user.role

6.  6\. Role check middleware: validates user.role matches required role for route

7.  7\. Zod validation middleware: validates req.body/query against schema → 422 on fail

8.  8\. Controller calls Supabase admin client (service_role) to read/write PostgreSQL

9.  9\. Controller formats response as { success: true, data: {...}, message: '...' } → 200/201

## 9.3 Request Flow — Order Placement & Payment
10. 1\. Customer clicks 'Place Order' → POST /orders → backend creates order (status=pending) in DB

11. 2\. Backend calls razorpay.orders.create() → gets razorpay_order_id; returns it + razorpay_key_id to frontend

12. 3\. Backend returns { order, payment_session_id } to frontend

13. 4\. Frontend calls RazorpayCheckout.open({ key: razorpay_key_id, order_id: razorpay_order_id, ... }) → native payment sheet opens

14. 5\. Customer completes payment → Razorpay sends HMAC-SHA256 signed webhook to /api/v1/payments/webhook

15. 6\. Backend verifies HMAC-SHA256 signature → if valid: update order.payment_status=paid, order.status=confirmed

16. 7\. Backend decrements stock_quantity for each order item (ATOMIC transaction)

17. 8\. Backend marks coupon usage (coupon_usages insert + coupons.used_count++)

18. 9\. Backend sends order confirmation email via Resend + FCM push notification via Firebase

19. 10\. Backend emits Socket.IO event 'order:new' to the relevant store's room for instant alert

## 9.4 Request Flow — Live Order Tracking
20. 1\. Admin assigns rider → Rider App receives FCM push + Socket.IO event 'delivery:assigned'

21. 2\. Rider goes online → Rider App starts GPS tracking (1s interval via expo-location)

22. 3\. Every 5s: Rider App emits Socket.IO 'rider:location_update' { rider_id, lat, lng, delivery_id }

23. 4\. Backend receives event → updates riders.current_location in DB → broadcasts to room 'order:{order_id}'

24. 5\. Customer App is subscribed to room 'order:{order_id}' → receives location update → moves rider pin on MapView

25. 6\. Admin panel subscribed to 'admin:riders' room → all rider pins update on live tracking map

## 9.5 Backend Directory Structure
**dailyfresh-api/**

├── src/

│ ├── config/

│ │ ├── supabase.js # supabaseAdmin (service_role) + supabasePublic (anon) clients

│ │ ├── razorpay.js # Razorpay SDK instance with key_id + key_secret

│ │ ├── storage.config.js # assets.dailyfresh.in upload endpoint config

│ │ ├── redis.js # Upstash Redis client (ioredis)

│ │ ├── firebase.js # Firebase Admin SDK for FCM

│ │ ├── email.js # Resend SDK config

│ │ └── socket.js # Socket.IO server init + room management

│ ├── middlewares/

│ │ ├── auth.js # verifyJWT: decode Supabase JWT → req.user {id, email, role}

│ │ ├── adminOnly.js # role check: must be 'admin'

│ │ ├── storeManagerOnly.js # role check: must be 'store_manager'

│ │ ├── riderOnly.js # role check: must be 'rider'

│ │ ├── validate.js # factory fn: validate(zodSchema) → middleware

│ │ ├── errorHandler.js # catch-all error formatter

│ │ ├── rateLimiter.js # global + auth rate limiters (Redis store)

│ │ └── upload.js # multer config: memory storage, 5MB limit, image types only

│ ├── routes/

│ │ ├── auth.routes.js

│ │ ├── user.routes.js

│ │ ├── category.routes.js

│ │ ├── product.routes.js

│ │ ├── cart.routes.js

│ │ ├── order.routes.js

│ │ ├── payment.routes.js

│ │ ├── delivery.routes.js

│ │ ├── store.routes.js

│ │ ├── rider.routes.js

│ │ ├── review.routes.js

│ │ ├── wishlist.routes.js

│ │ ├── coupon.routes.js

│ │ ├── banner.routes.js

│ │ ├── notification.routes.js

│ │ ├── upload.routes.js

│ │ └── admin.routes.js # aggregates all /admin/* routes

│ ├── controllers/ # matching controller per route file

│ ├── services/

│ │ ├── razorpay.service.js # createOrder, verifyPayment, capturePayment, createRefund

│ │ ├── email.service.js # sendOrderConfirmation, sendStatusUpdate, sendOTP, sendReset

│ │ ├── storage.service.js # uploadToAssets, deleteFromAssets (assets.dailyfresh.in endpoints)

│ │ ├── fcm.service.js # sendPushNotification, sendBroadcast

│ │ ├── sms.service.js # sendOTP, sendSMSAlert via MSG91

│ │ ├── socket.service.js # emitToRoom, joinRoom, leaveRoom helpers

│ │ └── analytics.service.js # aggregated revenue/orders/customers queries

│ ├── schemas/ # Zod schemas (one per resource)

│ ├── utils/

│ │ ├── response.js # success(res, data, msg, statusCode) + error(res, msg, code, statusCode)

│ │ ├── orderNumber.js # generateOrderNumber() → 'RN-YYYYMMDD-XXXX'

│ │ ├── hmac.js # verifyRazorpayWebhook(rawBody, signature, webhookSecret)

│ │ ├── gst.js # calculateGST(amount, rate)

│ │ ├── distance.js # haversine(lat1,lng1,lat2,lng2) → km

│ │ └── logger.js # Winston: file + console transports

│ └── app.js # Express app: middlewares chain, routes mount

├── server.js # HTTP server + Socket.IO server init

├── .env

└── .env.example


---

# SECTION 10 — DATABASE SCHEMA — ALL TABLES & SQL SCRIPTS
All tables are on Supabase (PostgreSQL 15). All tables include created_at TIMESTAMPTZ DEFAULT now() and updated_at TIMESTAMPTZ DEFAULT now() unless stated. All UUIDs default to gen_random_uuid(). Row Level Security (RLS) is enabled on all tables. Run migration files in order from /supabase/migrations/.

## 10.1 SQL: profiles table
> CREATE TABLE profiles (
>
> id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
>
> full_name TEXT NOT NULL,
>
> phone TEXT UNIQUE,
>
> avatar_url TEXT,
>
> role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','store_manager','rider','admin')),
>
> is_active BOOLEAN DEFAULT true,
>
> date_of_birth DATE,
>
> gender TEXT CHECK (gender IN ('male','female','other')),
>
> fcm_token TEXT, -- latest FCM device token for push
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_profiles_role ON profiles(role);
>
> CREATE INDEX idx_profiles_phone ON profiles(phone);

## 10.2 SQL: stores table (Daily Fresh owns all stores; no external vendors)
> CREATE TABLE stores (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
>
> manager_user_id UUID REFERENCES profiles(id), -- assigned store manager account
>
> store_name TEXT NOT NULL,
>
> store_slug TEXT UNIQUE NOT NULL,
>
> description TEXT,
>
> logo_url TEXT,
>
> cover_url TEXT,
>
> phone TEXT NOT NULL,
>
> email TEXT,
>
> -- Daily Fresh internal stores; no external GST/FSSAI KYC required
>
> status TEXT NOT NULL DEFAULT 'pending'
>
> CHECK (status IN ('pending','approved','rejected','suspended')),
>
> address_line1 TEXT,
>
> address_line2 TEXT,
>
> city TEXT,
>
> state TEXT,
>
> pincode TEXT,
>
> latitude NUMERIC(10,7),
>
> longitude NUMERIC(10,7),
>
> working_hours JSONB, -- {mon:{open:'09:00',close:'21:00'}, ...}
>
> bank_account_name TEXT,
>
> bank_account_no TEXT,
>
> bank_ifsc TEXT,
>
> bank_name TEXT,
>
> -- No commission model (single-vendor); stores are Daily Fresh owned
>
> avg_rating NUMERIC(3,2) DEFAULT 0,
>
> total_reviews INTEGER DEFAULT 0,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_stores_manager ON stores(manager_user_id);
>
> CREATE INDEX idx_stores_status ON stores(status);
>
> CREATE INDEX idx_stores_location ON stores(latitude, longitude);

## 10.3 SQL: riders table
> CREATE TABLE riders (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
>
> vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bicycle','2-wheeler','3-wheeler','4-wheeler')),
>
> vehicle_number TEXT,
>
> licence_number TEXT,
>
> licence_front_url TEXT,
>
> licence_back_url TEXT,
>
> govt_id_url TEXT,
>
> vehicle_rc_url TEXT,
>
> status TEXT NOT NULL DEFAULT 'pending'
>
> CHECK (status IN ('pending','approved','rejected','suspended')),
>
> rejection_reason TEXT,
>
> is_online BOOLEAN DEFAULT false,
>
> current_lat NUMERIC(10,7),
>
> current_lng NUMERIC(10,7),
>
> last_location_at TIMESTAMPTZ,
>
> bank_account_name TEXT,
>
> bank_account_no TEXT,
>
> bank_ifsc TEXT,
>
> bank_name TEXT,
>
> avg_rating NUMERIC(3,2) DEFAULT 0,
>
> total_deliveries INTEGER DEFAULT 0,
>
> wallet_balance NUMERIC(10,2) DEFAULT 0, -- earned but not yet paid out
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_riders_user_id ON riders(user_id);
>
> CREATE INDEX idx_riders_status ON riders(status);
>
> CREATE INDEX idx_riders_online ON riders(is_online) WHERE is_online = true;

## 10.4 SQL: categories table
> CREATE TABLE categories (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- for sub-categories
>
> name TEXT NOT NULL,
>
> slug TEXT NOT NULL UNIQUE,
>
> description TEXT,
>
> image_url TEXT,
>
> display_order INTEGER NOT NULL DEFAULT 0,
>
> is_active BOOLEAN DEFAULT true,
>
> meta_title TEXT,
>
> meta_description TEXT,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_categories_parent ON categories(parent_id);
>
> CREATE INDEX idx_categories_slug ON categories(slug);

## 10.5 SQL: products table
> CREATE TABLE products (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
>
> category_id UUID NOT NULL REFERENCES categories(id),
>
> name TEXT NOT NULL,
>
> slug TEXT NOT NULL UNIQUE,
>
> description TEXT NOT NULL,
>
> short_description TEXT,
>
> price NUMERIC(10,2) NOT NULL,
>
> compare_price NUMERIC(10,2), -- MRP / strike-through price
>
> cost_price NUMERIC(10,2), -- internal margin tracking only
>
> sku TEXT NOT NULL UNIQUE,
>
> barcode TEXT,
>
> stock_quantity INTEGER NOT NULL DEFAULT 0,
>
> low_stock_threshold INTEGER DEFAULT 10,
>
> images TEXT[] NOT NULL DEFAULT '{}',
>
> thumbnail_url TEXT,
>
> is_featured BOOLEAN DEFAULT false,
>
> is_deal BOOLEAN DEFAULT false, -- Show in Deal of the Day section with deal_price and deal_expires_at
>
> deal_price NUMERIC(10,2), -- Deal price (lower than price); shown with countdown timer
>
> deal_expires_at TIMESTAMPTZ, -- When the deal expires
>
> cut_options TEXT[] DEFAULT '{}', -- Available cut preferences for this product e.g. {'Whole','Curry Cut','Fillets'}
>
> cleaning_options TEXT[] DEFAULT '{}', -- e.g. {'Cleaned & Ready to Cook','Uncleaned'}
>
> weight_variants JSONB DEFAULT '[]', -- Array of {label:'500g',price:299} objects for weight selector
>
> is_active BOOLEAN DEFAULT true,
>
> is_deleted BOOLEAN DEFAULT false,
>
> is_approved BOOLEAN DEFAULT true, -- Products active by default (single-vendor; no external approval needed)
>
> approval_note TEXT,
>
> tags TEXT[] DEFAULT '{}',
>
> weight_grams INTEGER,
>
> flavours TEXT[] DEFAULT '{}',
>
> sizes TEXT[] DEFAULT '{}',
>
> nutritional_info JSONB, -- {protein:'25g', carbs:'5g', fat:'2g', calories:'150kcal'}
>
> ingredients TEXT,
>
> avg_rating NUMERIC(3,2) DEFAULT 0,
>
> total_reviews INTEGER DEFAULT 0,
>
> total_sold INTEGER DEFAULT 0,
>
> meta_title TEXT,
>
> meta_description TEXT,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_products_slug ON products(slug);
>
> CREATE INDEX idx_products_store ON products(store_id);
>
> CREATE INDEX idx_products_category ON products(category_id);
>
> CREATE INDEX idx_products_active ON products(is_active, is_deleted, is_approved);
>
> CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
>
> CREATE INDEX idx_products_sold ON products(total_sold DESC);
>
> CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(array_to_string(tags,' '),'')));

## 10.6 SQL: addresses table
> CREATE TABLE addresses (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
>
> label TEXT NOT NULL DEFAULT 'Home' CHECK (label IN ('Home','Work','Other')),
>
> full_name TEXT NOT NULL,
>
> phone TEXT NOT NULL,
>
> line1 TEXT NOT NULL,
>
> line2 TEXT,
>
> city TEXT NOT NULL,
>
> state TEXT NOT NULL,
>
> pincode TEXT NOT NULL,
>
> country TEXT NOT NULL DEFAULT 'India',
>
> latitude NUMERIC(10,7),
>
> longitude NUMERIC(10,7),
>
> is_default BOOLEAN DEFAULT false,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_addresses_user ON addresses(user_id);
>
> -- Trigger: when is_default=true set for a user, unset all others
>
> CREATE OR REPLACE FUNCTION set_default_address()
>
> RETURNS TRIGGER AS \$\$
>
> BEGIN
>
> IF NEW.is_default = true THEN
>
> UPDATE addresses SET is_default = false
>
> WHERE user_id = NEW.user_id AND id != NEW.id;
>
> END IF;
>
> RETURN NEW;
>
> END;
>
> \$\$ LANGUAGE plpgsql;
>
> CREATE TRIGGER trg_default_address
>
> BEFORE INSERT OR UPDATE ON addresses
>
> FOR EACH ROW EXECUTE FUNCTION set_default_address();

## 10.7 SQL: orders table
> CREATE TABLE orders (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> order_number TEXT NOT NULL UNIQUE, -- format: RN-YYYYMMDD-XXXX
>
> user_id UUID NOT NULL REFERENCES profiles(id),
>
> status TEXT NOT NULL DEFAULT 'pending'
>
> CHECK (status IN ('pending','confirmed','packed','shipped','delivered','cancelled','refunded')),
>
> subtotal NUMERIC(10,2) NOT NULL,
>
> discount_amount NUMERIC(10,2) DEFAULT 0,
>
> delivery_charge NUMERIC(10,2) DEFAULT 0,
>
> gst_amount NUMERIC(10,2) DEFAULT 0,
>
> total_amount NUMERIC(10,2) NOT NULL,
>
> payment_status TEXT DEFAULT 'pending'
>
> CHECK (payment_status IN ('pending','paid','failed','refunded','partially_refunded')),
>
> payment_method TEXT CHECK (payment_method IN ('upi','card','netbanking','wallet','cod')),
>
> razorpay_order_id TEXT UNIQUE,
>
> razorpay_payment_id TEXT,
>
> coupon_code TEXT,
>
> coupon_discount_type TEXT,
>
> coupon_discount_value NUMERIC,
>
> shipping_address JSONB NOT NULL, -- snapshot at order time
>
> delivery_slot TEXT, -- e.g. '2026-04-10T16:00:00+05:30' (slot start time ISO)
>
> delivery_slot_end TEXT, -- slot end time ISO (slot = 1-hour window)
>
> delivery_slot_type TEXT, -- 'express' | 'scheduled'
>
> tracking_id TEXT,
>
> tracking_url TEXT,
>
> estimated_delivery DATE,
>
> notes TEXT,
>
> cancel_reason TEXT,
>
> cancelled_by TEXT CHECK (cancelled_by IN ('customer','admin')),
>
> refund_amount NUMERIC(10,2),
>
> refund_id TEXT,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_orders_user ON orders(user_id);
>
> CREATE INDEX idx_orders_status ON orders(status);
>
> CREATE INDEX idx_orders_payment ON orders(payment_status);
>
> CREATE INDEX idx_orders_created ON orders(created_at DESC);
>
> CREATE INDEX idx_orders_razorpay ON orders(razorpay_order_id);

## 10.8 SQL: order_items table
> CREATE TABLE order_items (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
>
> store_id UUID NOT NULL REFERENCES stores(id),
>
> product_id UUID REFERENCES products(id), -- nullable: product may be deleted later
>
> product_name TEXT NOT NULL, -- snapshot
>
> product_image TEXT, -- snapshot
>
> sku TEXT, -- snapshot
>
> cut_preference TEXT, -- e.g. 'Curry Cut', 'Boneless Cubes', 'Fillets', 'Whole'
>
> cleaning_preference TEXT, -- 'Cleaned & Ready to Cook' | 'Uncleaned'
>
> weight_variant TEXT, -- e.g. '500g', '1kg' — selected pack size
>
> flavour TEXT,
>
> size TEXT,
>
> quantity INTEGER NOT NULL,
>
> unit_price NUMERIC(10,2) NOT NULL, -- price at time of order
>
> total_price NUMERIC(10,2) NOT NULL, -- unit_price * quantity
>
> gst_rate NUMERIC(5,2) DEFAULT 0,
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_order_items_order ON order_items(order_id);
>
> CREATE INDEX idx_order_items_store ON order_items(store_id);

## 10.9 SQL: deliveries table
> CREATE TABLE deliveries (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
>
> rider_id UUID REFERENCES riders(id),
>
> store_id UUID NOT NULL REFERENCES stores(id),
>
> status TEXT NOT NULL DEFAULT 'pending_assignment'
>
> CHECK (status IN ('pending_assignment','assigned','accepted','picked_up','delivered','failed','cancelled')),
>
> pickup_lat NUMERIC(10,7),
>
> pickup_lng NUMERIC(10,7),
>
> pickup_address TEXT,
>
> drop_lat NUMERIC(10,7),
>
> drop_lng NUMERIC(10,7),
>
> drop_address TEXT,
>
> distance_km NUMERIC(8,2),
>
> estimated_time INTEGER, -- minutes
>
> accepted_at TIMESTAMPTZ,
>
> picked_up_at TIMESTAMPTZ,
>
> delivered_at TIMESTAMPTZ,
>
> delivery_proof TEXT, -- URL on assets.dailyfresh.in or 'OTP_CONFIRMED'
>
> delivery_otp TEXT, -- 4-digit OTP for confirmation
>
> rider_earning NUMERIC(10,2),
>
> failed_reason TEXT,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_deliveries_order ON deliveries(order_id);
>
> CREATE INDEX idx_deliveries_rider ON deliveries(rider_id);
>
> CREATE INDEX idx_deliveries_status ON deliveries(status);

## 10.10 SQL: cart_items, wishlist, coupons, coupon_usages
> CREATE TABLE cart_items (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
>
> product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
>
> quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
>
> flavour TEXT,
>
> size TEXT,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now(),
>
> UNIQUE(user_id, product_id, flavour, size)
>
> );
>
> CREATE INDEX idx_cart_user ON cart_items(user_id);
>
> CREATE TABLE wishlist (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
>
> product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> UNIQUE(user_id, product_id)
>
> );
>
> CREATE TABLE coupons (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> code TEXT NOT NULL UNIQUE,
>
> description TEXT,
>
> discount_type TEXT NOT NULL CHECK (discount_type IN ('flat','percent')),
>
> discount_value NUMERIC(10,2) NOT NULL,
>
> max_discount_cap NUMERIC(10,2),
>
> min_order_value NUMERIC(10,2) DEFAULT 0,
>
> max_total_uses INTEGER,
>
> max_per_user INTEGER DEFAULT 1,
>
> used_count INTEGER DEFAULT 0,
>
> is_active BOOLEAN DEFAULT true,
>
> valid_from TIMESTAMPTZ,
>
> valid_until TIMESTAMPTZ,
>
> applicable_product_ids UUID[] DEFAULT '{}',
>
> applicable_category_ids UUID[] DEFAULT '{}',
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE TABLE coupon_usages (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> coupon_id UUID NOT NULL REFERENCES coupons(id),
>
> user_id UUID NOT NULL REFERENCES profiles(id),
>
> order_id UUID NOT NULL REFERENCES orders(id),
>
> discount_applied NUMERIC(10,2) NOT NULL,
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> );

## 10.11 SQL: reviews, banners, notifications, settings, order_status_history
> CREATE TABLE reviews (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> product_id UUID NOT NULL REFERENCES products(id),
>
> store_id UUID NOT NULL REFERENCES stores(id),
>
> user_id UUID NOT NULL REFERENCES profiles(id),
>
> order_id UUID REFERENCES orders(id),
>
> rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
>
> title TEXT,
>
> body TEXT,
>
> is_approved BOOLEAN DEFAULT false,
>
> is_deleted BOOLEAN DEFAULT false,
>
> admin_reply TEXT,
>
> helpful_count INTEGER DEFAULT 0,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE UNIQUE INDEX idx_reviews_unique_user_product ON reviews(user_id, product_id) WHERE is_deleted = false;
>
> CREATE TABLE banners (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> title TEXT NOT NULL,
>
> alt_text TEXT,
>
> image_url TEXT NOT NULL,
>
> mobile_image_url TEXT,
>
> link_url TEXT,
>
> placement TEXT NOT NULL DEFAULT 'homepage_hero'
>
> CHECK (placement IN ('homepage_hero','homepage_mid','popup','category_top','store_banner')),
>
> display_order INTEGER DEFAULT 0,
>
> is_active BOOLEAN DEFAULT true,
>
> valid_from TIMESTAMPTZ,
>
> valid_until TIMESTAMPTZ,
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE TABLE notifications (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> user_id UUID REFERENCES profiles(id), -- NULL = broadcast
>
> title TEXT NOT NULL,
>
> body TEXT NOT NULL,
>
> type TEXT NOT NULL CHECK (type IN ('order_update','promo','system','low_stock','payout')),
>
> data JSONB,
>
> is_read BOOLEAN DEFAULT false,
>
> push_sent BOOLEAN DEFAULT false,
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_notifications_user ON notifications(user_id);
>
> CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
>
> CREATE TABLE settings (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> key TEXT NOT NULL UNIQUE,
>
> value TEXT NOT NULL,
>
> description TEXT,
>
> data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string','number','boolean','json')),
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> -- Initial seed data:
>
> INSERT INTO settings (key,value,data_type,description) VALUES
>
> ('gst_rate','18','number','GST percentage applied at checkout'),
>
> ('free_delivery_above','499','number','Cart total above which delivery is free (INR)'),
>
> ('default_delivery_charge','60','number','Flat delivery charge when below free threshold (INR)'),
>
> ('low_stock_threshold','10','number','Global low stock alert threshold'),
>
> ('platform_commission_rate','10','number','Default platform commission % per order'),
>
> ('store_name','Daily Fresh','string','Platform display name'),
>
> ('store_email','hello@dailyfresh.com','string','Operations email'),
>
> ('currency','INR','string','Currency code'),
>
> ('currency_symbol','₹','string','Currency symbol'),
>
> ('order_prefix','RN','string','Prefix for order numbers'),
>
> ('min_order_value','99','number','Minimum order amount (INR)');
>
> CREATE TABLE order_status_history (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
>
> status TEXT NOT NULL,
>
> note TEXT,
>
> changed_by UUID REFERENCES profiles(id),
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX idx_status_history_order ON order_status_history(order_id);

## 10.12 Row Level Security Policies
| **Table**     | **Policy Name**                      | **Rule**                                                                                                                         |
|---------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| profiles      | Users read own                       | SELECT WHERE auth.uid() = id                                                                                                     |
| profiles      | Admin read all                       | SELECT WHERE (SELECT role FROM profiles WHERE id=auth.uid()) = 'admin'                                                           |
| profiles      | Users update own                     | UPDATE WHERE auth.uid() = id                                                                                                     |
| products      | Public read active & approved        | SELECT WHERE is_active = true AND is_deleted = false AND is_approved = true                                                      |
| products      | Store manager own store              | ALL WHERE store_id IN (SELECT id FROM stores WHERE manager_user_id = auth.uid())                                                 |
| products      | Admin full access                    | ALL WHERE (SELECT role FROM profiles WHERE id=auth.uid()) = 'admin'                                                              |
| orders        | Customer read own                    | SELECT WHERE user_id = auth.uid()                                                                                                |
| orders        | Store manager reads own store orders | SELECT WHERE id IN (SELECT order_id FROM order_items WHERE store_id IN (SELECT id FROM stores WHERE manager_user_id=auth.uid())) |
| orders        | Admin read all                       | SELECT WHERE role = 'admin' (via JWT)                                                                                            |
| cart_items    | Customer own only                    | ALL WHERE user_id = auth.uid()                                                                                                   |
| wishlist      | Customer own only                    | ALL WHERE user_id = auth.uid()                                                                                                   |
| addresses     | Customer own only                    | ALL WHERE user_id = auth.uid()                                                                                                   |
| reviews       | Public read approved                 | SELECT WHERE is_approved = true AND is_deleted = false                                                                           |
| notifications | Customer own + broadcasts            | SELECT WHERE user_id = auth.uid() OR user_id IS NULL                                                                             |
| settings      | Public read                          | SELECT for all (anon and authenticated)                                                                                          |
| settings      | Admin write only                     | INSERT/UPDATE WHERE role = 'admin'                                                                                               |


---

# SECTION 11 — API SPECIFICATION — COMPLETE REFERENCE
**Base URL (Production): https://api.dailyfresh.com/api/v1**

Base URL (Staging): https://staging-api.dailyfresh.com/api/v1

Auth Header: Authorization: Bearer <JWT_ACCESS_TOKEN>

Content-Type: application/json (multipart/form-data for uploads)

Pagination: all list endpoints support ?page=1&limit=20 → returns { data, total, page, pages }

Auth levels: Public = no token | Customer = customer JWT | Store Manager = store_manager JWT | Rider = rider JWT | Admin = admin JWT | Public* = optional auth

**11.1 Auth Endpoints — /auth/***

| **Method** | **Auth** | **Endpoint**          | **Description**                  | **Request Body**                    | **Response**                        |
|------------|----------|-----------------------|----------------------------------|-------------------------------------|-------------------------------------|
| POST       | Public   | /auth/register        | Register new customer account    | {email, password, full_name, phone} | {user, message}                     |
| POST       | Public   | /auth/login           | Email + password login           | {email, password}                   | {access_token, refresh_token, user} |
| POST       | Public   | /auth/otp/send        | Send OTP to phone or email       | {phone} or {email}                  | {message, expires_in}               |
| POST       | Public   | /auth/otp/verify      | Verify OTP → returns tokens      | {identifier, otp}                   | {access_token, refresh_token, user} |
| POST       | Public   | /auth/refresh         | Refresh access token             | {refresh_token}                     | {access_token, expires_in}          |
| POST       | Customer | auth/logout           | Revoke session token             | —                                   | {message}                           |
| POST       | Public   | /auth/forgot-password | Send password reset email        | {email}                             | {message}                           |
| POST       | Public   | /auth/reset-password  | Set new password via reset token | {token, new_password}               | {message}                           |
| POST       | Customer | /auth/change-password | Change password (authenticated)  | {current_password, new_password}    | {message}                           |

**11.2 User & Profile Endpoints — /users/***

| **Method** | **Auth** | **Endpoint**                 | **Description**                           | **Request Body**                                              | **Response**                                      |
|------------|----------|------------------------------|-------------------------------------------|---------------------------------------------------------------|---------------------------------------------------|
| GET        | Customer | /users/profile               | Get authenticated user's full profile     | —                                                             | {user:{id,full_name,email,phone,avatar_url,role}} |
| PUT        | Customer | /users/profile               | Update name, phone, date_of_birth, gender | {full_name, phone, date_of_birth, gender}                     | {user}                                            |
| POST       | Customer | /users/avatar                | Upload profile picture                    | multipart: file                                               | {avatar_url}                                      |
| GET        | Customer | /users/addresses             | List all saved delivery addresses         | —                                                             | {addresses[]}                                   |
| POST       | Customer | /users/addresses             | Add a new delivery address                | {label, full_name, phone, line1, line2, city, state, pincode} | {address}                                         |
| GET        | Customer | /users/addresses/:id         | Get single address                        | —                                                             | {address}                                         |
| PUT        | Customer | /users/addresses/:id         | Update address fields                     | {...fields}                                                   | {address}                                         |
| DELETE     | Customer | /users/addresses/:id         | Delete address                            | —                                                             | {message}                                         |
| PATCH      | Customer | /users/addresses/:id/default | Set as default address                    | —                                                             | {address}                                         |
| PATCH      | Customer | /users/fcm-token             | Update FCM device token                   | {fcm_token}                                                   | {message}                                         |
| GET        | Admin    | /admin/users                 | List all customers (paginated+search)     | Query: page, limit, search, is_active                         | {users[], total, page, pages}                   |
| GET        | Admin    | /admin/users/:id             | Get customer profile + order summary      | —                                                             | {user, orders_summary}                            |
| PATCH      | Admin    | /admin/users/:id/toggle      | Enable or disable customer account        | —                                                             | {user}                                            |

**11.3 Store Manager Endpoints — /store/* (used by store manager mobile app)**

| **Method** | **Auth** | **Endpoint**                 | **Description**                       | **Request Body**                                        | **Response**                                                  |
|------------|----------|------------------------------|---------------------------------------|---------------------------------------------------------|---------------------------------------------------------------|
| POST       | Public   |                              |                                       |                                                         |                                                               |
| GET        | Vendor   | /store/profile               | Get own store profile                 | —                                                       | {store}                                                       |
| PUT        | Vendor   | /store/profile               | Update store profile                  | {store_name, description, working_hours, address, etc.} | {store}                                                       |
| GET        | Vendor   | /store/dashboard             | Dashboard KPIs + recent orders        | Query: period (today/week/month)                        | {revenue, orders, earnings, pending_count, recent_orders[]} |
| GET        | Vendor   | /store/products              | List own products                     | Query: page, limit, search, status, low_stock           | {products[], total, page, pages}                            |
| POST       | Vendor   | /store/products              | Create new product                    | multipart: {all product fields + images}                | {product}                                                     |
| GET        | Vendor   | /store/products/:id          | Get single product by ID              | —                                                       | {product}                                                     |
| PUT        | Vendor   | /store/products/:id          | Update product                        | {...all_fields}                                         | {product}                                                     |
| PATCH      | Vendor   | /store/products/:id/toggle   | Publish/unpublish product             | —                                                       | {product}                                                     |
| PATCH      | Vendor   | /store/products/:id/stock    | Update stock only                     | {stock_quantity, operation: set|add|subtract}         | {product}                                                     |
| DELETE     | Vendor   | /store/products/:id          | Soft delete product                   | —                                                       | {message}                                                     |
| POST       | Vendor   | /store/products/bulk-upload  | CSV bulk product import               | multipart: csv_file                                     | {imported_count, errors[]}                                  |
| GET        | Vendor   | /store/orders                | List orders for this store            | Query: status, page, limit, date_from, date_to          | {orders[], total}                                           |
| GET        | Vendor   | /store/orders/:id            | Get order detail                      | —                                                       | {order, order_items[], customer}                            |
| PATCH      | Vendor   | /store/orders/:id/accept     | Accept incoming order                 | —                                                       | {order, delivery}                                             |
| PATCH      | Vendor   | /store/orders/:id/reject     | Reject order                          | {reason}                                                | {order}                                                       |
| PATCH      | Vendor   | /store/orders/:id/ready      | Mark order ready for rider pickup     | —                                                       | {order}                                                       |
| GET        | Vendor   | /store/earnings              | Earnings summary                      | {period, date_from, date_to}                            | {total_earned, pending_settlement, transactions[]}          |
| GET        | Admin    | /admin/stores                | List all Daily Fresh stores           | Query: status, page, limit, search                      | {stores[], total}                                           |
| GET        | Admin    | /admin/stores/:id            | Get store details + performance stats | —                                                       | {store, products_count, orders_count}                         |
| PATCH      | Admin    | /admin/stores/:id/activate   | Activate store                        | —                                                       | {store}                                                       |
| PATCH      | Admin    | /admin/stores/:id/deactivate | Deactivate store                      | {reason}                                                | {store}                                                       |
| PATCH      | Admin    | /admin/stores/:id/suspend    | Suspend vendor                        | —                                                       | {store}                                                       |

**11.4 Rider Endpoints — /rider/***

| **Method** | **Auth** | **Endpoint**                 | **Description**                          | **Request Body**                                              | **Response**                              |
|------------|----------|------------------------------|------------------------------------------|---------------------------------------------------------------|-------------------------------------------|
| POST       | Public   | /rider/register              | Rider registration + doc submission      | multipart: {all rider fields + docs}                          | {rider, message:'Pending admin approval'} |
| GET        | Rider    | /rider/profile               | Get own rider profile                    | —                                                             | {rider}                                   |
| PUT        | Rider    | /rider/profile               | Update personal + vehicle + bank details | {full_name, vehicle_number, bank_account_no, bank_ifsc, etc.} | {rider}                                   |
| PATCH      | Rider    | /rider/availability          | Toggle online/offline                    | {is_online: bool}                                             | {rider}                                   |
| PATCH      | Rider    | /rider/location              | Update GPS location                      | {latitude, longitude, delivery_id?}                           | {message}                                 |
| GET        | Rider    | /rider/deliveries            | List delivery history                    | Query: status, page, limit                                    | {deliveries[], total}                   |
| GET        | Rider    | /rider/deliveries/active     | Get current active delivery              | —                                                             | {delivery, order, store, customer}        |
| PATCH      | Rider    | /rider/deliveries/:id/accept | Accept delivery task                     | —                                                             | {delivery}                                |
| PATCH      | Rider    | /rider/deliveries/:id/reject | Reject delivery task                     | {reason}                                                      | {delivery}                                |
| PATCH      | Rider    | /rider/deliveries/:id/pickup | Confirm pickup from Daily Fresh store    | —                                                             | {delivery}                                |
| POST       | Rider    | /rider/deliveries/:id/proof  | Upload delivery proof (photo or OTP)     | multipart: {photo?} or {otp}                                  | {delivery}                                |
| GET        | Rider    | /rider/earnings              | Earnings summary                         | Query: period                                                 | {total, pending, transactions[]}        |
| POST       | Rider    | /rider/sos                   | Trigger SOS alert                        | {latitude, longitude, message?}                               | {message, alert_id}                       |
| GET        | Admin    | /admin/riders                | List all riders                          | Query: status, is_online, page, limit                         | {riders[], total}                       |
| GET        | Admin    | /admin/riders/:id            | Get rider details                        | —                                                             | {rider, delivery_history}                 |
| PATCH      | Admin    | /admin/riders/:id/approve    | Approve rider                            | —                                                             | {rider}                                   |
| PATCH      | Admin    | /admin/riders/:id/reject     | Reject rider                             | {reason}                                                      | {rider}                                   |
| POST       | Admin    | /admin/riders/assign         | Assign rider to delivery                 | {rider_id, delivery_id}                                       | {delivery}                                |

## 11.5 Category & Product Endpoints
| **Method** | **Auth** | **Endpoint**                 | **Description**                                | **Request Body**                                                                         | **Response**                                                                      |
|------------|----------|------------------------------|------------------------------------------------|------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| GET        | Public   | /categories                  | List all active categories                     | Query: include_count                                                                     | {categories[]}                                                                  |
| GET        | Public   | /categories/:slug            | Get category details                           | —                                                                                        | {category, sub_categories[]}                                                    |
| GET        | Public   | /categories/:slug/products   | Products under category                        | Query: page, limit, sort, min_price, max_price, store_id                                 | {products[], category, total, page, pages}                                      |
| POST       | Admin    | /admin/categories            | Create new category                            | {name, slug, description, image_url, display_order, parent_id}                           | {category}                                                                        |
| PUT        | Admin    | /admin/categories/:id        | Update category                                | {...fields}                                                                              | {category}                                                                        |
| PATCH      | Admin    | /admin/categories/:id/toggle | Toggle active/inactive                         | —                                                                                        | {category}                                                                        |
| DELETE     | Admin    | /admin/categories/:id        | Delete category (only if no products)          | —                                                                                        | {message}                                                                         |
| PUT        | Admin    | /admin/categories/reorder    | Reorder categories                             | {orders:[{id, display_order}]}                                                         | {message}                                                                         |
| GET        | Public* | /products                    | List products with filters                     | Query: category, vendor_id, search, min_price, max_price, sort, page, limit, is_featured | {products[], total, page, pages, filters}                                       |
| GET        | Public   | /products/featured           | Featured products                              | Query: limit (default 8)                                                                 | {products[]}                                                                    |
| GET        | Public   | /products/best-sellers       | Best sellers by total_sold                     | Query: limit, category                                                                   | {products[]}                                                                    |
| GET        | Public   | /products/new-arrivals       | Most recently added                            | Query: limit                                                                             | {products[]}                                                                    |
| GET        | Public   | /products/deals              | Deal of the Day products                       | Query: limit, category                                                                   | {products[] with deal_price, deal_expires_at, countdown_seconds}                |
| POST       | Customer | /products/:id/notify         | Register 'Notify Me' for out-of-stock product  | {product_id}                                                                             | {message: 'You will be notified when this product is back in stock'}              |
| DELETE     | Customer | /products/:id/notify         | Remove Notify Me registration                  | —                                                                                        | {message}                                                                         |
| GET        | Public   | /stores/slots                | Get available delivery slots for a pincode     | Query: pincode, date                                                                     | {slots:[{slot_id, label, start_time, end_time, type, available, extra_charge}]} |
| GET        | Public   | /products/search             | Full-text search                               | Query: q, page, limit, category                                                          | {products[], total, q}                                                          |
| GET        | Public   | /products/:slug              | Get single product detail                      | —                                                                                        | {product, reviews_summary, related_products[]}                                  |
| GET        | Admin    | /admin/products              | Admin product list (includes pending/inactive) | Query: page, limit, search, store_id, category, low_stock                                | {products[], total}                                                             |
| PATCH      | Admin    | /admin/products/:id/approve  | Activate product (toggle visibility)           | —                                                                                        | {product}                                                                         |
| PATCH      | Admin    | /admin/products/:id/reject   | Deactivate product                             | {reason}                                                                                 | {product}                                                                         |
| POST       | Admin    | /admin/products/bulk         | Bulk action on products                        | {ids[], action: activate|deactivate|delete|approve|reject}                         | {affected_count, message}                                                         |

**11.6 Cart Endpoints — /cart/***

| **Method** | **Auth** | **Endpoint**    | **Description**                                               | **Request Body**                                                                         | **Response**                                                                          |
|------------|----------|-----------------|---------------------------------------------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| GET        | Customer | /cart           | Get cart with computed totals                                 | —                                                                                        | {cart_items[], subtotal, delivery_charge, gst, total, item_count, stock_issues[]} |
| POST       | Customer | /cart/items     | Add product to cart with preferences (or increment if exists) | {product_id, quantity, cut_preference?, cleaning_preference?, weight_variant?, flavour?} | {cart_item, cart_totals}                                                              |
| PUT        | Customer | /cart/items/:id | Update cart item quantity                                     | {quantity}                                                                               | {cart_item, cart_totals}                                                              |
| DELETE     | Customer | /cart/items/:id | Remove item from cart                                         | —                                                                                        | {message, cart_totals}                                                                |
| DELETE     | Customer | /cart           | Clear entire cart                                             | —                                                                                        | {message}                                                                             |
| POST       | Customer | /cart/validate  | Validate stock + prices before checkout                       | —                                                                                        | {is_valid, issues[], cart_items[], totals}                                        |
| POST       | Customer | /cart/merge     | Merge guest cart into user cart on login                      | {items:[{product_id, quantity, flavour, size}]}                                        | {cart_items[], message}                                                             |

**11.7 Order Endpoints — /orders/***

| **Method** | **Auth** | **Endpoint**             | **Description**                                          | **Request Body**                                                                            | **Response**                                                                        |
|------------|----------|--------------------------|----------------------------------------------------------|---------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| POST       | Customer | /orders                  | Place new order from cart                                | {address_id, coupon_code?, payment_method, delivery_slot?, notes?}                          | {order, razorpay_order_id, razorpay_key_id}                                         |
| GET        | Customer | /orders                  | List user's order history                                | Query: status, page, limit                                                                  | {orders[], total, page, pages}                                                    |
| GET        | Customer | /orders/:id              | Get full order detail                                    | —                                                                                           | {order, order_items[], delivery, status_history[]}                              |
| POST       | Customer | /orders/:id/cancel       | Customer cancel order (only if >2hrs before slot start) | {reason}                                                                                    | {order}                                                                             |
| POST       | Customer | /orders/:id/complaint    | Raise missing/wrong item complaint                       | {issue_type: missing|wrong|damaged, product_id, description, photo_url?}                  | {complaint_id, message}                                                             |
| POST       | Customer | /orders/:id/reorder      | Add all past order items to cart                         | —                                                                                           | {cart_items[], unavailable_items[]}                                             |
| GET        | Admin    | /admin/orders            | List all orders (paginated + filtered)                   | Query: status, payment_status, date_from, date_to, search, vendor_id, rider_id, page, limit | {orders[], total, page, pages, summary:{total_revenue, order_count}}              |
| GET        | Admin    | /admin/orders/:id        | Get full order detail for admin                          | —                                                                                           | {order, order_items[], customer, vendor, rider, status_history[], payment_info} |
| PATCH      | Admin    | /admin/orders/:id/status | Update order status                                      | {status, note?, tracking_id?, tracking_url?, estimated_delivery?}                           | {order, status_history}                                                             |
| POST       | Admin    | /admin/orders/:id/refund | Initiate refund via Razorpay                             | {amount, reason}                                                                            | {refund_id, status, message}                                                        |

**11.8 Payment Endpoints — /payments/***

| **Method** | **Auth** | **Endpoint**                       | **Description**                                            | **Request Body**                                             | **Response**                                           |
|------------|----------|------------------------------------|------------------------------------------------------------|--------------------------------------------------------------|--------------------------------------------------------|
| POST       | Customer | /payments/create-order             | Create Razorpay order for a pending order                  | {order_id}                                                   | {razorpay_order_id, razorpay_key_id, amount, currency} |
| POST       | Customer | /payments/verify                   | Verify Razorpay payment signature after checkout completes | {razorpay_order_id, razorpay_payment_id, razorpay_signature} | {success, payment_status, order}                       |
| POST       | Public   | /payments/webhook                  | Razorpay server-to-server webhook (HMAC-SHA256 verified)   | Razorpay signed payload                                      | HTTP 200 always                                        |
| GET        | Admin    | /admin/payments/:razorpay_order_id | Fetch payment details from Razorpay                        | —                                                            | {payment_details}                                      |
| GET        | Admin    | /admin/payments/failed             | List failed payment orders                                 | Query: date_from, date_to, page                              | {failed_orders[]}                                    |

**11.9 Delivery Endpoints — /deliveries/***

| **Method** | **Auth** | **Endpoint**                | **Description**                                            | **Request Body**                                  | **Response**                                                                |
|------------|----------|-----------------------------|------------------------------------------------------------|---------------------------------------------------|-----------------------------------------------------------------------------|
| GET        | Customer | /deliveries/order/:order_id | Get delivery status + rider location for customer tracking | —                                                 | {delivery, rider:{name, phone, lat, lng, photo_url}}                        |
| GET        | Admin    | /admin/deliveries           | List all deliveries                                        | Query: status, rider_id, date_from, date_to, page | {deliveries[], total}                                                     |
| GET        | Admin    | /admin/deliveries/live      | Get all active deliveries with rider locations             | —                                                 | {active_deliveries:[{delivery_id, rider_id, lat, lng, order_id, status}]} |
| POST       | Admin    | /admin/deliveries/assign    | Manually assign rider to delivery                          | {delivery_id, rider_id}                           | {delivery}                                                                  |

## 11.10 Review, Wishlist, Coupon, Banner, Notification, Upload, Settings
| **Method** | **Auth** | **Endpoint**                   | **Description**                                                     | **Request Body**                                                                                              | **Response**                                          |
|------------|----------|--------------------------------|---------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| GET        | Public   | /products/:id/reviews          | Get approved reviews                                                | Query: page, limit, sort                                                                                      | {reviews[], avg_rating, total, rating_distribution} |
| POST       | Customer | /products/:id/reviews          | Submit review (verified purchase only)                              | {rating, title, body, order_id}                                                                               | {review}                                              |
| DELETE     | Customer | /reviews/:id                   | Delete own review (if not yet approved)                             | —                                                                                                             | {message}                                             |
| GET        | Admin    | /admin/reviews                 | List all reviews with filters                                       | Query: is_approved, vendor_id, page                                                                           | {reviews[], total}                                  |
| PATCH      | Admin    | /admin/reviews/:id/approve     | Approve review                                                      | —                                                                                                             | {review}                                              |
| PATCH      | Admin    | /admin/reviews/:id/reject      | Reject review                                                       | {reason}                                                                                                      | {message}                                             |
| POST       | Admin    | /admin/reviews/:id/reply       | Add admin public reply                                              | {reply_text}                                                                                                  | {review}                                              |
| GET        | Customer | /wishlist                      | Get wishlist with product details                                   | —                                                                                                             | {wishlist_items[], count}                           |
| POST       | Customer | /wishlist                      | Add product to wishlist                                             | {product_id}                                                                                                  | {wishlist_item}                                       |
| DELETE     | Customer | /wishlist/:product_id          | Remove from wishlist                                                | —                                                                                                             | {message}                                             |
| GET        | Customer | /wishlist/check/:product_id    | Check if product in wishlist                                        | —                                                                                                             | {in_wishlist: bool}                                   |
| POST       | Customer | /coupons/validate              | Validate coupon + preview discount                                  | {code, cart_total, cart_items[]}                                                                            | {is_valid, discount_amount, coupon, error_reason}     |
| GET        | Admin    | /admin/coupons                 | List coupons                                                        | Query: is_active, page                                                                                        | {coupons[], total}                                  |
| POST       | Admin    | /admin/coupons                 | Create coupon                                                       | {code, discount_type, discount_value, min_order_value, max_total_uses, max_per_user, valid_from, valid_until} | {coupon}                                              |
| PUT        | Admin    | /admin/coupons/:id             | Update coupon                                                       | {...fields}                                                                                                   | {coupon}                                              |
| PATCH      | Admin    | /admin/coupons/:id/toggle      | Enable/disable coupon                                               | —                                                                                                             | {coupon}                                              |
| DELETE     | Admin    | /admin/coupons/:id             | Delete coupon                                                       | —                                                                                                             | {message}                                             |
| GET        | Public   | /banners                       | Get active banners by placement                                     | Query: placement                                                                                              | {banners[]}                                         |
| POST       | Admin    | /admin/banners                 | Create banner                                                       | {title, image_url, placement, display_order, link_url, valid_from, valid_until}                               | {banner}                                              |
| PUT        | Admin    | /admin/banners/:id             | Update banner                                                       | {...fields}                                                                                                   | {banner}                                              |
| PATCH      | Admin    | /admin/banners/:id/toggle      | Toggle banner visibility                                            | —                                                                                                             | {banner}                                              |
| DELETE     | Admin    | /admin/banners/:id             | Delete banner                                                       | —                                                                                                             | {message}                                             |
| GET        | Customer | /notifications                 | Get user notifications                                              | Query: is_read, page, limit                                                                                   | {notifications[], unread_count, total}              |
| PATCH      | Customer | /notifications/:id/read        | Mark notification as read                                           | —                                                                                                             | {notification}                                        |
| PATCH      | Customer | /notifications/read-all        | Mark all as read                                                    | —                                                                                                             | {updated_count}                                       |
| POST       | Admin    | /admin/notifications/broadcast | Broadcast push + in-app notification                                | {title, body, type, target: all|customers|vendors|riders|user_ids[], data?}                             | {sent_count, message}                                 |
| POST       | Admin    | /uploads/product-image         | Upload product image                                                | multipart: file (jpg/png/webp, max 5MB)                                                                       | {url, public_id, width, height}                       |
| POST       | Admin    | /uploads/banner-image          | Upload banner                                                       | multipart: file                                                                                               | {url, public_id}                                      |
| POST       | Customer | /uploads/avatar                | Upload user avatar                                                  | multipart: file (max 2MB)                                                                                     | {url}                                                 |
| POST       | Vendor   | /uploads/vendor-logo           | Upload vendor store logo                                            | multipart: file                                                                                               | {url}                                                 |
| POST       | Rider    | /uploads/rider-doc             | Upload rider KYC document                                           | multipart: file (PDF/image, max 10MB)                                                                         | {url}                                                 |
| DELETE     | Admin    | /uploads                       | Delete file from assets.dailyfresh.in                               | {file_path}                                                                                                   | {message}                                             |
| GET        | Admin    | /admin/settings                | Get all settings                                                    | —                                                                                                             | {settings:{key:value}}                                |
| PUT        | Admin    | /admin/settings                | Bulk update settings                                                | {key:value, key:value}                                                                                        | {settings}                                            |
| GET        | Public   | /settings/public               | Get non-sensitive public settings (store_name, GST, delivery rules) | —                                                                                                             | {settings}                                            |

**11.11 Analytics Endpoints — /admin/analytics/***

| **Method** | **Auth** | **Endpoint**                         | **Description**             | **Response Keys**                                                                                                                                               |
|------------|----------|--------------------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GET        | Admin    | /admin/analytics/summary             | Dashboard KPI summary       | Query: period (today|week|month|year|custom), date_from, date_to → {revenue, orders_count, new_customers, avg_order_value, pending_orders, low_stock_count}. **Note**: End-dates are automatically expanded to T23:59:59Z to ensure inclusive data capture. |
| GET        | Admin    | /admin/analytics/revenue-chart       | Revenue over time           | Query: from, to, granularity (day|week|month) → {labels[], revenue_data[], orders_data[]}                                                               |
| GET        | Admin    | /admin/analytics/top-products        | Best sellers by units       | Query: limit, period → {products[{name, sold, revenue}]}                                                                                                      |
| GET        | Admin    | /admin/analytics/orders-by-status    | Order count by status       | Query: period → {statuses[], counts[]}                                                                                                                      |
| GET        | Admin    | /admin/analytics/revenue-by-category | Revenue by category         | Query: period → {categories[], revenue[]}                                                                                                                   |
| GET        | Admin    | /admin/analytics/low-stock           | Products at/below threshold | Query: threshold → {products[{name, sku, stock, threshold}]}                                                                                                  |
| GET        | Admin    | /admin/analytics/new-customers       | New registrations over time | Query: from, to, granularity → {labels[], counts[]}                                                                                                         |
| GET        | Admin    | /admin/analytics/failed-payments     | Failed payment stats        | Query: period → {count, total_lost_revenue, orders[]}                                                                                                         |
| GET        | Admin    | /admin/analytics/store-performance   | Per-store revenue + orders  | Query: period, store_id → {stores[{store_name, orders, revenue}]}                                                                                             |


---

# SECTION 12 — RAZORPAY PAYMENT INTEGRATION (FULL SPEC)
## 12.1 Integration Architecture
Daily Fresh uses Razorpay's Orders API. The backend creates a Razorpay order and passes razorpay_order_id + key_id to the frontend. The frontend loads the Razorpay React Native SDK which renders the payment sheet. On payment completion, Razorpay sends an HMAC-SHA256 signed POST webhook to the backend.

## 12.2 Razorpay API Calls (Backend Service)
| **Operation**            | **Razorpay SDK Method** | **Notes**                                 |  Create Order             | POST                    | /pg/orders                                | When customer clicks Place Order → POST /orders |
| Get Order                | GET                     | /pg/orders/{order_id}                     | Payment verification polling                    |
| Create Payment Session   | POST                    | /pg/orders/sessions                       | After order creation — get payment_session_id   |
| Fetch Payments for Order | GET                     | /pg/orders/{order_id}/payments            | Admin payment detail view                       |
| Create Refund            | POST                    | /pg/orders/{order_id}/refunds             | Admin triggers refund                           |
| Fetch Refund Status      | GET                     | /pg/orders/{order_id}/refunds/{refund_id} | Check refund processing                         |

## 12.3 Create Razorpay Order — Request Body (Express.js)
> # razorpay.orders.create() — see Section 12.3 above
>
> Headers:
>
> key_id: process.env.RAZORPAY_KEY_ID
>
> key_secret: process.env.RAZORPAY_KEY_SECRET
>
> x-api-version: 2023-08-01
>
> Content-Type: application/json
>
> Body:
>
> {
>
> "order_id": "RN-20260410-0042", // our order_number
>
> "order_amount": 999.00, // total_amount in INR
>
> "order_currency": "INR",
>
> "customer_details": {
>
> "customer_id": "<user-uuid>",
>
> "customer_name": "John Doe",
>
> "customer_email": "john@example.com",
>
> "customer_phone": "9876543210"
>
> },
>
> "order_meta": {
>
> "return_url": "https://app.dailyfresh.com/order/success?order_id={order_id}",
>
> "notify_url": "https://api.dailyfresh.com/api/v1/payments/webhook"
>
> }
>
> }
>
> Response:
>
> {
>
> "cf_order_id": 123456789,
>
> "order_id": "RN-20260410-0042",
>
> "order_status": "ACTIVE",
>
> "payment_session_id": "session_xxxxxxxxxxxxxx" // pass this to frontend
>
> }

## 12.4 Webhook Verification (Node.js)
> // Razorpay sends POST to: https://api.dailyfresh.com/api/v1/payments/webhook
>
> // Headers: x-webhook-signature, x-webhook-timestamp
>
> const crypto = require('crypto');
>
> function verifyRazorpayWebhook(rawBody, signature) { // see Section 12.5 for full code
>
> const body = timestamp + rawBody;
>
> const expectedSig = crypto
>
> .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
>
> .update(body)
>
> .digest('base64');
>
> return expectedSig === signature;
>
> }
>
> // Webhook payload structure:
>
> {
>
> "data": {
>
> "order": {
>
> "order_id": "RN-20260410-0042",
>
> "order_status": "PAID",
>
> "order_amount": 999.00
>
> },
>
> "payment": {
>
> "cf_payment_id": 987654321,
>
> "payment_status": "SUCCESS",
>
> "payment_amount": 999.00,
>
> "payment_method": "upi"
>
> }
>
> },
>
> "event_time": "2026-04-10T12:00:00Z",
>
> "type": "PAYMENT_SUCCESS_WEBHOOK"
>
> }

## 12.5 Complete Payment Flow (Step by Step)
26. 1\. Customer reviews cart → clicks 'Proceed to Checkout'

27. 2\. Customer selects/adds address + delivery slot + reviews order summary

28. 3\. Customer clicks 'Place Order' → Frontend calls POST /orders

29. 4\. Backend creates order (status=pending, payment_status=pending) in Supabase

30. 5\. Backend calls razorpay.orders.create() → gets razorpay_order_id

31. 6\. Backend calls POST /pg/orders/sessions → gets payment_session_id

32. 7\. Backend stores razorpay_order_id in orders table; returns { order, razorpay_order_id, razorpay_key_id, amount }

33. 8\. Frontend calls RazorpayCheckout.open({ key: razorpay_key_id, order_id: razorpay_order_id, amount, ... })

34. 9\. Customer selects payment method (UPI/Card/Wallet/EMI/COD) + completes payment on Razorpay sheet

35. 10\. Razorpay sends HMAC-SHA256 webhook to POST /payments/webhook

36. 11\. Backend verifies HMAC-SHA256 signature → if INVALID: return 400 immediately

37. 12\. If PAYMENT_SUCCESS_WEBHOOK: update order.payment_status=paid, order.status=confirmed

38. 13\. Backend runs ATOMIC transaction: decrement stock for each order_item

39. 14\. Backend marks coupon: INSERT coupon_usages + UPDATE coupons.used_count++

40. 15\. Backend creates in-app notification for customer

41. 16\. Backend sends order confirmation email via Resend

42. 17\. Backend sends FCM push via Firebase Admin SDK

43. 18\. Backend emits Socket.IO 'order:new' to vendor room

44. 19\. Backend assigns delivery automatically (or admin assigns manually)

45. 20\. Frontend polls POST /payments/verify → shows OrderSuccessScreen

46. 21\. If payment FAILED: order.payment_status=failed, stock NOT decremented, coupon NOT consumed


---

# SECTION 13 — SUPABASE AUTH & STORAGE SETUP
## 13.1 Supabase Auth Configuration
|                           |  **Auth Provider**         | Email/Password (enabled) + Phone OTP (via Twilio or Supabase SMS provider)            |
| **JWT Expiry**            | access_token: 1 hour | refresh_token: 60 days                                        |
| **JWT Secret**            | Supabase auto-generates; used in backend middleware for verification                  |
| **Supabase Admin Client** | supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY) — backend only; NEVER in frontend |
| **Public Client**         | ANON_KEY — frontend auth operations only (login, register, OTP)                       |
| **Custom Claims / Role**  | user.role stored in profiles table; backend checks via DB on each request             |
| **Password Policy**       | Min 8 chars, 1 uppercase, 1 number (enforced client-side via Zod)                     |

## 13.2 File Storage — assets.dailyfresh.in
Daily Fresh uses a self-hosted media CDN at assets.dailyfresh.in instead of assets.dailyfresh.in CDN. Files are stored on the VPS disk (or mounted S3-compatible bucket). Nginx serves files with caching headers. Sharp (Node.js) handles WebP conversion and image resizing on upload.

| **Folder Path on CDN**               | **Access**            | **Allowed Types** | **Max Size** | **Usage**                                                          |
|--------------------------------------|-----------------------|-------------------|--------------|--------------------------------------------------------------------|
| assets.dailyfresh.in/products/       | Public                | jpg, png, webp    | 5 MB         | Product gallery images; auto-converted to WebP on upload via Sharp |
| assets.dailyfresh.in/stores/         | Public                | jpg, png, webp    | 3 MB         | Store logos and cover photos                                       |
| assets.dailyfresh.in/categories/     | Public                | jpg, png, webp    | 3 MB         | Category icons and thumbnails                                      |
| assets.dailyfresh.in/avatars/        | Public                | jpg, png, webp    | 2 MB         | Customer and rider profile photos                                  |
| assets.dailyfresh.in/riders/docs/    | Private (token-gated) | jpg, png, pdf     | 10 MB        | Rider licence, vehicle RC, govt ID — admin-only via signed URL     |
| assets.dailyfresh.in/delivery-proof/ | Private (token-gated) | jpg, png          | 5 MB         | Rider delivery proof photos — admin + relevant customer access     |
| assets.dailyfresh.in/banners/        | Public                | jpg, png, webp    | 5 MB         | Homepage and promotional banners                                   |

**<u>assets.dailyfresh.in Upload Service (Express.js)</u>**

> // storage.service.js
>
> const multer = require('multer');
>
> const sharp = require('sharp');
>
> const path = require('path');
>
> const fs = require('fs');
>
> const UPLOAD_BASE = '/var/www/assets.dailyfresh.in';
>
> const CDN_BASE = 'https://assets.dailyfresh.in';
>
> async function uploadImage(file, folder, filename) {
>
> const webpFilename = filename + '.webp';
>
> const destPath = path.join(UPLOAD_BASE, folder, webpFilename);
>
> // Convert to WebP + resize (max 1200px wide) using Sharp
>
> await sharp(file.buffer)
>
> .resize({ width: 1200, withoutEnlargement: true })
>
> .webp({ quality: 85 })
>
> .toFile(destPath);
>
> return {
>
> url: `\${CDN_BASE}/\${folder}/\${webpFilename}`,
>
> path: `/\${folder}/\${webpFilename}`,
>
> };
>
> }
>
> async function deleteImage(filePath) {
>
> const fullPath = path.join(UPLOAD_BASE, filePath);
>
> if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
>
> }
>
> module.exports = { uploadImage, deleteImage };

**<u>Nginx Config for assets.dailyfresh.in</u>**

> server {
>
> listen 443 ssl http2;
>
> server_name assets.dailyfresh.in;
>
> root /var/www/assets.dailyfresh.in;
>
> # Public folders — serve directly
>
> location ~* ^/(products|stores|categories|avatars|banners)/ {
>
> expires 30d;
>
> add_header Cache-Control 'public, immutable';
>
> add_header Access-Control-Allow-Origin '*';
>
> try_files \$uri =404;
>
> }
>
> # Private folders — require Authorization header (token validated by API)
>
> location ~* ^/(riders/docs|delivery-proof)/ {
>
> internal; # only accessible via X-Accel-Redirect from API
>
> }
>
> location = /download {
>
> # API proxies private file downloads through here
>
> proxy_pass http://localhost:5000/uploads/serve;
>
> }
>
> }


---

# SECTION 14 — REAL-TIME (SOCKET.IO) SPECIFICATION
## 14.1 Socket.IO Server Setup
> // server.js
>
> const { createServer } = require('http');
>
> const { Server } = require('socket.io');
>
> const { createAdapter } = require('@socket.io/redis-adapter');
>
> const { createClient } = require('redis');
>
> const httpServer = createServer(app);
>
> const io = new Server(httpServer, {
>
> cors: { origin: process.env.ALLOWED_ORIGINS.split(','), credentials: true },
>
> transports: ['websocket', 'polling'],
>
> pingTimeout: 60000,
>
> pingInterval: 25000
>
> });
>
> // Redis adapter for horizontal scaling across multiple Node.js instances
>
> const pubClient = createClient({ url: process.env.REDIS_URL });
>
> const subClient = pubClient.duplicate();
>
> await Promise.all([pubClient.connect(), subClient.connect()]);
>
> io.adapter(createAdapter(pubClient, subClient));

## 14.2 Room Naming Convention
| **Room Name**    | **Who Joins**                                             | **Purpose**                                                                |
|------------------|-----------------------------------------------------------|----------------------------------------------------------------------------|
| order:{order_id} | Customer App on OrderDetailScreen; Admin on live tracking | Receive rider location updates and order status changes for specific order |
| store:{store_id} | Store Manager App (when app is open)                      | Receive new order alerts for that specific store                           |
| rider:{rider_id} | Rider App (always connected when online)                  | Receive delivery task assignments                                          |
| admin:riders     | Admin Panel (live tracking page)                          | Receive all rider location updates for map                                 |
| admin:orders     | Admin Panel                                               | Receive all new order events for real-time order count                     |

## 14.3 Socket.IO Events
| **Event Name**           | **Direction**                          | **Payload**                                                                           | **Description**                                                   |
|--------------------------|----------------------------------------|---------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| rider:location_update    | Client → Server (Rider App)            | {rider_id, lat, lng, delivery_id, timestamp}                                          | Emitted every 5s by Rider App when online                         |
| rider:location_broadcast | Server → Clients                       | {rider_id, lat, lng, delivery_id}                                                     | Broadcast to room order:{delivery.order_id} and room admin:riders |
| order:new                | Server → Client (Store Manager App)    | {order_id, order_number, items_count, total, store_id}                                | Emitted when new order placed for a store                         |
| order:status_changed     | Server → Client (Customer App)         | {order_id, new_status, note}                                                          | Emitted when admin updates order status                           |
| delivery:assigned        | Server → Client (Rider App)            | {delivery_id, order_id, pickup_address, drop_address, estimated_earning, distance_km} | Emitted when admin assigns rider to delivery                      |
| delivery:status          | Server → Client (Customer App + Admin) | {delivery_id, status, rider_lat?, rider_lng?}                                         | Emitted when rider updates delivery status (pickup, delivered)    |
| connect                  | Built-in                               | —                                                                                     | Client authenticates via token in handshake auth header           |
| disconnect               | Built-in                               | —                                                                                     | Server removes rider from online status if rider disconnects      |
| join:order               | Client → Server                        | {order_id, token}                                                                     | Customer joins order room to receive tracking updates             |
| join:vendor              | Client → Server                        | {vendor_id, token}                                                                    | Vendor joins their room on app open                               |

## 14.4 Socket.IO Authentication Middleware
> io.use(async (socket, next) => {
>
> const token = socket.handshake.auth?.token;
>
> if (!token) return next(new Error('Authentication required'));
>
> try {
>
> const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
>
> if (error || !user) return next(new Error('Invalid token'));
>
> socket.user = user;
>
> next();
>
> } catch (err) {
>
> next(new Error('Authentication failed'));
>
> }
>
> });
>
> io.on('connection', (socket) => {
>
> console.log(`Connected: \${socket.user.id} (\${socket.user.role})`);
>
> // Riders auto-join their personal room
>
> if (socket.user.role === 'rider') {
>
> socket.join(`rider:\${socket.user.rider_id}`);
>
> }
>
> socket.on('rider:location_update', async (data) => {
>
> // Update DB
>
> await supabaseAdmin.from('riders').update({
>
> current_lat: data.lat, current_lng: data.lng, last_location_at: new Date()
>
> }).eq('id', data.rider_id);
>
> // Broadcast to customer and admin
>
> socket.to(`order:\${data.delivery_id}`).emit('rider:location_broadcast', data);
>
> socket.to('admin:riders').emit('rider:location_broadcast', data);
>
> });
>
> socket.on('join:order', ({ order_id }) => {
>
> socket.join(`order:\${order_id}`);
>
> });
>
> });


---

# SECTION 15 — THIRD-PARTY APIs & SERVICES
*ALL third-party API costs are NOT included in the INR 1,00,000 project fee. Client must create accounts and fund independently. ArgosMob integrates these services but bears no responsibility for third-party pricing changes, downtime, or policy updates.*

| **Service**          | **Provider**                       | **Purpose**                                                                           | **Pricing Model**                            | **Client Account Required**                     | **Setup Deadline** |
|----------------------|------------------------------------|---------------------------------------------------------------------------------------|----------------------------------------------|-------------------------------------------------|--------------------|
| OTP Authentication   | Firebase Auth (Google) / MSG91     | Phone OTP for customer, vendor, rider login                                           | Free tier / MSG91 ~INR 0.10/OTP              | Yes — Firebase Console / MSG91                  | By Day 3           |
| Payments Gateway     | Razorpay                           | UPI, Cards, Net Banking, Wallets, EMI, COD                                            | 2% + GST per transaction                     | Yes — Razorpay Business Account (KYC required)  | By Day 7           |
| Maps & Geolocation   | Google Maps Platform               | Live rider tracking, address autocomplete, directions API                             | \$0.005/request; \$200 free/month            | Yes — Google Cloud Console with billing enabled | By Day 3           |
| File Storage / CDN   | assets.dailyfresh.in (self-hosted) | Product images, store photos, delivery proof; Nginx-served; Sharp for WebP transforms | Server storage cost only (included in VPS)   | No separate account — configured on VPS         | By Day 4           |
| Push Notifications   | Firebase Cloud Messaging           | Order alerts, delivery updates, promo broadcasts                                      | Free (no per-message charge)                 | Yes — Firebase Console (same project as Auth)   | By Day 3           |
| Email Notifications  | Resend                             | Order confirmation, status update, OTP fallback, password reset                       | Free 100 emails/day; Pro \$20/month          | Yes — Resend Account                            | By Day 5           |
| SMS Notifications    | MSG91 / Twilio                     | OTP (fallback), order status SMS alerts                                               | MSG91: ~INR 0.10–0.25/SMS                    | Yes — MSG91 Account                             | By Day 5           |
| Cache & Session      | Upstash Redis                      | Cart caching, rate limiting, Socket.IO pub/sub adapter                                | Free 10,000 req/day; Pro \$0.2/100k requests | Yes — Upstash Account                           | By Day 4           |
| Analytics (Optional) | Firebase Analytics / Mixpanel      | User behaviour, funnel analysis, retention                                            | Free tier available                          | Yes — Firebase Console                          | Optional           |
| Address Autocomplete | Google Places API                  | Smart address suggestions during checkout                                             | Included in Google Maps Platform billing     | Same as Maps                                    | Same as Maps       |
| Reverse Geocoding    | Google Geocoding API               | GPS coordinates → readable address                                                    | Included in Google Maps Platform billing     | Same as Maps                                    | Same as Maps       |


---

# SECTION 16 — NON-FUNCTIONAL REQUIREMENTS
| **Category**    | **Requirement**           | **Target / Standard**                                                                 |
|-----------------|---------------------------|---------------------------------------------------------------------------------------|
| Performance     | API Response Time         | < 500ms for 95th percentile under normal load                                        |
| Performance     | App Load Time             | < 3 seconds on 4G network for initial render                                         |
| Performance     | Socket.IO Latency         | < 500ms for rider location event broadcast                                           |
| Scalability     | Concurrent Users          | Support up to 1,000 simultaneous users at MVP launch                                  |
| Scalability     | DB Connections            | Supabase connection pooling via PgBouncer                                             |
| Availability    | Uptime SLA                | 99.5% monthly uptime for all backend services                                         |
| Availability    | Deployment Downtime       | Zero-downtime deployments via PM2 reload                                              |
| Security        | Data Encryption           | HTTPS/TLS 1.3 for all API communication; AES-256 for sensitive data at rest           |
| Security        | Authentication            | JWT with 15-minute access token + 7-day refresh token rotation                        |
| Security        | PCI Compliance            | Payment data handled entirely via Razorpay; no card data stored on platform           |
| Security        | OTP Attempts              | Max 3 OTP attempts; 15-min lockout after limit reached                                |
| Compatibility   | Android                   | Android 8.0 (Oreo) and above                                                          |
| Compatibility   | iOS                       | iOS 13 and above                                                                      |
| Compatibility   | Admin Panel Browsers      | Chrome, Firefox, Safari, Edge — latest 2 major versions                               |
| Usability       | Accessibility (Admin)     | WCAG 2.1 AA compliance for admin panel                                                |
| Maintainability | Code Quality              | ESLint + Prettier enforced; unit test coverage > 60%                                 |
| Maintainability | Documentation             | All API endpoints in Postman; inline code comments on all controllers                 |
| Real-Time       | Location Update Frequency | Rider GPS emitted every 5 seconds when active delivery in progress                    |
| Data Integrity  | Order Stock               | Stock decrement is ATOMIC (PostgreSQL transaction); no overselling                    |
| Observability   | Error Logging             | All unhandled errors logged to Winston with stack trace + request metadata            |
| Observability   | Uptime Monitoring         | UptimeRobot (or equivalent) monitoring all 3 production domains, 1-min check interval |


---

# SECTION 17 — UI/UX DESIGN GUIDELINES & SCREEN INVENTORY
## 17.1 Design Tokens
| **Token**                  | **Value**                                | **Usage**                                       |
|----------------------------|------------------------------------------|-------------------------------------------------|
| Primary Blue               | #2563EB                                 | CTAs, active states, links, headings            |
| Primary Dark               | #1A1A2E                                 | Page backgrounds (dark sections), text headings |
| Teal Accent                | #0F766E                                 | Secondary actions, store-related accents        |
| Near-Black                 | #1C1C1C                                 | Body text                                       |
| Medium Gray                | #64748B                                 | Secondary text, labels, placeholder text        |
| Light Gray                 | #F8FAFC                                 | Card backgrounds, section fills                 |
| Border Gray                | #E2E8F0                                 | Dividers, input borders                         |
| Success Green              | #16A34A                                 | Order delivered, in stock, success states       |
| Warning Orange             | #EA580C                                 | Low stock, pending status, warnings             |
| Error Red                  | #DC2626                                 | Error messages, out of stock, cancellation      |
| Info Blue                  | #0284C7                                 | Info toasts, informational elements             |
| White                      | #FFFFFF                                 | Card surfaces, modal backgrounds                |
| Font — Display             | Poppins Bold                             | H1, H2, product names, hero text, large price   |
| Font — Body                | DM Sans / Inter Regular/Medium           | Body text, UI labels, inputs, buttons           |
| Font Size Scale            | 12/14/16/18/20/24/28/32/40pt             | Consistent typography scale                     |
| Border Radius — Card       | 12px                                     | Product cards, order cards, store cards         |
| Border Radius — Button     | 8px                                      | Primary and secondary buttons                   |
| Border Radius — Input      | 8px                                      | Form inputs, search bars                        |
| Border Radius — Badge      | 20px                                     | Status badges, category chips                   |
| Shadow — Card              | 0 2px 12px rgba(0,0,0,0.08)              | Elevated card shadow                            |
| Spacing Scale              | 4/8/12/16/24/32/48/64px                  | Consistent padding + margin system              |
| Bottom Tab Height (Mobile) | 56px                                     | iOS safe area + 56px                            |
| Status Bar Style           | Light on dark backgrounds; dark on light | iOS + Android status bar                        |

## 17.2 Push Notification Events
| **Trigger Event**         | **Target**                | **Title**            | **Body**                                                                     |
|---------------------------|---------------------------|----------------------|------------------------------------------------------------------------------|
| Order placed successfully | Customer                  | Order Confirmed! 🎉  | Your order #RN-XXXX has been placed and is being prepared.                  |
| Order confirmed by store  | Customer                  | Order Confirmed ✅   | Your order is confirmed and being prepared.                                  |
| Order packed by store     | Customer                  | Order Packed 📦      | Your order is packed and waiting for a rider.                                |
| Order picked up by rider  | Customer                  | On Its Way! 🚚       | Your order has been picked up and is on the way.                             |
| Order delivered           | Customer                  | Delivered! ✅        | Your order has been delivered. Rate your experience!                         |
| Order cancelled           | Customer                  | Order Cancelled      | Your order #RN-XXXX has been cancelled.                                     |
| Refund initiated          | Customer                  | Refund Processing 💰 | Refund of ₹X initiated for order #RN-XXXX. 3-7 business days.               |
| New order received        | Store Manager             | New Order! 🛒        | Daily Fresh order #DF-XXXX received at your store. Accept within 5 minutes. |
| Rider assigned to order   | Vendor                    | Rider En Route 🏍️    | A rider is on the way to collect order #DF-XXXX from your store.            |
| Delivery task assigned    | Rider                     | New Delivery Task 🗺️ | New delivery: [Vendor Name] → [Customer Area]. Estimated ₹XX.            |
| Low stock alert           | Vendor                    | Low Stock Alert ⚠️   | [Product Name] has only X units left. Please restock.                      |
| Payout processed          | Vendor / Rider            | Payment Received 💸  | ₹X has been transferred to your bank account.                                |
| Admin broadcast           | All / Segment             | Custom title         | Custom promotional message from admin                                        |
| Back-in-stock alert       | Customer (Notify Me list) | Back in Stock! 🔔    | [Product Name] is back in stock. Order now before it runs out!             |
| Delivery slot reminder    | Customer                  | Upcoming Delivery 🚚 | Your order is scheduled for today [Slot time]. Get ready!                  |

## 17.3 Complete Screen Inventory
**<u>Customer App — FreshToHome Clone (React Native — 375×812 iPhone 14 frame in Figma)</u>**

- APP-C-01: Splash Screen (Daily Fresh green branding)

- APP-C-02: Location Picker Screen (delivery location gate — pincode / GPS / search)

- APP-C-03: Onboarding Screen (3 slides — first launch only)

- APP-C-04: Login Screen (Phone OTP tab + Email/Password tab)

- APP-C-05: OTP Verify Screen (6-cell input with countdown resend)

- APP-C-06: Register Screen

- APP-C-07: Home Screen (location bar + category chips + banner carousel + Deal of the Day + category sections)

- APP-C-08: Categories Screen (full category grid tab — Fish, Chicken, Mutton, Ready to Cook, etc.)

- APP-C-09: Sub-Category / Product Listing Screen (sub-category chips + product grid + filter + sort)

- APP-C-10: Product Detail Screen (cut preference + cleaning preference + weight selector + Notify Me + recipe link + quality badges)

- APP-C-11: Search Screen (popular searches + recent + live suggestions)

- APP-C-12: Cart Screen (delivery slot selector bottom sheet + item checkboxes + coupon + price summary)

- APP-C-13: Address Screen (delivery slot shown + saved addresses + add new with serviceability check)

- APP-C-14: Payment Screen (Razorpay SDK — UPI/Card/Wallet/COD)

- APP-C-15: Order Success Screen (Lottie animation + slot confirmation + cleaning prep note)

- APP-C-16: Orders Screen (Active / Delivered / Cancelled tabs)

- APP-C-17: Order Detail Screen (status stepper with 'Being Prepared' step + live map + missing item complaint)

- APP-C-18: Account Screen (VIP membership banner + menu list)

- APP-C-19: VIP Membership Screen (subscription plans + benefits)

- APP-C-20: Wishlist Screen (Wishlist tab + Notify Me tab)

- APP-C-21: Notifications Screen (order updates, deals, back-in-stock alerts)

- APP-C-22: Address Book Screen

- APP-C-23: Review / Rate Order Screen

- APP-C-24: No Internet State

**<u>Store Manager App (React Native)</u>**

- APP-S-01: Store Manager Login Screen (Admin-created accounts)

- APP-S-02: KYC Pending / Approval Status Screen

- APP-S-03: Store Dashboard Screen

- APP-S-03: Store Dashboard Screen

- APP-S-04: Orders Screen (New | Preparing | Ready | Completed | Cancelled tabs)

- APP-S-05: Order Detail Modal / Screen

- APP-S-06: Inventory / Product Catalogue Screen

- APP-S-07: Add / Edit Product Screen

- APP-S-08: Earnings Screen

- APP-S-09: Store Profile Screen

- APP-V-10: Notifications Screen

**<u>Rider App (React Native)</u>**

- APP-R-01: Rider Registration & Document Upload Screen

- APP-R-02: KYC Pending / Status Screen

- APP-R-03: Rider Home / Availability Screen (with map background)

- APP-R-04: Incoming Order Modal (auto-popup with 30s countdown)

- APP-R-05: Active Delivery Screen (map with turn-by-turn navigation)

- APP-R-06: Delivery Proof Screen (photo capture or OTP confirmation)

- APP-R-07: Delivery History Screen

- APP-R-08: Earnings Screen

- APP-R-09: Rider Profile Screen

- APP-R-10: Notifications Screen

**<u>Web Admin Panel (Next.js — 1280px desktop)</u>**

- ADM-01: Admin Login Screen

- ADM-02: Dashboard Screen (KPIs + Charts + Analytics)

- ADM-03: Product Management Screen

- ADM-04: Add / Edit Product Drawer

- ADM-05: Order Management Screen

- ADM-06: Order Detail Drawer (with status update + refund)

- ADM-07: User Management Screen (Customers | Store Managers | Riders tabs)

- ADM-08: Category Management Screen (drag-to-reorder)

- ADM-09: Coupon Management Screen

- ADM-10: Banner Management Screen

- ADM-11: Live Delivery Tracking Screen (Google Maps all riders)

- ADM-12: Review Moderation Screen

- ADM-13: Analytics Screen (all charts + export)

- ADM-14: Push Notification Broadcast Screen

- ADM-15: Settings Screen (General | Financial | Inventory | Zones tabs)

- ADM-16: Reports Screen (PDF/CSV exports)


---

# SECTION 18 — PROJECT TIMELINE — 30-DAY DELIVERY PLAN
*All timelines are contingent on timely client feedback and asset provision. Delays in client feedback auto-extend timeline by an equivalent period.*

| **Phase**                         | **Activities**                                                                                                                                                                                                                             | **Days**   | **Deliverables**                                                                                                                                                 | **Dependencies**                                                                                                                        |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Phase 1 — Discovery & Setup       | Requirements finalisation, environment setup, UI/UX wireframes for all screens, API design, DB schema, Figma handoff, Postman environment setup                                                                                            | Days 1–5   | Wireframes (Figma), API contract (Postman), DB migration scripts, project repo (GitHub), .env.example files                                                      | Client provides: brand assets, sample product data, Razorpay + Firebase + Google Cloud accounts; assets.dailyfresh.in domain configured |
| Phase 2 — Backend Development     | Express.js APIs for all modules, Supabase tables + RLS + seed data, Socket.IO real-time layer, Razorpay test mode integration, assets.dailyfresh.in upload pipeline (multer + Sharp + Nginx), FCM setup, Resend email templates, MSG91 OTP | Days 4–14  | All API endpoints live on staging, Postman collection exported, Socket.IO events tested, Razorpay test mode end-to-end payment flow working, DB seed data loaded | Phase 1 complete; VPS accessible; Supabase project created; assets.dailyfresh.in CDN configured and accessible                          |
| Phase 3 — Mobile App Development  | All 3 React Native apps: Customer, Store Manager, Rider — all screens, API integration, Google Maps SDK, FCM push, Razorpay SDK, Socket.IO client, EAS Build                                                                               | Days 7–22  | Working APK (Android) + TestFlight build (iOS) for all 3 apps; all screens functional against staging API                                                        | Phase 2 backend APIs complete; Figma designs approved; Apple Developer account (client provides for iOS)                                |
| Phase 4 — Admin Panel Development | React.js admin: Dashboard with charts, store management, product moderation, order management, rider management, live tracking map, analytics, settings, banner/coupon management                                                          | Days 10–22 | Deployed admin panel on staging URL (admin.staging.dailyfresh.com); all CRUD operations functional                                                               | Phase 2 backend APIs complete                                                                                                           |
| Phase 5 — QA & Testing            | Functional testing, UAT, bug fixes, cross-device testing, payment flow testing (sandbox), security audit, performance testing, Postman collection verification                                                                             | Days 22–27 | QA test report, UAT sign-off sheet, resolved bug log, Postman collection fully verified, Lighthouse scores documented                                            | All phases complete; client UAT feedback within 48hrs                                                                                   |
| Phase 6 — Deployment & Handover   | Production VPS setup, Nginx config, SSL certs, PM2 cluster, domain DNS, production Razorpay config, Play Store + App Store submission initiation, source code documentation                                                                | Days 27–30 | Live apps on production URLs, SSL active, PM2 running, Play Store + App Store builds submitted, source code + docs handed over                                   | Client UAT sign-off; Razorpay production credentials; domain DNS access; Google Play + Apple Developer accounts                         |

*Note: Mobile app store review (Google Play & Apple App Store) takes 3–7 business days — outside ArgosMob's control. Submission initiated on Day 27.*

## 18.1 Milestone Payment Schedule
| **Milestone**        | **Deliverable**                                                                             | **Payment %** | **Amount (INR)** |
|----------------------|---------------------------------------------------------------------------------------------|---------------|------------------|
| M0 — Project Kickoff | Signed SOW + advance payment received                                                       | 40%           | ₹40,000          |
| M1 — UI Completion   | All app + admin screens approved in Figma; backend APIs on staging                          | 30%           | ₹30,000          |
| M2 — Beta Release    | All features functional on staging; client UAT sign-off                                     | 20%           | ₹20,000          |
| M3 — Final Go-Live   | Production deployed, all domains live, app builds submitted, source code + docs handed over | 10%           | ₹10,000          |


---

# SECTION 19 — VPS HOSTING & DEVOPS
## 19.1 Server Requirements
|                       |  **VPS Type**          | KVM2 (KVM-based virtual machine)                                     |
| **Recommended Specs** | 4 vCPU, 8GB RAM, 100GB SSD NVMe (minimum: 2 vCPU, 4GB RAM, 80GB SSD) |
| **OS**                | Ubuntu 22.04 LTS (64-bit)                                            |
| **Node.js**           | v20.x LTS (installed via nvm for version management)                 |
| **Process Manager**   | PM2 v5.x — cluster mode, auto-restart, log rotation                  |
| **Web Server**        | Nginx 1.24+ (reverse proxy + static file server)                     |
| **SSL**               | Certbot + Let's Encrypt (auto-renewal via cron job)                  |
| **Firewall**          | UFW — allow: 22 (SSH), 80 (HTTP), 443 (HTTPS); deny all others       |
| **Redis**             | Upstash Redis (managed) — or self-hosted Redis 7.x on same VPS       |

## 19.2 Domain & DNS Configuration
| **DNS Record**       | **Type** | **Value**      | **Purpose**                                             |
|----------------------|----------|----------------|---------------------------------------------------------|
| dailyfresh.com       | A        | <VPS_IP>     | Root domain → Customer website (future) or API redirect |
| www.dailyfresh.com   | CNAME    | dailyfresh.com | WWW redirect                                            |
| api.dailyfresh.com   | A        | <VPS_IP>     | Backend Express.js API + Socket.IO                      |
| admin.dailyfresh.com | A        | <VPS_IP>     | Web Admin Panel (React.js build)                        |

## 19.3 Nginx Configuration
> # /etc/nginx/sites-available/dailyfresh
>
> # Redirect HTTP → HTTPS
>
> server {
>
> listen 80;
>
> server_name api.dailyfresh.com admin.dailyfresh.com;
>
> return 301 https://\$host\$request_uri;
>
> }
>
> # API Server — proxy to Express.js + Socket.IO on port 5000
>
> server {
>
> listen 443 ssl http2;
>
> server_name api.dailyfresh.com;
>
> ssl_certificate /etc/letsencrypt/live/api.dailyfresh.com/fullchain.pem;
>
> ssl_certificate_key /etc/letsencrypt/live/api.dailyfresh.com/privkey.pem;
>
> ssl_protocols TLSv1.2 TLSv1.3;
>
> add_header Strict-Transport-Security 'max-age=31536000' always;
>
> location / {
>
> proxy_pass http://localhost:5000;
>
> proxy_http_version 1.1;
>
> proxy_set_header Upgrade \$http_upgrade; # required for WebSocket (Socket.IO)
>
> proxy_set_header Connection 'upgrade';
>
> proxy_set_header Host \$host;
>
> proxy_set_header X-Real-IP \$remote_addr;
>
> proxy_cache_bypass \$http_upgrade;
>
> client_max_body_size 10M;
>
> }
>
> }
>
> # Admin Panel — serve React build (static files)
>
> server {
>
> listen 443 ssl http2;
>
> server_name admin.dailyfresh.com;
>
> root /var/www/dailyfresh/admin/dist;
>
> index index.html;
>
> location / { try_files \$uri \$uri/ /index.html; }
>
> location ~* \(js|css|png|jpg|jpeg|gif|ico|svg|woff2)\$ {
>
> expires 1y;
>
> add_header Cache-Control 'public, immutable';
>
> }
>
> }

## 19.4 PM2 Configuration
> // ecosystem.config.js
>
> module.exports = {
>
> apps: [{
>
> name: 'dailyfresh-api',
>
> script: './server.js',
>
> instances: 'max', // cluster mode — one per CPU core
>
> exec_mode: 'cluster',
>
> watch: false,
>
> max_memory_restart: '500M',
>
> env: { NODE_ENV: 'production', PORT: 5000 },
>
> error_file: './logs/err.log',
>
> out_file: './logs/out.log',
>
> log_date_format: 'YYYY-MM-DD HH:mm:ss',
>
> kill_timeout: 5000
>
> }]
>
> };
>
> // Commands:
>
> // pm2 start ecosystem.config.js
>
> // pm2 reload dailyfresh-api # zero-downtime reload
>
> // pm2 status
>
> // pm2 logs dailyfresh-api
>
> // pm2 startup && pm2 save # auto-start on reboot

## 19.5 Deployment Checklist
47. SSH into VPS: ssh root@<VPS_IP>; create deploy user; configure SSH key auth

48. Install nvm + Node 20: curl nvm install script; nvm install 20; nvm use 20

49. Install PM2: npm install -g pm2

50. Install Nginx: apt install nginx -y; Install Certbot: apt install certbot python3-certbot-nginx -y

51. Configure UFW: ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw enable

52. Clone repos: git clone <repo> /var/www/dailyfresh/{api,admin}

53. Install deps: cd /var/www/dailyfresh/api && npm install --production

54. Create .env files from .env.example; fill all production values

55. Run DB migrations: execute all SQL files against Supabase project

56. Build admin panel: cd /var/www/dailyfresh/admin && npm install && npm run build

57. Configure Nginx virtual hosts; test config: nginx -t; enable sites: ln -s

58. Run Certbot: certbot --nginx -d api.dailyfresh.com -d admin.dailyfresh.com

59. Start API with PM2: pm2 start ecosystem.config.js; pm2 startup && pm2 save

60. Verify all domains: curl -I https://api.dailyfresh.com/health

61. Test Razorpay webhook endpoint using Razorpay Dashboard → Webhooks → Test

62. Set up UptimeRobot monitoring on all domains (1-minute check interval)


---

# SECTION 20 — SECURITY & PERFORMANCE
## 20.1 Security Measures
| **Category**     | **Measure**                              | **Implementation**                                                                           |
|------------------|------------------------------------------|----------------------------------------------------------------------------------------------|
| API Auth         | JWT verification on all protected routes | Supabase JWT secret in Express auth middleware; req.user extracted                           |
| API Auth         | Role-based access on every route         | adminOnly / storeManagerOnly / riderOnly middleware after auth middleware                    |
| HTTPS            | All traffic over TLS 1.2/1.3             | Let's Encrypt via Certbot on Nginx; HSTS header enforced                                     |
| Headers          | Secure HTTP headers                      | helmet.js: X-Frame-Options, Content-Security-Policy, HSTS, X-Content-Type-Options            |
| CORS             | Origin whitelist                         | cors({ origin: [...allowedDomains], credentials: true })                                   |
| Rate Limiting    | Prevent brute force                      | express-rate-limit (Redis store): 10/15min on /auth/*; 100/15min global                     |
| Input Validation | Schema validation on all inputs          | Zod on all POST/PUT/PATCH bodies + query params; 422 with field errors                       |
| SQL Injection    | No raw SQL                               | All DB via Supabase client (parameterised queries); RLS as safety net                        |
| File Upload      | Type + size validation                   | multer fileFilter (image types only) + limits.fileSize (5MB); Sharp converts to WebP on save |
| Webhook Security | Razorpay HMAC-SHA256                     | Verify every webhook signature before any processing; return 400 on mismatch                 |
| Secrets          | No secrets in code/repo                  | .env files + .gitignore; .env.example with placeholders only; GitHub Secrets for CI          |
| Dependency Audit | Regular vulnerability checks             | npm audit in CI/CD pipeline; Dependabot alerts on GitHub                                     |
| Admin Panel      | CSRF protection (future)                 | JWT in httpOnly cookie + SameSite=Strict for admin sessions                                  |

## 20.2 Performance Targets
| **Metric**                              | **Target**                                                                 |
|-----------------------------------------|----------------------------------------------------------------------------|
| API Response (list endpoints, 20 items) | < 300ms at 50th percentile; < 500ms at 95th percentile                   |
| API Response (single resource detail)   | < 150ms                                                                   |
| Socket.IO location event latency        | < 500ms end-to-end                                                        |
| App initial render (4G network)         | < 3 seconds                                                               |
| Image Load (product images)             | < 1 second via assets.dailyfresh.in CDN with WebP served by Nginx + Sharp |
| Admin Panel initial load                | < 2 seconds (code-split per route with React.lazy + Suspense)             |
| Concurrent users at MVP                 | 1,000 simultaneous (PM2 cluster + Redis for shared state)                  |
| Database queries (indexed)              | < 50ms for all indexed queries                                            |
| Nginx static asset cache                | 1-year Cache-Control for JS/CSS/images; reduces origin load to near zero   |


---

# SECTION 21 — TESTING & QA STRATEGY
## 21.1 Testing Levels
| **Level**             | **Scope**                                                                     | **Tools**                                           | **Responsibility** |
|-----------------------|-------------------------------------------------------------------------------|-----------------------------------------------------|--------------------|
| Unit Tests            | Individual utility functions, service methods (orderNumber, HMAC, GST calc)   | Jest                                                | Backend Developer  |
| Integration Tests     | API endpoints — full request/response cycle with Supabase test DB             | Jest + Supertest                                    | Backend Developer  |
| E2E Tests (Manual)    | Full user flows on staging: order placement → delivery → review               | Manual + Postman                                    | QA Engineer        |
| API Testing           | All Postman collection endpoints; positive + negative + edge cases            | Postman + Newman CLI                                | Backend + QA       |
| Cross-Browser (Admin) | Chrome, Firefox, Safari, Edge — admin panel functionality                     | Manual                                              | QA Engineer        |
| Device Testing        | Android 10+, iOS 15+, various screen sizes for all 3 mobile apps              | Physical devices + Android Emulator + iOS Simulator | Mobile Dev + QA    |
| Payment Testing       | All Razorpay payment methods in test mode: UPI, card, netbanking, wallet, COD | Razorpay Test Mode                                  | Backend + QA       |
| Real-Time Testing     | Socket.IO: rider location updates, order events, disconnect/reconnect         | Custom test scripts                                 | Backend + QA       |
| Performance Testing   | Lighthouse audit, API load test with k6 or JMeter                             | Lighthouse, k6                                      | QA / DevOps        |
| Security Testing      | Auth bypass attempts, SQL injection, HMAC tampering, rate limit testing       | OWASP checklist, manual                             | Senior Dev         |
| UAT                   | Client acceptance testing on staging environment                              | Manual — client runs test cases                     | Client + PM        |

## 21.2 Critical Test Cases
| **TC ID** | **Scenario**                                                                                                                                                                                   | **Expected Result**                                                                                                                             |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| TC-001    | New customer registers with phone → receives OTP → verifies → logs in                                                                                                                          | User account created; JWT returned; navigates to HomeScreen                                                                                     |
| TC-002    | Customer sets location (pincode) → browses categories → adds fish with Curry Cut + Cleaned preference → selects delivery slot at cart → applies coupon → completes Razorpay UPI payment        | Order created; cut_preference='Curry Cut'; cleaning_preference='Cleaned'; delivery_slot stored; stock decremented; order confirmation push sent |
| TC-003    | Failed Razorpay payment attempt                                                                                                                                                                | order.payment_status=failed; stock NOT decremented; coupon NOT consumed                                                                         |
| TC-004    | Admin creates store + store manager → Store Manager adds a product with cut options (Curry Cut, Boneless) + cleaning options → Customer sees product with preferences on Product Detail screen | Product visible on app with correct cut/cleaning preference selectors                                                                           |
| TC-005    | Rider goes online → Admin assigns delivery → Rider navigates → confirms delivery with photo                                                                                                    | Delivery status=delivered; order status=delivered; rider earnings updated; customer FCM push sent                                               |
| TC-006    | Customer opens OrderDetailScreen while order is Shipped → watches rider pin move on map                                                                                                        | Socket.IO events received; MapView rider pin updates in real-time within 5s of rider emitting location                                          |
| TC-007    | Admin updates order status from Packed → Shipped → customer app shows updated status                                                                                                           | order.status=shipped; Socket.IO event emitted; customer sees updated status; FCM push delivered                                                 |
| TC-008    | Apply expired coupon                                                                                                                                                                           | API returns 400 with error_reason: COUPON_EXPIRED                                                                                               |
| TC-009    | Customer tries to access /admin/products endpoint with customer JWT                                                                                                                            | Returns 403 FORBIDDEN                                                                                                                           |
| TC-010    | API endpoint receives 11 auth requests in 15 minutes from same IP                                                                                                                              | 11th request returns 429 TOO_MANY_REQUESTS                                                                                                      |
| TC-011    | Product stock = 0; customer tries to add to cart                                                                                                                                               | is_active check passes but stock_quantity=0 → 400 INSUFFICIENT_STOCK                                                                            |
| TC-012    | Customer cancels confirmed order                                                                                                                                                               | order.status=cancelled; stock restored atomically; refund initiated if paid                                                                     |
| TC-013    | Razorpay webhook received with invalid HMAC-SHA256 signature                                                                                                                                   | Returns 400; order NOT updated; error logged                                                                                                    |
| TC-014    | Socket.IO client disconnects mid-delivery                                                                                                                                                      | Server handles gracefully; rider marked as offline after 60s timeout; delivery reassignable                                                     |
| TC-015    | Review submitted by user who did NOT purchase the product                                                                                                                                      | Returns 403 (no verified purchase found for this product)                                                                                       |
| TC-016    | Admin initiates partial refund of ₹50 for a ₹200 order                                                                                                                                         | order.payment_status=partially_refunded; refund_amount=50; Razorpay refund API called with correct amount                                       |


---

# SECTION 22 — POSTMAN COLLECTION — COMPLETE SETUP GUIDE
## 22.1 Collection Folder Structure
- 00 — Health Check: GET /health → { status: 'ok', timestamp, version, db_status }

- 01 — Auth: Register, Login (Email), OTP Send, OTP Verify, Refresh Token, Logout, Forgot Password, Reset Password, Change Password

- 02 — User Profile: Get Profile, Update Profile, Upload Avatar, Get/Add/Update/Delete/Set-Default Addresses, Update FCM Token

- 03 — Categories (Public): List All, Get by Slug, Get Products by Category

- 04 — Products (Public): List (all filters), Featured, Best Sellers, New Arrivals, Search, Get by Slug, Get Related

- 05 — Cart: Get Cart, Add Item, Update Item Qty, Remove Item, Clear Cart, Validate Cart, Merge Guest Cart

- 06 — Orders (Customer): Place Order, Get Order List, Get Order Detail, Cancel Order, Reorder

- 07 — Payments: Create Payment Order, Verify Payment, Simulate Webhook (test only)

- 08 — Deliveries (Customer): Get Delivery + Rider Location

- 09 — Store Manager Auth: Login, Get Profile, Update Profile

- 10 — Vendor Products: List, Create, Get by ID, Update, Toggle, Update Stock, Delete, Bulk Upload CSV

- 11 — Store Orders: List, Get Detail, Accept, Reject, Mark Ready

- 12 — Store Earnings: Get Summary, Transaction List

- 13 — Rider Auth: Register (Docs), Get Profile, Update Profile

- 14 — Rider Operations: Toggle Availability, Update Location, Get Active Delivery, Accept/Reject/Pickup/Proof Delivery, SOS

- 15 — Rider Earnings: Get Summary, Request Payout

- 16 — Reviews: Get Product Reviews, Submit Review, Get My Reviews, Delete Review

- 17 — Wishlist: Get, Add, Remove, Check Status

- 18 — Coupons (Customer): Validate Coupon

- 19 — Notifications: Get List, Mark Read, Mark All Read, Delete

- 20 — Admin — Products: List (with pending), Get, Approve, Reject, Bulk Action

- 21 — Admin — Categories: List, Create, Update, Toggle, Delete, Reorder

- 22 — Admin — Orders: List All, Get Detail, Update Status, Initiate Refund

- 23 — Admin — Coupons: List, Get with Usage, Create, Update, Toggle, Delete

- 24 — Admin — Banners: List, Create, Update, Toggle, Delete, Reorder

- 25 — Admin — Reviews: List, Approve, Reject, Reply

- 26 — Admin — Users: List Customers, Get Detail, Toggle Account

- 27 — Admin — Stores: List All Stores, Create Store, Get Detail, Activate, Deactivate

- 28 — Admin — Riders: List, Get Detail, Approve, Reject, Assign to Delivery

- 29 — Admin — Analytics: Summary, Revenue Chart, Top Products, Orders by Status, Revenue by Category, Low Stock, New Customers, Failed Payments, Vendor Performance

- 30 — Admin — Deliveries: List, Get Live Active Deliveries, Assign Rider

- 31 — Admin — Notifications: Broadcast

- 32 — Admin — Settings: Get All, Bulk Update

- 33 — Uploads: Product Image, Banner Image, Category Image, Vendor Logo, Avatar, Rider Doc, Delete File

## 22.2 Postman Environment Variables
| **Variable**        | **Staging Value**                         | **Production Value**                | **Set By**       |
|---------------------|-------------------------------------------|-------------------------------------|------------------|
| base_url            | https://staging-api.dailyfresh.com/api/v1 | https://api.dailyfresh.com/api/v1   | Manual           |
| access_token        | (auto via login pre-request script)       | (auto via login pre-request script) | Auto             |
| refresh_token       | (auto via login pre-request script)       | (auto via login pre-request script) | Auto             |
| admin_token         | (auto via admin login script)             | (auto via admin login script)       | Auto             |
| store_manager_token | (auto via store manager login)            | (auto via store manager login)      | Auto             |
| rider_token         | (auto via rider login)                    | (auto via rider login)              | Auto             |
| test_user_email     | testcustomer@example.com                  | (real account)                      | Manual           |
| test_user_password  | Test@1234                                 | (real password)                     | Manual           |
| test_product_id     | (set from product list call)              | (set from product list call)        | Auto — Tests tab |
| test_order_id       | (set from place order call)               | (set from place order call)         | Auto — Tests tab |
| test_address_id     | (set from add address call)               | (set from add address call)         | Auto — Tests tab |
| test_store_id       | (set from store list)                     | (set from store list)               | Auto — Tests tab |
| test_rider_id       | (set from rider list)                     | (set from rider list)               | Auto — Tests tab |
| razorpay_order_id   | (set from create payment)                 | (set from create payment)           | Auto — Tests tab |
| test_delivery_id    | (set from delivery assign)                | (set from delivery assign)          | Auto — Tests tab |

## 22.3 Postman Pre-Request Script (Auto-Token)
> // Add to Login request 'Tests' tab:
>
> const res = pm.response.json();
>
> if (res.success) {
>
> pm.environment.set('access_token', res.data.access_token);
>
> pm.environment.set('refresh_token', res.data.refresh_token);
>
> }
>
> // Auto-refresh if 401:
>
> // Add to Collection pre-request script:
>
> if (pm.environment.get('access_token')) {
>
> pm.request.headers.add({
>
> key: 'Authorization',
>
> value: 'Bearer ' + pm.environment.get('access_token')
>
> });
>
> }


---

# SECTION 23 — ENVIRONMENT VARIABLES REFERENCE
## 23.1 Backend API — .env
> # ── SERVER ───────────────────────────────────────────────────
>
> NODE_ENV=production
>
> PORT=5000
>
> API_VERSION=v1
>
> # ── SUPABASE ─────────────────────────────────────────────────
>
> SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
>
> SUPABASE_ANON_KEY=eyJhbGci... # Public key — safe for client use
>
> SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # NEVER expose to frontend — full DB access
>
> # ── RAZORPAY ─────────────────────────────────────────────────
>
> RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX # rzp_test_XXX for test mode
>
> RAZORPAY_KEY_SECRET=your_key_secret
>
> RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
>
> RAZORPAY_MODE=live # test or live
>
> # ── FILE STORAGE (assets.dailyfresh.in) ─────────────────────
>
> ASSETS_BASE_URL=https://assets.dailyfresh.in
>
> ASSETS_UPLOAD_DIR=/var/www/assets.dailyfresh.in
>
> ASSETS_MAX_FILE_SIZE_MB=5
>
> # ── EMAIL (Resend) ───────────────────────────────────────────
>
> RESEND_API_KEY=re_xxxxxxxxxxxx
>
> EMAIL_FROM=orders@dailyfresh.com
>
> EMAIL_REPLY_TO=support@dailyfresh.com
>
> # ── SMS (MSG91) ──────────────────────────────────────────────
>
> MSG91_API_KEY=your_msg91_key
>
> MSG91_SENDER_ID=QCOMRC
>
> MSG91_TEMPLATE_ID=your_template_id
>
> # ── FIREBASE ADMIN (FCM) ─────────────────────────────────────
>
> FIREBASE_PROJECT_ID=your_project_id
>
> FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
>
> FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
>
> # ── REDIS ────────────────────────────────────────────────────
>
> REDIS_URL=rediss://default:password@endpoint.upstash.io:6380
>
> # ── GOOGLE MAPS ──────────────────────────────────────────────
>
> GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
>
> # ── CORS ─────────────────────────────────────────────────────
>
> ALLOWED_ORIGINS=https://dailyfresh.com,https://www.dailyfresh.com,https://admin.dailyfresh.com,exp://...
>
> # ── RATE LIMITING ────────────────────────────────────────────
>
> RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
>
> RATE_LIMIT_MAX=100
>
> AUTH_RATE_LIMIT_MAX=10
>
> # ── APP URLS ─────────────────────────────────────────────────
>
> FRONTEND_URL=https://dailyfresh.com
>
> ADMIN_URL=https://admin.dailyfresh.com
>
> # No return_url needed for React Native SDK (callback-based)

## 23.2 React Native Mobile Apps — app.config.js / .env
> API_URL=https://api.dailyfresh.com/api/v1
>
> SOCKET_URL=https://api.dailyfresh.com
>
> SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
>
> SUPABASE_ANON_KEY=eyJhbGci...
>
> RAZORPAY_MODE=live # test or live
>
> GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXX # Android key
>
> GOOGLE_MAPS_IOS_API_KEY=AIzaSyXXXXXXX # iOS key
>
> FIREBASE_PROJECT_ID=your_project_id
>
> FCM_SENDER_ID=000000000000
>
> EXPO_PROJECT_ID=xxxx-xxxx-xxxx # For EAS Build + push notifications
>
> APP_SCHEME=dailyfresh # Deep link URI scheme
>
> APP_ENV=production # development | staging | production

## 23.3 Admin Panel — .env (Next.js)
> NEXT_PUBLIC_API_URL=https://api.dailyfresh.com/api/v1
>
> NEXT_PUBLIC_SOCKET_URL=https://api.dailyfresh.com
>
> NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
>
> NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
>
> NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyXXXXXXX
>
> NEXT_PUBLIC_APP_ENV=production


---

# SECTION 24 — ERROR CODES & API STANDARDS
## 24.1 HTTP Status Codes
| **Code** | **Name**              | **When Used**                                                      |
|----------|-----------------------|--------------------------------------------------------------------|
| 200      | OK                    | Successful GET, PUT, PATCH, DELETE                                 |
| 201      | Created               | Successful POST that creates a new resource                        |
| 204      | No Content            | DELETE with no response body                                       |
| 400      | Bad Request           | Missing required fields, invalid data, business rule violation     |
| 401      | Unauthorized          | Missing or invalid/expired JWT token                               |
| 403      | Forbidden             | Valid token but insufficient role (e.g. customer on admin route)   |
| 404      | Not Found             | Resource does not exist or is soft-deleted                         |
| 409      | Conflict              | Duplicate resource (e.g. slug already exists, unique constraint)   |
| 422      | Unprocessable Entity  | Zod validation error — returns field-level errors array            |
| 429      | Too Many Requests     | Rate limit exceeded                                                |
| 500      | Internal Server Error | Unhandled exception — logged by Winston; generic message to client |

## 24.2 Application Error Codes
| **Error Code**               | **HTTP Status** | **Meaning**                                                            |
|------------------------------|-----------------|------------------------------------------------------------------------|
| UNAUTHORIZED                 | 401             | No token, invalid JWT, or expired JWT                                  |
| FORBIDDEN                    | 403             | Valid token but wrong role for this endpoint                           |
| NOT_FOUND                    | 404             | Resource doesn't exist or is soft-deleted                              |
| VALIDATION_ERROR             | 422             | Zod schema validation failure with field-level details[]             |
| DUPLICATE_ENTRY              | 409             | Unique constraint violation (slug, email, SKU, coupon code)            |
| INSUFFICIENT_STOCK           | 400             | Order quantity exceeds available stock_quantity                        |
| PRODUCT_INACTIVE             | 400             | Product is_active=false or is_deleted=true at time of add-to-cart      |
| STORE_INACTIVE               | 403             | Store is currently inactive — orders not accepted from this store      |
| RIDER_NOT_APPROVED           | 403             | Rider account not yet approved by Admin                                |
| COUPON_INVALID               | 400             | Coupon code does not exist or is_active=false                          |
| COUPON_EXPIRED               | 400             | Coupon past valid_until date                                           |
| COUPON_MAX_USED              | 400             | Coupon total max_total_uses exhausted                                  |
| COUPON_MIN_ORDER             | 400             | Cart total below coupon min_order_value                                |
| COUPON_USER_LIMIT            | 400             | User already used this coupon max_per_user times                       |
| ORDER_NOT_CANCELLABLE        | 400             | Order status is packed/shipped/delivered — cannot cancel               |
| PAYMENT_VERIFICATION_FAILED  | 400             | Razorpay payment signature verification failed or payment not captured |
| WEBHOOK_SIGNATURE_INVALID    | 400             | Razorpay webhook HMAC-SHA256 signature verification failed             |
| REVIEW_ALREADY_EXISTS        | 409             | User has already submitted a review for this product                   |
| REVIEW_NOT_VERIFIED_PURCHASE | 403             | User has not purchased this product — cannot review                    |
| RATE_LIMIT_EXCEEDED          | 429             | Too many requests from this IP address                                 |
| INTERNAL_ERROR               | 500             | Unhandled server error — check Winston logs                            |


---

# SECTION 25 — ASSUMPTIONS, RISKS & CHANGE CONTROL
## 25.1 Project Assumptions
63. All third-party accounts (Supabase, Razorpay, Firebase, Google Cloud Console, MSG91, Resend, VPS, domain registrar) are registered and accessible before project kickoff.

64. The client will provide all brand assets (logo PNG/SVG, brand colours HEX, app icons) within 3 business days of kick-off.

65. The client will provide initial product categories and sample product data (spreadsheet/CSV) before Phase 3 begins.

66. Client feedback at each milestone will be delivered within 48 business hours. Delays auto-extend timeline by equivalent period.

67. Razorpay merchant account will be fully KYC-verified with production API keys (Live Mode) available before Phase 5.

68. Client is responsible for Apple Developer Account (\$99/year) and Google Play Developer Account (\$25 one-time) for app submission.

69. Content for static pages (About Us, legal pages, policy text) is provided by the client. ArgosMob provides the page template.

70. The platform will support a single city/region for MVP launch. Multi-city expansion is a future scope item.

71. Client will make Razorpay Test Mode test mode available for QA phase.

72. GST rate, delivery charge structure, free delivery threshold, commission rates, and all business rules are agreed and signed off before backend development (Phase 2) begins.

## 25.2 Risk Register
| **ID** | **Risk Description**                                             | **Likelihood** | **Impact** | **Mitigation Strategy**                                                                                 |
|--------|------------------------------------------------------------------|----------------|------------|---------------------------------------------------------------------------------------------------------|
| R-01   | Razorpay merchant account not KYC-verified by Phase 2            | Medium         | High       | Use Razorpay Test Mode (rzp_test_XXX keys) throughout development; switch to Live keys before go-live   |
| R-02   | Client feedback delays at milestone reviews                      | High           | High       | Define 48hr SLA in contract; delays auto-extend timeline 1:1; PM escalation                             |
| R-03   | Scope creep — new features requested during development          | High           | Medium     | Strict CR process (see 25.3); no undocumented changes; PM logs all requests                             |
| R-04   | VPS underperformance under concurrent load                       | Low            | High       | PM2 cluster mode; Redis for shared state; upgrade VPS tier if needed; UptimeRobot                       |
| R-05   | React Native iOS build failures (signing/certificates)           | Medium         | Medium     | EAS Build; client provides Apple Developer Account with valid distribution certs by Phase 4 start       |
| R-06   | Razorpay webhook not received in production (firewall/network)   | Low            | High       | Ensure VPS port 443 open; test via Razorpay Dashboard → Webhooks → Test Webhook; verify SSL cert active |
| R-07   | Google Maps API billing/quota issues at scale                    | Low            | High       | Set billing alerts; restrict API key by domain/app; monitor usage dashboard                             |
| R-08   | Supabase free tier limits hit (500MB DB, 50k MAU)                | Medium         | Medium     | Monitor usage; upgrade to Supabase Pro (client cost) if limits approached                               |
| R-09   | Socket.IO scaling issues under load (multiple Node.js instances) | Low            | High       | Redis adapter for Socket.IO pub/sub across instances; load tested before go-live                        |
| R-10   | Key developer unavailability mid-project                         | Low            | High       | All code commented; standard MVC structure; handover procedure documented                               |

## 25.3 Change Request Process
73. Client or PM identifies a new requirement or scope change during development.

74. PM documents in writing (email or CR form): description, reason, priority.

75. Technical lead assesses: impact on timeline (days), impact on budget (INR), effort estimate.

76. Both parties sign off on the CR before any development begins on the change.

77. CR added as addendum to this SOW with revised delivery date for affected milestones.

78. Payment for CRs billed separately at agreed hourly rate or per-CR fixed price.


---

# SECTION 26 — COMMERCIAL TERMS & SIGN-OFF
## 26.1 Commercial Summary
|                             |  **Total Project Cost**      | INR 1,00,000 (One Lakh Rupees Only) — exclusive of GST and third-party API costs                                                                                |
| **Payment Structure**       | 40% on Project Kickoff (INR 40,000) | 30% on UI Completion (INR 30,000) | 20% on Beta Release (INR 20,000) | 10% on Final Deployment & Sign-off (INR 10,000) |
| **Post-Delivery Support**   | 30-day free bug-fix warranty (excludes new feature requests, third-party issues)                                                                                |
| **Intellectual Property**   | Full source code ownership transferred to Client upon receipt of final payment                                                                                  |
| **Confidentiality**         | Both parties maintain strict confidentiality of all project details; NDA terms apply                                                                            |
| **Change Requests**         | Any scope change post-approval quoted separately and requires written sign-off                                                                                  |
| **Limitation of Liability** | ArgosMob's total liability shall not exceed the total project fee paid by the client                                                                            |
| **Governing Law**           | This agreement shall be governed by the laws of India; jurisdiction: [City], India                                                                            |
| **Portfolio Usage**         | ArgosMob may reference project type and tech stack in portfolio (no client data disclosed)                                                                      |

## 26.2 Warranty & Post-Launch Support
- A 30-day warranty period is included from the date of go-live sign-off.

- During warranty: bugs caused by development errors fixed at no extra charge within 48 business hours of reporting.

- Excluded from warranty: issues caused by third-party services (Razorpay outages, Supabase downtime, VPS hosting issues), incorrect data entry by client, configuration changes made by client after go-live.

- After 30 days: ongoing support available under separate Annual Maintenance Contract (AMC). AMC pricing on request.

## 26.3 Approval & Sign-Off
By signing below, both parties confirm they have read, understood, and agreed to all terms, scope, deliverables, timelines, and conditions set out in this Statement of Work. This document constitutes the complete agreement between the parties.

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>For ArgosMob Tech &amp; AI Pvt Ltd</strong></p>
<p>Authorised Signatory</p>
<p>Signature: _______________________________</p>
<p>Name: ___________________________________</p>
<p>Date: ____________________________________</p></td>
<td><p><strong>For Client (Abir — Daily Fresh)</strong></p>
<p>Authorised Signatory</p>
<p>Signature: _______________________________</p>
<p>Name: ___________________________________</p>
<p>Date: ____________________________________</p></td>
</tr>
</tbody>
</table>

***— END OF DOCUMENT —***
