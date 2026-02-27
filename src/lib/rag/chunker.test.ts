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
});
