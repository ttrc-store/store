import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), 'apps/web/package.json'));
const sharp = require('sharp');

const BG_COLOR = { r: 253, g: 253, b: 253, alpha: 1 }; // #FDFDFD

async function generateAll() {
  console.log('Generating PWA Light-Theme Icons and Assets...');

  // 1. Extract clean bounding box of the TTRC STORE logo
  // Bounding box: left 35, top 259, width 1636, height 486
  const rawLogoBuffer = await sharp('apps/web/public/brand/ttrc-logo.png')
    .extract({ left: 35, top: 259, width: 1636, height: 486 })
    .toBuffer();

  const logoAspect = 1636 / 486; // ~3.366

  // Helper function to create an icon on a solid #FDFDFD background
  async function createLightSquareIcon(size, contentWidthPercent, outPath) {
    const contentW = Math.round(size * contentWidthPercent);
    const contentH = Math.round(contentW / logoAspect);

    const resizedLogo = await sharp(rawLogoBuffer)
      .resize(contentW, contentH, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
      })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`Created: ${outPath} (${size}x${size}, content: ${contentW}x${contentH})`);
  }

  // Helper for maskable icon (safe zone strictly inside 80% circle)
  async function createMaskableIcon(size, outPath) {
    // 80% diameter safe zone = size * 0.8.
    // For 512, 80% = 409.6px.
    // Diagonal of box: sqrt(W^2 + H^2) <= 400
    // W = 376, H = 112 -> diagonal = 392.3px < 409.6px (100% inside safe circle)
    const contentW = 376;
    const contentH = Math.round(contentW / logoAspect);

    const resizedLogo = await sharp(rawLogoBuffer)
      .resize(contentW, contentH, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
      })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`Created: ${outPath} (${size}x${size} MASKABLE, safe content: ${contentW}x${contentH})`);
  }

  // 2. Generate standard PWA launcher icons
  await createLightSquareIcon(192, 0.76, 'apps/web/public/brand/pwa-icon-192.png');
  await createLightSquareIcon(512, 0.76, 'apps/web/public/brand/pwa-icon-512.png');

  // 3. Generate Android maskable icon
  await createMaskableIcon(512, 'apps/web/public/brand/pwa-maskable-512.png');

  // 4. Generate Apple Touch Icon (180x180)
  await createLightSquareIcon(180, 0.78, 'apps/web/public/brand/apple-touch-icon.png');
  await createLightSquareIcon(180, 0.78, 'apps/web/src/app/apple-icon.png');

  // 5. Generate Favicons
  await createLightSquareIcon(16, 0.88, 'apps/web/public/brand/favicon-16x16.png');
  await createLightSquareIcon(32, 0.84, 'apps/web/public/brand/favicon-32x32.png');
  await createLightSquareIcon(48, 0.80, 'apps/web/public/brand/favicon-48x48.png');
  await createLightSquareIcon(32, 0.84, 'apps/web/src/app/icon.png');

  // 6. Build Multi-Size ICO File (16, 32, 48)
  const sizes = [16, 32, 48];
  const pngBuffers = sizes.map((s) =>
    fs.readFileSync(`apps/web/public/brand/favicon-${s}x${s}.png`)
  );

  const icoBuffer = buildIcoFile(sizes, pngBuffers);
  fs.writeFileSync('apps/web/public/brand/favicon.ico', icoBuffer);
  fs.writeFileSync('apps/web/public/favicon.ico', icoBuffer);
  fs.writeFileSync('apps/web/src/app/favicon.ico', icoBuffer);
  console.log('Created: multi-size favicon.ico (16, 32, 48)');

  console.log('\nAll PWA and favicon light-theme assets generated successfully!\n');
}

function buildIcoFile(sizes, pngBuffers) {
  const count = sizes.length;
  let offset = 6 + count * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO format
  header.writeUInt16LE(count, 4); // Number of images

  const directoryEntries = [];
  for (let i = 0; i < count; i++) {
    const sz = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sz >= 256 ? 0 : sz, 0); // Width
    entry.writeUInt8(sz >= 256 ? 0 : sz, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset of image data
    offset += buf.length;
    directoryEntries.push(entry);
  }

  return Buffer.concat([header, ...directoryEntries, ...pngBuffers]);
}

generateAll().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
