import { ArrowUpRight, GraduationCap, Languages } from 'lucide-react';
import type { SiteContent } from '@/lib/schema';
import { SectionHeading } from '@/components/SectionHeading';
import { EducationFx } from './EducationFx';

export function Education({ content }: { content: SiteContent }) {
  const edu = content.sections.education;
  if (content.education.length === 0 && content.languages.length === 0) return null;

  return (
    <section id="education" className="section" data-stage="5" aria-labelledby="education-title">
      <div className="container">
        <SectionHeading tag={edu.tag} id="education-title" title={edu.title} />
        <div className="edu__grid">
          {content.education.map((e) => (
            <article className="edu-card glass" key={`${e.school}-${e.field}`}>
              <span className="edu-card__icon" aria-hidden="true">
                <GraduationCap />
              </span>
              <p className="edu-card__label">{e.degree}</p>
              <h3>{e.field}</h3>
              {e.schoolUrl ? (
                <a className="edu-card__school" href={e.schoolUrl} target="_blank" rel="noopener noreferrer" data-cursor="hover">
                  {e.school}
                  <ArrowUpRight aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <span className="edu-card__school">{e.school}</span>
              )}
            </article>
          ))}

          {content.languages.length > 0 ? (
            <article className="edu-card glass" aria-labelledby="lang-title">
              <span className="edu-card__icon" aria-hidden="true">
                <Languages />
              </span>
              <p className="edu-card__label" id="lang-title">
                {edu.languagesTitle}
              </p>
              <div>
                {content.languages.map((l) => (
                  <div className="lang-row" key={l.name}>
                    <b>{l.name}</b>
                    <span>{l.level}</span>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </div>
      <EducationFx />
    </section>
  );
}
