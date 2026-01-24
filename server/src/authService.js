const { getPool, sql } = require('./db');
const { verifyGoogleIdToken } = require('./google');
const { signSessionJwt } = require('./auth');
const { toUserDto, toCompanyDto } = require('./utils');
const { getUserWithCompanyById } = require('./userHelpers');

/**
 * Handle Google OAuth authentication
 */
async function handleGoogleAuth(idToken) {
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

  return {
    token,
    user: toUserDto(user),
    company: toCompanyDto(company),
  };
}

/**
 * Get current authenticated user
 */
async function getCurrentUser(userId) {
  const result = await getUserWithCompanyById(userId);
  if (!result) return null;

  return {
    user: toUserDto(result.user),
    company: toCompanyDto(result.company),
  };
}

module.exports = {
  handleGoogleAuth,
  getCurrentUser,
};
