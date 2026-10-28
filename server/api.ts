import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db, defaultPromoSlides } from './db.js';

export const apiRouter = Router();

// ==========================================
// IMAGE UPLOAD & STORAGE
// ==========================================
apiRouter.post('/upload', (req: Request, res: Response) => {
  const { data, filename } = req.body;
  if (!data || typeof data !== 'string') {
    res.status(400).json({ error: 'Image data is required' });
    return;
  }

  // Validate MIME type: JPG, JPEG, PNG, WebP, GIF
  const match = data.match(/^data:(image\/(jpeg|jpg|png|webp|gif));base64,(.+)$/i);
  if (!match) {
    res.status(400).json({
      error: 'Invalid image format. Supported formats: JPG, JPEG, PNG, WebP.'
    });
    return;
  }

  const mime = match[1].toLowerCase();
  let ext = 'jpg';
  if (mime.includes('png')) ext = 'png';
  else if (mime.includes('webp')) ext = 'webp';
  else if (mime.includes('gif')) ext = 'gif';

  const base64Data = match[3];
  const buffer = Buffer.from(base64Data, 'base64');

  // Validate size: 10MB max
  if (buffer.length > 10 * 1024 * 1024) {
    res.status(400).json({ error: 'Image file size exceeds maximum 10MB limit.' });
    return;
  }

  const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const cleanBase = (filename || 'upload')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30);
  const outName = `${cleanBase}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  const outPath = path.join(uploadsDir, outName);

  fs.writeFileSync(outPath, buffer);

  res.json({
    success: true,
    url: `/uploads/${outName}`,
    filename: outName,
    size: buffer.length,
  });
});

// Helper to log administrative actions
function logAudit(userName: string, action: string, module: string, details: string, userId: string = 'admin') {
  try {
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, module, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userName, action, module, details, new Date().toISOString());
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// ==========================================
// AUTH & USERS
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
  if (!user || user.password_hash !== password) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    return;
  }

  // Parse addresses
  user.addresses = user.addresses ? JSON.parse(user.addresses) : [];
  delete user.password_hash;

  res.json({ user, token: 'demo_token_' + user.id });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const id = 'usr_' + Date.now();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, phone, addresses, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'customer', 1, ?, '[]', ?, ?)
  `).run(id, name, email, password, phone || null, now, now);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  newUser.addresses = [];
  delete newUser.password_hash;

  res.status(201).json({ user: newUser, token: 'demo_token_' + id });
});

apiRouter.get('/users', (req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.is_active, u.phone, u.created_at, u.updated_at,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON o.customer_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, email, password, role, phone, is_active, adminName } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already exists' });
    return;
  }

  const id = 'usr_' + Date.now();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, phone, addresses, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)
  `).run(id, name, email, password, role || 'customer', is_active ?? 1, phone || null, now, now);

  logAudit(adminName || 'Admin', 'CREATE_USER', 'Users', `Created user ${name} (${email}) with role ${role || 'customer'}`);
  res.status(201).json({ success: true, id });
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, is_active, phone, adminName } = req.body;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        phone = COALESCE(?, phone),
        updated_at = ?
    WHERE id = ?
  `).run(name, email, role, is_active, phone, now, id);

  logAudit(adminName || 'Admin', 'UPDATE_USER', 'Users', `Updated user details for ${email || id} (Role: ${role}, Active: ${is_active})`);
  res.json({ success: true });
});

apiRouter.post('/users/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword, adminName } = req.body;
  if (!newPassword) {
    res.status(400).json({ error: 'New password is required' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newPassword, now, id);
  logAudit(adminName || 'Admin', 'RESET_PASSWORD', 'Users', `Reset password for user ID ${id}`);
  res.json({ success: true, message: 'Password reset successfully' });
});

// ==========================================
// CATEGORIES (Dynamic CRUD & Subcategories)
// ==========================================

apiRouter.get('/categories', (req: Request, res: Response) => {
  const includeInactive = req.query.include_inactive === 'true';

  let query = `
    SELECT c.*,
           p.name as parent_name,
           (SELECT COUNT(*) FROM products prod WHERE prod.category_id = c.id AND prod.is_archived = 0) as product_count
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
  `;

  if (!includeInactive) {
    query += ' WHERE c.is_active = 1';
  }

  query += ' ORDER BY c.display_order ASC, c.name ASC';

  const categories = db.prepare(query).all();
  res.json(categories);
});

apiRouter.post('/categories', (req: Request, res: Response) => {
  const {
    name,
    slug,
    description,
    parent_id,
    image_url,
    icon,
    display_order,
    is_active,
    is_featured,
    seo_title,
    seo_description,
    adminName
  } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = 'cat_' + catSlug.replace(/-/g, '_') + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO categories (
        id, name, slug, description, parent_id, image_url, icon,
        display_order, is_active, is_featured, seo_title, seo_description,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      catSlug,
      description || null,
      parent_id || null,
      image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      icon || 'Layers',
      display_order || 0,
      is_active ?? 1,
      is_featured ?? 0,
      seo_title || `${name} | NexTech`,
      seo_description || description || null,
      now,
      now
    );

    logAudit(adminName || 'Admin', 'CREATE_CATEGORY', 'Categories', `Created category '${name}' (slug: ${catSlug})`);
    res.status(201).json({ success: true, id, slug: catSlug });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'A category with this slug or name already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

apiRouter.put('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    parent_id,
    image_url,
    icon,
    display_order,
    is_active,
    is_featured,
    seo_title,
    seo_description,
    adminName
  } = req.body;

  const now = new Date().toISOString();

  try {
    db.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          parent_id = ?,
          image_url = COALESCE(?, image_url),
          icon = COALESCE(?, icon),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          is_featured = COALESCE(?, is_featured),
          seo_title = COALESCE(?, seo_title),
          seo_description = COALESCE(?, seo_description),
          updated_at = ?
      WHERE id = ?
    `).run(
      name,
      slug,
      description,
      parent_id !== undefined ? (parent_id || null) : undefined,
      image_url,
      icon,
      display_order,
      is_active,
      is_featured,
      seo_title,
      seo_description,
      now,
      id
    );

    logAudit(adminName || 'Admin', 'UPDATE_CATEGORY', 'Categories', `Updated category ${name || id} (Active: ${is_active})`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reassignTo = req.query.reassignTo as string;
  const adminName = (req.query.adminName as string) || 'Admin';

  // Check if category has products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_archived = 0').get(id) as { count: number };

  if (productCount.count > 0 && !reassignTo) {
    res.status(400).json({
      error: `Category contains ${productCount.count} products. Please specify a category to reassign products to or remove products first.`,
      productCount: productCount.count
    });
    return;
  }

  // Reassign products if requested
  if (reassignTo) {
    db.prepare('UPDATE products SET category_id = ? WHERE category_id = ?').run(reassignTo, id);
  }

  // Reassign child subcategories to parent null
  db.prepare('UPDATE categories SET parent_id = NULL WHERE parent_id = ?').run(id);

  // Delete category
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);

  logAudit(adminName, 'DELETE_CATEGORY', 'Categories', `Deleted category ${id} (Reassigned ${productCount.count} products to ${reassignTo || 'None'})`);
  res.json({ success: true, message: 'Category deleted successfully' });
});

// ==========================================
// BRANDS
// ==========================================

apiRouter.get('/brands', (req: Request, res: Response) => {
  const brands = db.prepare(`
    SELECT b.*,
           (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_archived = 0) as product_count
    FROM brands b
    ORDER BY b.is_featured DESC, b.name ASC
  `).all();
  res.json(brands);
});

apiRouter.post('/brands', (req: Request, res: Response) => {
  const { name, slug, logo_url, description, is_active, is_featured, website, adminName } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Brand name is required' });
    return;
  }

  const brandSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = 'br_' + brandSlug.replace(/-/g, '_') + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO brands (id, name, slug, logo_url, description, is_active, is_featured, website, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    brandSlug,
    logo_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
    description || null,
    is_active ?? 1,
    is_featured ?? 0,
    website || null,
    now,
    now
  );

  logAudit(adminName || 'Admin', 'CREATE_BRAND', 'Brands', `Created brand ${name}`);
  res.status(201).json({ success: true, id });
});

apiRouter.put('/brands/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, logo_url, description, is_active, is_featured, website, adminName } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE brands
    SET name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        logo_url = COALESCE(?, logo_url),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        is_featured = COALESCE(?, is_featured),
        website = COALESCE(?, website),
        updated_at = ?
    WHERE id = ?
  `).run(name, slug, logo_url, description, is_active, is_featured, website, now, id);

  logAudit(adminName || 'Admin', 'UPDATE_BRAND', 'Brands', `Updated brand ${name || id}`);
  res.json({ success: true });
});

apiRouter.delete('/brands/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const adminName = (req.query.adminName as string) || 'Admin';

  db.prepare('UPDATE products SET brand_id = NULL WHERE brand_id = ?').run(id);
  db.prepare('DELETE FROM brands WHERE id = ?').run(id);

  logAudit(adminName, 'DELETE_BRAND', 'Brands', `Deleted brand ${id}`);
  res.json({ success: true });
});

// ==========================================
// PRODUCTS
// ==========================================

apiRouter.get('/products', (req: Request, res: Response) => {
  const {
    category,
    brand,
    condition,
    minPrice,
    maxPrice,
    inStock,
    search,
    featured,
    sort,
    admin,
    page = '1',
    limit = '24'
  } = req.query;

  let query = `
    SELECT p.*,
           c.name as category_name,
           c.slug as category_slug,
           b.name as brand_name,
           b.slug as brand_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (admin !== 'true') {
    query += ' AND p.is_active = 1 AND p.is_archived = 0';
  } else {
    query += ' AND p.is_archived = 0';
  }

  if (category) {
    query += ' AND (c.slug = ? OR p.category_id = ? OR p.additional_category_ids LIKE ?)';
    params.push(category, category, `%"${category}"%`);
  }

  if (brand) {
    query += ' AND (b.slug = ? OR p.brand_id = ?)';
    params.push(brand, brand);
  }

  if (condition) {
    query += ' AND p.condition = ?';
    params.push(condition);
  }

  if (minPrice) {
    query += ' AND COALESCE(p.sale_price, p.regular_price) >= ?';
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    query += ' AND COALESCE(p.sale_price, p.regular_price) <= ?';
    params.push(Number(maxPrice));
  }

  if (inStock === 'true') {
    query += ' AND p.stock_quantity > 0';
  }

  if (featured === 'true') {
    query += ' AND p.is_featured = 1';
  }

  if (search) {
    query += ` AND (
      p.name LIKE ? OR
      p.sku LIKE ? OR
      p.short_description LIKE ? OR
      b.name LIKE ? OR
      c.name LIKE ?
    )`;
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      query += ' ORDER BY COALESCE(p.sale_price, p.regular_price) ASC';
      break;
    case 'price_desc':
      query += ' ORDER BY COALESCE(p.sale_price, p.regular_price) DESC';
      break;
    case 'rating':
      query += ' ORDER BY p.rating_average DESC, p.rating_count DESC';
      break;
    case 'popular':
    case 'bestseller':
      query += ' ORDER BY p.is_best_seller DESC, p.rating_count DESC';
      break;
    case 'newest':
      query += ' ORDER BY p.created_at DESC';
      break;
    default:
      query += ' ORDER BY p.is_featured DESC, p.created_at DESC';
  }

  const offset = (Number(page) - 1) * Number(limit);
  const totalCountQuery = query.replace('SELECT p.*, c.name as category_name, c.slug as category_slug, b.name as brand_name, b.slug as brand_slug', 'SELECT COUNT(*) as count');
  
  // Total count
  const countRow = db.prepare(totalCountQuery).get(...params) as { count: number };
  
  query += ` LIMIT ${Number(limit)} OFFSET ${offset}`;
  const products = db.prepare(query).all(...params) as any[];

  // Parse JSON fields
  const parsedProducts = products.map((p) => ({
    ...p,
    images: p.images ? JSON.parse(p.images) : [],
    additional_category_ids: p.additional_category_ids ? JSON.parse(p.additional_category_ids) : [],
    specifications: p.specifications ? JSON.parse(p.specifications) : {},
    variants: p.variants ? JSON.parse(p.variants) : []
  }));

  res.json({
    products: parsedProducts,
    total: countRow ? countRow.count : 0,
    page: Number(page),
    totalPages: Math.ceil((countRow ? countRow.count : 0) / Number(limit))
  });
});

apiRouter.get('/products/:identifier', (req: Request, res: Response) => {
  const { identifier } = req.params;

  const product = db.prepare(`
    SELECT p.*,
           c.name as category_name,
           c.slug as category_slug,
           b.name as brand_name,
           b.slug as brand_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE (p.id = ? OR p.slug = ?) AND p.is_archived = 0
  `).get(identifier, identifier) as any;

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  product.images = product.images ? JSON.parse(product.images) : [];
  product.additional_category_ids = product.additional_category_ids ? JSON.parse(product.additional_category_ids) : [];
  product.specifications = product.specifications ? JSON.parse(product.specifications) : {};
  product.variants = product.variants ? JSON.parse(product.variants) : [];

  // Related products from same category
  const related = db.prepare(`
    SELECT id, name, slug, primary_image, regular_price, sale_price, condition, rating_average, rating_count, stock_quantity
    FROM products
    WHERE category_id = ? AND id != ? AND is_active = 1 AND is_archived = 0
    LIMIT 4
  `).all(product.category_id, product.id);

  // Reviews
  const reviews = db.prepare(`
    SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC
  `).all(product.id);

  res.json({ product, related, reviews });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const {
    name,
    slug,
    sku,
    barcode,
    brand_id,
    category_id,
    additional_category_ids,
    images,
    primary_image,
    short_description,
    full_description,
    regular_price,
    sale_price,
    purchase_cost,
    stock_quantity,
    low_stock_threshold,
    condition,
    warranty_period,
    is_featured,
    is_best_seller,
    is_new_arrival,
    is_active,
    seo_title,
    seo_description,
    specifications,
    variants,
    adminName
  } = req.body;

  if (!name || !regular_price || !category_id || !purchase_cost) {
    res.status(400).json({ error: 'Name, category, purchase cost, and regular price are required' });
    return;
  }

  const prodSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const prodSku = sku || 'PRD-' + Math.floor(100000 + Math.random() * 900000);
  const id = 'prod_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const imgList = Array.isArray(images) && images.length > 0 ? images : [
    primary_image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'
  ];
  const pImage = primary_image || imgList[0];

  try {
    db.prepare(`
      INSERT INTO products (
        id, name, slug, sku, barcode, brand_id, category_id, additional_category_ids,
        images, primary_image, short_description, full_description, regular_price,
        sale_price, purchase_cost, stock_quantity, low_stock_threshold, condition,
        warranty_period, is_featured, is_best_seller, is_new_arrival, is_active,
        is_archived, seo_title, seo_description, specifications, variants,
        rating_average, rating_count, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0, ?, ?
      )
    `).run(
      id,
      name,
      prodSlug,
      prodSku,
      barcode || null,
      brand_id || null,
      category_id,
      JSON.stringify(additional_category_ids || []),
      JSON.stringify(imgList),
      pImage,
      short_description || null,
      full_description || null,
      Number(regular_price),
      sale_price ? Number(sale_price) : null,
      Number(purchase_cost),
      Number(stock_quantity || 0),
      Number(low_stock_threshold || 5),
      condition || 'New',
      warranty_period || '1 Year Standard',
      is_featured ? 1 : 0,
      is_best_seller ? 1 : 0,
      is_new_arrival ? 1 : 0,
      is_active ?? 1,
      0,
      seo_title || `${name} | NexTech`,
      seo_description || short_description || null,
      JSON.stringify(specifications || {}),
      JSON.stringify(variants || []),
      now,
      now
    );

    // Initial inventory log
    if (Number(stock_quantity) > 0) {
      db.prepare(`
        INSERT INTO inventory_logs (id, product_id, product_name, sku, previous_stock, adjustment_amount, new_stock, reason, admin_name, created_at)
        VALUES (?, ?, ?, ?, 0, ?, ?, 'Initial Stock on Creation', ?, ?)
      `).run('inv_' + Date.now(), id, name, prodSku, Number(stock_quantity), Number(stock_quantity), adminName || 'Admin', now);
    }

    logAudit(adminName || 'Admin', 'CREATE_PRODUCT', 'Products', `Created product ${name} (${prodSku})`);
    res.status(201).json({ success: true, id, slug: prodSlug });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    slug,
    sku,
    barcode,
    brand_id,
    category_id,
    additional_category_ids,
    images,
    primary_image,
    short_description,
    full_description,
    regular_price,
    sale_price,
    purchase_cost,
    stock_quantity,
    low_stock_threshold,
    condition,
    warranty_period,
    is_featured,
    is_best_seller,
    is_new_arrival,
    is_active,
    seo_title,
    seo_description,
    specifications,
    variants,
    adminName
  } = req.body;

  const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!current) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const now = new Date().toISOString();

  // If stock changed directly, log it
  if (stock_quantity !== undefined && Number(stock_quantity) !== current.stock_quantity) {
    const diff = Number(stock_quantity) - current.stock_quantity;
    db.prepare(`
      INSERT INTO inventory_logs (id, product_id, product_name, sku, previous_stock, adjustment_amount, new_stock, reason, admin_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Direct Stock Update in Product Editor', ?, ?)
    `).run('inv_' + Date.now(), id, name || current.name, sku || current.sku, current.stock_quantity, diff, Number(stock_quantity), adminName || 'Admin', now);
  }

  db.prepare(`
    UPDATE products
    SET name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        sku = COALESCE(?, sku),
        barcode = COALESCE(?, barcode),
        brand_id = ?,
        category_id = COALESCE(?, category_id),
        additional_category_ids = COALESCE(?, additional_category_ids),
        images = COALESCE(?, images),
        primary_image = COALESCE(?, primary_image),
        short_description = COALESCE(?, short_description),
        full_description = COALESCE(?, full_description),
        regular_price = COALESCE(?, regular_price),
        sale_price = ?,
        purchase_cost = COALESCE(?, purchase_cost),
        stock_quantity = COALESCE(?, stock_quantity),
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        condition = COALESCE(?, condition),
        warranty_period = COALESCE(?, warranty_period),
        is_featured = COALESCE(?, is_featured),
        is_best_seller = COALESCE(?, is_best_seller),
        is_new_arrival = COALESCE(?, is_new_arrival),
        is_active = COALESCE(?, is_active),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        specifications = COALESCE(?, specifications),
        variants = COALESCE(?, variants),
        updated_at = ?
    WHERE id = ?
  `).run(
    name,
    slug,
    sku,
    barcode,
    brand_id !== undefined ? (brand_id || null) : current.brand_id,
    category_id,
    additional_category_ids !== undefined ? JSON.stringify(additional_category_ids) : undefined,
    images !== undefined ? JSON.stringify(images) : undefined,
    primary_image,
    short_description,
    full_description,
    regular_price !== undefined ? Number(regular_price) : undefined,
    sale_price !== undefined ? (sale_price ? Number(sale_price) : null) : current.sale_price,
    purchase_cost !== undefined ? Number(purchase_cost) : undefined,
    stock_quantity !== undefined ? Number(stock_quantity) : undefined,
    low_stock_threshold !== undefined ? Number(low_stock_threshold) : undefined,
    condition,
    warranty_period,
    is_featured !== undefined ? (is_featured ? 1 : 0) : undefined,
    is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : undefined,
    is_new_arrival !== undefined ? (is_new_arrival ? 1 : 0) : undefined,
    is_active !== undefined ? (is_active ? 1 : 0) : undefined,
    seo_title,
    seo_description,
    specifications !== undefined ? JSON.stringify(specifications) : undefined,
    variants !== undefined ? JSON.stringify(variants) : undefined,
    now,
    id
  );

  logAudit(adminName || 'Admin', 'UPDATE_PRODUCT', 'Products', `Updated product ${name || current.name} (SKU: ${sku || current.sku})`);
  res.json({ success: true });
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const permanent = req.query.permanent === 'true';
  const adminName = (req.query.adminName as string) || 'Admin';

  if (permanent) {
    // Check if product is in any orders
    const orders = db.prepare('SELECT items FROM orders').all() as any[];
    let hasOrder = false;
    for (const ord of orders) {
      if (ord.items && ord.items.includes(id)) {
        hasOrder = true;
        break;
      }
    }

    if (hasOrder) {
      // Must archive to preserve historical order records
      db.prepare('UPDATE products SET is_archived = 1, is_active = 0 WHERE id = ?').run(id);
      logAudit(adminName, 'ARCHIVE_PRODUCT', 'Products', `Safely archived product ${id} because it is referenced in past orders.`);
      res.json({ success: true, archived: true, message: 'Product archived rather than permanently deleted to preserve historical order records.' });
      return;
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    logAudit(adminName, 'DELETE_PRODUCT', 'Products', `Permanently deleted product ${id}`);
    res.json({ success: true, message: 'Product deleted permanently.' });
  } else {
    // Archive
    db.prepare('UPDATE products SET is_archived = 1, is_active = 0 WHERE id = ?').run(id);
    logAudit(adminName, 'ARCHIVE_PRODUCT', 'Products', `Archived product ${id}`);
    res.json({ success: true, archived: true });
  }
});

// Bulk products action
apiRouter.post('/products/bulk', (req: Request, res: Response) => {
  const { ids, action, value, adminName } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'No product IDs provided' });
    return;
  }

  const now = new Date().toISOString();

  switch (action) {
    case 'activate':
      db.prepare(`UPDATE products SET is_active = 1, updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).run(now, ...ids);
      break;
    case 'deactivate':
      db.prepare(`UPDATE products SET is_active = 0, updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).run(now, ...ids);
      break;
    case 'archive':
      db.prepare(`UPDATE products SET is_archived = 1, is_active = 0, updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).run(now, ...ids);
      break;
    case 'adjust_price_percent':
      // Value is percentage change (e.g. +10 or -15)
      const multiplier = 1 + (Number(value) / 100);
      db.prepare(`UPDATE products SET regular_price = ROUND(regular_price * ?, 2), updated_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).run(multiplier, now, ...ids);
      break;
    default:
      res.status(400).json({ error: 'Invalid bulk action' });
      return;
  }

  logAudit(adminName || 'Admin', 'BULK_UPDATE_PRODUCTS', 'Products', `Executed bulk ${action} on ${ids.length} products`);
  res.json({ success: true, count: ids.length });
});

// CSV Export
apiRouter.get('/products/export/csv', (req: Request, res: Response) => {
  const products = db.prepare(`
    SELECT p.sku, p.name, p.regular_price, p.sale_price, p.purchase_cost, p.stock_quantity,
           p.condition, c.name as category, b.name as brand, p.is_active
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.is_archived = 0
  `).all() as any[];

  let csv = 'SKU,Name,Category,Brand,Price,SalePrice,Cost,Stock,Condition,Active\n';
  for (const p of products) {
    csv += `"${p.sku}","${(p.name || '').replace(/"/g, '""')}","${p.category || ''}","${p.brand || ''}",${p.regular_price},${p.sale_price || ''},${p.purchase_cost},${p.stock_quantity},"${p.condition}",${p.is_active}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="nextech-products.csv"');
  res.send(csv);
});

// ==========================================
// INVENTORY & STOCK MANAGEMENT
// ==========================================

apiRouter.get('/inventory', (req: Request, res: Response) => {
  const products = db.prepare(`
    SELECT p.id, p.name, p.sku, p.primary_image, p.stock_quantity, p.low_stock_threshold,
           p.purchase_cost, p.regular_price, p.sale_price, p.condition,
           c.name as category_name, b.name as brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.is_archived = 0
    ORDER BY (p.stock_quantity <= p.low_stock_threshold) DESC, p.stock_quantity ASC
  `).all() as any[];

  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;
  const totalStockItems = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.purchase_cost * p.stock_quantity), 0);

  res.json({
    products,
    metrics: {
      lowStockCount,
      outOfStockCount,
      totalStockItems,
      totalInventoryValue
    }
  });
});

apiRouter.post('/inventory/adjust', (req: Request, res: Response) => {
  const { productId, adjustmentAmount, reason, adminName } = req.body;
  if (!productId || adjustmentAmount === undefined) {
    res.status(400).json({ error: 'Product ID and adjustment amount are required' });
    return;
  }

  const product = db.prepare('SELECT id, name, sku, stock_quantity FROM products WHERE id = ?').get(productId) as any;
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const prev = product.stock_quantity;
  const next = Math.max(0, prev + Number(adjustmentAmount));
  const diff = next - prev;
  const now = new Date().toISOString();

  db.prepare('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?').run(next, now, productId);

  db.prepare(`
    INSERT INTO inventory_logs (id, product_id, product_name, sku, previous_stock, adjustment_amount, new_stock, reason, admin_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'inv_' + Date.now(),
    productId,
    product.name,
    product.sku,
    prev,
    diff,
    next,
    reason || 'Manual Adjustment',
    adminName || 'Admin',
    now
  );

  logAudit(adminName || 'Admin', 'INVENTORY_ADJUST', 'Inventory', `Adjusted stock for ${product.name} from ${prev} to ${next} (${reason})`);
  res.json({ success: true, newStock: next, previousStock: prev });
});

apiRouter.get('/inventory/logs', (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});

// ==========================================
// ORDERS & CHECKOUT
// ==========================================

apiRouter.post('/orders/checkout', (req: Request, res: Response) => {
  const {
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    items,
    coupon_code,
    shipping_method,
    payment_method,
    payment_details // test mode verification
  } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Incomplete checkout parameters' });
    return;
  }

  // SERVER-SIDE STOCK & PRICING VALIDATION
  const validatedItems: any[] = [];
  let subtotal = 0;
  let totalCost = 0;

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_archived = 0').get(item.productId) as any;
    if (!product) {
      res.status(400).json({ error: `Product ${item.name || item.productId} is no longer available.` });
      return;
    }

    if (product.stock_quantity < item.quantity) {
      res.status(400).json({
        error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, requested: ${item.quantity}.`
      });
      return;
    }

    // Determine actual unit price and cost
    let unitPrice = product.sale_price || product.regular_price;
    let unitCost = product.purchase_cost;
    let variantName = item.variantName || null;

    if (item.variantId && product.variants) {
      const vars = JSON.parse(product.variants);
      const matched = vars.find((v: any) => v.id === item.variantId);
      if (matched) {
        if (matched.price) unitPrice = matched.price;
        if (matched.cost) unitCost = matched.cost;
        variantName = matched.name;
      }
    }

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    totalCost += unitCost * item.quantity;

    validatedItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primary_image,
      variantId: item.variantId || null,
      variantName,
      unitPrice,
      unitCost,
      quantity: item.quantity,
      total: itemTotal
    });
  }

  // COUPON VALIDATION SERVER-SIDE
  let discountTotal = 0;
  if (coupon_code) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(coupon_code) as any;
    if (coupon) {
      if (subtotal >= (coupon.min_spend || 0)) {
        if (coupon.discount_type === 'percentage') {
          discountTotal = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount && discountTotal > coupon.max_discount) {
            discountTotal = coupon.max_discount;
          }
        } else {
          discountTotal = coupon.discount_value;
        }
        discountTotal = Math.min(subtotal, discountTotal);

        // Increment coupon usage
        db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?').run(coupon.id);
      }
    }
  }

  // SHIPPING & TAX
  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('settings_main') as any;
  const taxRate = settings?.tax_rate || 0.08;
  const freeThreshold = settings?.free_shipping_threshold || 1500;
  const standardFee = settings?.standard_shipping_rate || 25;
  const expressFee = settings?.express_shipping_rate || 45;

  let shippingFee = 0;
  if (shipping_method === 'express') {
    shippingFee = expressFee;
  } else {
    shippingFee = subtotal >= freeThreshold ? 0 : standardFee;
  }

  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = Math.round(taxableAmount * taxRate * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxTotal + shippingFee) * 100) / 100;

  // DEDUCT STOCK SAFELY & RECORD INVENTORY LOG
  const now = new Date().toISOString();
  const orderId = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

  for (const item of validatedItems) {
    db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?')
      .run(item.quantity, now, item.productId);

    const updatedProd = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.productId) as any;

    db.prepare(`
      INSERT INTO inventory_logs (id, product_id, product_name, sku, previous_stock, adjustment_amount, new_stock, reason, admin_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'System Checkout', ?)
    `).run(
      'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      item.productId,
      item.name,
      item.sku,
      updatedProd.stock_quantity + item.quantity,
      -item.quantity,
      updatedProd.stock_quantity,
      `Order Placement ${orderId}`,
      now
    );
  }

  // Payment Status
  const paymentStatus = payment_method === 'cod' ? 'Pending' : 'Paid';
  const fulfillmentStatus = 'Confirmed';

  db.prepare(`
    INSERT INTO orders (
      id, customer_id, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, items, subtotal, discount_total,
      coupon_code, tax_total, shipping_fee, shipping_method, total,
      total_cost, fulfillment_status, payment_status, payment_method,
      tracking_number, carrier, internal_notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?
    )
  `).run(
    orderId,
    customer_id || null,
    customer_name,
    customer_email,
    customer_phone,
    JSON.stringify(shipping_address),
    JSON.stringify(billing_address || shipping_address),
    JSON.stringify(validatedItems),
    subtotal,
    discountTotal,
    coupon_code || null,
    taxTotal,
    shippingFee,
    shipping_method || 'Standard Shipping',
    grandTotal,
    totalCost,
    fulfillmentStatus,
    paymentStatus,
    payment_method,
    now,
    now
  );

  const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  createdOrder.items = JSON.parse(createdOrder.items);
  createdOrder.shipping_address = JSON.parse(createdOrder.shipping_address);
  createdOrder.billing_address = JSON.parse(createdOrder.billing_address);

  res.status(201).json({ success: true, order: createdOrder });
});

apiRouter.get('/orders', (req: Request, res: Response) => {
  const { status, payment_status, search, customer_id } = req.query;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (customer_id) {
    query += ' AND customer_id = ?';
    params.push(customer_id);
  }

  if (status && status !== 'all') {
    query += ' AND fulfillment_status = ?';
    params.push(status);
  }

  if (payment_status && payment_status !== 'all') {
    query += ' AND payment_status = ?';
    params.push(payment_status);
  }

  if (search) {
    query += ' AND (id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';

  const orders = db.prepare(query).all(...params) as any[];
  const parsedOrders = orders.map((o) => ({
    ...o,
    items: o.items ? JSON.parse(o.items) : [],
    shipping_address: o.shipping_address ? JSON.parse(o.shipping_address) : {},
    billing_address: o.billing_address ? JSON.parse(o.billing_address) : {}
  }));

  res.json(parsedOrders);
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  order.items = order.items ? JSON.parse(order.items) : [];
  order.shipping_address = order.shipping_address ? JSON.parse(order.shipping_address) : {};
  order.billing_address = order.billing_address ? JSON.parse(order.billing_address) : {};

  res.json(order);
});

apiRouter.put('/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fulfillment_status, payment_status, tracking_number, carrier, internal_notes, adminName } = req.body;

  const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!current) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const now = new Date().toISOString();

  // If cancelling or returning, restock items safely
  if (fulfillment_status === 'Cancelled' && current.fulfillment_status !== 'Cancelled') {
    const items = JSON.parse(current.items);
    for (const it of items) {
      db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?')
        .run(it.quantity, now, it.productId);

      const prod = db.prepare('SELECT stock_quantity, name, sku FROM products WHERE id = ?').get(it.productId) as any;
      if (prod) {
        db.prepare(`
          INSERT INTO inventory_logs (id, product_id, product_name, sku, previous_stock, adjustment_amount, new_stock, reason, admin_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('inv_' + Date.now(), it.productId, prod.name, prod.sku, prod.stock_quantity - it.quantity, it.quantity, prod.stock_quantity, `Restocked from Cancelled Order ${id}`, adminName || 'Admin', now);
      }
    }
  }

  db.prepare(`
    UPDATE orders
    SET fulfillment_status = COALESCE(?, fulfillment_status),
        payment_status = COALESCE(?, payment_status),
        tracking_number = COALESCE(?, tracking_number),
        carrier = COALESCE(?, carrier),
        internal_notes = COALESCE(?, internal_notes),
        updated_at = ?
    WHERE id = ?
  `).run(fulfillment_status, payment_status, tracking_number, carrier, internal_notes, now, id);

  logAudit(adminName || 'Admin', 'UPDATE_ORDER', 'Orders', `Updated Order ${id} (Fulfillment: ${fulfillment_status || current.fulfillment_status}, Payment: ${payment_status || current.payment_status})`);
  res.json({ success: true });
});

// ==========================================
// DASHBOARD REAL DATABASE STATS & REPORTS
// ==========================================

apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const { range = '30d' } = req.query;

  // Real orders
  const orders = db.prepare('SELECT * FROM orders').all() as any[];
  const products = db.prepare('SELECT * FROM products WHERE is_archived = 0').all() as any[];
  const categories = db.prepare('SELECT * FROM categories').all() as any[];
  const brands = db.prepare('SELECT * FROM brands').all() as any[];
  const users = db.prepare('SELECT * FROM users').all() as any[];

  // Revenue & Gross Profit calculations
  let totalRevenue = 0;
  let totalCost = 0;
  let todayRevenue = 0;
  let monthlyRevenue = 0;
  let totalOrders = orders.length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const statusCounts: Record<string, number> = {
    Pending: 0,
    Confirmed: 0,
    Processing: 0,
    Packed: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
    Returned: 0
  };

  const salesByDay: Record<string, { date: string; revenue: number; profit: number; orders: number }> = {};

  for (const o of orders) {
    const isCancelled = o.fulfillment_status === 'Cancelled' || o.fulfillment_status === 'Returned';
    if (!isCancelled) {
      totalRevenue += o.total;
      totalCost += o.total_cost || 0;

      const orderDate = new Date(o.created_at);
      if (orderDate >= todayStart) {
        todayRevenue += o.total;
      }
      if (orderDate >= monthStart) {
        monthlyRevenue += o.total;
      }

      // Group by date (YYYY-MM-DD)
      const dayKey = orderDate.toISOString().split('T')[0];
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { date: dayKey, revenue: 0, profit: 0, orders: 0 };
      }
      const profit = o.total - (o.total_cost || 0);
      salesByDay[dayKey].revenue += o.total;
      salesByDay[dayKey].profit += profit;
      salesByDay[dayKey].orders += 1;
    }

    if (statusCounts[o.fulfillment_status] !== undefined) {
      statusCounts[o.fulfillment_status]++;
    } else {
      statusCounts[o.fulfillment_status] = 1;
    }
  }

  const grossProfit = Math.max(0, totalRevenue - totalCost);
  const profitMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100 * 10) / 10 : 0;

  // Best selling products from orders
  const productSalesMap: Record<string, { id: string; name: string; units: number; revenue: number; image: string }> = {};
  for (const o of orders) {
    if (o.fulfillment_status !== 'Cancelled') {
      const items = JSON.parse(o.items || '[]');
      for (const item of items) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            id: item.productId,
            name: item.name,
            units: 0,
            revenue: 0,
            image: item.primaryImage
          };
        }
        productSalesMap[item.productId].units += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      }
    }
  }

  const bestSellers = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Revenue by category
  const categoryRevenueMap: Record<string, number> = {};
  for (const p of products) {
    const catName = categories.find((c) => c.id === p.category_id)?.name || 'Other';
    const sales = productSalesMap[p.id]?.revenue || 0;
    categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + sales;
  }

  const categoryRevenue = Object.entries(categoryRevenueMap).map(([name, value]) => ({ name, value }));

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  const outOfStockProducts = products.filter((p) => p.stock_quantity <= 0);

  res.json({
    metrics: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      profitMarginPercent,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalOrders,
      totalCustomers: users.filter((u) => u.role === 'customer').length,
      totalProducts: products.length,
      totalCategories: categories.length,
      totalBrands: brands.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length
    },
    statusCounts,
    salesTimeline: Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date)),
    bestSellers,
    categoryRevenue,
    lowStockProducts: lowStockProducts.slice(0, 8),
    recentOrders: orders.slice(0, 6).map((o) => ({
      ...o,
      items: JSON.parse(o.items || '[]')
    }))
  });
});

// ==========================================
// COUPONS
// ==========================================

apiRouter.get('/coupons', (req: Request, res: Response) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  res.json(coupons);
});

apiRouter.post('/coupons', (req: Request, res: Response) => {
  const { code, description, discount_type, discount_value, min_spend, max_discount, usage_limit, is_active, adminName } = req.body;
  if (!code || !discount_value || !discount_type) {
    res.status(400).json({ error: 'Code, discount type, and value are required' });
    return;
  }

  const id = 'cpn_' + Date.now();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO coupons (id, code, description, discount_type, discount_value, min_spend, max_discount, usage_limit, times_used, is_active, created_at)
      VALUES (?, UPPER(?), ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, code, description || null, discount_type, Number(discount_value), Number(min_spend || 0), max_discount ? Number(max_discount) : null, Number(usage_limit || 100), is_active ?? 1, now);

    logAudit(adminName || 'Admin', 'CREATE_COUPON', 'Coupons', `Created coupon ${code.toUpperCase()}`);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/coupons/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { code, description, discount_type, discount_value, min_spend, max_discount, usage_limit, is_active, adminName } = req.body;

  db.prepare(`
    UPDATE coupons
    SET code = COALESCE(UPPER(?), code),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_spend = COALESCE(?, min_spend),
        max_discount = ?,
        usage_limit = COALESCE(?, usage_limit),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(code, description, discount_type, discount_value, min_spend, max_discount || null, usage_limit, is_active, id);

  logAudit(adminName || 'Admin', 'UPDATE_COUPON', 'Coupons', `Updated coupon ${id}`);
  res.json({ success: true });
});

apiRouter.delete('/coupons/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const adminName = (req.query.adminName as string) || 'Admin';
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  logAudit(adminName, 'DELETE_COUPON', 'Coupons', `Deleted coupon ${id}`);
  res.json({ success: true });
});

apiRouter.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code) as any;
  if (!coupon) {
    res.status(404).json({ error: 'Invalid or expired coupon code' });
    return;
  }

  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
    res.status(400).json({ error: 'This coupon has reached its maximum usage limit' });
    return;
  }

  if (coupon.min_spend && Number(subtotal || 0) < coupon.min_spend) {
    res.status(400).json({
      error: `Minimum spend of $${coupon.min_spend} required for coupon ${coupon.code}`
    });
    return;
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = ((Number(subtotal || 0)) * coupon.discount_value) / 100;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = coupon.discount_value;
  }

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    calculatedDiscount: Math.min(Number(subtotal || 0), Math.round(discount * 100) / 100)
  });
});

// ==========================================
// REVIEWS
// ==========================================

apiRouter.post('/reviews', (req: Request, res: Response) => {
  const { productId, userId, userName, rating, title, comment } = req.body;
  if (!productId || !userName || !rating || !comment) {
    res.status(400).json({ error: 'Product, reviewer name, rating, and review text are required' });
    return;
  }

  const id = 'rev_' + Date.now();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, comment, is_verified_purchase, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, productId, userId || null, userName, Number(rating), title || null, comment, now);

  // Recalculate product rating
  const avgRow = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ?
  `).get(productId) as { avg: number; count: number };

  db.prepare(`
    UPDATE products
    SET rating_average = ROUND(?, 1),
        rating_count = ?
    WHERE id = ?
  `).run(avgRow.avg || 5.0, avgRow.count, productId);

  res.status(201).json({ success: true, id });
});

// ==========================================
// SETTINGS
// ==========================================

apiRouter.get('/settings', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('settings_main') as any;
  if (settings) {
    settings.hero_slides = settings.hero_slides ? JSON.parse(settings.hero_slides) : [];
    try {
      settings.promo_slides = settings.promo_slides ? JSON.parse(settings.promo_slides) : defaultPromoSlides;
    } catch {
      settings.promo_slides = defaultPromoSlides;
    }
    settings.enabled_payment_methods = settings.enabled_payment_methods ? JSON.parse(settings.enabled_payment_methods) : ['card', 'cod'];
  }
  res.json(settings);
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const {
    store_name,
    store_email,
    store_phone,
    currency,
    tax_rate,
    free_shipping_threshold,
    standard_shipping_rate,
    express_shipping_rate,
    announcement_text,
    announcement_enabled,
    hero_slides,
    promo_slides,
    enabled_payment_methods,
    adminName
  } = req.body;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE settings
    SET store_name = COALESCE(?, store_name),
        store_email = COALESCE(?, store_email),
        store_phone = COALESCE(?, store_phone),
        currency = COALESCE(?, currency),
        tax_rate = COALESCE(?, tax_rate),
        free_shipping_threshold = COALESCE(?, free_shipping_threshold),
        standard_shipping_rate = COALESCE(?, standard_shipping_rate),
        express_shipping_rate = COALESCE(?, express_shipping_rate),
        announcement_text = COALESCE(?, announcement_text),
        announcement_enabled = COALESCE(?, announcement_enabled),
        hero_slides = COALESCE(?, hero_slides),
        promo_slides = COALESCE(?, promo_slides),
        enabled_payment_methods = COALESCE(?, enabled_payment_methods),
        updated_at = ?
    WHERE id = 'settings_main'
  `).run(
    store_name,
    store_email,
    store_phone,
    currency,
    tax_rate !== undefined ? Number(tax_rate) : undefined,
    free_shipping_threshold !== undefined ? Number(free_shipping_threshold) : undefined,
    standard_shipping_rate !== undefined ? Number(standard_shipping_rate) : undefined,
    express_shipping_rate !== undefined ? Number(express_shipping_rate) : undefined,
    announcement_text,
    announcement_enabled !== undefined ? (announcement_enabled ? 1 : 0) : undefined,
    hero_slides !== undefined ? (typeof hero_slides === 'string' ? hero_slides : JSON.stringify(hero_slides)) : undefined,
    promo_slides !== undefined ? (typeof promo_slides === 'string' ? promo_slides : JSON.stringify(promo_slides)) : undefined,
    enabled_payment_methods !== undefined ? (typeof enabled_payment_methods === 'string' ? enabled_payment_methods : JSON.stringify(enabled_payment_methods)) : undefined,
    now
  );

  logAudit(adminName || 'Admin', 'UPDATE_SETTINGS', 'Settings', 'Updated store settings & promotional content');
  res.json({ success: true });
});

// ==========================================
// PROMOTIONAL SLIDER MANAGEMENT ENDPOINTS
// ==========================================

apiRouter.get('/promo-slides', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT promo_slides FROM settings WHERE id = ?').get('settings_main') as any;
  let slides = defaultPromoSlides;
  if (settings && settings.promo_slides) {
    try {
      slides = JSON.parse(settings.promo_slides);
    } catch {
      slides = defaultPromoSlides;
    }
  }
  // Sort by display order
  slides.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
  res.json(slides);
});

apiRouter.post('/promo-slides', (req: Request, res: Response) => {
  const {
    title,
    subtitle,
    badge,
    discount_tag,
    image,
    buttonText,
    buttonLink,
    secondaryButtonText,
    secondaryButtonLink,
    accentColor,
    is_active,
    adminName
  } = req.body;

  if (!title || !image) {
    res.status(400).json({ error: 'Title and image are required' });
    return;
  }

  const settings = db.prepare('SELECT promo_slides FROM settings WHERE id = ?').get('settings_main') as any;
  let slides: any[] = [];
  if (settings && settings.promo_slides) {
    try {
      slides = JSON.parse(settings.promo_slides);
    } catch {
      slides = [...defaultPromoSlides];
    }
  } else {
    slides = [...defaultPromoSlides];
  }

  const newSlide = {
    id: 'promo_slide_' + Date.now(),
    badge: badge || 'FEATURED OFFER',
    title,
    subtitle: subtitle || '',
    discount_tag: discount_tag || '',
    image,
    buttonText: buttonText || 'Shop Collection',
    buttonLink: buttonLink || 'laptops',
    secondaryButtonText: secondaryButtonText || '',
    secondaryButtonLink: secondaryButtonLink || '',
    accentColor: accentColor || 'blue',
    display_order: slides.length + 1,
    is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1
  };

  slides.push(newSlide);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE settings
    SET promo_slides = ?, updated_at = ?
    WHERE id = 'settings_main'
  `).run(JSON.stringify(slides), now);

  logAudit(adminName || 'Admin', 'CREATE_PROMO_SLIDE', 'PromoSlider', `Created promotional slide: ${title}`);
  res.status(201).json({ success: true, slide: newSlide, slides });
});

apiRouter.put('/promo-slides/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const slideData = req.body;
  const adminName = slideData.adminName;

  const settings = db.prepare('SELECT promo_slides FROM settings WHERE id = ?').get('settings_main') as any;
  let slides: any[] = [];
  if (settings && settings.promo_slides) {
    try {
      slides = JSON.parse(settings.promo_slides);
    } catch {
      slides = [...defaultPromoSlides];
    }
  } else {
    slides = [...defaultPromoSlides];
  }

  const index = slides.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Promo slide not found' });
    return;
  }

  slides[index] = {
    ...slides[index],
    ...slideData,
    id // keep original ID
  };

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE settings
    SET promo_slides = ?, updated_at = ?
    WHERE id = 'settings_main'
  `).run(JSON.stringify(slides), now);

  logAudit(adminName || 'Admin', 'UPDATE_PROMO_SLIDE', 'PromoSlider', `Updated promotional slide: ${slides[index].title}`);
  res.json({ success: true, slide: slides[index], slides });
});

apiRouter.delete('/promo-slides/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const adminName = req.query.adminName as string;

  const settings = db.prepare('SELECT promo_slides FROM settings WHERE id = ?').get('settings_main') as any;
  let slides: any[] = [];
  if (settings && settings.promo_slides) {
    try {
      slides = JSON.parse(settings.promo_slides);
    } catch {
      slides = [...defaultPromoSlides];
    }
  } else {
    slides = [...defaultPromoSlides];
  }

  const deletedSlide = slides.find((s) => s.id === id);
  slides = slides.filter((s) => s.id !== id);

  // Re-index display orders
  slides.forEach((s, idx) => {
    s.display_order = idx + 1;
  });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE settings
    SET promo_slides = ?, updated_at = ?
    WHERE id = 'settings_main'
  `).run(JSON.stringify(slides), now);

  logAudit(adminName || 'Admin', 'DELETE_PROMO_SLIDE', 'PromoSlider', `Deleted promotional slide: ${deletedSlide?.title || id}`);
  res.json({ success: true, slides });
});

apiRouter.put('/promo-slides-reorder', (req: Request, res: Response) => {
  const { orderedIds, adminName } = req.body;
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'orderedIds array is required' });
    return;
  }

  const settings = db.prepare('SELECT promo_slides FROM settings WHERE id = ?').get('settings_main') as any;
  let slides: any[] = [];
  if (settings && settings.promo_slides) {
    try {
      slides = JSON.parse(settings.promo_slides);
    } catch {
      slides = [...defaultPromoSlides];
    }
  } else {
    slides = [...defaultPromoSlides];
  }

  // Create reordered list
  const reordered: any[] = [];
  orderedIds.forEach((id: string, index: number) => {
    const slide = slides.find((s) => s.id === id);
    if (slide) {
      slide.display_order = index + 1;
      reordered.push(slide);
    }
  });

  // Append any unmentioned slides at the end
  slides.forEach((s) => {
    if (!orderedIds.includes(s.id)) {
      s.display_order = reordered.length + 1;
      reordered.push(s);
    }
  });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE settings
    SET promo_slides = ?, updated_at = ?
    WHERE id = 'settings_main'
  `).run(JSON.stringify(reordered), now);

  logAudit(adminName || 'Admin', 'REORDER_PROMO_SLIDES', 'PromoSlider', `Reordered promotional slides`);
  res.json({ success: true, slides: reordered });
});

// ==========================================
// AUDIT LOGS
// ==========================================

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json(logs);
});
