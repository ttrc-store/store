import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing actions
vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const {
  mockAuditLogModel,
  mockOrderModel,
  mockProductModel,
  mockCategoryModel,
  mockSiteSettingModel,
  mockUserModel,
} = vi.hoisted(() => {
  return {
    mockAuditLogModel: {
      create: vi.fn().mockResolvedValue({ _id: 'audit-log-123' }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    },
    mockOrderModel: {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      aggregate: vi.fn(),
    },
    mockProductModel: {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOneAndUpdate: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      updateMany: vi.fn(),
    },
    mockCategoryModel: {
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      countDocuments: vi.fn(),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    mockSiteSettingModel: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
    mockUserModel: {
      find: vi.fn(),
      countDocuments: vi.fn(),
    },
  };
});

vi.mock('@/lib/mongodb/models', () => ({
  OrderModel: mockOrderModel,
  ProductModel: mockProductModel,
  CategoryModel: mockCategoryModel,
  SiteSettingModel: mockSiteSettingModel,
  UserModel: mockUserModel,
  AuditLogModel: mockAuditLogModel,
}));

import { requireAdmin } from '@/lib/auth-helpers';
import { updateOrderStatusAction, adjustInventoryAction } from '@/actions/admin';
import { updateSiteSettingAction } from '@/actions/settings';
import { deleteAdminCategoryAction } from '@/actions/admin-categories';
import { getAdminDashboardMetricsAction } from '@/actions/orders';

describe('TTRC Store — Admin Panel Production Hardening & Authorization Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Server-Side Administrative Authorization Boundary', () => {
    it('REJECTS unauthenticated access to updateSiteSettingAction', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({ error: 'Unauthorized: Admin access required.' } as any);

      const res = await updateSiteSettingAction('gst_enabled', true);
      expect(res).toEqual({ error: 'Unauthorized: Admin access required.' });
      expect(mockSiteSettingModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('REJECTS non-admin users attempting inventory adjustment', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({ error: 'Unauthorized: Admin access required.' } as any);

      const res = await adjustInventoryAction('prod-001', 5, 'Restocking');
      expect(res).toEqual({ error: 'Unauthorized: Admin access required.' });
      expect(mockProductModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('REJECTS non-admin users attempting order status mutations', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({ error: 'Unauthorized: Admin access required.' } as any);

      const res = await updateOrderStatusAction('ord-001', 'shipped');
      expect(res).toEqual({ error: 'Unauthorized: Admin access required.' });
      expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('2. Order State Machine & Fulfillment Invariants', () => {
    it('PREVENTS marking an unpaid online order as shipped or delivered', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      mockOrderModel.findById.mockResolvedValueOnce({
        _id: 'ord-unpaid-1',
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'razorpay',
      });

      const res = await updateOrderStatusAction('ord-unpaid-1', 'shipped');
      expect(res.error).toBeDefined();
      expect(res.error).toContain('Cannot transition unpaid online order');
      expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('AUTOMATICALLY restocks inventory when order is cancelled', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      mockOrderModel.findById.mockResolvedValueOnce({
        _id: 'ord-restock-1',
        order_number: 'TTRC-ORD-101',
        status: 'processing',
        payment_status: 'paid',
        payment_method: 'razorpay',
        items: [
          { product_id: 'prod-lf6', quantity: 2 },
        ],
        save: vi.fn().mockResolvedValue(true),
      });

      const res = await updateOrderStatusAction('ord-restock-1', 'cancelled', undefined, 'Customer requested cancellation');
      expect(res.success).toBe(true);
      expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod-lf6',
        { $inc: { stock_quantity: 2 } }
      );
      expect(mockAuditLogModel.create).toHaveBeenCalled();
    });
  });

  describe('3. Inventory Control & Atomic Movement', () => {
    it('ATOMICALLY adjusts stock with conditional boundary check preventing negative stock', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      mockProductModel.findById.mockResolvedValueOnce({
        _id: 'prod-001',
        name: 'TTRC LF 6.0',
        stock_quantity: 10,
      });

      mockProductModel.findOneAndUpdate.mockResolvedValueOnce({
        _id: 'prod-001',
        stock_quantity: 8,
      });

      const res = await adjustInventoryAction('prod-001', -2, 'Damaged chassis during testing');

      expect(res.success).toBe(true);
      expect(res.newQty).toBe(8);
      expect(mockProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'prod-001',
          stock_quantity: { $gte: 2 },
        },
        { $inc: { stock_quantity: -2 } },
        { new: true }
      );
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'inventory.adjusted',
          entity_id: 'prod-001',
        })
      );
    });

    it('REJECTS adjustment if product does not exist', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      mockProductModel.findById.mockResolvedValueOnce(null);

      const res = await adjustInventoryAction('nonexistent-prod', 5, 'Inventory count');

      expect(res.error).toBe('Product not found.');
    });
  });

  describe('4. Authoritative Revenue & Metric Calculation', () => {
    it('EXCLUDES pending, failed, and cancelled orders from paid revenue', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      // Setup Promise.all returns for getAdminDashboardMetricsAction
      mockOrderModel.countDocuments.mockResolvedValue(0);
      mockOrderModel.find.mockImplementation((filter?: any) => {
        if (filter?.payment_status === 'paid') {
          return {
            lean: vi.fn().mockResolvedValue([
              { total: 319900 },
              { total: 150000 },
            ]),
          };
        }
        if (filter?.payment_status === 'refunded') {
          return {
            lean: vi.fn().mockResolvedValue([]),
          };
        }
        return {
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
      });

      mockProductModel.countDocuments.mockResolvedValue(1);
      mockUserModel.countDocuments.mockResolvedValue(4);
      mockOrderModel.aggregate.mockResolvedValue([]);

      const metrics = await getAdminDashboardMetricsAction();

      // Only paid orders should sum into paidRevenuePaise (319900 + 150000 = 469900)
      expect(metrics.paidRevenuePaise).toBe(469900);
      expect(metrics.totalRevenuePaise).toBe(469900);
      expect(metrics.paidOrdersCount).toBe(2);
    });
  });

  describe('5. Category Lifecycle & Product Protection', () => {
    it('PREVENTS deleting a category if active products are assigned to it', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      mockCategoryModel.findById.mockResolvedValueOnce({
        _id: 'cat-gamified-1',
        name: 'Gamified Robots',
        slug: 'gamified-robots',
      });

      mockProductModel.countDocuments.mockResolvedValueOnce(3); // 3 products assigned

      const res = await deleteAdminCategoryAction('cat-gamified-1');
      expect(res.error).toBeDefined();
      expect(res.error).toContain('because 3 product(s) are assigned to it');
      expect(mockCategoryModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('DELETES category cleanly when no products or subcategories depend on it', async () => {
      vi.mocked(requireAdmin).mockResolvedValueOnce({
        user: { id: 'admin-1', email: 'admin@ttrc.store', role: 'admin' },
      } as any);

      mockCategoryModel.findById.mockResolvedValueOnce({
        _id: 'cat-unused-1',
        name: 'Unused Category',
        slug: 'unused-cat',
      });

      mockProductModel.countDocuments.mockResolvedValueOnce(0); // 0 products
      mockCategoryModel.countDocuments.mockResolvedValueOnce(0); // 0 subcategories
      mockCategoryModel.findByIdAndDelete.mockResolvedValueOnce(true);

      const res = await deleteAdminCategoryAction('cat-unused-1');
      expect(res.success).toBe(true);
      expect(mockCategoryModel.findByIdAndDelete).toHaveBeenCalledWith('cat-unused-1');
      expect(mockAuditLogModel.create).toHaveBeenCalled();
    });
  });
});
