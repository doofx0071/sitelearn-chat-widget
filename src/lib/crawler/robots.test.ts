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

  it('should handle multiple user agents', () => {
    const multiContent = `
User-agent: Googlebot
Disallow: /google-only
User-agent: *
Disallow: /private
    `;
    const parser = new RobotsParser(multiContent);
    expect(parser.isAllowed('https://example.com/google-only', 'Googlebot')).toBe(false);
    expect(parser.isAllowed('https://example.com/google-only', 'OtherBot')).toBe(true);
    expect(parser.isAllowed('https://example.com/private', 'OtherBot')).toBe(false);
  });

  it('should handle empty content', () => {
    const parser = new RobotsParser('');
    expect(parser.isAllowed('https://example.com/any')).toBe(true);
    expect(parser.getSitemaps()).toEqual([]);
  });

  it('should handle malformed sitemap URLs in robots.txt', () => {
    const malformedContent = `
Sitemap: https://https://example.com/sitemap.xml
    `;
    const parser = new RobotsParser(malformedContent);
    expect(parser.getSitemaps()).toContain('https://https://example.com/sitemap.xml');
  });
});
