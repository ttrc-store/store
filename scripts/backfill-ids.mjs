import dns from 'node:dns';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), 'apps/web/package.json'));
const mongoose = require('mongoose');

if (process.platform === 'win32' && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

const uri =
  'mongodb://ttrcstoree_db_user:ZjFSWGqEKH4rQ6OY@ac-d2d3mt6-shard-00-00.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-01.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-02.imdmatw.mongodb.net:27017/ttrc_store?ssl=true&replicaSet=atlas-qqc46k-shard-0&authSource=admin&retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  const db = mongoose.connection.db;

  // 1. Backfill Customers
  const customers = await db.collection('users').find({ role: 'customer' }).sort({ created_at: 1 }).toArray();
  console.log(`Found ${customers.length} customer(s).`);

  let cusSeq = 0;
  for (const c of customers) {
    cusSeq++;
    const padded = String(cusSeq).padStart(5, '0');
    const customerId = `TTRC-CUS-${padded}`;
    await db.collection('users').updateOne(
      { _id: c._id },
      { $set: { customer_id: customerId } }
    );
    console.log(`Assigned ${customerId} to ${c.email}`);
  }

  await db.collection('counters').updateOne(
    { _id: 'CUS' },
    { $set: { seq: Math.max(cusSeq, 1) } },
    { upsert: true }
  );
  console.log(`Counter CUS set to ${Math.max(cusSeq, 1)}`);

  // 2. Backfill Orders to TTRC-ORD-00001
  const orders = await db.collection('orders').find({}).sort({ created_at: 1 }).toArray();
  console.log(`Found ${orders.length} order(s).`);

  let ordSeq = 0;
  for (const o of orders) {
    ordSeq++;
    const padded = String(ordSeq).padStart(5, '0');
    const orderNum = `TTRC-ORD-${padded}`;
    await db.collection('orders').updateOne(
      { _id: o._id },
      { $set: { order_number: orderNum } }
    );
    console.log(`Assigned order_number ${orderNum} to order ${o._id}`);
  }

  await db.collection('counters').updateOne(
    { _id: 'ORD' },
    { $set: { seq: ordSeq } },
    { upsert: true }
  );
  console.log(`Counter ORD set to ${ordSeq}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
