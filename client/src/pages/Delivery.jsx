import { useState, useEffect } from 'react';
import './Delivery.css';

// Mock data for initial rendering since we don't have real platform integrations yet
const MOCK_ORDERS = [
  { id: 101, platform: 'trendyol', customer: 'Ahmet Y.', total: 345.50, status: 'new', time: '2 dk önce', items: ['2x Hamburger Menü', '1x Soğan Halkası'] },
  { id: 102, platform: 'yemeksepeti', customer: 'Ayşe K.', total: 120.00, status: 'preparing', time: '12 dk önce', items: ['1x Tavuk Dürüm', '1x Ayran'] },
  { id: 103, platform: 'getir', customer: 'Mehmet D.', total: 550.00, status: 'ready', time: '25 dk önce', items: ['3x Karışık Pizza', '1x Litrelik Kola', '1x Patates Kızartması'] },
];

const PLATFORM_COLORS = {
  trendyol: { bg: '#f97316', label: 'Trendyol Yemek' },
  yemeksepeti: { bg: '#ea004b', label: 'Yemeksepeti' },
  getir: { bg: '#5d3ebc', color: '#ffcc00', label: 'GetirYemek' },
  in_house: { bg: 'var(--accent-primary)', label: 'Paket (Telefon)' },
};

export default function Delivery() {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  // In a real scenario, we'd fetch delivery orders from the API
  // useEffect(() => { fetchDeliveryOrders() }, [])

  const updateStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const renderColumn = (status, title, icon) => {
    const colOrders = orders.filter(o => o.status === status);
    return (
      <div className="delivery-column">
        <div className="delivery-col-header">
          <h3>{icon} {title}</h3>
          <span className="delivery-count">{colOrders.length}</span>
        </div>
        <div className="delivery-col-body">
          {colOrders.length === 0 ? (
            <div className="delivery-empty">Sipariş yok</div>
          ) : (
            colOrders.map(order => (
              <div key={order.id} className="delivery-card animate-scale-in">
                <div className="delivery-card-header" style={{ 
                  background: PLATFORM_COLORS[order.platform]?.bg || PLATFORM_COLORS.in_house.bg,
                  color: PLATFORM_COLORS[order.platform]?.color || '#fff'
                }}>
                  <span className="delivery-platform">{PLATFORM_COLORS[order.platform]?.label}</span>
                  <span className="delivery-time">{order.time}</span>
                </div>
                
                <div className="delivery-card-body">
                  <div className="delivery-customer">{order.customer}</div>
                  <div className="delivery-id">#{order.id}</div>
                  
                  <div className="delivery-items">
                    {order.items.map((item, i) => (
                      <div key={i} className="delivery-item">{item}</div>
                    ))}
                  </div>
                  
                  <div className="delivery-total">₺{order.total.toFixed(2)}</div>
                </div>

                <div className="delivery-card-actions">
                  {status === 'new' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, 'preparing')}>Onayla</button>
                      <button className="btn btn-sm btn-danger">Reddet</button>
                    </>
                  )}
                  {status === 'preparing' && (
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order.id, 'ready')}>Hazır</button>
                  )}
                  {status === 'ready' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(order.id, 'on_way')}>Yola Çıkar</button>
                  )}
                  {status === 'on_way' && (
                    <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, 'delivered')}>Teslim Edildi</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="delivery-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛵 Paket Servis</h1>
          <p className="page-subtitle">Dış platform siparişleri (Mock Data)</p>
        </div>
        <button className="btn btn-primary">+ Yeni Telefon Siparişi</button>
      </div>

      <div className="delivery-board">
        {renderColumn('new', 'Yeni Onay Bekleyen', '🔔')}
        {renderColumn('preparing', 'Hazırlanıyor', '🔥')}
        {renderColumn('ready', 'Hazır (Kurye Bekliyor)', '📦')}
        {renderColumn('on_way', 'Yolda', '🛵')}
      </div>
    </div>
  );
}
