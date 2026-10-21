'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ResumeButton } from './ResumeButton';
import { gsap, prefersReducedMotion } from '@/lib/motion';

export interface NavProps {
  fullName: string;
  brandMark: string;
  items: { id: string; label: string }[];
  resume: { href: string; fileName: string };
}

export function Nav({ fullName, brandMark, items: navItems, resume }: NavProps) {
  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Scrolled state + progress line (written straight to CSS, no re-render)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        nav.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0));
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active section
  useEffect(() => {
    const ids = navItems.map((n) => n.id);
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01] },
    );
    els.forEach((el) => io.observe(el));
    const onTop = () => {
      if (window.scrollY < window.innerHeight * 0.4) setActive(null);
    };
    window.addEventListener('scroll', onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onTop);
    };
  }, [navItems]);

  // Sliding pill under the active link
  const placeIndicator = useCallback(() => {
    const ind = indicatorRef.current;
    const wrap = linksRef.current;
    if (!ind || !wrap) return;
    const link = active ? wrap.querySelector<HTMLElement>(`[data-id="${active}"]`) : null;
    if (!link) {
      ind.style.opacity = '0';
      return;
    }
    ind.style.opacity = '1';
    ind.style.width = `${link.offsetWidth}px`;
    ind.style.transform = `translateX(${link.offsetLeft}px)`;
  }, [active]);

  useEffect(() => {
    placeIndicator();
    window.addEventListener('resize', placeIndicator);
    document.fonts?.ready.then(placeIndicator).catch(() => undefined);
    return () => window.removeEventListener('resize', placeIndicator);
  }, [placeIndicator]);

  // Mobile sheet animation
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.inert = !open;
    const reduced = prefersReducedMotion();
    const links = sheet.querySelectorAll('.menu-sheet__link, .menu-sheet__foot');
    if (open) {
      gsap.set(sheet, { visibility: 'visible' });
      gsap.to(sheet, { opacity: 1, duration: reduced ? 0 : 0.45, ease: 'power2.out' });
      if (!reduced) gsap.fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.8, delay: 0.08 });
      document.documentElement.style.overflow = 'hidden';
      sheet.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    } else {
      gsap.to(sheet, {
        opacity: 0,
        duration: reduced ? 0 : 0.35,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(sheet, { visibility: 'hidden' });
        },
      });
      document.documentElement.style.overflow = '';
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    const mq = window.matchMedia('(min-width: 900px)');
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [open]);

  return (
    <>
      <header ref={navRef} className="nav">
        <div className="container">
          <nav className="nav__bar" aria-label="Primary">
            <a href="#top" className="brand" data-cursor="hover" aria-label={`${fullName}, back to top`}>
              <span className="brand__mark" aria-hidden="true">
                {brandMark}
              </span>
              <span className="brand__name">
                {fullName}
              </span>
            </a>

            <div ref={linksRef} className="nav__links">
              <span ref={indicatorRef} className="nav__indicator" aria-hidden="true" />
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  data-id={item.id}
                  className={`nav__link ${active === item.id ? 'is-active' : ''}`}
                  aria-current={active === item.id ? 'location' : undefined}
                  data-cursor="hover"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="nav__actions">
              <ThemeToggle />
              <span className="nav__resume">
                <ResumeButton href={resume.href} fileName={resume.fileName} variant="primary" size="sm" label="Résumé" />
              </span>
              <button
                ref={menuBtnRef}
                type="button"
                className="icon-btn nav__menu-btn"
                aria-expanded={open}
                aria-controls="menu-sheet"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((o) => !o)}
              >
                {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </button>
            </div>
            <span className="nav__progress" aria-hidden="true" />
          </nav>
        </div>
      </header>

      <div
        id="menu-sheet"
        ref={sheetRef}
        className="menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
      >
        <nav className="menu-sheet__links" aria-label="Mobile">
          {navItems.map((item, i) => (
            <a key={item.id} href={`#${item.id}`} className="menu-sheet__link" onClick={() => setOpen(false)}>
              {item.label}
              <span>{String(i + 1).padStart(2, '0')}</span>
            </a>
          ))}
        </nav>
        <div className="menu-sheet__foot">
          <ResumeButton href={resume.href} fileName={resume.fileName} variant="primary" />
        </div>
      </div>
    </>
  );
}
