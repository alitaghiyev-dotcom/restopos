import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/inventory — Tüm malzemeleri listele
router.get('/', async (req, res) => {
  const ingredients = await db.all(`
    SELECT i.*, 
      CASE WHEN i.current_stock <= i.min_stock THEN 1 ELSE 0 END as is_low
    FROM ingredients i WHERE i.active = 1 ORDER BY i.name
  `);
  res.json(ingredients);
});

// POST /api/inventory — Yeni malzeme ekle
router.post('/', async (req, res) => {
  const { name, unit, current_stock, min_stock, cost_per_unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Malzeme adı gerekli' });

  const result = await db.run(
    'INSERT INTO ingredients (name, unit, current_stock, min_stock, cost_per_unit) VALUES (?,?,?,?,?)',
    [name, unit || 'adet', current_stock || 0, min_stock || 0, cost_per_unit || 0]
  );
  res.status(201).json(await db.get('SELECT * FROM ingredients WHERE id = ?', [result.lastInsertRowid]));
});

// PATCH /api/inventory/:id — Malzeme güncelle
router.patch('/:id', async (req, res) => {
  const { name, unit, min_stock, cost_per_unit } = req.body;
  const ingredient = await db.get('SELECT * FROM ingredients WHERE id = ?', [Number(req.params.id)]);
  if (!ingredient) return res.status(404).json({ error: 'Malzeme bulunamadı' });

  await db.run('UPDATE ingredients SET name=?, unit=?, min_stock=?, cost_per_unit=? WHERE id=?', [
    name || ingredient.name, unit || ingredient.unit,
    min_stock !== undefined ? min_stock : ingredient.min_stock,
    cost_per_unit !== undefined ? cost_per_unit : ingredient.cost_per_unit,
    Number(req.params.id)
  ]);
  res.json(await db.get('SELECT * FROM ingredients WHERE id = ?', [Number(req.params.id)]));
});

// POST /api/inventory/:id/movement — Stok hareketi (giriş/çıkış/fire/sayım)
router.post('/:id/movement', async (req, res) => {
  const { type, quantity, notes } = req.body;
  const id = Number(req.params.id);
  const staff_id = req.user.id;

  if (!['in', 'out', 'waste', 'count'].includes(type)) {
    return res.status(400).json({ error: 'Geçersiz hareket tipi' });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Miktar 0\'dan büyük olmalı' });
  }

  const ingredient = await db.get('SELECT * FROM ingredients WHERE id = ?', [id]);
  if (!ingredient) return res.status(404).json({ error: 'Malzeme bulunamadı' });

  await db.run('INSERT INTO stock_movements (ingredient_id, type, quantity, notes, staff_id) VALUES (?,?,?,?,?)',
    [id, type, quantity, notes || null, staff_id]);

  let newStock = ingredient.current_stock;
  if (type === 'in') newStock += quantity;
  else if (type === 'out' || type === 'waste') newStock -= quantity;
  else if (type === 'count') newStock = quantity; // Sayım = tam değer

  await db.run('UPDATE ingredients SET current_stock = ? WHERE id = ?', [Math.max(0, newStock), id]);

  res.json(await db.get('SELECT * FROM ingredients WHERE id = ?', [id]));
});

// GET /api/inventory/:id/movements — Stok hareketleri geçmişi
router.get('/:id/movements', async (req, res) => {
  const movements = await db.all(`
    SELECT sm.*, s.name as staff_name
    FROM stock_movements sm LEFT JOIN staff s ON sm.staff_id = s.id
    WHERE sm.ingredient_id = ? ORDER BY sm.created_at DESC LIMIT 50
  `, [Number(req.params.id)]);
  res.json(movements);
});

// GET /api/inventory/alerts — Düşük stok uyarıları
router.get('/alerts', async (req, res) => {
  const alerts = await db.all(`
    SELECT * FROM ingredients WHERE current_stock <= min_stock AND active = 1 ORDER BY name
  `);
  res.json(alerts);
});

export default router;
