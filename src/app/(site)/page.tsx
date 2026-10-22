import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import { absoluteUrl, fullName, initials, siteOrigin } from '@/lib/site';
import { plain } from '@/lib/markup';
import { personJsonLd } from '@/lib/jsonld';
import { Boot } from '@/components/Boot';
import { Nav } from '@/components/Nav';
import { Cursor } from '@/components/Cursor';
import { Hero } from '@/sections/Hero';
import { About } from '@/sections/About';
import { Skills } from '@/sections/Skills';
import { Experience } from '@/sections/Experience';
import { Work } from '@/sections/Work';
import { Education } from '@/sections/Education';
import { Links } from '@/sections/Links';
import { Contact } from '@/sections/Contact';
import { Footer } from '@/sections/Footer';

// Statically generated; the admin triggers an on-demand rebuild on every save (revalidatePath).
// The hourly refresh just keeps date-derived text ("1 yr 2 mos", © year) from going stale.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const origin = siteOrigin(c);
  const image = absoluteUrl(origin, c.seo.ogImage || '/og');
  const title = plain(c.seo.title);

  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description: c.seo.description,
    keywords: c.seo.keywords,
    applicationName: c.site.name,
    authors: [{ name: fullName(c), url: origin }],
    creator: fullName(c),
    alternates: { canonical: '/' },
    robots: c.seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      type: 'profile',
      url: '/',
      siteName: c.site.name,
      title,
      description: c.seo.description,
      firstName: c.profile.firstName,
      lastName: c.profile.lastName,
      images: [{ url: image, alt: c.seo.ogImageAlt || title, ...(c.seo.ogImage ? {} : { width: 1200, height: 630 }) }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: c.seo.description,
      images: [image],
      ...(c.seo.twitterHandle ? { creator: c.seo.twitterHandle.startsWith('@') ? c.seo.twitterHandle : `@${c.seo.twitterHandle}` } : {}),
    },
  };
}

export default async function HomePage() {
  const content = await getContent();
  const { profile, sections } = content;
  const origin = siteOrigin(content);

  const navItems = [
    { id: 'about', label: sections.about.tag },
    { id: 'skills', label: sections.skills.tag },
    { id: 'experience', label: sections.experience.tag },
    { id: 'work', label: sections.work.tag },
    ...(content.links.some((l) => l.href) ? [{ id: 'links', label: sections.links.tag }] : []),
    { id: 'contact', label: sections.contact.tag },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // `<` is escaped so editor-supplied text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(content, origin)).replace(/</g, '\\u003c') }}
      />
      <Boot name={fullName(content)} photo={profile.photo || profile.photoFallback} />
      <Nav
        fullName={fullName(content)}
        brandMark={initials(content)}
        items={navItems}
        resume={{ href: profile.resumeFile, fileName: profile.resumeFileName }}
      />
      <main id="main">
        <Hero content={content} />
        <About content={content} />
        <Skills content={content} />
        <Experience content={content} />
        <Work content={content} />
        <Education content={content} />
        <Links content={content} />
        <Contact content={content} />
      </main>
      <Footer content={content} />
      <Cursor />
    </>
  );
}
