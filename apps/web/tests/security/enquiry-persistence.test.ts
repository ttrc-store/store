import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── HOISTED MOCKS ────────────────────────────────────────────────────────────

const {
  mockEnquiryModel,
  mockCheckRateLimit,
  mockRequireAdmin,
  mockSendEnquiryNotificationEmail,
  mockHeaders,
} = vi.hoisted(() => {
  return {
    mockEnquiryModel: {
      create: vi.fn(),
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    },
    mockCheckRateLimit: vi.fn(),
    mockRequireAdmin: vi.fn(),
    mockSendEnquiryNotificationEmail: vi.fn(),
    mockHeaders: vi.fn(),
  };
});

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/mongodb/models', () => ({
  EnquiryModel: mockEnquiryModel,
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/email/resend', () => ({
  sendEnquiryNotificationEmail: mockSendEnquiryNotificationEmail,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  submitEnquiryAction,
  getAdminEnquiriesAction,
  getAdminEnquiryByIdAction,
  updateAdminEnquiryStatusAction,
  getAdminEnquiriesCountAction,
} from '@/actions/enquiries';

describe('TTRC Store — Contact Form & RFQ Database Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue('203.0.113.195'),
    });

    mockCheckRateLimit.mockResolvedValue({
      success: true,
      remaining: 4,
      limit: 5,
      resetMs: 900000,
    });

    mockSendEnquiryNotificationEmail.mockResolvedValue({
      success: true,
      category: 'P2',
    });
  });

  // ─── 1. VALID CONTACT SUBMISSION IS PERSISTED ─────────────────────────────────
  it('1. Valid Contact submission is persisted in MongoDB Atlas', async () => {
    const fakeCreatedDoc = {
      _id: '6712ab000000000000000001',
      type: 'CONTACT',
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '+919876543210',
      phone: '+919876543210',
      message: 'Interested in STEM robotics kit documentation for our workshop.',
      status: 'NEW',
      created_at: new Date(),
      updated_at: new Date(),
    };
    mockEnquiryModel.create.mockResolvedValueOnce(fakeCreatedDoc);

    const res = await submitEnquiryAction({
      type: 'CONTACT',
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '+91 98765 43210',
      message: 'Interested in STEM robotics kit documentation for our workshop.',
      sourcePage: '/contact',
    });

    expect(res.success).toBe(true);
    expect(res.enquiryId).toBe('6712ab000000000000000001');
    expect(mockEnquiryModel.create).toHaveBeenCalledTimes(1);

    const createPayload = mockEnquiryModel.create.mock.calls[0][0];
    expect(createPayload.type).toBe('CONTACT');
    expect(createPayload.name).toBe('Karthik Raja');
    expect(createPayload.email).toBe('karthik@example.com');
    expect(createPayload.mobile).toBe('+91 98765 43210');
    expect(createPayload.status).toBe('NEW');
    expect(createPayload.sourcePage).toBe('/contact');

    // Notification email must be sent to ttrcstore@gmail.com
    expect(mockSendEnquiryNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: 'ttrcstore@gmail.com',
        type: 'CONTACT',
        name: 'Karthik Raja',
      })
    );
  });

  // ─── 2. VALID RFQ SUBMISSION IS PERSISTED WITH PRODUCT DETAILS ──────────────
  it('2. Valid RFQ submission is persisted with relevant product and quote details', async () => {
    const fakeCreatedDoc = {
      _id: '6712ab000000000000000002',
      type: 'RFQ',
      name: 'Prof. Rajesh Kumar',
      email: 'rajesh@college.edu',
      mobile: '+919876543210',
      organization: 'PSG Tech Robotics Club',
      productName: '4WD Robo Race Kit',
      sku: 'ROB-RACE-4WD-01',
      quantity: 50,
      message: 'Need 50 units for the state competition with GST invoice.',
      status: 'NEW',
      created_at: new Date(),
      updated_at: new Date(),
    };
    mockEnquiryModel.create.mockResolvedValueOnce(fakeCreatedDoc);

    const res = await submitEnquiryAction({
      type: 'RFQ',
      name: 'Prof. Rajesh Kumar',
      email: 'rajesh@college.edu',
      mobile: '+91 98765 43210',
      organization: 'PSG Tech Robotics Club',
      productName: '4WD Robo Race Kit',
      sku: 'ROB-RACE-4WD-01',
      quantity: 50,
      message: 'Need 50 units for the state competition with GST invoice.',
      sourcePage: '/rfq',
    });

    expect(res.success).toBe(true);
    expect(res.enquiryId).toBe('6712ab000000000000000002');
    expect(mockEnquiryModel.create).toHaveBeenCalledTimes(1);

    const createPayload = mockEnquiryModel.create.mock.calls[0][0];
    expect(createPayload.type).toBe('RFQ');
    expect(createPayload.productName).toBe('4WD Robo Race Kit');
    expect(createPayload.sku).toBe('ROB-RACE-4WD-01');
    expect(createPayload.quantity).toBe(50);
    expect(createPayload.organization).toBe('PSG Tech Robotics Club');

    // RFQ notification email must be sent to ttrcstore@gmail.com
    expect(mockSendEnquiryNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: 'ttrcstore@gmail.com',
        type: 'RFQ',
        name: 'Prof. Rajesh Kumar',
      })
    );
  });

  // ─── 3. MISSING REQUIRED FIELDS ARE REJECTED ─────────────────────────────────
  it('3. Missing required fields (name, mobile, email, message) are rejected', async () => {
    // Missing mobile
    const resNoMobile = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      message: 'Test message here.',
    } as any);
    expect(resNoMobile.error).toBeDefined();

    // Missing email
    const resNoEmail = await submitEnquiryAction({
      name: 'Karthik Raja',
      mobile: '9876543210',
      message: 'Test message here.',
    } as any);
    expect(resNoEmail.error).toBeDefined();

    // Missing name
    const resNoName = await submitEnquiryAction({
      email: 'karthik@example.com',
      mobile: '9876543210',
      message: 'Test message here.',
    } as any);
    expect(resNoName.error).toBeDefined();

    // Missing message
    const resNoMsg = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '9876543210',
    } as any);
    expect(resNoMsg.error).toBeDefined();

    expect(mockEnquiryModel.create).not.toHaveBeenCalled();
  });

  // ─── 4. INVALID EMAIL AND MOBILE VALUES ARE REJECTED ─────────────────────────
  it('4. Invalid email and mobile values are rejected', async () => {
    // Malformed email
    const resBadEmail = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'not-an-email',
      mobile: '9876543210',
      message: 'Valid message content.',
    });
    expect(resBadEmail.error).toMatch(/valid email/i);

    // Mobile too short (less than 10 digits)
    const resShortMobile = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '12345',
      message: 'Valid message content.',
    });
    expect(resShortMobile.error).toMatch(/mobile/i);

    expect(mockEnquiryModel.create).not.toHaveBeenCalled();
  });

  // ─── 5. OVERSIZED INPUT IS REJECTED ──────────────────────────────────────────
  it('5. Oversized input (e.g. name > 100 chars, message > 3000 chars) is rejected', async () => {
    const hugeMessage = 'A'.repeat(3001);
    const resOversizedMsg = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '9876543210',
      message: hugeMessage,
    });
    expect(resOversizedMsg.error).toMatch(/3000 characters/i);

    const hugeName = 'N'.repeat(101);
    const resOversizedName = await submitEnquiryAction({
      name: hugeName,
      email: 'karthik@example.com',
      mobile: '9876543210',
      message: 'Valid message content.',
    });
    expect(resOversizedName.error).toMatch(/100 characters/i);

    expect(mockEnquiryModel.create).not.toHaveBeenCalled();
  });

  // ─── 6. SPAM / RATE LIMITING WORKS ───────────────────────────────────────────
  it('6. Spam and rate limiting triggers a protective error response', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 5,
      resetMs: 60000,
    });

    const res = await submitEnquiryAction({
      name: 'Spammer Bot',
      email: 'spammer@example.com',
      mobile: '9876543210',
      message: 'Spamming the server repeatedly.',
    });

    expect(res.error).toMatch(/too many submissions/i);
    expect(mockEnquiryModel.create).not.toHaveBeenCalled();
  });

  // ─── 7. REPEATED SUBMISSION IS HANDLED SAFELY ────────────────────────────────
  it('7. Repeated submissions from a customer are handled safely', async () => {
    mockEnquiryModel.create
      .mockResolvedValueOnce({
        _id: '6712ab000000000000000003',
        type: 'CONTACT',
        name: 'Karthik Raja',
        email: 'karthik@example.com',
        mobile: '9876543210',
        message: 'First enquiry request.',
      })
      .mockResolvedValueOnce({
        _id: '6712ab000000000000000004',
        type: 'CONTACT',
        name: 'Karthik Raja',
        email: 'karthik@example.com',
        mobile: '9876543210',
        message: 'Second enquiry request.',
      });

    const res1 = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '9876543210',
      message: 'First enquiry request.',
    });
    const res2 = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '9876543210',
      message: 'Second enquiry request.',
    });

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res1.enquiryId).not.toBe(res2.enquiryId);
    expect(mockEnquiryModel.create).toHaveBeenCalledTimes(2);
  });

  // ─── 8. DATABASE FAILURE PRODUCES A SAFE ERROR RESPONSE ───────────────────────
  it('8. Database failure produces a safe customer-facing error response without leaking internals', async () => {
    mockEnquiryModel.create.mockRejectedValueOnce(
      new Error('MongoServerError: connection timed out to atlas-shard-00.mongodb.net:27017')
    );

    const res = await submitEnquiryAction({
      name: 'Karthik Raja',
      email: 'karthik@example.com',
      mobile: '9876543210',
      message: 'Hello, I have an inquiry.',
    });

    expect(res.error).toBeDefined();
    // Must NOT leak connection string or stack trace
    expect(res.error).not.toContain('mongodb.net');
    expect(res.error).not.toContain('MongoServerError');
    expect(res.error).toMatch(/server error/i);
  });

  // ─── 9. UNAUTHENTICATED USERS CANNOT ACCESS ADMIN ENQUIRIES ──────────────────
  it('9. Unauthenticated users cannot access admin enquiries', async () => {
    mockRequireAdmin.mockResolvedValueOnce({ error: 'Unauthenticated', status: 401 });

    const res = await getAdminEnquiriesAction();
    expect(res.error).toBe('Unauthenticated');
    expect(mockEnquiryModel.find).not.toHaveBeenCalled();
  });

  // ─── 10. NON-ADMIN USERS CANNOT READ OR MODIFY ADMIN ENQUIRIES ───────────────
  it('10. Non-admin users cannot read or modify admin enquiries', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      error: 'Forbidden: Administrator privileges required',
      status: 403,
    });

    const resList = await getAdminEnquiriesAction();
    expect(resList.error).toMatch(/Forbidden/i);

    mockRequireAdmin.mockResolvedValueOnce({
      error: 'Forbidden: Administrator privileges required',
      status: 403,
    });

    const resUpdate = await updateAdminEnquiryStatusAction({
      id: '6712ab000000000000000001',
      status: 'RESPONDED',
      adminNotes: 'Attacking status',
    });
    expect(resUpdate.error).toMatch(/Forbidden/i);
    expect(mockEnquiryModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  // ─── 11. ADMIN CAN LIST AND FILTER ENQUIRIES ─────────────────────────────────
  it('11. Authorized admin can list and filter enquiries by type, status, and search keyword', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
    });

    const fakeDocs = [
      {
        _id: '6712ab000000000000000001',
        type: 'RFQ',
        name: 'PSG Tech',
        email: 'psg@edu.in',
        mobile: '9876543210',
        productName: 'Robo Race Kit',
        message: 'Quotation request for 20 kits.',
        status: 'NEW',
        created_at: new Date('2026-03-01T10:00:00Z'),
        updated_at: new Date('2026-03-01T10:00:00Z'),
      },
    ];

    mockEnquiryModel.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValueOnce({
        skip: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockReturnValueOnce({
            lean: vi.fn().mockResolvedValueOnce(fakeDocs),
          }),
        }),
      }),
    });

    mockEnquiryModel.countDocuments
      .mockResolvedValueOnce(1) // query match
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3) // new
      .mockResolvedValueOnce(2) // in progress
      .mockResolvedValueOnce(4) // responded
      .mockResolvedValueOnce(1) // closed
      .mockResolvedValueOnce(4) // contact
      .mockResolvedValueOnce(6); // rfq

    const res = await getAdminEnquiriesAction({
      type: 'RFQ',
      status: 'NEW',
      search: 'PSG Tech',
      page: 1,
      limit: 15,
    });

    expect(res.error).toBeUndefined();
    expect(res.enquiries).toHaveLength(1);
    expect(res.enquiries![0].name).toBe('PSG Tech');
    expect(res.enquiries![0].type).toBe('RFQ');
    expect(res.counts?.newCount).toBe(3);
    expect(res.counts?.rfqCount).toBe(6);
  });

  // ─── 12. ADMIN CAN UPDATE ENQUIRY STATUS ──────────────────────────────────────
  it('12. Authorized admin can update enquiry status and record internal admin notes', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
    });

    const updatedDoc = {
      _id: '6712ab000000000000000001',
      type: 'RFQ',
      name: 'PSG Tech',
      email: 'psg@edu.in',
      mobile: '9876543210',
      message: 'Quotation request for 20 kits.',
      status: 'RESPONDED',
      adminNotes: 'Formal proforma quotation Q-2026-104 sent via email with 15% institutional discount.',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockEnquiryModel.findByIdAndUpdate.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(updatedDoc),
    });

    const res = await updateAdminEnquiryStatusAction({
      id: '6712ab000000000000000001',
      status: 'RESPONDED',
      adminNotes: 'Formal proforma quotation Q-2026-104 sent via email with 15% institutional discount.',
    });

    expect(res.success).toBe(true);
    expect(res.enquiry?.status).toBe('RESPONDED');
    expect(res.enquiry?.adminNotes).toContain('Q-2026-104');
    expect(mockEnquiryModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  // ─── 13. CLIENT INPUT CANNOT OVERWRITE STATUS OR ADMIN-ONLY FIELDS ──────────
  it('13. Client submission cannot overwrite status, adminNotes, or privileged fields', async () => {
    mockEnquiryModel.create.mockResolvedValueOnce({
      _id: '6712ab000000000000000005',
      type: 'CONTACT',
      name: 'Attacker',
      email: 'attacker@example.com',
      mobile: '9876543210',
      message: 'Trying to inject admin fields.',
      status: 'NEW',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Malicious payload trying to inject status 'CLOSED' and adminNotes
    const res = await submitEnquiryAction({
      name: 'Attacker',
      email: 'attacker@example.com',
      mobile: '9876543210',
      message: 'Trying to inject admin fields.',
      status: 'CLOSED',
      adminNotes: 'Injected admin notes',
    } as any);

    expect(res.success).toBe(true);
    const createdPayload = mockEnquiryModel.create.mock.calls[0][0];

    // Status MUST be forced to server default 'NEW'
    expect(createdPayload.status).toBe('NEW');
    // adminNotes MUST NOT be written from client input
    expect(createdPayload.adminNotes).toBeUndefined();
    expect(createdPayload.admin_notes).toBeUndefined();
  });

  // ─── 14. EXISTING CONTACT / RFQ FLOWS AND REVIEWS INTACT ────────────────────
  it('14. Backward compatibility: supports legacy phone alias, bulk_enquiry, and bulk_orders types', async () => {
    mockEnquiryModel.create.mockResolvedValueOnce({
      _id: '6712ab000000000000000006',
      type: 'RFQ',
      name: 'Legacy Caller',
      email: 'legacy@example.com',
      mobile: '+919876543210',
      phone: '+919876543210',
      message: 'Legacy bulk order form submission.',
      status: 'NEW',
    });

    const res = await submitEnquiryAction({
      type: 'bulk_orders',
      name: 'Legacy Caller',
      email: 'legacy@example.com',
      phone: '+91 98765 43210',
      message: 'Legacy bulk order form submission.',
    });

    expect(res.success).toBe(true);
    const createdPayload = mockEnquiryModel.create.mock.calls[0][0];
    expect(createdPayload.type).toBe('RFQ');
    expect(createdPayload.mobile).toBe('+91 98765 43210');
  });
});
