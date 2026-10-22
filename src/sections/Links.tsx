import { ArrowUpRight, Globe } from 'lucide-react';
import type { LinkType, SiteContent } from '@/lib/schema';
import { SectionHeading } from '@/components/SectionHeading';
import { GitHubIcon, InstagramIcon, LinkedInIcon, TelegramIcon, XIcon, YouTubeIcon } from '@/components/Icons';
import { LinksFx } from './LinksFx';

function LinkIcon({ type }: { type: LinkType }) {
  if (type === 'linkedin') return <LinkedInIcon />;
  if (type === 'github') return <GitHubIcon />;
  if (type === 'telegram') return <TelegramIcon />;
  if (type === 'instagram') return <InstagramIcon />;
  if (type === 'x') return <XIcon />;
  if (type === 'youtube') return <YouTubeIcon />;
  return <Globe />;
}

/** Profiles and channels (LinkedIn, GitHub, Telegram…). Hidden entirely when no link is set. */
export function Links({ content }: { content: SiteContent }) {
  const section = content.sections.links;
  const links = content.links.filter((l) => l.href);
  if (links.length === 0) return null;

  return (
    <section id="links" className="section links" aria-labelledby="links-title">
      <div className="container">
        <SectionHeading tag={section.tag} id="links-title" title={section.title} intro={section.intro || undefined} />
        <ul className="contact__grid">
          {links.map((l, i) => (
            <li key={`${l.type}-${i}`} className="contact-card link-card glass">
              <span className="contact-card__icon" aria-hidden="true">
                <LinkIcon type={l.type} />
              </span>
              <div className="contact-card__body">
                <span className="contact-card__label">{l.label}</span>
                {/* The anchor stretches over the whole card (see .link-card__value::after) so the card is one big target. */}
                <a className="link-card__value" href={l.href} target="_blank" rel="noopener noreferrer" data-cursor="hover">
                  {l.value || l.href}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
              <span className="icon-btn" aria-hidden="true">
                <ArrowUpRight />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <LinksFx />
    </section>
  );
}
