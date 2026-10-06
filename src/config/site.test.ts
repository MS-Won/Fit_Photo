import { describe, it, expect } from 'vitest';
import { siteConfig } from './site';
import { publishedPresets } from '@/lib/presets';

describe('siteConfig', () => {
  it('has a name and an absolute url without trailing slash', () => {
    expect(siteConfig.name.length).toBeGreaterThan(0);
    expect(siteConfig.url).toMatch(/^https:\/\/[^/]+$/);
  });

  it('description names every published preset', () => {
    for (const p of publishedPresets()) {
      expect(siteConfig.description).toContain(p.name);
    }
  });
});
