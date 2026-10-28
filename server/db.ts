import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data folder exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'store.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      is_active INTEGER NOT NULL DEFAULT 1,
      phone TEXT,
      addresses TEXT, -- JSON array of addresses
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      parent_id TEXT,
      image_url TEXT,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      website TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      brand_id TEXT,
      category_id TEXT NOT NULL,
      additional_category_ids TEXT, -- JSON array
      images TEXT NOT NULL, -- JSON array of URLs
      primary_image TEXT NOT NULL,
      short_description TEXT,
      full_description TEXT,
      regular_price REAL NOT NULL,
      sale_price REAL,
      purchase_cost REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      condition TEXT NOT NULL DEFAULT 'New', -- New, Used, Refurbished
      warranty_period TEXT,
      is_featured INTEGER DEFAULT 0,
      is_best_seller INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      specifications TEXT, -- JSON object
      variants TEXT, -- JSON array
      rating_average REAL DEFAULT 4.8,
      rating_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      previous_stock INTEGER NOT NULL,
      adjustment_amount INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      admin_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
      discount_value REAL NOT NULL,
      min_spend REAL DEFAULT 0,
      max_discount REAL,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      category_id TEXT,
      starts_at TEXT,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL, -- JSON
      billing_address TEXT NOT NULL, -- JSON
      items TEXT NOT NULL, -- JSON array
      subtotal REAL NOT NULL,
      discount_total REAL DEFAULT 0,
      coupon_code TEXT,
      tax_total REAL NOT NULL,
      shipping_fee REAL NOT NULL,
      shipping_method TEXT NOT NULL,
      total REAL NOT NULL,
      total_cost REAL NOT NULL,
      fulfillment_status TEXT NOT NULL DEFAULT 'Pending',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      payment_method TEXT NOT NULL,
      tracking_number TEXT,
      carrier TEXT,
      internal_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT NOT NULL,
      is_verified_purchase INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      store_name TEXT NOT NULL,
      store_email TEXT NOT NULL,
      store_phone TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT '$',
      tax_rate REAL NOT NULL DEFAULT 0.08,
      free_shipping_threshold REAL NOT NULL DEFAULT 1500,
      standard_shipping_rate REAL NOT NULL DEFAULT 25,
      express_shipping_rate REAL NOT NULL DEFAULT 45,
      announcement_text TEXT,
      announcement_enabled INTEGER DEFAULT 1,
      hero_slides TEXT, -- JSON
      promo_slides TEXT, -- JSON
      enabled_payment_methods TEXT, -- JSON
      updated_at TEXT NOT NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE settings ADD COLUMN promo_slides TEXT;`);
  } catch {
    // Column already exists
  }

  seedInitialData();
  ensureAllCatalogProducts();
  ensurePromoSlidesInitialized();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  // 1. Seed Initial Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, phone, addresses, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr_admin',
    'Alexander Vance',
    'admin@nextech.com',
    'admin123', // Demo password
    'super_admin',
    1,
    '+1 (555) 019-2834',
    JSON.stringify([
      {
        id: 'addr_1',
        isDefault: true,
        street: '100 Silicon Way, Suite 400',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94107',
        country: 'United States'
      }
    ]),
    now,
    now
  );

  insertUser.run(
    'usr_product_mgr',
    'Sarah Lin',
    'products@nextech.com',
    'password123',
    'product_manager',
    1,
    '+1 (555) 019-8821',
    '[]',
    now,
    now
  );

  insertUser.run(
    'usr_support',
    'David Miller',
    'support@nextech.com',
    'password123',
    'customer_support',
    1,
    '+1 (555) 019-4412',
    '[]',
    now,
    now
  );

  insertUser.run(
    'usr_cust_alex',
    'Alex Johnson',
    'alex.customer@example.com',
    'customer123',
    'customer',
    1,
    '+1 (555) 234-5678',
    JSON.stringify([
      {
        id: 'addr_alex_1',
        isDefault: true,
        street: '742 Evergreen Terrace',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'United States'
      }
    ]),
    now,
    now
  );

  // 2. Seed Initial 24 Categories required by specification
  const initialCategories = [
    { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', icon: 'Laptop', desc: 'High-performance ultrabooks, powerhouses, and professional laptops.', parent_id: null, featured: 1, order: 1 },
    { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', icon: 'Gamepad2', desc: 'Extreme performance gaming laptops with high-refresh screens and dedicated RTX GPUs.', parent_id: 'cat_laptops', featured: 1, order: 2 },
    { id: 'cat_business_laptops', name: 'Business Laptops', slug: 'business-laptops', icon: 'Briefcase', desc: 'Secure, lightweight, durable laptops built for executives and power professionals.', parent_id: 'cat_laptops', featured: 1, order: 3 },
    { id: 'cat_used_refurb_laptops', name: 'Used and Refurbished Laptops', slug: 'used-and-refurbished-laptops', icon: 'Sparkles', desc: 'Factory-inspected, certified pre-owned laptops with full warranty guarantees.', parent_id: 'cat_laptops', featured: 0, order: 4 },
    { id: 'cat_desktop_computers', name: 'Desktop Computers', slug: 'desktop-computers', icon: 'Monitor', desc: 'Powerful desktop workstations, all-in-ones, and custom creator towers.', parent_id: null, featured: 1, order: 5 },
    { id: 'cat_laptop_accessories', name: 'Laptop Accessories', slug: 'laptop-accessories', icon: 'Package', desc: 'Docks, stands, protective gear, and essential laptop enhancements.', parent_id: null, featured: 1, order: 6 },
    { id: 'cat_speakers', name: 'Speakers', slug: 'speakers', icon: 'Speaker', desc: 'Premium Hi-Fi wireless, Bluetooth, and bookshelf sound systems.', parent_id: null, featured: 1, order: 7 },
    { id: 'cat_headphones', name: 'Headphones and Earphones', slug: 'headphones-and-earphones', icon: 'Headphones', desc: 'Studio-grade noise cancelling headphones and true wireless earbuds.', parent_id: null, featured: 1, order: 8 },
    { id: 'cat_keyboards', name: 'Keyboards', slug: 'keyboards', icon: 'Keyboard', desc: 'Custom mechanical, low-profile wireless, and ergonomic gaming keyboards.', parent_id: null, featured: 0, order: 9 },
    { id: 'cat_mice', name: 'Computer Mice', slug: 'computer-mice', icon: 'Mouse', desc: 'Precision optical mice, ergonomic mice, and ultra-lightweight esports pointers.', parent_id: null, featured: 0, order: 10 },
    { id: 'cat_monitors', name: 'Monitors and Displays', slug: 'monitors-and-displays', icon: 'Tv', desc: 'UltraWide OLED, 4K color-accurate, and ultra-fast gaming monitors.', parent_id: null, featured: 1, order: 11 },
    { id: 'cat_gaming_acc', name: 'Gaming Accessories', slug: 'gaming-accessories', icon: 'Gamepad', desc: 'Gamepads, flight sticks, mousepads, and specialized streaming decks.', parent_id: null, featured: 0, order: 12 },
    { id: 'cat_printers_scanners', name: 'Printers and Scanners', slug: 'printers-and-scanners', icon: 'Printer', desc: 'All-in-one wireless laser printers, document scanners, and photo printers.', parent_id: null, featured: 0, order: 13 },
    { id: 'cat_storage_ssds', name: 'Storage Devices and SSDs', slug: 'storage-devices-and-ssds', icon: 'HardDrive', desc: 'Blazing-fast PCIe Gen 5 NVMe SSDs and rugged portable backup drives.', parent_id: null, featured: 0, order: 14 },
    { id: 'cat_ram_components', name: 'RAM and Computer Components', slug: 'ram-and-computer-components', icon: 'Cpu', desc: 'High-frequency DDR5 memory kits, motherboards, and PC components.', parent_id: null, featured: 0, order: 15 },
    { id: 'cat_graphics_cards', name: 'Graphics Cards', slug: 'graphics-cards', icon: 'Layers', desc: 'Flagship NVIDIA GeForce and AMD Radeon graphics processors for 4K gaming.', parent_id: null, featured: 0, order: 16 },
    { id: 'cat_chargers_power', name: 'Chargers and Power Adapters', slug: 'chargers-and-power-adapters', icon: 'Zap', desc: 'GaN fast chargers, USB-C Power Delivery bricks, and travel converters.', parent_id: null, featured: 0, order: 17 },
    { id: 'cat_laptop_batteries', name: 'Laptop Batteries', slug: 'laptop-batteries', icon: 'BatteryCharging', desc: 'OEM grade replacement battery packs and high-capacity battery power banks.', parent_id: null, featured: 0, order: 18 },
    { id: 'cat_laptop_bags', name: 'Laptop Bags and Backpacks', slug: 'laptop-bags-and-backpacks', icon: 'ShoppingBag', desc: 'Weather-resistant commuter backpacks and protective ballistic nylon sleeves.', parent_id: null, featured: 0, order: 19 },
    { id: 'cat_cooling_pads', name: 'Cooling Pads', slug: 'cooling-pads', icon: 'Fan', desc: 'High-RPM filtered air turbo cooling pads for intensive gaming and rendering.', parent_id: null, featured: 0, order: 20 },
    { id: 'cat_webcams_mics', name: 'Webcams and Microphones', slug: 'webcams-and-microphones', icon: 'Camera', desc: '4K AI webcams and broadcast studio cardioid microphones.', parent_id: null, featured: 0, order: 21 },
    { id: 'cat_networking', name: 'Networking Devices', slug: 'networking-devices', icon: 'Wifi', desc: 'Wi-Fi 7 mesh routers, high-speed switches, and gigabit adapters.', parent_id: null, featured: 0, order: 22 },
    { id: 'cat_cables_adapters', name: 'Cables and Adapters', slug: 'cables-and-adapters', icon: 'Cable', desc: 'Thunderbolt 4, HDMI 2.1 8K cables, and multi-port dongles.', parent_id: null, featured: 0, order: 23 },
    { id: 'cat_other_electronics', name: 'Other Electronics', slug: 'other-electronics', icon: 'Radio', desc: 'Smart tech gadgets, smart home hubs, and cutting-edge electronic tools.', parent_id: null, featured: 0, order: 24 },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description, parent_id, image_url, icon, display_order, is_active, is_featured, seo_title, seo_description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of initialCategories) {
    insertCategory.run(
      c.id,
      c.name,
      c.slug,
      c.desc,
      c.parent_id,
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      c.icon,
      c.order,
      1,
      c.featured,
      `${c.name} | NexTech Premium Store`,
      c.desc,
      now,
      now
    );
  }

  // 3. Seed Initial Brands
  const initialBrands = [
    { id: 'br_apple', name: 'Apple', slug: 'apple', desc: 'Pioneering MacBook Pro and consumer electronics known for M-series silicon.', website: 'https://apple.com', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_asus', name: 'ASUS ROG', slug: 'asus', desc: 'Industry-leading gaming laptops, motherboards, and ROG performance gear.', website: 'https://asus.com', logo: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_dell', name: 'Dell', slug: 'dell', desc: 'XPS flagship ultrabooks and enterprise precision workstations.', website: 'https://dell.com', logo: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_lenovo', name: 'Lenovo', slug: 'lenovo', desc: 'Legion gaming laptops and legendary ThinkPad productivity champions.', website: 'https://lenovo.com', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_hp', name: 'HP', slug: 'hp', desc: 'OMEN gaming rigs and Spectre luxury convertible laptops.', website: 'https://hp.com', logo: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_razer', name: 'Razer', slug: 'razer', desc: 'For Gamers. By Gamers. Premium CNC aluminum laptops and esports peripherals.', website: 'https://razer.com', logo: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_sony', name: 'Sony', slug: 'sony', desc: 'World-class noise cancelling audio, headphones, and home entertainment.', website: 'https://sony.com', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_jbl', name: 'JBL', slug: 'jbl', desc: 'Pro sound portable speakers, partyboxes, and waterproof acoustics.', website: 'https://jbl.com', logo: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_logitech', name: 'Logitech', slug: 'logitech', desc: 'Master Series productivity mice, mechanical keyboards, and webcams.', website: 'https://logitech.com', logo: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=200&q=80', featured: 1 },
  ];

  const insertBrand = db.prepare(`
    INSERT INTO brands (id, name, slug, logo_url, description, is_active, is_featured, website, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of initialBrands) {
    insertBrand.run(b.id, b.name, b.slug, b.logo, b.desc, 1, b.featured, b.website, now, now);
  }

  // 4. Seed Initial Products (Laptops, Speakers, Accessories, Monitors, etc.)
  const initialProducts = [
    {
      id: 'prod_macbook_pro_16',
      name: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB SSD)',
      slug: 'apple-macbook-pro-16-m3-max',
      sku: 'APP-MBP16-M3M-01',
      barcode: '195949120931',
      brand_id: 'br_apple',
      category_id: 'cat_laptops',
      additional_categories: ['cat_business_laptops'],
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Extreme workstation performance with the 14-core Apple M3 Max, Liquid Retina XDR display, and up to 22 hours of battery life.',
      full_description: 'The 16-inch MacBook Pro blasts forward with M3 Max, an extraordinarily advanced chip that brings unprecedented power and efficiency for the most demanding workflows like complex 3D rendering, video color grading, and running large language models locally. Features stunning Liquid Retina XDR screen with 1600 nits peak brightness and comprehensive pro ports.',
      regular_price: 3499.00,
      sale_price: 3299.00,
      purchase_cost: 2600.00,
      stock_quantity: 14,
      low_stock_threshold: 4,
      condition: 'New',
      warranty_period: '1 Year AppleCare Warranty included',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'Apple M3 Max (14-core CPU, 30-core GPU)',
        processor_generation: '3nm Apple Silicon Gen 3',
        ram_capacity: '36GB Unified Memory',
        storage: '1TB Superfast PCIe Gen 4 SSD',
        graphics_card: 'Integrated 30-Core GPU with Hardware Ray Tracing',
        screen_size: '16.2 inch Liquid Retina XDR',
        screen_resolution: '3456 x 2234 (254 ppi)',
        refresh_rate: '120Hz ProMotion',
        operating_system: 'macOS Sonoma',
        battery_info: '100Wh Li-Polymer (Up to 22 hrs)',
        keyboard_layout: 'Magic Keyboard with Touch ID, US ANSI',
        color: 'Space Black',
        connectivity_ports: '3x Thunderbolt 4 (USB-C), HDMI 2.1, SDXC card slot, MagSafe 3, 3.5mm headphone jack'
      },
      variants: [
        { id: 'var_mbp_36gb', name: '36GB Unified RAM / 1TB SSD', sku: 'APP-MBP16-M3M-01', price: 3299, cost: 2600, stock: 10 },
        { id: 'var_mbp_48gb', name: '48GB Unified RAM / 2TB SSD', sku: 'APP-MBP16-M3M-02', price: 3999, cost: 3100, stock: 4 }
      ],
      rating_average: 4.9,
      rating_count: 38
    },
    {
      id: 'prod_rog_strix_scar_18',
      name: 'ASUS ROG Strix SCAR 18 (RTX 4090, i9-14900HX, 64GB, 2TB SSD)',
      slug: 'asus-rog-strix-scar-18-rtx-4090',
      sku: 'ASUS-ROG-SCAR18-01',
      barcode: '197105439812',
      brand_id: 'br_asus',
      category_id: 'cat_gaming_laptops',
      additional_categories: ['cat_laptops'],
      images: [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85',
      short_description: 'The pinnacle of Windows gaming: Intel Core i9-14900HX, NVIDIA GeForce RTX 4090 175W TGP, and an 18-inch 2.5K 240Hz Mini LED Nebula HDR display.',
      full_description: 'Dominate the battlefield with the ROG Strix SCAR 18. Equipped with an Intel Core i9-14900HX processor and NVIDIA GeForce RTX 4090 Laptop GPU with 175W max TGP, liquid metal Conductonaut Extreme on both CPU and GPU, Tri-Fan technology, and full-surround vents.',
      regular_price: 3899.00,
      sale_price: 3699.00,
      purchase_cost: 2950.00,
      stock_quantity: 8,
      low_stock_threshold: 3,
      condition: 'New',
      warranty_period: '2 Years Global ROG Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'Intel Core i9-14900HX (24 cores, 32 threads, up to 5.8 GHz)',
        processor_generation: '14th Gen Raptor Lake Refresh',
        ram_capacity: '64GB DDR5 5600MHz Dual Channel',
        storage: '2TB (2x 1TB PCIe 4.0 NVMe RAID 0)',
        graphics_card: 'NVIDIA GeForce RTX 4090 16GB GDDR6 (175W TGP)',
        screen_size: '18 inch ROG Nebula HDR Mini LED',
        screen_resolution: '2560 x 1600 (QHD+ 16:10)',
        refresh_rate: '240Hz / 3ms G-Sync',
        operating_system: 'Windows 11 Home',
        battery_info: '90Whr with 330W Adapter',
        keyboard_layout: 'Per-Key RGB Backlit with NumberPad',
        color: 'Off Black with Cyberpunk Accents',
        connectivity_ports: '1x Thunderbolt 4, 1x USB-C 3.2 Gen 2, 2x USB-A 3.2, 1x HDMI 2.1 FRL, 1x 2.5G LAN, 1x 3.5mm combo'
      },
      variants: [
        { id: 'var_scar_32gb', name: '32GB RAM / 1TB SSD', sku: 'ASUS-ROG-SCAR18-32', price: 3399, cost: 2650, stock: 5 },
        { id: 'var_scar_64gb', name: '64GB RAM / 2TB SSD', sku: 'ASUS-ROG-SCAR18-64', price: 3699, cost: 2950, stock: 3 }
      ],
      rating_average: 4.8,
      rating_count: 24
    },
    {
      id: 'prod_lenovo_thinkpad_x1',
      name: 'Lenovo ThinkPad X1 Carbon Gen 12 (Core Ultra 7, 32GB, 1TB SSD)',
      slug: 'lenovo-thinkpad-x1-carbon-gen-12',
      sku: 'LEN-X1C-G12-01',
      barcode: '197532891244',
      brand_id: 'br_lenovo',
      category_id: 'cat_business_laptops',
      additional_categories: ['cat_laptops'],
      images: [
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Ultralight carbon-fiber chassis weighing just 1.09 kg, Intel Core Ultra 7 with dedicated NPU for enterprise AI workloads, and legendary spill-resistant keyboard.',
      full_description: 'Engineered for executive mobility, the ThinkPad X1 Carbon Gen 12 redefines corporate agility. Features Intel Core Ultra with built-in Intel AI Boost NPU, OLED 2.8K display with anti-reflective coating, dTPM 2.0 security chip, and MIL-SPEC 810H durability testing.',
      regular_price: 2249.00,
      sale_price: 1999.00,
      purchase_cost: 1550.00,
      stock_quantity: 19,
      low_stock_threshold: 5,
      condition: 'New',
      warranty_period: '3 Years Lenovo Premier Onsite Support',
      is_featured: 1,
      is_best_seller: 0,
      is_new_arrival: 1,
      specifications: {
        processor: 'Intel Core Ultra 7 155H (16 Cores, up to 4.8 GHz)',
        processor_generation: 'Intel Meteor Lake with AI NPU',
        ram_capacity: '32GB LPDDR5X 6400MHz',
        storage: '1TB M.2 PCIe Gen 4 NVMe Opal 2.0',
        graphics_card: 'Intel Arc Graphics',
        screen_size: '14.0 inch 2.8K OLED Display',
        screen_resolution: '2880 x 1800 (16:10, 400 nits)',
        refresh_rate: '120Hz',
        operating_system: 'Windows 11 Pro 64-bit',
        battery_info: '57Whr Rapid Charge (Up to 14 hrs)',
        keyboard_layout: 'TrackPoint + Glass Haptic TouchPad, Backlit',
        color: 'Deep Carbon Black',
        connectivity_ports: '2x Thunderbolt 4, 2x USB-A 3.2 Gen 1, 1x HDMI 2.1, 1x Headphone/mic jack, Nano SIM slot'
      },
      variants: [
        { id: 'var_x1_32gb', name: '32GB RAM / 1TB SSD', sku: 'LEN-X1C-G12-01', price: 1999, cost: 1550, stock: 19 }
      ],
      rating_average: 4.9,
      rating_count: 17
    },
    {
      id: 'prod_dell_xps_15_refurb',
      name: 'Dell XPS 15 9530 (Certified Refurbished, i7-13700H, 16GB, 512GB, RTX 4050)',
      slug: 'dell-xps-15-9530-certified-refurbished',
      sku: 'DEL-XPS15-REF-01',
      barcode: '196801923184',
      brand_id: 'br_dell',
      category_id: 'cat_used_refurb_laptops',
      additional_categories: ['cat_laptops'],
      images: [
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Factory certified refurbished Dell XPS 15. Thoroughly tested, cleaned, and repackaged with authentic Dell charger and 1-year direct warranty.',
      full_description: 'Enjoy flagship creator capabilities at huge savings. The certified refurbished Dell XPS 15 features an aerospace-grade CNC aluminum chassis, carbon fiber palm rest, 15.6" InfinityEdge display, and NVIDIA RTX 4050 graphics for video editing and multitasking.',
      regular_price: 1899.00,
      sale_price: 1299.00,
      purchase_cost: 950.00,
      stock_quantity: 6,
      low_stock_threshold: 2,
      condition: 'Refurbished',
      warranty_period: '1 Year Certified Refurbished Warranty',
      is_featured: 1,
      is_best_seller: 0,
      is_new_arrival: 0,
      specifications: {
        processor: 'Intel Core i7-13700H (14 cores, up to 5.0 GHz)',
        processor_generation: '13th Gen Intel Core',
        ram_capacity: '16GB DDR5 4800MHz',
        storage: '512GB PCIe NVMe SSD',
        graphics_card: 'NVIDIA GeForce RTX 4050 6GB GDDR6 (40W)',
        screen_size: '15.6 inch FHD+ InfinityEdge',
        screen_resolution: '1920 x 1200 (500 nits sRGB 100%)',
        refresh_rate: '60Hz',
        operating_system: 'Windows 11 Home',
        battery_info: '86Whr Integrated Battery',
        keyboard_layout: 'Backlit English Keyboard with Fingerprint Reader',
        color: 'Platinum Silver exterior, Black interior',
        connectivity_ports: '2x Thunderbolt 4, 1x USB-C 3.2 Gen 2, Full-size SD Card Reader, 3.5mm combo'
      },
      variants: [
        { id: 'var_xps_16_512', name: '16GB RAM / 512GB SSD', sku: 'DEL-XPS15-REF-01', price: 1299, cost: 950, stock: 6 }
      ],
      rating_average: 4.7,
      rating_count: 12
    },
    {
      id: 'prod_jbl_boombox_3',
      name: 'JBL Boombox 3 Wi-Fi & Bluetooth Portable Speaker',
      slug: 'jbl-boombox-3-wifi-portable-speaker',
      sku: 'JBL-BB3-WIFI-01',
      barcode: '050036391023',
      brand_id: 'br_jbl',
      category_id: 'cat_speakers',
      additional_categories: ['cat_other_electronics'],
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Massive JBL Original Pro Sound with Dolby Atmos over Wi-Fi, 24 hours of playtime, and IP67 waterproof and dustproof protection.',
      full_description: 'The JBL Boombox 3 Wi-Fi delivers massive pro sound with the deepest bass from a portable speaker. Stream HD audio anywhere, including 3D Dolby Atmos via Wi-Fi. Taking a call or scrolling your feed? Go ahead—it won’t interrupt your music.',
      regular_price: 599.95,
      sale_price: 499.95,
      purchase_cost: 340.00,
      stock_quantity: 22,
      low_stock_threshold: 5,
      condition: 'New',
      warranty_period: '1 Year JBL Manufacturer Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        speaker_type: 'Portable High-Power Wireless Speaker',
        connectivity: 'Wi-Fi 6 (802.11ax), Bluetooth 5.3, 3.5mm Aux in',
        output_power: '1x 80W RMS subwoofer + 2x 40W RMS midrange + 2x 10W RMS tweeter (AC mode)',
        battery_life: 'Up to 24 Hours (9600mAh Li-ion)',
        waterproof_rating: 'IP67 Waterproof and Dustproof',
        compatible_devices: 'AirPlay, Alexa Multi-Room Music, Chromecast built-in, Spotify Connect, iOS & Android',
        warranty: '1 Year Official Warranty',
        color: 'Midnight Black'
      },
      variants: [
        { id: 'var_jbl_black', name: 'Midnight Black', sku: 'JBL-BB3-BLK', price: 499.95, cost: 340, stock: 15 },
        { id: 'var_jbl_camo', name: 'Squad Camouflage', sku: 'JBL-BB3-CAMO', price: 519.95, cost: 350, stock: 7 }
      ],
      rating_average: 4.9,
      rating_count: 53
    },
    {
      id: 'prod_sony_wh1000xm5',
      name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
      sku: 'SNY-WH1000XM5-01',
      barcode: '027242923980',
      brand_id: 'br_sony',
      category_id: 'cat_headphones',
      additional_categories: ['cat_laptop_accessories'],
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Industry-leading noise cancellation with two processors and 8 microphones. Hi-Res Audio Wireless and crystal clear hands-free calls.',
      full_description: 'Our industry-leading noise cancelling with two processors and eight microphones keeps out more high and mid-frequency sounds than ever. Specially designed 30mm driver unit with carbon fiber composite TPU edge provides magnificent acoustics.',
      regular_price: 399.99,
      sale_price: 349.99,
      purchase_cost: 230.00,
      stock_quantity: 35,
      low_stock_threshold: 8,
      condition: 'New',
      warranty_period: '1 Year Sony Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 0,
      specifications: {
        speaker_type: 'Over-Ear Active Noise Cancelling Headphones',
        connectivity: 'Bluetooth 5.2 (LDAC, AAC, SBC) & 3.5mm Gold Plated Stereo',
        battery_life: 'Up to 30 Hours with ANC on (40 hrs ANC off)',
        weight: '250 grams ultra-lightweight',
        color: 'Silver / Platinum',
        warranty: '1 Year Parts & Labor'
      },
      variants: [
        { id: 'var_sony_silver', name: 'Platinum Silver', sku: 'SNY-WH1000XM5-SLV', price: 349.99, cost: 230, stock: 20 },
        { id: 'var_sony_black', name: 'Matte Black', sku: 'SNY-WH1000XM5-BLK', price: 349.99, cost: 230, stock: 15 }
      ],
      rating_average: 4.8,
      rating_count: 89
    },
    {
      id: 'prod_logitech_mx_master_3s',
      name: 'Logitech MX Master 3S Performance Wireless Mouse',
      slug: 'logitech-mx-master-3s-wireless-mouse',
      sku: 'LOG-MXM3S-01',
      barcode: '097855174542',
      brand_id: 'br_logitech',
      category_id: 'cat_mice',
      additional_categories: ['cat_laptop_accessories'],
      images: [
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Quiet Click technology, 8000 DPI track-on-glass sensor, and MagSpeed electromagnetic scrolling for supreme precision.',
      full_description: 'An icon remastered. Experience every moment of your workflow with even more precision, tactility, and performance, thanks to Quiet Clicks and an 8,000 DPI track-on-glass sensor. Work seamlessly across up to 3 computers with Flow cross-computer control.',
      regular_price: 119.99,
      sale_price: 99.99,
      purchase_cost: 65.00,
      stock_quantity: 45,
      low_stock_threshold: 10,
      condition: 'New',
      warranty_period: '1 Year Limited Hardware Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 0,
      specifications: {
        sensor: '8000 DPI Darkfield High Precision',
        buttons: '7 customizable buttons (Left/Right, Back/Forward, App-Switch, Wheel Mode Shift, Middle Click)',
        connectivity: 'Bluetooth Low Energy & Logi Bolt USB Receiver',
        battery_life: 'Up to 70 days on a single full charge (USB-C)',
        color: 'Graphite'
      },
      variants: [
        { id: 'var_mxm3s_graphite', name: 'Graphite', sku: 'LOG-MXM3S-GRP', price: 99.99, cost: 65, stock: 30 },
        { id: 'var_mxm3s_pale', name: 'Pale Gray', sku: 'LOG-MXM3S-GRY', price: 99.99, cost: 65, stock: 15 }
      ],
      rating_average: 4.9,
      rating_count: 142
    },
    {
      id: 'prod_lg_ultragear_34_oled',
      name: 'LG UltraGear 34" Curved WQHD OLED Gaming Monitor (240Hz, 0.03ms)',
      slug: 'lg-ultragear-34-curved-oled-gaming-monitor',
      sku: 'LG-34GS95QE-01',
      barcode: '719192663922',
      brand_id: 'br_asus',
      category_id: 'cat_monitors',
      additional_categories: ['cat_gaming_acc'],
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85'
      ],
      primary_image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
      short_description: 'Immersive 800R curved OLED display with 0.03ms response time, 240Hz refresh rate, and 98.5% DCI-P3 color gamut.',
      full_description: 'Step into true gaming immersion with LG UltraGear OLED. Featuring infinite 1,500,000:1 contrast ratio, VESA DisplayHDR True Black 400, NVIDIA G-SYNC compatible and AMD FreeSync Premium Pro certification.',
      regular_price: 1299.99,
      sale_price: 999.99,
      purchase_cost: 720.00,
      stock_quantity: 7,
      low_stock_threshold: 3,
      condition: 'New',
      warranty_period: '2 Years Manufacturer Warranty with OLED burn-in coverage',
      is_featured: 1,
      is_best_seller: 0,
      is_new_arrival: 1,
      specifications: {
        screen_size: '34 inch Curved 800R OLED',
        screen_resolution: '3440 x 1440 (UltraWide QHD 21:9)',
        refresh_rate: '240Hz with 0.03ms GtG response',
        color_gamut: 'DCI-P3 98.5% (CIE1976)',
        connectivity_ports: '2x HDMI 2.1, 1x DisplayPort 1.4, 1x USB Upstream, 2x USB Downstream, 4-pole Headphone out'
      },
      variants: [
        { id: 'var_lg_34', name: 'Standard 34-inch 800R', sku: 'LG-34GS95QE-01', price: 999.99, cost: 720, stock: 7 }
      ],
      rating_average: 4.8,
      rating_count: 29
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, name, slug, sku, barcode, brand_id, category_id, additional_category_ids,
      images, primary_image, short_description, full_description, regular_price,
      sale_price, purchase_cost, stock_quantity, low_stock_threshold, condition,
      warranty_period, is_featured, is_best_seller, is_new_arrival, is_active,
      is_archived, seo_title, seo_description, specifications, variants,
      rating_average, rating_count, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const p of initialProducts) {
    insertProduct.run(
      p.id,
      p.name,
      p.slug,
      p.sku,
      p.barcode,
      p.brand_id,
      p.category_id,
      JSON.stringify(p.additional_categories),
      JSON.stringify(p.images),
      p.primary_image,
      p.short_description,
      p.full_description,
      p.regular_price,
      p.sale_price,
      p.purchase_cost,
      p.stock_quantity,
      p.low_stock_threshold,
      p.condition,
      p.warranty_period,
      p.is_featured,
      p.is_best_seller,
      p.is_new_arrival,
      1,
      0,
      `${p.name} | NexTech`,
      p.short_description,
      JSON.stringify(p.specifications),
      JSON.stringify(p.variants),
      p.rating_average,
      p.rating_count,
      now,
      now
    );
  }

  // 5. Seed Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, description, discount_type, discount_value, min_spend, max_discount, usage_limit, times_used, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCoupon.run('cpn_welcome10', 'WELCOME10', 'Get 10% off your entire first order', 'percentage', 10, 50, 200, 500, 34, 1, now);
  insertCoupon.run('cpn_laptop100', 'LAPTOP100', '$100 off premium laptops over $1500', 'fixed', 100, 1500, null, 100, 19, 1, now);
  insertCoupon.run('cpn_flash20', 'FLASH20', '20% discount on electronics and accessories', 'percentage', 20, 100, 150, 50, 42, 1, now);

  // 6. Seed Initial Settings
  const insertSettings = db.prepare(`
    INSERT INTO settings (id, store_name, store_email, store_phone, currency, tax_rate, free_shipping_threshold, standard_shipping_rate, express_shipping_rate, announcement_text, announcement_enabled, hero_slides, enabled_payment_methods, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSettings.run(
    'settings_main',
    'NexTech Electronics',
    'sales@nextech-store.com',
    '+1 (800) 555-TECH',
    '$',
    0.08,
    1500,
    25.00,
    45.00,
    '🔥 Spring Flagship Event: Save up to $400 on RTX 40-Series Laptops + Free Express Shipping on orders over $1,500!',
    1,
    JSON.stringify([
      {
        id: 'slide_1',
        tag: 'FLAGSHIP LAPTOPS 2026',
        title: 'Unleash Next-Gen Computing Power',
        subtitle: 'Engineered for extreme creative workloads and pro esports. Featuring M3 Max, Core Ultra, and RTX 4090 architecture.',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=85',
        buttonText: 'Explore Pro Laptops',
        buttonLink: '/shop?category=laptops'
      },
      {
        id: 'slide_2',
        tag: 'STUDIO & WIRELESS SOUND',
        title: 'Audiophile Acoustic Precision',
        subtitle: 'Experience breathtaking clarity with JBL Boombox, Sony ANC headsets, and premium sound gear.',
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1600&q=85',
        buttonText: 'Shop Speakers & Audio',
        buttonLink: '/shop?category=speakers'
      }
    ]),
    JSON.stringify(['card', 'cod']),
    now
  );

  // 7. Seed Initial Orders (real database records for realistic statistics and profit calculation)
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_id, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, items, subtotal, discount_total,
      coupon_code, tax_total, shipping_fee, shipping_method, total,
      total_cost, fulfillment_status, payment_status, payment_method,
      tracking_number, carrier, internal_notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const sampleAddress = {
    street: '742 Evergreen Terrace',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'United States'
  };

  const pastDate1 = new Date(Date.now() - 86400000 * 2).toISOString();
  const pastDate2 = new Date(Date.now() - 86400000 * 5).toISOString();
  const pastDate3 = new Date(Date.now() - 86400000 * 12).toISOString();

  // Order 1: Delivered Apple MacBook Pro
  insertOrder.run(
    'ORD-2026-1001',
    'usr_cust_alex',
    'Alex Johnson',
    'alex.customer@example.com',
    '+1 (555) 234-5678',
    JSON.stringify(sampleAddress),
    JSON.stringify(sampleAddress),
    JSON.stringify([
      {
        productId: 'prod_macbook_pro_16',
        name: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB SSD)',
        sku: 'APP-MBP16-M3M-01',
        primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
        variantId: 'var_mbp_36gb',
        variantName: '36GB Unified RAM / 1TB SSD',
        unitPrice: 3299.00,
        unitCost: 2600.00,
        quantity: 1,
        total: 3299.00
      }
    ]),
    3299.00,
    100.00,
    'LAPTOP100',
    255.92,
    0.00,
    'Free Express Shipping (Over $1500)',
    3454.92,
    2600.00, // Total cost
    'Delivered',
    'Paid',
    'card',
    'FEDEX-9481923091',
    'FedEx Priority Overnight',
    'Customer requested signature on delivery. Successfully delivered to front desk.',
    pastDate3,
    pastDate3
  );

  // Order 2: Shipped ASUS ROG Strix SCAR 18
  insertOrder.run(
    'ORD-2026-1002',
    'usr_cust_alex',
    'Marcus Brody',
    'm.brody@gamemail.com',
    '+1 (555) 782-9901',
    JSON.stringify({ ...sampleAddress, street: '450 Tech Plaza', city: 'Austin', state: 'TX', postalCode: '78701' }),
    JSON.stringify({ ...sampleAddress, street: '450 Tech Plaza', city: 'Austin', state: 'TX', postalCode: '78701' }),
    JSON.stringify([
      {
        productId: 'prod_rog_strix_scar_18',
        name: 'ASUS ROG Strix SCAR 18 (RTX 4090, i9-14900HX, 64GB, 2TB SSD)',
        sku: 'ASUS-ROG-SCAR18-01',
        primaryImage: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80',
        variantId: 'var_scar_64gb',
        variantName: '64GB RAM / 2TB SSD',
        unitPrice: 3699.00,
        unitCost: 2950.00,
        quantity: 1,
        total: 3699.00
      },
      {
        productId: 'prod_logitech_mx_master_3s',
        name: 'Logitech MX Master 3S Performance Wireless Mouse',
        sku: 'LOG-MXM3S-01',
        primaryImage: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=400&q=80',
        variantId: 'var_mxm3s_graphite',
        variantName: 'Graphite',
        unitPrice: 99.99,
        unitCost: 65.00,
        quantity: 1,
        total: 99.99
      }
    ]),
    3798.99,
    0.00,
    null,
    303.92,
    0.00,
    'Free Express Shipping',
    4102.91,
    3015.00, // Total cost
    'Shipped',
    'Paid',
    'card',
    'UPS-1Z9999999999999999',
    'UPS Air Saver',
    'Dispatched from Main Silicon Valley Logistics Hub.',
    pastDate2,
    pastDate2
  );

  // Order 3: Processing JBL Boombox 3 & Sony Headphones
  insertOrder.run(
    'ORD-2026-1003',
    null,
    'Elena Rostova',
    'elena.r@musictech.org',
    '+1 (555) 890-1122',
    JSON.stringify({ ...sampleAddress, street: '120 Ocean Drive', city: 'Miami', state: 'FL', postalCode: '33139' }),
    JSON.stringify({ ...sampleAddress, street: '120 Ocean Drive', city: 'Miami', state: 'FL', postalCode: '33139' }),
    JSON.stringify([
      {
        productId: 'prod_jbl_boombox_3',
        name: 'JBL Boombox 3 Wi-Fi & Bluetooth Portable Speaker',
        sku: 'JBL-BB3-WIFI-01',
        primaryImage: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=400&q=80',
        variantId: 'var_jbl_black',
        variantName: 'Midnight Black',
        unitPrice: 499.95,
        unitCost: 340.00,
        quantity: 1,
        total: 499.95
      },
      {
        productId: 'prod_sony_wh1000xm5',
        name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        sku: 'SNY-WH1000XM5-01',
        primaryImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
        variantId: 'var_sony_silver',
        variantName: 'Platinum Silver',
        unitPrice: 349.99,
        unitCost: 230.00,
        quantity: 1,
        total: 349.99
      }
    ]),
    849.94,
    84.99,
    'WELCOME10',
    61.20,
    25.00,
    'Standard Insured Courier',
    851.15,
    570.00, // Total cost
    'Processing',
    'Paid',
    'card',
    null,
    null,
    'Awaiting final packaging in warehouse bay B-4.',
    pastDate1,
    pastDate1
  );

  // 8. Seed Sample Customer Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, comment, is_verified_purchase, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    'rev_1',
    'prod_macbook_pro_16',
    'usr_cust_alex',
    'Alex Johnson',
    5,
    'Absolute beast for software architecture & Docker containers',
    'Upgraded from an M1 Pro and the M3 Max compiles my rust microservices and Next.js builds in seconds. The Space Black finish resists fingerprints significantly better than expected, and the display is breathtaking.',
    1,
    pastDate3
  );

  insertReview.run(
    'rev_2',
    'prod_rog_strix_scar_18',
    null,
    'CyberGamer_99',
    5,
    'Crushes Cyberpunk 2077 at 4K Ultra with full Ray Tracing',
    'The 18-inch Mini LED screen has HDR punch that rivals high-end OLED televisions. The cooling fans ramp up during heavy benchmarks, but temperatures stay rock steady under 78C.',
    1,
    pastDate2
  );

  insertReview.run(
    'rev_3',
    'prod_jbl_boombox_3',
    null,
    'Samantha P.',
    5,
    'Room-shaking bass with pristine clarity',
    'Took this out to the lake last weekend and it lasted through 14 hours of continuous playback with 40% battery still to spare. The Wi-Fi AirPlay support sounds noticeably richer than standard Bluetooth.',
    1,
    pastDate1
  );

  // 9. Initial Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, module, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('log_init', 'usr_admin', 'System Initializer', 'DATABASE_SEED', 'System', 'Initialized store with 24 categories, 9 brands, 8 flagship products, coupons, and demo data.', now);
}

export function ensureAllCatalogProducts() {
  const now = new Date().toISOString();

  // Ensure all necessary brands exist
  const insertBrand = db.prepare(`
    INSERT OR IGNORE INTO brands (id, name, slug, logo_url, description, is_active, is_featured, website, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const extraBrands = [
    { id: 'br_acer', name: 'Acer', slug: 'acer', desc: 'Aspire ultrabooks and Predator gaming powerhouses.', website: 'https://acer.com', logo: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_msi', name: 'MSI', slug: 'msi', desc: 'Raider & Stealth gaming and creator notebooks.', website: 'https://msi.com', logo: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_samsung', name: 'Samsung', slug: 'samsung', desc: 'High-speed NVMe storage and portable SSDs.', website: 'https://samsung.com', logo: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_keychron', name: 'Keychron', slug: 'keychron', desc: 'Custom CNC mechanical keyboards and peripherals.', website: 'https://keychron.com', logo: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_steelseries', name: 'SteelSeries', slug: 'steelseries', desc: 'Arctis wireless esports headsets and gaming gear.', website: 'https://steelseries.com', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80', featured: 1 },
    { id: 'br_anker', name: 'Anker', slug: 'anker', desc: 'GaN Prime high-wattage desktop and laptop chargers.', website: 'https://anker.com', logo: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=200&q=80', featured: 1 },
  ];

  for (const b of extraBrands) {
    insertBrand.run(b.id, b.name, b.slug, b.logo, b.desc, 1, b.featured, b.website, now, now);
  }

  // Ensure all 16 genuine products from specification exist with appropriate images and specs
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (
      id, name, slug, sku, barcode, brand_id, category_id, additional_category_ids,
      images, primary_image, short_description, full_description, regular_price,
      sale_price, purchase_cost, stock_quantity, low_stock_threshold, condition,
      warranty_period, is_featured, is_best_seller, is_new_arrival, is_active,
      is_archived, seo_title, seo_description, specifications, variants,
      rating_average, rating_count, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const catalogProducts = [
    // 1. HP Pavilion Laptop
    {
      id: 'prod_hp_pavilion_15',
      name: 'HP Pavilion 15 (Ryzen 7 7730U, 16GB, 512GB SSD, 15.6" FHD IPS)',
      slug: 'hp-pavilion-15-laptop-ryzen-7',
      sku: 'HP-PAV15-R7-01',
      barcode: '197022839182',
      brand_id: 'br_hp',
      category_id: 'cat_laptops',
      additional_categories: ['cat_business_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Fast multitasking everyday laptop with AMD Ryzen 7 8-core processor, micro-edge Full HD IPS display, and HP Fast Charge.',
      full_description: 'The HP Pavilion 15 brings responsive performance to school and work tasks. Features an AMD Ryzen 7 7730U processor, 16GB RAM for smooth multitasking, Audio by B&O with dual stereo speakers, and a sleek natural silver finish.',
      regular_price: 799.00,
      sale_price: 729.00,
      purchase_cost: 560.00,
      stock_quantity: 18,
      low_stock_threshold: 4,
      condition: 'New',
      warranty_period: '1 Year HP Limited Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'AMD Ryzen 7 7730U (8 cores, 16 threads, up to 4.5 GHz)',
        processor_generation: 'Zen 3 Architecture',
        ram_capacity: '16GB DDR4 3200MHz',
        storage: '512GB PCIe NVMe M.2 SSD',
        graphics_card: 'AMD Radeon Graphics',
        screen_size: '15.6 inch Micro-edge FHD IPS',
        screen_resolution: '1920 x 1080 (Anti-glare, 250 nits)',
        refresh_rate: '60Hz',
        operating_system: 'Windows 11 Home',
        battery_info: '41Whr Li-ion with HP Fast Charge (50% in 45 min)',
        color: 'Natural Silver',
        connectivity_ports: '1x USB-C 10Gbps, 2x USB-A 5Gbps, 1x HDMI 2.1, 1x Headphone/mic combo'
      },
      variants: [
        { id: 'var_hp15_512', name: '16GB RAM / 512GB SSD', sku: 'HP-PAV15-R7-01', price: 729, cost: 560, stock: 18 }
      ],
      rating_average: 4.8,
      rating_count: 42
    },
    // 2. Dell Inspiron Laptop
    {
      id: 'prod_dell_inspiron_16',
      name: 'Dell Inspiron 16 5630 (Intel Core i7-1355U, 16GB, 1TB SSD, 16" FHD+)',
      slug: 'dell-inspiron-16-5630-laptop',
      sku: 'DEL-INSP16-01',
      barcode: '197129849201',
      brand_id: 'br_dell',
      category_id: 'cat_laptops',
      additional_categories: ['cat_business_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Spacious 16:10 aspect ratio 16-inch display, 13th Gen Intel Core i7, up-firing speakers with Waves MaxxAudio Pro, and aluminum exterior.',
      full_description: 'Experience expansive productivity with the Inspiron 16. The 16:10 display ratio gives you more vertical room for spreadsheets, coding, and browsing, while Thunderbolt 4 allows single-cable docking and ultra-fast data transfer.',
      regular_price: 949.00,
      sale_price: 879.00,
      purchase_cost: 680.00,
      stock_quantity: 15,
      low_stock_threshold: 3,
      condition: 'New',
      warranty_period: '1 Year Dell Hardware Service with Onsite/In-Home Service',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: '13th Gen Intel Core i7-1355U (10 cores, up to 5.0 GHz)',
        processor_generation: '13th Gen Raptor Lake',
        ram_capacity: '16GB 4800MHz LPDDR5',
        storage: '1TB M.2 PCIe NVMe SSD',
        graphics_card: 'Intel Iris Xe Graphics',
        screen_size: '16.0 inch 16:10 FHD+ Display',
        screen_resolution: '1920 x 1200 (Anti-Glare, ComfortView)',
        refresh_rate: '60Hz',
        operating_system: 'Windows 11 Home',
        battery_info: '54Whr Integrated Battery',
        color: 'Platinum Silver',
        connectivity_ports: '1x Thunderbolt 4, 2x USB 3.2 Gen 1 Type-A, 1x HDMI 1.4, 1x SD Card reader, 1x Audio jack'
      },
      variants: [
        { id: 'var_insp16_1tb', name: '16GB RAM / 1TB SSD', sku: 'DEL-INSP16-01', price: 879, cost: 680, stock: 15 }
      ],
      rating_average: 4.7,
      rating_count: 36
    },
    // 3. Lenovo ThinkPad Laptop
    {
      id: 'prod_lenovo_thinkpad_t14s',
      name: 'Lenovo ThinkPad T14s Gen 4 (AMD Ryzen 7 PRO 7840U, 32GB, 1TB SSD)',
      slug: 'lenovo-thinkpad-t14s-gen-4',
      sku: 'LEN-T14S-G4-01',
      barcode: '197532981044',
      brand_id: 'br_lenovo',
      category_id: 'cat_business_laptops',
      additional_categories: ['cat_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Military-grade rugged durability, AMD Ryzen 7 PRO with enterprise security, 32GB high-frequency memory, and 400-nit low power display.',
      full_description: 'Built for enterprise executives who refuse to compromise on battery life and durability. Tested against 12 MIL-STD 810H standards, features a renowned ergonomic spill-resistant keyboard and AMD Memory Guard encryption.',
      regular_price: 1429.00,
      sale_price: 1299.00,
      purchase_cost: 1020.00,
      stock_quantity: 12,
      low_stock_threshold: 3,
      condition: 'New',
      warranty_period: '3 Years Lenovo Premier Support with Onsite Assistance',
      is_featured: 1,
      is_best_seller: 0,
      is_new_arrival: 1,
      specifications: {
        processor: 'AMD Ryzen 7 PRO 7840U (8 cores, 16 threads, up to 5.1 GHz)',
        processor_generation: 'Zen 4 4nm Architecture',
        ram_capacity: '32GB LPDDR5X 6400MHz',
        storage: '1TB M.2 PCIe Gen 4 Performance SSD',
        graphics_card: 'AMD Radeon 780M Graphics',
        screen_size: '14.0 inch WUXGA IPS Low Power',
        screen_resolution: '1920 x 1200 (400 nits, 100% sRGB)',
        refresh_rate: '60Hz',
        operating_system: 'Windows 11 Pro 64-bit',
        battery_info: '57Whr with Rapid Charge technology',
        color: 'Deep Villi Black',
        connectivity_ports: '2x USB-C (USB4 40Gbps), 2x USB-A 3.2 Gen 1, 1x HDMI 2.1, 1x Headphone/mic combo'
      },
      variants: [
        { id: 'var_t14s_32', name: '32GB RAM / 1TB SSD', sku: 'LEN-T14S-G4-01', price: 1299, cost: 1020, stock: 12 }
      ],
      rating_average: 4.9,
      rating_count: 27
    },
    // 4. ASUS VivoBook Laptop
    {
      id: 'prod_asus_vivobook_pro_15',
      name: 'ASUS VivoBook Pro 15 OLED (i9-13900H, RTX 4060, 16GB, 1TB SSD)',
      slug: 'asus-vivobook-pro-15-oled',
      sku: 'ASU-VVB15-OLED-01',
      barcode: '197105991823',
      brand_id: 'br_asus',
      category_id: 'cat_laptops',
      additional_categories: ['cat_gaming_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Creator powerhouse featuring stunning 2.8K 120Hz OLED screen, 14-core Intel Core i9, and dedicated NVIDIA GeForce RTX 4060 studio graphics.',
      full_description: 'Ignite your creative potential with the VivoBook Pro 15 OLED. World-leading 2.8K 120Hz OLED NanoEdge display delivers PANTONE Validated color fidelity with 100% DCI-P3 cinema-grade color gamut. Includes the ASUS DialPad for intuitive editing in Adobe Premiere and Photoshop.',
      regular_price: 1399.00,
      sale_price: 1249.00,
      purchase_cost: 980.00,
      stock_quantity: 14,
      low_stock_threshold: 4,
      condition: 'New',
      warranty_period: '1 Year ASUS Global Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'Intel Core i9-13900H (14 cores, 20 threads, up to 5.4 GHz)',
        processor_generation: '13th Gen Raptor Lake High-Performance',
        ram_capacity: '16GB DDR5 4800MHz',
        storage: '1TB PCIe 4.0 NVMe SSD',
        graphics_card: 'NVIDIA GeForce RTX 4060 Laptop GPU 8GB GDDR6',
        screen_size: '15.6 inch 2.8K OLED Display',
        screen_resolution: '2880 x 1620 (16:9, 0.2ms response)',
        refresh_rate: '120Hz OLED',
        operating_system: 'Windows 11 Home',
        battery_info: '70Whr 3-cell Li-ion with 150W AC Adapter',
        color: 'Quiet Blue',
        connectivity_ports: '1x Thunderbolt 4, 1x USB-C 3.2 Gen 2, 2x USB-A 3.2, 1x HDMI 2.1, 1x 3.5mm combo'
      },
      variants: [
        { id: 'var_vvb15_16', name: '16GB RAM / 1TB SSD', sku: 'ASU-VVB15-OLED-01', price: 1249, cost: 980, stock: 14 }
      ],
      rating_average: 4.8,
      rating_count: 31
    },
    // 5. Acer Aspire Laptop
    {
      id: 'prod_acer_aspire_5',
      name: 'Acer Aspire 5 Slim Laptop (i5-1335U, 16GB, 512GB SSD, 15.6" FHD)',
      slug: 'acer-aspire-5-slim-laptop',
      sku: 'ACR-ASP5-01',
      barcode: '195133982711',
      brand_id: 'br_acer',
      category_id: 'cat_laptops',
      additional_categories: ['cat_business_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Slim aluminum cover, 10-core 13th Gen Intel Core i5 processor, Wi-Fi 6E, and Acer PurifiedVoice noise reduction for crystal clear video calls.',
      full_description: 'An exceptional blend of productivity and value. The Acer Aspire 5 features a thin and light aluminum top cover, an ergonomically lifted hinge for comfortable typing, and a full suite of modern ports including Thunderbolt 4 for external monitors and charging.',
      regular_price: 649.99,
      sale_price: 579.99,
      purchase_cost: 440.00,
      stock_quantity: 24,
      low_stock_threshold: 5,
      condition: 'New',
      warranty_period: '1 Year Acer Limited Travelers Warranty',
      is_featured: 0,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'Intel Core i5-1335U (10 cores, up to 4.6 GHz)',
        processor_generation: '13th Gen Intel Core',
        ram_capacity: '16GB LPDDR5 Dual-Channel',
        storage: '512GB PCIe Gen 4 SSD',
        graphics_card: 'Intel Iris Xe Graphics',
        screen_size: '15.6 inch Full HD IPS 16:9',
        screen_resolution: '1920 x 1080 (Acer ComfyView)',
        refresh_rate: '60Hz',
        operating_system: 'Windows 11 Home',
        battery_info: '50Whr Li-ion (Up to 9.5 hours)',
        color: 'Steel Gray Aluminum',
        connectivity_ports: '1x Thunderbolt 4, 2x USB 3.2 Gen 1 Type-A, 1x HDMI 2.1, 1x Ethernet (RJ-45), 1x Audio combo'
      },
      variants: [
        { id: 'var_asp5_512', name: '16GB RAM / 512GB SSD', sku: 'ACR-ASP5-01', price: 579.99, cost: 440, stock: 24 }
      ],
      rating_average: 4.7,
      rating_count: 48
    },
    // 6. Apple MacBook Air
    {
      id: 'prod_apple_macbook_air_15',
      name: 'Apple MacBook Air 15" (M3 Chip, 16GB Unified RAM, 512GB SSD)',
      slug: 'apple-macbook-air-15-m3',
      sku: 'APP-MBA15-M3-01',
      barcode: '195949281729',
      brand_id: 'br_apple',
      category_id: 'cat_laptops',
      additional_categories: ['cat_business_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Impossibly thin 11.5mm aluminum enclosure, blazing-fast Apple M3 silicon, expansive Liquid Retina display, and completely silent fanless design.',
      full_description: 'With a spacious 15.3-inch Liquid Retina display and the phenomenal speed and efficiency of the M3 chip, MacBook Air easily powers through work and play. Features up to 18 hours of battery life, six-speaker sound system with Spatial Audio, and 1080p FaceTime HD camera.',
      regular_price: 1499.00,
      sale_price: 1399.00,
      purchase_cost: 1150.00,
      stock_quantity: 16,
      low_stock_threshold: 4,
      condition: 'New',
      warranty_period: '1 Year Apple Limited Warranty with 90 days technical support',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'Apple M3 (8-core CPU with 4 performance & 4 efficiency cores)',
        processor_generation: '3nm Apple Silicon',
        ram_capacity: '16GB Unified Memory',
        storage: '512GB Superfast SSD',
        graphics_card: '10-core GPU with Hardware-accelerated Ray Tracing',
        screen_size: '15.3 inch Liquid Retina Display',
        screen_resolution: '2880 x 1864 (500 nits brightness, Wide color P3)',
        refresh_rate: '60Hz True Tone',
        operating_system: 'macOS Sonoma',
        battery_info: '66.5Whr Li-Polymer (Up to 18 hours Apple TV app playback)',
        color: 'Midnight Aluminum with fingerprint seal',
        connectivity_ports: 'MagSafe 3 charging port, 2x Thunderbolt / USB 4 ports, 3.5mm headphone jack'
      },
      variants: [
        { id: 'var_mba15_16_512', name: '16GB RAM / 512GB SSD', sku: 'APP-MBA15-M3-01', price: 1399, cost: 1150, stock: 16 }
      ],
      rating_average: 4.9,
      rating_count: 59
    },
    // 7. MSI Gaming Laptop
    {
      id: 'prod_msi_raider_ge78',
      name: 'MSI Raider GE78 HX (RTX 4080, i9-14900HX, 32GB, 2TB SSD, 240Hz)',
      slug: 'msi-raider-ge78-hx-gaming-laptop',
      sku: 'MSI-RD78-4080-01',
      barcode: '197105829104',
      brand_id: 'br_msi',
      category_id: 'cat_gaming_laptops',
      additional_categories: ['cat_laptops'],
      primary_image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Flagship esports gaming titan: Intel Core i9-14900HX, NVIDIA GeForce RTX 4080 with 175W max TGP, and 17" QHD+ 240Hz display.',
      full_description: 'The Raider GE78 HX is the ultimate gaming beast. Features Cooler Boost 5 with 2 fans and 6 heat pipes, SteelSeries per-key RGB gaming keyboard, Dynaudio 6-speaker surround sound system, and iconic Matrix RGB lightbar.',
      regular_price: 2899.00,
      sale_price: 2699.00,
      purchase_cost: 2150.00,
      stock_quantity: 7,
      low_stock_threshold: 2,
      condition: 'New',
      warranty_period: '2 Years MSI Manufacturer Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        processor: 'Intel Core i9-14900HX (24 cores, 32 threads, up to 5.8 GHz)',
        processor_generation: '14th Gen Intel Raptor Lake',
        ram_capacity: '32GB DDR5 5600MHz Dual Channel',
        storage: '2TB NVMe PCIe Gen 4 SSD',
        graphics_card: 'NVIDIA GeForce RTX 4080 Laptop GPU 12GB GDDR6 (175W)',
        screen_size: '17.0 inch QHD+ 16:10 Display',
        screen_resolution: '2560 x 1600 (100% DCI-P3)',
        refresh_rate: '240Hz High Refresh',
        operating_system: 'Windows 11 Home',
        battery_info: '99.9Whr battery (Legal flight maximum)',
        color: 'Core Black with Matrix RGB Lightbar',
        connectivity_ports: '1x Thunderbolt 4, 2x USB-C 3.2 Gen 2, 2x USB-A 3.2, 1x HDMI 2.1 (8K@60Hz), 1x 2.5G Killer LAN, 1x SD Express'
      },
      variants: [
        { id: 'var_ge78_32', name: '32GB RAM / 2TB SSD', sku: 'MSI-RD78-4080-01', price: 2699, cost: 2150, stock: 7 }
      ],
      rating_average: 4.8,
      rating_count: 22
    },
    // 8. JBL Bluetooth Speaker
    {
      id: 'prod_jbl_charge_5',
      name: 'JBL Charge 5 Wi-Fi & Bluetooth Portable Speaker (40W RMS, IP67)',
      slug: 'jbl-charge-5-wifi-portable-speaker',
      sku: 'JBL-CHG5-WIFI-01',
      barcode: '050036398201',
      brand_id: 'br_jbl',
      category_id: 'cat_speakers',
      additional_categories: ['cat_other_electronics'],
      primary_image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Bold JBL Original Pro Sound, separate tweeter and dual passive bass radiators, 20 hours of playtime, and built-in powerbank.',
      full_description: 'Take the party anywhere with the JBL Charge 5 Wi-Fi. Stream high-definition audio with Dolby Atmos over Wi-Fi, or switch easily to Bluetooth outdoors. Waterproof and dustproof design withstands drops, sand, and pool splashes.',
      regular_price: 229.95,
      sale_price: 199.95,
      purchase_cost: 135.00,
      stock_quantity: 28,
      low_stock_threshold: 6,
      condition: 'New',
      warranty_period: '1 Year JBL Official Manufacturer Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        speaker_type: 'Portable Waterproof Wireless Speaker',
        connectivity: 'Wi-Fi 6 (AirPlay, Alexa, Spotify Connect) & Bluetooth 5.3',
        output_power: '30W RMS woofer + 10W RMS tweeter',
        battery_life: 'Up to 20 Hours (7500mAh Li-ion polymer)',
        waterproof_rating: 'IP67 Dustproof and Waterproof',
        compatible_devices: 'iOS, Android, Windows, macOS, Chromecast built-in',
        color: 'Stealth Black'
      },
      variants: [
        { id: 'var_chg5_black', name: 'Stealth Black', sku: 'JBL-CHG5-BLK', price: 199.95, cost: 135, stock: 20 },
        { id: 'var_chg5_blue', name: 'Ocean Blue', sku: 'JBL-CHG5-BLU', price: 199.95, cost: 135, stock: 8 }
      ],
      rating_average: 4.8,
      rating_count: 67
    },
    // 9. Sony Wireless Headphones
    // (Already in initialProducts as prod_sony_wh1000xm5)
    // 10. Logitech Wireless Mouse
    // (Already in initialProducts as prod_logitech_mx_master_3s)
    // 11. Mechanical Gaming Keyboard
    {
      id: 'prod_keychron_q3_pro',
      name: 'Keychron Q3 Pro SE Custom Mechanical Gaming Keyboard (QMK/VIA, Hot-Swap)',
      slug: 'keychron-q3-pro-se-mechanical-keyboard',
      sku: 'KEY-Q3P-SE-01',
      barcode: '098192389102',
      brand_id: 'br_keychron',
      category_id: 'cat_keyboards',
      additional_categories: ['cat_gaming_acc', 'cat_laptop_accessories'],
      primary_image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Full CNC machined aluminum body, wireless Bluetooth 5.1 & Type-C wired, hot-swappable Keychron K Pro switches, and sound-absorbing foam.',
      full_description: 'Engineered for discerning typists and gamers. The Q3 Pro Special Edition features a double-gasket acoustic design, south-facing RGB backlighting, custom macro control knob, and full programmability via open-source QMK/VIA software on Mac, Windows, and Linux.',
      regular_price: 214.00,
      sale_price: 199.00,
      purchase_cost: 135.00,
      stock_quantity: 19,
      low_stock_threshold: 4,
      condition: 'New',
      warranty_period: '1 Year Manufacturer Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        keyboard_layout: 'Tenkeyless (80% TKL) 87 Keys + 4 Macro Keys & Rotary Knob',
        switches: 'Keychron K Pro Mechanical Banana Switches (Tactile, Pre-lubed)',
        connectivity: 'Bluetooth 5.1 (connects up to 3 devices) & USB Type-C Wired (1000Hz polling)',
        body_material: 'Full CNC Machined Anodized 6063 Aluminum',
        battery: '4000mAh Rechargeable Li-Polymer (Up to 300 hours backlight off)',
        backlight: 'South-facing RGB Backlight with 22 lighting modes',
        color: 'Carbon Black'
      },
      variants: [
        { id: 'var_q3p_banana', name: 'Tactile Banana Switches / Carbon Black', sku: 'KEY-Q3P-BAN', price: 199, cost: 135, stock: 12 },
        { id: 'var_q3p_red', name: 'Linear Red Switches / Silver Gray', sku: 'KEY-Q3P-RED', price: 199, cost: 135, stock: 7 }
      ],
      rating_average: 4.9,
      rating_count: 51
    },
    // 12. LED Computer Monitor
    // (Already in initialProducts as prod_lg_ultragear_34_oled)
    // 13. Samsung Portable SSD
    {
      id: 'prod_samsung_t7_shield',
      name: 'Samsung T7 Shield 2TB Rugged Portable SSD (USB 3.2 Gen 2, 1050 MB/s)',
      slug: 'samsung-t7-shield-2tb-portable-ssd',
      sku: 'SAM-T7S-2TB-01',
      barcode: '887276632918',
      brand_id: 'br_samsung',
      category_id: 'cat_storage_ssds',
      additional_categories: ['cat_laptop_accessories'],
      primary_image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Superfast USB 3.2 Gen 2 transfer speeds up to 1,050 MB/s, IP65 dust and water resistance, and 3-meter drop durability with dynamic thermal guard.',
      full_description: 'Tough, fast, and compact. The Samsung T7 Shield is wrapped in a ruggedized rubber exterior with an advanced elastomer bumper. Perfect for pro video creators recording 4K 60fps ProRes directly from iPhone 15 Pro, MacBooks, and high-end Windows laptops.',
      regular_price: 169.99,
      sale_price: 149.99,
      purchase_cost: 102.00,
      stock_quantity: 32,
      low_stock_threshold: 6,
      condition: 'New',
      warranty_period: '3 Years Samsung Limited Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        capacity: '2TB PCIe NVMe SSD',
        interface: 'USB 3.2 Gen 2 (10Gbps) backwards compatible with USB 3.0/2.0',
        read_speed: 'Up to 1,050 MB/s sequential read',
        write_speed: 'Up to 1,000 MB/s sequential write',
        durability: 'IP65 Water & Dust Resistant, 3-meter drop certified',
        security: 'AES 256-bit Hardware Encryption with Password Protection',
        color: 'Titan Gray'
      },
      variants: [
        { id: 'var_t7s_2tb', name: '2TB Capacity / Titan Gray', sku: 'SAM-T7S-2TB-01', price: 149.99, cost: 102, stock: 32 }
      ],
      rating_average: 4.9,
      rating_count: 83
    },
    // 14. Laptop Cooling Pad
    {
      id: 'prod_iets_gt500_cooler',
      name: 'IETS GT500 Powerful Turbo-Fan Laptop Cooling Pad (5000 RPM, Dust Filter)',
      slug: 'iets-gt500-powerful-laptop-cooling-pad',
      sku: 'IET-GT500-01',
      barcode: '097812938102',
      brand_id: 'br_asus',
      category_id: 'cat_cooling_pads',
      additional_categories: ['cat_laptop_accessories', 'cat_gaming_acc'],
      primary_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Industrial-grade sealed memory foam ring, high-pressure 5000 RPM turbofan, washable dust filter, and stepless speed adjustment dial.',
      full_description: 'The undisputed king of laptop coolers. The IETS GT500 creates a sealed air chamber underneath your laptop chassis, forcing high-pressure filtered air through cooling vents to drop internal CPU and GPU temperatures by up to 20°C during intensive 4K gaming and rendering.',
      regular_price: 89.99,
      sale_price: 74.99,
      purchase_cost: 44.00,
      stock_quantity: 40,
      low_stock_threshold: 8,
      condition: 'New',
      warranty_period: '1 Year Manufacturer Warranty',
      is_featured: 0,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        fan_speed: 'Infinitely adjustable from 800 to 5000 RPM',
        fan_type: 'High-pressure industrial blower with magnetic levitation',
        compatibility: 'Fits 13-inch to 17.3-inch gaming & creator laptops',
        filtration: 'Removable, washable micro-pore dust filter',
        ports: 'Built-in 3-port USB 2.0 Hub for peripherals',
        color: 'Matte Black'
      },
      variants: [
        { id: 'var_gt500_std', name: 'GT500 Standard 5000 RPM', sku: 'IET-GT500-01', price: 74.99, cost: 44, stock: 40 }
      ],
      rating_average: 4.8,
      rating_count: 94
    },
    // 15. USB-C Laptop Charger
    {
      id: 'prod_anker_prime_240w',
      name: 'Anker Prime 240W 4-Port GaN Desktop Fast Charger (PD 3.1 140W)',
      slug: 'anker-prime-240w-gan-fast-charger',
      sku: 'ANK-PRIME-240W',
      barcode: '194644149201',
      brand_id: 'br_anker',
      category_id: 'cat_chargers_power',
      additional_categories: ['cat_laptop_accessories'],
      primary_image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Ultra-high 240W total output powered by GaNPrime technology. Charges two 140W MacBook Pros or high-end laptops simultaneously.',
      full_description: 'Power an entire workspace workstation from a single compact charging brick. Features 3 USB-C ports and 1 USB-A port with PowerIQ 4.0 dynamic power distribution and ActiveShield 2.0 safety temperature monitoring over 3 million times a day.',
      regular_price: 149.99,
      sale_price: 129.99,
      purchase_cost: 86.00,
      stock_quantity: 25,
      low_stock_threshold: 5,
      condition: 'New',
      warranty_period: '24 Months Anker Worry-Free Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        total_output: '240W Max Output',
        single_port_max: 'USB-C1 up to 140W (PD 3.1 compatible)',
        ports: '3x USB-C ports + 1x USB-A port',
        technology: 'GaNPrime III with ActiveShield 2.0',
        compatibility: 'MacBook Pro 16/14, Dell XPS, ThinkPad, iPad Pro, iPhone, Galaxy',
        color: 'Black Slate'
      },
      variants: [
        { id: 'var_ank240_blk', name: '240W GaN Desktop Charger', sku: 'ANK-PRIME-240W', price: 129.99, cost: 86, stock: 25 }
      ],
      rating_average: 4.9,
      rating_count: 45
    },
    // 16. Wireless Gaming Headset
    {
      id: 'prod_steelseries_arctis_nova',
      name: 'SteelSeries Arctis Nova Pro Wireless Multi-System Gaming Headset',
      slug: 'steelseries-arctis-nova-pro-wireless',
      sku: 'SS-NOVA-PRO-WL',
      barcode: '813682028192',
      brand_id: 'br_steelseries',
      category_id: 'cat_gaming_acc',
      additional_categories: ['cat_headphones'],
      primary_image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85'
      ],
      short_description: 'Almighty Audio with high-fidelity drivers, Active Noise Cancellation, Infinity Power System dual battery hot-swap, and multi-system OLED GameDAC Gen 2.',
      full_description: 'Reach almighty audio levels with the Arctis Nova Pro Wireless. Connect simultaneously to PC and mobile via 2.4GHz ultra-low latency wireless and Bluetooth. Swap batteries seamlessly with zero downtime while keeping your tournament match going.',
      regular_price: 349.99,
      sale_price: 319.99,
      purchase_cost: 220.00,
      stock_quantity: 16,
      low_stock_threshold: 4,
      condition: 'New',
      warranty_period: '2 Years Manufacturer Warranty',
      is_featured: 1,
      is_best_seller: 1,
      is_new_arrival: 1,
      specifications: {
        speaker_drivers: '40mm Neodymium Hi-Res Certified Drivers (10–40,000 Hz)',
        noise_cancellation: '4-mic hybrid Active Noise Cancellation with Transparency mode',
        microphone: 'ClearCast Gen 2 bidirectional fully retractable mic with AI noise cancel',
        wireless_system: 'Dual Wireless: 2.4GHz Quantum 2.0 Gaming + Bluetooth 5.0 simultaneous',
        battery_system: 'Infinity Power System: 2 hot-swappable batteries (44 hrs total runtime)',
        color: 'Gunmetal Black'
      },
      variants: [
        { id: 'var_nova_pro_pc', name: 'PC / PlayStation / Switch / Mobile Edition', sku: 'SS-NOVA-PRO-WL', price: 319.99, cost: 220, stock: 16 }
      ],
      rating_average: 4.8,
      rating_count: 38
    }
  ];

  for (const p of catalogProducts) {
    insertProduct.run(
      p.id,
      p.name,
      p.slug,
      p.sku,
      p.barcode,
      p.brand_id,
      p.category_id,
      JSON.stringify(p.additional_categories),
      JSON.stringify(p.images),
      p.primary_image,
      p.short_description,
      p.full_description,
      p.regular_price,
      p.sale_price,
      p.purchase_cost,
      p.stock_quantity,
      p.low_stock_threshold,
      p.condition,
      p.warranty_period,
      p.is_featured,
      p.is_best_seller,
      p.is_new_arrival,
      1,
      0,
      `${p.name} | NexTech`,
      p.short_description,
      JSON.stringify(p.specifications),
      JSON.stringify(p.variants),
      p.rating_average,
      p.rating_count,
      now,
      now
    );
  }
}

export const defaultPromoSlides = [
  {
    id: 'promo_slide_1',
    badge: 'FLAGSHIP ULTRABOOK SALE • SAVE UP TO $450',
    title: 'Precision-Engineered Laptops & OLED Displays',
    subtitle: 'Elevate your workflow with Intel Core Ultra & Apple M3 Max processors, liquid retina displays, and all-day 18-hour battery longevity.',
    discount_tag: 'From $1,299 • Free 3-Year Protection',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1800&q=85',
    buttonText: 'Shop Flagship Laptops',
    buttonLink: 'laptops',
    secondaryButtonText: 'Business Workstations',
    secondaryButtonLink: 'business-laptops',
    accentColor: 'blue',
    display_order: 1,
    is_active: 1
  },
  {
    id: 'promo_slide_2',
    badge: 'PRO ESPORTS BATTLE RIGS • 240Hz REFRESH',
    title: 'Uncompromised Gaming with NVIDIA RTX 4090',
    subtitle: 'Crush AAA titles at ultra settings with liquid-metal cooling, mechanical per-key RGB keyboards, and AI-powered DLSS 3.5 frame generation.',
    discount_tag: 'Free Mechanical Gaming Mouse Included',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1800&q=85',
    buttonText: 'Explore Gaming Laptops',
    buttonLink: 'gaming-laptops',
    secondaryButtonText: 'Gaming Accessories',
    secondaryButtonLink: 'gaming-accessories',
    accentColor: 'indigo',
    display_order: 2,
    is_active: 1
  },
  {
    id: 'promo_slide_3',
    badge: 'HIGH-FIDELITY AUDIO & STUDIO SOUND',
    title: 'Room-Filling Acoustics & Active Noise Cancelling',
    subtitle: 'Immerse yourself in Dolby Atmos 3D sound with JBL Boombox 3 Wi-Fi, Sony WH-1000XM5 wireless ANC headsets, and studio monitor setups.',
    discount_tag: 'Audio Special: Extra 15% Off with Code SOUND15',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1800&q=85',
    buttonText: 'Shop Premium Audio',
    buttonLink: 'speakers',
    secondaryButtonText: 'Headphones & Earphones',
    secondaryButtonLink: 'headphones-and-earphones',
    accentColor: 'emerald',
    display_order: 3,
    is_active: 1
  },
  {
    id: 'promo_slide_4',
    badge: 'DESK SETUP UPGRADE • ERGONOMIC MASTERY',
    title: 'Curved 4K Displays & Tactile Mechanical Keyboards',
    subtitle: 'Transform your battlestation with factory-lubed hot-swappable switches, ultra-wide color-accurate monitors, and 140W GaN fast chargers.',
    discount_tag: 'Desk Bundle Deals Starting at $89',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1800&q=85',
    buttonText: 'Shop Monitors & Displays',
    buttonLink: 'monitors-and-displays',
    secondaryButtonText: 'Keyboards & Mice',
    secondaryButtonLink: 'keyboards',
    accentColor: 'amber',
    display_order: 4,
    is_active: 1
  },
  {
    id: 'promo_slide_5',
    badge: 'CERTIFIED REFURBISHED • 1-YEAR GUARANTEE',
    title: 'Flagship Business Laptops at Unbeatable Value',
    subtitle: 'Factory-tested, sanitized, and certified refurbished Dell XPS, Lenovo ThinkPad, and MacBooks backed by full 1-year replacement warranty.',
    discount_tag: 'Save Up To $600 vs Brand New',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85',
    buttonText: 'Browse Refurbished Deals',
    buttonLink: 'used-and-refurbished-laptops',
    secondaryButtonText: 'All Categories',
    secondaryButtonLink: 'shop',
    accentColor: 'purple',
    display_order: 5,
    is_active: 1
  }
];

export function ensurePromoSlidesInitialized() {
  try {
    const row = db.prepare('SELECT promo_slides FROM settings WHERE id = ?').get('settings_main') as { promo_slides?: string } | undefined;
    if (row && (!row.promo_slides || row.promo_slides === '[]' || row.promo_slides === 'null' || row.promo_slides.trim() === '')) {
      db.prepare('UPDATE settings SET promo_slides = ? WHERE id = ?').run(JSON.stringify(defaultPromoSlides), 'settings_main');
    }
  } catch (err) {
    console.error('Failed to initialize promo slides:', err);
  }
}


