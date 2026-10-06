import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { PresetPhotoTool } from '@/components/PresetPhotoTool';
import { SpecDiagram } from '@/components/SpecDiagram';
import { SAMPLE_PHOTO } from '@/data/sample-photo';
import sampleResults from '@/data/sample-results.json';
import { getPreset, outputPixels, presetSummary, publishedPresets } from '@/lib/presets';

type Params = { preset: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return publishedPresets().map((p) => ({ preset: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const preset = getPreset((await params).preset);
  if (!preset) return {};
  return {
    title: `${preset.name}사진 규격 맞추기 · ${presetSummary(preset)}`,
    description: `${preset.org} ${preset.name} 사진 규격(${presetSummary(preset)})에 맞춰 브라우저에서 바로 자르고 용량을 맞춥니다. 사진은 서버로 전송되지 않습니다.`,
    alternates: { canonical: `/photo/${preset.slug}/` },
  };
}

export default async function PresetPage({ params }: { params: Promise<Params> }) {
  const preset = getPreset((await params).preset);
  if (!preset) notFound();

  const results = sampleResults.results as Record<string, { bytes: number }>;
  const sample = results[preset.slug];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preset.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const px = outputPixels(preset);
  const pxRow = `${px.w}×${px.h}px${preset.pixels.mode === 'range' ? ' 권장' : ''}`;
  const { min, max } = preset.fileSizeKB;
  const sizeRow = min !== undefined ? `${min}~${max}KB` : `${max}KB 이하`;

  const rows: [string, string][] = [
    ['사진 크기', `${preset.physicalCm.w} × ${preset.physicalCm.h}cm`],
    ['픽셀', pxRow],
    ['용량', sizeRow],
    ['파일 형식', 'JPG'],
    ...(preset.head ? ([['머리 길이 (정수리~턱)', `${preset.head.minCm} ~ ${preset.head.maxCm}cm`]] as [string, string][]) : []),
    ...(preset.background ? ([['배경', preset.background === 'white' ? '흰색' : '단색']] as [string, string][]) : []),
  ];

  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{preset.name}사진 규격 맞추기</h1>
        <p className="mt-2 text-slate-600">{preset.org} · {presetSummary(preset)}</p>
      </header>

      {sample && (
        <figure className="rounded-2xl border bg-white p-4">
          <SpecDiagram preset={preset} sample={SAMPLE_PHOTO} originalBytes={sampleResults.original.bytes} resultBytes={sample.bytes} />
        </figure>
      )}

      <PresetPhotoTool preset={preset} />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL} />

      <section>
        <h2 className="text-lg font-semibold">{preset.name}사진 규격</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse bg-white text-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b">
                  <th className="w-40 bg-slate-50 p-2 text-left font-medium">{k}</th>
                  <td className="p-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          출처:{' '}
          {preset.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ', '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a>
            </span>
          ))}{' '}
          · 확인일 {preset.verifiedAt}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">제출 전 체크리스트</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {preset.checklist.map((c) => <li key={c}>☐ {c}</li>)}
        </ul>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT} />

      <section>
        <h2 className="text-lg font-semibold">자주 묻는 질문</h2>
        <dl className="mt-3 space-y-4 text-sm">
          {preset.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">Q. {f.q}</dt>
              <dd className="mt-1 text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </article>
  );
}
