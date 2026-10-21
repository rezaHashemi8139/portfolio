import type { SiteContent } from '@/lib/schema';
import { duration, formatMonth } from '@/lib/site';
import { SectionHeading } from '@/components/SectionHeading';
import { JobCard } from '@/components/JobCard';
import { ExperienceFx } from './ExperienceFx';

export function Experience({ content }: { content: SiteContent }) {
  const exp = content.sections.experience;

  return (
    <section id="experience" className="section" data-stage="3" aria-labelledby="experience-title">
      <div className="container">
        <SectionHeading tag={exp.tag} id="experience-title" title={exp.title} intro={exp.intro} />
        <div className="timeline">
          <span className="timeline__track" aria-hidden="true" />
          <span className="timeline__fill" aria-hidden="true" />
          <ol className="timeline__list">
            {content.experience.map((job, i) => (
              <JobCard
                key={`${job.company}-${job.start}`}
                job={job}
                index={i}
                terms={exp.highlightTerms}
                // Computed on the server so dates can never differ between server HTML and the browser.
                startLabel={formatMonth(job.start)}
                endLabel={job.end ? formatMonth(job.end) : ''}
                durationLabel={duration(job.start, job.end)}
              />
            ))}
          </ol>
        </div>
      </div>
      <ExperienceFx />
    </section>
  );
}
