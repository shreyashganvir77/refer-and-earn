/**
 * Utility functions for data transformation and validation
 */

function toUserDto(row) {
  if (!row) return null;
  return {
    user_id: String(row.user_id),
    full_name: row.full_name,
    picture: row.picture_url || null,
    email: row.email,
    company_email: row.company_email || null,
    is_company_email_verified: Boolean(row.is_company_email_verified),
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

module.exports = {
  toUserDto,
  toCompanyDto,
  parseBigIntParam,
  ALLOWED_REQUEST_STATUSES,
};
