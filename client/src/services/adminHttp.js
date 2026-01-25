const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export function getAdminToken() {
  return localStorage.getItem('admin_token');
}

export function setAdminToken(token) {
  if (token) localStorage.setItem('admin_token', token);
  else localStorage.removeItem('admin_token');
}

export async function adminRequest(path, { method = 'GET', body } = {}) {
  const token = getAdminToken();
  if (!token) {
    const err = new Error('Not logged in');
    err.status = 401;
    throw err;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
