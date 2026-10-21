/**
 * Particle "formations" — one target shape per page section.
 * The particle shader morphs between consecutive formations as the visitor scrolls,
 * so the 3D scene tells the same story as the content:
 *
 *   0 Hero        orbit shell  — a sphere + ring around the glass core
 *   1 About       galaxy       — a wide spiral: background, interests, strengths
 *   2 Skills      lattice      — points running along the edges of a 3D grid (architecture)
 *   3 Experience  helix        — a double helix laid out horizontally like a timeline
 *   4 Work        frames       — six card outlines, echoing the six project cards
 *   5 Education   wave field   — a calm sine-wave plane
 *   6 Contact     converge     — everything gathers into a tight sphere around the core
 */

export const STAGE_COUNT = 7;

/** Small deterministic PRNG so every load produces the same composition. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Writer = (i: number, rnd: () => number, out: Float32Array) => void;

function build(count: number, seed: number, write: Writer): Float32Array {
  const out = new Float32Array(count * 3);
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) write(i, rnd, out);
  return out;
}

function set(out: Float32Array, i: number, x: number, y: number, z: number) {
  out[i * 3] = x;
  out[i * 3 + 1] = y;
  out[i * 3 + 2] = z;
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** 0 — Fibonacci sphere shell plus a tilted ring band. */
function orbitShell(count: number) {
  return build(count, 11, (i, rnd, out) => {
    if (i % 10 < 7) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = GOLDEN * i;
      const R = 2.9 + (rnd() - 0.5) * 0.35;
      set(out, i, Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
    } else {
      const a = rnd() * Math.PI * 2;
      const R = 3.5 + rnd() * 1.1;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      const tilt = 0.42;
      set(out, i, x, z * Math.sin(tilt) + (rnd() - 0.5) * 0.08, z * Math.cos(tilt));
    }
  });
}

/** 1 — three-armed spiral galaxy, slightly tilted. */
function galaxy(count: number) {
  return build(count, 23, (i, rnd, out) => {
    const arms = 3;
    const arm = i % arms;
    const t = Math.pow(rnd(), 0.8);
    const radius = 0.6 + t * 7;
    const spin = radius * 0.55;
    const angle = (arm / arms) * Math.PI * 2 + spin;
    const spread = Math.pow(rnd(), 2.4) * (1.4 - t * 0.6);
    const sx = (rnd() - 0.5) * spread * 2;
    const sy = (rnd() - 0.5) * spread * 0.5;
    const sz = (rnd() - 0.5) * spread * 2;
    const x = Math.cos(angle) * radius + sx;
    const z = Math.sin(angle) * radius + sz;
    const tilt = -0.5;
    set(out, i, x, sy + z * Math.sin(tilt), z * Math.cos(tilt));
  });
}

/** 2 — points distributed along the edges of a 5×5×5 lattice. */
function lattice(count: number) {
  const n = 5;
  const size = 6.4;
  const step = size / (n - 1);
  const half = size / 2;
  return build(count, 37, (_i, rnd, out) => {
    const axis = Math.floor(rnd() * 3);
    const a = Math.floor(rnd() * n) * step - half;
    const b = Math.floor(rnd() * n) * step - half;
    const t = rnd() * size - half;
    const j = () => (rnd() - 0.5) * 0.04;
    if (axis === 0) set(out, _i, t, a + j(), b + j());
    else if (axis === 1) set(out, _i, a + j(), t, b + j());
    else set(out, _i, a + j(), b + j(), t);
  });
}

/** 3 — horizontal double helix with connecting rungs (a timeline). */
function helix(count: number) {
  const length = 16;
  return build(count, 41, (i, rnd, out) => {
    const t = rnd();
    const x = (t - 0.5) * length;
    const phase = t * Math.PI * 7;
    const kind = i % 9;
    const R = 1.25;
    if (kind < 7) {
      const strand = kind % 2 === 0 ? 0 : Math.PI;
      const r = R + (rnd() - 0.5) * 0.12;
      set(out, i, x, Math.cos(phase + strand) * r, Math.sin(phase + strand) * r);
    } else {
      // rungs between strands
      const u = rnd() * 2 - 1;
      set(out, i, x, Math.cos(phase) * R * u, Math.sin(phase) * R * u);
    }
  });
}

/** 4 — six card outlines in a gently curved 3×2 grid. */
function frames(count: number) {
  const cols = 3;
  const rows = 2;
  const w = 2.7;
  const h = 1.75;
  const gx = 0.45;
  const gy = 0.45;
  const totalW = cols * w + (cols - 1) * gx;
  const totalH = rows * h + (rows - 1) * gy;
  return build(count, 53, (i, rnd, out) => {
    const card = i % (cols * rows);
    const cx = (card % cols) * (w + gx) - totalW / 2 + w / 2;
    const cy = totalH / 2 - Math.floor(card / cols) * (h + gy) - h / 2;
    let x: number;
    let y: number;
    if (rnd() < 0.82) {
      // perimeter
      const p = rnd() * (2 * w + 2 * h);
      if (p < w) { x = -w / 2 + p; y = h / 2; }
      else if (p < w + h) { x = w / 2; y = h / 2 - (p - w); }
      else if (p < 2 * w + h) { x = w / 2 - (p - w - h); y = -h / 2; }
      else { x = -w / 2; y = -h / 2 + (p - 2 * w - h); }
    } else {
      // sparse inner "content lines"
      const line = Math.floor(rnd() * 4);
      x = -w / 2 + 0.25 + rnd() * (w * (line === 0 ? 0.55 : 0.8));
      y = h / 2 - 0.35 - line * 0.32;
    }
    const X = cx + x;
    set(out, i, X, cy + y, -Math.abs(X) * 0.22 + (rnd() - 0.5) * 0.03);
  });
}

/** 5 — sine-wave field below the camera's eye line. */
function wave(count: number) {
  const side = Math.ceil(Math.sqrt(count));
  const size = 18;
  return build(count, 67, (i, rnd, out) => {
    const gx = (i % side) / (side - 1) - 0.5;
    const gz = Math.floor(i / side) / (side - 1) - 0.5;
    const x = gx * size + (rnd() - 0.5) * 0.05;
    const z = gz * size * 0.7;
    const y = -1.6 + Math.sin(x * 0.7) * 0.35 + Math.cos(z * 0.9 + x * 0.25) * 0.3;
    set(out, i, x, y, z);
  });
}

/** 6 — tight sphere around the core with a few outward streams. */
function converge(count: number) {
  return build(count, 79, (i, rnd, out) => {
    if (i % 12 === 0) {
      // outward signal streams
      const a = Math.floor(rnd() * 8) * (Math.PI / 4) + 0.2;
      const r = 2.2 + Math.pow(rnd(), 1.6) * 5.5;
      set(out, i, Math.cos(a) * r, Math.sin(a) * r * 0.6, (rnd() - 0.5) * 0.3);
      return;
    }
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = GOLDEN * i * 1.0003;
    const R = 1.75 + Math.pow(rnd(), 3) * 0.6;
    set(out, i, Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
  });
}

export function createFormations(count: number): Float32Array[] {
  return [orbitShell(count), galaxy(count), lattice(count), helix(count), frames(count), wave(count), converge(count)];
}

/** Per-particle random attributes: stagger, size, tint, phase. */
export function createRandoms(count: number): Float32Array {
  const rnd = mulberry32(97);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    out[i * 4] = rnd();
    out[i * 4 + 1] = rnd();
    out[i * 4 + 2] = rnd();
    out[i * 4 + 3] = rnd();
  }
  return out;
}
