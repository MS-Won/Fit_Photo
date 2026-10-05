import { canvasToBlob } from './canvas';
import type { Rect } from './crop-math';
import { fitJpegToSize, type FitStatus } from './fit-size';
import { JFIF_APP0_BYTES, setJpegDpi } from './jfif-dpi';
import { byteLimits, checkResult, type TargetSpec } from './target';

export type ExportResult = {
  blob: Blob;
  widthPx: number;
  heightPx: number;
  bytes: number;
  quality: number;
  status: FitStatus;
  checks: ReturnType<typeof checkResult>;
  upscaled: boolean;
};

/**
 * Returns byte limits adjusted for DPI header size.
 * When target.dpi is set, reserves JFIF_APP0_BYTES for the DPI header.
 */
export function encodeLimits(target: TargetSpec): { minBytes?: number; maxBytes: number } {
  const limits = byteLimits(target);
  if (target.dpi) {
    return {
      minBytes: limits.minBytes,
      maxBytes: limits.maxBytes - JFIF_APP0_BYTES,
    };
  }
  return limits;
}

export async function exportPhoto(source: HTMLCanvasElement, crop: Rect, target: TargetSpec): Promise<ExportResult> {
  const canvas = document.createElement('canvas');
  canvas.width = target.widthPx;
  canvas.height = target.heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  const fit = await fitJpegToSize((q) => canvasToBlob(canvas, 'image/jpeg', q), encodeLimits(target));
  let blob = fit.result;
  if (target.dpi) {
    const arrayBuf = await blob.arrayBuffer();
    const bytes: Uint8Array = new Uint8Array(arrayBuf);
    const dpiBytes = setJpegDpi(bytes, target.dpi);
    const freshBytes = new Uint8Array(dpiBytes);
    blob = new Blob([freshBytes], { type: 'image/jpeg' });
  }
  const result = { widthPx: canvas.width, heightPx: canvas.height, bytes: blob.size };
  return {
    blob,
    ...result,
    quality: fit.quality,
    status: fit.status,
    checks: checkResult(target, result),
    upscaled: crop.width < target.widthPx,
  };
}
