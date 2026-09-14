import { db } from '../src/db/index.js';
import { stores, products } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔄 Checking stores and inventory across all locations...');
  const activeStores = await db.select().from(stores).where(eq(stores.isActive, true));
  console.log(`Found ${activeStores.length} active stores.`);

  const allProducts = await db.select().from(products);
  console.log(`Total existing product entries in DB: ${allProducts.length}`);

  // Distinct product definitions by name
  const uniqueProductsMap = new Map();
  for (const p of allProducts) {
    if (!uniqueProductsMap.has(p.name)) {
      uniqueProductsMap.set(p.name, p);
    }
  }
  const uniqueProducts = Array.from(uniqueProductsMap.values());
  console.log(`Found ${uniqueProducts.length} unique catalog product definitions.`);

  let insertedCount = 0;
  for (const store of activeStores) {
    const storeProducts = allProducts.filter(p => p.storeId === store.id);
    console.log(`Store: ${store.name} (${store.id}) currently has ${storeProducts.length} products.`);

    for (const master of uniqueProducts) {
      const alreadyHas = storeProducts.some(p => p.name === master.name);
      if (!alreadyHas) {
        const slug = `${master.slug}-${store.id.slice(0, 4)}`;
        await db.insert(products).values({
          storeId: store.id,
          subCategoryId: master.subCategoryId,
          name: master.name,
          slug,
          description: master.description,
          cookingGuide: master.cookingGuide,
          productHighlights: master.productHighlights,
          sku: `${master.sku || 'SKU'}-${store.id.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
          price: master.price,
          discountPrice: master.discountPrice,
          weightUnit: master.weightUnit,
          stockQuantity: master.stockQuantity || 25,
          expressStockQty: master.expressStockQty || 15,
          scheduledStockQty: master.scheduledStockQty || 10,
          deliveryOptions: master.deliveryOptions,
          isActive: true,
          isFeatured: master.isFeatured,
          isDeal: master.isDeal,
          isFlashSale: master.isFlashSale,
          isExclusive: master.isExclusive,
          isTrending: master.isTrending,
          isFrozen: master.isFrozen,
          isNewLaunch: master.isNewLaunch,
          cutOptions: master.cutOptions,
          cleaningOptions: master.cleaningOptions,
          images: master.images,
          imageUrl: master.imageUrl,
          metadata: master.metadata,
        });
        insertedCount++;
      }
    }
  }

  console.log(`✅ Successfully synced inventory: ${insertedCount} new store product links added.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error syncing inventory:', err);
  process.exit(1);
});
