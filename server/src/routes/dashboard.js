import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Bugünkü toplam satış (Ciro) & Misafir/Sipariş sayısı
  const salesToday = await db.get(`
    SELECT 
      COALESCE(SUM(total), 0) as total_sales,
      COUNT(id) as total_orders
    FROM orders 
    WHERE status = 'closed' AND DATE(closed_at) = ?
  `, [today]);

  // 2. Açık sipariş toplamı
  const openOrders = await db.get(`
    SELECT COALESCE(SUM(total), 0) as open_total
    FROM orders 
    WHERE status = 'active'
  `);

  // 3. Toplam gider (Stock girişlerinden maliyet hesaplama)
  // stock_movements tablosunda 'in' olanların ingredient_id ile maliyetini çarp
  const expenses = await db.get(`
    SELECT COALESCE(SUM(sm.quantity * i.cost_per_unit), 0) as total_expense
    FROM stock_movements sm
    JOIN ingredients i ON sm.ingredient_id = i.id
    WHERE sm.type = 'in' AND DATE(sm.created_at) = ?
  `, [today]);

  // 4. Masa yoğunluğu
  const tableStats = await db.get(`
    SELECT 
      COUNT(*) as total_tables,
      SUM(CASE WHEN status != 'empty' THEN 1 ELSE 0 END) as occupied_tables
    FROM tables
  `);

  const density = tableStats.total_tables > 0 
    ? Math.round((tableStats.occupied_tables / tableStats.total_tables) * 100) 
    : 0;

  // 5. Saatlik satış grafiği
  // SQLite'ta strftime ile saat alıyoruz
  const hourlyData = await db.all(`
    SELECT 
      strftime('%H:00', closed_at) as hour,
      SUM(total) as amount
    FROM orders
    WHERE status = 'closed' AND DATE(closed_at) = ?
    GROUP BY strftime('%H:00', closed_at)
    ORDER BY hour ASC
  `, [today]);

  // Saatleri 08:00'den 23:00'e kadar doldur
  const chartData = [];
  for (let i = 8; i <= 23; i++) {
    const hourStr = `${i.toString().padStart(2, '0')}:00`;
    const found = hourlyData.find(d => d.hour === hourStr);
    chartData.push({
      hour: hourStr,
      amount: found ? found.amount : 0
    });
  }

  res.json({
    total_sales_today: salesToday?.total_sales || 0,
    total_orders_today: salesToday?.total_orders || 0,
    open_orders_total: openOrders?.open_total || 0,
    total_expenses: expenses?.total_expense || 0,
    table_density: density,
    hourly_sales: chartData
  });
});

export default router;
