import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import tableRoutes from './routes/tables.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import staffRoutes from './routes/staff.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import inventoryRoutes from './routes/inventory.js';
import dashboardRoutes from './routes/dashboard.js';
import { initWebSocket } from './websocket/kitchen.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.includes('/ws')) {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'RestoPos API', version: '1.0.0' });
});

// Initialize WebSocket
initWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('🍽️  ╔══════════════════════════════════════╗');
  console.log('   ║       RestoPos API Sunucusu           ║');
  console.log('   ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`   🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`   📡 WebSocket: ws://localhost:${PORT}/ws/kitchen`);
  console.log(`   💾 Veritabanı: PostgreSQL`);
  console.log('');
});
