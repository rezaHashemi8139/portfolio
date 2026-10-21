/** Shared by the schema (server) and the admin form (browser) — keep this file dependency-free. */

export const ICON_NAMES = [
  'boxes',
  'shield-check',
  'radio',
  'flask-conical',
  'users',
  'rocket',
  'code',
  'layers',
  'zap',
  'globe',
  'star',
  'briefcase',
  'wrench',
  'cpu',
  'database',
  'palette',
  'git-branch',
  'heart',
  'lightbulb',
  'gauge',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

export const CONTACT_TYPES = ['email', 'phone', 'github', 'linkedin', 'website'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];
