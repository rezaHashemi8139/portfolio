import { ArrowUpRight } from 'lucide-react';
import type { SiteContent } from '@/lib/schema';
import { imageType } from '@/lib/site';
import { Rich } from '@/lib/markup';
import { ResumeButton } from '@/components/ResumeButton';
import { HeroFx } from './HeroFx';

function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((c, i) => (
        <span key={i} className="char" aria-hidden="true">
          {c}
        </span>
      ))}
    </>
  );
}

export function Hero({ content }: { content: SiteContent }) {
  const { profile, experience } = content;
  const current = experience[0];
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const img = profile.photoFallback || profile.photo;
  const modern = profile.photoFallback && profile.photo && profile.photo !== profile.photoFallback ? profile.photo : '';

  return (
    <section id="top" className="hero" data-stage="0" aria-label="Introduction">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__top">
            {current ? (
              <p className="eyebrow hero__eyebrow">
                <span className="dot" aria-hidden="true" />
                {current.role} at {current.company}
              </p>
            ) : null}
            <h1 className="hero__name" aria-label={fullName}>
              <span className="line">
                <SplitChars text={profile.firstName} />
              </span>
              <span className="line line--alt">
                <SplitChars text={profile.lastName} />
              </span>
            </h1>
            <p className="hero__role">
              <strong>{profile.title}</strong>
              <span>· {profile.yearsOfExperience} years</span>
            </p>
          </div>

          <div className="portrait glass">
            <div className="portrait__frame">
              {img ? (
                <picture>
                  {modern ? <source srcSet={modern} type={imageType(modern)} /> : null}
                  {/* Plain <img>: portrait files are managed (and replaced) at runtime from the admin, so the
                      build-time image optimizer would only serve stale copies. */}
                  <img
                    src={img}
                    alt={profile.photoAlt || `Portrait of ${fullName}`}
                    width={560}
                    height={814}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </picture>
              ) : null}
              <div className="portrait__caption">
                <b>{fullName}</b>
                <span>{profile.portraitCaption}</span>
              </div>
            </div>
            <div className="portrait__badge glass glass--strong">
              <small>Experience</small>
              <span>
                <i aria-hidden="true" />
                {profile.yearsOfExperience} years shipping web apps
              </span>
            </div>
            <span className="core-anchor" aria-hidden="true" />
          </div>

          <div className="hero__bottom">
            <p className="hero__intro">
              <Rich text={profile.heroIntro} />
            </p>
            <div className="hero__ctas">
              <a className="btn btn--primary" href="#work" data-cursor="hover" data-magnetic>
                <span>View my work</span>
                <ArrowUpRight className="icon-nudge" aria-hidden="true" />
              </a>
              <ResumeButton href={profile.resumeFile} fileName={profile.resumeFileName} />
            </div>
            <div className="hero__stack" aria-label="Core stack">
              {profile.core.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#about" aria-label="Scroll to About">
        <span>Scroll</span>
        <span className="scroll-cue__line" aria-hidden="true" />
      </a>
      <HeroFx />
    </section>
  );
}
