import { describe, it, expect, vi } from 'vitest';
import { parseSitemapXml } from './sitemap';

describe('sitemap', () => {
  it('should parse simple sitemap', async () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/page1</loc></url>
        <url><loc>https://example.com/page2</loc></url>
      </urlset>
    `;
    const urls = await parseSitemapXml(xml, 'https://example.com');
    expect(urls).toContain('https://example.com/page1');
    expect(urls).toContain('https://example.com/page2');
  });

  it('should handle empty sitemap', async () => {
    const urls = await parseSitemapXml('<urlset></urlset>', 'https://example.com');
    expect(urls).toEqual([]);
  });

  it('should handle sitemap index', async () => {
    // Mock fetch for recursive sitemap fetching
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/sub-page</loc></url>
        </urlset>
      `)
    });
    global.fetch = mockFetch;

    const xml = `
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>https://example.com/sub-sitemap.xml</loc></sitemap>
      </sitemapindex>
    `;
    const urls = await parseSitemapXml(xml, 'https://example.com');
    expect(urls).toContain('https://example.com/sub-page');
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/sub-sitemap.xml');
  });

  it('should handle malformed URLs in sitemap', async () => {
    const xml = `
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://https://example.com/page1</loc></url>
      </urlset>
    `;
    const urls = await parseSitemapXml(xml, 'https://example.com');
    expect(urls).toContain('https://example.com/page1');
  });
});
