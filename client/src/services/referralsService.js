import { request } from './http';

export const referralsService = {
  create(payload) {
    return request('/referrals', { method: 'POST', body: payload });
  },

  requested() {
    return request('/referrals/requested');
  },

  providerReferrals() {
    return request('/api/provider/referrals');
  },

  complete(id) {
    return request(`/api/referrals/${id}/complete`, { method: 'POST' });
  },
};

