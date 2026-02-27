/**
 * Normalizes a URL by resolving it against a base URL and removing fragments.
 */
export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const absoluteUrl = new URL(url, baseUrl);
    absoluteUrl.hash = ''; // strip fragment
    return normalizeTrailingSlash(absoluteUrl.toString());
  } catch (error) {
    return url;
  }
}

/**
 * Checks if a URL belongs to the same domain.
 */
export function isSameDomain(url: string, domain: string): boolean {
  try {
    const urlDomain = extractDomain(url);
    const targetDomain = extractDomain(domain);
    return urlDomain.endsWith(targetDomain) || targetDomain.endsWith(urlDomain);
  } catch {
    return false;
  }
}

/**
 * Extracts the hostname from a URL.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
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
