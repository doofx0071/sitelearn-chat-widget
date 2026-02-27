import { parseHTML } from 'linkedom';

/**
 * Fetches and parses a sitemap (including sitemap indexes).
 */
export async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl);
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
    if (loc.textContent) urls.push(loc.textContent.trim());
  });

  // Handle <sitemapindex>
  const sitemapLocs = document.querySelectorAll('sitemap > loc');
  for (const loc of Array.from(sitemapLocs)) {
    if (loc.textContent) {
      const subUrls = await fetchSitemapUrls(loc.textContent.trim());
      urls.push(...subUrls);
    }
  }

  return [...new Set(urls)];
}
