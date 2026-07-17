import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orders as ordersApi } from '../services/api';
import { printReceipt } from '../utils/printReceipt';
import './Checkout.css';

export default function Checkout() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percent');
  const [processing, setProcessing] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    const load = async () => {
      const list = await ordersApi.getAll({ table_id: tableId, status: 'active' });
      if (list.length > 0) {
        const full = await ordersApi.getById(list[0].id);
        setOrder(full);
      }
    };
    load();
  }, [tableId]);

  const calcTotal = () => {
    if (!order) return 0;
    let total = order.subtotal || 0;
    if (discount > 0) {
      total = discountType === 'percent' ? total * (1 - discount / 100) : total - discount;
    }
    const paid = order.paid_amount || 0;
    return Math.max(0, total - paid);
  };

  const handlePartialPay = async () => {
    if (!order || !partialAmount || Number(partialAmount) <= 0) return;
    const amount = Number(partialAmount);
    if (amount > calcTotal()) {
      alert('Kalan tutardan fazla ödeme alınamaz');
      return;
    }
    setProcessing(true);
    try {
      await ordersApi.pay(order.id, { amount, payment_method: paymentMethod });
      // Refresh order
      const full = await ordersApi.getById(order.id);
      setOrder(full);
      setPartialAmount('');
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!order) return;
    setProcessing(true);
    try {
      await ordersApi.close(order.id, { payment_method: paymentMethod, discount, discount_type: discountType });
      navigate('/tables');
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!order) return;
    const printData = {
      restaurant_name: 'RestoPos',
      table_number: order.table_number,
      order_id: order.id,
      waiter_name: order.staff_name,
      items: order.items.filter(i => i.kitchen_status !== 'cancelled'),
      subtotal: order.subtotal,
      discount: discountType === 'amount' ? discount : (order.subtotal * (discount / 100)),
      total: calcTotal()
    };
    printReceipt(printData, 'customer');
  };

  if (!order) return <div className="tables-loading"><div className="loading-spinner"></div><p>Yükleniyor...</p></div>;

  return (
    <div className="checkout-page animate-fade-in">
      <div className="order-header">
        <button className="btn btn-ghost" onClick={() => navigate('/tables')}>← Masalara Dön</button>
        <h1 className="page-title">💰 Hesap — Masa {order.table_number}</h1>
      </div>

      <div className="checkout-layout">
        <div className="checkout-items">
          <h2>Sipariş Detayı</h2>
          <div className="checkout-list">
            {order.items?.filter(i => i.kitchen_status !== 'cancelled').map(item => (
              <div key={item.id} className="checkout-item">
                <span className="checkout-qty">{item.quantity}×</span>
                <span className="checkout-name">{item.product_name}</span>
                <span className="checkout-price">₺{(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="checkout-subtotal">
            <span>Ara Toplam:</span>
            <span>₺{(order.subtotal || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="checkout-payment">
          <h2>Ödeme</h2>

          <div className="payment-methods">
            {[{ key: 'cash', icon: '💵', label: 'Nakit' }, { key: 'card', icon: '💳', label: 'Kredi Kartı' }, { key: 'mixed', icon: '🔄', label: 'Karışık' }].map(m => (
              <button key={m.key} className={`payment-btn ${paymentMethod === m.key ? 'active' : ''}`} onClick={() => setPaymentMethod(m.key)}>
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="discount-section">
            <h3>İndirim</h3>
            <div className="discount-row">
              <input type="number" className="input" value={discount} onChange={e => setDiscount(Number(e.target.value))} min="0" placeholder="0" />
              <div className="discount-type-btns">
                <button className={`dt-btn ${discountType === 'percent' ? 'active' : ''}`} onClick={() => setDiscountType('percent')}>%</button>
                <button className={`dt-btn ${discountType === 'amount' ? 'active' : ''}`} onClick={() => setDiscountType('amount')}>₺</button>
              </div>
            </div>
          </div>

          <div className="checkout-total-section">
            {order.paid_amount > 0 && (
              <div className="checkout-total" style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Önceden Ödenen:</span>
                <span>₺{order.paid_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="checkout-total">
              <span>Kalan Toplam:</span>
              <span className="total-amount">₺{calcTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="partial-payment" style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
            <input 
              type="number" 
              className="input" 
              placeholder="0.00" 
              value={partialAmount} 
              onChange={e => setPartialAmount(e.target.value)}
              style={{ flex: 1 }}
              min="0"
              step="0.01"
            />
            <button className="btn btn-secondary" onClick={handlePartialPay} disabled={processing || !partialAmount || Number(partialAmount) <= 0}>
              Kısmi Öde
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handlePrint}>
              🖨️ Yazdır
            </button>
            <button className="btn btn-primary btn-lg checkout-confirm" style={{ flex: 2, margin: 0 }} onClick={handleClose} disabled={processing}>
              {processing ? '⏳ İşleniyor...' : '✅ Hesabı Kapat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
