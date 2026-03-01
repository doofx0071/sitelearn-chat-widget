import { describe, expect, it } from 'vitest';

import { isExcludedPath, mergeExcludedPathPrefixes } from './exclusions';

describe('crawler exclusions', () => {
  it('excludes default private/system paths', () => {
    expect(isExcludedPath('https://example.com/admin')).toBe(true);
    expect(isExcludedPath('https://example.com/login/reset')).toBe(true);
    expect(isExcludedPath('https://example.com/docs/getting-started')).toBe(false);
  });

  it('normalizes custom exclusions and merges with defaults', () => {
    const merged = mergeExcludedPathPrefixes(['private-area/', 'Members', '/Admin']);
    expect(merged).toContain('/private-area');
    expect(merged).toContain('/members');
    expect(merged).toContain('/admin');
  });

  it('applies custom exclusions during URL checks', () => {
    expect(isExcludedPath('https://example.com/members/pricing', ['/members'])).toBe(true);
    expect(isExcludedPath('https://example.com/docs', ['/members'])).toBe(false);
  });
});
