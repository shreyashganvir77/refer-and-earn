const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { requireAuth, requireAdmin, signSessionJwt } = require('./src/auth');
const { parseBigIntParam } = require('./src/utils');
const {
  handleGoogleAuth,
  getCurrentUser,
} = require('./src/authService');
const {
  updateUserProfile,
  startOtpVerification,
  verifyOtp,
} = require('./src/userService');
const { setupPayoutForProvider } = require('./src/payoutsService');
const {
  getCompanyDomains,
  listCompanies,
  searchCompanies,
  getProvidersByCompany,
} = require('./src/companiesService');
const {
  createReferralRequest,
  getRequestedReferrals,
  getProviderReferrals,
  completeReferral,
  updateReferralStatus,
} = require('./src/referralsService');
const {
  createReview,
  createReviewForReferral,
  getProviderReviews,
} = require('./src/reviewsService');
const { createSupportTicket, listAllSupportTickets } = require('./src/supportTicketsService');
const {
  createPaymentOrder,
  verifyPayment,
  refundPayment,
  verifyWebhookSignature,
  handleWebhookEvent,
} = require('./src/payments');

const app = express();
const PORT = process.env.PORT || 8000;
const API_BASE_URL = process.env.API_BASE_URL || '';

// Middleware
app.use(cors({
  origin: API_BASE_URL,
  credentials: true
}));
app.use(express.json());

// ---- Auth APIs (Google OAuth only) ----
app.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    const result = await handleGoogleAuth(idToken);
    return res.json(result);
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ error: e.message || 'Auth failed' });
  }
});
// Backward-compatible alias (older frontend path)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    const result = await handleGoogleAuth(idToken);
    return res.json(result);
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ error: e.message || 'Auth failed' });
  }
});

app.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await getCurrentUser(userId);
    if (!result) return res.status(401).json({ error: 'Unauthorized' });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});
// Backward-compatible alias (older frontend path)
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await getCurrentUser(userId);
    if (!result) return res.status(401).json({ error: 'Unauthorized' });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

// ---- User profile completion ----
app.patch('/users/me', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await updateUserProfile(userId, req.body || {});
    return res.json(result);
  } catch (error) {
    if (error.errorCode === 'COMPANY_EMAIL_NOT_VERIFIED') {
      return res.status(400).json({ errorCode: error.errorCode });
    }
    return res.status(400).json({ error: error.message || 'Profile update failed' });
  }
});

// ---- Referral provider OTP verification (company official email) ----
app.post('/users/me/otp/start', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { company_official_email, company_id } = req.body || {};
    const companyId = company_id != null ? parseBigIntParam(company_id) : null;
    const result = await startOtpVerification(userId, company_official_email, companyId);
    return res.json(result);
  } catch (error) {
    if (error.errorCode) {
      return res.status(400).json({ errorCode: error.errorCode });
    }
    const status = error.message.includes('Failed to send') ? 500 : 400;
    return res.status(status).json({ error: error.message || 'Failed to start OTP' });
  }
});

app.post('/users/me/otp/verify', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { code } = req.body || {};
    const result = await verifyOtp(userId, code);
    return res.json(result);
  } catch (error) {
    if (error.errorCode === 'COMPANY_EMAIL_NOT_VERIFIED') {
      return res.status(400).json({ errorCode: error.errorCode });
    }
    return res.status(400).json({ error: error.message || 'OTP verification failed' });
  }
});

// ---- Payout setup (Razorpay Contact + Fund Account VPA). Provider only, after profile complete. ----
app.post('/users/me/payout-setup', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { upi_id } = req.body || {};
    const upiId = typeof upi_id === 'string' ? upi_id.trim() : '';
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ error: 'upi_id is required and must be a valid UPI ID (e.g. user@upi)' });
    }

    const result = await setupPayoutForProvider(userId, upiId);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Payout setup failed' });
  }
});

// ---- Companies ----
app.get('/companies', async (_req, res) => {
  try {
    const result = await listCompanies();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to list companies' });
  }
});

app.get('/companies/search', async (req, res) => {
  try {
    const search = (req.query.search != null) ? String(req.query.search) : '';
    const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 50);
    const result = await searchCompanies(search, limit);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to search companies' });
  }
});

app.get('/companies/:companyId/domains', async (req, res) => {
  try {
    const companyId = parseBigIntParam(req.params.companyId);
    if (!companyId) return res.status(400).json({ error: 'Invalid companyId' });
    const domains = await getCompanyDomains(companyId);
    return res.json({ domains });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get company domains' });
  }
});

// ---- Referral Provider listing ----
app.get('/companies/:companyId/providers', async (req, res) => {
  try {
    const companyId = parseBigIntParam(req.params.companyId);
    if (!companyId) return res.status(400).json({ error: 'Invalid companyId' });

    const result = await getProvidersByCompany(companyId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get providers' });
  }
});

// ---- Provider: list referrals assigned to provider ----
app.get('/api/provider/referrals', requireAuth, async (req, res) => {
  try {
    const providerUserId = parseBigIntParam(req.auth.sub);
    if (!providerUserId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await getProviderReferrals(providerUserId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get provider referrals' });
  }
});

// ---- Provider: mark referral completed ----
app.post('/api/referrals/:id/complete', requireAuth, async (req, res) => {
  try {
    const providerUserId = parseBigIntParam(req.auth.sub);
    if (!providerUserId) return res.status(401).json({ error: 'Unauthorized' });

    const requestId = parseBigIntParam(req.params.id);
    if (!requestId) return res.status(400).json({ error: 'Invalid id' });

    const result = await completeReferral(requestId, providerUserId);
    return res.json(result);
  } catch (error) {
    const status = error.message === 'Not found' ? 404 :
                   error.message === 'Forbidden' ? 403 : 400;
    return res.status(status).json({ error: error.message || 'Failed to complete referral' });
  }
});

// ---- Referral requests ----
app.post('/referrals', requireAuth, async (req, res) => {
  try {
    const requesterUserId = parseBigIntParam(req.auth.sub);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await createReferralRequest(requesterUserId, req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Invalid') ? 400 : 500;
    return res.status(status).json({ error: error.message || 'Failed to create referral' });
  }
});

app.get('/referrals/requested', requireAuth, async (req, res) => {
  try {
    const requesterUserId = parseBigIntParam(req.auth.sub);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await getRequestedReferrals(requesterUserId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get requested referrals' });
  }
});

app.get('/referrals/received', requireAuth, async (req, res) => {
  try {
    const providerUserId = parseBigIntParam(req.auth.sub);
    if (!providerUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { getPool, sql } = require('./src/db');
    const pool = await getPool();
    const result = await pool.request()
      .input('provider_user_id', sql.BigInt, providerUserId)
      .query(`
        SELECT * FROM referral_requests
        WHERE provider_user_id = @provider_user_id
        ORDER BY created_at DESC
      `);
    return res.json({ referrals: result.recordset });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get received referrals' });
  }
});

app.patch('/referrals/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = parseBigIntParam(req.auth.sub);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const requestId = parseBigIntParam(req.params.id);
    if (!requestId) return res.status(400).json({ error: 'Invalid id' });

    const { status } = req.body || {};
    const result = await updateReferralStatus(requestId, userId, status);
    return res.json(result);
  } catch (error) {
    const status = error.message === 'Not found' ? 404 :
                   error.message === 'Forbidden' ? 403 :
                   error.message === 'Invalid status' ? 400 : 500;
    return res.status(status).json({ error: error.message || 'Failed to update status' });
  }
});

// ---- Reviews & ratings ----
app.post('/providers/:providerId/reviews', requireAuth, async (req, res) => {
  try {
    const givenByUserId = parseBigIntParam(req.auth.sub);
    if (!givenByUserId) return res.status(401).json({ error: 'Unauthorized' });

    const providerUserId = parseBigIntParam(req.params.providerId);
    if (!providerUserId) return res.status(400).json({ error: 'Invalid providerId' });

    const { stars, review_text } = req.body || {};
    const result = await createReview(givenByUserId, providerUserId, { stars, review_text });
    return res.status(201).json(result);
  } catch (error) {
    const status = error.message.includes('already exists') ? 409 :
                   error.message.includes('allowed only') ? 403 :
                   error.message.includes('Cannot review') ? 400 : 500;
    return res.status(status).json({ error: error.message || 'Failed to create review' });
  }
});

app.post('/api/provider-reviews', requireAuth, async (req, res) => {
  try {
    const requesterUserId = parseBigIntParam(req.auth.sub);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { referral_request_id, stars, review_text } = req.body || {};
    const referralRequestId = parseBigIntParam(referral_request_id);
    if (!referralRequestId) return res.status(400).json({ error: 'referral_request_id is required' });

    const result = await createReviewForReferral(referralRequestId, requesterUserId, { stars, review_text });
    return res.status(201).json(result);
  } catch (error) {
    if (error.errorCode === 'REFERRAL_NOT_COMPLETED' || error.errorCode === 'REVIEW_ALREADY_EXISTS') {
      return res.status(400).json({ errorCode: error.errorCode });
    }
    return res.status(400).json({ error: error.message || 'Failed to submit review' });
  }
});

app.post('/api/support-tickets', requireAuth, async (req, res) => {
  try {
    const raisedByUserId = parseBigIntParam(req.auth.sub);
    if (!raisedByUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { referral_request_id, issue_type, description } = req.body || {};
    const referralRequestId = parseBigIntParam(referral_request_id);
    if (!referralRequestId) return res.status(400).json({ error: 'referral_request_id is required' });

    const result = await createSupportTicket(referralRequestId, raisedByUserId, { issue_type, description });
    return res.status(201).json(result);
  } catch (error) {
    if (error.errorCode === 'REFERRAL_NOT_COMPLETED' || error.errorCode === 'SUPPORT_TICKET_ALREADY_EXISTS') {
      return res.status(400).json({ errorCode: error.errorCode });
    }
    return res.status(400).json({ error: error.message || 'Failed to create support ticket' });
  }
});

// ---- Admin APIs (username + password via env: ADMIN_USERNAME, ADMIN_PASSWORD) ----
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return res.status(503).json({ error: 'Admin login not configured' });
    }
    if (String(username) !== String(adminUser) || String(password) !== String(adminPass)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = signSessionJwt({ sub: 'admin', role: 'admin' });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Login failed' });
  }
});

app.get('/api/admin/support-tickets', requireAdmin, async (req, res) => {
  try {
    const result = await listAllSupportTickets();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load support tickets' });
  }
});

app.get('/providers/:providerId/reviews', async (req, res) => {
  try {
    const providerUserId = parseBigIntParam(req.params.providerId);
    if (!providerUserId) return res.status(400).json({ error: 'Invalid providerId' });

    const result = await getProviderReviews(providerUserId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to get reviews' });
  }
});

// ---- Payment APIs ----
// Create Razorpay order
app.post('/api/payments/create-order', requireAuth, async (req, res) => {
  try {
    const requesterUserId = parseBigIntParam(req.auth.sub);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { referral_request_id } = req.body || {};
    const referralRequestId = parseBigIntParam(referral_request_id);
    if (!referralRequestId) {
      return res.status(400).json({ error: 'referral_request_id is required' });
    }

    const order = await createPaymentOrder(referralRequestId, requesterUserId);
    return res.json(order);
  } catch (error) {
    console.error('Error creating payment order:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Failed to create payment order' });
  }
});

// Verify payment
app.post('/api/payments/verify', requireAuth, async (req, res) => {
  try {
    const requesterUserId = parseBigIntParam(req.auth.sub);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    const result = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return res.json(result);
  } catch (error) {
    console.error('Error verifying payment:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Payment verification failed' });
  }
});

// Refund payment
app.post('/api/payments/refund', requireAuth, async (req, res) => {
  try {
    const requesterUserId = parseBigIntParam(req.auth.sub);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { referral_request_id } = req.body || {};
    const referralRequestId = parseBigIntParam(referral_request_id);
    if (!referralRequestId) {
      return res.status(400).json({ error: 'referral_request_id is required' });
    }

    const result = await refundPayment(referralRequestId, requesterUserId);
    return res.json(result);
  } catch (error) {
    console.error('Error processing refund:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Refund failed' });
  }
});

// Razorpay webhook (no auth required, uses signature verification)
// Need to use raw body for signature verification
app.post('/api/razorpay/webhook', (req, res, next) => {
  // Store raw body for signature verification
  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    rawBody += chunk;
  });
  req.on('end', () => {
    req.rawBody = rawBody;
    try {
      req.body = JSON.parse(rawBody);
      next();
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  });
}, async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature using raw body
    if (!verifyWebhookSignature(req.rawBody, signature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    await handleWebhookEvent(event, payload);
    return res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
