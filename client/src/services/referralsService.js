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

  submitProviderReview(referralRequestId, { stars, review_text }) {
    return request('/api/provider-reviews', {
      method: 'POST',
      body: { referral_request_id: referralRequestId, stars, review_text },
    });
  },

  createSupportTicket(referralRequestId, { issue_type, description }) {
    return request('/api/support-tickets', {
      method: 'POST',
      body: { referral_request_id: referralRequestId, issue_type, description },
    });
  },
};

