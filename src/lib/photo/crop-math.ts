import type { PhotoPreset } from '../presets';

export type Rect = { x: number; y: number; width: number; height: number };
export type FacePoints = { crownY: number; chinY: number; eyeY: number; centerX: number };
export type GuideLines = { crownBand: [number, number]; chinBand: [number, number] };

/** 머리를 뺀 남는 세로 공간 중 정수리 위에 두는 비율 (공식 규정이 없어 쓰는 권장값) */
export const CROWN_MARGIN_SHARE = 0.4;
const DEFAULT_HEAD_FRACTION: [number, number] = [0.65, 0.75];

export function headFractionRange(p: PhotoPreset): [number, number] {
  if (!p.head) return DEFAULT_HEAD_FRACTION;
  return [p.head.minCm / p.physicalCm.h, p.head.maxCm / p.physicalCm.h];
}

function crownFraction(headFraction: number): number {
  return CROWN_MARGIN_SHARE * (1 - headFraction);
}

export function getGuideLines(p: PhotoPreset): GuideLines | null {
  if (!p.head) return null;
  const [min, max] = headFractionRange(p);
  return {
    crownBand: [crownFraction(max), crownFraction(min)],
    chinBand: [crownFraction(min) + min, crownFraction(max) + max],
  };
}

export function computeCropRect(face: FacePoints, aspect: number, p: PhotoPreset): Rect {
  const [min, max] = headFractionRange(p);
  const headFraction = (min + max) / 2;
  const height = (face.chinY - face.crownY) / headFraction;
  const width = height * aspect;
  return {
    x: face.centerX - width / 2,
    y: face.crownY - crownFraction(headFraction) * height,
    width,
    height,
  };
}

export function clampRectToImage(r: Rect, imageW: number, imageH: number): Rect {
  const scale = Math.min(1, imageW / r.width, imageH / r.height);
  const width = Math.round(r.width * scale);
  const height = Math.round(r.height * scale);
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const x = Math.min(Math.max(Math.round(cx - width / 2), 0), imageW - width);
  const y = Math.min(Math.max(Math.round(cy - height / 2), 0), imageH - height);
  return { x, y, width, height };
}
