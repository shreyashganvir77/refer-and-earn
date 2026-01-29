import { request } from './http';

export const userService = {
  patchMe(payload) {
    return request('/users/me', { method: 'PATCH', body: payload });
  },

  startReferralOtp(companyEmail, companyId) {
    return request('/users/me/otp/start', {
      method: 'POST',
      body: {
        company_official_email: companyEmail,
        company_id: companyId != null ? Number(companyId) : undefined,
      },
    });
  },

  verifyReferralOtp(code) {
    return request('/users/me/otp/verify', {
      method: 'POST',
      body: { code },
    });
  },

  payoutSetup(upiId) {
    return request('/users/me/payout-setup', {
      method: 'POST',
      body: { upi_id: upiId },
    });
  },

  setupProviderPayout({ price_per_referral, upi_id }) {
    return request('/api/providers/setup-payout', {
      method: 'POST',
      body: { price_per_referral, upi_id },
    });
  },
};

