import { describe, it, expect } from 'vitest';
import { normalizeUrl, isSameDomain, extractDomain, stripFragment, normalizeTrailingSlash } from './url-normalizer';

describe('url-normalizer', () => {
  describe('normalizeUrl', () => {
    it('should resolve relative URLs', () => {
      expect(normalizeUrl('/about', 'https://example.com')).toBe('https://example.com/about');
    });
    it('should strip fragments', () => {
      expect(normalizeUrl('https://example.com/page#section', 'https://example.com')).toBe('https://example.com/page');
    });
    it('should handle invalid URLs', () => {
      expect(normalizeUrl('not-a-url', 'https://example.com')).toBe('https://example.com/not-a-url');
    });
    it('should handle empty strings', () => {
      expect(normalizeUrl('', 'https://example.com')).toBe('https://example.com/');
    });
    it('should not double prefix https://', () => {
      expect(normalizeUrl('https://example.com', 'https://example.com')).toBe('https://example.com/');
    });
    it('should handle malformed input with double protocol', () => {
      // This is the bug we are looking for
      expect(normalizeUrl('https://https://example.com', 'https://example.com')).toBe('https://example.com/');
    });
    it('should handle extractDomain with double protocol', () => {
      expect(extractDomain('https://https://example.com')).toBe('example.com');
    });
  });

  describe('isSameDomain', () => {
    it('should return true for same domain', () => {
      expect(isSameDomain('https://blog.example.com', 'https://example.com')).toBe(true);
    });
    it('should return false for different domains', () => {
      expect(isSameDomain('https://google.com', 'https://example.com')).toBe(false);
    });
    it('should handle invalid domains', () => {
      expect(isSameDomain('invalid', 'example.com')).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain and remove www', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('example.com');
    });
    it('should handle subdomains', () => {
      expect(extractDomain('https://app.staging.example.com')).toBe('app.staging.example.com');
    });
    it('should handle URLs without protocol', () => {
      expect(extractDomain('example.com/path')).toBe('example.com');
    });
  });

  describe('stripFragment', () => {
    it('should remove hash', () => {
      expect(stripFragment('https://example.com/#test')).toBe('https://example.com/');
    });
  });

  describe('normalizeTrailingSlash', () => {
    it('should remove trailing slash from path', () => {
      expect(normalizeTrailingSlash('https://example.com/path/')).toBe('https://example.com/path');
    });
    it('should keep slash for root', () => {
      expect(normalizeTrailingSlash('https://example.com/')).toBe('https://example.com/');
    });
  });
});
