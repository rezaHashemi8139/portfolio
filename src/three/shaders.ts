/* GLSL for the particle field and the gradient backdrop. */

export const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform int uFrom;
  uniform int uTo;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uIntro;
  uniform float uFocus;
  uniform float uMotion;
  uniform float uPulse;
  uniform vec3 uPointer;
  uniform float uPointerStrength;

  attribute vec3 pos0;
  attribute vec3 pos1;
  attribute vec3 pos2;
  attribute vec3 pos3;
  attribute vec3 pos4;
  attribute vec3 pos5;
  attribute vec3 pos6;
  attribute vec4 aRnd; // x stagger, y size, z tint, w phase

  varying float vAlpha;
  varying float vTint;

  vec3 pick(int i) {
    if (i == 0) return pos0;
    if (i == 1) return pos1;
    if (i == 2) return pos2;
    if (i == 3) return pos3;
    if (i == 4) return pos4;
    if (i == 5) return pos5;
    return pos6;
  }

  void main() {
    // Staggered morph: each particle starts its journey at a slightly different time.
    float m = clamp((uMix - aRnd.x * 0.35) / 0.65, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 p = mix(pick(uFrom), pick(uTo), m);

    // Particles breathe outward mid-flight, so transitions read as one gesture.
    float flight = sin(m * 3.14159265);
    p += normalize(p + vec3(0.0001)) * flight * (0.25 + aRnd.y * 0.6);

    // Ambient drift.
    float t = uTime * 0.35 + aRnd.w * 6.2831853;
    p += vec3(sin(t * 1.3 + p.y), cos(t * 1.1 + p.x), sin(t * 0.9 + p.z)) * 0.055 * uMotion;

    // Intro: particles arrive from a wide scatter.
    vec3 scatter = (vec3(aRnd.x, aRnd.w, aRnd.z) - 0.5) * vec3(34.0, 22.0, 26.0);
    float ii = clamp((uIntro - aRnd.y * 0.3) / 0.7, 0.0, 1.0);
    ii = 1.0 - pow(1.0 - ii, 3.0);
    p = mix(scatter, p, ii);

    vec4 world = modelMatrix * vec4(p, 1.0);

    // Cursor repulsion on the screen plane.
    vec2 d = world.xy - uPointer.xy;
    float dist = length(d);
    float push = smoothstep(1.7, 0.0, dist) * uPointerStrength;
    world.xy += (d / max(dist, 0.0001)) * push * 0.75;

    // Click / tap ripple.
    float r = length(world.xyz);
    world.xyz += normalize(world.xyz + vec3(0.0001)) * sin(r * 2.4 - uPulse * 9.0) * exp(-uPulse * 1.6) * 0.28;

    vec4 mv = viewMatrix * world;
    float depth = max(-mv.z, 0.1);

    // Fake depth of field: out-of-focus particles get larger and fainter (bokeh).
    float blur = abs(depth - uFocus);
    float size = uSize * (0.35 + aRnd.y * 0.95) * (1.0 + min(blur, 6.0) * 0.12);
    gl_PointSize = size * uPixelRatio * (10.0 / depth);

    vAlpha = (0.35 + 0.65 * fract(aRnd.w * 7.31)) / (1.0 + blur * 0.6);
    vAlpha *= ii;
    vTint = step(0.86, aRnd.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const particleFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTint;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.04, d);
    a = pow(a, 1.6);
    vec3 col = mix(uColorA, uColorB, vTint);
    gl_FragColor = vec4(col, a * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

export const backdropVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
  }
`;

export const backdropFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlowA;
  uniform vec3 uGlowB;
  uniform vec3 uDirA;
  uniform vec3 uDirB;
  uniform float uGlow;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y * 0.5 + 0.5;
    vec3 col = mix(uBottom, uTop, smoothstep(0.15, 0.85, h));
    col += uGlowA * pow(max(dot(dir, normalize(uDirA)), 0.0), 5.0) * uGlow;
    col += uGlowB * pow(max(dot(dir, normalize(uDirB)), 0.0), 7.0) * uGlow;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/* Low-tier glass: faceted fresnel rim using screen-space derivatives for flat normals. */
export const crystalVertex = /* glsl */ `
  varying vec3 vViewPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const crystalFragment = /* glsl */ `
  uniform vec3 uRim;
  uniform vec3 uCore;
  uniform float uAlpha;
  varying vec3 vViewPos;
  void main() {
    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    vec3 v = normalize(-vViewPos);
    float f = pow(1.0 - abs(dot(n, v)), 2.2);
    float facet = 0.5 + 0.5 * n.y;
    vec3 col = mix(uCore, uRim, f * 0.85 + facet * 0.12);
    float a = (0.1 + f * 0.75 + facet * 0.06) * uAlpha;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;
