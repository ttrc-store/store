import dns from 'dns';
import https from 'https';
import http from 'http';
import tls from 'tls';

const resolver = new dns.promises.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const DOMAINS = [
  'ttrc.store',
  'www.ttrc.store',
  'ttrc.shop',
  'www.ttrc.shop',
  'ttrc-store.vercel.app',
];

console.log('='.repeat(75));
console.log('  TTRC STORE — LIVE DOMAIN & TLS VERIFICATION');
console.log(`  Timestamp : ${new Date().toISOString()}`);
console.log('='.repeat(75));

async function checkDns(hostname) {
  try {
    const aRecords = await resolver.resolve4(hostname).catch(() => []);
    const cnameRecords = await resolver.resolveCname(hostname).catch(() => []);
    return { ok: aRecords.length > 0 || cnameRecords.length > 0, a: aRecords, cname: cnameRecords };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkTls(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, { servername: hostname, timeout: 5000 }, () => {
      const cert = socket.getPeerCertificate();
      const authorized = socket.authorized;
      socket.end();
      resolve({
        ok: authorized,
        subject: cert.subject?.CN,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        altnames: cert.subjectaltname,
      });
    });
    socket.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'TLS connection timeout' });
    });
  });
}

async function checkHttp(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.request(url, { method: 'GET', timeout: 7000 }, (res) => {
      const headers = res.headers;
      let body = '';
      res.on('data', (chunk) => {
        if (body.length < 1000) body += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: true,
          status: res.statusCode,
          location: headers.location || null,
          server: headers.server || null,
          hsts: headers['strict-transport-security'] || null,
          csp: headers['content-security-policy'] || null,
          xFrame: headers['x-frame-options'] || null,
        });
      });
    });
    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'HTTP request timeout' });
    });
    req.end();
  });
}

async function run() {
  for (const domain of DOMAINS) {
    console.log(`\n>>> Testing: ${domain}`);
    
    // DNS
    const dnsRes = await checkDns(domain);
    console.log(`  [DNS] Status: ${dnsRes.ok ? 'RESOLVED' : 'FAILED'}`);
    if (dnsRes.a && dnsRes.a.length) console.log(`        A Records    : ${dnsRes.a.join(', ')}`);
    if (dnsRes.cname && dnsRes.cname.length) console.log(`        CNAME Records: ${dnsRes.cname.join(', ')}`);
    if (dnsRes.error) console.log(`        Error        : ${dnsRes.error}`);

    if (dnsRes.ok) {
      // TLS
      const tlsRes = await checkTls(domain);
      console.log(`  [TLS] Status: ${tlsRes.ok ? 'VALID' : 'INVALID'}`);
      if (tlsRes.ok) {
        console.log(`        Subject  : ${tlsRes.subject}`);
        console.log(`        Valid To : ${tlsRes.validTo}`);
        console.log(`        SANs     : ${tlsRes.altnames}`);
      } else {
        console.log(`        Error    : ${tlsRes.error}`);
      }

      // HTTP & HTTPS
      const httpRes = await checkHttp(`http://${domain}`);
      console.log(`  [HTTP]  Status: ${httpRes.status || 'ERR'} | Location: ${httpRes.location || 'None'} | Error: ${httpRes.error || 'None'}`);

      const httpsRes = await checkHttp(`https://${domain}`);
      console.log(`  [HTTPS] Status: ${httpsRes.status || 'ERR'} | Location: ${httpsRes.location || 'None'} | Error: ${httpsRes.error || 'None'}`);
      if (httpsRes.ok) {
        console.log(`        HSTS: ${httpsRes.hsts ? 'PRESENT' : 'MISSING'}`);
        console.log(`        CSP:  ${httpsRes.csp ? 'PRESENT' : 'MISSING'}`);
        console.log(`        XFO:  ${httpsRes.xFrame ? 'PRESENT' : 'MISSING'}`);
      }
    }
  }
}

run().catch(console.error);
