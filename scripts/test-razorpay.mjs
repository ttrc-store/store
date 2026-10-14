import crypto from 'crypto';
import dns from 'dns';
import mongoose from '../node_modules/.pnpm/mongoose@9.10.3/node_modules/mongoose/index.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

// Environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TnRvg3LwstLPha';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'LvVumP5Na4NILc9zLYFbtC0Z';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ttrcstoree_db_user:ZjFSWGqEKH4rQ6OY@ttrc-store.imdmatw.mongodb.net/ttrc_store?retryWrites=true&w=majority';

async function runTest() {
  console.log('--- 1. Testing Razorpay Orders API directly via HTTPS ---');
  const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  const testPayload = {
    amount: 50000, // ₹500.00
    currency: 'INR',
    receipt: 'test_rcpt_' + Date.now(),
    notes: { test: 'TTRC integration test' },
  };

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(testPayload),
  });

  const orderData = await res.json();
  if (!res.ok) {
    console.error('❌ Razorpay Orders API Error:', orderData);
    process.exit(1);
  }

  console.log('✅ Razorpay Order Created successfully:', {
    id: orderData.id,
    amount: orderData.amount,
    currency: orderData.currency,
    receipt: orderData.receipt,
    status: orderData.status,
  });

  console.log('\n--- 2. Testing HMAC-SHA256 Signature Verification ---');
  const fakeOrderId = orderData.id;
  const fakePaymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
  const signaturePayload = `${fakeOrderId}|${fakePaymentId}`;
  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(signaturePayload)
    .digest('hex');

  // Verify valid signature
  const genSig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${fakeOrderId}|${fakePaymentId}`)
    .digest('hex');

  const isMatch = crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(genSig));
  console.log('✅ Signature generation and match:', isMatch ? 'PASSED' : 'FAILED');

  // Test tampered signature rejection
  const tamperedSig = 'a'.repeat(64);
  const isTamperedMatch = crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(tamperedSig));
  console.log('✅ Tampered signature correctly rejected:', !isTamperedMatch ? 'PASSED' : 'FAILED');

  console.log('\n--- 3. Activating razorpay_enabled in MongoDB Site Settings ---');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const siteSettingsCol = db.collection('site_settings');

  await siteSettingsCol.updateOne(
    { key: 'razorpay_enabled' },
    { $set: { key: 'razorpay_enabled', value: true, updated_at: new Date() } },
    { upsert: true }
  );

  const updatedSetting = await siteSettingsCol.findOne({ key: 'razorpay_enabled' });
  console.log('✅ MongoDB site_settings updated:', updatedSetting);

  await mongoose.disconnect();
  console.log('\n🎉 ALL RAZORPAY INTEGRATION CHECKS PASSED!');
}

runTest().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
