import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), 'apps/web/package.json'));
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ensure DNS resolution works reliably on Windows development environments
if (process.platform === 'win32' && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch {
    // Ignore in sandboxed runtimes
  }
}

// Locate and load MongoDB URI and TEST_CUSTOMER_PASSWORD from .env.local if not already in process.env
const envFiles = [
  path.resolve(process.cwd(), 'apps/web/.env.local'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

let mongoUri = process.env.MONGODB_URI;
let testPassword = process.env.TEST_CUSTOMER_PASSWORD;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();

      if (!mongoUri && key === 'MONGODB_URI') {
        mongoUri = val;
      }
      if (!testPassword && key === 'TEST_CUSTOMER_PASSWORD') {
        testPassword = val;
      }
    }
  }
}

const FALLBACK_DIRECT_URI =
  'mongodb://ttrcstoree_db_user:ZjFSWGqEKH4rQ6OY@ac-d2d3mt6-shard-00-00.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-01.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-02.imdmatw.mongodb.net:27017/ttrc_store?ssl=true&replicaSet=atlas-qqc46k-shard-0&authSource=admin&retryWrites=true&w=majority';

async function main() {
  if (!testPassword) {
    console.error('[SECURITY ERROR] TEST_CUSTOMER_PASSWORD environment variable is not set.');
    console.error('Please set TEST_CUSTOMER_PASSWORD=<owner-password> in your environment or apps/web/.env.local.');
    process.exit(1);
  }

  const targetEmail = 'ryfioai@gmail.com'.toLowerCase().trim();
  const targetPhone = '+919629463964';
  const targetName = 'Sathish Kumar P';

  const connectionUri = mongoUri || FALLBACK_DIRECT_URI;
  console.log('[MongoDB Atlas] Connecting to database...');

  try {
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    });
  } catch (err) {
    console.log('[MongoDB Atlas] SRV connection fallback, trying replica set direct seedlist...');
    await mongoose.connect(FALLBACK_DIRECT_URI, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    });
  }

  console.log('[MongoDB Atlas] Connected successfully.');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // Idempotency check: check if user already exists
  const existingUser = await usersCollection.findOne({ email: targetEmail });

  if (existingUser) {
    console.log('----------------------------------------------------');
    console.log('CUSTOMER ALREADY EXISTS (Idempotent Check Passed)');
    console.log(`User ID: ${existingUser._id.toString()}`);
    console.log(`Name:    ${existingUser.full_name}`);
    console.log(`Email:   ${existingUser.email}`);
    console.log(`Phone:   ${existingUser.phone || 'N/A'}`);
    console.log(`Role:    ${existingUser.role}`);
    console.log(`Status:  Active`);
    console.log(`Created: ${existingUser.created_at || existingUser.createdAt || 'N/A'}`);
    console.log('----------------------------------------------------');
    await mongoose.disconnect();
    return;
  }

  // Hash password using bcrypt (cost 10)
  const passwordHash = await bcrypt.hash(testPassword, 10);

  const newUser = {
    email: targetEmail,
    password_hash: passwordHash,
    full_name: targetName,
    phone: targetPhone,
    role: 'customer', // STRICT: never admin
    created_at: new Date(),
    updated_at: new Date(),
  };

  const insertResult = await usersCollection.insertOne(newUser);

  console.log('----------------------------------------------------');
  console.log('CUSTOMER CREATED SUCCESSFULLY');
  console.log(`User ID: ${insertResult.insertedId.toString()}`);
  console.log(`Name:    ${targetName}`);
  console.log(`Email:   ${targetEmail}`);
  console.log(`Phone:   ${targetPhone}`);
  console.log(`Role:    customer`);
  console.log(`Status:  Active`);
  console.log(`Created: ${newUser.created_at.toISOString()}`);
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[Error provisioning test customer]', err.message);
  process.exit(1);
});
