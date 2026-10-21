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
  { name: 'Industrial Components', slug: 'industrial-components', description: 'Precision valves, pumps, solenoids, and pneumatic fluid-control components', sort_order: 9 },
];

const DEFAULT_SETTINGS = [
  { key: 'gst_enabled', value: false },
  { key: 'razorpay_enabled', value: false },
  { key: 'store_name', value: 'TTRC Store' },
  { key: 'company_name', value: 'TTRC' },
  { key: 'gstin', value: '' },
  { key: 'support_email', value: 'support@ttrc.store' },
  { key: 'support_phone', value: '+91 7904902978' },
  { key: 'store_address', value: 'Sri Vari Garden, 22, 3rd Cross, Kurumbapalayam, SSKulam, Sarcarsamakulam, Coimbatore, Tamil Nadu, 641107' },
  { key: 'cod_limit_paise', value: 500000 },
  { key: 'cod_fee_paise', value: 4900 },
  { key: 'free_shipping_threshold_paise', value: 999999999 },
  { key: 'standard_shipping_fee_paise', value: 12000 },
  { key: 'base_shipping_paise', value: 12000 },
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

    // 3. Provision Initial Administrator ONLY if explicitly configured via environment variable
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const rawPassword = process.env.INITIAL_ADMIN_PASSWORD?.trim();
      const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@ttrc.store').trim().toLowerCase();

      const BANNED_PASSWORDS = new Set([
        'admin@ttrc2026',
        'admin123',
        'password123',
        'changeme123',
        'admin@123',
        'ttrc@store',
      ]);

      const isComplex =
        rawPassword &&
        rawPassword.length >= 12 &&
        /[A-Z]/.test(rawPassword) &&
        /[a-z]/.test(rawPassword) &&
        /[0-9]/.test(rawPassword) &&
        /[^A-Za-z0-9]/.test(rawPassword) &&
        !BANNED_PASSWORDS.has(rawPassword.toLowerCase());

      if (isComplex) {
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        await UserModel.create({
          email: initialAdminEmail,
          password_hash: passwordHash,
          full_name: 'Store Admin',
          role: 'admin',
          email_verified: true,
          token_version: 1,
        });
        console.log(`[MongoDB Seed] Successfully provisioned initial administrator for: ${initialAdminEmail}`);
      } else {
        console.log(
          '[MongoDB Seed] Notice: No administrator account exists. ' +
          'To provision an administrator, configure INITIAL_ADMIN_PASSWORD (min 12 chars, upper/lower/digit/special) in server environment variables.'
        );
      }
    }

    // 4. Seed Default Verified Manufacturer if empty
    const { ManufacturerModel } = await import('./models');
    const mfgCount = await ManufacturerModel.countDocuments();
    if (mfgCount === 0) {
      await ManufacturerModel.create({
        name: 'Tamizh Tech / TTRC',
        slug: 'tamizh-tech',
        logo: '/brand/ttrc-logo.png',
        description: 'Indigenous robotics hardware, competition chassis, and STEM educational technology designed and engineered in Tamil Nadu, India.',
        website: 'https://tamizhtech.in',
        country: 'India',
        support_info: 'support@ttrc.store | +91 7904902978',
        verification_status: 'verified',
        is_active: true,
      });
      console.log('[MongoDB Seed] Default manufacturer created: Tamizh Tech / TTRC');
    }

    seeded = true;
  } catch (err) {
    console.error('[MongoDB Seed Error]', err);
  }
}
