import { request } from './http';

export const companiesService = {
  list() {
    return request('/companies', { auth: false });
  },

  async search(search = '', limit = 15) {
    const q = new URLSearchParams();
    if (search != null && String(search).trim()) q.set('search', String(search).trim());
    q.set('limit', Math.min(Math.max(Number(limit) || 15, 1), 50));
    const { companies } = await request(`/companies/search?${q.toString()}`, { auth: false });
    return companies || [];
  },

  async getDomains(companyId) {
    const { domains } = await request(`/companies/${companyId}/domains`, { auth: false });
    return domains || [];
  },

  providersByCompany(companyId) {
    return request(`/companies/${companyId}/providers`, { auth: false });
  },
};

