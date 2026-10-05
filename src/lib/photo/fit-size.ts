export type FitStatus = 'ok' | 'below-min' | 'above-max';

const MIN_QUALITY = 0.3;
const MAX_QUALITY = 1;
const ITERATIONS = 8;

export async function fitJpegToSize<T extends { size: number }>(
  encode: (quality: number) => Promise<T>,
  limits: { minBytes?: number; maxBytes: number },
): Promise<{ result: T; quality: number; status: FitStatus }> {
  const statusOf = (size: number): FitStatus =>
    limits.minBytes !== undefined && size < limits.minBytes ? 'below-min' : 'ok';

  const top = await encode(MAX_QUALITY);
  if (top.size <= limits.maxBytes) return { result: top, quality: MAX_QUALITY, status: statusOf(top.size) };

  const bottom = await encode(MIN_QUALITY);
  if (bottom.size > limits.maxBytes) return { result: bottom, quality: MIN_QUALITY, status: 'above-max' };

  let lo = MIN_QUALITY;
  let hi = MAX_QUALITY;
  let best = bottom;
  let bestQuality = MIN_QUALITY;
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const r = await encode(mid);
    if (r.size <= limits.maxBytes) {
      best = r;
      bestQuality = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { result: best, quality: bestQuality, status: statusOf(best.size) };
}
