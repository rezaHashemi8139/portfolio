import { CodeXml } from 'lucide-react';
import type { SiteContent } from '@/lib/schema';
import { ICONS } from '@/lib/icons';
import { SectionHeading } from '@/components/SectionHeading';
import { SkillCardShell } from '@/components/SkillCardShell';
import { SkillsFx } from './SkillsFx';

export function Skills({ content }: { content: SiteContent }) {
  const skills = content.sections.skills;
  const cards = skills.groups.filter((g) => g.showCard);
  const summarised = skills.groups.filter((g) => !g.showCard);

  return (
    <section id="skills" className="section" data-stage="2" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeading tag={skills.tag} id="skills-title" title={skills.title} intro={skills.intro} />

        <div className="skills__grid">
          <article className="core-panel glass glass--strong" aria-labelledby="core-title">
            <div className="core-panel__head">
              <h3 id="core-title">{skills.coreTitle}</h3>
              <span className="skill-card__icon" aria-hidden="true">
                <CodeXml />
              </span>
            </div>
            {skills.core.map((c) => (
              <div className="core-row" key={c.name}>
                <div className="core-row__name">
                  {c.name}
                  <span>{c.note}</span>
                </div>
                <div className="core-row__meter" aria-hidden="true">
                  <i />
                </div>
                <p>{c.evidence}</p>
              </div>
            ))}
            {summarised.map((g) => (
              <p className="sr-only" key={g.id}>
                {g.title}: {g.items.join(', ')}.
              </p>
            ))}
          </article>

          <div className="skill-cards">
            {cards.map((g) => {
              const Icon = ICONS[g.icon];
              return (
                <SkillCardShell key={g.id} className={`skill-card glass sheen ${g.wide ? 'skill-card--wide' : ''}`} labelledBy={`skill-${g.id}`}>
                  <div className="skill-card__head">
                    <span className="skill-card__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <h3 id={`skill-${g.id}`}>{g.title}</h3>
                  </div>
                  <p>{g.caption}</p>
                  <ul className="chips" aria-label={g.title}>
                    {g.items.map((item) => (
                      <li key={item} className="chip">
                        {item}
                      </li>
                    ))}
                  </ul>
                </SkillCardShell>
              );
            })}
          </div>
        </div>
      </div>
      <SkillsFx />
    </section>
  );
}
