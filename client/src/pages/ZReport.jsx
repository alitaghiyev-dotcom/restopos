import { useState, useEffect } from 'react';
import { reports as reportsApi } from '../services/api';
import './ZReport.css';

export default function ZReport() {
  const [data, setData] = useState(null);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('today'); // today | history

  const load = async () => {
    const today = await reportsApi.zReportToday();
    setData(today);
    const hist = await reportsApi.zReportHistory();
    setHistory(hist);
  };
  useEffect(() => { load(); }, []);

  const handleClose = async () => {
    if (!closingCash && closingCash !== 0) return alert('Kasadaki nakit tutarını girin');
    setProcessing(true);
    try {
      await reportsApi.createZReport({
        opening_cash: Number(openingCash) || 0,
        closing_cash: Number(closingCash),
        notes
      });
      load();
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!data) return <div className="tables-loading"><div className="loading-spinner"></div><p>Yükleniyor...</p></div>;

  return (
    <div className="zreport-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🧾 Z Raporu / Kasa Kapanış</h1>
        <div className="zr-tabs">
          <button className={`btn btn-sm ${tab === 'today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('today')}>Bugün</button>
          <button className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')}>Geçmiş</button>
        </div>
      </div>

      {tab === 'today' && (
        <>
          {data.already_closed ? (
            <div className="zr-closed">
              <h2>✅ Bugün için kasa zaten kapatılmış</h2>
              <div className="zr-summary-grid">
                <div className="zr-stat"><span>Toplam Sipariş</span><strong>{data.report.total_orders}</strong></div>
                <div className="zr-stat"><span>Toplam Ciro</span><strong>₺{(data.report.total_revenue || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>Nakit</span><strong>₺{(data.report.cash_total || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>Kredi Kartı</span><strong>₺{(data.report.card_total || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>Kapatan</span><strong>{data.report.staff_name}</strong></div>
              </div>
            </div>
          ) : (
            <div className="zr-open">
              {data.active_orders > 0 && (
                <div className="zr-warning">⚠️ Dikkat: {data.active_orders} adet açık sipariş var. Kasayı kapatmadan önce tüm hesapları kapatmanız önerilir.</div>
              )}

              <div className="zr-summary-grid">
                <div className="zr-stat"><span>Toplam Sipariş</span><strong>{data.summary.total_orders || 0}</strong></div>
                <div className="zr-stat zr-stat-big"><span>Toplam Ciro</span><strong>₺{(data.summary.total_revenue || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>Nakit</span><strong>₺{(data.summary.cash_total || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>Kredi Kartı</span><strong>₺{(data.summary.card_total || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>Toplam İndirim</span><strong>₺{(data.summary.total_discount || 0).toFixed(2)}</strong></div>
                <div className="zr-stat"><span>İptal Edilen Ürün</span><strong>{data.total_cancelled}</strong></div>
              </div>

              <div className="zr-close-form">
                <h3>Kasa Kapanış</h3>
                <div className="zr-form-row">
                  <div>
                    <label>Açılış Kasa (₺)</label>
                    <input className="input" type="number" placeholder="0.00" value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
                  </div>
                  <div>
                    <label>Kapanış Kasa — Kasadaki Nakit (₺)</label>
                    <input className="input" type="number" placeholder="0.00" value={closingCash} onChange={e => setClosingCash(e.target.value)} />
                  </div>
                </div>

                {closingCash && (
                  <div className="zr-diff">
                    Fark: <strong style={{ color: Number(closingCash) - (data.summary.cash_total || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                      ₺{(Number(closingCash) - (data.summary.cash_total || 0) - (Number(openingCash) || 0)).toFixed(2)}
                    </strong>
                  </div>
                )}

                <textarea className="input" placeholder="Notlar (opsiyonel)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: '100%', resize: 'none' }} />
                <button className="btn btn-primary btn-lg" onClick={handleClose} disabled={processing} style={{ width: '100%', marginTop: '12px' }}>
                  {processing ? '⏳ İşleniyor...' : '🔒 Kasayı Kapat (Z Raporu Kes)'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="zr-history">
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Henüz Z raporu kesilmemiş</p>
          ) : (
            <table className="zr-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Sipariş</th>
                  <th>Ciro</th>
                  <th>Nakit</th>
                  <th>Kart</th>
                  <th>İptal</th>
                  <th>Kapatan</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r.id}>
                    <td>{r.report_date}</td>
                    <td>{r.total_orders}</td>
                    <td>₺{(r.total_revenue || 0).toFixed(2)}</td>
                    <td>₺{(r.cash_total || 0).toFixed(2)}</td>
                    <td>₺{(r.card_total || 0).toFixed(2)}</td>
                    <td>{r.total_cancelled}</td>
                    <td>{r.staff_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
