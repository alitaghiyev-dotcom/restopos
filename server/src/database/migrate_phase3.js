import db from './db.js';
try {
  db.exec('ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT "in-house"');
  db.exec('ALTER TABLE orders ADD COLUMN platform TEXT');
  console.log('Added order_type and platform columns');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Columns already exist');
  } else {
    console.error(e);
  }
}
process.exit(0);
