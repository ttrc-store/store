'use server';

import { connectToDatabase } from '@/lib/mongodb/client';
import { SiteSettingModel, AuditLogModel } from '@/lib/mongodb/models';
import { ensureDatabaseSeeded } from '@/lib/mongodb/seed';
import { requireAdmin } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

export interface SiteSettings {
  gst_enabled: boolean;
  razorpay_enabled: boolean;
  razorpay_key_id?: string;
  gstin: string;
  company_name: string;
  free_shipping_threshold_paise: number;
  base_shipping_paise: number;
  cod_max_limit_paise: number;
}

export async function getSiteSettingsAction(): Promise<SiteSettings> {
  const defaultSettings: SiteSettings = {
    gst_enabled: false,
    razorpay_enabled: false,
    razorpay_key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
    gstin: 'Not yet registered — add GSTIN here when available',
    company_name: 'TTRC',
    free_shipping_threshold_paise: 999999999,
    base_shipping_paise: 5900,
    cod_max_limit_paise: 500000,
  };

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const dbSettings = await SiteSettingModel.find().lean();

    if (!dbSettings || dbSettings.length === 0) {
      return defaultSettings;
    }

    const settings = { ...defaultSettings };
    for (const item of dbSettings) {
      if (item.key === 'gst_enabled') settings.gst_enabled = Boolean(item.value);
      if (item.key === 'razorpay_enabled') settings.razorpay_enabled = Boolean(item.value);
      if (item.key === 'gstin') settings.gstin = String(item.value);
      if (item.key === 'company_name') settings.company_name = String(item.value);
      if (item.key === 'free_shipping_threshold_paise') settings.free_shipping_threshold_paise = Number(item.value);
      if (item.key === 'base_shipping_paise') settings.base_shipping_paise = Number(item.value);
      if (item.key === 'cod_max_limit_paise') settings.cod_max_limit_paise = Number(item.value);
    }
    settings.razorpay_key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

    return settings;
  } catch {
    return defaultSettings;
  }
}

export async function updateSiteSettingAction(key: keyof SiteSettings, value: unknown) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    // Validation: GSTIN format validation if GST enabled
    if (key === 'gst_enabled' && value === true) {
      const gstinDoc = await SiteSettingModel.findOne({ key: 'gstin' }).lean();
      const currentGstin = gstinDoc ? String(gstinDoc.value).trim() : '';
      if (!currentGstin || currentGstin.includes('Not yet registered')) {
        return { error: 'A valid 15-character GSTIN is required before GST invoicing can be enabled.' };
      }
    }

    if (key === 'gstin' && typeof value === 'string' && value.trim() && !value.includes('Not yet registered')) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(value.trim())) {
        return { error: 'Invalid GSTIN format. Expected 15 characters (e.g. 33AAAAA0000A1Z5).' };
      }
    }

    // Startup warning check per project rules
    if (key === 'razorpay_enabled' && value === true) {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !secret) {
        console.warn(
          '[TTRC Startup Warning] razorpay_enabled set to true, but RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables are missing! Automatically falling back to COD-only mode.'
        );
      }
    }

    const previousDoc = await SiteSettingModel.findOne({ key }).lean();

    await SiteSettingModel.updateOne(
      { key },
      { $set: { key, value } },
      { upsert: true }
    );

    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'setting.updated',
      entity: 'setting',
      entity_id: String(key),
      metadata: {
        key,
        oldValue: previousDoc?.value,
        newValue: value,
        actorEmail: auth.user.email,
      },
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update setting' };
  }
}
