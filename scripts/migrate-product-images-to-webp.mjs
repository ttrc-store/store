import dns from 'node:dns';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { getMongoUri } from './get-db-uri.mjs';

const require = createRequire(path.resolve(process.cwd(), 'apps/web/package.json'));
const mongoose = require('mongoose');
const sharp = require('sharp');

if (process.platform === 'win32' && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

const isDryRun = !process.argv.includes('--execute');
const isRollback = process.argv.includes('--rollback');
const rollbackFileArg = process.argv.find((a) => a.startsWith('--rollback-file='));

console.log('='.repeat(70));
console.log('TTRC STORE — Product Images WebP Audit & Migration Tool');
console.log(`Mode: ${isRollback ? 'ROLLBACK' : isDryRun ? 'DRY-RUN (Safe inspection only, zero DB writes)' : 'LIVE EXECUTION (--execute)'}`);
console.log('='.repeat(70));

const uri = getMongoUri();

const MediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    width: { type: Number },
    height: { type: Number },
    original_format: { type: String },
    original_size: { type: Number },
    is_lossless: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    images: [String],
    media: [
      {
        url: String,
        storage_path: String,
        alt_text: String,
        is_primary: Boolean,
        sort_order: Number,
        type: { type: String, default: 'image' },
      },
    ],
  },
  { timestamps: true }
);

const MediaModel = mongoose.models.Media || mongoose.model('Media', MediaSchema);
const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log('[MongoDB Atlas] Connected successfully.\n');

    if (isRollback) {
      if (!rollbackFileArg) {
        throw new Error('Please specify rollback file: --rollback-file=scripts/migration-rollback-XXXXX.json');
      }
      const filepath = rollbackFileArg.split('=')[1];
      const rollbackData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      console.log(`Executing rollback from ${filepath}...`);
      for (const item of rollbackData.products || []) {
        await ProductModel.updateOne(
          { _id: item.productId },
          { $set: { images: item.originalImages } }
        );
        console.log(`  Rolled back product "${item.productSlug}" to original images.`);
      }
      for (const item of rollbackData.mediaCreated || []) {
        await MediaModel.deleteOne({ filename: item.filename });
        console.log(`  Removed migrated media document: ${item.filename}`);
      }
      console.log('\nRollback complete.');
      process.exit(0);
    }

    const products = await ProductModel.find({}).lean();
    const mediaDocs = await MediaModel.find({}).lean();
    console.log(`Discovered: ${products.length} Products and ${mediaDocs.length} Media Storage documents.\n`);

    const report = {
      totalImagesInspected: 0,
      alreadyStoredAsWebP: 0,
      usingOtherFormats: 0,
      canBeConvertedSafely: 0,
      corruptedOrUnsupported: 0,
      unresolvableUrls: 0,
      convertedDetails: [],
    };

    const rollbackRecords = {
      timestamp: new Date().toISOString(),
      products: [],
      mediaCreated: [],
    };

    // Track a map of old filename/url to new WebP URL
    const replacementMap = new Map();

    // Map of original filenames that have already been converted to WebP
    const webpDocs = mediaDocs.filter((d) => d.mime_type === 'image/webp' || d.filename.toLowerCase().endsWith('.webp'));
    const alreadyMigratedOriginals = new Map();
    for (const wd of webpDocs) {
      if (wd.migrated_from) {
        alreadyMigratedOriginals.set(wd.migrated_from, wd.filename);
      }
    }

    // 1. Audit & Convert Media Storage Documents first
    console.log('--- Phase 1: Media Storage Documents Audit ---');
    for (const doc of mediaDocs) {
      report.totalImagesInspected++;
      const isWebp = doc.mime_type === 'image/webp' || doc.filename.toLowerCase().endsWith('.webp');

      if (isWebp) {
        report.alreadyStoredAsWebP++;
        console.log(`[Media] ${doc.filename}: ALREADY WEBP (${doc.mime_type})`);
        continue;
      }

      if (alreadyMigratedOriginals.has(doc.filename)) {
        const existingWebp = alreadyMigratedOriginals.get(doc.filename);
        report.alreadyStoredAsWebP++;
        replacementMap.set(doc.filename, `/api/media/${existingWebp}`);
        replacementMap.set(`/api/media/${doc.filename}`, `/api/media/${existingWebp}`);
        replacementMap.set(`/uploads/products/${doc.filename}`, `/api/media/${existingWebp}`);
        console.log(`[Media] ${doc.filename}: ALREADY CONVERTED -> ${existingWebp} (Idempotent skip)`);
        continue;
      }

      report.usingOtherFormats++;
      console.log(`[Media] ${doc.filename}: Non-WebP format detected (${doc.mime_type}, ${(doc.size / 1024).toFixed(1)} KB)`);

      let rawBuffer = null;
      if (Buffer.isBuffer(doc.data)) {
        rawBuffer = doc.data;
      } else if (doc.data && doc.data.buffer) {
        rawBuffer = Buffer.from(doc.data.buffer);
      } else if (doc.data && typeof doc.data.value === 'function') {
        rawBuffer = Buffer.from(doc.data.value(true));
      }

      if (!rawBuffer) {
        report.unresolvableUrls++;
        console.log(`  -> FAILED: No binary buffer found in document.`);
        continue;
      }

      try {
        const meta = await sharp(rawBuffer, { animated: true }).metadata();
        const isAnimated = Boolean(meta.pages && meta.pages > 1);

        let pipeline = sharp(rawBuffer, { animated: isAnimated }).rotate();
        if (meta.space === 'cmyk') {
          pipeline = pipeline.toColorspace('srgb');
        }

        const webpBuffer = await pipeline
          .webp({
            lossless: true,
            effort: 4,
            smartSubsample: false,
            alphaQuality: 100,
          })
          .toBuffer();

        const verifyMeta = await sharp(webpBuffer, { animated: isAnimated }).metadata();
        if (verifyMeta.format !== 'webp') {
          throw new Error(`Output was not WebP (got ${verifyMeta.format})`);
        }

        report.canBeConvertedSafely++;
        const originalWidth = meta.width;
        const originalHeight = meta.pageHeight || meta.height;
        const convertedWidth = verifyMeta.width;
        const convertedHeight = verifyMeta.pageHeight || verifyMeta.height;

        console.log(`  -> CONVERTIBLE SAFELY:`);
        console.log(`     Original:  ${originalWidth}x${originalHeight} (${meta.format}, ${(rawBuffer.length / 1024).toFixed(1)} KB)`);
        console.log(`     Converted: ${convertedWidth}x${convertedHeight} (webp lossless, ${(webpBuffer.length / 1024).toFixed(1)} KB)`);
        console.log(`     Dimension Match: ${originalWidth === convertedWidth && originalHeight === convertedHeight ? 'YES (100% Preserved)' : 'NO'}`);

        const safeHash = crypto.randomBytes(8).toString('hex');
        const newFilename = `ttrc-prd-${Date.now()}-${safeHash}.webp`;
        const newUrl = `/api/media/${newFilename}`;

        report.convertedDetails.push({
          sourceDocId: doc._id.toString(),
          originalFilename: doc.filename,
          originalName: doc.original_name,
          originalFormat: meta.format,
          originalSize: rawBuffer.length,
          convertedFilename: newFilename,
          convertedSize: webpBuffer.length,
          width: convertedWidth,
          height: convertedHeight,
          isLossless: true,
        });

        replacementMap.set(doc.filename, newUrl);
        replacementMap.set(`/api/media/${doc.filename}`, newUrl);
        replacementMap.set(`/uploads/products/${doc.filename}`, newUrl);

        if (!isDryRun) {
          await MediaModel.create({
            filename: newFilename,
            original_name: doc.original_name || doc.filename,
            mime_type: 'image/webp',
            size: webpBuffer.length,
            data: webpBuffer,
            width: convertedWidth,
            height: convertedHeight,
            original_format: meta.format,
            original_size: rawBuffer.length,
            is_lossless: true,
            migrated_from: doc.filename,
          });

          rollbackRecords.mediaCreated.push({
            filename: newFilename,
            originalFilename: doc.filename,
          });
          console.log(`  -> STORED: Created WebP media document "${newFilename}" in MongoDB Atlas.`);
        }
      } catch (err) {
        report.corruptedOrUnsupported++;
        console.log(`  -> FAILED: Corrupted or unsupported (${err.message})`);
      }
    }

    // 2. Audit & Update Product Records
    console.log('\n--- Phase 2: Product Image Catalog Audit ---');
    for (const prd of products) {
      const images = prd.images || [];
      const updatedImages = [...images];
      let productModified = false;

      for (let i = 0; i < images.length; i++) {
        const imgUrl = images[i];
        if (!imgUrl) continue;

        if (replacementMap.has(imgUrl)) {
          updatedImages[i] = replacementMap.get(imgUrl);
          productModified = true;
          console.log(`[Product "${prd.slug}"] Image #${i + 1} updated to WebP: ${updatedImages[i]}`);
        } else if (!imgUrl.toLowerCase().endsWith('.webp')) {
          console.log(`[Product "${prd.slug}"] Image #${i + 1} uses non-WebP URL: ${imgUrl}`);
        }
      }

      if (!isDryRun && productModified) {
        rollbackRecords.products.push({
          productId: prd._id,
          productSlug: prd.slug,
          originalImages: images,
          migratedImages: updatedImages,
        });

        await ProductModel.updateOne(
          { _id: prd._id },
          { $set: { images: updatedImages } }
        );
        console.log(`[Product "${prd.slug}"] Successfully updated in MongoDB Atlas.`);
      }
    }

    if (!isDryRun && (rollbackRecords.products.length > 0 || rollbackRecords.mediaCreated.length > 0)) {
      const rollbackFilename = `scripts/migration-rollback-${Date.now()}.json`;
      fs.writeFileSync(rollbackFilename, JSON.stringify(rollbackRecords, null, 2));
      console.log(`\n[Rollback File Created] ${rollbackFilename}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('TTRC STORE PRODUCT IMAGES AUDIT & MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`1. Total product images inspected:       ${report.totalImagesInspected}`);
    console.log(`2. Number already stored as WebP:        ${report.alreadyStoredAsWebP}`);
    console.log(`3. Number using other formats:           ${report.usingOtherFormats}`);
    console.log(`4. Images that can be converted safely:  ${report.canBeConvertedSafely}`);
    console.log(`5. Images corrupted or unsupported:      ${report.corruptedOrUnsupported}`);
    console.log(`6. Images with unresolvable storage:     ${report.unresolvableUrls}`);
    console.log('='.repeat(70));

    if (isDryRun) {
      console.log('\n[DRY RUN COMPLETE] Zero modifications made to MongoDB Atlas.');
      console.log('To execute live conversion and update storage, run:');
      console.log('  node scripts/migrate-product-images-to-webp.mjs --execute\n');
    } else {
      console.log(`\n[LIVE MIGRATION COMPLETE] Safely converted ${report.canBeConvertedSafely} images to lossless WebP.\n`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
