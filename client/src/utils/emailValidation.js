/**
 * Frontend company email validation – must mirror backend rules.
 * Backend remains source of truth; this is for UX only.
 */

export const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
];

export function isPersonalEmail(email) {
  const domain = email?.split('@')[1]?.toLowerCase();
  return !!domain && PERSONAL_EMAIL_DOMAINS.includes(domain);
}

export function isValidCompanyEmail(email, allowedDomains) {
  const domain = email?.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const normalized = (allowedDomains || []).map((d) => String(d).toLowerCase());
  return normalized.includes(domain);
}
