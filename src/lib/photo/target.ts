import { outputPixels, type PhotoPreset } from '../presets';

export type TargetSpec = {
  widthPx: number;
  heightPx: number;
  minKB?: number;
  maxKB: number;
  dpi?: number;
};

const MAX_SAFETY_BYTES = 64;

export function presetToTarget(p: PhotoPreset): TargetSpec {
  const px = outputPixels(p);
  return {
    widthPx: px.w,
    heightPx: px.h,
    maxKB: p.fileSizeKB.max,
    minKB: p.fileSizeKB.min,
    dpi: Math.round(px.w / (p.physicalCm.w / 2.54)),
  };
}

export function byteLimits(t: TargetSpec): { minBytes?: number; maxBytes: number } {
  return {
    minBytes: t.minKB !== undefined ? t.minKB * 1024 : undefined,
    maxBytes: t.maxKB * 1000 - MAX_SAFETY_BYTES,
  };
}

export function checkResult(
  t: TargetSpec,
  r: { widthPx: number; heightPx: number; bytes: number },
): { pixels: boolean; size: boolean; belowMin: boolean } {
  const { minBytes, maxBytes } = byteLimits(t);
  const belowMin = minBytes !== undefined && r.bytes < minBytes;
  return {
    pixels: r.widthPx === t.widthPx && r.heightPx === t.heightPx,
    size: !belowMin && r.bytes <= maxBytes,
    belowMin,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}
