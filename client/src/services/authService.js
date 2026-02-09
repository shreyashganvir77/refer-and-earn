import { request } from "./http";

export const authService = {
  googleLogin(idToken) {
    return request("/auth/google", {
      method: "POST",
      body: { idToken },
      auth: false,
    });
  },

  me() {
    return request("/auth/me");
  },

  logout() {
    return request("/auth/logout", { method: "POST", auth: false });
  },

  setCookieFromToken(token) {
    return request("/auth/set-cookie", {
      method: "POST",
      body: { token },
      auth: false,
    });
  },
};
