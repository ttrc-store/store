import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// 1. USER SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IUser extends Document {
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff';
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String },
    full_name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    avatar_url: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ---------------------------------------------------------------------------
// 2. CATEGORY SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    image_url: { type: String },
    parent_id: { type: String, default: null },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ---------------------------------------------------------------------------
// 3. PRODUCT SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  product_type: 'kit' | 'spare_part' | 'standard';
  price: number; // in integer paise
  compare_at_price?: number; // in integer paise
  cost_price?: number;
  sku: string;
  barcode?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  category_id?: string;
  images: string[];
  attributes?: Record<string, any>;
  gst_percent: number;
  hsn_code: string;
  country_of_origin: string;
  weight_grams: number;
  meta_title?: string;
  meta_description?: string;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    short_description: { type: String },
    product_type: { type: String, enum: ['kit', 'spare_part', 'standard'], default: 'standard' },
    price: { type: Number, required: true }, // integer paise
    compare_at_price: { type: Number },
    cost_price: { type: Number },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    stock_quantity: { type: Number, default: 0 },
    low_stock_threshold: { type: Number, default: 5 },
    is_active: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    category_id: { type: String },
    images: [{ type: String }],
    attributes: { type: Schema.Types.Mixed, default: {} },
    gst_percent: { type: Number, default: 18 },
    hsn_code: { type: String, default: '8542' },
    country_of_origin: { type: String, default: 'India' },
    weight_grams: { type: Number, default: 100 },
    meta_title: { type: String },
    meta_description: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ---------------------------------------------------------------------------
// 4. PRODUCT COMPATIBILITY SCHEMA
// ---------------------------------------------------------------------------
export interface IProductCompatibility extends Document {
  spare_part_id: string;
  kit_id: string;
}

const ProductCompatibilitySchema = new Schema<IProductCompatibility>({
  spare_part_id: { type: String, required: true },
  kit_id: { type: String, required: true },
});
ProductCompatibilitySchema.index({ spare_part_id: 1, kit_id: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// 5. ORDER SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IOrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  gst_percent: number;
  hsn_code: string;
  is_spare_part: boolean;
  image_url?: string;
}

export interface IOrder extends Document {
  order_number: string;
  user_id?: string;
  guest_email?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cod' | 'razorpay';
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  cod_fee: number;
  total: number;
  shipping_address: Record<string, any>;
  billing_address: Record<string, any>;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  tracking_number?: string;
  tracking_url?: string;
  notes?: string;
  items: IOrderItem[];
  created_at: Date;
  updated_at: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product_id: { type: String, required: true },
  product_name: { type: String, required: true },
  sku: { type: String, required: true },
  unit_price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total_price: { type: Number, required: true },
  gst_percent: { type: Number, default: 18 },
  hsn_code: { type: String, default: '8542' },
  is_spare_part: { type: Boolean, default: false },
  image_url: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    order_number: { type: String, required: true, unique: true },
    user_id: { type: String },
    guest_email: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    payment_method: { type: String, enum: ['cod', 'razorpay'], default: 'cod' },
    subtotal: { type: Number, required: true },
    discount_total: { type: Number, default: 0 },
    tax_total: { type: Number, default: 0 },
    shipping_total: { type: Number, default: 0 },
    cod_fee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shipping_address: { type: Schema.Types.Mixed, required: true },
    billing_address: { type: Schema.Types.Mixed, required: true },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    tracking_number: { type: String },
    tracking_url: { type: String },
    notes: { type: String },
    items: [OrderItemSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ---------------------------------------------------------------------------
// 6. SITE SETTING SCHEMA
// ---------------------------------------------------------------------------
export interface ISiteSetting extends Document {
  key: string;
  value: any;
}

const SiteSettingSchema = new Schema<ISiteSetting>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
});

// ---------------------------------------------------------------------------
// 7. PINCODE SCHEMA
// ---------------------------------------------------------------------------
export interface IPincode extends Document {
  pincode: string;
  city: string;
  state: string;
  is_serviceable: boolean;
  is_cod_available: boolean;
}

const PincodeSchema = new Schema<IPincode>({
  pincode: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  is_serviceable: { type: Boolean, default: true },
  is_cod_available: { type: Boolean, default: true },
});

// ---------------------------------------------------------------------------
// 8. COUPON SCHEMA
// ---------------------------------------------------------------------------
export interface ICoupon extends Document {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value_paise: number;
  max_discount_paise?: number;
  expires_at?: Date;
  is_active: boolean;
  usage_count: number;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount_type: { type: String, enum: ['percentage', 'fixed'], required: true },
  discount_value: { type: Number, required: true },
  min_order_value_paise: { type: Number, default: 0 },
  max_discount_paise: { type: Number },
  expires_at: { type: Date },
  is_active: { type: Boolean, default: true },
  usage_count: { type: Number, default: 0 },
});

// Export Models with cache check for hot-reloading
export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export const CategoryModel: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export const ProductCompatibilityModel: Model<IProductCompatibility> =
  mongoose.models.ProductCompatibility ||
  mongoose.model<IProductCompatibility>('ProductCompatibility', ProductCompatibilitySchema);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export const SiteSettingModel: Model<ISiteSetting> =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);

export const PincodeModel: Model<IPincode> =
  mongoose.models.Pincode || mongoose.model<IPincode>('Pincode', PincodeSchema);

export const CouponModel: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
