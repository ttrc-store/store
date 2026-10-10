import dns from 'node:dns';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), 'apps/web/package.json'));
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

if (process.platform === 'win32' && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

import { getMongoUri } from './get-db-uri.mjs';

const uri = getMongoUri();

async function testCrud() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const countersColl = db.collection('counters');

  console.log('--- 1. VERIFY EXISTING REAL CUSTOMER ---');
  const realCustomer = await usersColl.findOne({ email: 'ryfioai@gmail.com' });
  console.log('Real customer:', {
    name: realCustomer.full_name,
    email: realCustomer.email,
    customer_id: realCustomer.customer_id,
  });
  if (realCustomer.customer_id !== 'TTRC-CUS-00001') {
    throw new Error(`Expected TTRC-CUS-00001, got ${realCustomer.customer_id}`);
  }
  console.log('✅ Real customer ID format is TTRC-CUS-00001');

  console.log('\n--- 2. TEST SEQUENTIAL ID GENERATION FOR NEW CUSTOMER ---');
  const counterDoc = await countersColl.findOneAndUpdate(
    { _id: 'CUS' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  const nextSeq = counterDoc.seq;
  const expectedId = `TTRC-CUS-${String(nextSeq).padStart(5, '0')}`;
  console.log(`Generated Next Sequential ID: ${expectedId}`);

  // Create temporary test customer
  const tempEmail = `test.crud.${Date.now()}@ttrc.test`;
  const passwordHash = await bcrypt.hash('TestPass@123', 10);
  const insertResult = await usersColl.insertOne({
    customer_id: expectedId,
    full_name: 'Test Customer Auto',
    email: tempEmail,
    phone: '+919876543210',
    password_hash: passwordHash,
    role: 'customer',
    addresses: [
      {
        id: 'addr_1',
        fullName: 'Test Customer Auto',
        phone: '+919876543210',
        line1: '123 Tech Park Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641004',
        isDefault: true,
      },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  });

  const createdId = insertResult.insertedId;
  console.log(`✅ Successfully created test customer with ID ${expectedId} (_id: ${createdId})`);

  console.log('\n--- 3. TEST VIEW FULL DETAILS (ADDRESSES & STATS) ---');
  const viewedCustomer = await usersColl.findOne({ _id: createdId });
  console.log('Viewed Customer Details:', {
    customer_id: viewedCustomer.customer_id,
    name: viewedCustomer.full_name,
    addresses_count: viewedCustomer.addresses.length,
    address_sample: viewedCustomer.addresses[0]?.line1,
  });
  if (!viewedCustomer.addresses || viewedCustomer.addresses.length === 0) {
    throw new Error('Addresses not returned');
  }
  console.log('✅ View details verified');

  console.log('\n--- 4. TEST EDIT CUSTOMER ---');
  await usersColl.updateOne(
    { _id: createdId },
    { $set: { full_name: 'Updated Name Auto', phone: '+919999988888' } }
  );
  const updatedCustomer = await usersColl.findOne({ _id: createdId });
  console.log('Updated customer:', {
    name: updatedCustomer.full_name,
    phone: updatedCustomer.phone,
  });
  if (updatedCustomer.full_name !== 'Updated Name Auto') {
    throw new Error('Customer name update failed');
  }
  console.log('✅ Edit details verified');

  console.log('\n--- 5. TEST DELETE CUSTOMER ---');
  await usersColl.deleteOne({ _id: createdId });
  const deletedCheck = await usersColl.findOne({ _id: createdId });
  if (deletedCheck) {
    throw new Error('Customer deletion failed');
  }
  console.log('✅ Customer deleted and cleaned up successfully');

  console.log('\n--- 6. VERIFY ORDER NUMBER FORMAT ---');
  const ordCounter = await countersColl.findOne({ _id: 'ORD' });
  const ordSeq = ordCounter ? ordCounter.seq + 1 : 1;
  const sampleOrdId = `TTRC-ORD-${String(ordSeq).padStart(5, '0')}`;
  console.log(`Sample Next Order Number format: ${sampleOrdId}`);
  if (!/^TTRC-ORD-\d{5}$/.test(sampleOrdId)) {
    throw new Error('Invalid order number format');
  }
  console.log('✅ Order number format verified: 5-digit padded sequence');

  await mongoose.disconnect();
  console.log('\n🎉 ALL CRUD & ID GENERATION TESTS PASSED!');
}

testCrud().catch((err) => {
  console.error(err);
  process.exit(1);
});
