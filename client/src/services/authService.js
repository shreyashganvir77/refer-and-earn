import { request } from './http';

export const authService = {
  googleLogin(idToken) {
    return request('/auth/google', { method: 'POST', body: { idToken }, auth: false });
  },

  me() {
    return request('/auth/me');
  },
};

