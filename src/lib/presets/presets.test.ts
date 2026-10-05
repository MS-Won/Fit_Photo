import { describe, it, expect } from 'vitest';
import {
  PHOTO_PRESETS,
  publishedPresets,
  getPreset,
  validatePreset,
  presetSummary,
  downloadFileName,
} from './index';
import type { PhotoPreset } from './types';

const base: PhotoPreset = {
  slug: 'test',
  name: '테스트',
  org: '기관',
  physicalCm: { w: 3.5, h: 4.5 },
  pixels: { mode: 'exact', w: 413, h: 531 },
  format: 'jpg',
  fileSizeKB: { max: 500 },
  head: { minCm: 3.2, maxCm: 3.6 },
  checklist: ['a'],
  faq: [{ q: 'q', a: 'a' }],
  sources: [{ label: 's', url: 'https://example.go.kr' }],
  verifiedAt: '2026-10-02',
};

describe('validatePreset', () => {
  it('accepts a valid preset', () => {
    expect(validatePreset(base)).toEqual([]);
  });

  it('rejects a published preset without sources', () => {
    expect(validatePreset({ ...base, sources: [] })).toContain('sources: 공식 출처가 없습니다');
  });

  it('rejects pixel aspect that differs from physical aspect by more than 3%', () => {
    const errors = validatePreset({ ...base, pixels: { mode: 'exact', w: 413, h: 413 } });
    expect(errors.some((e) => e.startsWith('pixels:'))).toBe(true);
  });

  it('rejects head range taller than the photo', () => {
    const errors = validatePreset({ ...base, head: { minCm: 3.2, maxCm: 5 } });
    expect(errors.some((e) => e.startsWith('head:'))).toBe(true);
  });

  it('rejects min file size above max', () => {
    const errors = validatePreset({ ...base, fileSizeKB: { min: 600, max: 500 } });
    expect(errors.some((e) => e.startsWith('fileSizeKB:'))).toBe(true);
  });
});

describe('PHOTO_PRESETS data', () => {
  it('has unique slugs', () => {
    const slugs = PHOTO_PRESETS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(PHOTO_PRESETS.map((p) => [p.slug, p] as const))('%s is valid', (_slug, preset) => {
    expect(validatePreset(preset)).toEqual([]);
  });

  it('publishes only verified presets', () => {
    for (const p of publishedPresets()) expect(p.verifiedAt).not.toBeNull();
  });
});

describe('helpers', () => {
  it('summarizes a preset', () => {
    expect(presetSummary(base)).toBe('3.5×4.5cm · 413×531px · 500KB 이하');
    expect(
      presetSummary({ ...base, fileSizeKB: { min: 20, max: 240 } }),
    ).toBe('3.5×4.5cm · 413×531px · 20~240KB');
    expect(
      presetSummary({
        ...base,
        pixels: { mode: 'range', recommended: { w: 350, h: 450 }, min: { w: 200, h: 200 } },
      }),
    ).toBe('3.5×4.5cm · 350×450px 권장 · 500KB 이하');
  });

  it('builds a download file name', () => {
    expect(downloadFileName(base, 413, 531)).toBe('테스트사진_413x531.jpg');
  });

  it('getPreset hides unpublished presets', () => {
    const unpublished = PHOTO_PRESETS.find((p) => p.verifiedAt === null);
    if (unpublished) expect(getPreset(unpublished.slug)).toBeUndefined();
  });
});
