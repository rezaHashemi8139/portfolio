'use client';

import { useCallback, useEffect, useState } from 'react';
import { SceneHost } from './SceneHost';
import { Preloader } from './Preloader';
import { markIntroPlayed } from '@/lib/intro';
import { sceneBus } from '@/three/sceneBus';
import { ScrollTrigger } from '@/lib/motion';

type Task = 'fonts' | 'portrait' | 'scene';
const TASKS: Task[] = ['fonts', 'portrait', 'scene'];
const LABELS: Record<Task, string> = {
  fonts: 'Setting type',
  portrait: 'Developing portrait',
  scene: 'Building 3D scene',
};

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise<void>((r) => window.setTimeout(r, ms))]);
}

interface Props {
  /** Shown letter by letter in the preloader. */
  name: string;
  /** Portrait to warm up while the preloader runs. */
  photo: string;
}

/**
 * The page itself is server-rendered and fully readable without JavaScript. This client island owns only
 * the cinematic layer on top of it: the WebGL scene, the preloader, and the signal that starts the intro.
 */
export function Boot({ name, photo }: Props) {
  const [done, setDone] = useState<Record<Task, boolean>>({ fonts: false, portrait: false, scene: false });
  const [loaded, setLoaded] = useState(false);

  const finish = useCallback((t: Task) => setDone((d) => (d[t] ? d : { ...d, [t]: true })), []);

  useEffect(() => {
    document.documentElement.classList.add('is-loading');
    withTimeout(document.fonts?.ready ?? Promise.resolve(), 3000).then(() => finish('fonts'));

    const decoded = (() => {
      if (!photo) return Promise.resolve();
      const img = new Image();
      img.src = photo;
      return img.decode().catch(() => undefined);
    })();
    withTimeout(decoded, 4000).then(() => finish('portrait'));

    // Never hold visitors hostage: everything is released after 7s.
    const failsafe = window.setTimeout(() => TASKS.forEach(finish), 7000);
    return () => window.clearTimeout(failsafe);
  }, [finish, photo]);

  const onSceneSettled = useCallback(() => finish('scene'), [finish]);

  const completed = TASKS.filter((t) => done[t]).length;
  const pending = TASKS.find((t) => !done[t]);
  const label = pending ? LABELS[pending] : 'Ready';

  const onExit = useCallback(() => {
    setLoaded(true);
    document.documentElement.classList.remove('is-loading');
    markIntroPlayed();
    sceneBus.scene?.playIntro();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <SceneHost onSettled={onSceneSettled} />
      {!loaded ? <Preloader name={name} progress={completed / TASKS.length} label={label} onExit={onExit} /> : null}
    </>
  );
}
