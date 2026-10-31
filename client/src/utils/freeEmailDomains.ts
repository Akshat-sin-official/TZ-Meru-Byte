/**
 * Utility to identify generic/free consumer email domains (Gmail, Yahoo, Outlook, etc.)
 * versus corporate/business domains that correspond to active business websites.
 */

const FREE_EMAIL_DOMAINS = new Set<string>([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'outlook.com',
  'outlook.in',
  'live.com',
  'live.in',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'yahoo.ca',
  'ymail.com',
  'rocketmail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // Indian & Regional
  'rediffmail.com',
  'sify.com',
  // Privacy & Others
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'zohomail.in',
  'aol.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'fastmail.com',
  'tutanota.com',
  'tuta.com',
  'yandex.com',
  'yandex.ru',
  'inbox.com',
]);

/**
 * Checks if the given domain belongs to a free consumer email provider.
 */
export function isFreeEmailDomain(domain: string): boolean {
  if (!domain) return false;
  return FREE_EMAIL_DOMAINS.has(domain.trim().toLowerCase());
}

/**
 * Extracts a corporate domain from an email address if it is not a free webmail provider.
 * Returns null if the domain is free, invalid, or temporary.
 */
export function extractCorporateDomain(email: string): string | null {
  if (!email || typeof email !== 'string') return null;

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return null;

  const domain = parts[1];
  if (!domain || !domain.includes('.')) return null;

  if (isFreeEmailDomain(domain)) {
    return null;
  }

  // Basic validation that domain has valid characters
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  if (!domainRegex.test(domain)) {
    return null;
  }

  return domain;
}
