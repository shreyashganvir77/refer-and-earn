import { adminRequest, setAdminToken } from './adminHttp';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const adminService = {
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = res.ok ? (await res.json()) : null;
    if (!res.ok) {
      throw new Error(data?.error || 'Invalid username or password');
    }
    if (!data?.token) {
      throw new Error('Invalid response from server');
    }
    setAdminToken(data.token);
    return { token: data.token };
  },

  logout() {
    setAdminToken(null);
  },

  getSupportTickets() {
    return adminRequest('/api/admin/support-tickets');
  },
};
