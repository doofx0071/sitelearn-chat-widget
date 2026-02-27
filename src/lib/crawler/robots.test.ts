import { describe, it, expect } from 'vitest';
import { RobotsParser } from './robots';

describe('robots', () => {
  const content = `
User-agent: *
Disallow: /private/
Allow: /private/public-page
Crawl-delay: 5

Sitemap: https://example.com/sitemap.xml
  `;

  it('should parse rules correctly', () => {
    const parser = new RobotsParser(content);
    expect(parser.isAllowed('https://example.com/allowed')).toBe(true);
    expect(parser.isAllowed('https://example.com/private/secret')).toBe(false);
    expect(parser.isAllowed('https://example.com/private/public-page')).toBe(true);
  });

  it('should get crawl delay', () => {
    const parser = new RobotsParser(content);
    expect(parser.getCrawlDelay('*')).toBe(5);
  });

  it('should get sitemaps', () => {
    const parser = new RobotsParser(content);
    expect(parser.getSitemaps()).toContain('https://example.com/sitemap.xml');
  });
});
