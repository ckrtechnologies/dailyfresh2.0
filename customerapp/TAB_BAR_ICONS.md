# Navigation Tab Bar Icons

This document lists the `MaterialCommunityIcons` used for the Bottom Tab Bar after the removal of Lottie animations.

| Tab Name | Active Icon (Focused) | Inactive Icon |
| :--- | :--- | :--- |
| **Home** | `home` | `home-outline` |
| **Favorites** | `heart` | `heart-outline` |
| **Categories** | `view-grid` | `view-grid-outline` |
| **Cart** | `cart` | `cart-outline` |
| **Account** | `account` | `account-outline` |

---

### Implementation Details

The icons are managed via a central `ICON_MAP` in `RootNavigator.js`:

```javascript
const ICON_MAP = {
  Home: { active: 'home', inactive: 'home-outline' },
  Favorites: { active: 'heart', inactive: 'heart-outline' },
  Categories: { active: 'view-grid', inactive: 'view-grid-outline' },
  Cart: { active: 'cart', inactive: 'cart-outline' },
  Account: { active: 'account', inactive: 'account-outline' }
};
```

These icons are rendered using the `react-native-vector-icons/MaterialCommunityIcons` package.
