import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createFormations, createRandoms, STAGE_COUNT } from './formations';
import { backdropFragment, backdropVertex, crystalFragment, crystalVertex, particleFragment, particleVertex } from './shaders';
import { palettes, type ScenePalette } from './palette';
import type { Theme } from '../lib/theme';
import type { Quality } from './capabilities';


export interface SceneOptions {
  canvas: HTMLCanvasElement;
  quality: Quality;
  theme: Theme;
  reducedMotion: boolean;
  onContextLost?: () => void;
}

type V3 = [number, number, number];

interface StageKey {
  cam: V3;
  target: V3;
  /** Core position as a fraction of the visible half-width / half-height at z = 0, plus scale. */
  core: V3;
  rotY: number;
  focus: number;
}

/** One key per section; see formations.ts for the matching particle shapes. */
const KEYS: StageKey[] = [
  { cam: [0, 0, 9], target: [0, 0, 0], core: [0.35, -0.1, 1], rotY: 0, focus: 9 },
  { cam: [-1.6, 1.4, 10.5], target: [0, 0, 0], core: [0.58, 0.05, 0.8], rotY: 0.5, focus: 10.5 },
  { cam: [3.2, 2.4, 10], target: [0, 0, 0], core: [0.66, 0.58, 0.5], rotY: 0.9, focus: 10.5 },
  { cam: [0, 0.8, 8.6], target: [0, 0, 0], core: [0.78, -0.62, 0.42], rotY: 0, focus: 8.6 },
  { cam: [0, 0, 10], target: [0, 0, 0], core: [0.86, 0.78, 0.32], rotY: 0, focus: 10 },
  { cam: [0, 2.6, 8.2], target: [0, -0.6, 0], core: [0.6, 0.25, 0.6], rotY: 0.3, focus: 8.6 },
  { cam: [0, 0, 8.2], target: [0, 0, 0], core: [0, 0.05, 1.1], rotY: 0.8, focus: 8.2 },
];

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.3;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const damp = (dt: number, lambda: number) => 1 - Math.exp(-lambda * dt);

interface ThemeColors {
  bgTop: THREE.Color;
  bgBottom: THREE.Color;
  glowA: THREE.Color;
  glowB: THREE.Color;
  particleA: THREE.Color;
  particleB: THREE.Color;
  ring: THREE.Color;
  wire: THREE.Color;
  satellite: THREE.Color;
  glassTint: THREE.Color;
  keyLight: THREE.Color;
  rimLight: THREE.Color;
}

function toColors(p: ScenePalette): ThemeColors {
  return {
    bgTop: new THREE.Color(p.bgTop),
    bgBottom: new THREE.Color(p.bgBottom),
    glowA: new THREE.Color(p.glowA),
    glowB: new THREE.Color(p.glowB),
    particleA: new THREE.Color(p.particleA),
    particleB: new THREE.Color(p.particleB),
    ring: new THREE.Color(p.ring),
    wire: new THREE.Color(p.wire),
    satellite: new THREE.Color(p.satellite),
    glassTint: new THREE.Color(p.glassTint),
    keyLight: new THREE.Color(p.keyLight),
    rimLight: new THREE.Color(p.rimLight),
  };
}

export class PortfolioScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private lastFrame = 0;
  private pmrem: THREE.PMREMGenerator;
  private envTexture: THREE.Texture;

  private particles: THREE.Points;
  private particleMat: THREE.ShaderMaterial;
  private particleGroup = new THREE.Group();
  private backdropMat: THREE.ShaderMaterial;

  private coreGroup = new THREE.Group();
  private glass: THREE.Mesh;
  private glassMat: THREE.MeshPhysicalMaterial;
  private crystalMat: THREE.ShaderMaterial;
  private wire: THREE.LineSegments;
  private wireMat: THREE.LineBasicMaterial;
  private rings: THREE.Group[] = [];
  private ringMat: THREE.MeshBasicMaterial;
  private satMat: THREE.MeshBasicMaterial;
  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.PointLight;

  private disposables: { dispose: () => void }[] = [];

  private quality: Quality;
  private reducedMotion: boolean;
  private running = false;
  private raf = 0;
  private time = 0;

  private stage = 0;
  private stageTarget = 0;
  private anchor = new THREE.Vector2(0.35, -0.1);
  private pointerTarget = new THREE.Vector2(0, 0);
  private pointer = new THREE.Vector2(0, 0);
  private pointerActive = 0;
  private pointerWorld = new THREE.Vector3(99, 99, 0);
  private pulse = 99;

  private introStart = -1;
  private intro = 0;

  private themeMix: number; // 0 = dark, 1 = light
  private themeTarget: number;
  private dark: ThemeColors;
  private light: ThemeColors;
  private tmpV = new THREE.Vector3();
  private tmpV2 = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  private frameSamples: number[] = [];
  private pixelRatio: number;
  private onContextLost?: () => void;
  private frameSkip = false;

  constructor(opts: SceneOptions) {
    this.quality = opts.quality;
    this.reducedMotion = opts.reducedMotion;
    this.onContextLost = opts.onContextLost;
    this.dark = toColors(palettes.dark);
    this.light = toColors(palettes.light);
    this.themeMix = this.themeTarget = opts.theme === 'light' ? 1 : 0;

    const high = this.quality === 'high';
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: high,
      alpha: false,
      powerPreference: high ? 'high-performance' : 'low-power',
    });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, high ? 1.75 : 1.25);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    this.camera.position.set(0, 0, 13);

    // Environment reflections without downloading an HDR.
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.envTexture = this.pmrem.fromScene(room, 0.04).texture;
    room.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | undefined;
      mat?.dispose?.();
    });
    this.scene.environment = this.envTexture;

    // --- Backdrop gradient sphere (also gives the glass something to refract) ---
    const backdropGeo = new THREE.SphereGeometry(80, 48, 24);
    this.backdropMat = new THREE.ShaderMaterial({
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uTop: { value: new THREE.Color() },
        uBottom: { value: new THREE.Color() },
        uGlowA: { value: new THREE.Color() },
        uGlowB: { value: new THREE.Color() },
        uDirA: { value: new THREE.Vector3(-0.6, 0.5, -1) },
        uDirB: { value: new THREE.Vector3(0.8, -0.3, -1) },
        uGlow: { value: 1 },
      },
    });
    const backdrop = new THREE.Mesh(backdropGeo, this.backdropMat);
    backdrop.renderOrder = -10;
    this.scene.add(backdrop);
    this.disposables.push(backdropGeo, this.backdropMat);

    // --- Lights ---
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.keyLight.position.set(-4, 5, 6);
    this.rimLight = new THREE.PointLight(0xffb35c, 30, 20, 2);
    this.rimLight.position.set(4, -2, -3);
    this.scene.add(this.keyLight, this.rimLight, new THREE.AmbientLight(0xffffff, 0.15));

    // --- Glass core ---
    const glassGeo = new THREE.IcosahedronGeometry(1, 0);
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.03,
      metalness: 0,
      transmission: 1,
      thickness: 2.2,
      ior: 1.6,
      dispersion: 0.4,
      iridescence: 0.9,
      iridescenceIOR: 1.25,
      iridescenceThicknessRange: [140, 520],
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      specularIntensity: 1,
      attenuationDistance: 2.4,
      attenuationColor: new THREE.Color(0xcfeeff),
      flatShading: true,
      envMapIntensity: 0.7,
    });
    // Low tier: a fresnel "holographic crystal" — no extra transmission render pass.
    this.crystalMat = new THREE.ShaderMaterial({
      vertexShader: crystalVertex,
      fragmentShader: crystalFragment,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      uniforms: { uRim: { value: new THREE.Color() }, uCore: { value: new THREE.Color() }, uAlpha: { value: 1 } },
    });
    this.disposables.push(this.crystalMat);
    this.glass = new THREE.Mesh(glassGeo, high ? this.glassMat : this.crystalMat);
    this.coreGroup.add(this.glass);

    const innerGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.52, 0));
    this.wireMat = new THREE.LineBasicMaterial({ color: 0x9fe0ff, toneMapped: false });
    this.wire = new THREE.LineSegments(innerGeo, this.wireMat);
    this.coreGroup.add(this.wire);


    this.ringMat = new THREE.MeshBasicMaterial({ color: 0x7cc9f2, toneMapped: false });
    this.satMat = new THREE.MeshBasicMaterial({ color: 0xf3b562, toneMapped: false });
    const satGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const ringSpecs = [
      { r: 1.75, rx: 1.2, rz: 0.25, sats: 1 },
      { r: 2.3, rx: 1.75, rz: -0.55, sats: 2 },
    ];
    for (const spec of ringSpecs) {
      const pivot = new THREE.Group();
      pivot.rotation.set(spec.rx, 0, spec.rz);
      const ringGeo = new THREE.TorusGeometry(spec.r, 0.0065, 6, high ? 240 : 140);
      pivot.add(new THREE.Mesh(ringGeo, this.ringMat));
      for (let s = 0; s < spec.sats; s++) {
        const sat = new THREE.Mesh(satGeo, this.satMat);
        const a = (s / spec.sats) * Math.PI * 2;
        sat.position.set(Math.cos(a) * spec.r, Math.sin(a) * spec.r, 0);
        pivot.add(sat);
      }
      this.rings.push(pivot);
      this.coreGroup.add(pivot);
      this.disposables.push(ringGeo);
    }
    this.coreGroup.scale.setScalar(0.0001);
    this.scene.add(this.coreGroup);
    this.disposables.push(glassGeo, this.glassMat, innerGeo, this.wireMat, this.ringMat, this.satMat, satGeo);

    // --- Particle field ---
    const count = high ? 7000 : 2600;
    const geo = new THREE.BufferGeometry();
    const forms = createFormations(count);
    forms.forEach((arr, i) => geo.setAttribute(`pos${i}`, new THREE.BufferAttribute(arr, 3)));
    // `position` is required by three for bounds; the shader ignores it.
    geo.setAttribute('position', new THREE.BufferAttribute(forms[0], 3));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(createRandoms(count), 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

    this.particleMat = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: this.themeMix > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uFrom: { value: 0 },
        uTo: { value: 1 },
        uSize: { value: high ? 2.6 : 3.2 },
        uPixelRatio: { value: this.pixelRatio },
        uIntro: { value: 0 },
        uFocus: { value: 9 },
        uMotion: { value: this.reducedMotion ? 0 : 1 },
        uPulse: { value: 99 },
        uPointer: { value: new THREE.Vector3(99, 99, 0) },
        uPointerStrength: { value: 0 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
        uOpacity: { value: 1 },
      },
    });
    this.particles = new THREE.Points(geo, this.particleMat);
    this.particles.frustumCulled = false;
    this.particleGroup.add(this.particles);
    this.scene.add(this.particleGroup);
    this.disposables.push(geo, this.particleMat);

    this.applyTheme(true);

    opts.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.resize();
  }

  // ---------------------------------------------------------------- public API

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Play the opening sequence: particles converge, the core grows in, the camera dollies forward. */
  playIntro() {
    if (this.reducedMotion) {
      this.intro = 1;
      this.introStart = 0;
      return;
    }
    this.introStart = this.time;
  }

  setStage(stage: number) {
    this.stageTarget = THREE.MathUtils.clamp(stage, 0, STAGE_COUNT - 1);
  }

  /** Hero anchor for the core, in normalised device coordinates (-1..1). */
  setAnchor(x: number, y: number) {
    this.anchor.set(x, y);
  }

  setPointer(x: number, y: number) {
    this.pointerTarget.set(x, y);
    this.pointerActive = 1;
  }

  clearPointer() {
    this.pointerActive = 0;
  }

  /** Ripple through the field (click / tap). */
  pulseAt(x: number, y: number) {
    this.setPointer(x, y);
    this.pulse = 0;
  }

  setTheme(theme: Theme, instant = false) {
    this.themeTarget = theme === 'light' ? 1 : 0;
    if (instant) {
      this.themeMix = this.themeTarget;
      this.applyTheme(true);
    }
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    this.particleMat.uniforms.uMotion.value = reduced ? 0 : 1;
    if (reduced) this.intro = 1;
  }

  /** Render one frame synchronously (used while the browser snapshots a theme view-transition). */
  renderNow() {
    this.update(0);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.stop();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.handleContextLost, false);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.disposables.forEach((d) => d.dispose());
    this.envTexture.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- internals

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.onContextLost?.();
  };

  private handleVisibility = () => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    // Low tier renders at ~30fps to save battery.
    if (this.quality === 'low') {
      this.frameSkip = !this.frameSkip;
      if (this.frameSkip) return;
    }
    const now = performance.now();
    const dt = Math.min((now - this.lastFrame) / 1000, 0.1);
    this.lastFrame = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.adapt(dt);
  };

  /** Drop pixel ratio once if the device clearly can't keep up. */
  private adapt(dt: number) {
    if (this.intro < 1 || this.frameSamples.length > 120) return;
    this.frameSamples.push(dt);
    if (this.frameSamples.length === 120) {
      const avg = this.frameSamples.reduce((a, b) => a + b, 0) / 120;
      const budget = this.quality === 'low' ? 1 / 22 : 1 / 42;
      if (avg > budget && this.pixelRatio > 1) {
        this.pixelRatio = 1;
        this.renderer.setPixelRatio(1);
        this.particleMat.uniforms.uPixelRatio.value = 1;
        this.resize();
      }
    }
  }

  private viewScale() {
    const a = this.camera.aspect;
    return a < 0.8 ? 1.38 : a < 1.25 ? 1.15 : 1;
  }

  private update(dt: number) {
    const motion = this.reducedMotion ? 0 : 1;
    this.time += dt;

    // Intro progress
    if (this.introStart >= 0 && this.intro < 1) {
      this.intro = Math.min((this.time - this.introStart) / 2.6, 1);
    }
    const introParticles = this.intro;
    const introCore = this.introStart < 0 ? 0 : easeOutBack(THREE.MathUtils.clamp((this.intro - 0.25) / 0.75, 0, 1));
    const introCam = this.introStart < 0 ? 0 : easeInOut(this.intro);

    // Stage smoothing
    this.stage += (this.stageTarget - this.stage) * damp(dt, this.reducedMotion ? 9 : 3.6);
    if (dt === 0) this.stage = this.stageTarget;
    let from = Math.floor(this.stage);
    let mix = this.stage - from;
    if (from >= STAGE_COUNT - 1) {
      from = STAGE_COUNT - 2;
      mix = 1;
    }
    const to = from + 1;
    const e = easeInOut(mix);
    const kA = KEYS[from];
    const kB = KEYS[to];

    // Pointer smoothing
    this.pointer.lerp(this.pointerTarget, damp(dt, 5));

    // Camera
    const vs = this.viewScale();
    const target = this.tmpV2.set(
      THREE.MathUtils.lerp(kA.target[0], kB.target[0], e),
      THREE.MathUtils.lerp(kA.target[1], kB.target[1], e),
      THREE.MathUtils.lerp(kA.target[2], kB.target[2], e),
    );
    const cam = this.tmpV.set(
      THREE.MathUtils.lerp(kA.cam[0], kB.cam[0], e),
      THREE.MathUtils.lerp(kA.cam[1], kB.cam[1], e),
      THREE.MathUtils.lerp(kA.cam[2], kB.cam[2], e),
    );
    cam.sub(target).multiplyScalar(vs).add(target);
    cam.x += this.pointer.x * 0.55 * motion;
    cam.y += this.pointer.y * 0.35 * motion;
    cam.z += (1 - introCam) * 5;
    this.camera.position.copy(cam);
    this.camera.lookAt(target);

    // Core placement (fractions of the visible half extents at z = 0)
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const halfH = (d: number) => Math.tan(fov / 2) * d * vs;
    const dist = (k: StageKey) => Math.hypot(k.cam[0] - k.target[0], k.cam[1] - k.target[1], k.cam[2] - k.target[2]);
    const coreA = from === 0 ? [this.anchor.x, this.anchor.y, kA.core[2]] : kA.core;
    const hA = halfH(dist(kA));
    const hB = halfH(dist(kB));
    const ax = coreA[0] * hA * this.camera.aspect;
    const ay = coreA[1] * hA;
    const bx = kB.core[0] * hB * this.camera.aspect;
    const by = kB.core[1] * hB;
    this.coreGroup.position.set(THREE.MathUtils.lerp(ax, bx, e), THREE.MathUtils.lerp(ay, by, e), 0);
    const mobileShrink = this.camera.aspect < 0.8 ? 0.78 : 1;
    const coreScale = THREE.MathUtils.lerp(coreA[2], kB.core[2], e) * introCore * mobileShrink;
    this.coreGroup.scale.setScalar(Math.max(coreScale, 0.0001));

    const spin = motion ? 0.18 : 0.05;
    this.glass.rotation.y += dt * spin;
    this.glass.rotation.x += dt * spin * 0.4;
    this.wire.rotation.y -= dt * 0.35;
    this.wire.rotation.z += dt * 0.12;
    this.coreGroup.rotation.x = THREE.MathUtils.lerp(this.coreGroup.rotation.x, -this.pointer.y * 0.35 * motion, damp(dt, 3));
    this.coreGroup.rotation.y = THREE.MathUtils.lerp(this.coreGroup.rotation.y, this.pointer.x * 0.5 * motion, damp(dt, 3));
    this.rings[0].rotation.z += dt * 0.22;
    this.rings[1].rotation.z -= dt * 0.15;
    const wirePulse = 1 + Math.sin(this.time * 1.6) * 0.05 * motion + Math.exp(-this.pulse * 3) * 0.35;
    this.wire.scale.setScalar(wirePulse);

    // Particle group
    const rotY = THREE.MathUtils.lerp(kA.rotY, kB.rotY, e) + Math.sin(this.time * 0.12) * 0.08 * motion;
    this.particleGroup.rotation.y = rotY;

    // Pointer → world position on the z = 0 plane
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, this.pointerWorld)) this.pointerWorld.set(99, 99, 0);
    const u = this.particleMat.uniforms;
    u.uPointer.value.copy(this.pointerWorld);
    u.uPointerStrength.value = THREE.MathUtils.lerp(u.uPointerStrength.value, this.pointerActive * (this.reducedMotion ? 0 : 1), damp(dt, 4));
    this.pulse += dt;
    u.uPulse.value = this.reducedMotion ? 99 : this.pulse;

    u.uTime.value = this.time;
    u.uFrom.value = from;
    u.uTo.value = to;
    u.uMix.value = mix;
    u.uIntro.value = introParticles;
    u.uFocus.value = THREE.MathUtils.lerp(kA.focus, kB.focus, e) * vs;

    // Theme cross-fade
    if (Math.abs(this.themeTarget - this.themeMix) > 0.0005) {
      this.themeMix += (this.themeTarget - this.themeMix) * damp(dt, 5.5);
      if (Math.abs(this.themeTarget - this.themeMix) <= 0.0005) this.themeMix = this.themeTarget;
      this.applyTheme(false);
    }
  }

  private applyTheme(force: boolean) {
    const t = this.themeMix;
    const mixC = (a: THREE.Color, b: THREE.Color, out: THREE.Color) => out.copy(a).lerp(b, t);
    const D = this.dark;
    const L = this.light;
    const bu = this.backdropMat.uniforms;
    mixC(D.bgTop, L.bgTop, bu.uTop.value);
    mixC(D.bgBottom, L.bgBottom, bu.uBottom.value);
    mixC(D.glowA, L.glowA, bu.uGlowA.value);
    mixC(D.glowB, L.glowB, bu.uGlowB.value);
    bu.uGlow.value = THREE.MathUtils.lerp(palettes.dark.glow, palettes.light.glow, t);

    const pu = this.particleMat.uniforms;
    mixC(D.particleA, L.particleA, pu.uColorA.value);
    mixC(D.particleB, L.particleB, pu.uColorB.value);
    // Dip opacity through the midpoint so the blending switch is invisible.
    const dip = Math.min(1, Math.abs(t - 0.5) * 2.2 + 0.08);
    pu.uOpacity.value = THREE.MathUtils.lerp(palettes.dark.particleOpacity, palettes.light.particleOpacity, t) * dip;
    const wantBlend = t > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (force || this.particleMat.blending !== wantBlend) {
      this.particleMat.blending = wantBlend;
      this.particleMat.needsUpdate = true;
    }

    mixC(D.ring, L.ring, this.ringMat.color);
    mixC(D.wire, L.wire, this.wireMat.color);
    mixC(D.satellite, L.satellite, this.satMat.color);
    mixC(D.glassTint, L.glassTint, this.glassMat.attenuationColor);
    this.glassMat.envMapIntensity = THREE.MathUtils.lerp(palettes.dark.envIntensity, palettes.light.envIntensity, t);
    const cu = this.crystalMat.uniforms;
    mixC(D.ring, L.ring, cu.uRim.value);
    mixC(D.bgTop, L.bgTop, cu.uCore.value);
    const wantCrystalBlend = t > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (force || this.crystalMat.blending !== wantCrystalBlend) {
      this.crystalMat.blending = wantCrystalBlend;
      this.crystalMat.needsUpdate = true;
    }
    mixC(D.keyLight, L.keyLight, this.keyLight.color);
    mixC(D.rimLight, L.rimLight, this.rimLight.color);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(1.05, 0.95, t);
  }
}
