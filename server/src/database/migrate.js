import db from './db.js';
try {
  db.exec('ALTER TABLE orders ADD COLUMN paid_amount REAL DEFAULT 0');
  console.log('Added paid_amount column');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Column already exists');
  } else {
    console.error(e);
  }
}
process.exit(0);
