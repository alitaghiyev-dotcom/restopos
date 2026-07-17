import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'restopos-secret-key';

// POST /api/auth/login — PIN ile giriş
router.post('/login', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN gerekli' });

  const staff = await db.get('SELECT id, name, role, active FROM staff WHERE pin = ?', [pin]);
  if (!staff) return res.status(401).json({ error: 'Geçersiz PIN' });
  if (!staff.active) return res.status(403).json({ error: 'Hesabınız devre dışı' });

  const token = jwt.sign({ id: staff.id, name: staff.name, role: staff.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: staff.id, name: staff.name, role: staff.role } });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token bulunamadı' });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ user });
  } catch {
    res.status(403).json({ error: 'Geçersiz token' });
  }
});

export default router;
