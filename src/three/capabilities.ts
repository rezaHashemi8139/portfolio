/* Lightweight checks that run before the three.js chunk is downloaded. */

export type Quality = 'high' | 'low';

export function canUseWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectQuality(): Quality {
  // Manual override for testing: ?quality=high | ?quality=low
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'high' || forced === 'low') return forced;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  return coarse || small || cores <= 4 || mem <= 4 || saveData ? 'low' : 'high';
}
