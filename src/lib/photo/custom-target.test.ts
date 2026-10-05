import { describe, it, expect } from 'vitest';
import { parseCustomTarget } from './custom-target';

describe('parseCustomTarget', () => {
  it('parses valid input', () => {
    expect(parseCustomTarget({ widthPx: '300', heightPx: '400', maxKB: '200' })).toEqual({
      ok: true,
      target: { widthPx: 300, heightPx: 400, maxKB: 200 },
    });
  });
  it('rejects out-of-range or non-numeric input', () => {
    expect(parseCustomTarget({ widthPx: '10', heightPx: '400', maxKB: '200' }).ok).toBe(false);
    expect(parseCustomTarget({ widthPx: '300', heightPx: 'abc', maxKB: '200' }).ok).toBe(false);
    expect(parseCustomTarget({ widthPx: '300', heightPx: '400', maxKB: '5' }).ok).toBe(false);
  });
});
