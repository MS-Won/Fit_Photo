import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = { title: '개인정보처리방침', alternates: { canonical: '/privacy/' } };

export default function Privacy() {
  return (
    <article className="prose max-w-none space-y-4 text-sm">
      <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      <p>{siteConfig.name}(이하 &quot;사이트&quot;)는 이용자의 사진을 수집하거나 저장하지 않습니다. 사진 자르기, 크기 변경, 용량 조정은 모두 이용자의 브라우저 안에서 처리되며 서버로 전송되지 않습니다.</p>
      <h2 className="text-lg font-semibold">수집하는 정보</h2>
      <p>사이트는 서비스 개선을 위해 Google Analytics로 방문 페이지, 기기·브라우저 종류, 대략적인 지역 등 익명 통계를 수집합니다. 이 과정에서 쿠키가 사용될 수 있습니다.</p>
      <h2 className="text-lg font-semibold">광고</h2>
      <p>사이트는 Google AdSense 광고를 게재할 수 있습니다. Google은 쿠키를 사용해 이용자의 관심사에 맞는 광고를 표시할 수 있으며, 이용자는 Google 광고 설정(adssettings.google.com)에서 맞춤 광고를 끌 수 있습니다.</p>
      <h2 className="text-lg font-semibold">문의</h2>
      <p>개인정보 관련 문의는 사이트 운영자에게 연락해 주세요.</p>
      <p className="text-xs text-slate-500">시행일: 2026-10-01</p>
    </article>
  );
}
