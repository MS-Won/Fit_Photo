import { describe, it, expect } from 'vitest';
import { getGuideLines, headFractionRange, computeCropRect, clampRectToImage } from './crop-math';
import { PHOTO_PRESETS } from '../presets';

const passport = PHOTO_PRESETS.find((p) => p.slug === 'passport')!;
const toeic = PHOTO_PRESETS.find((p) => p.slug === 'toeic')!;
const face = { crownY: 320, chinY: 920, eyeY: 600, centerX: 600 };

describe('headFractionRange', () => {
  it('derives the range from head cm / photo height', () => {
    const [min, max] = headFractionRange(passport);
    expect(min).toBeCloseTo(3.2 / 4.5, 4);
    expect(max).toBeCloseTo(3.6 / 4.5, 4);
  });
  it('falls back to a default composition range without head rule', () => {
    expect(headFractionRange(toeic)).toEqual([0.65, 0.75]);
  });
});

describe('getGuideLines', () => {
  it('places crown and chin bands with 40% of spare height above the head', () => {
    const g = getGuideLines(passport)!;
    expect(g.crownBand[0]).toBeCloseTo(0.08, 3);   // 머리 3.6cm일 때 정수리
    expect(g.crownBand[1]).toBeCloseTo(0.1156, 3); // 머리 3.2cm일 때 정수리
    expect(g.chinBand[0]).toBeCloseTo(0.8267, 3);
    expect(g.chinBand[1]).toBeCloseTo(0.88, 3);
  });
  it('returns null without head rule', () => {
    expect(getGuideLines(toeic)).toBeNull();
  });
});

describe('computeCropRect', () => {
  it('sizes the crop so the head hits the middle of the allowed range', () => {
    const r = computeCropRect(face, 413 / 531, passport);
    expect(r.height).toBeCloseTo(794.12, 1);
    expect(r.width).toBeCloseTo(617.65, 1);
    expect(r.y).toBeCloseTo(242.35, 1);
    expect(r.x).toBeCloseTo(291.18, 1);
  });
});

describe('clampRectToImage', () => {
  it('rounds and keeps an inside rect', () => {
    expect(clampRectToImage({ x: 291.18, y: 242.35, width: 617.65, height: 794.12 }, 1200, 1600)).toEqual({ x: 291, y: 242, width: 618, height: 794 });
  });
  it('shifts a rect that overflows', () => {
    expect(clampRectToImage({ x: -50, y: 1000, width: 400, height: 800 }, 1200, 1600)).toEqual({ x: 0, y: 800, width: 400, height: 800 });
  });
  it('shrinks a rect larger than the image keeping aspect', () => {
    const r = clampRectToImage({ x: 0, y: 0, width: 1500, height: 2000 }, 1200, 1600);
    expect(r).toEqual({ x: 0, y: 0, width: 1200, height: 1600 });
  });
});
