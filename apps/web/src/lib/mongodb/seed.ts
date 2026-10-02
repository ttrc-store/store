import { connectToDatabase } from './client';
import { CategoryModel, SiteSettingModel, UserModel } from './models';
import bcrypt from 'bcryptjs';

const INITIAL_CATEGORIES = [
  { name: 'Gamified Robots', slug: 'gamified-robots', description: 'Robo Race, Line Follower, Robo Soccer kits and spares', sort_order: 1 },
  { name: 'STEM Kits', slug: 'stem-kits', description: 'Educational DIY science and engineering kits for students', sort_order: 2 },
  { name: 'Fasteners', slug: 'fasteners', description: 'Precision screws, nuts, bolts, standoffs and spacers', sort_order: 3 },
  { name: 'Batteries', slug: 'batteries', description: 'LiPo, Li-ion, NiMH batteries, chargers and battery holders', sort_order: 4 },
  { name: 'Motors', slug: 'motors', description: 'DC, BO, servo, stepper, BLDC motors and motor drivers', sort_order: 5 },
  { name: 'Sensors', slug: 'sensors', description: 'IR, ultrasonic, IMU/gyro, colour and line sensor arrays', sort_order: 6 },
  { name: 'Drones', slug: 'drones', description: 'Drone kits, carbon frames, flight controllers, ESCs, props', sort_order: 7 },
  { name: 'Wires & Connectors', slug: 'wires-connectors', description: 'Jumper wires, XT60, JST connectors, headers and cables', sort_order: 8 },
];

const DEFAULT_SETTINGS = [
  { key: 'gst_enabled', value: false },
  { key: 'razorpay_enabled', value: false },
  { key: 'store_name', value: 'Tamizh Tech Robotics & Components Store' },
  { key: 'gstin', value: '' },
  { key: 'support_email', value: 'support@ttrc.store' },
  { key: 'support_phone', value: '+91 98765 43210' },
  { key: 'store_address', value: 'Tamizh Tech, Tamil Nadu, India' },
  { key: 'cod_limit_paise', value: 500000 }, // ₹5000 limit
  { key: 'cod_fee_paise', value: 4900 }, // ₹49 COD fee
  { key: 'free_shipping_threshold_paise', value: 99900 }, // ₹999 free shipping
  { key: 'standard_shipping_fee_paise', value: 5000 }, // ₹50 shipping fee
];

let seeded = false;

export async function ensureDatabaseSeeded() {
  if (seeded) return;
  try {
    await connectToDatabase();

    // 1. Seed Categories if empty
    const categoryCount = await CategoryModel.countDocuments();
    if (categoryCount === 0) {
      console.log('[MongoDB Seed] Seeding initial categories into MongoDB Atlas...');
      await CategoryModel.insertMany(INITIAL_CATEGORIES);
    }

    // 2. Seed Settings if empty
    for (const setting of DEFAULT_SETTINGS) {
      await SiteSettingModel.updateOne(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true }
      );
    }

    // 3. Seed Default Admin if no admin exists
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const defaultPasswordHash = await bcrypt.hash('Admin@ttrc2026', 10);
      await UserModel.create({
        email: 'admin@tamizhtech.in',
        password_hash: defaultPasswordHash,
        full_name: 'Store Admin',
        role: 'admin',
      });
      console.log('[MongoDB Seed] Default admin created: admin@tamizhtech.in / Admin@ttrc2026');
    }

    seeded = true;
  } catch (err) {
    console.error('[MongoDB Seed Error]', err);
  }
}
