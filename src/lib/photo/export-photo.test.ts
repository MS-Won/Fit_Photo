import { describe, it, expect } from 'vitest';
import { encodeLimits } from './export-photo';

describe('encodeLimits', () => {
  it('with dpi should reduce maxBytes by JFIF_APP0_BYTES (18)', () => {
    const target = { widthPx: 413, heightPx: 531, maxKB: 500, dpi: 300 };
    const limits = encodeLimits(target);
    expect(limits.maxBytes).toBe(500 * 1000 - 64 - 18);
    expect(limits.minBytes).toBeUndefined();
  });

  it('without dpi should not reduce maxBytes', () => {
    const target = { widthPx: 413, heightPx: 531, maxKB: 500 };
    const limits = encodeLimits(target);
    expect(limits.maxBytes).toBe(500 * 1000 - 64);
    expect(limits.minBytes).toBeUndefined();
  });

  it('should pass through minKB as minBytes', () => {
    const target = { widthPx: 413, heightPx: 531, maxKB: 500, minKB: 20 };
    const limits = encodeLimits(target);
    expect(limits.minBytes).toBe(20 * 1024);
  });
});
