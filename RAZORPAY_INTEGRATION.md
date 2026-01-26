# Razorpay Payment Integration - Implementation Summary

## Overview

Complete Razorpay payment gateway integration for the Refer & Earn platform, enabling secure payment processing for referral requests.

## Database Changes

### 1. Payments Table

Created `payments` table to track all payment transactions:

- Tracks Razorpay order IDs, payment IDs, and signatures
- Stores payment breakdown (total, platform fee, provider amount)
- Payment status: CREATED → PAID → RELEASED / FAILED / REFUNDED

### 2. Referral Requests Extension

Added `payment_status` column to `referral_requests`:

- UNPAID (default)
- PAID
- RELEASED
- REFUNDED

**Migration File:** `migration_add_payment_fields.sql`

## Backend Implementation

### Dependencies Added

- `razorpay`: ^2.9.2
- `crypto`: Built-in Node.js module

### New Module: `server/src/payments.js`

Core payment logic including:

- `createPaymentOrder()`: Creates Razorpay order and payment record
- `verifyPayment()`: Verifies payment signature and updates DB
- `releasePaymentToProvider()`: Releases payment when referral is completed
- `refundPayment()`: Processes refunds for unpaid referrals
- `handleWebhookEvent()`: Handles Razorpay webhook events
- `verifyWebhookSignature()`: Verifies webhook authenticity

### API Endpoints

#### 1. POST `/api/payments/create-order`

Creates Razorpay order for a referral request.

- **Auth:** Required
- **Input:** `{ referral_request_id }`
- **Output:** `{ orderId, amount, currency, key }`
- **Platform Fee:** 20% commission

#### 2. POST `/api/payments/verify`

Verifies payment after Razorpay checkout.

- **Auth:** Required
- **Input:** `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Output:** `{ success, payment_id, status }`
- **Security:** HMAC SHA256 signature verification

#### 3. POST `/api/payments/refund`

Refunds payment (only if referral not accepted/completed).

- **Auth:** Required
- **Input:** `{ referral_request_id }`
- **Output:** `{ success, refund_id, amount }`

#### 4. POST `/api/razorpay/webhook`

Handles Razorpay webhook events.

- **Auth:** None (uses signature verification)
- **Events:** `payment.captured`, `payout.processed`, `payout.failed`
- **Security:** Webhook signature verification

### Business Logic Updates

1. **Referral Creation:** Sets `payment_status = 'UNPAID'` by default
2. **Referral Completion:**
   - Checks `payment_status = 'PAID'` before allowing completion
   - Automatically releases payment to provider after completion
3. **Payment Release:**
   - Triggered when referral status = COMPLETED
   - Updates payment status to RELEASED
   - Note: Actual Razorpay payout requires fund account setup

## Frontend Implementation

### Dependencies

- Razorpay checkout script added to `public/index.html`

### API Service Updates (`client/src/services/api.js`)

Added payment methods:

- `createPaymentOrder(referralRequestId)`
- `verifyPayment(orderId, paymentId, signature)`
- `refundPayment(referralRequestId)`

### Page Updates

#### 1. WantReferral.jsx

- After creating referral request, automatically opens Razorpay checkout
- Handles payment success/failure
- Falls back gracefully if payment fails (user can pay later)

#### 2. MyReferrals.jsx

- Displays payment status badge
- "Pay Now" button for UNPAID referrals
- "Request Refund" button for PAID referrals (if not accepted/completed)
- Payment status indicators

## Payment Flow

### Standard Flow

1. User creates referral request → Status: PENDING, Payment: UNPAID
2. User pays via Razorpay → Payment: PAID
3. Provider accepts/completes referral → Status: COMPLETED
4. System releases payment to provider → Payment: RELEASED

### Refund Flow

1. User requests refund (only if referral not accepted/completed)
2. System processes Razorpay refund
3. Payment status updated to REFUNDED

## Security Features

✅ **Signature Verification:** All payments verified using HMAC SHA256
✅ **Webhook Verification:** Webhook events verified before processing
✅ **No Auto-Payment:** Provider payment only released after referral completion
✅ **Authorization Checks:** All endpoints require authentication
✅ **Status Validation:** Prevents invalid state transitions

## Environment Variables Required

### Backend (.env)

```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret (optional, falls back to key_secret)
RAZORPAY_ACCOUNT_NUMBER=your_account_number (for payouts)
RAZORPAY_PROVIDER_FUND_ACCOUNT_ID=fund_account_id (for payouts)
```

### Frontend (.env)

```
REACT_APP_RAZORPAY_KEY=your_key_id
```

## Testing Checklist

- [ ] Create referral request (should be UNPAID)
- [ ] Pay for referral via Razorpay checkout
- [ ] Verify payment updates status to PAID
- [ ] Complete referral as provider
- [ ] Verify payment released to provider
- [ ] Test refund flow (before acceptance)
- [ ] Test webhook events
- [ ] Verify signature validation

## Notes

1. **Payout Implementation:** The payout logic is implemented but requires Razorpay fund account setup. Currently falls back to marking as "RELEASED" in DB.

2. **Webhook Setup:** Configure webhook URL in Razorpay dashboard:
   - URL: `https://your-domain.com/api/razorpay/webhook`
   - Events: `payment.captured`, `payout.processed`, `payout.failed`

3. **Error Handling:** All payment operations include comprehensive error handling and user feedback.

4. **Idempotency:** Webhook handler checks payment status before updating to prevent duplicate processing.

## Next Steps

1. Run database migration: `migration_add_payment_fields.sql`
2. Install dependencies: `npm install` in server directory
3. Configure environment variables
4. Set up Razorpay webhook in dashboard
5. Test payment flow end-to-end
6. Set up fund accounts for provider payouts (if using automatic payouts)
