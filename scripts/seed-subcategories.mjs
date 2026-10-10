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

import { getMongoUri } from './get-db-uri.mjs';

const uri = getMongoUri();

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  const db = mongoose.connection.db;

  const gamifiedRobots = await db.collection('categories').findOne({ slug: 'gamified-robots' });
  if (!gamifiedRobots) {
    throw new Error('gamified-robots category not found!');
  }

  const parentId = gamifiedRobots._id.toString();

  const subcategories = [
    {
      name: 'Line Follower Robot (LFR)',
      slug: 'line-follower',
      description: 'Competition-grade Line Follower Robot (LFR) platforms, carrier boards, 7-array optical line sensors, and replacement spare parts.',
      parent_id: parentId,
      sort_order: 1,
      is_active: true,
      updated_at: new Date(),
    },
    {
      name: 'Robo Race',
      slug: 'robo-race',
      description: 'High-speed Robo Race chassis platforms, high-RPM motors, and competition accessories.',
      parent_id: parentId,
      sort_order: 2,
      is_active: true,
      updated_at: new Date(),
    },
    {
      name: 'Robo Soccer',
      slug: 'robo-soccer',
      description: 'Robo Soccer striker and defender platforms, wireless control systems, and mechanical kickers.',
      parent_id: parentId,
      sort_order: 3,
      is_active: true,
      updated_at: new Date(),
    },
  ];

  for (const sub of subcategories) {
    const existing = await db.collection('categories').findOne({ slug: sub.slug });
    if (existing) {
      await db.collection('categories').updateOne({ slug: sub.slug }, { $set: sub });
      console.log(`Updated subcategory: ${sub.name} (${sub.slug})`);
    } else {
      sub.created_at = new Date();
      await db.collection('categories').insertOne(sub);
      console.log(`Inserted subcategory: ${sub.name} (${sub.slug})`);
    }
  }

  // Update product ttrc-lfr-6-0 attributes to link directly to line-follower subcategory
  const lfrCategory = await db.collection('categories').findOne({ slug: 'line-follower' });
  if (lfrCategory) {
    await db.collection('products').updateOne(
      { slug: 'ttrc-lfr-6-0' },
      {
        $set: {
          sub_category_id: lfrCategory._id.toString(),
          sub_category_slug: 'line-follower',
          'attributes.subcategory': 'line-follower',
          'attributes.subcategory_name': 'Line Follower Robot (LFR)',
        },
      }
    );
    console.log('Updated product ttrc-lfr-6-0 with subcategory link');
  }

  await mongoose.disconnect();
  console.log('Subcategories seeded successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
