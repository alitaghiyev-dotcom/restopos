import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/tables — Tüm masaları getir
router.get('/', async (req, res) => {
  const { zone_id } = req.query;

  let query = `
    SELECT t.*, z.name as zone_name
    FROM tables t
    JOIN zones z ON t.zone_id = z.id
  `;
  const params = [];
  if (zone_id) {
    query += ' WHERE t.zone_id = ?';
    params.push(Number(zone_id));
  }
  query += ' ORDER BY z.sort_order, t.number';

  const tables = await db.all(query, params);

  // Enrich with order info
  const enriched = await Promise.all(tables.map(async (t) => {
    const activeOrder = await db.get(
      'SELECT id, created_at, staff_id FROM orders WHERE table_id = ? AND status = ? LIMIT 1',
      [t.id, 'active']
    );

    let current_total = 0;
    let waiter_name = null;
    let order_started_at = null;

    if (activeOrder) {
      const totalRow = await db.get(
        'SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM order_items WHERE order_id = ? AND kitchen_status != ?',
        [activeOrder.id, 'cancelled']
      );
      current_total = totalRow ? totalRow.total : 0;

      const waiter = await db.get('SELECT name FROM staff WHERE id = ?', [activeOrder.staff_id]);
      waiter_name = waiter ? waiter.name : null;
      order_started_at = activeOrder.created_at;
    }

    return { ...t, current_total, waiter_name, order_started_at };
  }));

  res.json(enriched);
});

// GET /api/tables/zones — Tüm bölgeleri getir
router.get('/zones', async (req, res) => {
  const zones = await db.all('SELECT * FROM zones ORDER BY sort_order');
  res.json(zones);
});

// PATCH /api/tables/:id/status — Masa durumunu güncelle
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['empty', 'occupied', 'bill_waiting', 'reserved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz masa durumu' });
  }

  await db.run('UPDATE tables SET status = ? WHERE id = ?', [status, Number(id)]);
  const table = await db.get('SELECT * FROM tables WHERE id = ?', [Number(id)]);
  res.json(table);
});

export default router;
