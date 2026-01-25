const { getPool, sql } = require('./db');
const { parseBigIntParam, ALLOWED_REQUEST_STATUSES } = require('./utils');
const { sendReferralRequestEmailToRequester, sendReferralRequestEmailToProvider } = require('./emailService');
const { releasePaymentToProvider } = require('./payments');

/**
 * Create a new referral request
 */
async function createReferralRequest(requesterUserId, {
  provider_user_id,
  price_agreed,
  resume_link,
  job_id,
  job_title,
  phone_number,
  referral_summary,
}) {
  const providerUserId = parseBigIntParam(provider_user_id);
  const price = Number(price_agreed);

  // Validate required fields
  if (!providerUserId) {
    throw new Error('provider_user_id is required');
  }
  if (Number.isNaN(price) || price < 0) {
    throw new Error('Invalid price_agreed');
  }
  if (!resume_link || typeof resume_link !== 'string' || resume_link.trim().length === 0) {
    throw new Error('resume_link is required');
  }
  if (!job_id || typeof job_id !== 'string' || job_id.trim().length === 0) {
    throw new Error('job_id is required');
  }
  if (!job_title || typeof job_title !== 'string' || job_title.trim().length === 0) {
    throw new Error('job_title is required');
  }
  if (!phone_number || typeof phone_number !== 'string' || phone_number.trim().length === 0) {
    throw new Error('phone_number is required');
  }
  if (!referral_summary || typeof referral_summary !== 'string' || referral_summary.trim().length === 0) {
    throw new Error('referral_summary is required');
  }

  // Validate referral_summary word count (150-300 words)
  const wordCount = referral_summary.split(/\s+/).filter(Boolean).length;
  if (wordCount < 150 || wordCount > 300) {
    throw new Error(`referral_summary must be between 150 and 300 words (current: ${wordCount} words)`);
  }

  if (providerUserId === requesterUserId) {
    throw new Error('Cannot request referral from yourself');
  }

  const pool = await getPool();

  // Validate provider is referral provider and get their company_id
  const providerResult = await pool.request()
    .input('user_id', sql.BigInt, providerUserId)
    .query('SELECT TOP 1 is_referral_provider, company_id FROM users WHERE user_id = @user_id');
  const provider = providerResult.recordset[0];
  if (!provider || !provider.is_referral_provider) {
    throw new Error('Provider not found or not a referral provider');
  }
  if (!provider.company_id) {
    throw new Error('Provider must have a company assigned');
  }

  // Get requester and provider details for emails
  const requesterResult = await pool.request()
    .input('user_id', sql.BigInt, requesterUserId)
    .query('SELECT TOP 1 full_name, email FROM users WHERE user_id = @user_id');
  const requester = requesterResult.recordset[0];
  if (!requester) {
    throw new Error('Requester not found');
  }

  const providerDetailsResult = await pool.request()
    .input('user_id', sql.BigInt, providerUserId)
    .query('SELECT TOP 1 full_name, email FROM users WHERE user_id = @user_id');
  const providerDetails = providerDetailsResult.recordset[0];

  // Get company name
  const companyResult = await pool.request()
    .input('company_id', sql.BigInt, provider.company_id)
    .query('SELECT TOP 1 company_name FROM companies WHERE company_id = @company_id');
  const company = companyResult.recordset[0];

  // Insert referral request (payment_status defaults to UNPAID)
  const insertResult = await pool.request()
    .input('requester_user_id', sql.BigInt, requesterUserId)
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('company_id', sql.BigInt, provider.company_id)
    .input('status', sql.NVarChar(20), 'PENDING')
    .input('price_agreed', sql.Decimal(10, 2), price)
    .input('resume_link', sql.NVarChar(1000), resume_link.trim())
    .input('job_id', sql.NVarChar(200), job_id.trim())
    .input('job_title', sql.NVarChar(300), job_title.trim())
    .input('phone_number', sql.NVarChar(20), phone_number.trim())
    .input('referral_summary', sql.NVarChar(2000), referral_summary.trim())
    .query(`
      INSERT INTO referral_requests
        (requester_user_id, provider_user_id, company_id, status, price_agreed, resume_link, 
         job_id, job_title, phone_number, referral_summary, payment_status, created_at, updated_at)
      OUTPUT INSERTED.*
      VALUES
        (@requester_user_id, @provider_user_id, @company_id, @status, @price_agreed, @resume_link,
         @job_id, @job_title, @phone_number, @referral_summary, 'UNPAID', SYSUTCDATETIME(), SYSUTCDATETIME())
    `);

  const newRequest = insertResult.recordset[0];
  const requestId = newRequest.request_id;

  // Send emails asynchronously (don't block response)
  Promise.all([
    // Email to requester
    (async () => {
      try {
        await sendReferralRequestEmailToRequester({
          to: requester.email,
          requesterName: requester.full_name,
          jobId: job_id.trim(),
          jobTitle: job_title.trim(),
          companyName: company?.company_name || 'N/A',
        });
        // Update requester_email_sent_at
        await pool.request()
          .input('request_id', sql.BigInt, requestId)
          .query(`
            UPDATE referral_requests
            SET requester_email_sent_at = SYSUTCDATETIME()
            WHERE request_id = @request_id
          `);
      } catch (error) {
        console.error('Failed to send requester email:', error);
      }
    })(),
    // Email to provider
    (async () => {
      try {
        await sendReferralRequestEmailToProvider({
          to: providerDetails?.email,
          providerName: providerDetails?.full_name || 'Provider',
          requesterName: requester.full_name,
          requesterEmail: requester.email,
          requesterPhone: phone_number.trim(),
          jobId: job_id.trim(),
          jobTitle: job_title.trim(),
          resumeLink: resume_link.trim(),
          referralSummary: referral_summary.trim(),
        });
        // Update provider_email_sent_at
        await pool.request()
          .input('request_id', sql.BigInt, requestId)
          .query(`
            UPDATE referral_requests
            SET provider_email_sent_at = SYSUTCDATETIME()
            WHERE request_id = @request_id
          `);
      } catch (error) {
        console.error('Failed to send provider email:', error);
      }
    })(),
  ]).catch(err => {
    console.error('Email sending error:', err);
  });

  return { referral_request: newRequest };
}

/**
 * Get referral requests by requester.
 * Includes has_review (requester already reviewed this provider) and support_ticket_status (OPEN/RESOLVED/null).
 */
async function getRequestedReferrals(requesterUserId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('requester_user_id', sql.BigInt, requesterUserId)
    .query(`
      SELECT
        rr.*,
        c.company_name,
        c.logo_url,
        pu.full_name AS provider_name,
        pu.email AS provider_email,
        CASE WHEN pr.rating_id IS NOT NULL THEN 1 ELSE 0 END AS has_review,
        st.status AS support_ticket_status
      FROM referral_requests rr
      LEFT JOIN companies c ON rr.company_id = c.company_id
      LEFT JOIN users pu ON rr.provider_user_id = pu.user_id
      LEFT JOIN provider_reviews pr
        ON pr.provider_user_id = rr.provider_user_id
       AND pr.given_by_user_id = rr.requester_user_id
      LEFT JOIN support_tickets st ON st.referral_request_id = rr.request_id
      WHERE rr.requester_user_id = @requester_user_id
      ORDER BY rr.created_at DESC
    `);
  
  const referrals = result.recordset.map((row) => ({
    id: String(row.request_id),
    provider_user_id: row.provider_user_id != null ? String(row.provider_user_id) : null,
    provider_name: row.provider_name || 'Unknown',
    provider_email: row.provider_email || '',
    company_name: row.company_name || '',
    company_logo: row.logo_url || '',
    job_id: row.job_id || '',
    job_title: row.job_title || '',
    phone_number: row.phone_number || '',
    resume_link: row.resume_link || '',
    referral_summary: row.referral_summary || '',
    status: row.status,
    payment_status: row.payment_status || 'UNPAID',
    price_agreed: row.price_agreed,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.status === 'COMPLETED' ? row.updated_at : null,
    has_review: Boolean(row.has_review),
    support_ticket_status: row.support_ticket_status || null,
  }));
  
  return { referrals };
}

/**
 * Get referral requests by provider
 */
async function getProviderReferrals(providerUserId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .query(`
      SELECT
        rr.request_id,
        rr.company_id,
        rr.requester_user_id,
        rr.provider_user_id,
        rr.status,
        rr.resume_link,
        rr.job_id,
        rr.job_title,
        rr.phone_number,
        rr.referral_summary,
        rr.created_at,
        rr.updated_at,
        c.company_name,
        c.logo_url,
        ru.full_name AS requester_name,
        ru.email AS requester_email,
        ru.role_designation AS requester_role
      FROM referral_requests rr
      LEFT JOIN companies c ON rr.company_id = c.company_id
      LEFT JOIN users ru ON rr.requester_user_id = ru.user_id
      WHERE rr.provider_user_id = @provider_user_id
      ORDER BY rr.created_at DESC
    `);

  const referrals = result.recordset.map((row) => ({
    id: String(row.request_id),
    requester_name: row.requester_name || 'Unknown',
    requester_email: row.requester_email || '',
    requester_role: row.requester_role || '',
    company_name: row.company_name || '',
    company_logo: row.logo_url || '',
    resume_link: row.resume_link || '',
    job_id: row.job_id || '',
    job_title: row.job_title || '',
    phone_number: row.phone_number || '',
    referral_summary: row.referral_summary || '',
    status: row.status,
    created_at: row.created_at,
    completed_at: row.status === 'COMPLETED' ? row.updated_at : null,
  }));

  return { referrals };
}

/**
 * Complete a referral request (provider action)
 */
async function completeReferral(requestId, providerUserId) {
  const pool = await getPool();

  // Verify ownership and status
  const existingResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query('SELECT TOP 1 * FROM referral_requests WHERE request_id = @request_id');
  const existing = existingResult.recordset[0];
  if (!existing) {
    throw new Error('Not found');
  }
  if (String(existing.provider_user_id) !== String(providerUserId)) {
    throw new Error('Forbidden');
  }
  if (existing.status === 'COMPLETED') {
    return { referral_request: existing };
  }
  if (existing.status !== 'PENDING') {
    throw new Error('Can only complete pending referrals');
  }

  // Check if payment is PAID before allowing completion
  if (existing.payment_status !== 'PAID' && existing.payment_status !== 'RELEASED') {
    throw new Error('Payment must be completed before marking referral as completed');
  }

  const updateResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query(`
      UPDATE referral_requests
      SET status = 'COMPLETED',
          updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE request_id = @request_id
    `);

  // Release payment to provider (async, don't block response)
  releasePaymentToProvider(requestId, providerUserId)
    .then((result) => {
      console.log('Payment released to provider:', result);
    })
    .catch((error) => {
      console.error('Failed to release payment to provider:', error);
      // Log error but don't fail the request
    });

  return { referral_request: updateResult.recordset[0] };
}

/**
 * Update referral request status
 */
async function updateReferralStatus(requestId, userId, status) {
  if (!ALLOWED_REQUEST_STATUSES.has(status)) {
    throw new Error('Invalid status');
  }

  const pool = await getPool();
  const existingResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query('SELECT TOP 1 * FROM referral_requests WHERE request_id = @request_id');
  const existing = existingResult.recordset[0];
  if (!existing) {
    throw new Error('Not found');
  }

  if (String(existing.requester_user_id) !== String(userId) &&
      String(existing.provider_user_id) !== String(userId)) {
    throw new Error('Forbidden');
  }

  const updateResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .input('status', sql.NVarChar(20), status)
    .query(`
      UPDATE referral_requests
      SET status = @status,
          updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE request_id = @request_id
    `);

  return { referral_request: updateResult.recordset[0] };
}

module.exports = {
  createReferralRequest,
  getRequestedReferrals,
  getProviderReferrals,
  completeReferral,
  updateReferralStatus,
};
