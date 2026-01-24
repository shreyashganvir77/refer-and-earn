import { request } from './http';

export const paymentsService = {
  createOrder(referralRequestId) {
    return request('/api/payments/create-order', {
      method: 'POST',
      body: { referral_request_id: referralRequestId },
    });
  },

  verify({ orderId, paymentId, signature }) {
    return request('/api/payments/verify', {
      method: 'POST',
      body: {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    });
  },

  refund(referralRequestId) {
    return request('/api/payments/refund', {
      method: 'POST',
      body: { referral_request_id: referralRequestId },
    });
  },
};

