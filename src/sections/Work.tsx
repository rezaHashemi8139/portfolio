import type { SiteContent } from '@/lib/schema';
import { SectionHeading } from '@/components/SectionHeading';
import { ProjectCard } from '@/components/ProjectCard';
import { WorkFx } from './WorkFx';

export function Work({ content }: { content: SiteContent }) {
  const work = content.sections.work;
  const hasCurrentRole = content.experience[0]?.end === '';

  return (
    <section id="work" className="section" data-stage="4" aria-labelledby="work-title">
      <div className="container">
        <SectionHeading tag={work.tag} id="work-title" title={work.title} intro={work.intro} />
        <div className="work__grid">
          {content.projects.map((p, i) => (
            <ProjectCard key={p.id} p={p} current={i === 0 && hasCurrentRole} />
          ))}
        </div>
      </div>
      <WorkFx />
    </section>
  );
}
