import { describe, it, expect } from 'vitest';
import { chunkText, estimateTokenCount } from './chunker';

describe('chunker', () => {
  it('should estimate token count', () => {
    expect(estimateTokenCount('hello world')).toBe(3);
  });

  it('should split text into chunks', () => {
    const text = '# Heading\nThis is a paragraph. It has some sentences.\n\nAnother paragraph here.';
    const chunks = chunkText(text, { maxTokens: 10, overlap: 2 });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].headings).toContain('Heading');
  });

  it('should handle large paragraphs by splitting into sentences', () => {
    const text = 'This is a very long paragraph that should be split into multiple chunks because it exceeds the maximum token limit. It has multiple sentences to facilitate splitting.';
    const chunks = chunkText(text, { maxTokens: 10, overlap: 2 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should include headings in chunks', () => {
    const text = '# Section 1\nContent 1\n\n## Section 2\nContent 2';
    const chunks = chunkText(text, { maxTokens: 50, overlap: 0 });
    expect(chunks[0].headings).toContain('Section 1');
    // Note: The current implementation only keeps the last heading found in the section
    // and sections are split by /(?=^#+ )/m
  });
});
