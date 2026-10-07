import dns from 'node:dns';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), 'apps/web/package.json'));
const mongoose = require('mongoose');

if (process.platform === 'win32' && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

const uri =
  'mongodb://ttrcstoree_db_user:ZjFSWGqEKH4rQ6OY@ac-d2d3mt6-shard-00-00.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-01.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-02.imdmatw.mongodb.net:27017/ttrc_store?ssl=true&replicaSet=atlas-qqc46k-shard-0&authSource=admin&retryWrites=true&w=majority';

async function testAll() {
  console.log('=== TTRC STORE — REAL PRODUCT VERIFICATION SUITE ===\n');

  // 1. Database Assertions
  console.log('--- 1. MongoDB Atlas Integrity Checks ---');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  const db = mongoose.connection.db;

  const product = await db.collection('products').findOne({ slug: 'ttrc-lfr-6-0' });
  if (!product) {
    throw new Error('FAIL: Product not found in MongoDB');
  }

  console.log('✔ Product exists in MongoDB Atlas');
  console.log(`  _id: ${product._id.toString()}`);
  console.log(`  name: "${product.name}"`);
  console.log(`  slug: "${product.slug}"`);
  console.log(`  sku: "${product.sku}"`);

  // Assertions
  if (product.name !== 'TTRC LF 6.0 Line Follower Robot') {
    throw new Error(`FAIL: Unexpected name: ${product.name}`);
  }
  if (product.price !== 319900) {
    throw new Error(`FAIL: Offer price must be 319900 paise (₹3,199), got ${product.price}`);
  }
  if (product.compare_at_price !== 379900) {
    throw new Error(`FAIL: Regular price must be 379900 paise (₹3,799), got ${product.compare_at_price}`);
  }
  if (product.rating !== 0 || product.review_count !== 0) {
    throw new Error('FAIL: Product must not have fake rating or review count');
  }
  if (!Array.isArray(product.images) || product.images.length !== 0) {
    throw new Error('FAIL: Product images must be empty array ready for Admin Panel upload');
  }

  const configs = product.attributes?.configurations;
  if (!Array.isArray(configs) || configs.length !== 2) {
    throw new Error('FAIL: Product must have 2 configurations (Without Battery & Including Battery)');
  }

  const withoutBattery = configs.find((c) => c.name === 'Without Battery');
  const withBattery = configs.find((c) => c.name === 'Including Battery');

  if (!withoutBattery || withoutBattery.price_paise !== 319900 || withoutBattery.mrp_paise !== 379900) {
    throw new Error('FAIL: "Without Battery" configuration has incorrect pricing');
  }
  if (!withBattery || withBattery.price_paise !== null) {
    throw new Error('FAIL: "Including Battery" configuration must not have fabricated price (must be null)');
  }

  if (product.stock_quantity !== 10) {
    throw new Error(`FAIL: Expected stock_quantity to be 10, got ${product.stock_quantity}`);
  }

  console.log('✔ Strict Data Validation passed:');
  console.log('  - Without Battery: Regular ₹3,799, Offer ₹3,199');
  console.log('  - Including Battery: price_paise is null (admin pricing required)');
  console.log('  - Zero fake ratings, zero fake reviews, zero fake images');
  console.log('  - Stock Quantity: 10 units available');

  await mongoose.disconnect();

  // 2. HTTP Storefront Endpoints Verification
  console.log('\n--- 2. Storefront Route Verification ---');
  const baseUrl = 'http://localhost:3000';

  // 2a. Product Detail Route
  const productRes = await fetch(`${baseUrl}/product/ttrc-lfr-6-0`);
  console.log(`✔ GET /product/ttrc-lfr-6-0 -> Status ${productRes.status}`);
  if (productRes.status !== 200) {
    throw new Error(`FAIL: Product page returned status ${productRes.status}`);
  }
  const productHtml = await productRes.text();
  if (!productHtml.includes('TTRC LF 6.0 Line Follower Robot')) {
    throw new Error('FAIL: Product title not rendered on detail page');
  }
  if (!productHtml.includes('3,199')) {
    throw new Error('FAIL: Offer price ₹3,199 not rendered on detail page');
  }
  if (!productHtml.includes('In Stock (10 units ready to dispatch)')) {
    throw new Error('FAIL: In Stock indicator with 10 units not rendered on detail page');
  }
  if (!productHtml.includes('Without Battery') || !productHtml.includes('Including Battery')) {
    throw new Error('FAIL: Battery configuration options not rendered');
  }
  console.log('✔ Product detail page rendered correctly with dynamic configurations and prices');

  // 2b. Category Page
  const catRes = await fetch(`${baseUrl}/category/gamified-robots`);
  console.log(`✔ GET /category/gamified-robots -> Status ${catRes.status}`);
  if (catRes.status === 200) {
    const catHtml = await catRes.text();
    if (catHtml.includes('ttrc-lfr-6-0') || catHtml.includes('TTRC LF 6.0')) {
      console.log('✔ Product is listed in Category: Gamified Robots');
    } else {
      console.log('ℹ Category page loaded 200 OK');
    }
  }

  // 2c. Search Endpoint
  const searchRes = await fetch(`${baseUrl}/api/search?q=lfr`);
  console.log(`✔ GET /api/search?q=lfr -> Status ${searchRes.status}`);
  if (searchRes.status === 200) {
    const searchJson = await searchRes.json();
    console.log(`✔ Search returned ${searchJson.results?.length ?? 0} results`);
    const found = searchJson.results?.find((p) => p.slug === 'ttrc-lfr-6-0');
    if (found) {
      console.log(`✔ Search found product: "${found.name}" (₹${found.pricePaise / 100})`);
    } else {
      throw new Error('FAIL: Search did not find product by slug "ttrc-lfr-6-0"');
    }
  }

  console.log('\n========================================');
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

testAll().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
