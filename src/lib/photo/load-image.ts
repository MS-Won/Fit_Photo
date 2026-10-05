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

export function formatOf(file: FileLike): string {
  const dotIndex = file.name.lastIndexOf('.');
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex + 1).toUpperCase() : '';
  if (ext) return ext === 'JPEG' ? 'JPG' : ext;
  const subtype = file.type.replace('image/', '').toUpperCase();
  return subtype === 'JPEG' ? 'JPG' : subtype;
}

export function bitmapOptions(naturalW: number, naturalH: number, maxPixels = MAX_SOURCE_PIXELS): ImageBitmapOptions {
  if (naturalW * naturalH <= maxPixels) return { imageOrientation: 'from-image' };
  const { width, height } = downscaleSize(naturalW, naturalH, maxPixels);
  return { imageOrientation: 'from-image', resizeWidth: width, resizeHeight: height, resizeQuality: 'high' };
}

function readNaturalSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const size = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(size);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
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

  let naturalWidth: number;
  let naturalHeight: number;
  try {
    const size = await readNaturalSize(blob);
    naturalWidth = size.width;
    naturalHeight = size.height;
  } catch {
    throw new LoadImageError('decode-failed');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, bitmapOptions(naturalWidth, naturalHeight));
  } catch {
    throw new LoadImageError('decode-failed');
  }

  try {
    const { width, height } = downscaleSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new LoadImageError('decode-failed');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const original = { name: file.name, bytes: file.size, format: formatOf(file), width: naturalWidth, height: naturalHeight };

    const url = URL.createObjectURL(await canvasToBlob(canvas, 'image/jpeg', 0.92));
    return { canvas, url, width, height, original };
  } finally {
    bitmap.close();
  }
}
