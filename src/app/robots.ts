import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
import { siteOrigin } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const c = await getContent();
  const origin = siteOrigin(c);
  if (c.seo.noindex) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    // /media stays crawlable on purpose: it serves the portrait and the résumé.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
