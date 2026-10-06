import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { publishedPresets } from '@/lib/presets';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/photo/', ...publishedPresets().map((p) => `/photo/${p.slug}/`), '/privacy/'];
  return pages.map((path) => ({ url: `${siteConfig.url}${path}` }));
}
