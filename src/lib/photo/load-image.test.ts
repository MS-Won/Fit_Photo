import { describe, it, expect } from 'vitest';
import { isHeic, isSupportedImage, downscaleSize, MAX_SOURCE_PIXELS } from './load-image';

describe('isHeic', () => {
  it('detects by mime type or extension', () => {
    expect(isHeic({ name: 'a.jpg', type: 'image/heic' })).toBe(true);
    expect(isHeic({ name: 'IMG_0001.HEIC', type: '' })).toBe(true);
    expect(isHeic({ name: 'a.heif', type: '' })).toBe(true);
    expect(isHeic({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
  });
});

describe('isSupportedImage', () => {
  it('accepts jpg/png/webp/heic and rejects others', () => {
    expect(isSupportedImage({ name: 'a.jpg', type: 'image/jpeg' })).toBe(true);
    expect(isSupportedImage({ name: 'a.png', type: 'image/png' })).toBe(true);
    expect(isSupportedImage({ name: 'a.webp', type: 'image/webp' })).toBe(true);
    expect(isSupportedImage({ name: 'a.HEIC', type: '' })).toBe(true);
    expect(isSupportedImage({ name: 'a.gif', type: 'image/gif' })).toBe(false);
    expect(isSupportedImage({ name: 'a.pdf', type: 'application/pdf' })).toBe(false);
  });
});

describe('downscaleSize', () => {
  it('keeps small images', () => {
    expect(downscaleSize(4000, 3000)).toEqual({ width: 4000, height: 3000 });
  });
  it('shrinks huge images under the pixel cap keeping aspect', () => {
    const r = downscaleSize(10000, 8000);
    expect(r.width * r.height).toBeLessThanOrEqual(MAX_SOURCE_PIXELS);
    expect(r.width / r.height).toBeCloseTo(1.25, 2);
  });
});
