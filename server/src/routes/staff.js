import { Router } from 'express';
import db from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', requireRole('admin'), async (req, res) => {
  res.json(await db.all('SELECT id, name, pin, role, active, created_at FROM staff ORDER BY name'));
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { name, pin, role } = req.body;
  if (!name || !pin || !role) return res.status(400).json({ error: 'İsim, PIN ve rol gerekli' });

  const existing = await db.get('SELECT id FROM staff WHERE pin = ?', [pin]);
  if (existing) return res.status(400).json({ error: 'Bu PIN zaten kullanılıyor' });

  const result = await db.run('INSERT INTO staff (name, pin, role) VALUES (?,?,?)', [name, pin, role]);
  res.status(201).json(await db.get('SELECT id, name, role, active FROM staff WHERE id = ?', [result.lastInsertRowid]));
});

router.patch('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, pin, role, active } = req.body;

  if (pin) {
    const existing = await db.get('SELECT id FROM staff WHERE pin = ? AND id != ?', [pin, Number(id)]);
    if (existing) return res.status(400).json({ error: 'Bu PIN zaten kullanılıyor' });
  }

  await db.run('UPDATE staff SET name=COALESCE(?,name), pin=COALESCE(?,pin), role=COALESCE(?,role), active=COALESCE(?,active) WHERE id=?',
    [name ?? null, pin ?? null, role ?? null, active ?? null, Number(id)]);
  res.json(await db.get('SELECT id, name, pin, role, active FROM staff WHERE id = ?', [Number(id)]));
});

export default router;
