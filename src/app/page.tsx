import Link from 'next/link';
import { publishedPresets } from '@/lib/presets';

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">제출 서류 사진, 규격에 딱 맞게</h1>
        <p className="mt-2 text-slate-600">기관별 픽셀·용량·머리 비율을 그대로 반영합니다. 사진은 서버로 전송되지 않습니다.</p>
      </section>
      <Link href="/photo/" className="block rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500">
        <h2 className="text-lg font-semibold">증명사진 규격 맞춤기</h2>
        <p className="mt-1 text-sm text-slate-600">{publishedPresets().map((p) => p.name).join(' · ')}</p>
      </Link>
    </div>
  );
}
