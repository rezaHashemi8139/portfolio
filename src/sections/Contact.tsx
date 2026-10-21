import { ArrowUpRight, Globe, Mail, Phone } from 'lucide-react';
import type { ContactType, SiteContent } from '@/lib/schema';
import { Rich } from '@/lib/markup';
import { ResumeButton } from '@/components/ResumeButton';
import { CopyButton } from '@/components/CopyButton';
import { GitHubIcon, LinkedInIcon } from '@/components/Icons';
import { ContactFx } from './ContactFx';

function ContactIcon({ type }: { type: ContactType }) {
  if (type === 'email') return <Mail />;
  if (type === 'phone') return <Phone />;
  if (type === 'github') return <GitHubIcon />;
  if (type === 'linkedin') return <LinkedInIcon />;
  return <Globe />;
}

export function Contact({ content }: { content: SiteContent }) {
  const { contacts, profile } = content;
  const section = content.sections.contact;
  const email = contacts.find((c) => c.type === 'email');

  return (
    <section id="contact" className="section contact" data-stage="6" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact__head">
          <p className="eyebrow">
            <span className="tag">{section.tag}</span>
          </p>
          <h2 id="contact-title" className="contact__title">
            <Rich text={section.title} />
          </h2>
          <p className="contact__sub">{section.text}</p>
          <div className="contact__ctas">
            {email ? (
              <a className="btn btn--primary" href={email.href} data-cursor="hover" data-magnetic>
                <span>{section.emailButtonLabel}</span>
                <Mail aria-hidden="true" />
              </a>
            ) : null}
            <ResumeButton href={profile.resumeFile} fileName={profile.resumeFileName} />
          </div>
        </div>

        <ul className="contact__grid">
          {contacts.map((c, i) => {
            const external = /^https?:/i.test(c.href);
            const valueId = `contact-${c.type}-${i}`;
            const action = external ? `Open ${c.label} profile (new tab)` : c.type === 'email' ? 'Write an email' : c.type === 'phone' ? 'Call' : `Open ${c.label}`;
            return (
              <li key={valueId} className="contact-card glass">
                <span className="contact-card__icon" aria-hidden="true">
                  <ContactIcon type={c.type} />
                </span>
                <div className="contact-card__body">
                  <span className="contact-card__label">{c.label}</span>
                  <span className="contact-card__value" id={valueId}>
                    {c.value}
                  </span>
                </div>
                <div className="contact-card__actions">
                  {c.copy ? <CopyButton value={c.copy} label={c.label.toLowerCase()} targetId={valueId} /> : null}
                  <a
                    className="icon-btn"
                    href={c.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    aria-label={action}
                    title={action}
                    data-cursor="hover"
                  >
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <ContactFx />
    </section>
  );
}
