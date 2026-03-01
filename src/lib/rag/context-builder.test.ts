import { describe, it, expect } from 'vitest';
import { buildRagContext, formatCitations, calculateRelevanceScore } from './context-builder';

describe('context-builder', () => {
  const mockChunks = [
    {
      content: 'This is the first chunk.',
      url: 'https://example.com/page1',
      pageTitle: 'Page 1',
      section: 'Introduction'
    },
    {
      content: 'This is the second chunk.',
      url: 'https://example.com/page2',
      pageTitle: 'Page 2'
    }
  ];

  describe('buildRagContext', () => {
    it('should build context with sources', () => {
      const query = 'What is this?';
      const context = buildRagContext(query, mockChunks);
      expect(context).toContain('Use the following context to answer');
      expect(context).toContain('[Source 1]: Page 1 - Introduction');
      expect(context).toContain('This is the first chunk.');
      expect(context).toContain('[Source 2]: Page 2');
      expect(context).toContain('This is the second chunk.');
    });

    it('should return empty string for no chunks', () => {
      expect(buildRagContext('query', [])).toBe('');
    });
  });

  describe('formatCitations', () => {
    it('should format chunks into citations', () => {
      const citations = formatCitations(mockChunks);
      expect(citations).toHaveLength(2);
      expect(citations[0]).toEqual({
        content: 'This is the first chunk.',
        url: 'https://example.com/page1',
        title: 'Page 1'
      });
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate score based on keyword matches', () => {
      const query = 'first chunk';
      const score = calculateRelevanceScore(query, mockChunks[0]);
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for no matches', () => {
      const query = 'nonexistent term';
      const score = calculateRelevanceScore(query, mockChunks[0]);
      expect(score).toBe(0);
    });

    it('should ignore short terms', () => {
      const query = 'is the';
      const score = calculateRelevanceScore(query, mockChunks[0]);
      expect(score).toBe(0);
    });
  });
});
