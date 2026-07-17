import { useState, useEffect } from 'react';
import { inventory as invApi } from '../services/api';
import './Inventory.css';

export default function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showMovement, setShowMovement] = useState(null);
  const [form, setForm] = useState({ name: '', unit: 'adet', current_stock: 0, min_stock: 0, cost_per_unit: 0 });
  const [movementForm, setMovementForm] = useState({ type: 'in', quantity: '', notes: '' });

  const load = async () => {
    const data = await invApi.getAll();
    setIngredients(data);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name) return alert('Malzeme adı gerekli');
    await invApi.add(form);
    setForm({ name: '', unit: 'adet', current_stock: 0, min_stock: 0, cost_per_unit: 0 });
    setShowAdd(false);
    load();
  };

  const handleMovement = async () => {
    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) return alert('Miktar girin');
    await invApi.addMovement(showMovement.id, {
      type: movementForm.type,
      quantity: Number(movementForm.quantity),
      notes: movementForm.notes
    });
    setShowMovement(null);
    setMovementForm({ type: 'in', quantity: '', notes: '' });
    load();
  };

  const typeLabels = { in: '📥 Stok Girişi', out: '📤 Stok Çıkışı', waste: '🗑️ Fire', count: '📋 Sayım' };

  return (
    <div className="inventory-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Stok Yönetimi</h1>
          <p className="page-subtitle">{ingredients.filter(i => i.is_low).length} düşük stok uyarısı</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Yeni Malzeme</button>
      </div>

      {showAdd && (
        <div className="inv-add-form animate-scale-in">
          <input className="input" placeholder="Malzeme adı" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <select className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
            <option value="adet">Adet</option>
            <option value="kg">Kg</option>
            <option value="lt">Litre</option>
            <option value="gr">Gram</option>
            <option value="ml">Ml</option>
            <option value="paket">Paket</option>
          </select>
          <input className="input" type="number" placeholder="Mevcut Stok" value={form.current_stock} onChange={e => setForm({...form, current_stock: Number(e.target.value)})} />
          <input className="input" type="number" placeholder="Min. Stok (Uyarı)" value={form.min_stock} onChange={e => setForm({...form, min_stock: Number(e.target.value)})} />
          <input className="input" type="number" placeholder="Birim Maliyet (₺)" step="0.01" value={form.cost_per_unit} onChange={e => setForm({...form, cost_per_unit: Number(e.target.value)})} />
          <div className="inv-add-actions">
            <button className="btn btn-primary" onClick={handleAdd}>Kaydet</button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>İptal</button>
          </div>
        </div>
      )}

      <div className="inv-grid">
        {ingredients.map(ing => (
          <div key={ing.id} className={`inv-card ${ing.is_low ? 'inv-low' : ''}`}>
            <div className="inv-card-header">
              <h3>{ing.name}</h3>
              {ing.is_low ? <span className="inv-alert">⚠️ Düşük</span> : null}
            </div>
            <div className="inv-card-stock">
              <span className="inv-stock-value">{ing.current_stock}</span>
              <span className="inv-stock-unit">{ing.unit}</span>
            </div>
            <div className="inv-card-meta">
              <span>Min: {ing.min_stock} {ing.unit}</span>
              <span>Maliyet: ₺{(ing.cost_per_unit || 0).toFixed(2)}/{ing.unit}</span>
            </div>
            <div className="inv-card-actions">
              <button className="btn btn-sm btn-success" onClick={() => { setShowMovement(ing); setMovementForm({type: 'in', quantity: '', notes: ''}); }}>📥 Giriş</button>
              <button className="btn btn-sm btn-danger" onClick={() => { setShowMovement(ing); setMovementForm({type: 'out', quantity: '', notes: ''}); }}>📤 Çıkış</button>
              <button className="btn btn-sm btn-secondary" onClick={() => { setShowMovement(ing); setMovementForm({type: 'count', quantity: '', notes: ''}); }}>📋 Sayım</button>
            </div>
          </div>
        ))}
      </div>

      {/* Movement Modal */}
      {showMovement && (
        <div className="modal-overlay" onClick={() => setShowMovement(null)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2>{typeLabels[movementForm.type]} — {showMovement.name}</h2>
            <div className="modal-body">
              <div className="inv-movement-types">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <button key={key} className={`btn btn-sm ${movementForm.type === key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setMovementForm({...movementForm, type: key})}>{label}</button>
                ))}
              </div>
              <input className="input" type="number" placeholder={movementForm.type === 'count' ? 'Sayılan miktar' : 'Miktar'} value={movementForm.quantity}
                onChange={e => setMovementForm({...movementForm, quantity: e.target.value})} autoFocus />
              <input className="input" placeholder="Not (opsiyonel)" value={movementForm.notes}
                onChange={e => setMovementForm({...movementForm, notes: e.target.value})} />
              <div className="inv-add-actions">
                <button className="btn btn-primary" onClick={handleMovement}>Kaydet</button>
                <button className="btn btn-ghost" onClick={() => setShowMovement(null)}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
