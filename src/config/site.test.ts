import { describe, it, expect } from 'vitest';
import { siteConfig } from './site';

describe('siteConfig', () => {
  it('has a name and an absolute url without trailing slash', () => {
    expect(siteConfig.name.length).toBeGreaterThan(0);
    expect(siteConfig.url).toMatch(/^https:\/\/[^/]+$/);
  });
});
