import { PHOTO_PRESETS } from './data';
import type { PhotoPreset } from './types';

export { PHOTO_PRESETS };
export type { PhotoPreset, PixelSpec } from './types';

const ASPECT_TOLERANCE = 0.03;

export function publishedPresets(): PhotoPreset[] {
  return PHOTO_PRESETS.filter((p) => p.verifiedAt !== null);
}

export function getPreset(slug: string): PhotoPreset | undefined {
  return publishedPresets().find((p) => p.slug === slug);
}

export function outputPixels(p: PhotoPreset): { w: number; h: number } {
  return p.pixels.mode === 'exact' ? { w: p.pixels.w, h: p.pixels.h } : p.pixels.recommended;
}

export function validatePreset(p: PhotoPreset): string[] {
  const errors: string[] = [];
  const px = outputPixels(p);
  const physicalAspect = p.physicalCm.w / p.physicalCm.h;
  const pixelAspect = px.w / px.h;
  if (Math.abs(pixelAspect / physicalAspect - 1) > ASPECT_TOLERANCE) {
    errors.push(`pixels: 픽셀 비율 ${pixelAspect.toFixed(3)}이 실물 비율 ${physicalAspect.toFixed(3)}과 3% 넘게 다릅니다`);
  }
  if (p.pixels.mode === 'range') {
    const { min, max, recommended: r } = p.pixels;
    if (min && (r.w < min.w || r.h < min.h)) errors.push('pixels: 권장값이 최소값보다 작습니다');
    if (max && (r.w > max.w || r.h > max.h)) errors.push('pixels: 권장값이 최대값보다 큽니다');
  }
  if (p.fileSizeKB.min !== undefined && p.fileSizeKB.min >= p.fileSizeKB.max) {
    errors.push('fileSizeKB: 최소 용량이 최대 용량 이상입니다');
  }
  if (p.head) {
    if (p.head.minCm >= p.head.maxCm) errors.push('head: 최소값이 최대값 이상입니다');
    if (p.head.maxCm >= p.physicalCm.h) errors.push('head: 머리 길이가 사진 높이 이상입니다');
  }
  if (p.verifiedAt !== null) {
    if (p.sources.length === 0) errors.push('sources: 공식 출처가 없습니다');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedAt)) errors.push('verifiedAt: YYYY-MM-DD 형식이 아닙니다');
  }
  if (p.checklist.length === 0) errors.push('checklist: 비어 있습니다');
  return errors;
}

export function presetSummary(p: PhotoPreset): string {
  const px = outputPixels(p);
  const pxText = `${px.w}×${px.h}px${p.pixels.mode === 'range' ? ' 권장' : ''}`;
  const { min, max } = p.fileSizeKB;
  const sizeText = min !== undefined ? `${min}~${max}KB` : `${max}KB 이하`;
  return `${p.physicalCm.w}×${p.physicalCm.h}cm · ${pxText} · ${sizeText}`;
}

export function downloadFileName(p: PhotoPreset, widthPx: number, heightPx: number): string {
  return `${p.name}사진_${widthPx}x${heightPx}.jpg`;
}
