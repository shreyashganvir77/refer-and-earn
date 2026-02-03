const { getPool, sql } = require("./db");
const { parseBigIntParam, toCompanyDto, toUserDto } = require("./utils");

/**
 * Get allowed email domains for a company (from company_domains)
 * @param {number|bigint} companyId
 * @returns {Promise<string[]>}
 */
async function getCompanyDomains(companyId) {
  const pool = await getPool();
  const result = await pool.request().input("company_id", sql.BigInt, companyId)
    .query(`
      SELECT domain
      FROM company_domains
      WHERE company_id = @company_id AND is_active = 1
      ORDER BY domain
    `);
  return (result.recordset || []).map((r) => r.domain);
}

const DEFAULT_SEARCH_LIMIT = 15;

/** SELECT list with referral_price (use after migration). Without it for backward compat. */
const COMPANY_COLS_WITH_PRICE =
  "company_id, company_name, logo_url, industry, referral_price, created_at";
const COMPANY_COLS_NO_PRICE =
  "company_id, company_name, logo_url, industry, created_at";

function isReferralPriceColumnError(err) {
  const msg = err && err.message ? String(err.message) : "";
  return /referral_price|Invalid column name/i.test(msg);
}

/**
 * List all companies (used when no search). Works before and after referral_price migration.
 */
async function listCompanies() {
  const pool = await getPool();
  try {
    const result = await pool.request().query(`
      SELECT ${COMPANY_COLS_WITH_PRICE}
      FROM companies
      ORDER BY company_name ASC
    `);
    return { companies: result.recordset.map(toCompanyDto) };
  } catch (err) {
    if (isReferralPriceColumnError(err)) {
      const result = await pool.request().query(`
        SELECT ${COMPANY_COLS_NO_PRICE}
        FROM companies
        ORDER BY company_name ASC
      `);
      const rows = (result.recordset || []).map((r) => ({
        ...r,
        referral_price: 0,
      }));
      return { companies: rows.map(toCompanyDto) };
    }
    throw err;
  }
}

/**
 * Search companies by name or industry. Server-side, limited results.
 * @param {string} search - search term (optional)
 * @param {number} limit - max results (default 15)
 * @returns {Promise<{ companies: object[] }>}
 */
async function searchCompanies(search, limit = DEFAULT_SEARCH_LIMIT) {
  const pool = await getPool();
  const cap = Math.min(Math.max(Number(limit) || 15, 1), 50);
  const term = search && typeof search === "string" ? search.trim() : "";

  if (!term) {
    try {
      const result = await pool.request().input("limit", sql.Int, cap).query(`
        SELECT TOP (@limit) ${COMPANY_COLS_WITH_PRICE}
        FROM companies
        ORDER BY company_name ASC
      `);
      return { companies: result.recordset.map(toCompanyDto) };
    } catch (err) {
      if (isReferralPriceColumnError(err)) {
        const result = await pool.request().input("limit", sql.Int, cap).query(`
          SELECT TOP (@limit) ${COMPANY_COLS_NO_PRICE}
          FROM companies
          ORDER BY company_name ASC
        `);
        const rows = (result.recordset || []).map((r) => ({
          ...r,
          referral_price: 0,
        }));
        return { companies: rows.map(toCompanyDto) };
      }
      throw err;
    }
  }

  const pattern = `%${term.replace(/[%_[]/g, "[$&]")}%`;
  try {
    const result = await pool
      .request()
      .input("pattern", sql.NVarChar(500), pattern)
      .input("limit", sql.Int, cap).query(`
        SELECT TOP (@limit) ${COMPANY_COLS_WITH_PRICE}
        FROM companies
        WHERE company_name LIKE @pattern ESCAPE '[' OR industry LIKE @pattern ESCAPE '['
        ORDER BY company_name ASC
      `);
    return { companies: result.recordset.map(toCompanyDto) };
  } catch (err) {
    if (isReferralPriceColumnError(err)) {
      const result = await pool
        .request()
        .input("pattern", sql.NVarChar(500), pattern)
        .input("limit", sql.Int, cap).query(`
          SELECT TOP (@limit) ${COMPANY_COLS_NO_PRICE}
          FROM companies
          WHERE company_name LIKE @pattern ESCAPE '[' OR industry LIKE @pattern ESCAPE '['
          ORDER BY company_name ASC
        `);
      const rows = (result.recordset || []).map((r) => ({
        ...r,
        referral_price: 0,
      }));
      return { companies: rows.map(toCompanyDto) };
    }
    throw err;
  }
}

/**
 * Get providers by company ID. Works before and after companies.referral_price migration.
 */
async function getProvidersByCompany(companyId) {
  const pool = await getPool();
  const withPrice = `
    SELECT u.*, c.company_id, c.company_name, c.logo_url, c.industry, c.referral_price, c.created_at AS company_created_at
    FROM users u
    INNER JOIN companies c ON u.company_id = c.company_id
    WHERE u.company_id = @company_id AND u.is_referral_provider = 1
    ORDER BY u.provider_rating DESC, u.provider_rating_count DESC
  `;
  const noPrice = `
    SELECT u.*, c.company_id, c.company_name, c.logo_url, c.industry, c.created_at AS company_created_at
    FROM users u
    INNER JOIN companies c ON u.company_id = c.company_id
    WHERE u.company_id = @company_id AND u.is_referral_provider = 1
    ORDER BY u.provider_rating DESC, u.provider_rating_count DESC
  `;
  let result;
  try {
    result = await pool
      .request()
      .input("company_id", sql.BigInt, companyId)
      .query(withPrice);
  } catch (err) {
    if (isReferralPriceColumnError(err)) {
      result = await pool
        .request()
        .input("company_id", sql.BigInt, companyId)
        .query(noPrice);
      (result.recordset || []).forEach((r) => {
        r.referral_price = 0;
      });
    } else {
      throw err;
    }
  }

  const rows = Array.isArray(result.recordset) ? result.recordset : [];
  const providers = rows.map((row) => {
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
      referral_price:
        row.referral_price != null ? Number(row.referral_price) : 0,
      created_at: row.company_created_at,
    };
    return {
      ...toUserDto(user),
      company: toCompanyDto(company),
    };
  });

  return { providers };
}

/**
 * Update company referral_price (admin only). Affects future referrals only.
 */
async function updateCompanyReferralPrice(companyId, referralPrice) {
  const pool = await getPool();
  const cid = parseBigIntParam(companyId);
  if (!cid) {
    throw new Error("Invalid company_id");
  }
  const price = Number(referralPrice);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("referral_price must be a non-negative number");
  }

  const result = await pool
    .request()
    .input("company_id", sql.BigInt, cid)
    .input("referral_price", sql.Decimal(10, 2), price).query(`
      UPDATE companies
      SET referral_price = @referral_price
      WHERE company_id = @company_id
    `);

  if (result.rowsAffected[0] === 0) {
    throw new Error("Company not found");
  }

  return { success: true, company_id: String(cid), referral_price: price };
}

module.exports = {
  getCompanyDomains,
  listCompanies,
  searchCompanies,
  getProvidersByCompany,
  updateCompanyReferralPrice,
};
