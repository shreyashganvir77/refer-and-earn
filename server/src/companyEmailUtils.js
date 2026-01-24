/**
 * Company email validation – backend source of truth.
 * Personal domains blocked; company domain must match company_domains.
 */

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
];

/**
 * @param {string} email
 * @param {string[]} allowedDomains - e.g. ['amazon.com','microsoft.com']
 * @returns {{ valid: boolean; reason?: 'INVALID_EMAIL'|'PERSONAL_EMAIL_NOT_ALLOWED'|'INVALID_COMPANY_DOMAIN' }}
 */
function validateCompanyEmail(email, allowedDomains) {
  const domain = (email && typeof email === 'string')
    ? email.split('@')[1]?.toLowerCase().trim()
    : '';

  if (!domain) {
    return { valid: false, reason: 'INVALID_EMAIL' };
  }

  if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, reason: 'PERSONAL_EMAIL_NOT_ALLOWED' };
  }

  const normalized = allowedDomains.map((d) => String(d).toLowerCase());
  if (!normalized.includes(domain)) {
    return { valid: false, reason: 'INVALID_COMPANY_DOMAIN' };
  }

  return { valid: true };
}

module.exports = {
  PERSONAL_EMAIL_DOMAINS,
  validateCompanyEmail,
};
