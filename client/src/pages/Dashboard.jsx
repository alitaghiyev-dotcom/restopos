import { useState, useEffect } from 'react';
import { dashboard as dashboardApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Dashboard yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // Her 1 dakikada bir yenile
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return <div className="tables-loading"><div className="loading-spinner"></div><p>Yükleniyor...</p></div>;
  }

  // Format currency
  const formatMoney = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📈 Ana Sayfa (Dashboard)</h1>
        <p className="page-subtitle">Bugünün canlı verileri ve restoran özeti</p>
      </div>

      <div className="dash-grid">
        <div className="dash-card primary">
          <div className="dash-icon">💰</div>
          <div className="dash-info">
            <span className="dash-label">Bugünkü Toplam Satış</span>
            <span className="dash-value">{formatMoney(stats.total_sales_today)}</span>
          </div>
        </div>

        <div className="dash-card success">
          <div className="dash-icon">👥</div>
          <div className="dash-info">
            <span className="dash-label">Tamamlanan Sipariş (Misafir)</span>
            <span className="dash-value">{stats.total_orders_today}</span>
          </div>
        </div>

        <div className="dash-card warning">
          <div className="dash-icon">🛎️</div>
          <div className="dash-info">
            <span className="dash-label">Açık Sipariş Toplamı</span>
            <span className="dash-value">{formatMoney(stats.open_orders_total)}</span>
          </div>
        </div>

        <div className="dash-card danger">
          <div className="dash-icon">📉</div>
          <div className="dash-info">
            <span className="dash-label">Toplam Gider (Stok Alımı)</span>
            <span className="dash-value">{formatMoney(stats.total_expenses)}</span>
          </div>
        </div>

        <div className="dash-card info">
          <div className="dash-icon">🪑</div>
          <div className="dash-info">
            <span className="dash-label">Masa Yoğunluğu (Doluluk)</span>
            <span className="dash-value">%{stats.table_density}</span>
            <div className="progress-bar-bg" style={{ marginTop: '8px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${stats.table_density}%`, height: '100%', background: '#fff', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-chart-container">
        <h2>Saat Bazlı Satış Grafiği (Bugün)</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.hourly_sales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => `₺${value}`} />
              <Tooltip 
                cursor={{ fill: '#334155' }}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [formatMoney(value), 'Ciro']}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
