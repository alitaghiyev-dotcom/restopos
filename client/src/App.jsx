import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Tables from './pages/Tables';
import Order from './pages/Order';
import Kitchen from './pages/Kitchen';
import Checkout from './pages/Checkout';
import MenuManagement from './pages/MenuManagement';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Delivery from './pages/Delivery';
import Inventory from './pages/Inventory';
import ZReport from './pages/ZReport';
import Dashboard from './pages/Dashboard';
import PublicMenu from './pages/PublicMenu';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/m/:tableId" element={<PublicMenu />} />
      <Route path="/m" element={<PublicMenu />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute roles={['admin', 'cashier']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/tables" element={<ProtectedRoute><Layout><Tables /></Layout></ProtectedRoute>} />
      <Route path="/order/:tableId" element={<ProtectedRoute><Layout><Order /></Layout></ProtectedRoute>} />
      <Route path="/kitchen" element={<ProtectedRoute roles={['admin', 'kitchen']}><Layout><Kitchen /></Layout></ProtectedRoute>} />
      <Route path="/checkout/:tableId" element={<ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute>} />
      <Route path="/delivery" element={<ProtectedRoute roles={['admin', 'cashier']}><Layout><Delivery /></Layout></ProtectedRoute>} />
      <Route path="/menu-management" element={<ProtectedRoute roles={['admin']}><Layout><MenuManagement /></Layout></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute roles={['admin']}><Layout><Staff /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin', 'cashier']}><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute roles={['admin']}><Layout><Inventory /></Layout></ProtectedRoute>} />
      <Route path="/z-report" element={<ProtectedRoute roles={['admin', 'cashier']}><Layout><ZReport /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Layout><Settings /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
