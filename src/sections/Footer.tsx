import type { SiteContent } from '@/lib/schema';
import { ToTopButton } from '@/components/ToTopButton';
import { FooterFx } from './FooterFx';

export function Footer({ content }: { content: SiteContent }) {
  const { profile, contacts } = content;
  const name = `${profile.firstName}${profile.lastName}`;
  const links = contacts.filter((c) => /^https?:/i.test(c.href));

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="wordmark" aria-hidden="true">
          {name.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
        <div className="footer__bar">
          <span>
            © {new Date().getFullYear()} {profile.firstName} {profile.lastName}
          </span>
          <nav className="footer__links" aria-label="Profiles">
            {links.map((l, i) => (
              <a key={`${l.type}-${i}`} href={l.href} target="_blank" rel="noopener noreferrer" data-cursor="hover">
                {l.label}
              </a>
            ))}
          </nav>
          <ToTopButton />
        </div>
      </div>
      <FooterFx />
    </footer>
  );
}
