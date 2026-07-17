import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/menu/categories (PUBLIC)
router.get('/categories', async (req, res) => {
  const categories = await db.all('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order');
  res.json(categories);
});

// GET /api/menu/products (PUBLIC)
router.get('/products', async (req, res) => {
  const { category_id } = req.query;
  let query = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.available = 1';
  const params = [];
  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(Number(category_id));
  }
  query += ' ORDER BY p.sort_order';
  res.json(await db.all(query, params));
});

// GET /api/menu/admin/categories (admin) - returns all including inactive
router.get('/admin/categories', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
  const categories = await db.all('SELECT * FROM categories ORDER BY sort_order');
  res.json(categories);
});

// GET /api/menu/admin/products (admin) - returns all including inactive
router.get('/admin/products', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
  const { category_id } = req.query;
  let query = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id';
  const params = [];
  if (category_id) {
    query += ' WHERE p.category_id = ?';
    params.push(Number(category_id));
  }
  query += ' ORDER BY p.sort_order';
  res.json(await db.all(query, params));
});

// POST /api/menu/categories (admin)
router.post('/categories', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Kategori adı gerekli' });

  const maxOrder = await db.get('SELECT MAX(sort_order) as max FROM categories');
  const sortOrder = ((maxOrder && maxOrder.max) || 0) + 1;

  const result = await db.run('INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)',
    [name, icon || '🍽️', color || '#6366f1', sortOrder]);
  const category = await db.get('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(category);
});

// PATCH /api/menu/categories/:id (admin)
router.patch('/categories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const category = await db.get('SELECT * FROM categories WHERE id = ?', [Number(id)]);
  if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });

  const { name, icon, color, active } = req.body;
  await db.run(`UPDATE categories SET name=COALESCE(?,name), icon=COALESCE(?,icon), color=COALESCE(?,color), active=COALESCE(?,active) WHERE id=?`,
    [name ?? null, icon ?? null, color ?? null, active ?? null, Number(id)]);

  res.json(await db.get('SELECT * FROM categories WHERE id = ?', [Number(id)]));
});

// DELETE /api/menu/categories/:id (admin)
router.delete('/categories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  // Soft delete category
  await db.run('UPDATE categories SET active = 0 WHERE id = ?', [Number(req.params.id)]);
  // Deactivate related products
  await db.run('UPDATE products SET available = 0 WHERE category_id = ?', [Number(req.params.id)]);
  res.json({ message: 'Kategori devre dışı bırakıldı' });
});

// POST /api/menu/products (admin)
router.post('/products', authenticateToken, requireRole('admin'), async (req, res) => {
  const { category_id, name, price, description } = req.body;
  if (!category_id || !name || !price) return res.status(400).json({ error: 'Kategori, ürün adı ve fiyat gerekli' });

  const maxOrder = await db.get('SELECT MAX(sort_order) as max FROM products WHERE category_id = ?', [Number(category_id)]);
  const sortOrder = ((maxOrder && maxOrder.max) || 0) + 1;

  const result = await db.run('INSERT INTO products (category_id, name, price, description, sort_order) VALUES (?,?,?,?,?)',
    [Number(category_id), name, price, description || '', sortOrder]);
  const product = await db.get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(product);
});

// PATCH /api/menu/products/:id (admin)
router.patch('/products/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const product = await db.get('SELECT * FROM products WHERE id = ?', [Number(id)]);
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const { name, price, description, available, category_id } = req.body;
  await db.run(`UPDATE products SET name=COALESCE(?,name), price=COALESCE(?,price), description=COALESCE(?,description), available=COALESCE(?,available), category_id=COALESCE(?,category_id) WHERE id=?`,
    [name ?? null, price ?? null, description ?? null, available ?? null, category_id ?? null, Number(id)]);

  res.json(await db.get('SELECT * FROM products WHERE id = ?', [Number(id)]));
});

// DELETE /api/menu/products/:id (admin)
router.delete('/products/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  await db.run('UPDATE products SET available = 0 WHERE id = ?', [Number(req.params.id)]);
  res.json({ message: 'Ürün devre dışı bırakıldı' });
});

export default router;
