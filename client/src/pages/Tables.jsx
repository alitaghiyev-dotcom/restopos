import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { tables as tablesApi } from '../services/api';
import './Tables.css';

const statusConfig = {
  empty: { label: 'Boş', color: 'var(--status-empty)', bg: 'var(--status-empty-bg)', icon: '🟢' },
  occupied: { label: 'Dolu', color: 'var(--status-occupied)', bg: 'var(--status-occupied-bg)', icon: '🔴' },
  bill_waiting: { label: 'Hesap Bekliyor', color: 'var(--status-bill)', bg: 'var(--status-bill-bg)', icon: '🟡' },
  reserved: { label: 'Rezerve', color: 'var(--status-reserved)', bg: 'var(--status-reserved-bg)', icon: '🔵' },
};

export default function Tables() {
  const [tableList, setTableList] = useState([]);
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModalTable, setQrModalTable] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [tablesData, zonesData] = await Promise.all([
        tablesApi.getAll(activeZone),
        tablesApi.getZones(),
      ]);
      setTableList(tablesData);
      setZones(zonesData);
    } catch (err) {
      console.error('Masalar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [activeZone]);

  const handleTableClick = (table) => {
    if (table.status === 'empty' || table.status === 'reserved') {
      navigate(`/order/${table.id}`);
    } else if (table.status === 'occupied') {
      navigate(`/order/${table.id}`);
    } else if (table.status === 'bill_waiting') {
      navigate(`/checkout/${table.id}`);
    }
  };

  const getTimePassed = (startedAt) => {
    if (!startedAt) return null;
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000); // minutes
    if (diff < 60) return `${diff} dk`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}sa ${mins}dk`;
  };

  const stats = {
    empty: tableList.filter(t => t.status === 'empty').length,
    occupied: tableList.filter(t => t.status === 'occupied').length,
    bill_waiting: tableList.filter(t => t.status === 'bill_waiting').length,
    reserved: tableList.filter(t => t.status === 'reserved').length,
  };

  if (loading) {
    return (
      <div className="tables-loading">
        <div className="loading-spinner"></div>
        <p>Masalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="tables-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Masa Haritası</h1>
          <p className="page-subtitle">Toplam {tableList.length} masa</p>
        </div>
        <div className="tables-stats">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="stat-badge" style={{ background: config.bg, color: config.color }}>
              {config.icon} {stats[key]} {config.label}
            </div>
          ))}
        </div>
      </div>

      <div className="zone-tabs">
        <button
          className={`zone-tab ${activeZone === null ? 'active' : ''}`}
          onClick={() => setActiveZone(null)}
        >
          Tümü
        </button>
        {zones.map((zone) => (
          <button
            key={zone.id}
            className={`zone-tab ${activeZone === zone.id ? 'active' : ''}`}
            onClick={() => setActiveZone(zone.id)}
          >
            {zone.name}
          </button>
        ))}
      </div>

      <div className="tables-grid stagger">
        {tableList.map((table) => {
          const config = statusConfig[table.status] || statusConfig.empty;
          return (
            <div key={table.id} style={{ position: 'relative' }}>
              <button
                className={`table-card table-${table.status}`}
                onClick={() => handleTableClick(table)}
                style={{ '--table-color': config.color, '--table-bg': config.bg, width: '100%' }}
              >
                <div className="table-card-header">
                  <span className="table-number">M{table.number}</span>
                  <span className="table-status-dot" style={{ background: config.color }}></span>
                </div>

                <div className="table-card-body">
                  <div className="table-icon">
                    {table.status === 'empty' ? '🪑' :
                     table.status === 'occupied' ? '🍽️' :
                     table.status === 'bill_waiting' ? '💰' : '📋'}
                  </div>
                  <div className="table-capacity">{table.capacity} kişilik</div>
                </div>

                <div className="table-card-footer">
                  {table.status === 'empty' ? (
                    <span className="table-action-hint">Sipariş almak için tıkla</span>
                  ) : (
                    <>
                      {table.waiter_name && (
                        <span className="table-waiter">👤 {table.waiter_name}</span>
                      )}
                      {table.current_total > 0 && (
                        <span className="table-total">₺{table.current_total.toFixed(2)}</span>
                      )}
                      {table.order_started_at && (
                        <span className="table-time">⏱️ {getTimePassed(table.order_started_at)}</span>
                      )}
                    </>
                  )}
                </div>

                <div className="table-zone-label">{table.zone_name}</div>
              </button>
              
              <button 
                className="btn btn-ghost" 
                style={{ position: 'absolute', top: '8px', right: '40px', padding: '4px', zIndex: 2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setQrModalTable(table);
                }}
                title="QR Menü Kodunu Göster"
              >
                📱
              </button>
            </div>
          );
        })}
      </div>

      {qrModalTable && (
        <div className="modal-overlay" onClick={() => setQrModalTable(null)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h2>Masa {qrModalTable.number} QR Menü</h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Müşterileriniz bu kodu okutarak menüyü görebilir.</p>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
              <QRCodeSVG 
                value={`${window.location.origin.replace('localhost', '192.168.1.148')}/m/${qrModalTable.id}`} 
                size={200}
                level="H"
              />
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {window.location.origin.replace('localhost', '192.168.1.148')}/m/{qrModalTable.id}
            </p>
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => setQrModalTable(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
