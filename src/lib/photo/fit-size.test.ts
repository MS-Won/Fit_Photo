import { describe, it, expect } from 'vitest';
import { fitJpegToSize } from './fit-size';

// 품질 q → q × 1MB 크기를 내는 가짜 인코더
const fakeEncode = async (q: number) => ({ size: Math.round(q * 1_000_000), q });

describe('fitJpegToSize', () => {
  it('returns max quality when it already fits', async () => {
    const r = await fitJpegToSize(fakeEncode, { maxBytes: 2_000_000 });
    expect(r).toMatchObject({ quality: 1, status: 'ok' });
  });

  it('finds the highest quality under the max', async () => {
    const r = await fitJpegToSize(fakeEncode, { maxBytes: 500_000 });
    expect(r.status).toBe('ok');
    expect(r.result.size).toBeLessThanOrEqual(500_000);
    expect(r.quality).toBeGreaterThan(0.49);
  });

  it('reports below-min when even max quality is too small', async () => {
    const r = await fitJpegToSize(fakeEncode, { minBytes: 1_500_000, maxBytes: 2_000_000 });
    expect(r.status).toBe('below-min');
  });

  it('reports above-max when even the lowest quality is too big', async () => {
    const r = await fitJpegToSize(fakeEncode, { maxBytes: 100_000 });
    expect(r).toMatchObject({ quality: 0.3, status: 'above-max' });
  });
});
