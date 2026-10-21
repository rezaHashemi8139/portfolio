import type { SiteContent } from '@/lib/schema';
import { ICONS } from '@/lib/icons';
import { Rich } from '@/lib/markup';
import { SectionHeading } from '@/components/SectionHeading';
import { AboutFx } from './AboutFx';

export function About({ content }: { content: SiteContent }) {
  const about = content.sections.about;
  const accent = new Set(about.statementAccent.map((w) => w.toLowerCase()));

  return (
    <section id="about" className="section" data-stage="1" aria-labelledby="about-title">
      <div className="container">
        <SectionHeading tag={about.tag} id="about-title" title={about.title} />
        <div className="about__grid">
          <div>
            <p className="about__statement">
              {about.statement.split(' ').map((w, i) => {
                const clean = w.replace(/[^a-z]/gi, '').toLowerCase();
                return (
                  <span key={i}>
                    <span className="w">{accent.has(clean) ? <em>{w}</em> : w}</span>{' '}
                  </span>
                );
              })}
            </p>
            <dl className="stats">
              {about.stats.map((s) => (
                <div className="stat" key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="stat__value" style={{ margin: 0 }}>
                    <span className="stat__num" data-value={s.value}>
                      {s.value.toLocaleString('en-US')}
                    </span>
                    {s.suffix ? <sup>{s.suffix}</sup> : null}
                  </dd>
                  <dd className="stat__label" style={{ margin: 0 }} aria-hidden="true">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="about__panel glass">
            <p>{content.profile.summary}</p>
            <ul className="strengths" aria-label="Strengths">
              {about.strengths.map(({ icon, title, text }) => {
                const Icon = ICONS[icon];
                return (
                  <li className="strength" key={title}>
                    <span className="strength__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <div>
                      <h3>
                        <Rich text={title} />
                      </h3>
                      <p>{text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <AboutFx />
    </section>
  );
}
