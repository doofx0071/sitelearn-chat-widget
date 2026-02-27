import { describe, it, expect, vi } from 'vitest';
import { generateEmbedding } from './embeddings';

describe('embeddings', () => {
  it('should call fetch with correct parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ embedding: [0.1, 0.2] }] })
    });
    global.fetch = mockFetch;

    const config = { provider: 'openrouter' as const, apiKey: 'test-key' };
    const result = await generateEmbedding('test text', config);

    expect(result).toEqual([0.1, 0.2]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('openrouter.ai'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    );
  });
});
