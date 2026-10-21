import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
import { absoluteUrl, siteOrigin } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  if (c.seo.noindex) return [];
  const origin = siteOrigin(c);
  const photo = c.profile.photoFallback || c.profile.photo;
  return [
    {
      url: `${origin}/`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly',
      priority: 1,
      ...(photo ? { images: [absoluteUrl(origin, photo)] } : {}),
    },
  ];
}
