import { describe, it, expect } from 'vitest';
import { setJpegDpi } from './jfif-dpi';

const jfif = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

describe('setJpegDpi', () => {
  it('rewrites density in an existing JFIF header', () => {
    const out = setJpegDpi(jfif, 300);
    expect(out.length).toBe(jfif.length);
    expect(Array.from(out.slice(13, 18))).toEqual([1, 0x01, 0x2c, 0x01, 0x2c]);
    expect(jfif[13]).toBe(0); // 원본은 변경하지 않음
  });

  it('inserts a JFIF header when missing', () => {
    const noJfif = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
    const out = setJpegDpi(noJfif, 300);
    expect(out.length).toBe(noJfif.length + 18);
    expect(Array.from(out.slice(0, 4))).toEqual([0xff, 0xd8, 0xff, 0xe0]);
    // 삽입 후: FF D8(0-1) FF E0(2-3) 길이(4-5) JFIF\0(6-10) 버전(11-12) 단위(13) X밀도(14-15) Y밀도(16-17) 썸네일(18-19) 원본 나머지(20~)
    expect(Array.from(out.slice(13, 18))).toEqual([1, 0x01, 0x2c, 0x01, 0x2c]);
    expect(Array.from(out.slice(20))).toEqual([0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
  });

  it('throws on non-JPEG input', () => {
    expect(() => setJpegDpi(new Uint8Array([0x89, 0x50]), 300)).toThrow('Not a JPEG');
  });
});
