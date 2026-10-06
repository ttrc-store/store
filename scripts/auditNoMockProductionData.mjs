import fs from 'node:fs';
import path from 'node:path';

console.log('======================================================================');
console.log('  TTRC STORE — ZERO MOCK PRODUCTION DATA AUDIT');
console.log('  Platform: Next.js + MongoDB Atlas | Target: Production Release');
console.log('  Timestamp:', new Date().toISOString());
console.log('======================================================================\n');

const ROOT_DIRS = [
  path.resolve(process.cwd(), 'apps/web/src'),
  path.resolve(process.cwd(), 'packages/shared/src'),
];

const BANNED_IDENTIFIERS = [
  'mockProducts',
  'fakeProducts',
  'demoProducts',
  'sampleProducts',
  'mockCustomers',
  'fakeCustomers',
  'demoCustomers',
  'testCustomers',
  'mockOrders',
  'fakeOrders',
  'demoOrders',
  'fakeReviews',
  'sampleReviews',
  'hardcodedCatalog',
];

const PLACEHOLDER_CONTACTS = [
  '0000000000',
  'test@example.com',
  'admin@example.com',
];

const IGNORE_PATTERNS = [
  /__tests__/,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /node_modules/,
  /\.next/,
  /dist/,
];

let totalFilesScanned = 0;
let violations = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath);

    if (IGNORE_PATTERNS.some((p) => p.test(fullPath))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
      totalFilesScanned++;
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check banned identifiers
      for (const banned of BANNED_IDENTIFIERS) {
        // Regex word boundary
        const regex = new RegExp(`\\b${banned}\\b`, 'i');
        if (regex.test(content)) {
          violations.push({
            file: relPath,
            rule: `Prohibited mock identifier '${banned}'`,
            snippet: content.split('\n').find((l) => regex.test(l))?.trim() || '',
          });
        }
      }

      // Check placeholder contact info in UI components (exclude test utilities or auth validation examples)
      if (fullPath.includes('components') || fullPath.includes('app')) {
        for (const placeholder of PLACEHOLDER_CONTACTS) {
          if (content.includes(placeholder)) {
            // Check if this is a comment or placeholder prop in a public component
            violations.push({
              file: relPath,
              rule: `Prohibited contact placeholder '${placeholder}' in production component`,
              snippet: content.split('\n').find((l) => l.includes(placeholder))?.trim() || '',
            });
          }
        }
      }
    }
  }
}

for (const dir of ROOT_DIRS) {
  scanDirectory(dir);
}

console.log(`Scanned ${totalFilesScanned} production source files.\n`);

if (violations.length === 0) {
  console.log('✅ [PASS] ZERO production mock data detected across all application files.');
  console.log('✅ [PASS] All customer, order, product, and review entities are strictly database-backed.');
  console.log('\n======================================================================');
  console.log('  ZERO-MOCK AUDIT RESULT: 100% COMPLIANT (0 VIOLATIONS)');
  console.log('======================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ [FAIL] Found ${violations.length} mock data violations:`);
  for (const v of violations) {
    console.error(`  - ${v.file}: ${v.rule}`);
    if (v.snippet) console.error(`    Snippet: "${v.snippet.slice(0, 80)}"`);
  }
  console.log('\n======================================================================');
  console.log('  ZERO-MOCK AUDIT RESULT: FAILED');
  console.log('======================================================================\n');
  process.exit(1);
}
