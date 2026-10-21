import type { SiteContent } from './schema';
import { absoluteUrl, fullName } from './site';
import { plain } from './markup';

/** schema.org graph (WebSite + ProfilePage + Person) built from the same JSON that renders the page. */
export function personJsonLd(c: SiteContent, origin: string) {
  const name = fullName(c);
  const current = c.experience[0];
  const photo = c.profile.photoFallback || c.profile.photo;
  const email = c.contacts.find((x) => x.type === 'email');
  const phone = c.contacts.find((x) => x.type === 'phone');

  const skills = new Set<string>([...c.profile.core, ...c.sections.skills.groups.flatMap((g) => g.items)]);
  const sameAs = c.contacts.filter((x) => x.type !== 'email' && x.type !== 'phone' && /^https?:/i.test(x.href)).map((x) => x.href);

  const personId = `${origin}/#person`;
  const siteId = `${origin}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': siteId,
        url: `${origin}/`,
        name: c.site.name,
        inLanguage: c.site.language,
        publisher: { '@id': personId },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${origin}/#profile`,
        url: `${origin}/`,
        name: plain(c.seo.title),
        isPartOf: { '@id': siteId },
        mainEntity: { '@id': personId },
        dateModified: c.updatedAt,
        inLanguage: c.site.language,
      },
      {
        '@type': 'Person',
        '@id': personId,
        name,
        givenName: c.profile.firstName,
        familyName: c.profile.lastName,
        jobTitle: c.profile.title,
        description: c.profile.summary,
        url: `${origin}/`,
        ...(photo ? { image: absoluteUrl(origin, photo) } : {}),
        ...(email ? { email: (email.copy || email.value) } : {}),
        ...(phone ? { telephone: (phone.copy || phone.value) } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(current ? { worksFor: { '@type': 'Organization', name: current.company, ...(current.companyUrl ? { url: current.companyUrl } : {}) } } : {}),
        ...(c.education.length
          ? { alumniOf: c.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.school, ...(e.schoolUrl ? { url: e.schoolUrl } : {}) })) }
          : {}),
        knowsAbout: [...skills],
        ...(c.languages.length ? { knowsLanguage: c.languages.map((l) => l.name) } : {}),
      },
    ],
  };
}
