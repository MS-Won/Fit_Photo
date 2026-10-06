import type { Metadata } from 'next';
import Link from 'next/link';
import { CustomPhotoTool } from '@/components/CustomPhotoTool';
import { presetSummary, publishedPresets } from '@/lib/presets';

export const metadata: Metadata = {
  title: '증명사진 규격 맞추기 (기관별 크기·용량)',
  description: '여권, 운전면허, Q-net, 토익 사진 규격을 골라 바로 맞추세요.',
  alternates: { canonical: '/photo/' },
};

export default function PhotoIndex() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold">증명사진 규격 맞추기</h1>
        <p className="mt-2 text-slate-600">제출할 곳을 고르세요. 규격이 미리 설정된 도구가 열립니다.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {publishedPresets().map((p) => (
            <li key={p.slug}>
              <Link href={`/photo/${p.slug}/`} className="block rounded-xl border bg-white p-4 hover:border-blue-500">
                <span className="font-semibold">{p.name} 사진</span>
                <span className="mt-1 block text-sm text-slate-600">{presetSummary(p)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">원하는 크기로 직접 입력</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">목록에 없는 기관은 안내된 픽셀과 용량을 입력하세요.</p>
        <CustomPhotoTool />
      </section>
    </div>
  );
}
