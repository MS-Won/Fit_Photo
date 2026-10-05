import { canvasToBlob } from './canvas';

export const MAX_SOURCE_PIXELS = 40_000_000;

type FileLike = { name: string; type: string };

export class LoadImageError extends Error {
  constructor(public code: 'unsupported' | 'heic-failed' | 'decode-failed') {
    super(code);
  }
}

export type LoadedImage = {
  canvas: HTMLCanvasElement;
  url: string;
  width: number;
  height: number;
  original: { name: string; bytes: number; format: string; width: number; height: number };
};

export function isHeic(file: FileLike): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

export function isSupportedImage(file: FileLike): boolean {
  return isHeic(file) || /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function downscaleSize(w: number, h: number, maxPixels = MAX_SOURCE_PIXELS): { width: number; height: number } {
  if (w * h <= maxPixels) return { width: w, height: h };
  const s = Math.sqrt(maxPixels / (w * h));
  return { width: Math.floor(w * s), height: Math.floor(h * s) };
}

function formatOf(file: FileLike): string {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
  return ext === 'JPEG' ? 'JPG' : ext || file.type.replace('image/', '').toUpperCase();
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!isSupportedImage(file)) throw new LoadImageError('unsupported');

  let blob: Blob = file;
  if (isHeic(file)) {
    try {
      const { default: heic2any } = await import('heic2any');
      const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
      blob = Array.isArray(out) ? out[0] : out;
    } catch {
      throw new LoadImageError('heic-failed');
    }
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new LoadImageError('decode-failed');
  }

  const { width, height } = downscaleSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new LoadImageError('decode-failed');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const original = { name: file.name, bytes: file.size, format: formatOf(file), width: bitmap.width, height: bitmap.height };
  bitmap.close();

  const url = URL.createObjectURL(await canvasToBlob(canvas, 'image/jpeg', 0.92));
  return { canvas, url, width, height, original };
}
