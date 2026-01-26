// Backward-compatible barrel (old imports still work).
// Prefer importing the specific service: authService, userService, companiesService, referralsService, paymentsService.

import { authService } from './authService';
import { userService } from './userService';
import { companiesService } from './companiesService';
import { referralsService } from './referralsService';
import { paymentsService } from './paymentsService';

export const api = {
  // Auth
  authGoogle: authService.googleLogin,
  me: authService.me,

  // User/profile
  patchMe: userService.patchMe,
  startReferralOtp: userService.startReferralOtp,
  verifyReferralOtp: userService.verifyReferralOtp,
  payoutSetup: userService.payoutSetup,

  // Companies/providers
  companies: companiesService.list,
  companiesSearch: companiesService.search,
  companyDomains: companiesService.getDomains,
  providersByCompany: companiesService.providersByCompany,

  // Referrals
  createReferral: referralsService.create,
  requestedReferrals: referralsService.requested,
  providerReferrals: referralsService.providerReferrals,
  completeReferral: referralsService.complete,
  submitProviderReview: referralsService.submitProviderReview,
  createSupportTicket: referralsService.createSupportTicket,

  // Payments
  createPaymentOrder: paymentsService.createOrder,
  verifyPayment: (orderId, paymentId, signature) =>
    paymentsService.verify({ orderId, paymentId, signature }),
  refundPayment: paymentsService.refund,
};

