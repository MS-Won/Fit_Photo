import { describe, it, expect } from 'vitest';
import { presetToTarget, byteLimits, checkResult, formatBytes } from './target';
import { PHOTO_PRESETS } from '../presets';

const passport = PHOTO_PRESETS.find((p) => p.slug === 'passport')!;
const qnet = PHOTO_PRESETS.find((p) => p.slug === 'qnet')!;
const gosi = PHOTO_PRESETS.find((p) => p.slug === 'gosi')!;

describe('presetToTarget', () => {
  it('uses exact pixels and computes dpi from physical size', () => {
    expect(presetToTarget(passport)).toEqual({ widthPx: 413, heightPx: 531, maxKB: 500, minKB: undefined, dpi: 300 });
  });

  it('uses recommended pixels for range presets', () => {
    const t = presetToTarget(qnet);
    expect([t.widthPx, t.heightPx]).toEqual([300, 400]);
  });
});

describe('byteLimits', () => {
  it('uses 1000-based max minus safety margin and 1024-based min', () => {
    expect(byteLimits(presetToTarget(gosi))).toEqual({ minBytes: 20 * 1024, maxBytes: 240 * 1000 - 64 });
    expect(byteLimits(presetToTarget(passport))).toEqual({ minBytes: undefined, maxBytes: 500 * 1000 - 64 });
  });
});

describe('checkResult', () => {
  const t = presetToTarget(gosi);
  it('passes a result inside limits', () => {
    expect(checkResult(t, { widthPx: 413, heightPx: 531, bytes: 100_000 })).toEqual({ pixels: true, size: true, belowMin: false });
  });
  it('flags wrong pixels, oversize and undersize', () => {
    expect(checkResult(t, { widthPx: 400, heightPx: 531, bytes: 100_000 }).pixels).toBe(false);
    expect(checkResult(t, { widthPx: 413, heightPx: 531, bytes: 240_000 }).size).toBe(false);
    expect(checkResult(t, { widthPx: 413, heightPx: 531, bytes: 10_000 })).toEqual({ pixels: true, size: false, belowMin: true });
  });
});

describe('formatBytes', () => {
  it('formats KB and MB', () => {
    expect(formatBytes(191_488)).toBe('187KB');
    expect(formatBytes(3_355_443)).toBe('3.2MB');
    expect(formatBytes(800)).toBe('1KB');
  });
});
