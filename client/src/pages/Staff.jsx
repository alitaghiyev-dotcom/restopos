import { useState, useEffect } from 'react';
import { staff as staffApi } from '../services/api';

const roleLabels = { admin: '🔑 Yönetici', cashier: '💰 Kasiyer', waiter: '🍽️ Garson', kitchen: '🍳 Mutfak' };

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '', role: 'waiter' });

  const load = () => staffApi.getAll().then(setStaffList).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.pin) return;
    try { await staffApi.add(form); setForm({ name: '', pin: '', role: 'waiter' }); setShowAdd(false); load(); }
    catch (err) { alert(err.message); }
  };

  const toggleActive = async (s) => {
    await staffApi.update(s.id, { active: s.active ? 0 : 1 });
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">👥 Personel Yönetimi</h1><p className="page-subtitle">{staffList.length} personel</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Yeni Personel</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>İsim</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ad Soyad" />
          </div>
          <div style={{ width: 120 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PIN</label>
            <input className="input" value={form.pin} onChange={e => setForm(f => ({...f, pin: e.target.value}))} placeholder="1234" maxLength={6} />
          </div>
          <div style={{ width: 160 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Rol</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
              <option value="waiter">Garson</option>
              <option value="cashier">Kasiyer</option>
              <option value="kitchen">Mutfak</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>
          <button className="btn btn-success" onClick={handleAdd}>✅ Ekle</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {staffList.map(s => (
          <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: s.active ? 1 : 0.5 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              {s.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleLabels[s.role] || s.role} · PIN: {s.pin}</div>
            </div>
            <button className={`btn btn-sm ${s.active ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleActive(s)}>
              {s.active ? '✅ Aktif' : '❌ Pasif'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
