import {
  Category,
  Brand,
  Product,
  Order,
  Coupon,
  Review,
  InventoryLog,
  AuditLog,
  StoreSettings,
  PromoSlide,
  DashboardStats,
  User
} from '../types/index.js';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Image Upload
  uploadImage: (data: { data: string; filename?: string }) =>
    fetchJson<{ success: boolean; url: string; filename: string; size: number }>('/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Auth & Users
  login: (credentials: { email: string; password: string }) =>
    fetchJson<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    fetchJson<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUsers: () => fetchJson<User[]>('/users'),

  createUser: (data: any) =>
    fetchJson<{ success: boolean; id: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: any) =>
    fetchJson<{ success: boolean }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetUserPassword: (id: string, newPassword: string, adminName: string) =>
    fetchJson<{ success: boolean }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, adminName }),
    }),

  // Categories
  getCategories: (includeInactive = false) =>
    fetchJson<Category[]>(`/categories?include_inactive=${includeInactive}`),

  createCategory: (data: Partial<Category> & { adminName?: string }) =>
    fetchJson<{ success: boolean; id: string; slug: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: Partial<Category> & { adminName?: string }) =>
    fetchJson<{ success: boolean }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string, reassignTo?: string, adminName?: string) =>
    fetchJson<{ success: boolean; message: string }>(
      `/categories/${id}?reassignTo=${reassignTo || ''}&adminName=${encodeURIComponent(adminName || 'Admin')}`,
      { method: 'DELETE' }
    ),

  // Brands
  getBrands: () => fetchJson<Brand[]>('/brands'),

  createBrand: (data: Partial<Brand> & { adminName?: string }) =>
    fetchJson<{ success: boolean; id: string }>('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBrand: (id: string, data: Partial<Brand> & { adminName?: string }) =>
    fetchJson<{ success: boolean }>(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBrand: (id: string, adminName?: string) =>
    fetchJson<{ success: boolean }>(`/brands/${id}?adminName=${encodeURIComponent(adminName || 'Admin')}`, {
      method: 'DELETE',
    }),

  // Products
  getProducts: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      });
    }
    return fetchJson<{ products: Product[]; total: number; page: number; totalPages: number }>(
      `/products?${query.toString()}`
    );
  },

  getProduct: (identifier: string) =>
    fetchJson<{ product: Product; related: Product[]; reviews: Review[] }>(`/products/${identifier}`),

  createProduct: (data: any) =>
    fetchJson<{ success: boolean; id: string; slug: string }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: any) =>
    fetchJson<{ success: boolean }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string, permanent = false, adminName?: string) =>
    fetchJson<{ success: boolean; archived?: boolean; message?: string }>(
      `/products/${id}?permanent=${permanent}&adminName=${encodeURIComponent(adminName || 'Admin')}`,
      { method: 'DELETE' }
    ),

  bulkProductsAction: (ids: string[], action: string, value?: any, adminName?: string) =>
    fetchJson<{ success: boolean; count: number }>('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action, value, adminName }),
    }),

  // Inventory
  getInventory: () =>
    fetchJson<{
      products: Product[];
      metrics: {
        lowStockCount: number;
        outOfStockCount: number;
        totalStockItems: number;
        totalInventoryValue: number;
      };
    }>('/inventory'),

  adjustInventory: (data: { productId: string; adjustmentAmount: number; reason: string; adminName?: string }) =>
    fetchJson<{ success: boolean; newStock: number; previousStock: number }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInventoryLogs: () => fetchJson<InventoryLog[]>('/inventory/logs'),

  // Orders
  getOrders: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
    }
    return fetchJson<Order[]>(`/orders?${query.toString()}`);
  },

  getOrder: (id: string) => fetchJson<Order>(`/orders/${id}`),

  checkout: (data: any) =>
    fetchJson<{ success: boolean; order: Order }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrderStatus: (id: string, data: any) =>
    fetchJson<{ success: boolean }>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Coupons
  getCoupons: () => fetchJson<Coupon[]>('/coupons'),

  createCoupon: (data: any) =>
    fetchJson<{ success: boolean; id: string }>('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCoupon: (id: string, data: any) =>
    fetchJson<{ success: boolean }>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCoupon: (id: string, adminName?: string) =>
    fetchJson<{ success: boolean }>(`/coupons/${id}?adminName=${encodeURIComponent(adminName || 'Admin')}`, {
      method: 'DELETE',
    }),

  validateCoupon: (code: string, subtotal: number) =>
    fetchJson<{
      valid: boolean;
      code: string;
      description?: string;
      discountType: string;
      discountValue: number;
      calculatedDiscount: number;
    }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),

  // Reviews
  createReview: (data: { productId: string; userId?: string; userName: string; rating: number; title?: string; comment: string }) =>
    fetchJson<{ success: boolean; id: string }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard Stats
  getDashboardStats: (range = '30d') =>
    fetchJson<DashboardStats>(`/dashboard/stats?range=${range}`),

  // Settings
  getSettings: () => fetchJson<StoreSettings>('/settings'),

  updateSettings: (data: Partial<StoreSettings> & { adminName?: string }) =>
    fetchJson<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Promo Slides
  getPromoSlides: () => fetchJson<PromoSlide[]>('/promo-slides'),

  createPromoSlide: (data: Partial<PromoSlide> & { adminName?: string }) =>
    fetchJson<{ success: boolean; slide: PromoSlide; slides: PromoSlide[] }>('/promo-slides', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePromoSlide: (id: string, data: Partial<PromoSlide> & { adminName?: string }) =>
    fetchJson<{ success: boolean; slide: PromoSlide; slides: PromoSlide[] }>(`/promo-slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePromoSlide: (id: string, adminName?: string) =>
    fetchJson<{ success: boolean; slides: PromoSlide[] }>(
      `/promo-slides/${id}?adminName=${encodeURIComponent(adminName || 'Admin')}`,
      { method: 'DELETE' }
    ),

  reorderPromoSlides: (orderedIds: string[], adminName?: string) =>
    fetchJson<{ success: boolean; slides: PromoSlide[] }>('/promo-slides-reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds, adminName }),
    }),

  // Audit Logs
  getAuditLogs: () => fetchJson<AuditLog[]>('/audit-logs'),
};
