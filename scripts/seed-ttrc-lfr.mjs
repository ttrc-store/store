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

async function seed() {
  console.log('[Seed] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  const db = mongoose.connection.db;

  // 1. Verify Category exists
  const category = await db.collection('categories').findOne({ slug: 'gamified-robots' });
  if (!category) {
    throw new Error('Category "gamified-robots" not found in database.');
  }
  console.log(`[Seed] Found Category: "${category.name}" (ID: ${category._id.toString()})`);

  // 2. Prepare real product document from https://www.tamizhtech.in/products/competition/ttrc-lf-6-0
  const productData = {
    name: 'TTRC LF 6.0 Line Follower Robot',
    slug: 'ttrc-lfr-6-0',
    sku: 'TTRC-LF-6.0',
    product_type: 'kit',
    unit: 'Piece',
    status: 'published',
    price: 319900, // ₹3,199 offer price in integer paise
    compare_at_price: 379900, // ₹3,799 regular price in integer paise
    category_id: category._id.toString(),
    brand: 'Tamizh Tech',
    show_manufacturer_publicly: true,
    show_supplier_publicly: false,
    short_description:
      'High-performance competition line follower robot platform powered by TTRC Carrier Board, Arduino Nano, dedicated motor driver, and 7-array optical sensor.',
    description:
      'TTRC LF 6.0 Line Follower Robot is designed and manufactured for national and state-level robotics competitions. Built around the proprietary TTRC Carrier Board with an Arduino Nano core, dedicated high-speed motor driver, 7-array optical line sensor, and N20 geared motors on a custom chassis, it delivers superior tracking accuracy, cornering stability, and rapid response times. Supplied in competition-ready assembly with comprehensive hardware support.',
    technical_specs: [
      { key: 'Controller Core', value: 'Arduino Nano' },
      { key: 'Carrier Board', value: 'TTRC Carrier Board' },
      { key: 'Motor Driver', value: 'Dedicated High-Speed Dual Motor Driver' },
      { key: 'Sensor System', value: '7-Array Optical Line Sensor' },
      { key: 'Drive Motors', value: 'N20 Geared Motors' },
      { key: 'Chassis Type', value: 'Custom Competition Chassis' },
      { key: 'Wheel Type', value: 'High-Traction Wheels with Couplers' },
    ],
    applications: [
      'Robotics Competitions & Line Follower Challenges',
      'Engineering Symposiums & Technical Festivals',
      'Autonomous Navigation & Embedded Systems Prototyping',
      'STEM & Robotics Lab Education',
    ],
    // Battery configuration variant structure
    attributes: {
      configurations: [
        {
          name: 'Without Battery',
          price_paise: 319900,
          mrp_paise: 379900,
          is_default: true,
          is_available: true,
          description: 'Supplied without battery. Standard competition package.',
        },
        {
          name: 'Including Battery',
          price_paise: null, // Left null - not fabricated. Editable from Admin Panel before customer purchase.
          mrp_paise: null,
          is_default: false,
          is_available: false,
          description: 'Battery-included configuration requiring store administrator pricing prior to online purchase.',
        },
      ],
    },
    // Genuine zero stock until admin adjusts inventory via Admin Panel
    stock_quantity: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    // Zero fake ratings and zero fake reviews
    rating: 0,
    review_count: 0,
    // Strictly empty images array for manual upload via Admin Panel
    images: [],
    media: [],
    bulk_price_tiers: [],
    gst_percent: 18,
    hsn_code: '8542',
    country_of_origin: 'India',
    weight_grams: 250,
    meta_title: 'TTRC LF 6.0 Line Follower Robot | TTRC',
    meta_description:
      'Competition-oriented TTRC LF 6.0 line follower robot platform featuring Arduino Nano, TTRC carrier board, 7-array sensor, and N20 gear motors. Designed and manufactured in India.',
    updated_at: new Date(),
  };

  // 3. Upsert product idempotently (by slug)
  const existing = await db.collection('products').findOne({ slug: productData.slug });
  let resultId;

  if (existing) {
    console.log(`[Seed] Product with slug "${productData.slug}" already exists (ID: ${existing._id.toString()}). Updating...`);
    await db.collection('products').updateOne(
      { slug: productData.slug },
      {
        $set: {
          ...productData,
          // Preserve existing images or stock if admin has already updated them
          images: existing.images && existing.images.length > 0 ? existing.images : productData.images,
          media: existing.media && existing.media.length > 0 ? existing.media : productData.media,
          stock_quantity: existing.stock_quantity ?? productData.stock_quantity,
        },
      }
    );
    resultId = existing._id.toString();
  } else {
    productData.created_at = new Date();
    const insertRes = await db.collection('products').insertOne(productData);
    resultId = insertRes.insertedId.toString();
    console.log(`[Seed] Successfully inserted new product (ID: ${resultId})`);
  }

  // 4. Verify the record in MongoDB
  const verified = await db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(resultId) });
  console.log('\n=== INSERTION VERIFICATION ===');
  console.log('MongoDB Product ID:', verified._id.toString());
  console.log('Product Name:', verified.name);
  console.log('Slug:', verified.slug);
  console.log('SKU:', verified.sku);
  console.log('Category ID:', verified.category_id);
  console.log('Regular Price (paise):', verified.compare_at_price, `(₹${verified.compare_at_price / 100})`);
  console.log('Offer Price (paise):', verified.price, `(₹${verified.price / 100})`);
  console.log('Stock Quantity:', verified.stock_quantity);
  console.log('Images Array:', JSON.stringify(verified.images));
  console.log('Configurations:', JSON.stringify(verified.attributes?.configurations, null, 2));

  await mongoose.disconnect();
  console.log('\n[Seed] Complete & disconnected.');
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
