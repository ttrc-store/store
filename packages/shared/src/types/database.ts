export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRoleEnum = 'customer' | 'admin' | 'staff';
export type ProductTypeEnum = 'kit' | 'spare_part' | 'general';
export type ProductStatusEnum = 'draft' | 'published' | 'archived';
export type OrderStatusEnum =
  | 'pending_payment'
  | 'payment_failed'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';
export type PaymentMethodEnum = 'razorpay' | 'cod';
export type PaymentStatusEnum = 'pending' | 'captured' | 'failed' | 'refunded';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRoleEnum;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRoleEnum;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRoleEnum;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_desc: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_desc?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_desc?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string;
          type: ProductTypeEnum;
          brand: string;
          category_id: string;
          short_description: string;
          description: string | null;
          price_paise: number;
          mrp_paise: number;
          gst_percent: number;
          hsn_code: string;
          stock_qty: number;
          low_stock_threshold: number;
          weight_grams: number;
          country_of_origin: string;
          status: ProductStatusEnum;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sku: string;
          type?: ProductTypeEnum;
          brand?: string;
          category_id: string;
          short_description: string;
          description?: string | null;
          price_paise: number;
          mrp_paise: number;
          gst_percent?: number;
          hsn_code: string;
          stock_qty?: number;
          low_stock_threshold?: number;
          weight_grams?: number;
          country_of_origin?: string;
          status?: ProductStatusEnum;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sku?: string;
          type?: ProductTypeEnum;
          brand?: string;
          category_id?: string;
          short_description?: string;
          description?: string | null;
          price_paise?: number;
          mrp_paise?: number;
          gst_percent?: number;
          hsn_code?: string;
          stock_qty?: number;
          low_stock_threshold?: number;
          weight_grams?: number;
          country_of_origin?: string;
          status?: ProductStatusEnum;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      product_compatibility: {
        Row: {
          id: string;
          kit_id: string;
          spare_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          kit_id: string;
          spare_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          kit_id?: string;
          spare_id?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          status: OrderStatusEnum;
          payment_method: PaymentMethodEnum;
          payment_status: PaymentStatusEnum;
          subtotal_paise: number;
          discount_paise: number;
          gst_paise: number;
          shipping_paise: number;
          cod_fee_paise: number;
          total_paise: number;
          shipping_address: Json;
          tracking_number: string | null;
          courier_name: string | null;
          invoice_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          status?: OrderStatusEnum;
          payment_method: PaymentMethodEnum;
          payment_status?: PaymentStatusEnum;
          subtotal_paise: number;
          discount_paise?: number;
          gst_paise: number;
          shipping_paise?: number;
          cod_fee_paise?: number;
          total_paise: number;
          shipping_address: Json;
          tracking_number?: string | null;
          courier_name?: string | null;
          invoice_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          status?: OrderStatusEnum;
          payment_method?: PaymentMethodEnum;
          payment_status?: PaymentStatusEnum;
          subtotal_paise?: number;
          discount_paise?: number;
          gst_paise?: number;
          shipping_paise?: number;
          cod_fee_paise?: number;
          total_paise?: number;
          shipping_address?: Json;
          tracking_number?: string | null;
          courier_name?: string | null;
          invoice_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
