import { z } from 'zod';
import { CONTACT_TYPES, ICON_NAMES } from './constants';

export type { ContactType, IconName } from './constants';

/**
 * The shape of content/site.json — the single source of truth for the whole site.
 * The same schema validates the file at build/render time AND every save from /admin,
 * so a bad edit can never reach the public pages.
 */

const short = (max = 160) => z.string().trim().max(max);
const long = (max = 2000) => z.string().trim().max(max);

/** `/media/<file>` (an uploaded file) or an https:// URL. Empty = not set. */
export const mediaRef = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === '' || /^\/media\/[a-z0-9][a-z0-9._-]*$/i.test(v) || /^https:\/\/[^\s]+$/i.test(v),
    'Pick an uploaded file (/media/…) or use an https:// URL',
  );

/** Only link schemes we are happy to render. Blocks `javascript:` and friends. */
const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v), 'Must start with https://, http://, mailto:, tel:, / or #');
const optionalHref = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v), 'Must start with https://, http://, mailto:, tel:, / or #');

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use the format YYYY-MM');
const optionalMonth = z.string().refine((v) => v === '' || /^\d{4}-(0[1-9]|1[0-2])$/.test(v), 'Use the format YYYY-MM, or leave empty for “present”');

const list = <T extends z.ZodType>(item: T, max = 60) => z.array(item).max(max);

const sectionHead = z.object({
  /** Small label above the heading — also the nav link text. */
  tag: short(40),
  /** Heading. Wrap words in *asterisks* to give them the accent style. */
  title: short(160),
});

export const contentSchema = z.object({
  site: z.object({
    /** Public origin, e.g. https://saman.dev — used for canonical URLs, sitemap and social cards. */
    url: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === '' || /^https?:\/\/[^\s/]+\/?$/i.test(v), 'Use an origin like https://example.com (no path)'),
    name: short(80),
    /** BCP-47 language tag for <html lang>. */
    language: z.string().trim().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'Use a language tag such as en or en-US'),
  }),

  seo: z.object({
    title: short(80),
    description: short(320),
    keywords: list(short(60), 40),
    ogImage: mediaRef,
    ogImageAlt: short(200),
    twitterHandle: short(40),
    /** Tells search engines not to index the site (also switches robots.txt to Disallow). */
    noindex: z.boolean(),
  }),

  profile: z.object({
    firstName: short(60),
    lastName: short(60),
    title: short(100),
    yearsOfExperience: short(10),
    photo: mediaRef,
    /** Optional second format (e.g. JPG) used as the <img> fallback when `photo` is WebP/AVIF. */
    photoFallback: mediaRef,
    photoAlt: short(200),
    portraitCaption: short(40),
    resumeFile: mediaRef,
    resumeFileName: short(120),
    summary: long(),
    /** Hero paragraph. Wrap phrases in **double asterisks** for bold. */
    heroIntro: long(600),
    core: list(short(40), 8),
  }),

  contacts: list(
    z.object({
      type: z.enum(CONTACT_TYPES),
      label: short(40),
      value: short(120),
      href,
      /** Plain text offered by the copy button. Leave empty to hide the button. */
      copy: short(120),
    }),
    12,
  ),

  sections: z.object({
    about: sectionHead.extend({
      statement: long(400),
      /** Words from the statement shown in the accent style. */
      statementAccent: list(short(40), 20),
      stats: list(
        z.object({
          value: z.number().int().min(0).max(1_000_000_000),
          /** On = ignore `value` and show the total years of experience, calculated from the job dates. */
          auto: z.boolean().default(false),
          suffix: short(6),
          label: short(100),
        }),
        8,
      ),
      strengths: list(z.object({ icon: z.enum(ICON_NAMES), title: short(100), text: long(400) }), 12),
    }),
    skills: sectionHead.extend({
      intro: long(400),
      coreTitle: short(60),
      core: list(z.object({ name: short(60), note: short(60), evidence: long(300) }), 6),
      groups: list(
        z.object({
          id: z.string().regex(/^[a-z0-9-]{1,40}$/, 'Lowercase letters, numbers and dashes only'),
          title: short(80),
          caption: short(200),
          icon: z.enum(ICON_NAMES),
          /** Off = not drawn as a card; the items are still exposed to screen readers and search engines. */
          showCard: z.boolean(),
          wide: z.boolean(),
          items: list(short(80), 40),
        }),
        12,
      ),
    }),
    experience: sectionHead.extend({
      intro: long(400),
      /** Phrases highlighted inside the bullet points. */
      highlightTerms: list(short(80), 60),
    }),
    work: sectionHead.extend({ intro: long(400) }),
    education: sectionHead.extend({ languagesTitle: short(60) }),
    contact: sectionHead.extend({
      text: long(500),
      emailButtonLabel: short(60),
    }),
  }),

  experience: list(
    z.object({
      company: short(100),
      companyUrl: optionalHref,
      /** Company logo shown beside the name. Optional, so older saved files without it stay valid. */
      logo: mediaRef.default(''),
      role: short(100),
      start: month,
      /** Empty = current role. */
      end: optionalMonth,
      location: short(80),
      highlights: list(long(800), 20),
      stack: list(short(60), 20),
    }),
    30,
  ),

  projects: list(
    z.object({
      id: z.string().regex(/^[a-z0-9-]{1,60}$/, 'Lowercase letters, numbers and dashes only'),
      title: short(120),
      context: short(100),
      year: short(40),
      summary: long(800),
      contributions: list(long(300), 12),
      stack: list(short(60), 20),
      metricValue: short(20),
      metricLabel: short(60),
      linkHref: optionalHref,
      linkLabel: short(80),
    }),
    30,
  ),

  education: list(
    z.object({
      degree: short(100),
      field: short(100),
      school: short(120),
      schoolUrl: optionalHref,
    }),
    10,
  ),

  languages: list(z.object({ name: short(60), level: short(80) }), 12),

  /** Set automatically on every save. */
  updatedAt: z.string().max(40),
}).superRefine((data, ctx) => {
  const unique = (ids: string[], path: (i: number) => (string | number)[], what: string) => {
    const seen = new Set<string>();
    ids.forEach((id, i) => {
      if (seen.has(id)) ctx.addIssue({ code: 'custom', path: path(i), message: `Duplicate ${what} “${id}” — each one must be unique` });
      seen.add(id);
    });
  };
  unique(data.projects.map((p) => p.id), (i) => ['projects', i, 'id'], 'project id');
  unique(data.sections.skills.groups.map((g) => g.id), (i) => ['sections', 'skills', 'groups', i, 'id'], 'group id');
});

export type SiteContent = z.infer<typeof contentSchema>;

/** Flatten zod issues into `path → message` lines for the admin UI. */
export function formatIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}
