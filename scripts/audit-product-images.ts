import { connectToDatabase } from '../apps/web/src/lib/mongodb/client';
import { ProductModel, MediaModel } from '../apps/web/src/lib/mongodb/models';
import sharp from 'sharp';

export interface ImageAuditReportItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  isMediaEndpoint: boolean;
  format?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  aspectRatioNumeric?: number;
  aspectRatioClassification: '16:9' | 'Square (1:1)' | '4:3' | 'Other Landscape' | 'Portrait' | 'Unknown';
  isStandardResolution: boolean; // >= 1920x1080 or 2560x1440
  isLosslessWebP: boolean;
  status: 'OPTIMAL' | 'REQUIRES_RECOMPOSITION' | 'EXTERNAL_OR_LEGACY' | 'BROKEN';
  recommendation: string;
}

export async function auditCatalogImages(): Promise<{
  totalProducts: number;
  totalImages: number;
  optimalCount: number;
  requiresFitCount: number;
  legacyCount: number;
  brokenCount: number;
  items: ImageAuditReportItem[];
}> {
  await connectToDatabase();
  const products = await ProductModel.find({}).lean();

  const reportItems: ImageAuditReportItem[] = [];

  for (const product of products) {
    const images: string[] = product.images || [];

    for (const url of images) {
      const isMedia = url.startsWith('/api/media/') || url.startsWith('/uploads/');
      let item: ImageAuditReportItem = {
        productId: product._id.toString(),
        productName: product.name,
        productSlug: product.slug,
        imageUrl: url,
        isMediaEndpoint: isMedia,
        aspectRatioClassification: 'Unknown',
        isStandardResolution: false,
        isLosslessWebP: false,
        status: 'EXTERNAL_OR_LEGACY',
        recommendation: 'Audit image format and source.',
      };

      if (isMedia) {
        const filename = url.split('/').pop();
        const mediaDoc = await MediaModel.findOne({ filename }).lean();

        if (mediaDoc) {
          try {
            let w = mediaDoc.width || 0;
            let h = mediaDoc.height || 0;
            let format = mediaDoc.mime_type || 'image/webp';

            if ((!w || !h) && mediaDoc.data) {
              const buf = Buffer.isBuffer(mediaDoc.data)
                ? mediaDoc.data
                : Buffer.from((mediaDoc.data as any).buffer || mediaDoc.data);
              const meta = await sharp(buf).metadata();
              w = meta.width || 0;
              h = meta.height || 0;
              format = meta.format || format;
            }
            const size = mediaDoc.size || (mediaDoc.data ? mediaDoc.data.length : 0);
            const ratio = h > 0 ? w / h : 1;

            let classification: ImageAuditReportItem['aspectRatioClassification'] = 'Other Landscape';
            if (Math.abs(ratio - 16 / 9) < 0.08) {
              classification = '16:9';
            } else if (Math.abs(ratio - 1) < 0.05) {
              classification = 'Square (1:1)';
            } else if (Math.abs(ratio - 4 / 3) < 0.05) {
              classification = '4:3';
            } else if (ratio < 0.95) {
              classification = 'Portrait';
            }

            const isStandardRes = w >= 1920 && h >= 1080;
            const isLossless = Boolean(mediaDoc.is_lossless || format === 'webp' || format === 'image/webp');

            let status: ImageAuditReportItem['status'] = 'OPTIMAL';
            let recommendation = 'Image is optimal.';

            if (classification === '16:9' && isLossless) {
              status = 'OPTIMAL';
              recommendation = 'Matches 16:9 standard canvas in lossless WebP.';
            } else if (isLossless && classification !== '16:9') {
              status = 'REQUIRES_RECOMPOSITION';
              recommendation = `Image is in lossless WebP with ${classification} aspect ratio (${w}×${h}). Admin can choose Fit to preserve full product without crop, or Fill to frame 16:9.`;
            } else {
              status = 'REQUIRES_RECOMPOSITION';
              recommendation = 'Consider converting through standard 16:9 canvas editor.';
            }

            item = {
              ...item,
              format: format || mediaDoc.mime_type,
              width: w,
              height: h,
              sizeBytes: size,
              aspectRatioNumeric: parseFloat(ratio.toFixed(2)),
              aspectRatioClassification: classification,
              isStandardResolution: isStandardRes,
              isLosslessWebP: isLossless,
              status,
              recommendation,
            };
          } catch {
            item.status = 'BROKEN';
            item.recommendation = 'Media data corrupted or unreadable by Sharp.';
          }
        } else {
          item.status = 'BROKEN';
          item.recommendation = 'Media record not found in MongoDB MediaModel.';
        }
      }

      reportItems.push(item);
    }
  }

  const optimalCount = reportItems.filter((i) => i.status === 'OPTIMAL').length;
  const requiresFitCount = reportItems.filter((i) => i.status === 'REQUIRES_RECOMPOSITION').length;
  const legacyCount = reportItems.filter((i) => i.status === 'EXTERNAL_OR_LEGACY').length;
  const brokenCount = reportItems.filter((i) => i.status === 'BROKEN').length;

  return {
    totalProducts: products.length,
    totalImages: reportItems.length,
    optimalCount,
    requiresFitCount,
    legacyCount,
    brokenCount,
    items: reportItems,
  };
}

async function main() {
  console.log('[Image Audit] Starting TTRC Store Product Image Audit...');
  const report = await auditCatalogImages();
  console.log('------------------------------------------------------------');
  console.log(`Total Products: ${report.totalProducts}`);
  console.log(`Total Images: ${report.totalImages}`);
  console.log(`Optimal (16:9 Lossless): ${report.optimalCount}`);
  console.log(`Requires Recomposition (Square/Other with Fit): ${report.requiresFitCount}`);
  console.log(`Legacy/External: ${report.legacyCount}`);
  console.log(`Broken: ${report.brokenCount}`);
  console.log('------------------------------------------------------------');
  for (const item of report.items) {
    console.log(`- Product: ${item.productName} (${item.productSlug})`);
    console.log(`  URL: ${item.imageUrl}`);
    console.log(`  Dimensions: ${item.width || 'N/A'} × ${item.height || 'N/A'} (${item.aspectRatioClassification})`);
    console.log(`  Format: ${item.format || 'N/A'} • Lossless: ${item.isLosslessWebP}`);
    console.log(`  Status: ${item.status} -> ${item.recommendation}`);
  }
  process.exit(0);
}

if (process.argv[1]?.includes('audit-product-images')) {
  main();
}
