'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb/client';
import { HeroBannerModel, IHeroBanner } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export interface HeroBannerDTO {
  id: string;
  title: string;
  type: 'image' | 'video';
  mediaUrl: string;
  linkUrl: string;
  offerPrice?: string;
  regularPrice?: string;
  badge?: string;
  rotationSeconds: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

const DEFAULT_BANNERS = [
  {
    title: 'TTRC LF 6.0 Line Follower Robot (Without Battery)',
    type: 'image' as const,
    media_url: '/banners/special-offer-1.png',
    link_url: '/product/ttrc-lfr-6-0',
    offer_price: '₹2,999',
    regular_price: '₹3,799',
    badge: 'Special Offer',
    rotation_seconds: 3,
    sort_order: 1,
    is_active: true,
  },
  {
    title: 'TTRC LF-6.0 PRO Line Follower Robot',
    type: 'image' as const,
    media_url: '/banners/special-offer-2.png',
    link_url: '/product/ttrc-lf-6-0-pro-line-follower-robot',
    offer_price: '₹4,999',
    regular_price: '₹5,999',
    badge: 'Special Offer',
    rotation_seconds: 3,
    sort_order: 2,
    is_active: true,
  },
  {
    title: 'TTRC LINE X PRO Line Follower Robot',
    type: 'image' as const,
    media_url: '/banners/special-offer-3.png',
    link_url: '/product/ttrc-line-x-pro-line-follower-robot',
    offer_price: '₹8,999',
    regular_price: '₹10,999',
    badge: 'Special Offer',
    rotation_seconds: 3,
    sort_order: 3,
    is_active: true,
  },
];

function mapDoc(doc: any): HeroBannerDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type || 'image',
    mediaUrl: doc.media_url,
    linkUrl: doc.link_url || '',
    offerPrice: doc.offer_price || undefined,
    regularPrice: doc.regular_price || undefined,
    badge: doc.badge || undefined,
    rotationSeconds: doc.rotation_seconds || 3,
    sortOrder: doc.sort_order ?? 0,
    isActive: doc.is_active ?? true,
    createdAt: doc.created_at ? new Date(doc.created_at).toISOString() : undefined,
  };
}

export async function getActiveHeroBannersAction(): Promise<HeroBannerDTO[]> {
  try {
    await connectToDatabase();
    let banners = await HeroBannerModel.find({ is_active: true })
      .sort({ sort_order: 1, created_at: 1 })
      .lean();

    // Cold-start seed initial banners if none exist in the database
    if (!banners || banners.length === 0) {
      const existingCount = await HeroBannerModel.countDocuments();
      if (existingCount === 0) {
        await HeroBannerModel.insertMany(DEFAULT_BANNERS);
        banners = await HeroBannerModel.find({ is_active: true })
          .sort({ sort_order: 1, created_at: 1 })
          .lean();
      }
    }

    return (banners || []).map(mapDoc);
  } catch (err) {
    console.error('[Hero Banners] Error fetching active banners:', err);
    return DEFAULT_BANNERS.map((b, idx) => ({
      id: `default-${idx + 1}`,
      title: b.title,
      type: b.type,
      mediaUrl: b.media_url,
      linkUrl: b.link_url,
      offerPrice: b.offer_price,
      regularPrice: b.regular_price,
      badge: b.badge,
      rotationSeconds: b.rotation_seconds,
      sortOrder: b.sort_order,
      isActive: b.is_active,
    }));
  }
}

export async function getAllHeroBannersAction(): Promise<{ banners?: HeroBannerDTO[]; error?: string }> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    let banners = await HeroBannerModel.find()
      .sort({ sort_order: 1, created_at: 1 })
      .lean();

    if (!banners || banners.length === 0) {
      await HeroBannerModel.insertMany(DEFAULT_BANNERS);
      banners = await HeroBannerModel.find()
        .sort({ sort_order: 1, created_at: 1 })
        .lean();
    }

    return { banners: banners.map(mapDoc) };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch banners' };
  }
}

export async function createHeroBannerAction(data: {
  title: string;
  type: 'image' | 'video';
  mediaUrl: string;
  linkUrl?: string;
  offerPrice?: string;
  regularPrice?: string;
  badge?: string;
  rotationSeconds?: number;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<{ success?: boolean; error?: string; banner?: HeroBannerDTO }> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  if (!data.title?.trim()) {
    return { error: 'Poster / Banner title is required' };
  }
  if (!data.mediaUrl?.trim()) {
    return { error: 'Image or video URL is required' };
  }

  try {
    await connectToDatabase();
    const count = await HeroBannerModel.countDocuments();
    const created = await HeroBannerModel.create({
      title: data.title.trim(),
      type: data.type || 'image',
      media_url: data.mediaUrl.trim(),
      link_url: data.linkUrl ? data.linkUrl.trim() : '',
      offer_price: data.offerPrice?.trim() || undefined,
      regular_price: data.regularPrice?.trim() || undefined,
      badge: data.badge?.trim() || undefined,
      rotation_seconds: Number(data.rotationSeconds) > 0 ? Number(data.rotationSeconds) : 3,
      sort_order: data.sortOrder !== undefined ? Number(data.sortOrder) : count + 1,
      is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    });

    revalidatePath('/');
    revalidatePath('/admin/banners');

    return { success: true, banner: mapDoc(created) };
  } catch (err: any) {
    return { error: err.message || 'Failed to create banner' };
  }
}

export async function updateHeroBannerAction(
  id: string,
  data: {
    title: string;
    type: 'image' | 'video';
    mediaUrl: string;
    linkUrl?: string;
    offerPrice?: string;
    regularPrice?: string;
    badge?: string;
    rotationSeconds?: number;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  if (!id) return { error: 'Banner ID is required' };
  if (!data.title?.trim()) return { error: 'Poster / Banner title is required' };
  if (!data.mediaUrl?.trim()) return { error: 'Image or video URL is required' };

  try {
    await connectToDatabase();
    const updated = await HeroBannerModel.findByIdAndUpdate(
      id,
      {
        $set: {
          title: data.title.trim(),
          type: data.type || 'image',
          media_url: data.mediaUrl.trim(),
          link_url: data.linkUrl ? data.linkUrl.trim() : '',
          offer_price: data.offerPrice?.trim() || undefined,
          regular_price: data.regularPrice?.trim() || undefined,
          badge: data.badge?.trim() || undefined,
          rotation_seconds: Number(data.rotationSeconds) > 0 ? Number(data.rotationSeconds) : 3,
          sort_order: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
          is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      },
      { new: true }
    );

    if (!updated) return { error: 'Banner not found' };

    revalidatePath('/');
    revalidatePath('/admin/banners');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update banner' };
  }
}

export async function deleteHeroBannerAction(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  if (!id) return { error: 'Banner ID is required' };

  try {
    await connectToDatabase();
    await HeroBannerModel.findByIdAndDelete(id);

    revalidatePath('/');
    revalidatePath('/admin/banners');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete banner' };
  }
}

export async function toggleHeroBannerActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await HeroBannerModel.findByIdAndUpdate(id, { $set: { is_active: isActive } });

    revalidatePath('/');
    revalidatePath('/admin/banners');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to toggle banner status' };
  }
}
