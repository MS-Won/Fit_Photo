import type { PhotoPreset } from '@/lib/presets';
import type { SamplePhoto } from '@/data/sample-photo';
import { clampRectToImage, computeCropRect, headFractionRange } from '@/lib/photo/crop-math';
import { formatBytes, presetToTarget } from '@/lib/photo/target';

type Props = { preset: PhotoPreset; sample: SamplePhoto; originalBytes: number; resultBytes: number };

const W = 1000;
const TOP = 60;
const PANEL_H = 440;
const BEFORE_MAX_W = 330;
const ACCENT = '#2563eb';
const DIM = '#e11d48';
const INK = '#334155';

export function SpecDiagram({ preset, sample, originalBytes, resultBytes }: Props) {
  const target = presetToTarget(preset);
  const aspect = target.widthPx / target.heightPx;
  const crop = clampRectToImage(computeCropRect(sample.face, aspect, preset), sample.widthPx, sample.heightPx);

  // BEFORE
  const bs = Math.min(PANEL_H / sample.heightPx, BEFORE_MAX_W / sample.widthPx);
  const bx = 20;
  const bw = sample.widthPx * bs;
  const bh = sample.heightPx * bs;
  const c = { x: bx + crop.x * bs, y: TOP + crop.y * bs, w: crop.width * bs, h: crop.height * bs };

  // AFTER
  const aw = PANEL_H * aspect;
  const ax = W - 110 - aw;
  const toAfterY = (sy: number) => TOP + ((sy - crop.y) / crop.height) * PANEL_H;
  const crownY = toAfterY(sample.face.crownY);
  const chinY = toAfterY(sample.face.chinY);
  const eyeY = toAfterY(sample.face.eyeY);
  const headCm = ((sample.face.chinY - sample.face.crownY) / crop.height) * preset.physicalCm.h;
  const [fMin, fMax] = headFractionRange(preset);

  const reduction = Math.round((1 - resultBytes / originalBytes) * 100);
  const sizeLine = `${formatBytes(originalBytes)} → ${formatBytes(resultBytes)}${reduction > 0 ? ` (−${reduction}%)` : ''} · ${sample.format} → JPG`;
  const label = `${preset.name} 사진 규격 도해: ${target.widthPx}×${target.heightPx}px, ${preset.physicalCm.w}×${preset.physicalCm.h}cm, ${sizeLine}`;

  return (
    <svg viewBox={`0 0 ${W} 600`} role="img" aria-label={label} className="h-auto w-full" fontFamily="inherit">
      <title>{label}</title>

      {/* BEFORE */}
      <text x={bx} y={TOP - 24} fontSize={16} fontWeight={700} fill={INK}>BEFORE · 원본</text>
      <image href={sample.src} x={bx} y={TOP} width={bw} height={bh} preserveAspectRatio="none" />
      <path
        d={`M${bx} ${TOP}h${bw}v${bh}h${-bw}Z M${c.x} ${c.y}v${c.h}h${c.w}v${-c.h}Z`}
        fill="rgba(15,23,42,0.45)" fillRule="evenodd"
      />
      <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="6 4" />
      <text x={bx} y={TOP + bh + 24} fontSize={14} fill={INK}>{sample.widthPx}×{sample.heightPx}px · {sample.format}</text>
      <text x={bx} y={TOP + bh + 44} fontSize={12} fill="#64748b">점선 = 잘라낼 영역</text>

      {/* 화살표 */}
      <g fill={ACCENT}>
        <rect x={bx + bw + 30} y={TOP + PANEL_H / 2 - 3} width={ax - bx - bw - 80} height={6} />
        <path d={`M${ax - 40} ${TOP + PANEL_H / 2 - 14}l22 14l-22 14Z`} />
      </g>

      {/* AFTER */}
      <text x={ax} y={TOP - 34} fontSize={16} fontWeight={700} fill={INK}>AFTER · {preset.name}</text>
      <svg x={ax} y={TOP} width={aw} height={PANEL_H} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} preserveAspectRatio="none">
        <image href={sample.src} width={sample.widthPx} height={sample.heightPx} />
      </svg>
      <rect x={ax} y={TOP} width={aw} height={PANEL_H} fill="none" stroke={INK} />

      {/* 가로 치수 */}
      <line x1={ax} y1={TOP - 12} x2={ax + aw} y2={TOP - 12} stroke={DIM} />
      <line x1={ax} y1={TOP - 18} x2={ax} y2={TOP - 6} stroke={DIM} />
      <line x1={ax + aw} y1={TOP - 18} x2={ax + aw} y2={TOP - 6} stroke={DIM} />
      <text x={ax + aw / 2} y={TOP - 18} fontSize={13} fill={DIM} textAnchor="middle">
        {`${preset.physicalCm.w}cm · ${target.widthPx}px`}
      </text>

      {/* 세로 치수 */}
      <line x1={ax + aw + 14} y1={TOP} x2={ax + aw + 14} y2={TOP + PANEL_H} stroke={DIM} />
      <line x1={ax + aw + 8} y1={TOP} x2={ax + aw + 20} y2={TOP} stroke={DIM} />
      <line x1={ax + aw + 8} y1={TOP + PANEL_H} x2={ax + aw + 20} y2={TOP + PANEL_H} stroke={DIM} />
      <text
        x={ax + aw + 30} y={TOP + PANEL_H / 2} fontSize={13} fill={DIM} textAnchor="middle"
        transform={`rotate(90 ${ax + aw + 30} ${TOP + PANEL_H / 2})`}
      >
        {`${preset.physicalCm.h}cm · ${target.heightPx}px`}
      </text>

      {/* 중앙선 */}
      <line x1={ax + aw / 2} y1={TOP} x2={ax + aw / 2} y2={TOP + PANEL_H} stroke={ACCENT} strokeDasharray="4 4" opacity={0.7} />

      {preset.head ? (
        <g>
          <line x1={ax} y1={crownY} x2={ax + aw} y2={crownY} stroke={ACCENT} strokeDasharray="6 4" />
          <line x1={ax} y1={chinY} x2={ax + aw} y2={chinY} stroke={ACCENT} strokeDasharray="6 4" />
          <line x1={ax} y1={eyeY} x2={ax + aw} y2={eyeY} stroke={ACCENT} strokeDasharray="2 4" opacity={0.6} />
          <line x1={ax - 14} y1={crownY} x2={ax - 14} y2={chinY} stroke={ACCENT} strokeWidth={2} />
          <text
            x={ax - 24} y={(crownY + chinY) / 2} fontSize={13} fill={ACCENT} textAnchor="middle"
            transform={`rotate(-90 ${ax - 24} ${(crownY + chinY) / 2})`}
          >
            {`머리 ${headCm.toFixed(1)}cm`}
          </text>
          <text x={ax} y={TOP + PANEL_H + 24} fontSize={13} fill={ACCENT}>
            {`허용 ${preset.head.minCm}~${preset.head.maxCm}cm (높이의 ${Math.round(fMin * 100)}~${Math.round(fMax * 100)}%)`}
          </text>
        </g>
      ) : (
        <text x={ax} y={TOP + PANEL_H + 24} fontSize={13} fill={ACCENT}>얼굴 중앙 배치</text>
      )}

      {/* 용량 변화 */}
      <text x={W / 2} y={TOP + PANEL_H + 72} fontSize={18} fontWeight={700} fill={INK} textAnchor="middle">{sizeLine}</text>
      <text x={W - 20} y={590} fontSize={11} fill="#94a3b8" textAnchor="end">예시 인물(가상)</text>
    </svg>
  );
}
