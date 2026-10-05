const JFIF_ID = [0x4a, 0x46, 0x49, 0x46, 0x00]; // "JFIF\0"

function hasJfifApp0(b: Uint8Array): boolean {
  return b[2] === 0xff && b[3] === 0xe0 && JFIF_ID.every((v, i) => b[6 + i] === v);
}

/** JFIF 밀도 단위를 inch(1)로, X/Y 밀도를 dpi로 기록한 새 배열을 반환한다. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not a JPEG');
  const hi = (dpi >> 8) & 0xff;
  const lo = dpi & 0xff;

  if (hasJfifApp0(bytes)) {
    const out = bytes.slice();
    out.set([1, hi, lo, hi, lo], 13);
    return out;
  }

  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, ...JFIF_ID, 0x01, 0x01, 1, hi, lo, hi, lo, 0x00, 0x00,
  ]);
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}
