import { useState, useEffect } from 'react';
import { reports as reportsApi } from '../services/api';

export default function Reports() {
  const [daily, setDaily] = useState(null);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    reportsApi.daily().then(data => {
      setDaily(data.summary);
      setTopProducts(data.topProducts || []);
    }).catch(console.error);
  }, []);

  if (!daily) return <div className="tables-loading"><div className="loading-spinner"></div><p>Raporlar yükleniyor...</p></div>;

  const stats = [
    { icon: '📦', label: 'Toplam Sipariş', value: daily.total_orders || 0 },
    { icon: '💰', label: 'Toplam Gelir', value: `₺${(daily.total_revenue || 0).toFixed(2)}` },
    { icon: '📊', label: 'Ortalama Sipariş', value: `₺${(daily.avg_order_value || 0).toFixed(2)}` },
    { icon: '💵', label: 'Nakit', value: `₺${(daily.cash_total || 0).toFixed(2)}` },
    { icon: '💳', label: 'Kredi Kartı', value: `₺${(daily.card_total || 0).toFixed(2)}` },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">📊 Raporlar</h1><p className="page-subtitle">Bugünkü özet</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>🏆 En Çok Satan Ürünler</h2>
        {topProducts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Bugün henüz satış yok</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: i < 3 ? 'var(--accent-gradient)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.total_qty} adet</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₺{(p.total_revenue || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
