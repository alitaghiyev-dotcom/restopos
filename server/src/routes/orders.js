import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastToKitchen } from '../websocket/kitchen.js';

const router = Router();
router.use(authenticateToken);

// GET /api/orders/kitchen/active — Mutfak için aktif siparişler (must be before /:id)
router.get('/kitchen/active', async (req, res) => {
  const orders = await db.all(`
    SELECT o.id, o.created_at, t.number as table_number, z.name as zone_name, s.name as staff_name
    FROM orders o JOIN tables t ON o.table_id = t.id JOIN zones z ON t.zone_id = z.id JOIN staff s ON o.staff_id = s.id
    WHERE o.status = 'active' ORDER BY o.created_at ASC
  `);

  const result = (await Promise.all(orders.map(async (order) => {
    const items = await db.all(`
      SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ? AND oi.kitchen_status IN ('new', 'preparing') ORDER BY oi.created_at
    `, [order.id]);
    return { ...order, items };
  }))).filter(o => o.items.length > 0);

  res.json(result);
});

// GET /api/orders
router.get('/', async (req, res) => {
  const { table_id, status } = req.query;
  let query = `SELECT o.*, t.number as table_number, z.name as zone_name, s.name as staff_name
    FROM orders o JOIN tables t ON o.table_id = t.id JOIN zones z ON t.zone_id = z.id JOIN staff s ON o.staff_id = s.id WHERE 1=1`;
  const params = [];
  if (table_id) { query += ' AND o.table_id = ?'; params.push(Number(table_id)); }
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC';
  res.json(await db.all(query, params));
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const order = await db.get(`
    SELECT o.*, t.number as table_number, z.name as zone_name, s.name as staff_name
    FROM orders o JOIN tables t ON o.table_id = t.id JOIN zones z ON t.zone_id = z.id JOIN staff s ON o.staff_id = s.id WHERE o.id = ?
  `, [Number(req.params.id)]);
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

  const items = await db.all(`
    SELECT oi.*, p.name as product_name, c.name as category_name
    FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id
    WHERE oi.order_id = ? ORDER BY oi.created_at
  `, [order.id]);

  res.json({ ...order, items });
});

// POST /api/orders — Yeni sipariş
router.post('/', async (req, res) => {
  const { table_id, items } = req.body;
  const staff_id = req.user.id;

  if (!table_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Masa ve en az 1 ürün gerekli' });
  }

  let order = await db.get('SELECT * FROM orders WHERE table_id = ? AND status = ?', [Number(table_id), 'active']);

  const insertedItems = await db.transaction(async (db) => {
    if (!order) {
      const result = await db.run('INSERT INTO orders (table_id, staff_id, status) VALUES (?,?,?)', [Number(table_id), staff_id, 'active']);
      order = await db.get('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]);
    }

    const inserted = [];
    for (const item of items) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (!product) continue;

      const result = await db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, notes) VALUES (?,?,?,?,?)',
        [order.id, product.id, item.quantity, product.price, item.notes]
      );
      inserted.push({
        id: result.lastInsertRowid,
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        notes: item.notes,
        kitchen_status: 'new'
      });
    }

    // Update table status
    await db.run('UPDATE tables SET status = ? WHERE id = ?', ['occupied', Number(table_id)]);
    
    // Update order totals
    const totalResult = await db.get(
      'SELECT COALESCE(SUM(quantity * unit_price), 0) as subtotal FROM order_items WHERE order_id = ? AND kitchen_status != ?',
      [order.id, 'cancelled']
    );
    const subtotal = totalResult ? totalResult.subtotal : 0;
    await db.run('UPDATE orders SET subtotal = ?, total = ? WHERE id = ?', [subtotal, subtotal, order.id]);
    
    return inserted;
  });

  const fullOrder = await db.get(`
    SELECT o.*, t.number as table_number, s.name as staff_name
    FROM orders o JOIN tables t ON o.table_id = t.id JOIN staff s ON o.staff_id = s.id WHERE o.id = ?
  `, [order.id]);

  const orderItems = await db.all(`
    SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ? ORDER BY oi.created_at DESC
  `, [order.id]);

  broadcastToKitchen({ type: 'new_order', order: { ...fullOrder, items: orderItems } });
  res.status(201).json({ ...fullOrder, items: orderItems });
});

// PATCH /api/orders/:id/item/:itemId/kitchen-status
router.patch('/:id/item/:itemId/kitchen-status', async (req, res) => {
  const { id, itemId } = req.params;
  const { kitchen_status, cancel_reason } = req.body;
  const staff_id = req.user.id;

  const validStatuses = ['new', 'preparing', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(kitchen_status)) return res.status(400).json({ error: 'Geçersiz durum' });

  if (kitchen_status === 'cancelled') {
    if (!cancel_reason) return res.status(400).json({ error: 'İptal sebebi zorunludur' });
    await db.run('UPDATE order_items SET kitchen_status = ?, cancel_reason = ?, cancelled_by = ? WHERE id = ? AND order_id = ?',
      [kitchen_status, cancel_reason, staff_id, Number(itemId), Number(id)]);
  } else {
    await db.run('UPDATE order_items SET kitchen_status = ? WHERE id = ? AND order_id = ?',
      [kitchen_status, Number(itemId), Number(id)]);
  }

  if (kitchen_status === 'cancelled') {
    const totalResult = await db.get(
      'SELECT COALESCE(SUM(quantity * unit_price), 0) as subtotal FROM order_items WHERE order_id = ? AND kitchen_status != ?',
      [Number(id), 'cancelled']
    );
    const subtotal = totalResult ? totalResult.subtotal : 0;
    await db.run('UPDATE orders SET subtotal = ?, total = ? WHERE id = ?', [subtotal, subtotal, Number(id)]);
  }

  const item = await db.get('SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.id = ?',
    [Number(itemId)]);

  broadcastToKitchen({ type: 'item_status_update', order_id: Number(id), item });
  res.json(item);
});

// POST /api/orders/:id/transfer — Masa taşıma
router.post('/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { target_table_id } = req.body;

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]);
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
  if (order.status !== 'active') return res.status(400).json({ error: 'Sadece aktif siparişler taşınabilir' });

  const targetTable = await db.get('SELECT * FROM tables WHERE id = ?', [Number(target_table_id)]);
  if (!targetTable) return res.status(404).json({ error: 'Hedef masa bulunamadı' });

  // Check if target table has active order
  const existingOrder = await db.get('SELECT * FROM orders WHERE table_id = ? AND status = ?', [Number(target_table_id), 'active']);
  if (existingOrder) return res.status(400).json({ error: 'Hedef masada zaten aktif sipariş var. Birleştirme yapın.' });

  // Transfer
  const oldTableId = order.table_id;
  await db.run('UPDATE orders SET table_id = ? WHERE id = ?', [Number(target_table_id), Number(id)]);
  await db.run('UPDATE tables SET status = ? WHERE id = ?', ['empty', oldTableId]);
  await db.run('UPDATE tables SET status = ? WHERE id = ?', ['occupied', Number(target_table_id)]);

  res.json({ message: 'Sipariş taşındı', order: await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]) });
});

// POST /api/orders/:id/merge — Masa birleştirme
router.post('/:id/merge', async (req, res) => {
  const { id } = req.params;
  const { source_order_id } = req.body;

  const targetOrder = await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]);
  const sourceOrder = await db.get('SELECT * FROM orders WHERE id = ?', [Number(source_order_id)]);

  if (!targetOrder || !sourceOrder) return res.status(404).json({ error: 'Sipariş bulunamadı' });
  if (targetOrder.status !== 'active' || sourceOrder.status !== 'active') {
    return res.status(400).json({ error: 'Sadece aktif siparişler birleştirilebilir' });
  }

  // Move all items from source to target
  await db.run('UPDATE order_items SET order_id = ? WHERE order_id = ?', [Number(id), Number(source_order_id)]);

  // Recalculate target total
  const totalResult = await db.get(
    'SELECT COALESCE(SUM(quantity * unit_price), 0) as subtotal FROM order_items WHERE order_id = ? AND kitchen_status != ?',
    [Number(id), 'cancelled']
  );
  const subtotal = totalResult ? totalResult.subtotal : 0;
  await db.run('UPDATE orders SET subtotal = ?, total = ? WHERE id = ?', [subtotal, subtotal, Number(id)]);

  // Close source order and free source table
  await db.run("UPDATE orders SET status = 'cancelled', notes = 'Birleştirildi -> Sipariş #' || ? WHERE id = ?", [Number(id), Number(source_order_id)]);
  await db.run('UPDATE tables SET status = ? WHERE id = ?', ['empty', sourceOrder.table_id]);

  res.json({ message: 'Siparişler birleştirildi', order: await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]) });
});

// POST /api/orders/:id/close
router.post('/:id/close', async (req, res) => {
  const { id } = req.params;
  const { payment_method, discount, discount_type } = req.body;

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]);
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
  if (order.status !== 'active') return res.status(400).json({ error: 'Sipariş zaten kapalı' });

  let total = order.subtotal;
  if (discount && discount > 0) {
    total = discount_type === 'percent' ? total * (1 - discount / 100) : total - discount;
  }
  if (total < 0) total = 0;

  await db.run(`UPDATE orders SET status='closed', payment_method=?, discount=?, discount_type=?, total=?, closed_at=datetime('now') WHERE id=?`,
    [payment_method || 'cash', discount || 0, discount_type || 'percent', total, Number(id)]);

  await db.run('UPDATE tables SET status = ? WHERE id = ?', ['empty', order.table_id]);

  res.json(await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]));
});

// POST /api/orders/:id/pay
router.post('/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method } = req.body;

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]);
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
  if (order.status !== 'active') return res.status(400).json({ error: 'Sipariş zaten kapalı' });

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Geçersiz tutar' });

  const currentPaid = order.paid_amount || 0;
  const newPaid = currentPaid + amount;

  await db.run('UPDATE orders SET paid_amount = ? WHERE id = ?', [newPaid, Number(id)]);
  
  res.json(await db.get('SELECT * FROM orders WHERE id = ?', [Number(id)]));
});

export default router;
