'use server';

import crypto from 'crypto';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { StockSubscriptionModel, ProductModel, AuditLogModel } from '@/lib/mongodb/models';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { sendBackInStockEmail } from '@/lib/email/resend';

const SubscribeSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email('Please enter a valid email address')),
  variantId: z.string().optional(),
});

/**
 * Subscribe customer email for back-in-stock alerts.
 * Enforces rate limiting, prevents duplicate active alerts, and associates with user if authenticated.
 */
export async function subscribeBackInStockAction(raw: {
  productId: string;
  email: string;
  variantId?: string;
}) {
  const parsed = SubscribeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { productId, email, variantId } = parsed.data;

  // Rate limit: 5 subscription attempts per minute per email
  const rateLimit = await checkRateLimit({
    key: `stock-sub:${email}`,
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return { error: 'Too many subscription requests. Please try again in a minute.' };
  }

  try {
    await connectToDatabase();

    // Verify product exists
    const product = await ProductModel.findById(productId).lean();
    if (!product) {
      return { error: 'Product not found.' };
    }

    // If product is already in stock, inform user immediately
    if (product.stock_quantity > 0) {
      return {
        alreadyInStock: true,
        message: 'This product is currently in stock! You can add it to your cart right now.',
      };
    }

    const auth = await getAuthenticatedUser();
    const userId = auth && typeof auth === 'object' && !('error' in auth) ? auth.user?.id : undefined;

    // Check if an active subscription already exists for this product + email
    const existing = await StockSubscriptionModel.findOne({
      product_id: productId,
      email,
      status: 'active',
    });

    if (existing) {
      return {
        success: true,
        alreadySubscribed: true,
        message: 'You are already registered for alerts on this item. We will email you the moment stock arrives!',
      };
    }

    // Generate secure unsubscribe token
    const unsubscribeToken = crypto.randomBytes(24).toString('hex');

    await StockSubscriptionModel.create({
      product_id: productId,
      variant_id: variantId,
      sku: product.sku,
      email,
      user_id: userId,
      status: 'active',
      unsubscribe_token: unsubscribeToken,
    });

    // Record audit log
    await AuditLogModel.create({
      actor_id: userId || `guest:${email}`,
      action: 'stock.subscription.created',
      entity: 'product',
      entity_id: productId,
      metadata: {
        sku: product.sku,
        productName: product.name,
        subscribedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "You're all set! We will notify you immediately once this item is restocked.",
    };
  } catch (err: any) {
    console.error('[Stock Subscription Error]', err);
    return { error: 'Failed to register back-in-stock alert. Please try again.' };
  }
}

/**
 * 1-Click unsubscribe from back-in-stock alerts using secure random token.
 */
export async function unsubscribeBackInStockAction(token: string) {
  if (!token || typeof token !== 'string') {
    return { error: 'Invalid or missing unsubscribe token.' };
  }

  try {
    await connectToDatabase();

    const subscription = await StockSubscriptionModel.findOneAndUpdate(
      { unsubscribe_token: token, status: { $ne: 'unsubscribed' } },
      { $set: { status: 'unsubscribed' } },
      { new: true }
    );

    if (!subscription) {
      return {
        error: 'Subscription not found or already unsubscribed.',
      };
    }

    return {
      success: true,
      message: 'You have been successfully unsubscribed from back-in-stock alerts for this item.',
    };
  } catch (err: any) {
    console.error('[Unsubscribe Error]', err);
    return { error: 'Failed to process unsubscribe request.' };
  }
}

/**
 * Idempotently notify all active subscribers when an item stock transitions from <= 0 to > 0.
 * Atomically marks status: 'notified' to prevent duplicate dispatches.
 * NEVER reserves stock for subscribers (Requirement 10).
 */
export async function notifySubscribersOnRestock(
  productId: string,
  productName: string,
  productSlug: string,
  pricePaise: number
) {
  try {
    await connectToDatabase();

    const activeSubscriptions = await StockSubscriptionModel.find({
      product_id: productId,
      status: 'active',
    });

    if (activeSubscriptions.length === 0) return { notifiedCount: 0 };

    let notifiedCount = 0;
    const priceRupees = `₹${(pricePaise / 100).toFixed(2)}`;

    for (const sub of activeSubscriptions) {
      // Atomic transition: only send if status was still 'active'
      const updatedSub = await StockSubscriptionModel.findOneAndUpdate(
        {
          _id: sub._id,
          status: 'active',
        },
        {
          $set: {
            status: 'notified',
            notified_at: new Date(),
          },
        },
        { new: false }
      );

      if (updatedSub) {
        const unsubscribeUrl = `https://ttrc.store/api/stock-subscriptions/unsubscribe?token=${encodeURIComponent(updatedSub.unsubscribe_token)}`;
        await sendBackInStockEmail({
          toEmail: updatedSub.email,
          productName,
          productSlug,
          priceRupees,
          unsubscribeUrl,
        });
        notifiedCount++;
      }
    }

    if (notifiedCount > 0) {
      await AuditLogModel.create({
        actor_id: 'system:inventory_restock',
        action: 'stock.subscribers_notified',
        entity: 'product',
        entity_id: productId,
        metadata: {
          productName,
          notifiedSubscribersCount: notifiedCount,
          timestamp: new Date().toISOString(),
        },
      });
      console.log(`[Stock Alert] Dispatched ${notifiedCount} back-in-stock email alerts for "${productName}".`);
    }

    return { notifiedCount };
  } catch (err: any) {
    console.error('[Notify Subscribers Error]', err);
    return { notifiedCount: 0, error: err?.message };
  }
}
