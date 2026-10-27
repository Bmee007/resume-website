// src/scripts/fog.js
// Fullscreen WebGL fog shader. Drifting fractal noise mist whose two colours,
// density and chromatic-aberration "glitch" are driven from scroll by GSAP.
// No dependencies; falls back to the CSS gradient on <body> if WebGL is absent.

const VERT = `
attribute vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec3  uColA;     // bright mist colour
uniform vec3  uColB;     // dark depth colour
uniform float uDensity;  // 0 = clear sky, 1 = whiteout
uniform float uGlitch;   // 0..1 chromatic aberration pulse
uniform vec2  uMouse;    // -1..1
uniform float uHorizon;  // where the dark band sits, 0..1 from bottom

// Hash / noise (IQ-style value noise)
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, amp = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += amp * noise(p); p = r * p * 2.03 + 11.7; amp *= 0.5; }
  return v;
}

vec3 scene(vec2 uv, float shift){
  vec2 p = uv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.035;
  // Two layers of drifting mist with mouse parallax
  vec2 par = uMouse * 0.04;
  float n1 = fbm(p * 1.6 + vec2(t * 0.9, -t * 0.35) + par + shift);
  float n2 = fbm(p * 3.2 - vec2(t * 0.5, t * 0.2) - par * 1.6 + shift * 2.0);
  float mist = n1 * 0.7 + n2 * 0.3;

  // Vertical gradient: brighter at top, denser at the horizon band
  float vert = smoothstep(uHorizon - 0.55, uHorizon + 0.25, uv.y);
  float m = mix(mist * 0.9 + 0.05, 0.85 + mist * 0.3, vert);
  m = mix(m, 1.0, uDensity * 0.55);
  m = clamp(m, 0.0, 1.0);

  vec3 col = mix(uColB, uColA, m);
  // Soft vignette
  float vig = smoothstep(1.35, 0.35, length(uv * 2.0 - 1.0));
  col = mix(col * 0.82, col, vig);
  return col;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col;
  if (uGlitch > 0.001) {
    // Chromatic aberration + horizontal tear on transitions (Igloo-style)
    float band = step(0.985, noise(vec2(uv.y * 40.0, floor(uTime * 14.0)))) * uGlitch;
    float off = uGlitch * 0.03 + band * 0.12;
    float r = scene(uv + vec2(off, 0.0), 0.0).r;
    float g = scene(uv, 0.0).g;
    float b = scene(uv - vec2(off, 0.0), 0.0).b;
    col = vec3(r, g, b);
  } else {
    col = scene(uv, 0.0);
  }
  // Dither to kill banding in the fog
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0 * 3.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

// oklch(L C H) -> linear-ish sRGB via a tiny conversion. Keeps palette in one place.
function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gam = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; };
  return [gam(lr), gam(lg), gam(lb)];
}

// Chapter palettes: [A = mist, B = depth, density, horizon]
export const FOG_SCENES = {
  mist:     { a: oklchToRgb(0.975, 0.004, 240), b: oklchToRgb(0.80, 0.020, 245), density: 0.85, horizon: 0.15 },
  clearing: { a: oklchToRgb(0.955, 0.008, 238), b: oklchToRgb(0.66, 0.040, 245), density: 0.55, horizon: 0.25 },
  storm:    { a: oklchToRgb(0.42, 0.050, 245),  b: oklchToRgb(0.13, 0.022, 245), density: 0.35, horizon: 0.55 },
  steel:    { a: oklchToRgb(0.86, 0.016, 240),  b: oklchToRgb(0.50, 0.070, 245), density: 0.45, horizon: 0.35 },
  summit:   { a: oklchToRgb(0.985, 0.003, 240), b: oklchToRgb(0.86, 0.014, 240), density: 0.25, horizon: 0.05 },
  deep:     { a: oklchToRgb(0.34, 0.045, 245),  b: oklchToRgb(0.11, 0.020, 245), density: 0.30, horizon: 0.6 },
};

export function createFog(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[fog] shader error', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ['uRes', 'uTime', 'uColA', 'uColB', 'uDensity', 'uGlitch', 'uMouse', 'uHorizon']) U[n] = gl.getUniformLocation(prog, n);

  // Live state (lerped) and target state (set by chapters)
  const s = FOG_SCENES.mist;
  const live = { a: [...s.a], b: [...s.b], density: s.density, horizon: s.horizon, glitch: 0, mouse: [0, 0] };
  let densityBoost = 0; // added on top of the chapter density (Contact's clearing veil)
  const target = { a: [...s.a], b: [...s.b], density: s.density, horizon: s.horizon, mouse: [0, 0] };

  let dpr = 1;
  function resize() {
    // Render at reduced resolution: fog is low-frequency, so 0.5x DPR is invisible and 4x cheaper
    dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    canvas.width = Math.max(2, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(2, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const lerp = (a, b, t) => a + (b - a) * t;
  let paused = false;

  function render(timeSec) {
    if (paused) return;
    const k = 0.045;
    for (let i = 0; i < 3; i++) { live.a[i] = lerp(live.a[i], target.a[i], k); live.b[i] = lerp(live.b[i], target.b[i], k); }
    live.density = lerp(live.density, target.density + densityBoost, k);
    live.horizon = lerp(live.horizon, target.horizon, k);
    live.mouse[0] = lerp(live.mouse[0], target.mouse[0], 0.03);
    live.mouse[1] = lerp(live.mouse[1], target.mouse[1], 0.03);

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, timeSec);
    gl.uniform3fv(U.uColA, live.a);
    gl.uniform3fv(U.uColB, live.b);
    gl.uniform1f(U.uDensity, live.density);
    gl.uniform1f(U.uGlitch, live.glitch);
    gl.uniform2fv(U.uMouse, live.mouse);
    gl.uniform1f(U.uHorizon, live.horizon);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return {
    render,
    /** Set the chapter scene; colours lerp over ~0.6s in render(). */
    setScene(name) {
      const sc = FOG_SCENES[name];
      if (!sc) return;
      target.a = [...sc.a]; target.b = [...sc.b];
      target.density = sc.density; target.horizon = sc.horizon;
    },
    /** Pulse chromatic aberration: 0..1, decays in render via GSAP tween outside. */
    glitch(v) { live.glitch = v; },
    setMouse(x, y) { target.mouse = [x, y]; },
    /** Extra fog on top of the chapter preset, 0..1 (the Contact veil scrubs this to 0). */
    setDensityBoost(v) { densityBoost = Math.max(0, v || 0); },
    pause() { paused = true; },
    resume() { paused = false; },
    state: live,
  };
}
