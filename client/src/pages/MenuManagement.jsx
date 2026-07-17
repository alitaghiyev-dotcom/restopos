import { useState, useEffect } from 'react';
import { menu as menuApi } from '../services/api';

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  
  // Modals / forms state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // if null, it's 'add'
  
  // Form data
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '🍽️', color: '#6366f1' });

  const loadCategories = () => {
    menuApi.getAdminCategories().then(cats => {
      // Sadece aktif olan kategorileri göster veya pasifleri gri yap
      const activeCats = cats.filter(c => c.active !== 0);
      setCategories(activeCats);
      if (activeCats.length > 0 && !activeCats.find(c => c.id === activeCat)) {
        setActiveCat(activeCats[0].id);
      }
    });
  };

  const loadProducts = () => {
    if (activeCat) {
      menuApi.getAdminProducts(activeCat).then(setProducts);
    } else {
      setProducts([]);
    }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [activeCat]);

  // --- Product Handlers ---
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !activeCat) return;
    await menuApi.addProduct({ category_id: activeCat, ...newProduct, price: Number(newProduct.price) });
    setNewProduct({ name: '', price: '', description: '' });
    setShowAddProduct(false);
    loadProducts();
  };

  const toggleProductStatus = async (product) => {
    await menuApi.updateProduct(product.id, { available: product.available ? 0 : 1 });
    loadProducts();
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`${product.name} ürününü silmek istediğinize emin misiniz?`)) {
      await menuApi.deleteProduct(product.id);
      loadProducts();
    }
  };

  // --- Category Handlers ---
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', icon: '🍽️', color: '#6366f1' });
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, icon: cat.icon || '🍽️', color: cat.color || '#6366f1' });
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name) return;
    if (editingCategory) {
      await menuApi.updateCategory(editingCategory.id, categoryForm);
    } else {
      await menuApi.addCategory(categoryForm);
    }
    setShowCategoryModal(false);
    loadCategories();
  };

  const deleteCategory = async () => {
    if (!editingCategory) return;
    if (window.confirm(`${editingCategory.name} kategorisini (ve içindeki ürünleri) silmek istediğinize emin misiniz?`)) {
      await menuApi.deleteCategory(editingCategory.id);
      setShowCategoryModal(false);
      loadCategories();
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Menü Yönetimi</h1>
          <p className="page-subtitle">Kategoriler ve ürünler (Admin: Tümünü Gösterir)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>+ Yeni Ürün</button>
      </div>

      <div className="zone-tabs" style={{ marginBottom: 20, alignItems: 'center' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', background: activeCat === cat.id ? 'var(--bg-card)' : 'transparent', borderRadius: 'var(--radius-full)' }}>
            <button 
              className={`zone-tab ${activeCat === cat.id ? 'active' : ''}`} 
              onClick={() => setActiveCat(cat.id)}
              style={{ margin: 0, borderRight: activeCat === cat.id ? 'none' : '', borderTopRightRadius: activeCat === cat.id ? 0 : '', borderBottomRightRadius: activeCat === cat.id ? 0 : '' }}
            >
              {cat.icon} {cat.name}
            </button>
            {activeCat === cat.id && (
              <button 
                className="btn btn-ghost" 
                style={{ padding: '8px 12px', border: '1px solid var(--accent-primary)', borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, color: 'var(--text-muted)' }} 
                onClick={() => openEditCategory(cat)}
                title="Kategoriyi Düzenle"
              >
                ⚙️
              </button>
            )}
          </div>
        ))}
        <button className="btn btn-ghost" onClick={openAddCategory} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
          + Kategori Ekle
        </button>
      </div>

      {showAddProduct && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', border: '2px dashed var(--accent-primary)' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ürün Adı</label>
            <input className="input" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="Örn: Serpme Kahvaltı" />
          </div>
          <div style={{ width: 120 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fiyat (₺)</label>
            <input className="input" type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({...p, price: e.target.value}))} placeholder="0" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Açıklama</label>
            <input className="input" value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} placeholder="İsteğe bağlı içerik bilgisi" />
          </div>
          <button className="btn btn-success" onClick={handleAddProduct}>Kaydet</button>
          <button className="btn btn-ghost" onClick={() => setShowAddProduct(false)}>İptal</button>
        </div>
      )}

      {categories.length === 0 && (
        <div className="empty-state">
          <p>Henüz kategori eklenmemiş. Önce bir kategori ekleyin.</p>
          <button className="btn btn-primary" onClick={openAddCategory}>Kategori Ekle</button>
        </div>
      )}

      {categories.length > 0 && products.length === 0 && !showAddProduct && (
        <p style={{ color: 'var(--text-muted)' }}>Bu kategoride henüz ürün yok.</p>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {products.map(product => (
          <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: product.available ? 1 : 0.6, borderLeft: product.available ? '4px solid var(--success-color)' : '4px solid var(--danger-color)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', textDecoration: product.available ? 'none' : 'line-through', color: product.available ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.description}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: product.available ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              ₺{product.price?.toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn btn-sm ${product.available ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleProductStatus(product)}>
                {product.available ? '✅ Aktif' : '❌ Pasif (Gizli)'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => handleDeleteProduct(product)} title="Ürünü Sil">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h2>
            
            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Kategori Adı</label>
              <input className="input" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="Örn: Kahvaltılıklar, İçecekler" />
            </div>

            <div className="form-group">
              <label>İkon (Emoji)</label>
              <input className="input" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} placeholder="🍔" />
            </div>

            <div className="form-group">
              <label>Renk</label>
              <input type="color" className="input" style={{ padding: 4, height: 40 }} value={categoryForm.color} onChange={e => setCategoryForm({...categoryForm, color: e.target.value})} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              {editingCategory ? (
                <button className="btn btn-danger" onClick={deleteCategory}>🗑️ Sil</button>
              ) : <div></div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setShowCategoryModal(false)}>İptal</button>
                <button className="btn btn-primary" onClick={saveCategory}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
