/**
 * Safe redirect utility for MarTechAdda client applications.
 * Handles both cross-domain redirects (with tokens) and internal client-side routing.
 * Defensively cleans URLs (missing colons e.g. https//, protocol-relative //),
 * avoids duplicate question marks or malformed query strings,
 * and restricts external redirects to allowed MarTechAdda domains.
 */

const ALLOWED_DOMAINS = [
  'martechadda.com',
  'www.martechadda.com',
  'app.martechadda.com',
  'localhost',
  '127.0.0.1',
];

export function executeSafeRedirect(
  targetUrl: string | null | undefined,
  token: string | null | undefined,
  navigate: (to: string, options?: { replace?: boolean; state?: any }) => void,
  fallbackPath: string = '/expert/dashboard'
): void {
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
    navigate(fallbackPath, { replace: true });
    return;
  }

  let cleaned = targetUrl.trim();

  // Normalize missing colon in scheme: e.g. "https//", "http//" -> "https://", "http://"
  cleaned = cleaned.replace(/^(https?)\/\/(?=[^/])/i, '$1://');
  if (cleaned.startsWith('//')) {
    cleaned = `https:${cleaned}`;
  }

  const isAbsolute = /^https?:\/\//i.test(cleaned);
  const isKnownDomain = /^(www\.)?martechadda\.com/i.test(cleaned) || /^app\.martechadda\.com/i.test(cleaned);

  if (isAbsolute || isKnownDomain) {
    const urlString = isAbsolute ? cleaned : `https://${cleaned}`;
    try {
      const parsed = new URL(urlString);
      const isAllowed = ALLOWED_DOMAINS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );

      if (isAllowed) {
        if (token) {
          parsed.searchParams.set('token', token);
        }
        window.location.href = parsed.toString();
        return;
      }
    } catch {
      // Fallback on parse failure
    }
  }

  // Relative path on current app
  const path = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  navigate(path, { replace: true });
}
