const https = require("https");
const { getPool, sql } = require("./db");
const { hasOpenTicketForReferral } = require("./supportTicketsService");

// Required env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_ACCOUNT_NUMBER (RazorpayX current account / customer identifier)

/**
 * Razorpay X API: POST. Uses key_id:key_secret Basic auth.
 * @param {string} path - e.g. /v1/contacts
 * @param {object} body - JSON body
 * @param {object} [extraHeaders] - e.g. { 'X-Payout-Idempotency': '...' }
 * @private Do not log request/response bodies that contain UPI or secrets.
 */
function razorpayXPost(path, body, extraHeaders = {}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for payouts",
    );
  }

  const data = JSON.stringify(body);
  const b64 = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const headers = {
    Authorization: `Basic ${b64}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data, "utf8"),
    ...extraHeaders,
  };

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "api.razorpay.com",
      path: path.startsWith("/") ? path : `/${path}`,
      method: "POST",
      headers,
    };

    const req = https.request(opts, (res) => {
      let buf = "";
      res.on("data", (c) => {
        buf += c;
      });
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(buf || "{}");
        } catch {
          return reject(new Error("Razorpay X: invalid JSON response"));
        }
        if (res.statusCode >= 400) {
          const msg =
            parsed.error?.description ||
            parsed.error?.code ||
            buf ||
            "Request failed";
          return reject(new Error(`Razorpay X: ${msg}`));
        }
        resolve(parsed);
      });
    });
    req.on("error", reject);
    req.write(data, "utf8");
    req.end();
  });
}

/**
 * Step 1: Create Razorpay Contact.
 * @see https://razorpay.com/docs/api/x/contacts/create
 */
async function createContact(userId, user) {
  const referenceId = `provider_${userId}`;
  const payload = {
    name: user.full_name || "Provider",
    email: user.email || "",
    contact: (user.phone_number || "").trim() || undefined,
    type: "employee",
    reference_id: referenceId,
  };
  // Remove undefined fields so Razorpay does not receive null/undefined
  Object.keys(payload).forEach(
    (k) => payload[k] === undefined && delete payload[k],
  );

  const res = await razorpayXPost("/v1/contacts", payload);
  const contactId = res.id || res.contact?.id;
  if (!contactId) {
    throw new Error("Razorpay Contact create did not return id");
  }

  const pool = await getPool();
  await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("contact_id", sql.NVarChar(100), contactId).query(`
      UPDATE users
      SET razorpay_contact_id = @contact_id,
          payout_status = 'CONTACT_CREATED',
          updated_at = SYSUTCDATETIME()
      WHERE user_id = @user_id
    `);

  return contactId;
}

/**
 * Step 2: Create Razorpay Fund Account (VPA/UPI).
 * @see https://razorpay.com/docs/api/x/fund-accounts/create/vpa
 * @param upiId - UPI ID / VPA (e.g. user@upi). NOT logged.
 * @param pricePerReferral - number, stored on success only.
 */
async function createFundAccount(contactId, upiId, userId, pricePerReferral) {
  const vpa = String(upiId).trim().toLowerCase();
  if (!vpa || !vpa.includes("@")) {
    throw new Error("Invalid UPI ID");
  }

  const res = await razorpayXPost("/v1/fund_accounts", {
    contact_id: contactId,
    account_type: "vpa",
    vpa: { address: vpa },
  });

  const fundAccountId = res.id || res.fund_account?.id;
  if (!fundAccountId) {
    throw new Error("Razorpay Fund Account create did not return id");
  }

  const pool = await getPool();
  const req = pool.request();
  req.input("user_id", sql.BigInt, userId);
  req.input("fund_account_id", sql.NVarChar(100), fundAccountId);
  req.input("price_per_referral", sql.Decimal(10, 2), pricePerReferral);
  await req.query(`
    UPDATE users
    SET razorpay_fund_account_id = @fund_account_id,
        payout_status = 'ACTIVE',
        price_per_referral = @price_per_referral,
        is_referral_provider = 1,
        updated_at = SYSUTCDATETIME()
    WHERE user_id = @user_id
  `);

  return fundAccountId;
}

/**
 * Validates UPI ID format: something@bank (basic pattern).
 * Does not log or store the value.
 */
function isValidUpiId(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v.length > 256) return false;
  const at = v.indexOf("@");
  if (at <= 0 || at === v.length - 1) return false;
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (!/^[a-zA-Z0-9._-]+$/.test(local)) return false;
  if (!/^[a-zA-Z0-9]+$/.test(domain)) return false;
  return true;
}

/**
 * Payout setup: Create Contact (if missing) and Fund Account (VPA).
 * - User must be authenticated, is_referral_provider=1, razorpay_fund_account_id IS NULL.
 * - Does not re-create contact or fund account if payout_status is ACTIVE.
 * @param upiId - UPI/VPA; not stored, not logged.
 * @param pricePerReferral - number (INR), required, >= 0.
 */
async function setupPayoutForProvider(userId, upiId, pricePerReferral) {
  const uid = typeof userId === "bigint" ? userId : BigInt(String(userId));
  const pool = await getPool();

  const userResult = await pool.request().input("user_id", sql.BigInt, uid)
    .query(`
      SELECT TOP 1 user_id, full_name, email, is_referral_provider,
             razorpay_contact_id, razorpay_fund_account_id, payout_status
      FROM users
      WHERE user_id = @user_id
    `);

  const user = userResult.recordset[0];
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.is_referral_provider) {
    throw new Error("Only referral providers can set up payout. Enable \"Become a Provider\" and save your profile first.");
  }
  if (!user.full_name || !user.email) {
    throw new Error("Complete your profile (name, email) before payout setup");
  }
  if (user.razorpay_fund_account_id || (user.payout_status || "").toUpperCase() === "ACTIVE") {
    return { success: true, message: "Provider profile activated successfully" };
  }
  if (!isValidUpiId(upiId)) {
    throw new Error("Invalid UPI ID. Use format: yourname@bank");
  }
  const price = pricePerReferral == null ? NaN : Number(pricePerReferral);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Invalid price per referral");
  }

  let contactId = user.razorpay_contact_id;
  if (!contactId) {
    contactId = await createContact(uid, user);
  }

  await createFundAccount(contactId, upiId, uid, price);
  return { success: true, message: "Provider profile activated successfully" };
}

/**
 * Step 3: Release payout to provider via UPI (after referral COMPLETED).
 * Preconditions (all required):
 * - referral_requests.status = 'COMPLETED'
 * - referral_requests.payment_status = 'PAID'
 * - users.payout_status = 'ACTIVE', users.razorpay_fund_account_id IS NOT NULL
 * - No OPEN support_tickets for this referral
 * - payments.status != 'RELEASED'
 *
 * @see https://razorpay.com/docs/api/x/payouts/create/vpa
 */
async function releasePayoutForReferral(referralRequestId) {
  const reqId =
    typeof referralRequestId === "bigint"
      ? referralRequestId
      : BigInt(String(referralRequestId));
  const pool = await getPool();

  const refResult = await pool.request().input("request_id", sql.BigInt, reqId)
    .query(`
      SELECT TOP 1 request_id, provider_user_id, status, payment_status
      FROM referral_requests
      WHERE request_id = @request_id
    `);
  const ref = refResult.recordset[0];
  if (!ref) {
    throw new Error("Referral request not found");
  }
  if ((ref.status || "").toUpperCase() !== "COMPLETED") {
    throw new Error("Referral must be COMPLETED before payout");
  }
  if ((ref.payment_status || "").toUpperCase() !== "PAID") {
    throw new Error("Referral payment_status must be PAID");
  }

  const open = await hasOpenTicketForReferral(reqId);
  if (open) {
    throw new Error(
      "Cannot release payout: OPEN support ticket for this referral",
    );
  }

  const payResult = await pool
    .request()
    .input("referral_request_id", sql.BigInt, reqId).query(`
      SELECT TOP 1 payment_id, provider_user_id, provider_amount, status
      FROM payments
      WHERE referral_request_id = @referral_request_id
    `);
  const pay = payResult.recordset[0];
  if (!pay) {
    throw new Error("Payment record not found");
  }
  if ((pay.status || "").toUpperCase() === "RELEASED") {
    return { success: true, already_released: true };
  }
  if ((pay.status || "").toUpperCase() !== "PAID") {
    throw new Error("Payment status must be PAID to release payout");
  }

  const providerId = pay.provider_user_id;
  const userResult = await pool
    .request()
    .input("user_id", sql.BigInt, providerId).query(`
      SELECT TOP 1 razorpay_fund_account_id, payout_status
      FROM users
      WHERE user_id = @user_id
    `);
  const prov = userResult.recordset[0];
  if (!prov || (prov.payout_status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Provider payout_status must be ACTIVE");
  }
  if (!prov.razorpay_fund_account_id) {
    throw new Error(
      "Provider has not completed payout setup (Fund Account missing)",
    );
  }

  const accountNumber = process.env.RAZORPAY_ACCOUNT_NUMBER;
  if (!accountNumber) {
    throw new Error("RAZORPAY_ACCOUNT_NUMBER is not configured");
  }

  const providerAmount = Number(pay.provider_amount);
  if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
    throw new Error("Invalid provider_amount");
  }

  const referenceId = `referral_${reqId}`;
  const payoutBody = {
    account_number: accountNumber,
    fund_account_id: prov.razorpay_fund_account_id,
    amount: Math.round(providerAmount * 100),
    currency: "INR",
    mode: "UPI",
    purpose: "payout",
    reference_id: referenceId,
    narration: "Referral payout",
  };

  const idempotencyKey = `ref_${reqId}`;
  let payoutRes;
  try {
    payoutRes = await razorpayXPost("/v1/payouts", payoutBody, {
      "X-Payout-Idempotency": idempotencyKey,
    });
  } catch (err) {
    console.error(
      "Razorpay payout create failed for referral",
      String(reqId),
      err.message,
    );
    throw new Error("Failed to create payout: " + err.message);
  }

  const payoutId = payoutRes.id || payoutRes.payout?.id;
  if (!payoutId) {
    throw new Error("Razorpay Payout create did not return id");
  }

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);

    await reqTx.input("referral_request_id", sql.BigInt, reqId).query(`
        UPDATE payments
        SET status = 'RELEASED',
            updated_at = SYSUTCDATETIME()
        WHERE referral_request_id = @referral_request_id
      `);

    await reqTx.input("request_id", sql.BigInt, reqId).query(`
        UPDATE referral_requests
        SET payment_status = 'RELEASED',
            updated_at = SYSUTCDATETIME()
        WHERE request_id = @request_id
      `);

    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }

  return {
    success: true,
    payout_id: payoutId,
    provider_amount: providerAmount,
  };
}

/**
 * Resolve reference_id from payout webhook entity to referral_request_id.
 * reference_id format: referral_<requestId>
 */
function getReferralRequestIdFromPayoutEntity(entity) {
  const ref = entity?.reference_id || entity?.notes?.referral_request_id;
  if (!ref || typeof ref !== "string") return null;
  const m = ref.match(/^referral_(\d+)$/);
  return m ? m[1] : null;
}

/**
 * Handle payout.processed: idempotent update to RELEASED.
 */
async function handlePayoutProcessed(payload) {
  const entity = payload?.payout?.entity || payload?.entity;
  if (!entity) return;

  const refId = getReferralRequestIdFromPayoutEntity(entity);
  if (!refId) return;

  const pool = await getPool();
  const r = await pool.request().input("referral_request_id", sql.BigInt, refId)
    .query(`
      SELECT TOP 1 p.payment_id, p.status
      FROM payments p
      WHERE p.referral_request_id = @referral_request_id
    `);
  const row = r.recordset[0];
  if (!row) return;
  if ((row.status || "").toUpperCase() === "RELEASED") return;

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);
    await reqTx.input("referral_request_id", sql.BigInt, refId).query(`
      UPDATE payments SET status = 'RELEASED', updated_at = SYSUTCDATETIME()
      WHERE referral_request_id = @referral_request_id
    `);
    await reqTx.input("request_id", sql.BigInt, refId).query(`
      UPDATE referral_requests SET payment_status = 'RELEASED', updated_at = SYSUTCDATETIME()
      WHERE request_id = @request_id
    `);
    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    console.error("handlePayoutProcessed DB error:", e.message);
  }
}

/**
 * Handle payout.failed: set payments.status = 'FAILED', referral_requests.payment_status = 'PAID' (allow admin retry).
 * Idempotent: skip if payment is already RELEASED (e.g. payout.processed arrived first).
 */
async function handlePayoutFailed(payload) {
  const entity = payload?.payout?.entity || payload?.entity;
  if (!entity) return;

  const refId = getReferralRequestIdFromPayoutEntity(entity);
  if (!refId) return;

  const pool = await getPool();
  const r = await pool.request().input("referral_request_id", sql.BigInt, refId)
    .query(`
      SELECT TOP 1 payment_id, status FROM payments
      WHERE referral_request_id = @referral_request_id
    `);
  const row = r.recordset[0];
  if (!row) return;
  if ((row.status || "").toUpperCase() === "RELEASED") return;

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);
    await reqTx.input("referral_request_id", sql.BigInt, refId).query(`
      UPDATE payments SET status = 'FAILED', updated_at = SYSUTCDATETIME()
      WHERE referral_request_id = @referral_request_id
    `);
    await reqTx.input("request_id", sql.BigInt, refId).query(`
      UPDATE referral_requests SET payment_status = 'PAID', updated_at = SYSUTCDATETIME()
      WHERE request_id = @request_id
    `);
    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    console.error("handlePayoutFailed DB error:", e.message);
  }
}

module.exports = {
  setupPayoutForProvider,
  releasePayoutForReferral,
  handlePayoutProcessed,
  handlePayoutFailed,
};
