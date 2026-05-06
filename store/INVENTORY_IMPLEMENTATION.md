# Inventory Management Module — Implementation Plan

This document outlines the implementation details for the **Inventory Management** module in the **Daily Fresh Store Manager App**. This module provides store managers with full control over their products, stock levels, and variants.

## 1. Module Overview
The Inventory module allows store managers to:
- View all products assigned to their store.
- Monitor stock levels and low-stock alerts.
- Toggle product availability (Active/Inactive).
- Add new products with image uploads.
- Edit existing product details and variants.
- Delete products (soft delete logic applied on backend).
- Export inventory data as CSV.

---

## 2. Backend API Reference

### Base URL: `/api/store`
All endpoints require a valid JWT token with the `store_manager` role.

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| **GET** | `/inventory` | List store products | `?search=fish&startDate=2024-01-01` |
| **POST** | `/inventory` | Create new product | `Multipart/form-data` (see below) |
| **PUT** | `/inventory/:id` | Update product | `Multipart/form-data` (see below) |
| **DELETE** | `/inventory/:id` | Delete product | N/A |
| **PATCH** | `/inventory/:id/stock` | Quick update stock | `{"quantity": 50}` |
| **PATCH** | `/inventory/:id/status` | Toggle product status | `{"is_active": true}` |
| **GET** | `/categories` | Get active categories | N/A |
| **GET** | `/sub-categories` | Get sub-categories | `?categoryId=UUID` |

### Sample JSON Request (Create/Update Product)
When creating or updating, the app sends `multipart/form-data` to handle image uploads. The fields are:

```json
{
  "name": "Fresh Rohu Fish",
  "description": "Daily catch from local river, cleaned and ready.",
  "price": 450,
  "discount_price": 399,
  "stock_quantity": 25,
  "sku": "ROHU-001",
  "sub_category_id": "sub-cat-uuid",
  "weight_unit": "500g",
  "cooking_guide": "Ideal for curry or fry.",
  "is_active": true,
  "delivery_options": ["morning", "afternoon"],
  "variants": [
    {
      "name": "Medium Cut",
      "price": 450,
      "weight_text": "500g"
    }
  ],
  "image": [File Binary]
}
```

---

## 3. Frontend Implementation (Store App)

### Screen: `InventoryListScreen.js`
This is the primary container for the inventory module.

#### A. State Management
- **`products`**: Array of products fetched from the API.
- **`filteredProducts`**: Filtered results based on search/tabs.
- **`modalVisible`**: Controls the visibility of the Add/Edit Modal.
- **`formData`**: Holds the current state of the product being created/edited.

#### B. CRUD Workflow
1. **List**: `fetchInventory()` calls `GET /inventory` on mount and refresh.
2. **Search**: Client-side filtering on the `products` array for instant feedback.
3. **Toggle Status**: Calls `PATCH /inventory/:id/status` via a `Switch` component.
4. **Delete**: Calls `DELETE /inventory/:id` with a confirmation alert.
5. **Add/Edit**:
   - Opens a multi-tab Modal (`Basics`, `Pricing`, `Variants`, `Info`, `Media`).
   - Uses `react-native-image-picker` for gallery uploads.
   - Submits `FormData` to the backend to support binary image files.

---

## 4. Key UI Components

### 1. `InventoryItem.js`
A specialized list item component that displays:
- Product thumbnail.
- Name, Price, and SKU.
- Stock level badge (Red for low stock).
- Action buttons (Edit, Delete, Status Toggle).

### 2. Multi-Tab Form Modal
To handle the complex product schema, the form is split into tabs:
- **Basics**: Name, Category, Sub-category, Description.
- **Price & Stock**: Base price, Discount price, Stock qty, Weight unit.
- **Variants**: Dynamic list where managers can add/remove product variations.
- **Guide & Flags**: Cooking instructions and marketing flags (Featured, Trending).
- **Media**: Image upload and preview.

---

## 5. Data Validation Rules
Before saving, the following checks are performed in `handleSave`:
- `name`: Required.
- `price`: Required, must be numeric.
- `sub_category_id`: Required.
- `stock_quantity`: Must be a non-negative integer.

---

## 6. Implementation Checklist
- [x] Backend routes defined in `storeRoutes.js`.
- [x] Controller logic implemented in `storeController.js`.
- [x] API service integration in `storeApi.js`.
- [x] `InventoryListScreen.js` UI and logic.
- [x] `InventoryItem.js` component.
- [x] Image upload middleware (Multer) configured.
- [x] CSV Export functionality.
- [ ] Dedicated Detail View (Optional - currently handled by Edit Modal).
