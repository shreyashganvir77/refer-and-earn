import { request } from "./http";

export const referralsService = {
  create(payload) {
    return request("/referrals", { method: "POST", body: payload });
  },

  requested() {
    return request("/referrals/requested");
  },

  providerReferrals() {
    return request("/api/provider/referrals");
  },

  complete(id) {
    return request(`/api/referrals/${id}/complete`, { method: "POST" });
  },

  submitProviderReview(referralRequestId, { stars, review_text }) {
    return request("/api/provider-reviews", {
      method: "POST",
      body: { referral_request_id: referralRequestId, stars, review_text },
    });
  },

  createSupportTicket(referralRequestId, { issue_type, description }) {
    return request("/api/support-tickets", {
      method: "POST",
      body: { referral_request_id: referralRequestId, issue_type, description },
    });
  },

  requestUpdate(referralRequestId, message) {
    return request("/api/referrals/request-update", {
      method: "POST",
      body: { referral_request_id: referralRequestId, message },
    });
  },

  getMessages(referralRequestId) {
    return request(`/api/referrals/${referralRequestId}/messages`);
  },

  updateDetails(referralRequestId, updates) {
    return request(`/api/referrals/${referralRequestId}/details`, {
      method: "PATCH",
      body: updates,
    });
  },
};
