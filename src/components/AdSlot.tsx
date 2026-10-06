'use client';

import { useEffect } from 'react';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSlot({ slot }: { slot: string | undefined }) {
  useEffect(() => {
    if (!CLIENT || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등 — 무시
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;
  return (
    <ins
      className="adsbygoogle my-6 block"
      style={{ display: 'block' }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
