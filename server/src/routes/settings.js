import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  const settings = await db.all('SELECT * FROM settings');
  const obj = {};
  settings.forEach((s) => { obj[s.key] = s.value; });
  res.json(obj);
});

router.patch('/', async (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    const existing = await db.get('SELECT id FROM settings WHERE key = ?', [key]);
    if (existing) {
      await db.run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key]);
    } else {
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
  }
  res.json({ message: 'Ayarlar güncellendi' });
});

export default router;
