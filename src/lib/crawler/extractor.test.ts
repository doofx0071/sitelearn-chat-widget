import { describe, it, expect, vi } from 'vitest';
import { fetchAndExtract } from './extractor';

describe('extractor', () => {
  it('should extract content from HTML', async () => {
    const mockHtml = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Main Title</h1>
          <p>This is the main content of the page.</p>
        </body>
      </html>
    `;
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    });

    const result = await fetchAndExtract('https://example.com');
    expect(result.title).toContain('Test Page');
    expect(result.content).toContain('This is the main content');
    expect(result.html).toBeDefined();
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found'
    });

    const result = await fetchAndExtract('https://example.com/404');
    expect(result.title).toBe('');
    expect(result.content).toBe('');
  });
});
