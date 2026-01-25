const { getPool, sql } = require('./db');
const { parseBigIntParam } = require('./utils');

const ISSUE_TYPES = ['Referral not provided', 'Poor communication', 'Misleading referral', 'Other'];

/**
 * Create a support ticket (requester only, referral must be COMPLETED, one per referral).
 */
async function createSupportTicket(referralRequestId, raisedByUserId, { issue_type, description }) {
  const requestId = parseBigIntParam(referralRequestId);
  const userId = parseBigIntParam(raisedByUserId);
  if (!requestId || !userId) {
    throw new Error('Invalid referral_request_id or user');
  }

  const it = (issue_type && typeof issue_type === 'string') ? issue_type.trim() : '';
  if (!ISSUE_TYPES.includes(it)) {
    throw new Error('Invalid issue_type. Must be one of: ' + ISSUE_TYPES.join(', '));
  }
  const desc = (description && typeof description === 'string') ? description.trim() : '';
  if (desc.length < 1) {
    throw new Error('description is required');
  }

  const pool = await getPool();

  const refResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query('SELECT TOP 1 request_id, status, requester_user_id FROM referral_requests WHERE request_id = @request_id');
  const ref = refResult.recordset[0];
  if (!ref) {
    throw new Error('Referral request not found');
  }
  if ((ref.status || '').toUpperCase() !== 'COMPLETED') {
    const err = new Error('Referral must be COMPLETED to raise a concern');
    err.errorCode = 'REFERRAL_NOT_COMPLETED';
    throw err;
  }
  if (String(ref.requester_user_id) !== String(userId)) {
    throw new Error('Only the requester can raise a support ticket for this referral');
  }

  const existing = await pool.request()
    .input('referral_request_id', sql.BigInt, requestId)
    .query('SELECT TOP 1 ticket_id FROM support_tickets WHERE referral_request_id = @referral_request_id');
  if (existing.recordset.length > 0) {
    const err = new Error('A support ticket already exists for this referral');
    err.errorCode = 'SUPPORT_TICKET_ALREADY_EXISTS';
    throw err;
  }

  const insertResult = await pool.request()
    .input('referral_request_id', sql.BigInt, requestId)
    .input('raised_by_user_id', sql.BigInt, userId)
    .input('issue_type', sql.NVarChar(100), it)
    .input('description', sql.NVarChar(2000), desc.length > 2000 ? desc.slice(0, 2000) : desc)
    .query(`
      INSERT INTO support_tickets
        (referral_request_id, raised_by_user_id, issue_type, description, status, created_at, updated_at)
      OUTPUT INSERTED.*
      VALUES
        (@referral_request_id, @raised_by_user_id, @issue_type, @description, 'OPEN', SYSUTCDATETIME(), SYSUTCDATETIME())
    `);

  return { ticket: insertResult.recordset[0] };
}

/**
 * List all support tickets for admin (with requester, referral, provider, company).
 */
async function listAllSupportTickets() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      st.ticket_id,
      st.referral_request_id,
      st.raised_by_user_id,
      st.issue_type,
      st.description,
      st.status,
      st.created_at,
      st.updated_at,
      ru.full_name AS requester_name,
      ru.email AS requester_email,
      rr.provider_user_id,
      rr.status AS referral_status,
      rr.job_id,
      rr.job_title,
      pu.full_name AS provider_name,
      pu.email AS provider_email,
      c.company_name
    FROM support_tickets st
    INNER JOIN users ru ON st.raised_by_user_id = ru.user_id
    INNER JOIN referral_requests rr ON st.referral_request_id = rr.request_id
    LEFT JOIN users pu ON rr.provider_user_id = pu.user_id
    LEFT JOIN companies c ON rr.company_id = c.company_id
    ORDER BY st.created_at DESC
  `);
  const tickets = (result.recordset || []).map((r) => ({
    ticket_id: r.ticket_id,
    referral_request_id: r.referral_request_id,
    raised_by_user_id: r.raised_by_user_id,
    issue_type: r.issue_type,
    description: r.description,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    requester_name: r.requester_name,
    requester_email: r.requester_email,
    provider_user_id: r.provider_user_id,
    provider_name: r.provider_name,
    provider_email: r.provider_email,
    company_name: r.company_name,
    referral_status: r.referral_status,
    job_id: r.job_id,
    job_title: r.job_title,
  }));
  return { tickets };
}

/**
 * Check if there is an OPEN support ticket for a referral. Used for payout blocking.
 */
async function hasOpenTicketForReferral(referralRequestId) {
  const requestId = parseBigIntParam(referralRequestId);
  if (!requestId) return false;
  const pool = await getPool();
  const r = await pool.request()
    .input('referral_request_id', sql.BigInt, requestId)
    .query(`
      SELECT TOP 1 1
      FROM support_tickets
      WHERE referral_request_id = @referral_request_id AND status = 'OPEN'
    `);
  return (r.recordset || []).length > 0;
}

module.exports = {
  createSupportTicket,
  listAllSupportTickets,
  hasOpenTicketForReferral,
  ISSUE_TYPES,
};
