import type { GuideLines } from '@/lib/photo/crop-math';

type Props = { width: number; height: number; guides: GuideLines | null };

export function GuideOverlay({ width, height, guides }: Props) {
  const band = (key: 'crown' | 'chin', [a, b]: [number, number], label: string) => (
    <g>
      <rect data-guide={key} x={0} y={a * height} width={width} height={(b - a) * height} fill="rgba(37,99,235,0.25)" />
      <text x={6} y={a * height - 4} fontSize={12} fill="#1d4ed8" fontWeight={600}>
        {label}
      </text>
    </g>
  );
  return (
    <svg width={width} height={height} className="pointer-events-none absolute inset-0 m-auto" aria-hidden>
      <line data-guide="center" x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="rgba(255,255,255,0.8)" strokeDasharray="4 4" />
      {guides && band('crown', guides.crownBand, '정수리')}
      {guides && band('chin', guides.chinBand, '턱')}
      {!guides && (
        <text x={width / 2} y={16} fontSize={12} fill="#ffffff" textAnchor="middle">
          얼굴을 중앙에 맞춰 주세요
        </text>
      )}
    </svg>
  );
}
