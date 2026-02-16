const { getPool, sql } = require("./db");
const { parseBigIntParam } = require("./utils");
const { getUserWithCompanyById } = require("./userHelpers");
const { toUserDto, toCompanyDto } = require("./utils");
const { sendOtpEmail } = require("./emailService");
const { validateCompanyEmail } = require("./companyEmailUtils");
const { getCompanyDomains } = require("./companiesService");

// In-memory OTP store: { [userId: string]: { code, email, expiresAt } }
const otpStore = new Map();

function generateOtp() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function domainValidationError(reason) {
  const err = new Error(reason);
  err.errorCode = reason;
  return err;
}

/**
 * Update user profile.
 * Rejects is_referral_provider = true unless company email is verified.
 */
async function updateUserProfile(userId, body) {
  if (body.is_referral_provider === true) {
    const existing = await getUserWithCompanyById(userId);
    if (!existing?.user?.is_company_email_verified) {
      const err = new Error(
        "Company email must be verified before enabling referral provider"
      );
      err.errorCode = "COMPANY_EMAIL_NOT_VERIFIED";
      throw err;
    }
  }

  const sets = [];
  const pool = await getPool();
  const request = pool.request().input("user_id", sql.BigInt, userId);

  if (body.company_id !== undefined) {
    const raw = body.company_id;
    const isEmpty = raw === null || raw === "";
    const cid = isEmpty ? null : parseBigIntParam(raw);
    if (!isEmpty && !cid) {
      throw new Error("Invalid company_id");
    }
    sets.push("company_id = @company_id");
    request.input("company_id", sql.BigInt, cid);
  }
  if (body.role_designation !== undefined) {
    sets.push("role_designation = @role_designation");
    request.input(
      "role_designation",
      sql.NVarChar(200),
      body.role_designation || null
    );
  }
  if (body.years_experience !== undefined) {
    const ye =
      body.years_experience === null || body.years_experience === ""
        ? null
        : Number(body.years_experience);
    if (ye !== null && (!Number.isInteger(ye) || ye < 0)) {
      throw new Error("Invalid years_experience");
    }
    sets.push("years_experience = @years_experience");
    request.input("years_experience", sql.Int, ye);
  }
  if (body.is_referral_provider !== undefined) {
    sets.push("is_referral_provider = @is_referral_provider");
    request.input(
      "is_referral_provider",
      sql.Bit,
      Boolean(body.is_referral_provider)
    );
  }
  if (body.bio_description !== undefined) {
    sets.push("bio_description = @bio_description");
    request.input(
      "bio_description",
      sql.NVarChar(1000),
      body.bio_description || null
    );
  }
  if (body.price_per_referral !== undefined) {
    const p =
      body.price_per_referral === null || body.price_per_referral === ""
        ? null
        : Number(body.price_per_referral);
    if (p !== null && (Number.isNaN(p) || p < 0)) {
      throw new Error("Invalid price_per_referral");
    }
    sets.push("price_per_referral = @price_per_referral");
    request.input("price_per_referral", sql.Decimal(10, 2), p);
  }
  if (body.phone_number !== undefined) {
    const pn =
      body.phone_number == null || body.phone_number === ""
        ? null
        : String(body.phone_number).trim();
    if (pn !== null && pn.length > 20) {
      throw new Error("phone_number must be at most 20 characters");
    }
    sets.push("phone_number = @phone_number");
    request.input("phone_number", sql.NVarChar(20), pn || null);
  }

  sets.push("updated_at = SYSUTCDATETIME()");

  const setClause = sets.join(", ");

  if (setClause) {
    await request.query(
      `UPDATE users SET ${setClause} WHERE user_id = @user_id`
    );
  }

  const result = await getUserWithCompanyById(userId);
  return {
    user: toUserDto(result.user),
    company: toCompanyDto(result.company),
  };
}

/**
 * Start OTP verification process.
 * Validates company email against company_domains; blocks personal domains.
 * @param {number|bigint} userId
 * @param {string} companyOfficialEmail
 * @param {number|bigint|null} companyId - required for domain validation
 */
async function startOtpVerification(userId, companyOfficialEmail, companyId) {
  const email =
    companyOfficialEmail && typeof companyOfficialEmail === "string"
      ? companyOfficialEmail.trim()
      : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw domainValidationError("INVALID_EMAIL");
  }

  if (!companyId) {
    throw new Error("company_id is required for company email validation");
  }

  const allowedDomains = await getCompanyDomains(companyId);
  const { valid, reason } = validateCompanyEmail(email, allowedDomains);
  if (!valid) {
    throw domainValidationError(reason);
  }

  const code = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(String(userId), { code, email, expiresAt });

  try {
    await sendOtpEmail({ to: email, code });
    return { success: true };
  } catch (e) {
    console.error(e);
    otpStore.delete(String(userId));
    throw new Error("Failed to send OTP email");
  }
}

/**
 * Verify OTP code. On success, persist company_email and set is_company_email_verified.
 */
async function verifyOtp(userId, code) {
  if (!code || typeof code !== "string") {
    throw new Error("OTP code is required");
  }

  const entry = otpStore.get(String(userId));
  if (!entry) {
    throw new Error("No OTP requested");
  }

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(String(userId));
    throw new Error("OTP expired");
  }

  if (entry.code !== code.trim()) {
    throw new Error("Invalid OTP");
  }

  const email = entry.email;
  otpStore.delete(String(userId));

  const pool = await getPool();
  await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("company_email", sql.NVarChar(320), email).query(`
      UPDATE users
      SET company_email = @company_email,
          is_company_email_verified = 1,
          updated_at = SYSUTCDATETIME()
      WHERE user_id = @user_id
    `);

  return { success: true };
}

module.exports = {
  updateUserProfile,
  startOtpVerification,
  verifyOtp,
};
