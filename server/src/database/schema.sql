-- RestoPos Database Schema

-- Personel tablosu
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'waiter', 'kitchen')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bölgeler tablosu
CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Masalar tablosu
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL,
  zone_id INTEGER NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'empty' CHECK(status IN ('empty', 'occupied', 'bill_waiting', 'reserved')),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Menü kategorileri
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

-- Ürünler
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Siparişler
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed', 'cancelled')),
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  discount_type TEXT DEFAULT 'percent' CHECK(discount_type IN ('percent', 'amount')),
  tax_rate REAL DEFAULT 10,
  total REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'mixed', NULL)),
  notes TEXT,
  order_type TEXT DEFAULT 'in-house' CHECK(order_type IN ('in-house', 'delivery', 'takeaway')),
  platform TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- Sipariş kalemleri
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  notes TEXT,
  kitchen_status TEXT NOT NULL DEFAULT 'new' CHECK(kitchen_status IN ('new', 'preparing', 'ready', 'served', 'cancelled')),
  cancel_reason TEXT,
  cancelled_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (cancelled_by) REFERENCES staff(id)
);

-- Ayarlar
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT
);

-- Stok / Malzeme Takibi
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'adet',
  current_stock REAL DEFAULT 0,
  min_stock REAL DEFAULT 0,
  cost_per_unit REAL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürün-Malzeme ilişkisi (reçete)
CREATE TABLE IF NOT EXISTS product_ingredients (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  quantity_needed REAL NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- Stok hareketleri
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('in', 'out', 'waste', 'count')),
  quantity REAL NOT NULL,
  notes TEXT,
  staff_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- Z Raporları (Kasa Kapanış)
CREATE TABLE IF NOT EXISTS z_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  staff_id INTEGER NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  cash_total REAL DEFAULT 0,
  card_total REAL DEFAULT 0,
  total_discount REAL DEFAULT 0,
  total_cancelled INTEGER DEFAULT 0,
  opening_cash REAL DEFAULT 0,
  closing_cash REAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_tables_zone ON tables(zone_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kitchen ON order_items(kitchen_status);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_z_reports_date ON z_reports(report_date);

