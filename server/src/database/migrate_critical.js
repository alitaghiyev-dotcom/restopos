import db from './db.js';

const migrations = [
  // cancel_reason + cancelled_by to order_items
  "ALTER TABLE order_items ADD COLUMN cancel_reason TEXT",
  "ALTER TABLE order_items ADD COLUMN cancelled_by INTEGER",
  
  // Ingredients (stock)
  `CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'adet',
    current_stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    cost_per_unit REAL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  
  // Product-Ingredient recipe
  `CREATE TABLE IF NOT EXISTS product_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity_needed REAL NOT NULL DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
  )`,
  
  // Stock movements
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('in', 'out', 'waste', 'count')),
    quantity REAL NOT NULL,
    notes TEXT,
    staff_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
  )`,
  
  // Z Reports
  `CREATE TABLE IF NOT EXISTS z_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
  )`,
  
  // Indexes
  "CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock)",
  "CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id)",
  "CREATE INDEX IF NOT EXISTS idx_z_reports_date ON z_reports(report_date)"
];

for (const sql of migrations) {
  try {
    db.exec(sql);
    console.log('✅', sql.substring(0, 60) + '...');
  } catch (e) {
    if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
      console.log('⏭️  Zaten var:', sql.substring(0, 50));
    } else {
      console.error('❌', e.message);
    }
  }
}

console.log('\n✅ Tüm migration işlemleri tamamlandı!');
process.exit(0);
