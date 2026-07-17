import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole('admin', 'cashier'));

router.get('/daily', async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const summary = await db.get(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(AVG(total), 0) as avg_order_value,
      SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_total,
      SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_total
    FROM orders WHERE status = 'closed' AND DATE(closed_at) = ?
  `, [targetDate]) || { total_orders: 0, total_revenue: 0, avg_order_value: 0, cash_total: 0, card_total: 0 };

  const topProducts = await db.all(`
    SELECT p.name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.unit_price) as total_revenue
    FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'closed' AND DATE(o.closed_at) = ? AND oi.kitchen_status != 'cancelled'
    GROUP BY p.id ORDER BY total_qty DESC LIMIT 10
  `, [targetDate]);

  const hourly = await db.all(`
    SELECT TO_CHAR(closed_at, 'HH24') as hour, COUNT(*) as order_count, SUM(total) as revenue
    FROM orders WHERE status = 'closed' AND DATE(closed_at) = DATE($1) GROUP BY TO_CHAR(closed_at, 'HH24') ORDER BY hour
  `, [targetDate]);

  res.json({ date: targetDate, summary, topProducts, hourly });
});

router.get('/weekly', async (req, res) => {
  res.json(await db.all(`
    SELECT DATE(closed_at) as date, COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue
    FROM orders WHERE status = 'closed' AND closed_at >= DATE('now', '-7 days')
    GROUP BY DATE(closed_at) ORDER BY date
  `));
});

router.get('/categories', async (req, res) => {
  res.json(await db.all(`
    SELECT c.name, c.color, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.unit_price) as total_revenue
    FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status = 'closed' AND oi.kitchen_status != 'cancelled' GROUP BY c.id ORDER BY total_revenue DESC
  `));
});

router.get('/staff', async (req, res) => {
  res.json(await db.all(`
    SELECT s.name, COUNT(o.id) as total_orders, COALESCE(SUM(o.total), 0) as total_revenue
    FROM staff s LEFT JOIN orders o ON s.id = o.staff_id AND o.status = 'closed'
    WHERE s.role = 'waiter' GROUP BY s.id ORDER BY total_revenue DESC
  `));
});

// POST /api/reports/z-report — Z Raporu oluştur (Kasa Kapanış)
router.post('/z-report', async (req, res) => {
  const { opening_cash, closing_cash, notes } = req.body;
  const staff_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Check if Z-report already exists for today
  const existing = await db.get('SELECT * FROM z_reports WHERE report_date = ?', [today]);
  if (existing) return res.status(400).json({ error: 'Bugün için zaten Z raporu kesilmiş' });

  // Calculate from orders
  const summary = await db.get(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_total,
      SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_total,
      COALESCE(SUM(discount), 0) as total_discount
    FROM orders WHERE status = 'closed' AND DATE(closed_at) = ?
  `, [today]);

  const cancelled = await db.get(`
    SELECT COUNT(*) as cnt FROM order_items oi JOIN orders o ON oi.order_id = o.id
    WHERE oi.kitchen_status = 'cancelled' AND DATE(o.created_at) = ?
  `, [today]);

  const result = await db.run(`
    INSERT INTO z_reports (report_date, staff_id, total_orders, total_revenue, cash_total, card_total, total_discount, total_cancelled, opening_cash, closing_cash, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `, [
    today, staff_id,
    summary?.total_orders || 0, summary?.total_revenue || 0,
    summary?.cash_total || 0, summary?.card_total || 0,
    summary?.total_discount || 0, cancelled?.cnt || 0,
    opening_cash || 0, closing_cash || 0,
    notes || null
  ]);

  const report = await db.get('SELECT zr.*, s.name as staff_name FROM z_reports zr JOIN staff s ON zr.staff_id = s.id WHERE zr.id = ?', [result.lastInsertRowid]);
  res.status(201).json(report);
});

// GET /api/reports/z-reports — Z Raporu geçmişi
router.get('/z-reports', async (req, res) => {
  const reports = await db.all(`
    SELECT zr.*, s.name as staff_name 
    FROM z_reports zr JOIN staff s ON zr.staff_id = s.id 
    ORDER BY zr.report_date DESC LIMIT 30
  `);
  res.json(reports);
});

// GET /api/reports/z-report/today — Bugünün Z raporu verisi (henüz kesilmemiş olsa bile)
router.get('/z-report/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const existing = await db.get('SELECT zr.*, s.name as staff_name FROM z_reports zr JOIN staff s ON zr.staff_id = s.id WHERE zr.report_date = ?', [today]);
  if (existing) return res.json({ already_closed: true, report: existing });

  const summary = await db.get(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_total,
      SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_total,
      COALESCE(SUM(discount), 0) as total_discount
    FROM orders WHERE status = 'closed' AND DATE(closed_at) = ?
  `, [today]);

  const cancelled = await db.get(`
    SELECT COUNT(*) as cnt FROM order_items oi JOIN orders o ON oi.order_id = o.id
    WHERE oi.kitchen_status = 'cancelled' AND DATE(o.created_at) = ?
  `, [today]);

  const activeOrders = await db.get('SELECT COUNT(*) as cnt FROM orders WHERE status = ?', ['active']);

  res.json({
    already_closed: false,
    date: today,
    summary: summary || {},
    total_cancelled: cancelled?.cnt || 0,
    active_orders: activeOrders?.cnt || 0
  });
});

export default router;
