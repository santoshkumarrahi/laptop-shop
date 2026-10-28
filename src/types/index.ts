export type UserRole =
  | 'super_admin'
  | 'product_manager'
  | 'order_manager'
  | 'inventory_manager'
  | 'customer_support'
  | 'customer';

export interface UserAddress {
  id: string;
  isDefault?: boolean;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: number;
  phone?: string | null;
  addresses: UserAddress[];
  created_at: string;
  updated_at: string;
  order_count?: number;
  total_spent?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  parent_name?: string | null;
  image_url?: string | null;
  icon?: string | null;
  display_order: number;
  is_active: number;
  is_featured: number;
  seo_title?: string | null;
  seo_description?: string | null;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  is_active: number;
  is_featured: number;
  website?: string | null;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price?: number;
  cost?: number;
  stock?: number;
}

export interface ProductSpecifications {
  // Laptop specific
  processor?: string;
  processor_generation?: string;
  ram_capacity?: string;
  storage?: string;
  graphics_card?: string;
  screen_size?: string;
  screen_resolution?: string;
  refresh_rate?: string;
  operating_system?: string;
  battery_info?: string;
  keyboard_layout?: string;
  color?: string;
  connectivity_ports?: string;
  // Speaker specific
  speaker_type?: string;
  connectivity?: string;
  output_power?: string;
  battery_life?: string;
  waterproof_rating?: string;
  compatible_devices?: string;
  // General
  [key: string]: any;
}

export type ProductCondition = 'New' | 'Used' | 'Refurbished';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  brand_slug?: string | null;
  category_id: string;
  category_name?: string | null;
  category_slug?: string | null;
  additional_category_ids: string[];
  images: string[];
  primary_image: string;
  short_description?: string | null;
  full_description?: string | null;
  regular_price: number;
  sale_price?: number | null;
  purchase_cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  condition: ProductCondition;
  warranty_period?: string | null;
  is_featured: number;
  is_best_seller: number;
  is_new_arrival: number;
  is_active: number;
  is_archived: number;
  seo_title?: string | null;
  seo_description?: string | null;
  specifications: ProductSpecifications;
  variants: ProductVariant[];
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  primaryImage: string;
  variantId?: string | null;
  variantName?: string | null;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  maxStock: number;
  condition: string;
}

export type FulfillmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  primaryImage: string;
  variantId?: string | null;
  variantName?: string | null;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: UserAddress;
  billing_address: UserAddress;
  items: OrderItem[];
  subtotal: number;
  discount_total: number;
  coupon_code?: string | null;
  tax_total: number;
  shipping_fee: number;
  shipping_method: string;
  total: number;
  total_cost: number;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  tracking_number?: string | null;
  carrier?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  max_discount?: number | null;
  usage_limit: number;
  times_used: number;
  category_id?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  is_verified_purchase: number;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  previous_stock: number;
  adjustment_amount: number;
  new_stock: number;
  reason: string;
  admin_name?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_name: string;
  action: string;
  module: string;
  details?: string | null;
  timestamp: string;
}

export interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

export interface PromoSlide {
  id: string;
  badge?: string;
  title: string;
  subtitle: string;
  discount_tag?: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  accentColor?: string;
  display_order: number;
  is_active: number | boolean;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  store_email: string;
  store_phone: string;
  currency: string;
  tax_rate: number;
  free_shipping_threshold: number;
  standard_shipping_rate: number;
  express_shipping_rate: number;
  announcement_text?: string;
  announcement_enabled: number;
  hero_slides: HeroSlide[];
  promo_slides?: PromoSlide[];
  enabled_payment_methods: string[];
  updated_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  grossProfit: number;
  profitMarginPercent: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface DashboardStats {
  metrics: DashboardMetrics;
  statusCounts: Record<string, number>;
  salesTimeline: Array<{ date: string; revenue: number; profit: number; orders: number }>;
  bestSellers: Array<{ id: string; name: string; units: number; revenue: number; image: string }>;
  categoryRevenue: Array<{ name: string; value: number }>;
  lowStockProducts: any[];
  recentOrders: Order[];
}
