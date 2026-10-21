'use client';

import { memo, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { canUseWebGL, detectQuality } from '@/three/capabilities';
import { sceneBus } from '@/three/sceneBus';
import { currentDomTheme } from '@/lib/theme';
import { prefersReducedMotion } from '@/lib/motion';

interface Props {
  /** Called once the scene has rendered its first frame, or failed (fallback shown). */
  onSettled: (ok: boolean) => void;
}

const subscribeNever = () => () => undefined;
let webglCache: boolean | null = null;
const webglSupported = () => (webglCache ??= canUseWebGL());

const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], .project, .glass';

/**
 * Owns the fixed WebGL canvas. three.js is loaded on demand (separate chunk),
 * and every scroll / pointer signal is forwarded imperatively — no React re-renders per frame.
 */
function SceneHostImpl({ onSettled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // WebGL support is only knowable in the browser. The server snapshot says 'supported', and React corrects it
  // right after hydration if the browser disagrees — so there is no hydration mismatch.
  const supported = useSyncExternalStore(subscribeNever, webglSupported, () => true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const mode: 'loading' | 'ready' | 'fallback' = !supported || failed ? 'fallback' : ready ? 'ready' : 'loading';
  const settledRef = useRef(onSettled);
  useEffect(() => {
    settledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    if (mode === 'fallback') {
      settledRef.current(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!supported) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    import('@/three/PortfolioScene')
      .then(({ PortfolioScene }) => {
        if (disposed) return;
        let scene: InstanceType<typeof PortfolioScene>;
        try {
          scene = new PortfolioScene({
            canvas,
            quality: detectQuality(),
            theme: currentDomTheme(),
            reducedMotion: prefersReducedMotion(),
            onContextLost: () => {
              sceneBus.scene = null;
              setFailed(true);
            },
          });
        } catch {
          setFailed(true);
          return;
        }
        sceneBus.scene = scene;

        // ---------- scroll → stage
        let tops: number[] = [];
        let anchorEl: HTMLElement | null = null;
        const measure = () => {
          const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]')).sort(
            (a, b) => Number(a.dataset.stage) - Number(b.dataset.stage),
          );
          tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
          anchorEl = document.querySelector<HTMLElement>('.core-anchor');
        };
        const update = () => {
          const vh = window.innerHeight;
          const probe = window.scrollY + vh * 0.5;
          let stage = 0;
          for (let k = 1; k < tops.length; k++) {
            const start = tops[k] - vh * 0.35;
            stage += Math.min(Math.max((probe - start) / (vh * 0.7), 0), 1);
          }
          scene.setStage(stage);
          if (anchorEl && stage < 1.5) {
            const r = anchorEl.getBoundingClientRect();
            scene.setAnchor((r.left / window.innerWidth) * 2 - 1, -((r.top / vh) * 2 - 1));
          }
        };
        let ticking = false;
        const onScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            update();
          });
        };
        const onResize = () => {
          scene.resize();
          measure();
          update();
        };
        const ro = new ResizeObserver(() => {
          measure();
          update();
        });
        const main = document.querySelector('main');
        if (main) ro.observe(main);

        // ---------- pointer
        const toNdc = (e: PointerEvent) => [(e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1] as const;
        const onMove = (e: PointerEvent) => {
          if (e.pointerType === 'touch') return;
          const [x, y] = toNdc(e);
          scene.setPointer(x, y);
        };
        const onLeave = () => scene.clearPointer();
        let touchTimer = 0;
        const onDown = (e: PointerEvent) => {
          const target = e.target as Element | null;
          if (target?.closest(INTERACTIVE)) return;
          const [x, y] = toNdc(e);
          scene.pulseAt(x, y);
          if (e.pointerType === 'touch') {
            window.clearTimeout(touchTimer);
            touchTimer = window.setTimeout(() => scene.clearPointer(), 900);
          }
        };
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onMotion = () => scene.setReducedMotion(mq.matches);

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerdown', onDown, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
        mq.addEventListener('change', onMotion);

        measure();
        update();
        scene.start();
        requestAnimationFrame(() => {
          if (disposed) return;
          setReady(true);
          settledRef.current(true);
        });

        cleanup = () => {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerdown', onDown);
          document.documentElement.removeEventListener('pointerleave', onLeave);
          mq.removeEventListener('change', onMotion);
          window.clearTimeout(touchTimer);
          ro.disconnect();
          scene.dispose();
          if (sceneBus.scene === scene) sceneBus.scene = null;
        };
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [supported]);

  return (
    <div className={`stage ${mode === 'ready' ? 'is-ready' : ''}`} aria-hidden="true">
      {mode === 'fallback' ? <div className="stage-fallback" /> : <canvas ref={canvasRef} />}
    </div>
  );
}

export const SceneHost = memo(SceneHostImpl);
