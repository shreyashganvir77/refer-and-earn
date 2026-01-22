const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const API_BASE_URL = process.env.API_BASE_URL || '';

// Middleware
app.use(cors({
  origin: API_BASE_URL,
  credentials: true
}));
app.use(express.json());

const { getPool, sql } = require('./src/db');
const { verifyGoogleIdToken } = require('./src/google');
const { signSessionJwt, requireAuth } = require('./src/auth');
const {
  createPaymentOrder,
  verifyPayment,
  releasePaymentToProvider,
  refundPayment,
  verifyWebhookSignature,
  handleWebhookEvent,
} = require('./src/payments');

function toUserDto(row) {
  if (!row) return null;
  return {
    user_id: String(row.user_id),
    full_name: row.full_name,
    // Expose profile picture URL as `picture` for frontend
    picture: row.picture_url || null,
    email: row.email,
    company_id: row.company_id != null ? String(row.company_id) : null,
    role_designation: row.role_designation,
    years_experience: row.years_experience,
    is_referral_provider: Boolean(row.is_referral_provider),
    bio_description: row.bio_description,
    price_per_referral: row.price_per_referral,
    provider_rating: row.provider_rating,
    provider_rating_count: row.provider_rating_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toCompanyDto(row) {
  if (!row) return null;
  return {
    company_id: String(row.company_id),
    company_name: row.company_name,
    logo_url: row.logo_url,
    industry: row.industry,
    created_at: row.created_at,
  };
}

function parseBigIntParam(value) {
  try {
    const n = BigInt(String(value));
    if (n <= 0n) return null;
    return n;
  } catch {
    return null;
  }
}

const ALLOWED_REQUEST_STATUSES = new Set(['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED']);

// In-memory OTP store: { [userId: string]: { code, email, expiresAt } }
const otpStore = new Map();

function generateOtp() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

// Nodemailer Gmail transporter
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const gmailFromName = process.env.GMAIL_FROM_NAME || 'Refer & Earn';

// Only create transporter if creds are present; otherwise sendOtpEmail will throw.
const mailTransporter =
  gmailUser && gmailPass
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      })
    : null;

async function sendOtpEmail({ to, code }) {
  console.log({
    gmailUser: process.env.GMAIL_USER,
    hasPassword: Boolean(process.env.GMAIL_APP_PASSWORD),
  });
  
  if (!gmailUser || !gmailPass) {
    throw new Error('Gmail credentials not configured');
  }
  if (!mailTransporter) {
    throw new Error('Mail transporter not initialized');
  }

  const from = `"${gmailFromName}" <${gmailUser}>`;
  const subject = 'Your Verification Code';
  const text = `Your verification code is: ${code}

This code will expire in 5 minutes.

If you did not request this, you can ignore this email.`;

  const html = `
    <p>Hi,</p>
    <p>Your verification code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    <p>This code will expire in <strong>5 minutes</strong>.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  await mailTransporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

async function sendReferralRequestEmailToRequester({ to, requesterName, jobId, jobTitle, companyName }) {
  if (!gmailUser || !gmailPass || !mailTransporter) {
    console.warn('Email not configured, skipping requester notification');
    return;
  }

  const from = `"${gmailFromName}" <${gmailUser}>`;
  const subject = 'Referral Request Submitted – Pending';
  const text = `Hi ${requesterName},

Your referral request has been successfully submitted and is now pending.

Details:
- Job ID: ${jobId || 'N/A'}
- Job Title: ${jobTitle || 'N/A'}
- Provider Company: ${companyName || 'N/A'}
- Status: Pending

The referral provider will review your request and update the status accordingly.

Best regards,
Refer & Earn Platform`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Referral Request Submitted</h2>
      <p>Hi ${requesterName},</p>
      <p>Your referral request has been successfully submitted and is now <strong>pending</strong>.</p>
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Job ID:</strong> ${jobId || 'N/A'}</p>
        <p><strong>Job Title:</strong> ${jobTitle || 'N/A'}</p>
        <p><strong>Provider Company:</strong> ${companyName || 'N/A'}</p>
        <p><strong>Status:</strong> <span style="color: #F59E0B; font-weight: bold;">Pending</span></p>
      </div>
      <p>The referral provider will review your request and update the status accordingly.</p>
      <p>Best regards,<br>Refer & Earn Platform</p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send requester email:', error);
    throw error;
  }
}

async function sendReferralRequestEmailToProvider({ to, providerName, requesterName, requesterEmail, requesterPhone, jobId, jobTitle, resumeLink, referralSummary }) {
  if (!gmailUser || !gmailPass || !mailTransporter) {
    console.warn('Email not configured, skipping provider notification');
    return;
  }

  const from = `"${gmailFromName}" <${gmailUser}>`;
  const subject = 'New Referral Request for Your Company';
  const text = `Hi ${providerName},

You have received a new referral request for your company.

Requester Details:
- Name: ${requesterName}
- Email: ${requesterEmail}
- Phone: ${requesterPhone || 'N/A'}

Job Details:
- Job ID: ${jobId || 'N/A'}
- Job Title: ${jobTitle || 'N/A'}

Resume Link: ${resumeLink || 'N/A'}

Referral Summary (${referralSummary ? referralSummary.split(/\s+/).length : 0} words):
${referralSummary || 'N/A'}

Please review the request and mark it as completed once you have provided the referral.

Best regards,
Refer & Earn Platform`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Referral Request</h2>
      <p>Hi ${providerName},</p>
      <p>You have received a new referral request for your company.</p>
      
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">Requester Details</h3>
        <p><strong>Name:</strong> ${requesterName}</p>
        <p><strong>Email:</strong> <a href="mailto:${requesterEmail}">${requesterEmail}</a></p>
        <p><strong>Phone:</strong> ${requesterPhone || 'N/A'}</p>
      </div>

      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">Job Details</h3>
        <p><strong>Job ID:</strong> ${jobId || 'N/A'}</p>
        <p><strong>Job Title:</strong> ${jobTitle || 'N/A'}</p>
      </div>

      <div style="margin: 20px 0;">
        <p><strong>Resume Link:</strong> <a href="${resumeLink || '#'}" target="_blank">${resumeLink || 'N/A'}</a></p>
      </div>

      <div style="background-color: #EFF6FF; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
        <h3 style="margin-top: 0; color: #1F2937;">Referral Summary</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${referralSummary || 'N/A'}</p>
        <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">
          (${referralSummary ? referralSummary.split(/\s+/).length : 0} words)
        </p>
      </div>

      <p>Please review the request and mark it as completed once you have provided the referral.</p>
      <p>Best regards,<br>Refer & Earn Platform</p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send provider email:', error);
    throw error;
  }
}

async function getUserWithCompanyById(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.BigInt, userId)
    .query(`
      SELECT u.*, c.company_id, c.company_name, c.logo_url, c.industry, c.created_at AS company_created_at
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.company_id
      WHERE u.user_id = @user_id
    `);
  const row = result.recordset[0];
  if (!row) return null;
  const user = {
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    picture_url: row.picture_url,
    company_id: row.company_id,
    role_designation: row.role_designation,
    years_experience: row.years_experience,
    is_referral_provider: row.is_referral_provider,
    bio_description: row.bio_description,
    price_per_referral: row.price_per_referral,
    provider_rating: row.provider_rating,
    provider_rating_count: row.provider_rating_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  const company = row.company_id ? {
    company_id: row.company_id,
    company_name: row.company_name,
    logo_url: row.logo_url,
    industry: row.industry,
    created_at: row.company_created_at,
  } : null;
  return { user, company };
}

// ---- Auth APIs (Google OAuth only) ----
async function authGoogleHandler(req, res) {
  try {
    const { idToken } = req.body || {};
    const { email, fullName, picture } = await verifyGoogleIdToken(idToken);

    const pool = await getPool();

    // Try find existing user
    let result = await pool.request()
      .input('email', sql.NVarChar(320), email)
      .query('SELECT TOP 1 * FROM users WHERE email = @email');

    let user;
    if (result.recordset.length > 0) {
      // Update existing
      const existing = result.recordset[0];
      await pool.request()
        .input('user_id', sql.BigInt, existing.user_id)
        .input('full_name', sql.NVarChar(200), fullName)
        .input('password_hash', sql.NVarChar(255), 'GOOGLE_OAUTH')
        .input('picture_url', sql.NVarChar(500), picture)
        .query(`
          UPDATE users
          SET full_name = @full_name,
              password_hash = @password_hash,
              picture_url = @picture_url,
              updated_at = SYSUTCDATETIME()
          WHERE user_id = @user_id
        `);
      const withCompany = await getUserWithCompanyById(existing.user_id);
      user = withCompany.user;
      var company = withCompany.company;
    } else {
      // Insert new
      result = await pool.request()
        .input('full_name', sql.NVarChar(200), fullName)
        .input('email', sql.NVarChar(320), email)
        .input('password_hash', sql.NVarChar(255), 'GOOGLE_OAUTH')
        .input('picture_url', sql.NVarChar(500), picture)
        .query(`
          INSERT INTO users (full_name, email, password_hash, picture_url, created_at, updated_at)
          OUTPUT INSERTED.*
          VALUES (@full_name, @email, @password_hash, @picture_url, SYSUTCDATETIME(), SYSUTCDATETIME())
        `);
      user = result.recordset[0];
      company = null;
    }

    const token = signSessionJwt({ sub: String(user.user_id) });

    return res.json({
      token,
      user: toUserDto(user),
      company: toCompanyDto(company),
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ error: e.message || 'Auth failed' });
  }
}

app.post('/auth/google', authGoogleHandler);
// Backward-compatible alias (older frontend path)
app.post('/api/auth/google', authGoogleHandler);

app.get('/auth/me', requireAuth, async (req, res) => {
  const userId = parseBigIntParam(req.auth.sub);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await getUserWithCompanyById(userId);
  if (!result) return res.status(401).json({ error: 'Unauthorized' });

  return res.json({
    user: toUserDto(result.user),
    company: toCompanyDto(result.company),
  });
});
// Backward-compatible alias (older frontend path)
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const userId = parseBigIntParam(req.auth.sub);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await getUserWithCompanyById(userId);
  if (!result) return res.status(401).json({ error: 'Unauthorized' });

  return res.json({
    user: toUserDto(result.user),
    company: toCompanyDto(result.company),
  });
});

// ---- User profile completion ----
app.patch('/users/me', requireAuth, async (req, res) => {
  const userId = parseBigIntParam(req.auth.sub);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const body = req.body || {};
  const sets = [];
  const params = [];
  const pool = await getPool();
  const request = pool.request().input('user_id', sql.BigInt, userId);

  if (body.company_id !== undefined) {
    const cid = body.company_id === null ? null : parseBigIntParam(body.company_id);
    if (body.company_id !== null && !cid) return res.status(400).json({ error: 'Invalid company_id' });
    sets.push('company_id = @company_id');
    request.input('company_id', sql.BigInt, cid);
  }
  if (body.role_designation !== undefined) {
    sets.push('role_designation = @role_designation');
    request.input('role_designation', sql.NVarChar(200), body.role_designation || null);
  }
  if (body.years_experience !== undefined) {
    const ye = body.years_experience === null || body.years_experience === '' ? null : Number(body.years_experience);
    if (ye !== null && (!Number.isInteger(ye) || ye < 0)) return res.status(400).json({ error: 'Invalid years_experience' });
    sets.push('years_experience = @years_experience');
    request.input('years_experience', sql.Int, ye);
  }
  if (body.is_referral_provider !== undefined) {
    sets.push('is_referral_provider = @is_referral_provider');
    request.input('is_referral_provider', sql.Bit, Boolean(body.is_referral_provider));
  }
  if (body.bio_description !== undefined) {
    sets.push('bio_description = @bio_description');
    request.input('bio_description', sql.NVarChar(1000), body.bio_description || null);
  }
  if (body.price_per_referral !== undefined) {
    const p = body.price_per_referral === null || body.price_per_referral === '' ? null : Number(body.price_per_referral);
    if (p !== null && (Number.isNaN(p) || p < 0)) return res.status(400).json({ error: 'Invalid price_per_referral' });
    sets.push('price_per_referral = @price_per_referral');
    request.input('price_per_referral', sql.Decimal(10, 2), p);
  }

  sets.push('updated_at = SYSUTCDATETIME()');

  const setClause = sets.join(', ');

  try {
    if (setClause) {
      await request.query(`UPDATE users SET ${setClause} WHERE user_id = @user_id`);
    }
    const result = await getUserWithCompanyById(userId);
    return res.json({
      user: toUserDto(result.user),
      company: toCompanyDto(result.company),
    });
  } catch (e) {
    return res.status(400).json({ error: 'Profile update failed' });
  }
});

// ---- Referral provider OTP verification (company official email) ----
app.post('/users/me/otp/start', requireAuth, async (req, res) => {
  const userId = parseBigIntParam(req.auth.sub);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { company_official_email } = req.body || {};
  if (
    !company_official_email ||
    typeof company_official_email !== 'string' ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(company_official_email)
  ) {
    return res.status(400).json({ error: 'Valid company_official_email is required' });
  }

  const code = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(String(userId), { code, email: company_official_email, expiresAt });
  try {
    await sendOtpEmail({ to: company_official_email, code });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    otpStore.delete(String(userId));
    return res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

app.post('/users/me/otp/verify', requireAuth, async (req, res) => {
  const userId = parseBigIntParam(req.auth.sub);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'OTP code is required' });
  }

  const entry = otpStore.get(String(userId));
  if (!entry) return res.status(400).json({ error: 'No OTP requested' });

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(String(userId));
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (entry.code !== code.trim()) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(String(userId));

  return res.json({ success: true });
});

// ---- Companies ----
app.get('/companies', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT company_id, company_name, logo_url, industry, created_at
    FROM companies
    ORDER BY company_name ASC
  `);
  return res.json({ companies: result.recordset.map(toCompanyDto) });
});

// ---- Referral Provider listing ----
app.get('/companies/:companyId/providers', async (req, res) => {
  const companyId = parseBigIntParam(req.params.companyId);
  if (!companyId) return res.status(400).json({ error: 'Invalid companyId' });

  const pool = await getPool();
  const result = await pool.request()
    .input('company_id', sql.BigInt, companyId)
    .query(`
      SELECT u.*, c.company_id, c.company_name, c.logo_url, c.industry, c.created_at AS company_created_at
      FROM users u
      INNER JOIN companies c ON u.company_id = c.company_id
      WHERE u.company_id = @company_id AND u.is_referral_provider = 1
      ORDER BY u.provider_rating DESC, u.provider_rating_count DESC
    `);

  const providers = result.recordset.map(row => {
    const user = {
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      picture_url: row.picture_url,
      company_id: row.company_id,
      role_designation: row.role_designation,
      years_experience: row.years_experience,
      is_referral_provider: row.is_referral_provider,
      bio_description: row.bio_description,
      price_per_referral: row.price_per_referral,
      provider_rating: row.provider_rating,
      provider_rating_count: row.provider_rating_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    const company = {
      company_id: row.company_id,
      company_name: row.company_name,
      logo_url: row.logo_url,
      industry: row.industry,
      created_at: row.company_created_at,
    };
    return {
      ...toUserDto(user),
      company: toCompanyDto(company),
    };
  });

  return res.json({ providers });
});

// ---- Provider: list referrals assigned to provider ----
app.get('/api/provider/referrals', requireAuth, async (req, res) => {
  const providerUserId = parseBigIntParam(req.auth.sub);
  if (!providerUserId) return res.status(401).json({ error: 'Unauthorized' });

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

  return res.json({ referrals });
});

// ---- Provider: mark referral completed ----
app.post('/api/referrals/:id/complete', requireAuth, async (req, res) => {
  const providerUserId = parseBigIntParam(req.auth.sub);
  if (!providerUserId) return res.status(401).json({ error: 'Unauthorized' });

  const requestId = parseBigIntParam(req.params.id);
  if (!requestId) return res.status(400).json({ error: 'Invalid id' });

  const pool = await getPool();

  // Verify ownership and status
  const existingResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query('SELECT TOP 1 * FROM referral_requests WHERE request_id = @request_id');
  const existing = existingResult.recordset[0];
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (String(existing.provider_user_id) !== String(providerUserId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (existing.status === 'COMPLETED') {
    return res.json({ referral_request: existing });
  }
  if (existing.status !== 'PENDING') {
    return res.status(400).json({ error: 'Can only complete pending referrals' });
  }

  // Check if payment is PAID before allowing completion
  if (existing.payment_status !== 'PAID' && existing.payment_status !== 'RELEASED') {
    return res.status(400).json({ error: 'Payment must be completed before marking referral as completed' });
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

  return res.json({ referral_request: updateResult.recordset[0] });
});

// ---- Referral requests ----
app.post('/referrals', requireAuth, async (req, res) => {
  const requesterUserId = parseBigIntParam(req.auth.sub);
  if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

  const { provider_user_id, price_agreed, resume_link, job_id, job_title, phone_number, referral_summary } = req.body || {};
  const providerUserId = parseBigIntParam(provider_user_id);
  const price = Number(price_agreed);

  // Validate required fields
  if (!providerUserId) {
    return res.status(400).json({ error: 'provider_user_id is required' });
  }
  if (Number.isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Invalid price_agreed' });
  }
  if (!resume_link || typeof resume_link !== 'string' || resume_link.trim().length === 0) {
    return res.status(400).json({ error: 'resume_link is required' });
  }
  if (!job_id || typeof job_id !== 'string' || job_id.trim().length === 0) {
    return res.status(400).json({ error: 'job_id is required' });
  }
  if (!job_title || typeof job_title !== 'string' || job_title.trim().length === 0) {
    return res.status(400).json({ error: 'job_title is required' });
  }
  if (!phone_number || typeof phone_number !== 'string' || phone_number.trim().length === 0) {
    return res.status(400).json({ error: 'phone_number is required' });
  }
  if (!referral_summary || typeof referral_summary !== 'string' || referral_summary.trim().length === 0) {
    return res.status(400).json({ error: 'referral_summary is required' });
  }

  // Validate referral_summary word count (150-300 words)
  const wordCount = referral_summary.split(/\s+/).filter(Boolean).length;
  if (wordCount < 150 || wordCount > 300) {
    return res.status(400).json({ 
      error: `referral_summary must be between 150 and 300 words (current: ${wordCount} words)` 
    });
  }

  if (providerUserId === requesterUserId) {
    return res.status(400).json({ error: 'Cannot request referral from yourself' });
  }

  const pool = await getPool();

  // Validate provider is referral provider and get their company_id
  const providerResult = await pool.request()
    .input('user_id', sql.BigInt, providerUserId)
    .query('SELECT TOP 1 is_referral_provider, company_id FROM users WHERE user_id = @user_id');
  const provider = providerResult.recordset[0];
  if (!provider || !provider.is_referral_provider) {
    return res.status(404).json({ error: 'Provider not found or not a referral provider' });
  }
  if (!provider.company_id) {
    return res.status(400).json({ error: 'Provider must have a company assigned' });
  }

  // Get requester and provider details for emails
  const requesterResult = await pool.request()
    .input('user_id', sql.BigInt, requesterUserId)
    .query('SELECT TOP 1 full_name, email FROM users WHERE user_id = @user_id');
  const requester = requesterResult.recordset[0];
  if (!requester) {
    return res.status(404).json({ error: 'Requester not found' });
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

  return res.status(201).json({ referral_request: newRequest });
});

app.get('/referrals/requested', requireAuth, async (req, res) => {
  const requesterUserId = parseBigIntParam(req.auth.sub);
  if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

  const pool = await getPool();
  const result = await pool.request()
    .input('requester_user_id', sql.BigInt, requesterUserId)
    .query(`
      SELECT
        rr.*,
        c.company_name,
        c.logo_url,
        pu.full_name AS provider_name,
        pu.email AS provider_email
      FROM referral_requests rr
      LEFT JOIN companies c ON rr.company_id = c.company_id
      LEFT JOIN users pu ON rr.provider_user_id = pu.user_id
      WHERE rr.requester_user_id = @requester_user_id
      ORDER BY rr.created_at DESC
    `);
  
  const referrals = result.recordset.map((row) => ({
    id: String(row.request_id),
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
  }));
  
  return res.json({ referrals });
});

app.get('/referrals/received', requireAuth, async (req, res) => {
  const providerUserId = parseBigIntParam(req.auth.sub);
  if (!providerUserId) return res.status(401).json({ error: 'Unauthorized' });

  const pool = await getPool();
  const result = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .query(`
      SELECT * FROM referral_requests
      WHERE provider_user_id = @provider_user_id
      ORDER BY created_at DESC
    `);
  return res.json({ referrals: result.recordset });
});

app.patch('/referrals/:id/status', requireAuth, async (req, res) => {
  const userId = parseBigIntParam(req.auth.sub);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const requestId = parseBigIntParam(req.params.id);
  if (!requestId) return res.status(400).json({ error: 'Invalid id' });

  const { status } = req.body || {};
  if (!ALLOWED_REQUEST_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status' });

  const pool = await getPool();
  const existingResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query('SELECT TOP 1 * FROM referral_requests WHERE request_id = @request_id');
  const existing = existingResult.recordset[0];
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (String(existing.requester_user_id) !== String(userId) &&
      String(existing.provider_user_id) !== String(userId)) {
    return res.status(403).json({ error: 'Forbidden' });
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

  return res.json({ referral_request: updateResult.recordset[0] });
});

// ---- Reviews & ratings ----
app.post('/providers/:providerId/reviews', requireAuth, async (req, res) => {
  const givenByUserId = parseBigIntParam(req.auth.sub);
  if (!givenByUserId) return res.status(401).json({ error: 'Unauthorized' });

  const providerUserId = parseBigIntParam(req.params.providerId);
  if (!providerUserId) return res.status(400).json({ error: 'Invalid providerId' });
  if (providerUserId === givenByUserId) return res.status(400).json({ error: 'Cannot review yourself' });

  const stars = Number(req.body?.stars);
  const reviewText = req.body?.review_text ?? null;
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1-5' });

  const pool = await getPool();

  // Enforce "one review per provider per user"
  // Ensure requester has at least one completed referral with this provider
  const completedReferral = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('requester_user_id', sql.BigInt, givenByUserId)
    .query(`
      SELECT TOP 1 request_id FROM referral_requests
      WHERE provider_user_id = @provider_user_id
        AND requester_user_id = @requester_user_id
        AND status = 'COMPLETED'
    `);
  if (completedReferral.recordset.length === 0) {
    return res.status(403).json({ error: 'Rating allowed only after a completed referral' });
  }

  const existing = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('given_by_user_id', sql.BigInt, givenByUserId)
    .query(`
      SELECT TOP 1 * FROM provider_reviews
      WHERE provider_user_id = @provider_user_id
        AND given_by_user_id = @given_by_user_id
    `);
  if (existing.recordset.length > 0) return res.status(409).json({ error: 'Review already exists' });

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);

    const createdResult = await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .input('given_by_user_id', sql.BigInt, givenByUserId)
      .input('stars', sql.TinyInt, stars)
      .input('review_text', sql.NVarChar(2000), reviewText)
      .query(`
        INSERT INTO provider_reviews
          (provider_user_id, given_by_user_id, stars, review_text, created_at)
        OUTPUT INSERTED.*
        VALUES
          (@provider_user_id, @given_by_user_id, @stars, @review_text, SYSUTCDATETIME())
      `);

    const aggResult = await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .query(`
        SELECT AVG(CAST(stars AS DECIMAL(10,2))) AS avg_stars,
               COUNT(*) AS count_stars
        FROM provider_reviews
        WHERE provider_user_id = @provider_user_id
      `);

    const agg = aggResult.recordset[0] || { avg_stars: null, count_stars: 0 };

    await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .input('provider_rating', sql.Decimal(3, 2), agg.avg_stars)
      .input('provider_rating_count', sql.Int, agg.count_stars)
      .query(`
        UPDATE users
        SET provider_rating = @provider_rating,
            provider_rating_count = @provider_rating_count,
            updated_at = SYSUTCDATETIME()
        WHERE user_id = @provider_user_id
      `);

    await transaction.commit();

    return res.status(201).json({
      review: createdResult.recordset[0],
      provider_rating: agg.avg_stars,
      provider_rating_count: agg.count_stars,
    });
  } catch (e) {
    await transaction.rollback();
    return res.status(500).json({ error: 'Failed to create review' });
  }
});

app.get('/providers/:providerId/reviews', async (req, res) => {
  const providerUserId = parseBigIntParam(req.params.providerId);
  if (!providerUserId) return res.status(400).json({ error: 'Invalid providerId' });

  const pool = await getPool();
  const result = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .query(`
      SELECT * FROM provider_reviews
      WHERE provider_user_id = @provider_user_id
      ORDER BY created_at DESC
    `);
  return res.json({ reviews: result.recordset });
});

// ---- Payment APIs ----
// Create Razorpay order
app.post('/api/payments/create-order', requireAuth, async (req, res) => {
  const requesterUserId = parseBigIntParam(req.auth.sub);
  if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

  const { referral_request_id } = req.body || {};
  const referralRequestId = parseBigIntParam(referral_request_id);
  if (!referralRequestId) {
    return res.status(400).json({ error: 'referral_request_id is required' });
  }

  try {
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
  const requesterUserId = parseBigIntParam(req.auth.sub);
  if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification data' });
  }

  try {
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
  const requesterUserId = parseBigIntParam(req.auth.sub);
  if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

  const { referral_request_id } = req.body || {};
  const referralRequestId = parseBigIntParam(referral_request_id);
  if (!referralRequestId) {
    return res.status(400).json({ error: 'referral_request_id is required' });
  }

  try {
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

  try {
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
