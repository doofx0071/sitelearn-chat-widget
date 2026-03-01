import { parseHTML } from 'linkedom';

function sanitizeSitemapUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  const withProtocol = trimmed.replace(/^(https?):?\/\//i, '$1://');
  return withProtocol.replace(/^(https?:\/\/)+/i, 'https://');
}

/**
 * Fetches and parses a sitemap (including sitemap indexes).
 */
export async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sanitizeSitemapUrl(sitemapUrl));
    if (!response.ok) return [];
    const xml = await response.text();
    return await parseSitemapXml(xml, sitemapUrl);
  } catch (error) {
    console.error(`Error fetching sitemap: ${sitemapUrl}`, error);
    return [];
  }
}

/**
 * Parses Sitemap XML and handles indexes recursively.
 */
export async function parseSitemapXml(xml: string, baseUrl: string): Promise<string[]> {
  const { document } = parseHTML(xml);
  const urls: string[] = [];
  
  // Handle <urlset>
  const locs = document.querySelectorAll('url > loc');
  locs.forEach(loc => {
    if (loc.textContent) urls.push(sanitizeSitemapUrl(loc.textContent));
  });

  // Handle <sitemapindex>
  const sitemapLocs = document.querySelectorAll('sitemap > loc');
  for (const loc of Array.from(sitemapLocs)) {
    if (loc.textContent) {
      const subUrls = await fetchSitemapUrls(sanitizeSitemapUrl(loc.textContent));
      urls.push(...subUrls);
    }
  }

  return [...new Set(urls)];
}
