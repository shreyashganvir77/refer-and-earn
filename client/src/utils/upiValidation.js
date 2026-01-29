/**
 * Basic UPI ID format: something@bank
 * Local part: alphanumeric, dots, underscores, hyphens.
 * Domain: alphanumeric (bank identifier).
 */
const UPI_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

export function isValidUpiId(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 256 && UPI_PATTERN.test(trimmed);
}
