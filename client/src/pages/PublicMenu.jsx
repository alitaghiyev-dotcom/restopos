import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './PublicMenu.css';

// Public endpoints don't need token, so we can just use normal fetch
const API_URL = '/api';

export default function PublicMenu() {
  const { tableId } = useParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await fetch(`${API_URL}/menu/categories`);
        const cats = await catRes.json();
        setCategories(cats);
        
        if (cats.length > 0) {
          setActiveCat(cats[0].id);
        }
      } catch (err) {
        console.error('Menu yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeCat) {
      fetch(`${API_URL}/menu/products?category_id=${activeCat}`)
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(console.error);
    }
  }, [activeCat]);

  if (loading) {
    return <div className="qr-loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="qr-menu-container animate-fade-in">
      <div className="qr-header">
        <h1>RestoPos Menü</h1>
        {tableId && <p>Masa {tableId}</p>}
      </div>

      <div className="qr-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`qr-cat-btn ${activeCat === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
            style={activeCat === cat.id ? { borderColor: cat.color, color: cat.color, background: cat.color + '11' } : {}}
          >
            <span className="qr-cat-icon">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="qr-products">
        {products.map(p => (
          <div key={p.id} className="qr-product-card">
            <div className="qr-product-info">
              <h3>{p.name}</h3>
              {p.description && <p className="qr-product-desc">{p.description}</p>}
              <span className="qr-product-price">₺{p.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Bu kategoride ürün bulunmuyor.</p>
        )}
      </div>
    </div>
  );
}
