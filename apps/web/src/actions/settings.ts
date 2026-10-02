'use server';

import { createClient } from '@/lib/supabase/server';

export interface SiteSettings {
  gst_enabled: boolean;
  razorpay_enabled: boolean;
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
    gstin: 'Not yet registered — add GSTIN here when available',
    company_name: 'Tamizh Tech',
    free_shipping_threshold_paise: 99900,
    base_shipping_paise: 5900,
    cod_max_limit_paise: 500000,
  };

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_settings').select('key, value');

    if (!data || data.length === 0) {
      return defaultSettings;
    }

    const settings = { ...defaultSettings };
    for (const item of data) {
      if (item.key === 'gst_enabled') settings.gst_enabled = Boolean(item.value);
      if (item.key === 'razorpay_enabled') settings.razorpay_enabled = Boolean(item.value);
      if (item.key === 'gstin') settings.gstin = String(item.value);
      if (item.key === 'company_name') settings.company_name = String(item.value);
    }

    return settings;
  } catch {
    return defaultSettings;
  }
}

export async function updateSiteSettingAction(key: keyof SiteSettings, value: unknown) {
  const supabase = await createClient();

  // Startup warning check per project rules
  if (key === 'razorpay_enabled' && value === true) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret) {
      console.warn(
        '[TTRC Startup Warning] razorpay_enabled set to true, but RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables are missing! Automatically falling back to COD-only mode.'
      );
    }
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
