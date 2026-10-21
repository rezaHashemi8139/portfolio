import type { ReactNode } from 'react';
import { Rich } from '@/lib/markup';

interface Props {
  /** Small uppercase section label shown above the heading. */
  tag: string;
  /** Heading text; *asterisks* mark the accent words. */
  title: string;
  intro?: ReactNode;
  id: string;
}

export function SectionHeading({ tag, title, intro, id }: Props) {
  return (
    <div className="section-head">
      <p className="eyebrow" data-reveal>
        <span className="tag">{tag}</span>
      </p>
      <h2 id={id} data-reveal>
        <Rich text={title} />
      </h2>
      {intro ? <p data-reveal>{intro}</p> : null}
    </div>
  );
}
