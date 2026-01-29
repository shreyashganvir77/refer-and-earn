const { getPool, sql } = require('./db');
const { toUserDto, toCompanyDto } = require('./utils');

/**
 * Get user with company information by user ID
 */
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
    company_email: row.company_email,
    is_company_email_verified: row.is_company_email_verified,
    picture_url: row.picture_url,
    company_id: row.company_id,
    role_designation: row.role_designation,
    years_experience: row.years_experience,
    is_referral_provider: row.is_referral_provider,
    bio_description: row.bio_description,
    price_per_referral: row.price_per_referral,
    provider_rating: row.provider_rating,
    provider_rating_count: row.provider_rating_count,
    phone_number: row.phone_number,
    payout_status: row.payout_status || null,
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

module.exports = {
  getUserWithCompanyById,
};
