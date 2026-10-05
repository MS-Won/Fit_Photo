import { describe, it, expect } from 'vitest';
import { isHeic, isSupportedImage, downscaleSize, bitmapOptions, formatOf, MAX_SOURCE_PIXELS } from './load-image';

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

describe('bitmapOptions', () => {
  it('returns no resize options when within the pixel cap', () => {
    expect(bitmapOptions(4000, 3000)).toEqual({ imageOrientation: 'from-image' });
  });

  it('returns resize options bounded by the pixel cap when over it', () => {
    const opts = bitmapOptions(16320, 12240);
    expect(opts.imageOrientation).toBe('from-image');
    expect(opts.resizeQuality).toBe('high');
    expect(opts.resizeWidth).toBeDefined();
    expect(opts.resizeHeight).toBeDefined();
    const w = opts.resizeWidth as number;
    const h = opts.resizeHeight as number;
    expect(w * h).toBeLessThanOrEqual(MAX_SOURCE_PIXELS);
    expect(w / h).toBeCloseTo(16320 / 12240, 2);
  });
});

describe('formatOf', () => {
  it('falls back to mime subtype for dotless filenames', () => {
    expect(formatOf({ name: 'photo', type: 'image/jpeg' })).toBe('JPG');
  });
  it('normalizes jpeg extension to jpg', () => {
    expect(formatOf({ name: 'a.jpeg', type: '' })).toBe('JPG');
  });
  it('uppercases known extensions', () => {
    expect(formatOf({ name: 'IMG.HEIC', type: '' })).toBe('HEIC');
  });
  it('falls back to mime subtype for dotless name with png type', () => {
    expect(formatOf({ name: 'x', type: 'image/png' })).toBe('PNG');
  });
});
