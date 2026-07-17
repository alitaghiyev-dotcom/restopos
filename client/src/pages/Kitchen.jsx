import { useState, useEffect, useRef } from 'react';
import { orders as ordersApi } from '../services/api';
import './Kitchen.css';

export default function Kitchen() {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getKitchenActive();
      if (data.length > kitchenOrders.length && kitchenOrders.length > 0) {
        // Play notification sound
        try { audioRef.current?.play(); } catch (e) {}
      }
      setKitchenOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    // WebSocket connection
    let ws;
    try {
      ws = new WebSocket(`ws://${window.location.hostname}:3001/ws/kitchen`);
      ws.onmessage = () => fetchOrders();
      ws.onerror = () => console.log('WebSocket bağlantı hatası');
    } catch (e) {}

    return () => {
      clearInterval(interval);
      ws?.close();
    };
  }, []);

  const updateStatus = async (orderId, itemId, status) => {
    try {
      let cancelReason = null;
      if (status === 'cancelled') {
        cancelReason = prompt('İptal nedeni (Zorunlu):');
        if (!cancelReason) return; // İptalden vazgeçildi
      }
      await ordersApi.updateItemStatus(orderId, itemId, status, cancelReason);
      fetchOrders();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const getTimePassed = (createdAt) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return 'Az önce';
    if (diff < 60) return `${diff} dk`;
    return `${Math.floor(diff / 60)}sa ${diff % 60}dk`;
  };

  if (loading) {
    return <div className="tables-loading"><div className="loading-spinner"></div><p>Mutfak yükleniyor...</p></div>;
  }

  return (
    <div className="kitchen-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🍳 Mutfak Ekranı</h1>
          <p className="page-subtitle">{kitchenOrders.length} aktif sipariş</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchOrders}>🔄 Yenile</button>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="kitchen-empty">
          <span>✨</span>
          <h2>Tüm siparişler hazır!</h2>
          <p>Yeni sipariş geldiğinde burada görünecek</p>
        </div>
      ) : (
        <div className="kitchen-grid">
          {kitchenOrders.map(order => (
            <div key={order.id} className="kitchen-card animate-scale-in">
              <div className="kitchen-card-header">
                <div className="kitchen-table">M{order.table_number}</div>
                <div className="kitchen-meta">
                  <span className="kitchen-zone">{order.zone_name}</span>
                  <span className="kitchen-time">⏱️ {getTimePassed(order.created_at)}</span>
                </div>
                <div className="kitchen-waiter">👤 {order.staff_name}</div>
              </div>
              <div className="kitchen-items">
                {order.items.map(item => (
                  <div key={item.id} className={`kitchen-item ki-${item.kitchen_status}`}>
                    <div className="kitchen-item-info">
                      <span className="kitchen-qty">{item.quantity}×</span>
                      <span className="kitchen-name">{item.product_name}</span>
                      {item.notes && <span className="kitchen-note">📝 {item.notes}</span>}
                    </div>
                    <div className="kitchen-item-actions">
                      {item.kitchen_status === 'new' && (
                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(order.id, item.id, 'preparing')}>
                          🔥 Hazırlıyorum
                        </button>
                      )}
                      {item.kitchen_status === 'preparing' && (
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, item.id, 'ready')}>
                          ✅ Hazır
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
