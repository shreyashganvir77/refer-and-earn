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
};

