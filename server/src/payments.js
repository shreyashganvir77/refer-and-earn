const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getPool, sql } = require('./db');
const { hasOpenTicketForReferral } = require('./supportTicketsService');

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLATFORM_FEE_PERCENTAGE = 20; // 20% commission

/**
 * Verify Razorpay signature
 */
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Calculate payment breakdown
 */
function calculatePaymentBreakdown(totalAmount) {
  const platformFee = (totalAmount * PLATFORM_FEE_PERCENTAGE) / 100;
  const providerAmount = totalAmount - platformFee;
  return {
    totalAmount,
    platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimals
    providerAmount: Math.round(providerAmount * 100) / 100,
  };
}

/**
 * Create Razorpay order for a referral request
 */
async function createPaymentOrder(referralRequestId, requesterUserId) {
  const pool = await getPool();

  // Fetch referral request
  const referralResult = await pool.request()
    .input('request_id', sql.BigInt, referralRequestId)
    .input('requester_user_id', sql.BigInt, requesterUserId)
    .query(`
      SELECT *
      FROM referral_requests
      WHERE request_id = @request_id
        AND requester_user_id = @requester_user_id
    `);
    
  if (referralResult.recordset.length === 0) {
    throw new Error('Referral request not found');
  }

  const referral = referralResult.recordset[0];

  // Extract and validate provider_user_id
  if (!referral.provider_user_id) {
    throw new Error('Provider user ID not found in referral request');
  }

  // Convert provider_user_id to BigInt
  // MSSQL returns BigInt columns, but we need to ensure proper type for sql.BigInt parameter
  const rawProviderId = referral.provider_user_id;
  let providerUserId;
  
  // Handle the value based on its type
  if (typeof rawProviderId === 'bigint') {
    providerUserId = rawProviderId;
  } else {
    // Convert to BigInt - handle string, number, or other types
    try {
      providerUserId = BigInt(String(rawProviderId));
    } catch (e) {
      throw new Error(`Invalid provider_user_id: cannot convert ${rawProviderId} to BigInt`);
    }
  }
  
  if (providerUserId <= 0n) {
    throw new Error('Invalid provider_user_id: must be greater than 0');
  }

  // Check if already paid
  if (referral.payment_status === 'PAID' || referral.payment_status === 'RELEASED') {
    throw new Error('Payment already processed for this referral');
  }

  // Check if payment already exists
  const existingPaymentResult = await pool.request()
    .input('referral_request_id', sql.BigInt, referralRequestId)
    .query(`
      SELECT TOP 1 * FROM payments
      WHERE referral_request_id = @referral_request_id
        AND status IN ('CREATED', 'PAID', 'RELEASED')
    `);

  if (existingPaymentResult.recordset.length > 0) {
    const existing = existingPaymentResult.recordset[0];
    if (existing.status === 'PAID' || existing.status === 'RELEASED') {
      throw new Error('Payment already processed');
    }
    // Return existing order if CREATED
    return {
      orderId: existing.razorpay_order_id,
      amount: existing.total_amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  const priceAgreed = Number(referral.price_agreed);
  if (isNaN(priceAgreed) || priceAgreed <= 0) {
    throw new Error('Invalid price_agreed');
  }

  const { totalAmount, platformFee, providerAmount } = calculatePaymentBreakdown(priceAgreed);

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // Convert to paise
    currency: 'INR',
    receipt: `referral_${referralRequestId}`,
    payment_capture: 1,
    notes: {
      referral_request_id: String(referralRequestId),
      requester_user_id: String(requesterUserId),
      provider_user_id: String(providerUserId),
    },
  });

  // Insert payment record
  await pool.request()
    .input('referral_request_id', sql.BigInt, referralRequestId)
    .input('requester_user_id', sql.BigInt, requesterUserId)
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('razorpay_order_id', sql.NVarChar(100), order.id)
    .input('total_amount', sql.Decimal(10, 2), totalAmount)
    .input('platform_fee', sql.Decimal(10, 2), platformFee)
    .input('provider_amount', sql.Decimal(10, 2), providerAmount)
    .input('status', sql.NVarChar(30), 'CREATED')
    .query(`
      INSERT INTO payments
        (referral_request_id, requester_user_id, provider_user_id,
         razorpay_order_id, total_amount, platform_fee, provider_amount, status,
         created_at, updated_at)
      VALUES
        (@referral_request_id, @requester_user_id, @provider_user_id,
         @razorpay_order_id, @total_amount, @platform_fee, @provider_amount, @status,
         SYSUTCDATETIME(), SYSUTCDATETIME())
    `);

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
}

/**
 * Verify payment and update database
 */
async function verifyPayment(orderId, paymentId, signature) {
  const pool = await getPool();

  // Verify signature
  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    throw new Error('Invalid payment signature');
  }

  // Fetch payment record
  const paymentResult = await pool.request()
    .input('razorpay_order_id', sql.NVarChar(100), orderId)
    .query(`
      SELECT TOP 1 * FROM payments
      WHERE razorpay_order_id = @razorpay_order_id
    `);

  if (paymentResult.recordset.length === 0) {
    throw new Error('Payment order not found');
  }

  const payment = paymentResult.recordset[0];

  // Check if already processed
  if (payment.status === 'PAID' || payment.status === 'RELEASED') {
    return {
      success: true,
      payment_id: payment.payment_id,
      status: payment.status,
    };
  }

  // Verify with Razorpay API
  try {
    const razorpayPayment = await razorpay.payments.fetch(paymentId);
    if (razorpayPayment.status !== 'captured') {
      throw new Error('Payment not captured');
    }
  } catch (error) {
    // Mark as failed
    await pool.request()
      .input('payment_id', sql.BigInt, payment.payment_id)
      .query(`
        UPDATE payments
        SET status = 'FAILED',
            updated_at = SYSUTCDATETIME()
        WHERE payment_id = @payment_id
      `);
    throw new Error('Payment verification failed');
  }

  // Update payment record
  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);

    // Update payment
    await reqTx
      .input('payment_id', sql.BigInt, payment.payment_id)
      .input('razorpay_payment_id', sql.NVarChar(100), paymentId)
      .input('razorpay_signature', sql.NVarChar(255), signature)
      .query(`
        UPDATE payments
        SET razorpay_payment_id = @razorpay_payment_id,
            razorpay_signature = @razorpay_signature,
            status = 'PAID',
            updated_at = SYSUTCDATETIME()
        WHERE payment_id = @payment_id
      `);

    // Update referral request payment status
    await reqTx
      .input('referral_request_id', sql.BigInt, payment.referral_request_id)
      .query(`
        UPDATE referral_requests
        SET payment_status = 'PAID',
            updated_at = SYSUTCDATETIME()
        WHERE request_id = @referral_request_id
      `);

    await transaction.commit();

    return {
      success: true,
      payment_id: payment.payment_id,
      status: 'PAID',
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Release payment to provider (called when referral is completed).
 * Blocks release if an OPEN support ticket exists for this referral.
 */
async function releasePaymentToProvider(referralRequestId, providerUserId) {
  const open = await hasOpenTicketForReferral(referralRequestId);
  if (open) {
    return { success: false, blocked: true, reason: 'OPEN_SUPPORT_TICKET' };
  }

  const pool = await getPool();

  // Fetch payment record
  const paymentResult = await pool.request()
    .input('referral_request_id', sql.BigInt, referralRequestId)
    .input('provider_user_id', sql.BigInt, providerUserId)
    .query(`
      SELECT TOP 1 * FROM payments
      WHERE referral_request_id = @referral_request_id
        AND provider_user_id = @provider_user_id
        AND status = 'PAID'
    `);

  if (paymentResult.recordset.length === 0) {
    throw new Error('Paid payment not found for this referral');
  }

  const payment = paymentResult.recordset[0];

  // Check if already released
  if (payment.status === 'RELEASED') {
    return { success: true, already_released: true };
  }

  // Fetch provider's fund account ID (stored in user profile or separate table)
  // For now, we'll use a placeholder - you may need to add fund_account_id to users table
  const providerResult = await pool.request()
    .input('user_id', sql.BigInt, providerUserId)
    .query('SELECT TOP 1 email, full_name FROM users WHERE user_id = @user_id');

  if (providerResult.recordset.length === 0) {
    throw new Error('Provider not found');
  }

  // Note: Razorpay payouts require fund_account_id which needs to be set up separately
  // This is a placeholder - you'll need to implement fund account creation/retrieval
  const fundAccountId = process.env.RAZORPAY_PROVIDER_FUND_ACCOUNT_ID; // Or fetch from DB

  if (!fundAccountId) {
    // For now, just mark as released in DB (manual payout)
    // In production, implement actual Razorpay payout
    const transaction = new sql.Transaction(await getPool());
    try {
      await transaction.begin();
      const reqTx = new sql.Request(transaction);

      await reqTx
        .input('payment_id', sql.BigInt, payment.payment_id)
        .query(`
          UPDATE payments
          SET status = 'RELEASED',
              updated_at = SYSUTCDATETIME()
          WHERE payment_id = @payment_id
        `);

      await reqTx
        .input('referral_request_id', sql.BigInt, referralRequestId)
        .query(`
          UPDATE referral_requests
          SET payment_status = 'RELEASED',
              updated_at = SYSUTCDATETIME()
          WHERE request_id = @referral_request_id
        `);

      await transaction.commit();

      return {
        success: true,
        payment_id: payment.payment_id,
        provider_amount: payment.provider_amount,
        note: 'Payment marked as released (manual payout required)',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // If fund account ID is available, create Razorpay payout
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: Math.round(payment.provider_amount * 100), // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      notes: {
        referral_request_id: String(referralRequestId),
        payment_id: String(payment.payment_id),
      },
    });

    // Update payment record
    const transaction = new sql.Transaction(await getPool());
    try {
      await transaction.begin();
      const reqTx = new sql.Request(transaction);

      await reqTx
        .input('payment_id', sql.BigInt, payment.payment_id)
        .query(`
          UPDATE payments
          SET status = 'RELEASED',
              updated_at = SYSUTCDATETIME()
          WHERE payment_id = @payment_id
        `);

      await reqTx
        .input('referral_request_id', sql.BigInt, referralRequestId)
        .query(`
          UPDATE referral_requests
          SET payment_status = 'RELEASED',
              updated_at = SYSUTCDATETIME()
          WHERE request_id = @referral_request_id
        `);

      await transaction.commit();

      return {
        success: true,
        payment_id: payment.payment_id,
        payout_id: payout.id,
        provider_amount: payment.provider_amount,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Razorpay payout error:', error);
    throw new Error('Failed to create payout: ' + error.message);
  }
}

/**
 * Refund payment
 */
async function refundPayment(referralRequestId, requesterUserId) {
  const pool = await getPool();

  // Fetch referral request
  const referralResult = await pool.request()
    .input('request_id', sql.BigInt, referralRequestId)
    .input('requester_user_id', sql.BigInt, requesterUserId)
    .query(`
      SELECT TOP 1 * FROM referral_requests
      WHERE request_id = @request_id
        AND requester_user_id = @requester_user_id
    `);

  if (referralResult.recordset.length === 0) {
    throw new Error('Referral request not found');
  }

  const referral = referralResult.recordset[0];

  // Check if referral is already accepted
  if (referral.status === 'ACCEPTED' || referral.status === 'COMPLETED') {
    throw new Error('Cannot refund: Referral already accepted or completed');
  }

  // Check payment status
  if (referral.payment_status !== 'PAID') {
    throw new Error('Payment not found or already refunded');
  }

  // Fetch payment record
  const paymentResult = await pool.request()
    .input('referral_request_id', sql.BigInt, referralRequestId)
    .query(`
      SELECT TOP 1 * FROM payments
      WHERE referral_request_id = @referral_request_id
        AND status = 'PAID'
    `);

  if (paymentResult.recordset.length === 0) {
    throw new Error('Paid payment not found');
  }

  const payment = paymentResult.recordset[0];

  if (!payment.razorpay_payment_id) {
    throw new Error('Razorpay payment ID not found');
  }

  // Create refund via Razorpay
  try {
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: Math.round(payment.total_amount * 100), // Full refund
      notes: {
        reason: 'Referral request cancelled',
        referral_request_id: String(referralRequestId),
      },
    });

    // Update payment and referral request
    const transaction = new sql.Transaction(await getPool());
    try {
      await transaction.begin();
      const reqTx = new sql.Request(transaction);

      await reqTx
        .input('payment_id', sql.BigInt, payment.payment_id)
        .query(`
          UPDATE payments
          SET status = 'REFUNDED',
              updated_at = SYSUTCDATETIME()
          WHERE payment_id = @payment_id
        `);

      await reqTx
        .input('referral_request_id', sql.BigInt, referralRequestId)
        .query(`
          UPDATE referral_requests
          SET payment_status = 'REFUNDED',
              updated_at = SYSUTCDATETIME()
          WHERE request_id = @referral_request_id
        `);

      await transaction.commit();

      return {
        success: true,
        refund_id: refund.id,
        amount: refund.amount / 100, // Convert from paise
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw new Error('Failed to process refund: ' + error.message);
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(webhookBody, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
    .update(webhookBody)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Handle Razorpay webhook events
 */
async function handleWebhookEvent(event, payload) {
  const pool = await getPool();

  switch (event) {
    case 'payment.captured': {
      const paymentId = payload.payment?.entity?.id;
      const orderId = payload.payment?.entity?.order_id;

      if (!paymentId || !orderId) {
        console.error('Missing payment_id or order_id in webhook');
        return;
      }

      // Find payment record
      const paymentResult = await pool.request()
        .input('razorpay_order_id', sql.NVarChar(100), orderId)
        .query(`
          SELECT TOP 1 * FROM payments
          WHERE razorpay_order_id = @razorpay_order_id
        `);

      if (paymentResult.recordset.length === 0) {
        console.error('Payment not found for order:', orderId);
        return;
      }

      const payment = paymentResult.recordset[0];

      // Only update if not already PAID
      if (payment.status !== 'PAID' && payment.status !== 'RELEASED') {
        const transaction = new sql.Transaction(await getPool());
        try {
          await transaction.begin();
          const reqTx = new sql.Request(transaction);

          await reqTx
            .input('payment_id', sql.BigInt, payment.payment_id)
            .input('razorpay_payment_id', sql.NVarChar(100), paymentId)
            .query(`
              UPDATE payments
              SET razorpay_payment_id = @razorpay_payment_id,
                  status = 'PAID',
                  updated_at = SYSUTCDATETIME()
              WHERE payment_id = @payment_id
            `);

          await reqTx
            .input('referral_request_id', sql.BigInt, payment.referral_request_id)
            .query(`
              UPDATE referral_requests
              SET payment_status = 'PAID',
                  updated_at = SYSUTCDATETIME()
              WHERE request_id = @referral_request_id
            `);

          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          console.error('Error updating payment from webhook:', error);
        }
      }
      break;
    }

    case 'payout.processed': {
      const payoutId = payload.payout?.entity?.id;
      // Update payment status if needed
      // You may want to store payout_id in payments table
      console.log('Payout processed:', payoutId);
      break;
    }

    case 'payout.failed': {
      const payoutId = payload.payout?.entity?.id;
      console.error('Payout failed:', payoutId);
      // Handle failed payout - may need to retry or notify admin
      break;
    }

    default:
      console.log('Unhandled webhook event:', event);
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  releasePaymentToProvider,
  refundPayment,
  verifyWebhookSignature,
  handleWebhookEvent,
};
