'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { EnquiryModel } from '@/lib/mongodb/models';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { headers } from 'next/headers';

const SubmitEnquirySchema = z.object({
  type: z.enum(['contact', 'bulk_enquiry', 'bulk_orders']).default('contact'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-]{10,15}$/, 'Please enter a valid 10-digit phone number')
    .optional()
    .or(z.literal('')),
  organization: z.string().max(150).optional().or(z.literal('')),
  subject: z.string().max(200).optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters').max(3000),
  product_details: z.string().max(1000).optional().or(z.literal('')),
  quantity: z.number().int().min(1).optional(),
});

export type SubmitEnquiryInput = z.infer<typeof SubmitEnquirySchema>;

export async function submitEnquiryAction(input: SubmitEnquiryInput) {
  const parsed = SubmitEnquirySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid form data' };
  }

  const { type, name, email, phone, organization, subject, message, product_details, quantity } = parsed.data;

  // Rate limiting per IP or email
  let clientIp = 'anonymous';
  try {
    const headersList = await headers();
    clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  } catch {
    // fallback if headers() unavailable
  }

  const rateLimit = await checkRateLimit({
    key: `enquiry:${clientIp}:${email.toLowerCase()}`,
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 submissions per 15 minutes
  });

  if (!rateLimit.success) {
    return { error: 'Too many submissions. Please wait a few minutes before trying again.' };
  }

  try {
    await connectToDatabase();

    await EnquiryModel.create({
      type,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      organization: organization ? organization.trim() : undefined,
      subject: subject ? subject.trim() : undefined,
      message: message.trim(),
      product_details: product_details ? product_details.trim() : undefined,
      quantity,
      status: 'new',
      ip_address: clientIp !== 'unknown' ? clientIp : undefined,
    });

    const successMessage =
      type === 'contact'
        ? 'Thank you for contacting us! Our team will get back to you within 24 business hours.'
        : 'Thank you for your bulk inquiry! A technical sales executive will review your requirements and reach out within 24 hours.';

    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    console.error('Failed to save enquiry:', error);
    return { error: 'Failed to submit enquiry. Please try again or email us directly at support@tamizhtech.in.' };
  }
}
