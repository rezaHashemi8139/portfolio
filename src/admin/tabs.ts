import { CONTACT_TYPES, ICON_NAMES } from '@/lib/constants';
import type { FieldDef, Path } from './form';

/* The whole admin form is described here as data. Adding a field to site.json = adding a line below
 * (plus the matching line in src/lib/schema.ts, which is what the server validates against). */

const iconOptions = ICON_NAMES.map((value) => ({ value, label: value.replace(/-/g, ' ') }));
const contactTypes = CONTACT_TYPES.map((value) => ({ value, label: value }));
const rid = () => Math.random().toString(36).slice(2, 6);
const thisMonth = () => new Date().toISOString().slice(0, 7);

const accentHint = 'Wrap words in *asterisks* to give them the accent style, e.g. Where I’ve *Built*.';

const sectionHead: FieldDef[] = [
  { type: 'text', key: 'tag', label: 'Label', hint: 'Small text above the heading. Also used as the menu link text.', max: 40 },
  { type: 'text', key: 'title', label: 'Heading', hint: accentHint, max: 160 },
];

export type Block = { title?: string; hint?: string; base: Path; fields: FieldDef[] };
export type TabDef = { id: string; label: string; blocks: Block[] };

export const TABS: TabDef[] = [
  {
    id: 'general',
    label: 'Site & SEO',
    blocks: [
      {
        title: 'Site',
        base: ['site'],
        fields: [
          {
            type: 'text',
            key: 'url',
            label: 'Public address',
            placeholder: 'https://your-domain.com',
            hint: 'Used for canonical links, the sitemap and social cards. Set it once the site has its final domain. (The SITE_URL environment variable overrides this.)',
          },
          { type: 'text', key: 'name', label: 'Site name' },
          { type: 'text', key: 'language', label: 'Language code', hint: 'For example en, en-US, fa.' },
        ],
      },
      {
        title: 'Search engines & social sharing',
        base: ['seo'],
        fields: [
          { type: 'text', key: 'title', label: 'Page title', hint: 'Shown in Google results and the browser tab. Keep it under ~60 characters.', soft: 60, max: 80 },
          { type: 'textarea', key: 'description', label: 'Meta description', rows: 3, hint: 'Shown under the title in Google results. 120–160 characters works best.', soft: 160, max: 320 },
          { type: 'strings', key: 'keywords', label: 'Keywords', chips: true, hint: 'Optional — search engines mostly ignore them, but some tools use them.' },
          { type: 'media', key: 'ogImage', label: 'Social share image', kind: 'image', hint: 'Shown when the link is shared. 1200×630 px recommended. If empty, a card is generated from your name and title.' },
          { type: 'text', key: 'ogImageAlt', label: 'Share image description' },
          { type: 'text', key: 'twitterHandle', label: 'X / Twitter handle', placeholder: '@username' },
          { type: 'boolean', key: 'noindex', label: 'Hide this site from search engines', hint: 'Adds noindex and blocks crawlers in robots.txt. Leave off for a public portfolio.' },
        ],
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile & hero',
    blocks: [
      {
        base: ['profile'],
        fields: [
          { type: 'text', key: 'firstName', label: 'First name' },
          { type: 'text', key: 'lastName', label: 'Last name' },
          { type: 'text', key: 'title', label: 'Job title' },
          { type: 'text', key: 'yearsOfExperience', label: 'Years of experience', placeholder: '4+' },
          { type: 'media', key: 'photo', label: 'Portrait', kind: 'image', hint: 'About 560×814 px (portrait). WebP or AVIF keeps it light.' },
          { type: 'media', key: 'photoFallback', label: 'Portrait fallback (optional)', kind: 'image', hint: 'A JPG/PNG copy for browsers that cannot show the file above. If you only have one file, leave this empty.' },
          { type: 'text', key: 'photoAlt', label: 'Portrait description (alt text)' },
          { type: 'text', key: 'portraitCaption', label: 'Caption under the portrait' },
          { type: 'media', key: 'resumeFile', label: 'Résumé (PDF)', kind: 'pdf' },
          { type: 'text', key: 'resumeFileName', label: 'Download file name', placeholder: 'Your_Name_Resume.pdf' },
          { type: 'textarea', key: 'summary', label: 'Summary', rows: 4, hint: 'Shown in the About panel and used in structured data for search engines.' },
          { type: 'textarea', key: 'heroIntro', label: 'Hero introduction', rows: 4, hint: 'Wrap phrases in **double asterisks** to make them bold.' },
          { type: 'strings', key: 'core', label: 'Core stack (hero tags)', chips: true },
        ],
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    blocks: [
      {
        base: ['sections', 'about'],
        fields: [
          ...sectionHead,
          { type: 'textarea', key: 'statement', label: 'Statement', rows: 3, hint: 'The large sentence that lights up word by word while scrolling.' },
          { type: 'strings', key: 'statementAccent', label: 'Words to highlight in the statement', chips: true },
          {
            type: 'array',
            key: 'stats',
            label: 'Numbers',
            itemTitle: (s) => `${s.value ?? ''}${s.suffix ?? ''} ${s.label ?? ''}`.trim(),
            blank: () => ({ value: 0, suffix: '+', label: '' }),
            fields: [
              { type: 'number', key: 'value', label: 'Number' },
              { type: 'text', key: 'suffix', label: 'Suffix', placeholder: '+' },
              { type: 'text', key: 'label', label: 'Label' },
            ],
          },
          {
            type: 'array',
            key: 'strengths',
            label: 'Strengths',
            itemTitle: (s) => String(s.title ?? ''),
            blank: () => ({ icon: 'star', title: '', text: '' }),
            fields: [
              { type: 'select', key: 'icon', label: 'Icon', options: iconOptions },
              { type: 'text', key: 'title', label: 'Title' },
              { type: 'textarea', key: 'text', label: 'Text', rows: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    blocks: [
      {
        base: ['sections', 'skills'],
        fields: [
          ...sectionHead,
          { type: 'textarea', key: 'intro', label: 'Intro', rows: 3 },
          { type: 'text', key: 'coreTitle', label: 'Core panel title' },
          {
            type: 'array',
            key: 'core',
            label: 'Core technologies',
            itemTitle: (c) => String(c.name ?? ''),
            blank: () => ({ name: '', note: '', evidence: '' }),
            fields: [
              { type: 'text', key: 'name', label: 'Name' },
              { type: 'text', key: 'note', label: 'Short note' },
              { type: 'textarea', key: 'evidence', label: 'Where you used it', rows: 3 },
            ],
          },
          {
            type: 'array',
            key: 'groups',
            label: 'Skill groups',
            itemTitle: (g) => String(g.title ?? ''),
            blank: () => ({ id: `group-${rid()}`, title: '', caption: '', icon: 'code', showCard: true, wide: false, items: [] }),
            fields: [
              { type: 'text', key: 'id', label: 'ID', hint: 'Lowercase letters, numbers and dashes. Must be unique.' },
              { type: 'text', key: 'title', label: 'Title' },
              { type: 'text', key: 'caption', label: 'One-line description' },
              { type: 'select', key: 'icon', label: 'Icon', options: iconOptions },
              { type: 'boolean', key: 'showCard', label: 'Show as a card', hint: 'Off = hidden visually, but still readable by screen readers and search engines.' },
              { type: 'boolean', key: 'wide', label: 'Wide card' },
              { type: 'strings', key: 'items', label: 'Skills', chips: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'experience',
    label: 'Experience',
    blocks: [
      {
        title: 'Section',
        base: ['sections', 'experience'],
        fields: [
          ...sectionHead,
          { type: 'textarea', key: 'intro', label: 'Intro', rows: 3 },
          { type: 'strings', key: 'highlightTerms', label: 'Highlighted phrases', chips: true, hint: 'Phrases that get a marker highlight inside the job bullet points (must match the text exactly).' },
        ],
      },
      {
        title: 'Jobs',
        hint: 'Newest first. The first job also feeds the hero line and structured data.',
        base: [],
        fields: [
          {
            type: 'array',
            key: 'experience',
            label: 'Jobs',
            openFirst: true,
            itemTitle: (j) => [j.company, j.role].filter(Boolean).join(' — '),
            blank: () => ({ company: '', companyUrl: '', role: '', start: thisMonth(), end: '', location: '', highlights: [], stack: [] }),
            fields: [
              { type: 'text', key: 'company', label: 'Company' },
              { type: 'text', key: 'companyUrl', label: 'Company link', placeholder: 'https://…' },
              { type: 'text', key: 'role', label: 'Role' },
              { type: 'month', key: 'start', label: 'Start' },
              { type: 'month', key: 'end', label: 'End', optional: true },
              { type: 'text', key: 'location', label: 'Location', placeholder: 'Country · Remote' },
              { type: 'strings', key: 'highlights', label: 'Bullet points', addLabel: 'Add bullet' },
              { type: 'strings', key: 'stack', label: 'Technologies', chips: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    blocks: [
      { title: 'Section', base: ['sections', 'work'], fields: [...sectionHead, { type: 'textarea', key: 'intro', label: 'Intro', rows: 3 }] },
      {
        title: 'Projects',
        base: [],
        fields: [
          {
            type: 'array',
            key: 'projects',
            label: 'Projects',
            openFirst: true,
            itemTitle: (p) => String(p.title ?? ''),
            blank: () => ({
              id: `project-${rid()}`,
              title: '',
              context: '',
              year: String(new Date().getFullYear()),
              summary: '',
              contributions: [],
              stack: [],
              metricValue: '',
              metricLabel: '',
              linkHref: '',
              linkLabel: '',
            }),
            fields: [
              { type: 'text', key: 'id', label: 'ID', hint: 'Lowercase letters, numbers and dashes. Must be unique.' },
              { type: 'text', key: 'title', label: 'Title' },
              { type: 'text', key: 'context', label: 'Company / context' },
              { type: 'text', key: 'year', label: 'Year or period', placeholder: '2024 — 2025' },
              { type: 'textarea', key: 'summary', label: 'Summary', rows: 3 },
              { type: 'strings', key: 'contributions', label: 'Contributions & results', addLabel: 'Add item' },
              { type: 'strings', key: 'stack', label: 'Technologies', chips: true },
              { type: 'text', key: 'metricValue', label: 'Highlight number (optional)', placeholder: '2,000+' },
              { type: 'text', key: 'metricLabel', label: 'Highlight label', placeholder: 'active users' },
              { type: 'text', key: 'linkHref', label: 'Link (optional)', placeholder: 'https://…' },
              { type: 'text', key: 'linkLabel', label: 'Link text', placeholder: 'example.com' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    blocks: [
      { title: 'Section', base: ['sections', 'education'], fields: [...sectionHead, { type: 'text', key: 'languagesTitle', label: 'Languages card title' }] },
      {
        title: 'Education & languages',
        base: [],
        fields: [
          {
            type: 'array',
            key: 'education',
            label: 'Education',
            itemTitle: (e) => [e.field, e.school].filter(Boolean).join(' — '),
            blank: () => ({ degree: '', field: '', school: '', schoolUrl: '' }),
            fields: [
              { type: 'text', key: 'degree', label: 'Degree' },
              { type: 'text', key: 'field', label: 'Field of study' },
              { type: 'text', key: 'school', label: 'School' },
              { type: 'text', key: 'schoolUrl', label: 'School link', placeholder: 'https://…' },
            ],
          },
          {
            type: 'array',
            key: 'languages',
            label: 'Languages',
            itemTitle: (l) => `${l.name ?? ''}${l.level ? ` — ${l.level}` : ''}`,
            blank: () => ({ name: '', level: '' }),
            fields: [
              { type: 'text', key: 'name', label: 'Language' },
              { type: 'text', key: 'level', label: 'Level' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    blocks: [
      {
        title: 'Section',
        base: ['sections', 'contact'],
        fields: [
          ...sectionHead,
          { type: 'textarea', key: 'text', label: 'Text', rows: 3 },
          { type: 'text', key: 'emailButtonLabel', label: 'Email button text' },
        ],
      },
      {
        title: 'Contact links',
        hint: 'The first “email” entry powers the main email button. Links starting with https:// are also listed in the footer and in structured data.',
        base: [],
        fields: [
          {
            type: 'array',
            key: 'contacts',
            label: 'Links',
            itemTitle: (c) => [c.label, c.value].filter(Boolean).join(' — '),
            blank: () => ({ type: 'website', label: 'Website', value: '', href: 'https://', copy: '' }),
            fields: [
              { type: 'select', key: 'type', label: 'Type', options: contactTypes },
              { type: 'text', key: 'label', label: 'Label' },
              { type: 'text', key: 'value', label: 'Displayed text' },
              { type: 'text', key: 'href', label: 'Link', placeholder: 'https://…, mailto:…, tel:…' },
              { type: 'text', key: 'copy', label: 'Text for the copy button', hint: 'Leave empty to hide the copy button.' },
            ],
          },
        ],
      },
    ],
  },
];

/** Which tab owns a JSON path like `experience.2.end` — used to jump to the right tab from an error. */
export function tabForPath(path: string): string {
  const [a, b] = path.split('.');
  if (a === 'site' || a === 'seo') return 'general';
  if (a === 'profile') return 'profile';
  if (a === 'contacts') return 'contact';
  if (a === 'experience') return 'experience';
  if (a === 'projects') return 'work';
  if (a === 'education' || a === 'languages') return 'education';
  if (a === 'sections' && b) return b;
  return 'general';
}
