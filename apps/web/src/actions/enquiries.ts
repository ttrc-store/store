'use server';

import { z } from 'zod';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/client';
import { EnquiryModel } from '@/lib/mongodb/models';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { requireAdmin } from '@/lib/auth-helpers';
import { sendEnquiryNotificationEmail } from '@/lib/email/resend';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// ─── TYPES & INTERFACES ────────────────────────────────────────────────────────

export type EnquiryTypeParam = 'ALL' | 'CONTACT' | 'RFQ';
export type EnquiryStatusParam = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';

export interface AdminEnquiryItem {
  id: string;
  type: 'CONTACT' | 'RFQ';
  name: string;
  mobile: string;
  email: string;
  message: string;
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  organization?: string;
  subject?: string;
  product_details?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
  adminNotes?: string;
  sourcePage?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryCounts {
  total: number;
  newCount: number;
  inProgressCount: number;
  respondedCount: number;
  closedCount: number;
  contactCount: number;
  rfqCount: number;
}

// ─── VALIDATION SCHEMAS ───────────────────────────────────────────────────────

const MobileRegex = /^\+?[0-9\s\-]{10,20}$/;

const SubmitEnquiryInputSchema = z
  .object({
    type: z
      .enum(['CONTACT', 'RFQ', 'contact', 'rfq', 'bulk_enquiry', 'bulk_orders'])
      .optional()
      .default('CONTACT'),
    name: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email address is required' })
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(150, 'Email cannot exceed 150 characters'),
    mobile: z
      .string()
      .trim()
      .regex(MobileRegex, 'Please enter a valid 10-15 digit mobile number')
      .max(20)
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(MobileRegex, 'Please enter a valid 10-15 digit mobile number')
      .max(20)
      .optional()
      .or(z.literal('')),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(5, 'Message must be at least 5 characters')
      .max(3000, 'Message cannot exceed 3000 characters'),
    productId: z.string().trim().max(100).optional().or(z.literal('')),
    productName: z.string().trim().max(200).optional().or(z.literal('')),
    sku: z.string().trim().max(100).optional().or(z.literal('')),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(1000000).optional(),
    organization: z.string().trim().max(150).optional().or(z.literal('')),
    subject: z.string().trim().max(200).optional().or(z.literal('')),
    product_details: z.string().trim().max(1000).optional().or(z.literal('')),
    sourcePage: z.string().trim().max(200).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const activeMobile = (data.mobile || data.phone || '').trim();
      return activeMobile.length >= 10;
    },
    {
      message: 'Mobile number is required (at least 10 digits)',
      path: ['mobile'],
    }
  );

export type SubmitEnquiryInput = z.input<typeof SubmitEnquiryInputSchema>;

// Helper: Escape user input for safe RegExp searching
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Helper: Format raw Mongoose document to clean AdminEnquiryItem
function formatEnquiry(doc: any): AdminEnquiryItem {
  const rawType = String(doc.type || 'CONTACT').toUpperCase();
  const normalizedType: 'CONTACT' | 'RFQ' =
    rawType === 'RFQ' || rawType === 'BULK_ENQUIRY' || rawType === 'BULK_ORDERS' ? 'RFQ' : 'CONTACT';

  const rawStatus = String(doc.status || 'NEW').toUpperCase();
  const validStatuses = ['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'];
  const normalizedStatus = validStatuses.includes(rawStatus)
    ? (rawStatus as 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED')
    : 'NEW';

  const mobileVal = doc.mobile || doc.phone || '';
  const createdDate = doc.created_at || doc.createdAt || new Date();
  const updatedDate = doc.updated_at || doc.updatedAt || new Date();
  const isoCreated = new Date(createdDate).toISOString();
  const isoUpdated = new Date(updatedDate).toISOString();

  return {
    id: doc._id.toString(),
    type: normalizedType,
    name: doc.name || '',
    mobile: mobileVal,
    email: doc.email || '',
    message: doc.message || '',
    productId: doc.productId,
    productName: doc.productName,
    sku: doc.sku,
    quantity: doc.quantity,
    organization: doc.organization,
    subject: doc.subject,
    product_details: doc.product_details,
    status: normalizedStatus,
    adminNotes: doc.adminNotes || doc.admin_notes,
    sourcePage: doc.sourcePage || doc.source_page,
    ip_address: doc.ip_address,
    created_at: isoCreated,
    updated_at: isoUpdated,
    createdAt: isoCreated,
    updatedAt: isoUpdated,
  };
}

// ─── PUBLIC CUSTOMER ACTION: SUBMIT ENQUIRY ───────────────────────────────────

export async function submitEnquiryAction(input: SubmitEnquiryInput) {
  // 1. Server-side Zod validation
  const parsed = SubmitEnquiryInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid form data' };
  }

  const {
    type,
    name,
    email,
    mobile,
    phone,
    message,
    productId,
    productName,
    sku,
    quantity,
    organization,
    subject,
    product_details,
    sourcePage,
  } = parsed.data;

  // Resolve normalized mobile number
  const finalMobile = (mobile || phone || '').trim();

  // Normalize enquiry type and status:
  // If legacy lowercase 'contact' is explicitly supplied, preserve 'contact' and 'new' for compatibility
  const isLegacyContact = type === 'contact';
  const upperType = (type || 'CONTACT').toUpperCase();
  const normalizedType: 'CONTACT' | 'RFQ' | 'contact' =
    isLegacyContact
      ? 'contact'
      : upperType === 'RFQ' || upperType === 'BULK_ENQUIRY' || upperType === 'BULK_ORDERS'
      ? 'RFQ'
      : 'CONTACT';

  const initialStatus = isLegacyContact ? 'new' : 'NEW';

  // 2. Client IP extraction
  let clientIp = 'anonymous';
  try {
    const headersList = await headers();
    clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  } catch {
    // Fallback if headers() unavailable
  }

  // 3. Spam & Rate Limiting Protection (5 submissions per 15 minutes per IP + Email)
  const rateLimit = await checkRateLimit({
    key: `enquiry:${clientIp}:${email.toLowerCase()}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.success) {
    return { error: 'Too many submissions. Please wait a few minutes before trying again.' };
  }

  try {
    await connectToDatabase();

    // 4. Persistence into MongoDB Atlas
    // Privileged fields like status and adminNotes are strictly controlled by server defaults
    const doc = await EnquiryModel.create({
      type: normalizedType,
      name: name.trim(),
      mobile: finalMobile,
      phone: finalMobile,
      email: email.toLowerCase().trim(),
      message: message.trim(),
      productId: productId ? productId.trim() : undefined,
      productName: productName ? productName.trim() : undefined,
      sku: sku ? sku.trim() : undefined,
      quantity: quantity || undefined,
      organization: organization ? organization.trim() : undefined,
      subject: subject ? subject.trim() : undefined,
      product_details: product_details ? product_details.trim() : undefined,
      sourcePage: sourcePage ? sourcePage.trim() : undefined,
      source_page: sourcePage ? sourcePage.trim() : undefined,
      status: initialStatus,
      ip_address: clientIp !== 'unknown' ? clientIp : undefined,
    });

    const enquiryId = doc?._id ? doc._id.toString() : 'enquiry-ack';

    // 5. Asynchronous Notification Email to Store Admin (Fire-and-forget, non-blocking)
    try {
      const adminEmail =
        process.env.ADMIN_NOTIFICATION_EMAIL ||
        process.env.INITIAL_ADMIN_EMAIL ||
        'support@tamizhtech.in';

      sendEnquiryNotificationEmail({
        toEmail: adminEmail,
        enquiryId,
        type: normalizedType === 'contact' ? 'CONTACT' : normalizedType,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        mobile: finalMobile,
        message: message.trim(),
        organization: organization ? organization.trim() : undefined,
        productName: productName ? productName.trim() : undefined,
        sku: sku ? sku.trim() : undefined,
        quantity: quantity || undefined,
        sourcePage: sourcePage ? sourcePage.trim() : undefined,
      }).catch((emailErr) => {
        // Safe logging: Never log message content or PII
        console.warn('[Enquiry Notification] Deferred admin email notice failed:', emailErr?.message || 'unknown error');
      });
    } catch {
      // Notification failure must NEVER cause customer enquiry submission to fail
    }

    const successMessage =
      normalizedType === 'CONTACT'
        ? 'Thank you for contacting us! Our team will get back to you within 24 business hours.'
        : 'Thank you for your quotation request! A technical sales executive will review your requirements and reach out within 24 hours.';

    return {
      success: true,
      message: successMessage,
      enquiryId,
    };
  } catch (error) {
    // Safe logging without exposing MongoDB connection string or credentials
    console.error('Failed to persist enquiry:', error instanceof Error ? error.message : 'Unknown database error');
    return {
      error: 'Failed to submit enquiry due to a server error. Please try again or email us directly at support@tamizhtech.in.',
    };
  }
}

// ─── ADMIN ACTIONS: MANAGEMENT & REVIEWS ───────────────────────────────────────

export async function getAdminEnquiriesAction(options?: {
  page?: number;
  limit?: number;
  type?: EnquiryTypeParam;
  status?: EnquiryStatusParam;
  search?: string;
}): Promise<{
  enquiries?: AdminEnquiryItem[];
  total?: number;
  page?: number;
  totalPages?: number;
  counts?: EnquiryCounts;
  error?: string;
}> {
  // 1. Authorize: Only authenticated administrators
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { error: auth.error };
  }

  const page = Math.max(1, Number(options?.page || 1));
  const limit = Math.min(50, Math.max(1, Number(options?.limit || 15)));
  const skip = (page - 1) * limit;

  const typeFilter = options?.type || 'ALL';
  const statusFilter = options?.status || 'ALL';
  const searchFilter = (options?.search || '').trim();

  try {
    await connectToDatabase();

    // Build MongoDB query filter
    const query: Record<string, any> = {};

    // Filter by enquiry type (supporting both uppercase and legacy lowercase)
    if (typeFilter === 'CONTACT') {
      query.type = { $in: ['CONTACT', 'contact'] };
    } else if (typeFilter === 'RFQ') {
      query.type = { $in: ['RFQ', 'rfq', 'bulk_enquiry', 'bulk_orders'] };
    }

    // Filter by enquiry status
    if (statusFilter !== 'ALL') {
      const lower = statusFilter.toLowerCase();
      query.status = { $in: [statusFilter, lower] };
    }

    // Search by customer name, email, mobile, product name, or SKU
    if (searchFilter) {
      const escaped = escapeRegex(searchFilter);
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { phone: searchRegex },
        { organization: searchRegex },
        { productName: searchRegex },
        { sku: searchRegex },
        { product_details: searchRegex },
      ];
    }

    // Parallel fetch: Paginated records, total matching count, and aggregate status counts
    const [docs, total, totalCount, newCount, inProgressCount, respondedCount, closedCount, contactCount, rfqCount] =
      await Promise.all([
        EnquiryModel.find(query).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        EnquiryModel.countDocuments(query),
        EnquiryModel.countDocuments({}),
        EnquiryModel.countDocuments({ status: { $in: ['NEW', 'new'] } }),
        EnquiryModel.countDocuments({ status: { $in: ['IN_PROGRESS', 'in_progress'] } }),
        EnquiryModel.countDocuments({ status: { $in: ['RESPONDED', 'responded'] } }),
        EnquiryModel.countDocuments({ status: { $in: ['CLOSED', 'closed'] } }),
        EnquiryModel.countDocuments({ type: { $in: ['CONTACT', 'contact'] } }),
        EnquiryModel.countDocuments({ type: { $in: ['RFQ', 'rfq', 'bulk_enquiry', 'bulk_orders'] } }),
      ]);

    const enquiries = docs.map(formatEnquiry);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      enquiries,
      total,
      page,
      totalPages,
      counts: {
        total: totalCount,
        newCount,
        inProgressCount,
        respondedCount,
        closedCount,
        contactCount,
        rfqCount,
      },
    };
  } catch (error) {
    console.error('Failed to fetch admin enquiries:', error instanceof Error ? error.message : error);
    return { error: 'Failed to retrieve enquiries. Please refresh the page.' };
  }
}

export async function getAdminEnquiryByIdAction(id: string): Promise<{
  enquiry?: AdminEnquiryItem;
  error?: string;
}> {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { error: auth.error };
  }

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid enquiry ID' };
  }

  try {
    await connectToDatabase();
    const doc = await EnquiryModel.findById(id).lean();
    if (!doc) {
      return { error: 'Enquiry not found' };
    }
    return { enquiry: formatEnquiry(doc) };
  } catch (error) {
    console.error('Failed to fetch enquiry by ID:', error);
    return { error: 'Failed to retrieve enquiry details' };
  }
}

export async function updateAdminEnquiryStatusAction(input: {
  id: string;
  status?: 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
  adminNotes?: string;
}): Promise<{
  success?: boolean;
  enquiry?: AdminEnquiryItem;
  error?: string;
}> {
  // 1. Authorize: Only authenticated administrators
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { error: auth.error };
  }

  const { id, status, adminNotes } = input;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid enquiry ID' };
  }

  const validStatuses = ['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'];
  if (status && !validStatuses.includes(status)) {
    return { error: 'Invalid status value' };
  }

  if (adminNotes && adminNotes.length > 2000) {
    return { error: 'Admin notes cannot exceed 2000 characters' };
  }

  try {
    await connectToDatabase();

    const updateFields: Record<string, any> = {
      updated_at: new Date(),
    };

    if (status) {
      updateFields.status = status;
    }

    if (adminNotes !== undefined) {
      updateFields.adminNotes = adminNotes.trim();
      updateFields.admin_notes = adminNotes.trim();
    }

    const updatedDoc = await EnquiryModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedDoc) {
      return { error: 'Enquiry not found' };
    }

    // Revalidate admin pages
    revalidatePath('/admin/enquiries');
    revalidatePath('/admin');

    return {
      success: true,
      enquiry: formatEnquiry(updatedDoc),
    };
  } catch (error) {
    console.error('Failed to update enquiry status:', error);
    return { error: 'Failed to update enquiry. Please try again.' };
  }
}

export async function getAdminEnquiriesCountAction(): Promise<{
  newCount: number;
  totalCount: number;
  error?: string;
}> {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { error: auth.error, newCount: 0, totalCount: 0 };
  }

  try {
    await connectToDatabase();
    const [newCount, totalCount] = await Promise.all([
      EnquiryModel.countDocuments({ status: { $in: ['NEW', 'new'] } }),
      EnquiryModel.countDocuments({}),
    ]);
    return { newCount, totalCount };
  } catch {
    return { newCount: 0, totalCount: 0 };
  }
}
