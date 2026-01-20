const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  authGoogle: (idToken) => request('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  me: () => request('/auth/me'),
  patchMe: (payload) => request('/users/me', { method: 'PATCH', body: payload }),
  startReferralOtp: (companyEmail) =>
    request('/users/me/otp/start', {
      method: 'POST',
      body: { company_official_email: companyEmail },
    }),
  verifyReferralOtp: (code) =>
    request('/users/me/otp/verify', {
      method: 'POST',
      body: { code },
    }),
  companies: () => request('/companies', { auth: false }),
  providersByCompany: (companyId) => request(`/companies/${companyId}/providers`, { auth: false }),
  createReferral: (payload) => request('/referrals', { method: 'POST', body: payload }),
};

