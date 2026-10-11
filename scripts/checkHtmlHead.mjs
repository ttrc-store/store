import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function inspectHtml(url) {
  const res = await fetch(url);
  const text = await res.text();
  console.log(`\nURL: ${url}`);
  console.log(`Status: ${res.status}`);
  
  const canonical = text.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  console.log('Canonical:', canonical ? canonical[0] : 'None');

  const ogUrl = text.match(/<meta[^>]+property=["']og:url["'][^>]*>/i);
  console.log('OG URL:   ', ogUrl ? ogUrl[0] : 'None');

  const title = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  console.log('Title:    ', title ? title[1] : 'None');

  const googleVerify = text.match(/<meta[^>]+name=["']google-site-verification["'][^>]*>/i);
  console.log('Google Verification:', googleVerify ? googleVerify[0] : 'None');
}

async function run() {
  await inspectHtml('https://www.ttrc.store/');
  await inspectHtml('https://www.ttrc.shop/');
  await inspectHtml('https://ttrc-store.vercel.app/');
}

run().catch(console.error);
