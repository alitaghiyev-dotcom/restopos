import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', icon: '📈', label: 'Ana Sayfa', roles: ['admin', 'cashier'] },
  { path: '/tables', icon: '🪑', label: 'Masalar', roles: ['admin', 'cashier', 'waiter'] },
  { path: '/delivery', icon: '🛵', label: 'Paket Servis', roles: ['admin', 'cashier'] },
  { path: '/kitchen', icon: '🍳', label: 'Mutfak', roles: ['admin', 'kitchen'] },
  { path: '/menu-management', icon: '📋', label: 'Menü', roles: ['admin'] },
  { path: '/inventory', icon: '📦', label: 'Stok', roles: ['admin'] },
  { path: '/reports', icon: '📊', label: 'Raporlar', roles: ['admin', 'cashier'] },
  { path: '/z-report', icon: '🧾', label: 'Z Raporu', roles: ['admin', 'cashier'] },
  { path: '/staff', icon: '👥', label: 'Personel', roles: ['admin'] },
  { path: '/settings', icon: '⚙️', label: 'Ayarlar', roles: ['admin'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const roleLabels = {
    admin: 'Yönetici',
    cashier: 'Kasiyer',
    waiter: 'Garson',
    kitchen: 'Mutfak',
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">RestoPos</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems
          .filter((item) => item.roles.includes(user?.role))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive || location.pathname.startsWith(item.path) ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{roleLabels[user?.role] || user?.role}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Çıkış Yap">
          🚪
        </button>
      </div>
    </aside>
  );
}
