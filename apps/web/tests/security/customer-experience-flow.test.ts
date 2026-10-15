import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToWishlistAction, removeFromWishlistAction } from '@/actions/account';
import { cancelMyOrderAction, requestReturnAction } from '@/actions/orders';
import { validateCouponAction } from '@/actions/checkout';
import { submitEnquiryAction } from '@/actions/enquiries';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

const mockUser = {
  id: 'usr_cust_123',
  email: 'customer@example.com',
  role: 'customer' as const,
  fullName: 'Test Customer',
};

vi.mock('@/lib/mongodb/models', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    UserModel: {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOne: vi.fn(),
    },
    OrderModel: {
      findOne: vi.fn(),
      create: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
    ProductModel: {
      findByIdAndUpdate: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      findOne: vi.fn(),
    },
    CouponModel: {
      findOne: vi.fn(),
    },
    EnquiryModel: {
      create: vi.fn(),
    },
    AuditLogModel: {
      create: vi.fn().mockResolvedValue(true),
    },
  };
});

describe('Customer Experience & Security Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wishlist Isolation & Actions', () => {
    it('blocks unauthenticated visitors from adding to wishlist', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ error: 'Authentication required', status: 401 });

      const res = await addToWishlistAction('prod_123');
      expect(res.error).toBe('Authentication required');
    });

    it('adds product to wishlist for authenticated customer', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const { UserModel } = await import('@/lib/mongodb/models');
      vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValueOnce({
        _id: 'usr_cust_123',
        wishlist: ['prod_123'],
      } as any);

      const res = await addToWishlistAction('prod_123');
      expect(res.success).toBe(true);
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'usr_cust_123',
        { $addToSet: { wishlist: 'prod_123' } }
      );
    });

    it('removes product from wishlist for authenticated customer', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const { UserModel } = await import('@/lib/mongodb/models');
      vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValueOnce({
        _id: 'usr_cust_123',
        wishlist: [],
      } as any);

      const res = await removeFromWishlistAction('prod_123');
      expect(res.success).toBe(true);
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'usr_cust_123',
        { $pull: { wishlist: 'prod_123' } }
      );
    });
  });

  describe('Order Cancellation & Return Authorization', () => {
    it('rejects order cancellation if caller is not the order owner', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const { OrderModel } = await import('@/lib/mongodb/models');
      // When the order belongs to another user, findOne with { _id, user_id: auth.user.id } returns null
      vi.mocked(OrderModel.findOne).mockResolvedValueOnce(null);

      const res = await cancelMyOrderAction({ orderId: 'ord_123', reason: 'Changed my mind' });
      expect(res.error).toBe('Order not found or access denied.');
    });

    it('cancels pending order and restores stock for the verified customer', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const mockSave = vi.fn().mockResolvedValue(true);
      const mockOrder = {
        _id: 'ord_123',
        order_number: 'TTRC/25-26/100010',
        user_id: 'usr_cust_123',
        status: 'confirmed',
        items: [
          { product_id: 'prod_gear_1', quantity: 2 },
          { product_id: 'prod_motor_2', quantity: 1 },
        ],
        save: mockSave,
      };

      const { OrderModel, ProductModel, AuditLogModel } = await import('@/lib/mongodb/models');
      vi.mocked(OrderModel.findOne).mockResolvedValueOnce(mockOrder as any);

      const res = await cancelMyOrderAction({ orderId: 'ord_123', reason: 'Ordered wrong variant' });
      expect(res.success).toBe(true);
      expect(mockOrder.status).toBe('cancelled');
      expect(mockSave).toHaveBeenCalled();
      // Stock restored for both items via updateOne
      expect(ProductModel.updateOne).toHaveBeenCalledWith(
        { _id: 'prod_gear_1' },
        { $inc: { stock_quantity: 2 } }
      );
      expect(ProductModel.updateOne).toHaveBeenCalledWith(
        { _id: 'prod_motor_2' },
        { $inc: { stock_quantity: 1 } }
      );
      // Audit log recorded
      expect(AuditLogModel.create).toHaveBeenCalled();
    });

    it('rejects cancellation if order has already shipped', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const { OrderModel } = await import('@/lib/mongodb/models');
      vi.mocked(OrderModel.findOne).mockResolvedValueOnce({
        _id: 'ord_123',
        order_number: 'TTRC/25-26/100010',
        user_id: 'usr_cust_123',
        status: 'shipped',
      } as any);

      const res = await cancelMyOrderAction({ orderId: 'ord_123', reason: 'Need to cancel' });
      expect(res.error).toContain('already shipped');
    });

    it('enforces 7-day return window on delivered orders', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const oldDeliveredDate = new Date();
      oldDeliveredDate.setDate(oldDeliveredDate.getDate() - 10); // 10 days ago (expired window)

      const { OrderModel } = await import('@/lib/mongodb/models');
      vi.mocked(OrderModel.findOne).mockResolvedValueOnce({
        _id: 'ord_123',
        order_number: 'TTRC/25-26/100008',
        user_id: 'usr_cust_123',
        status: 'delivered',
        updated_at: oldDeliveredDate,
      } as any);

      const res = await requestReturnAction({ orderId: 'ord_123', reason: 'Defective wheel' });
      expect(res.error).toContain('outside the 7-day replacement window');
    });

    it('accepts valid return request within 7-day delivery window', async () => {
      const { requireAuth } = await import('@/lib/auth-helpers');
      vi.mocked(requireAuth).mockResolvedValueOnce({ user: mockUser });

      const recentDeliveredDate = new Date();
      recentDeliveredDate.setDate(recentDeliveredDate.getDate() - 2); // 2 days ago (valid)

      const mockSave = vi.fn().mockResolvedValue(true);
      const mockOrder = {
        _id: 'ord_123',
        order_number: 'TTRC/25-26/100009',
        user_id: 'usr_cust_123',
        status: 'delivered',
        updated_at: recentDeliveredDate,
        notes: '',
        save: mockSave,
      };

      const { OrderModel } = await import('@/lib/mongodb/models');
      vi.mocked(OrderModel.findOne).mockResolvedValueOnce(mockOrder as any);

      const res = await requestReturnAction({ orderId: 'ord_123', reason: 'Defective motor shaft' });
      expect(res.success).toBe(true);
      expect(mockOrder.notes).toContain('Return request: Defective motor shaft');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('Authoritative Coupon Validation', () => {
    it('rejects coupon if order subtotal is below minimum order value', async () => {
      const { CouponModel } = await import('@/lib/mongodb/models');
      vi.mocked(CouponModel.findOne).mockResolvedValueOnce({
        code: 'SAVE100',
        is_active: true,
        discount_type: 'fixed',
        discount_value: 10000,
        min_order_value_paise: 99900, // ₹999 min
      } as any);

      const res = await validateCouponAction('SAVE100', 50000); // Only ₹500 in cart
      expect(res.error).toContain('Minimum order of ₹999 required');
    });

    it('calculates percentage discount capped at max_discount_paise', async () => {
      const { CouponModel } = await import('@/lib/mongodb/models');
      vi.mocked(CouponModel.findOne).mockResolvedValueOnce({
        code: 'FESTIVE20',
        is_active: true,
        discount_type: 'percentage',
        discount_value: 20, // 20%
        min_order_value_paise: 50000,
        max_discount_paise: 20000, // max ₹200
      } as any);

      // Subtotal ₹2000 (200000 paise). 20% = ₹400 (40000 paise), but capped at ₹200 (20000 paise)
      const res = await validateCouponAction('FESTIVE20', 200000);
      expect(res.success).toBe(true);
      expect(res.discountPaise).toBe(20000);
      expect(res.message).toContain('You save ₹200.00');
    });
  });

  describe('Customer Inquiries & Support Submissions', () => {
    it('validates and saves customer contact inquiry to MongoDB', async () => {
      const { EnquiryModel } = await import('@/lib/mongodb/models');
      vi.mocked(EnquiryModel.create).mockResolvedValueOnce({} as any);

      const res = await submitEnquiryAction({
        type: 'contact',
        name: 'Arun Kumar',
        email: 'arun@example.com',
        phone: '+91 98765 43210',
        subject: 'Robotics Workshop Components',
        message: 'We need advice on selecting the best line follower array for competition.',
      });

      expect(res.success).toBe(true);
      expect(EnquiryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contact',
          name: 'Arun Kumar',
          email: 'arun@example.com',
          status: 'new',
        })
      );
    });

    it('rejects invalid email address in contact form', async () => {
      const res = await submitEnquiryAction({
        type: 'contact',
        name: 'Arun',
        email: 'not-an-email',
        message: 'Hello world',
      });

      expect(res.error).toBe('Please enter a valid email address');
    });
  });
});
