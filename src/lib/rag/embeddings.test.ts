import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateEmbedding, generateEmbeddings } from './embeddings';

describe('embeddings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses OpenRouter defaults with embedding-safe model', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [{ embedding: [0.1, 0.2] }] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await generateEmbedding('test text', {
      provider: 'openrouter',
      apiKey: 'test-key',
    });

    expect(result).toEqual([0.1, 0.2]);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/embeddings');

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('openai/text-embedding-3-small');
    expect(body.encoding_format).toBe('float');
    expect(body.input).toEqual(['test text']);
  });

  it('uses OpenAI default endpoint/model', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [{ embedding: [1, 2, 3] }] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await generateEmbedding('hello', {
      provider: 'openai',
      apiKey: 'openai-key',
    });

    expect(result).toEqual([1, 2, 3]);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/embeddings');

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('text-embedding-3-small');
    expect(body.encoding_format).toBe('float');
  });

  it('sanitizes control chars, trims empties, and truncates long input', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        data: [{ embedding: [0] }, { embedding: [1] }, { embedding: [2] }],
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const long = `A${'x'.repeat(13000)}`;
    await generateEmbeddings(['\u0000 hi \u0007', '   ', long], {
      provider: 'custom',
      apiKey: 'k',
      baseURL: 'https://custom.example/v1',
      model: 'embed-model',
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.input[0]).toBe('hi');
    expect(body.input[1]).toBe('(empty)');
    expect(body.input[2].length).toBe(12000);
  });
});
