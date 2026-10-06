import { describe, it, expect } from 'vitest';
import { metadata } from './page';
import { publishedPresets } from '@/lib/presets';

describe('photo index page metadata', () => {
  it('description names every published preset', () => {
    const description = String(metadata.description ?? '');
    for (const p of publishedPresets()) {
      expect(description).toContain(p.name);
    }
  });
});
