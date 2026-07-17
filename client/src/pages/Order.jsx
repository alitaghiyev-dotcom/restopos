import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menu as menuApi, orders as ordersApi, tables as tablesApi } from '../services/api';
import { printReceipt } from '../utils/printReceipt';
import './Order.css';

export default function Order() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [sending, setSending] = useState(false);
  const [printOnSend, setPrintOnSend] = useState(true);
  
  // Transfer / Merge
  const [allTables, setAllTables] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [cats, allTables] = await Promise.all([
        menuApi.getCategories(),
        tablesApi.getAll(),
      ]);
      setCategories(cats);
      if (cats.length > 0) setActiveCat(cats[0].id);
      setAllTables(allTables);
      const table = allTables.find(t => t.id === Number(tableId));
      setTableInfo(table);

      // Check for existing order
      const orderList = await ordersApi.getAll({ table_id: tableId, status: 'active' });
      if (orderList.length > 0) {
        const full = await ordersApi.getById(orderList[0].id);
        setExistingOrder(full);
      }
    };
    load();
  }, [tableId]);

  useEffect(() => {
    if (activeCat) {
      menuApi.getProducts(activeCat).then(setProducts);
    }
  }, [activeCat]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const updateNote = (productId, notes) => {
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, notes } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSend = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const result = await ordersApi.create(Number(tableId), cart.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        notes: i.notes || undefined,
      })));
      
      if (printOnSend) {
        // Build data structure for kitchen print
        const printData = {
          table_number: result.table_number || tableId,
          order_id: result.id,
          waiter_name: result.staff_name || 'Garson',
          items: cart.map(i => ({
            quantity: i.quantity,
            product_name: i.name,
            notes: i.notes
          }))
        };
        printReceipt(printData, 'kitchen');
      }

      navigate('/tables');
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTransfer = async (targetTable) => {
    if (!existingOrder) return;
    try {
      if (targetTable.status === 'occupied') {
        // Merge
        if (window.confirm(`${targetTable.number} nolu masada açık hesap var. Bu hesabı o masaya BİRLEŞTİRMEK istiyor musunuz?`)) {
          // targetTable has active order, so the existingOrder is the source
          // Wait, our API merge takes: POST /orders/:targetId/merge { source_order_id }
          // We need to know targetTable's active order id.
          // Or we can just transfer to the target table and let backend handle?
          // The backend requires the target order ID. Since we are on the source order, we need to find the target order ID first.
          // Let's fetch target table's active order:
          const targetOrders = await ordersApi.getAll({ table_id: targetTable.id, status: 'active' });
          if (targetOrders.length === 0) return alert('Hedef masada aktif sipariş bulunamadı.');
          await ordersApi.merge(targetOrders[0].id, existingOrder.id);
          navigate('/tables');
        }
      } else {
        // Transfer
        if (window.confirm(`Masayı ${targetTable.number} nolu masaya TAŞIMAK istiyor musunuz?`)) {
          await ordersApi.transfer(existingOrder.id, targetTable.id);
          navigate('/tables');
        }
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  return (
    <div className="order-page">
      <div className="order-header">
        <button className="btn btn-ghost" onClick={() => navigate('/tables')}>← Masalara Dön</button>
        <h1 className="page-title">
          Masa {tableInfo?.number || tableId}
          <span className="order-zone">{tableInfo?.zone_name}</span>
        </h1>
        {existingOrder && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setShowTransfer(true)}>
              🔄 Masa Aktar / Birleştir
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => navigate(`/checkout/${tableId}`)}
            >
              💰 Hesap / Ödeme
            </button>
          </div>
        )}
      </div>

      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{ minWidth: '600px' }}>
            <h2>Masa Aktar veya Birleştir</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Mevcut masayı boş bir masaya taşıyabilir veya dolu bir masaya birleştirebilirsiniz.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {allTables.filter(t => t.id !== Number(tableId)).map(t => (
                <button
                  key={t.id}
                  className={`btn ${t.status === 'empty' ? 'btn-ghost' : 'btn-secondary'}`}
                  style={{ border: '1px solid var(--border-color)', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    handleTransfer(t);
                    setShowTransfer(false);
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{t.number}</span>
                  <span style={{ fontSize: '0.75rem', color: t.status === 'empty' ? 'var(--text-muted)' : '#f97316' }}>
                    {t.status === 'empty' ? 'Boş' : 'Dolu'}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-ghost" onClick={() => setShowTransfer(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      <div className="order-layout">
        {/* Left: Menu */}
        <div className="order-menu">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCat === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCat(cat.id)}
                style={activeCat === cat.id ? { background: cat.color + '22', borderColor: cat.color, color: cat.color } : {}}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="products-grid stagger">
            {products.map(product => (
              <button key={product.id} className="product-card" onClick={() => addToCart(product)}>
                <div className="product-name">{product.name}</div>
                <div className="product-desc">{product.description}</div>
                <div className="product-price">₺{product.price.toFixed(2)}</div>
                <div className="product-add">+ Ekle</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="order-cart">
          <div className="cart-header">
            <h2>🛒 Sipariş</h2>
            <span className="cart-count">{cart.length} kalem</span>
          </div>

          {existingOrder && existingOrder.items && existingOrder.items.length > 0 && (
            <div className="existing-order">
              <h3>📋 Mevcut Siparişler</h3>
              {existingOrder.items.map(item => (
                <div key={item.id} className="existing-item">
                  <span>{item.quantity}× {item.product_name}</span>
                  <span className={`kitchen-badge kb-${item.kitchen_status}`}>{
                    item.kitchen_status === 'new' ? '🆕 Yeni' :
                    item.kitchen_status === 'preparing' ? '🔥 Hazırlanıyor' :
                    item.kitchen_status === 'ready' ? '✅ Hazır' :
                    item.kitchen_status === 'served' ? '🍽️ Servis Edildi' : '❌ İptal'
                  }</span>
                </div>
              ))}
              <div className="existing-total">
                Mevcut Toplam: <strong>₺{existingOrder.subtotal?.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span>🍽️</span>
                <p>Menüden ürün seçin</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">₺{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button className="qty-btn" onClick={() => updateQty(item.product_id, -1)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.product_id, 1)}>+</button>
                    <button className="qty-btn qty-remove" onClick={() => removeFromCart(item.product_id)}>🗑️</button>
                  </div>
                  <input
                    className="cart-item-note"
                    placeholder="Not ekle (opsiyonel)..."
                    value={item.notes}
                    onChange={(e) => updateNote(item.product_id, e.target.value)}
                  />
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <span>Yeni Toplam:</span>
                <span className="cart-total-amount">₺{cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="checkbox" 
                  id="print-kitchen" 
                  checked={printOnSend} 
                  onChange={(e) => setPrintOnSend(e.target.checked)} 
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="print-kitchen" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Mutfak fişi yazdır
                </label>
              </div>
              <button className="btn btn-primary btn-lg cart-send" onClick={handleSend} disabled={sending}>
                {sending ? '⏳ Gönderiliyor...' : '📤 Mutfağa Gönder'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
