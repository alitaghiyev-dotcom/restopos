import { useState, useEffect } from 'react';
import { settings as settingsApi } from '../services/api';

export default function Settings() {
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { settingsApi.get().then(setConfig).catch(console.error); }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await settingsApi.update(config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const fields = [
    { key: 'restaurant_name', label: 'Restoran Adı', icon: '🏪' },
    { key: 'restaurant_address', label: 'Adres', icon: '📍' },
    { key: 'tax_rate', label: 'KDV Oranı (%)', icon: '💹', type: 'number' },
    { key: 'currency_symbol', label: 'Para Birimi Sembolü', icon: '💱' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">⚙️ Ayarlar</h1><p className="page-subtitle">Restoran bilgileri</p></div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          {fields.map(field => (
            <div key={field.key}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {field.icon} {field.label}
              </label>
              <input
                className="input"
                type={field.type || 'text'}
                value={config[field.key] || ''}
                onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
