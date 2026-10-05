import type { TargetSpec } from './target';

const PX_RANGE = [50, 3000] as const;
const KB_RANGE = [10, 5000] as const;

function toInt(v: string): number | null {
  return /^\d+$/.test(v.trim()) ? Number(v.trim()) : null;
}

export function parseCustomTarget(input: {
  widthPx: string;
  heightPx: string;
  maxKB: string;
}): { ok: true; target: TargetSpec } | { ok: false; error: string } {
  const w = toInt(input.widthPx);
  const h = toInt(input.heightPx);
  const kb = toInt(input.maxKB);
  if (w === null || h === null || kb === null) return { ok: false, error: '숫자만 입력해 주세요.' };
  if (w < PX_RANGE[0] || w > PX_RANGE[1] || h < PX_RANGE[0] || h > PX_RANGE[1]) {
    return { ok: false, error: `가로·세로는 ${PX_RANGE[0]}~${PX_RANGE[1]}픽셀로 입력해 주세요.` };
  }
  if (kb < KB_RANGE[0] || kb > KB_RANGE[1]) {
    return { ok: false, error: `최대 용량은 ${KB_RANGE[0]}~${KB_RANGE[1]}KB로 입력해 주세요.` };
  }
  return { ok: true, target: { widthPx: w, heightPx: h, maxKB: kb } };
}
