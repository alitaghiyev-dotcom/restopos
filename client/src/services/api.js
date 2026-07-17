const API_URL = '/api';

function getToken() {
  return localStorage.getItem('restopos_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  const res = await fetch(`${API_URL}${path}`, config);

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('restopos_token');
    localStorage.removeItem('restopos_user');
    window.location.href = '/';
    throw new Error('Oturum süresi doldu');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');
  return data;
}

// Auth
export const auth = {
  login: (pin) => request('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  me: () => request('/auth/me'),
};

// Tables
export const tables = {
  getAll: (zoneId) => request(`/tables${zoneId ? `?zone_id=${zoneId}` : ''}`),
  getZones: () => request('/tables/zones'),
  updateStatus: (id, status) => request(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Menu
export const menu = {
  getCategories: () => request('/menu/categories'),
  getProducts: (categoryId) => request(`/menu/products${categoryId ? `?category_id=${categoryId}` : ''}`),
  getAdminCategories: () => request('/menu/admin/categories'),
  getAdminProducts: (categoryId) => request(`/menu/admin/products${categoryId ? `?category_id=${categoryId}` : ''}`),
  addCategory: (data) => request('/menu/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/menu/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/menu/categories/${id}`, { method: 'DELETE' }),
  addProduct: (data) => request('/menu/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/menu/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/menu/products/${id}`, { method: 'DELETE' }),
};

// Orders
export const orders = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/orders/${id}`),
  create: (tableId, items) => request('/orders', { method: 'POST', body: JSON.stringify({ table_id: tableId, items }) }),
  updateItemStatus: (orderId, itemId, status, cancel_reason) =>
    request(`/orders/${orderId}/item/${itemId}/kitchen-status`, { method: 'PATCH', body: JSON.stringify({ kitchen_status: status, cancel_reason }) }),
  close: (id, data) => request(`/orders/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),
  pay: (id, data) => request(`/orders/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  transfer: (id, targetTableId) => request(`/orders/${id}/transfer`, { method: 'POST', body: JSON.stringify({ target_table_id: targetTableId }) }),
  merge: (targetId, sourceId) => request(`/orders/${targetId}/merge`, { method: 'POST', body: JSON.stringify({ source_order_id: sourceId }) }),
  getKitchenActive: () => request('/orders/kitchen/active'),
};

// Staff
export const staff = {
  getAll: () => request('/staff'),
  add: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Reports
export const reports = {
  daily: (date) => request(`/reports/daily${date ? `?date=${date}` : ''}`),
  weekly: () => request('/reports/weekly'),
  categories: () => request('/reports/categories'),
  staff: () => request('/reports/staff'),
  zReportToday: () => request('/reports/z-report/today'),
  createZReport: (data) => request('/reports/z-report', { method: 'POST', body: JSON.stringify(data) }),
  zReportHistory: () => request('/reports/z-reports'),
};

// Settings
export const settings = {
  get: () => request('/settings'),
  update: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Inventory (Stok)
export const inventory = {
  getAll: () => request('/inventory'),
  add: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addMovement: (id, data) => request(`/inventory/${id}/movement`, { method: 'POST', body: JSON.stringify(data) }),
  getMovements: (id) => request(`/inventory/${id}/movements`),
  getAlerts: () => request('/inventory/alerts'),
};

// Dashboard
export const dashboard = {
  getStats: () => request('/dashboard'),
};
