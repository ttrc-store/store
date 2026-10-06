import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// 1. USER SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IUserAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  customer_id?: string;
  role: 'customer' | 'admin' | 'staff';
  avatar_url?: string;
  addresses?: IUserAddress[];
  wishlist?: string[];
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String },
    full_name: { type: String, required: true },
    phone: { type: String },
    customer_id: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    avatar_url: { type: String },
    addresses: { type: Array, default: [] },
    wishlist: { type: [String], default: [] },
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
export interface IBulkPriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPricePaise: number;
}

export interface IProductMedia {
  url: string;
  storage_path?: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
  type?: 'image' | 'video';
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  product_type: 'kit' | 'spare_part' | 'standard';
  unit: string; // e.g. 'Piece', 'Set', 'Meter'
  status: 'draft' | 'published' | 'archived';
  price: number; // in integer paise
  compare_at_price?: number; // in integer paise (MRP)
  cost_price?: number; // internal procurement supplier cost (paise)
  landed_cost?: number; // internal estimated landed cost (paise)
  internal_notes?: string; // internal procurement notes (strictly private)
  sku: string;
  barcode?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  category_id?: string;
  manufacturer_id?: string;
  brand?: string;
  supplier?: string;
  show_manufacturer_publicly: boolean;
  show_supplier_publicly: boolean;
  bulk_price_tiers?: IBulkPriceTier[];
  technical_specs?: Array<{ key: string; value: string }>;
  applications?: string[];
  certifications?: string[];
  model_number?: string;
  part_number?: string;
  voltage?: string;
  current?: string;
  power?: string;
  material?: string;
  operating_temperature?: string;
  dimensions?: string;
  warranty?: string;
  rating?: number;
  review_count?: number;
  images: string[];
  media?: IProductMedia[];
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

const BulkPriceTierSchema = new Schema<IBulkPriceTier>(
  {
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    unitPricePaise: { type: Number, required: true },
  },
  { _id: false }
);

const TechnicalSpecSchema = new Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ProductMediaSchema = new Schema<IProductMedia>(
  {
    url: { type: String, required: true },
    storage_path: { type: String },
    alt_text: { type: String },
    is_primary: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    short_description: { type: String },
    product_type: { type: String, enum: ['kit', 'spare_part', 'standard'], default: 'standard' },
    unit: { type: String, default: 'Piece' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    price: { type: Number, required: true }, // integer paise
    compare_at_price: { type: Number },
    cost_price: { type: Number },
    landed_cost: { type: Number },
    internal_notes: { type: String },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    stock_quantity: { type: Number, default: 0 },
    low_stock_threshold: { type: Number, default: 5 },
    is_active: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    is_bestseller: { type: Boolean, default: false },
    is_new_arrival: { type: Boolean, default: false },
    category_id: { type: String },
    manufacturer_id: { type: String },
    brand: { type: String, default: 'Tamizh Tech' },
    supplier: { type: String },
    show_manufacturer_publicly: { type: Boolean, default: true },
    show_supplier_publicly: { type: Boolean, default: false },
    bulk_price_tiers: [BulkPriceTierSchema],
    technical_specs: [TechnicalSpecSchema],
    applications: [{ type: String }],
    certifications: [{ type: String }],
    model_number: { type: String },
    part_number: { type: String },
    voltage: { type: String },
    current: { type: String },
    power: { type: String },
    material: { type: String },
    operating_temperature: { type: String },
    dimensions: { type: String },
    warranty: { type: String },
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    images: [{ type: String }],
    media: [ProductMediaSchema],
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

ProductSchema.index({ category_id: 1, is_active: 1, status: 1 });
ProductSchema.index({ manufacturer_id: 1 });
ProductSchema.index({ is_active: 1, status: 1, is_featured: 1 });
ProductSchema.index({ is_active: 1, status: 1, is_bestseller: 1 });
ProductSchema.index({ is_active: 1, status: 1, is_new_arrival: 1 });
ProductSchema.index({ is_active: 1, status: 1, created_at: -1 });
ProductSchema.index({ is_active: 1, status: 1, price: 1 });

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
  mrp_price?: number;
  bulk_tier_applied?: string;
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
  mrp_price: { type: Number },
  bulk_tier_applied: { type: String },
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
  usage_limit?: number;
  per_user_limit?: number;
  expires_at?: Date;
  is_active: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discount_type: { type: String, enum: ['percentage', 'fixed'], required: true },
    discount_value: { type: Number, required: true },
    min_order_value_paise: { type: Number, default: 0 },
    max_discount_paise: { type: Number },
    usage_limit: { type: Number },
    per_user_limit: { type: Number, default: 1 },
    expires_at: { type: Date },
    is_active: { type: Boolean, default: true },
    usage_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ---------------------------------------------------------------------------
// 9. MANUFACTURER SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IManufacturer extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  country?: string;
  support_info?: string;
  verification_status: 'verified' | 'unverified';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ManufacturerSchema = new Schema<IManufacturer>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String },
    description: { type: String },
    website: { type: String },
    country: { type: String, default: 'India' },
    support_info: { type: String },
    verification_status: { type: String, enum: ['verified', 'unverified'], default: 'verified' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ---------------------------------------------------------------------------
// 10. REVIEW SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IReview extends Document {
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  admin_reply?: string;
  created_at: Date;
  updated_at: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    user_name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    images: [{ type: String }],
    is_verified_purchase: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    admin_reply: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);
ReviewSchema.index({ product_id: 1, status: 1 });

// ---------------------------------------------------------------------------
// 11. AUDIT LOG SCHEMA & MODEL
// ---------------------------------------------------------------------------
export interface IAuditLog extends Document {
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: any;
  ip?: string;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor_id: { type: String, required: true, index: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entity_id: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
AuditLogSchema.index({ entity: 1, entity_id: 1 });
AuditLogSchema.index({ created_at: -1 });

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

export const ManufacturerModel: Model<IManufacturer> =
  mongoose.models.Manufacturer || mongoose.model<IManufacturer>('Manufacturer', ManufacturerSchema);

export const ReviewModel: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// ---------------------------------------------------------------------------
// 12. SUPPLIER SCHEMA & MODEL (Private internal procurement)
// ---------------------------------------------------------------------------
export interface ISupplier extends Document {
  name: string;
  slug: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  internal_notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    contact_person: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    gstin: { type: String },
    internal_notes: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const SupplierModel: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

// ---------------------------------------------------------------------------
// 13. DISTRIBUTED RATE LIMIT SCHEMA & MODEL (MongoDB fallback for multi-instance Vercel)
// ---------------------------------------------------------------------------
export interface IRateLimitRecord extends Document {
  key: string;
  count: number;
  reset_at: Date;
}

const RateLimitSchema = new Schema<IRateLimitRecord>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 1 },
    reset_at: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: false }
);

export const RateLimitModel: Model<IRateLimitRecord> =
  mongoose.models.RateLimit || mongoose.model<IRateLimitRecord>('RateLimit', RateLimitSchema);

