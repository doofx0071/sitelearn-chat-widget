/**
 * Normalizes a URL by resolving it against a base URL and removing fragments.
 */
export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const absoluteUrl = new URL(sanitizeProtocol(url), sanitizeProtocol(baseUrl));
    absoluteUrl.hash = ''; // strip fragment
    return normalizeTrailingSlash(absoluteUrl.toString());
  } catch (error) {
    return url;
  }
}

function sanitizeProtocol(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  // Fix malformed protocol forms and duplicate prefixes.
  // Examples:
  // - https//example.com -> https://example.com
  // - http//example.com -> http://example.com
  // - https://https://example.com -> https://example.com
  const withProtocol = trimmed.replace(/^(https?):?\/\//i, '$1://');
  return withProtocol.replace(/^(https?:\/\/)+/i, 'https://');
}

/**
 * Checks if a URL belongs to the same domain.
 */
export function isSameDomain(url: string, domain: string): boolean {
  try {
    const urlDomain = extractDomain(url);
    const targetDomain = extractDomain(domain);
    return urlDomain === targetDomain || urlDomain.endsWith(`.${targetDomain}`);
  } catch {
    return false;
  }
}

/**
 * Extracts the hostname from a URL.
 */
export function extractDomain(url: string): string {
  try {
    const cleanUrl = sanitizeProtocol(url);
    const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Removes the fragment (hash) from a URL.
 */
export function stripFragment(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.split('#')[0];
  }
}

/**
 * Normalizes trailing slashes by removing them unless it's the root.
 */
export function normalizeTrailingSlash(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
  }
}
