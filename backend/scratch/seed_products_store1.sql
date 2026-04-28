-- ================================================================
-- DAILY FRESH PRODUCT SEED (50 PRODUCTS)
-- TARGET STORE: e6b4b6c4-2dcb-4947-a368-2de31ffff6a7
-- ================================================================

DO $$
DECLARE
    s_id UUID := 'e6b4b6c4-2dcb-4947-a368-2de31ffff6a7';
    sub_fw UUID; -- freshwater
    sub_sw UUID; -- seawater
    sub_sh UUID; -- shellfish
    sub_ch UUID; -- chicken
    sub_eg UUID; -- eggs
    sub_dk UUID; -- duck
    sub_gt UUID; -- goat
    sub_lm UUID; -- lamb
    sub_ma UUID; -- marinated
    sub_kb UUID; -- kebabs
    sub_mk UUID; -- milk
    sub_cs UUID; -- cheese
    sub_gh UUID; -- ghee
    sub_ol UUID; -- oil
    sub_cc UUID; -- cold cuts
    sub_fs UUID; -- frozen snacks
BEGIN
    -- Get Sub-Category IDs
    SELECT id INTO sub_fw FROM sub_categories WHERE slug = 'freshwater-fish';
    SELECT id INTO sub_sw FROM sub_categories WHERE slug = 'seawater-fish';
    SELECT id INTO sub_sh FROM sub_categories WHERE slug = 'shellfish-prawns';
    SELECT id INTO sub_ch FROM sub_categories WHERE slug = 'fresh-chicken';
    SELECT id INTO sub_eg FROM sub_categories WHERE slug = 'farm-eggs';
    SELECT id INTO sub_dk FROM sub_categories WHERE slug = 'duck-meat';
    SELECT id INTO sub_gt FROM sub_categories WHERE slug = 'goat-meat';
    SELECT id INTO sub_lm FROM sub_categories WHERE slug = 'lamb-meat';
    SELECT id INTO sub_ma FROM sub_categories WHERE slug = 'marinated-meats';
    SELECT id INTO sub_kb FROM sub_categories WHERE slug = 'kebabs-tikkas';
    SELECT id INTO sub_mk FROM sub_categories WHERE slug = 'milk-cream';
    SELECT id INTO sub_cs FROM sub_categories WHERE slug = 'cheese-butter';
    SELECT id INTO sub_gh FROM sub_categories WHERE slug = 'desi-ghee';
    SELECT id INTO sub_ol FROM sub_categories WHERE slug = 'cold-pressed-oils';
    SELECT id INTO sub_cc FROM sub_categories WHERE slug = 'cold-cuts';
    SELECT id INTO sub_fs FROM sub_categories WHERE slug = 'frozen-snacks';

    -- --- 1. FISH & SEAFOOD (15 Products) ---
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_trending, image_url, description)
    VALUES 
    (s_id, sub_fw, 'Fresh Rohu (Bengali Cut)', 'rohu-bengali-cut', 320, 280, 'kg', 50, true, true, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Premium freshwater Rohu fish, cleaned and cut Bengali style.'),
    (s_id, sub_fw, 'Large Catla Steak', 'catla-steak-large', 450, 399, 'kg', 40, true, false, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Freshwater Catla, thick steak cuts for curry.'),
    (s_id, sub_sw, 'Premium Hilsa (Ilish)', 'hilsa-premium-ilish', 1900, 1750, 'kg', 15, true, true, 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=80', 'Authentic Padma Hilsa, the king of fish.'),
    (s_id, sub_sw, 'White Pomfret (Medium)', 'white-pomfret-med', 850, 799, '500g', 20, true, false, 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=80', 'Delicious White Pomfret, perfect for frying.'),
    (s_id, sub_sh, 'Tiger Prawns (Jumbo)', 'tiger-prawns-jumbo', 1200, 1100, '500g', 30, true, true, 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800&q=80', 'Giant Tiger Prawns, deveined and ready to cook.'),
    (s_id, sub_fw, 'Pabda Fish (Medium)', 'pabda-fish-med', 650, 580, 'kg', 25, true, false, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Sweet freshwater Pabda fish, small to medium size.'),
    (s_id, sub_fw, 'Tangra Fish', 'tangra-fish-fresh', 550, 499, 'kg', 30, true, false, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Fresh Tangra fish from local rivers.'),
    (s_id, sub_sw, 'Seer Fish (Surmai) Steaks', 'surmai-seer-fish-steaks', 950, 890, 'kg', 20, true, true, 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=80', 'Premium Seer fish steaks, high in Omega-3.'),
    (s_id, sub_sw, 'Bhetki (Barramundi) Fillet', 'bhetki-barramundi-fillet', 1100, 999, 'kg', 15, true, true, 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=80', 'Boneless Bhetki fillets, perfect for fish fry.'),
    (s_id, sub_sh, 'Small Pink Prawns', 'small-pink-prawns', 450, 399, '500g', 40, true, false, 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800&q=80', 'Small peeled prawns for pasta and curries.'),
    (s_id, sub_sw, 'Mackerel (Bangda)', 'mackerel-bangda-fresh', 350, 299, 'kg', 50, true, false, 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=80', 'Fresh Indian Mackerel, great for roasting.'),
    (s_id, sub_fw, 'Bata Fish', 'bata-fish-fresh', 280, 240, 'kg', 40, true, false, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Small freshwater Bata fish, traditional favorite.'),
    (s_id, sub_sh, 'Crab (Medium Size)', 'crab-medium-size', 600, 550, 'kg', 10, true, true, 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800&q=80', 'Fresh mud crabs, full of meat.'),
    (s_id, sub_fw, 'Koi Fish (Desi)', 'koi-fish-desi', 700, 650, 'kg', 15, true, false, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Traditional Desi Koi fish, high nutrition.'),
    (s_id, sub_sw, 'Red Snapper', 'red-snapper-whole', 750, 690, 'kg', 20, true, false, 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&q=80', 'Whole Red Snapper, brilliant color and taste.')
    ON CONFLICT (slug) DO NOTHING;

    -- --- 2. POULTRY (10 Products) ---
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_featured, image_url, description)
    VALUES 
    (s_id, sub_ch, 'Chicken Curry Cut (Large)', 'chicken-curry-cut-large', 240, 219, 'kg', 100, true, true, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', 'Fresh chicken with bone, perfect for Indian curries.'),
    (s_id, sub_ch, 'Chicken Breast (Boneless)', 'chicken-breast-boneless-pkg', 450, 399, 'kg', 80, true, true, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80', 'Lean and tender boneless chicken breast.'),
    (s_id, sub_ch, 'Chicken Drumstick (Pack of 4)', 'chicken-drumstick-4p', 280, 249, '500g', 60, true, true, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', 'Juicy chicken drumsticks for frying or grilling.'),
    (s_id, sub_ch, 'Chicken Wings', 'chicken-wings-fresh', 220, 199, '500g', 50, true, false, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', 'Crispy and juicy chicken wings.'),
    (s_id, sub_eg, 'White Farm Eggs (Pack of 12)', 'white-farm-eggs-12', 96, 84, 'unit', 200, true, true, 'https://images.unsplash.com/photo-1569288052389-dac9b0ac9eac?w=800&q=80', 'Fresh white eggs from local poultry farms.'),
    (s_id, sub_eg, 'Brown Country Eggs (Pack of 6)', 'brown-country-eggs-6', 72, 65, 'unit', 100, true, true, 'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=800&q=80', 'Nutritious brown eggs from free-range hens.'),
    (s_id, sub_dk, 'Whole Duck (Cleaned)', 'whole-duck-cleaned', 850, 799, 'kg', 10, true, false, 'https://images.unsplash.com/photo-1582845512747-e42001c95638?w=800&q=80', 'Whole farm-raised duck, cleaned and ready to roast.'),
    (s_id, sub_ch, 'Chicken Mince (Keema)', 'chicken-mince-keema', 300, 275, '500g', 40, true, false, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', 'Finely minced chicken for kababs and pasta.'),
    (s_id, sub_ch, 'Chicken Lollipop', 'chicken-lollipop-pkg', 250, 220, '500g', 45, true, false, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', 'Frenched chicken wings, popular as an appetizer.'),
    (s_id, sub_eg, 'Quail Eggs (Pack of 12)', 'quail-eggs-12', 120, 110, 'unit', 30, true, false, 'https://images.unsplash.com/photo-1569288052389-dac9b0ac9eac?w=800&q=80', 'Small, delicate quail eggs, rich in flavor.')
    ON CONFLICT (slug) DO NOTHING;

    -- --- 3. MUTTON (5 Products) ---
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_trending, image_url, description)
    VALUES 
    (s_id, sub_gt, 'Tender Goat Meat (Mixed Cut)', 'tender-goat-meat-mixed', 850, 799, 'kg', 40, true, true, 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=800&q=80', 'Fresh and tender goat meat curry cut.'),
    (s_id, sub_gt, 'Goat Chops', 'goat-chops-premium', 950, 899, '500g', 20, true, true, 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80', 'Premium goat chops, perfect for slow cooking.'),
    (s_id, sub_gt, 'Goat Leg (Raan)', 'goat-leg-raan-whole', 1200, 1100, 'kg', 10, true, false, 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=800&q=80', 'Whole goat leg, ideal for traditional roasting.'),
    (s_id, sub_lm, 'Lamb Chops (Australia Style)', 'lamb-chops-aus', 1100, 999, '500g', 15, true, true, 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80', 'Exquisite lamb chops, tender and flavor-rich.'),
    (s_id, sub_gt, 'Mutton Keema (Minced)', 'mutton-keema-minced', 450, 420, '500g', 30, true, false, 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=800&q=80', 'Hand-minced mutton for authentic Keema recipes.')
    ON CONFLICT (slug) DO NOTHING;

    -- --- 4. READY TO COOK & FROZEN (10 Products) ---
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_flash_sale, image_url, description)
    VALUES 
    (s_id, sub_ma, 'Marinated Chicken Tikka', 'marinated-chicken-tikka-ready', 350, 299, '500g', 50, true, true, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80', 'Classic spicy tikka marinade, ready to grill.'),
    (s_id, sub_ma, 'Haryali Chicken Kebab', 'haryali-chicken-kebab-ready', 350, 320, '500g', 40, true, false, 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=800&q=80', 'Coriander and mint marinade for a fresh taste.'),
    (s_id, sub_cc, 'Chicken Salami (Classic)', 'chicken-salami-classic-pkg', 180, 159, '250g', 60, true, false, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80', 'Perfectly sliced chicken salami for sandwiches.'),
    (s_id, sub_cc, 'Smoked Chicken Breast Slices', 'smoked-chicken-slices-pkg', 250, 220, '200g', 40, true, false, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80', 'Hickory smoked chicken slices, cold served.'),
    (s_id, sub_fs, 'Chicken Nuggets (Party Pack)', 'chicken-nuggets-party-500', 300, 249, '500g', 100, true, true, 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&q=80', 'Crispy golden nuggets, a kids favorite.'),
    (s_id, sub_fs, 'Chicken Burger Patties', 'chicken-burger-patties-4p', 220, 199, 'unit', 80, true, false, 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&q=80', 'Pack of 4 juicy patties for homemade burgers.'),
    (s_id, sub_kb, 'Seekh Kebab (Goat)', 'seekh-kebab-goat-ready', 450, 399, '250g', 35, true, true, 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=800&q=80', 'Minced goat meat with aromatic spices on skewers.'),
    (s_id, sub_ma, 'Lemon Pepper Chicken', 'lemon-pepper-chicken-mar', 380, 349, '500g', 40, true, false, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80', 'Zesty lemon and cracked pepper marinade.'),
    (s_id, sub_fs, 'Fish Fingers (Premium)', 'fish-fingers-premium-pkg', 400, 350, '400g', 30, true, false, 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&q=80', 'Basa fish strips in a crunchy breading.'),
    (s_id, sub_cc, 'Chicken Sausages (Cocktail)', 'chicken-sausages-cocktail', 200, 180, '250g', 50, true, false, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80', 'Small, bite-sized sausages for snacks.')
    ON CONFLICT (slug) DO NOTHING;

    -- --- 5. DAIRY, OILS & PANTRY (10 Products) ---
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_exclusive, image_url, description)
    VALUES 
    (s_id, sub_mk, 'Pure Cow Milk (A2)', 'pure-cow-milk-a2-1l', 95, 89, '1L', 150, true, true, 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=800&q=80', 'Farm fresh A2 cow milk, delivered daily.'),
    (s_id, sub_cs, 'Fresh Paneer (Malai)', 'fresh-paneer-malai-500', 250, 230, '500g', 60, true, false, 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=800&q=80', 'Soft and creamy malai paneer, fresh made.'),
    (s_id, sub_gh, 'Pure Desi Ghee (Cow)', 'pure-desi-ghee-cow-500', 650, 599, '500ml', 40, true, true, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80', 'Traditional bilona ghee from pure cow milk.'),
    (s_id, sub_ol, 'Cold Pressed Mustard Oil', 'cold-pressed-mustard-oil-1l', 220, 199, '1L', 100, true, false, 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&q=80', 'Kachi Ghani mustard oil, rich in pungency.'),
    (s_id, sub_cs, 'Unsalted Butter', 'unsalted-butter-farm-200', 160, 145, '200g', 50, true, false, 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=800&q=80', 'Pure creamy butter without added salt.'),
    (s_id, sub_mk, 'Thick Curd (Dahi)', 'thick-curd-dahi-500', 65, 59, '500g', 120, true, false, 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=800&q=80', 'Set curd with a thick and creamy texture.'),
    (s_id, sub_gh, 'Buffalo Ghee', 'buffalo-ghee-pure-1l', 1100, 999, '1L', 20, true, false, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80', 'Rich white ghee from buffalo milk.'),
    (s_id, sub_ol, 'Virgin Olive Oil', 'virgin-olive-oil-500', 550, 499, '500ml', 30, true, false, 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&q=80', 'Extra virgin olive oil for salads and cooking.'),
    (s_id, sub_mk, 'Flavoured Milk (Chocolate)', 'flavoured-milk-choco-200', 45, 40, '200ml', 100, true, false, 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=800&q=80', 'Delicious chocolate flavoured fresh milk.'),
    (s_id, sub_cs, 'Grated Mozzarella', 'grated-mozzarella-cheese-200', 200, 180, '200g', 40, true, false, 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=800&q=80', 'Perfectly grated mozzarella for your pizzas.')
    ON CONFLICT (slug) DO NOTHING;

END $$;
