import type { Metadata } from 'next';
import Link from 'next/link';
import { Analytics } from '@/components/Analytics';
import { siteConfig } from '@/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold">{siteConfig.name}</Link>
            <Link href="/photo/" className="text-sm text-slate-600 hover:text-slate-900">증명사진</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-xs text-slate-500">
          <p>모든 사진은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.</p>
          <p className="mt-1">
            규격은 각 기관 공식 안내를 기준으로 하며, 제출 전 기관 안내를 한 번 더 확인해 주세요. ·{' '}
            <Link href="/privacy/" className="underline">개인정보처리방침</Link>
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
