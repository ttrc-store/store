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
  email_verified: boolean;
  email_verified_at?: Date;
  token_version?: number;
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
    email_verified: { type: Boolean, default: false },
    email_verified_at: { type: Date },
    token_version: { type: Number, default: 1 },
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

export interface IProductDocument {
  id: string;
  type: 'datasheet' | 'manual' | 'schematic' | 'pinout' | 'in_box' | 'other';
  title: string;
  file_url: string;
  file_format?: string;
  file_size_bytes?: number;
  version?: string;
  sort_order?: number;
  is_verified?: boolean;
}

export interface IInBoxItem {
  item_name: string;
  quantity: number;
  notes?: string;
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
  sub_category_id?: string;
  category_ids?: string[];
  manufacturer_id?: string;
  brand?: string;
  supplier?: string;
  show_manufacturer_publicly: boolean;
  show_supplier_publicly: boolean;
  bulk_price_tiers?: IBulkPriceTier[];
  technical_specs?: Array<{ key: string; value: string }>;
  documents?: IProductDocument[];
  in_box_items?: IInBoxItem[];
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
  primary_keyword?: string;
  secondary_keywords?: string[];
  search_questions?: Array<{ question: string; answer: string }>;
  seo_readiness_score?: number;
  ai_seo_status?: 'pending' | 'generated' | 'reviewed' | 'draft';
  last_seo_audit?: Date;
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

const ProductDocumentSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['datasheet', 'manual', 'schematic', 'pinout', 'in_box', 'other'],
      default: 'datasheet',
    },
    title: { type: String, required: true },
    file_url: { type: String, required: true },
    file_format: { type: String, default: 'pdf' },
    file_size_bytes: { type: Number },
    version: { type: String },
    sort_order: { type: Number, default: 0 },
    is_verified: { type: Boolean, default: true },
  },
  { _id: false }
);

const InBoxItemSchema = new Schema(
  {
    item_name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    notes: { type: String },
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
    is_featured: { type: Boolean, default: true },
    is_bestseller: { type: Boolean, default: false },
    is_new_arrival: { type: Boolean, default: true },
    category_id: { type: String },
    sub_category_id: { type: String },
    category_ids: [{ type: String }],
    manufacturer_id: { type: String },
    brand: { type: String, default: 'Tamizh Tech' },
    supplier: { type: String },
    show_manufacturer_publicly: { type: Boolean, default: true },
    show_supplier_publicly: { type: Boolean, default: false },
    bulk_price_tiers: [BulkPriceTierSchema],
    technical_specs: [TechnicalSpecSchema],
    documents: [ProductDocumentSchema],
    in_box_items: [InBoxItemSchema],
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
    primary_keyword: { type: String },
    secondary_keywords: [{ type: String }],
    search_questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    seo_readiness_score: { type: Number, default: 0 },
    ai_seo_status: { type: String, enum: ['pending', 'generated', 'reviewed', 'draft'], default: 'pending' },
    last_seo_audit: { type: Date },
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
  shipping_method?: 'standard' | 'express';
  cod_fee: number;
  total: number;
  shipping_address: Record<string, any>;
  billing_address: Record<string, any>;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  bill_number?: string;
  tracking_number?: string;
  tracking_url?: string;
  guest_invoice_token_hash?: string;
  guest_invoice_token_revoked?: boolean;
  notes?: string;
  items: IOrderItem[];
  confirmation_email_sent?: boolean;
  confirmation_email_sent_at?: Date;
  shipment_email_sent?: boolean;
  shipment_email_sent_at?: Date;
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
    shipping_method: { type: String, enum: ['standard', 'express'], default: 'standard' },
    cod_fee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shipping_address: { type: Schema.Types.Mixed, required: true },
    billing_address: { type: Schema.Types.Mixed, required: true },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    bill_number: { type: String, unique: true, sparse: true },
    tracking_number: { type: String },
    tracking_url: { type: String },
    guest_invoice_token_hash: { type: String, index: true },
    guest_invoice_token_revoked: { type: Boolean, default: false },
    notes: { type: String },
    items: [OrderItemSchema],
    confirmation_email_sent: { type: Boolean, default: false },
    confirmation_email_sent_at: { type: Date },
    shipment_email_sent: { type: Boolean, default: false },
    shipment_email_sent_at: { type: Date },
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

// ---------------------------------------------------------------------------
// 14. MEDIA SCHEMA & MODEL (Persistent file storage in MongoDB Atlas)
// ---------------------------------------------------------------------------
export interface IMedia extends Document {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  data: Buffer;
  width?: number;
  height?: number;
  original_format?: string;
  original_size?: number;
  is_lossless?: boolean;
  fit_mode?: string;
  aspect_ratio?: string;
  migrated_from?: string;
  created_at: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true, unique: true, index: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    width: { type: Number },
    height: { type: Number },
    original_format: { type: String },
    original_size: { type: Number },
    is_lossless: { type: Boolean, default: true },
    fit_mode: { type: String },
    aspect_ratio: { type: String },
    migrated_from: { type: String, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const MediaModel: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

// ---------------------------------------------------------------------------
// 15. ENQUIRY SCHEMA & MODEL (Customer support & B2B RFQ enquiries)
// ---------------------------------------------------------------------------
export type EnquiryType = 'CONTACT' | 'RFQ' | 'contact' | 'rfq' | 'bulk_enquiry' | 'bulk_orders';
export type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED' | 'new' | 'in_progress' | 'responded' | 'closed';

export interface IEnquiry extends Document {
  type: EnquiryType;
  name: string;
  mobile: string;
  phone?: string;
  email: string;
  message: string;
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  organization?: string;
  subject?: string;
  product_details?: string;
  status: EnquiryStatus;
  adminNotes?: string;
  admin_notes?: string;
  sourcePage?: string;
  source_page?: string;
  ip_address?: string;
  created_at: Date;
  updated_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    type: {
      type: String,
      enum: ['CONTACT', 'RFQ', 'contact', 'rfq', 'bulk_enquiry', 'bulk_orders'],
      default: 'CONTACT',
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    mobile: { type: String, required: true, trim: true, maxlength: 20, alias: 'phone' },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 150, index: true },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    productId: { type: String, trim: true, maxlength: 100 },
    productName: { type: String, trim: true, maxlength: 200 },
    sku: { type: String, trim: true, maxlength: 100 },
    quantity: { type: Number, min: 1, max: 1000000 },
    organization: { type: String, trim: true, maxlength: 150 },
    subject: { type: String, trim: true, maxlength: 200 },
    product_details: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'new', 'in_progress', 'responded', 'closed'],
      default: 'NEW',
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 2000, alias: 'admin_notes' },
    sourcePage: { type: String, trim: true, maxlength: 200, alias: 'source_page' },
    ip_address: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getters for camelCase timestamps
EnquirySchema.virtual('createdAt').get(function () {
  return this.created_at;
});
EnquirySchema.virtual('updatedAt').get(function () {
  return this.updated_at;
});

// Compound & single-field indexes for admin sorting, filtering, and customer lookups
EnquirySchema.index({ type: 1, status: 1, created_at: -1 });
EnquirySchema.index({ status: 1, created_at: -1 });
EnquirySchema.index({ email: 1, created_at: -1 });
EnquirySchema.index({ mobile: 1, created_at: -1 });
EnquirySchema.index({ created_at: -1 });

export const EnquiryModel: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', EnquirySchema);

// ---------------------------------------------------------------------------
// 16. STOCK SUBSCRIPTION SCHEMA & MODEL (Back-in-Stock Notifications)
// ---------------------------------------------------------------------------
export interface IStockSubscription extends Document {
  product_id: string;
  variant_id?: string;
  sku?: string;
  email: string;
  user_id?: string;
  status: 'active' | 'notified' | 'unsubscribed';
  unsubscribe_token: string;
  notified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const StockSubscriptionSchema = new Schema<IStockSubscription>(
  {
    product_id: { type: String, required: true, index: true },
    variant_id: { type: String },
    sku: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    user_id: { type: String },
    status: {
      type: String,
      enum: ['active', 'notified', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    unsubscribe_token: { type: String, required: true, index: true },
    notified_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

StockSubscriptionSchema.index({ product_id: 1, email: 1, status: 1 });

export const StockSubscriptionModel: Model<IStockSubscription> =
  mongoose.models.StockSubscription ||
  mongoose.model<IStockSubscription>('StockSubscription', StockSubscriptionSchema);

// ---------------------------------------------------------------------------
// 17. OTP CHALLENGE SCHEMA & MODEL (Secure 120s Email Verification)
// ---------------------------------------------------------------------------
export interface IOtpChallenge extends Document {
  challenge_id: string;
  email: string;
  purpose: 'registration' | 'password_reset' | 'email_change';
  otp_hash: string;
  expires_at: Date;
  attempts: number;
  max_attempts: number;
  is_consumed: boolean;
  is_invalidated: boolean;
  consumed_at?: Date;
  ip_address?: string;
  metadata?: Record<string, any>;
  resend_count: number;
  last_sent_at: Date;
  created_at: Date;
  updated_at: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    challenge_id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset', 'email_change'],
      required: true,
      index: true,
    },
    otp_hash: { type: String, required: true },
    expires_at: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    max_attempts: { type: Number, default: 5 },
    is_consumed: { type: Boolean, default: false, index: true },
    is_invalidated: { type: Boolean, default: false, index: true },
    consumed_at: { type: Date },
    ip_address: { type: String },
    metadata: { type: Schema.Types.Mixed },
    resend_count: { type: Number, default: 0 },
    last_sent_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// TTL index for automatic Mongo background cleanup (keeps records 2 hours after expires_at)
// Security note: Application logic strictly enforces authoritative 120-second validity
OtpChallengeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 7200 });
OtpChallengeSchema.index({ email: 1, purpose: 1, is_consumed: 1, is_invalidated: 1 });

export const OtpChallengeModel: Model<IOtpChallenge> =
  mongoose.models.OtpChallenge ||
  mongoose.model<IOtpChallenge>('OtpChallenge', OtpChallengeSchema);

// ---------------------------------------------------------------------------
// 18. EMAIL QUOTA LEDGER SCHEMA & MODEL (Resend Free-Tier Protection)
// ---------------------------------------------------------------------------
export interface IEmailQuotaLedger extends Document {
  date_key: string; // YYYY-MM-DD
  month_key: string; // YYYY-MM
  category: 'P0' | 'P1' | 'P2' | 'P3';
  attempt_count: number;
  accepted_count: number;
  failed_count: number;
  suppressed_count: number;
  updated_at: Date;
}

const EmailQuotaLedgerSchema = new Schema<IEmailQuotaLedger>(
  {
    date_key: { type: String, required: true, index: true },
    month_key: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['P0', 'P1', 'P2', 'P3'],
      required: true,
      index: true,
    },
    attempt_count: { type: Number, default: 0 },
    accepted_count: { type: Number, default: 0 },
    failed_count: { type: Number, default: 0 },
    suppressed_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

EmailQuotaLedgerSchema.index({ date_key: 1, category: 1 }, { unique: true });

export const EmailQuotaLedgerModel: Model<IEmailQuotaLedger> =
  mongoose.models.EmailQuotaLedger ||
  mongoose.model<IEmailQuotaLedger>('EmailQuotaLedger', EmailQuotaLedgerSchema);

// ---------------------------------------------------------------------------
// 17. HERO BANNER SCHEMA & MODEL (Homepage promotional posters & video offers)
// ---------------------------------------------------------------------------
export interface IHeroBanner extends Document {
  title: string;
  type: 'image' | 'video';
  media_url: string;
  link_url?: string;
  offer_price?: string;
  regular_price?: string;
  badge?: string;
  rotation_seconds: number;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const HeroBannerSchema = new Schema<IHeroBanner>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    media_url: { type: String, required: true },
    link_url: { type: String, default: '' },
    offer_price: { type: String },
    regular_price: { type: String },
    badge: { type: String },
    rotation_seconds: { type: Number, default: 3 },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const HeroBannerModel: Model<IHeroBanner> =
  mongoose.models.HeroBanner ||
  mongoose.model<IHeroBanner>('HeroBanner', HeroBannerSchema);



