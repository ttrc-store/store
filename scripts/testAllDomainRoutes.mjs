import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const DOMAINS = [
  'https://ttrc.store',
  'https://www.ttrc.store',
  'https://ttrc.shop',
  'https://www.ttrc.shop',
  'https://ttrc-store.vercel.app',
];

const PATHS = [
  '/',
  '/category/gamified-robots',
  '/product/ttrc-lfr-6-0',
  '/api/search?q=drone',
  '/robots.txt',
  '/sitemap.xml',
  '/cart',
  '/login',
  '/google0e4da828fafd7a93.html',
  '/non-existent-404-test',
];

console.log('='.repeat(80));
console.log('  TTRC STORE — MULTI-DOMAIN COMPREHENSIVE ROUTE AUDIT');
console.log(`  Timestamp : ${new Date().toISOString()}`);
console.log('='.repeat(80));

async function probeUrl(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const duration = Date.now() - start;
    const location = res.headers.get('location');
    const hsts = res.headers.get('strict-transport-security');
    const csp = res.headers.get('content-security-policy');
    const xfo = res.headers.get('x-frame-options');
    return {
      status: res.status,
      duration,
      location,
      hsts: !!hsts,
      csp: !!csp,
      xfo: !!xfo,
    };
  } catch (err) {
    return {
      status: 'ERR',
      duration: Date.now() - start,
      error: err.message,
    };
  }
}

async function run() {
  for (const domain of DOMAINS) {
    console.log(`\n==================================================`);
    console.log(`DOMAIN: ${domain}`);
    console.log(`==================================================`);
    for (const path of PATHS) {
      const fullUrl = `${domain}${path}`;
      const result = await probeUrl(fullUrl);
      const locStr = result.location ? ` -> ${result.location}` : '';
      const errStr = result.error ? ` (${result.error})` : '';
      console.log(
        `  ${path.padEnd(30)} : Status ${String(result.status).padEnd(4)} [${result.duration}ms]${locStr}${errStr}`
      );
    }
  }
}

run().catch(console.error);
