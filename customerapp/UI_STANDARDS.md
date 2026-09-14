# DailyFresh Kolkata - Mobile UI Design Standards

This document specifies the unified design and geometry standards for all product cards, grids, and UI components across the DailyFresh mobile app. All future UI components and screens must strictly comply with these rules.

---

## 1. Product Card Geometrical Standard (`PRODUCT_CARD_STANDARDS`)

All product cards (horizontal strips, 2-column grids, search listings, and favorites) must adhere to the following strict slot-based invariant structure:

```
+---------------------------------------------------+
|  [Image Container]                      120px     |
|  - Aspect Ratio: Fixed Height 120px               |
|  - Corner Radius: 16px (RADIUS.card)              |
|  - Badges:                                        |
|      * Discount (% OFF): Top-Left Pill            |
|      * Favorite Heart: Top-Right Circular Button   |
+---------------------------------------------------+
|  [Slot 1: Weight / Unit]                16px      |
|  - Font: 11px, Line Height: 16px, TextLight       |
+---------------------------------------------------+
|  [Slot 2: Product Name]                 36px      |
|  - Font: 13px, Line Height: 18px, Weight: 600     |
|  - Exactly 2 lines capacity (numberOfLines={2})   |
+---------------------------------------------------+
|  [Slot 3: Delivery Options Row]         24px      |
|  - Height: Fixed 24px (never collapses)           |
|  - Scooter Icon + Delivery Badge (Express/Tomorrow)|
|  - Invariant: If no badge, reserves 24px space   |
+---------------------------------------------------+
|  [Slot 4: Price & Discount Row]         24px      |
|  - Height: Fixed 24px                             |
|  - Effective Price: 15px, Bold (700)              |
|  - Original Price (if discounted): 12px Strikethru|
|  - Invariant: Price row is ALWAYS rendered        |
|    (never hidden on items with variants)          |
+---------------------------------------------------+
|  [Slot 5: Action Button Footer]         34px      |
|  - Height: Fixed 34px                             |
|  - Border Radius: 17px (Pill button)              |
|  - Pinned to bottom via justifyContent: space-btwn|
|  - States:                                        |
|      1. "ADD TO CART" (Theme Primary)             |
|      2. Quantity Stepper [-  1  +]                |
|      3. "OUT OF STOCK" (Disabled Gray)            |
|      4. "SERVICE UNAVAILABLE" (Disabled Gray)     |
+---------------------------------------------------+
```

### Exact Dimension Tokens (`src/shared/theme/standards.js`):
| Token Key | Dimension | Usage |
| :--- | :--- | :--- |
| `HORIZONTAL_WIDTH` | `160px` | Fixed width for horizontal carousel cards |
| `HORIZONTAL_HEIGHT` | `295px` | Fixed height for horizontal carousel cards |
| `IMAGE_HEIGHT` | `120px` | Standard image height for small/standard cards |
| `INFO_PADDING` | `8px` | Uniform padding around card body content |
| `UNIT_HEIGHT` | `16px` | Single-line weight/unit badge slot |
| `NAME_HEIGHT` | `36px` | 2-line guaranteed title slot (line-height 18px) |
| `DELIVERY_ROW_HEIGHT` | `24px` | Delivery scooter + speed badge row |
| `PRICE_ROW_HEIGHT` | `24px` | Selling price and strikethrough compare price |
| `FOOTER_HEIGHT` | `34px` | Action button / quantity stepper height |

---

## 2. 2-Column Product Grid Standards (`GRID_STANDARDS`)

When rendering product lists in category screens (`ProductListScreen`, `ProductListingScreen`), Wishlist (`FavoritesScreen`), or Search (`SearchScreen`):

1. **Column Wrapper Rules**:
   - `numColumns={2}`
   - `columnWrapperStyle`:
     ```javascript
     {
       justifyContent: 'space-between',
       alignItems: 'stretch', // REQUIRED: Forces equal height in every row
     }
     ```
2. **Item Wrapper Rules**:
   - Each item must be wrapped in a container with:
     ```javascript
     {
       width: '50%',
       padding: 6,
       display: 'flex',
     }
     ```
3. **Card Container Rules**:
   - Inside the grid wrapper, `ProductCard` has `flex: 1, height: '100%'`.
   - `info` has `flex: 1, justifyContent: 'space-between'`.
   - Result: All cards in any row have **identical height**, and all action buttons align to the **exact same baseline**.

---

## 3. Horizontal Carousel Standards

When rendering product strips on the Home screen (`ProductSection.js`):
- Width: `160px`
- Height: `295px`
- `marginRight: 16px`
- `contentContainerStyle`: `paddingLeft: 20px, paddingRight: 8px`
- Zero layout shift when scrolling horizontally.

---

## 4. Variant Pricing Standard

- **Rule**: A product card must **NEVER** hide its price row, even if the product has multiple variants or cut/cleaning options.
- **Selling Price Hierarchy**:
  1. `product.discount_price ?? product.discountPrice` (if defined)
  2. `product.price` (if defined)
  3. `min(variants.map(v => v.discount_price ?? v.price))` (lowest variant price)
  4. Fallback: `0`
- If product has variants or customization, tapping `ADD TO CART` opens the customization modal or navigates to `ProductDetail` to let the user select their preferred variant/cut.
