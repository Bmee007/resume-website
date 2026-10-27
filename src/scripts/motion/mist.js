// src/scripts/motion/mist.js — the finale's mist: a real noise-driven volume that the visitor wipes away.
// Domain-warped fractal noise drifts across the Contact chapter. Scrolling in thins it to a thick residual veil; the cursor then wipes
// persistent trails through it (they heal slowly), enough wiping clears it for good, and anyone who does not wipe (touch, keyboard,
// reduced pointer use) sees it lift on its own after a few seconds. Renders only while Contact is on screen.
import { gsap, ScrollTrigger } from './core.js';

const N = 12;                                   // wipe points kept for the trail
const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
const FRAG = /* glsl */`
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uProg; uniform vec3 uPts[${N}];
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = r * p * 2.04 + vec2(3.1, 7.7); a *= 0.5; } return v; }
// cumulus-style density: warped, billowy base plus finer curl at the edges
float density(vec2 p, float t){
  vec2 q = vec2(fbm(p * 0.9 + vec2(t, -t * 0.5)), fbm(p * 0.9 + vec2(5.2, 1.3) - vec2(t * 0.7, -t * 0.2)));
  float base = fbm(p * 1.35 + q * 1.8 + vec2(t * 1.3, t * 0.25));
  float billow = 1.0 - abs(2.0 * fbm(p * 2.6 + q * 2.4 - vec2(t * 0.9, 0.0)) - 1.0);   // puffy ridges on the surface
  return clamp(base * 0.62 + billow * 0.52 - 0.18, 0.0, 1.2);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y; vec2 p = vec2(uv.x * asp, uv.y);
  float t = uTime * 0.03;
  float d = density(p, t);
  // a second, nearer bank drifting faster gives depth
  float d2 = density(p * 1.7 + vec2(7.3, 2.1), t * 1.8);
  float dens = mix(d, d * 0.6 + d2 * 0.55, 0.42);
  float thr = mix(-0.1, 0.98, uProg);                                   // scrolling / wiping raises the threshold: the bank tears apart
  float cover = smoothstep(thr - 0.20, thr + 0.12, dens);
  // lighting: compare density here with density a step toward the light (above-left): lit crowns, shadowed undersides
  float dl = density(p + vec2(-0.03, 0.05), t);
  float shade = clamp(0.52 + (dens - dl) * 8.0, 0.0, 1.0);
  vec3 lit = vec3(0.99, 0.995, 1.0), mid = vec3(0.86, 0.895, 0.94), shadow = vec3(0.50, 0.58, 0.71);
  vec3 col = mix(shadow, mid, smoothstep(0.0, 0.55, shade)); col = mix(col, lit, smoothstep(0.5, 1.0, shade));
  col *= 0.9 + 0.12 * smoothstep(0.3, 1.0, dens);
  float a = clamp(cover * (0.50 + 0.62 * dens), 0.0, 0.97);
  col = mix(col, lit, (1.0 - a) * 0.55 * cover);                       // silver lining where the cloud thins out
  float rough = 0.05 * dens;
  for (int i = 0; i < ${N}; i++) {
    vec3 w = uPts[i]; if (w.z <= 0.001) continue;
    float dd = distance(p, vec2(w.x * asp, w.y));
    a *= smoothstep(w.z * 0.45 + rough, w.z + rough * 2.0, dd);
  }
  gl_FragColor = vec4(col * a, a);
}`;

export function initMist(veil, section, { onShown } = {}) {
  const canvas = document.createElement('canvas'); canvas.className = 'mist-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG); if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = { uRes: gl.getUniformLocation(prog, 'uRes'), uTime: gl.getUniformLocation(prog, 'uTime'), uProg: gl.getUniformLocation(prog, 'uProg'), uPts: gl.getUniformLocation(prog, 'uPts') };
  gl.clearColor(0, 0, 0, 0);
  veil.prepend(canvas); veil.classList.add('has-mist');

  const fine = window.matchMedia('(pointer: fine)').matches;
  const S = { scroll: 0, settle: 0, arrived: 0, wiped: 0, active: false, last: null, pts: [] };   // pts: {x,y (0..1, y up), px, py, born}
  const ARRIVE = fine ? 0.62 : 0.8;                       // how thin scrolling alone makes it (the rest needs a wipe, or time)
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
    canvas.width = Math.max(2, Math.floor(veil.clientWidth * dpr)); canvas.height = Math.max(2, Math.floor(veil.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize(); window.addEventListener('resize', resize, { passive: true }); ScrollTrigger.addEventListener('refresh', resize);
  window.addEventListener('pointermove', (e) => {
    if (!S.active) return;
    const r = veil.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height, now = performance.now();
    if (S.last) S.wiped += Math.hypot(e.clientX - S.last.cx, e.clientY - S.last.cy);
    S.last = { cx: e.clientX, cy: e.clientY };
    const prev = S.pts[S.pts.length - 1];
    if (!prev || now - prev.born > 28) S.pts.push({ x, y, px: e.clientX - r.left, py: e.clientY - r.top, born: now });
    if (S.pts.length > N) S.pts.shift();
  }, { passive: true });
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => { S.active = self.isActive; if (!self.isActive) reset(); } });
  const reset = () => { S.settle = 0; S.arrived = 0; S.wiped = 0; S.pts = []; S.last = null; };

  const pts = new Float32Array(N * 3);
  const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let lastT = 0;
  gsap.ticker.add((time) => {
    const dt = Math.min(0.1, time - lastT); lastT = time;
    if (!S.active) return;
    // the arrival clock starts when the section has fully scrolled in; wiping enough, or waiting, lifts the rest
    if (S.scroll > 0.97) S.arrived += dt;
    const wipeClear = smoothstep(1600, 4200, S.wiped);                      // cursor travel (px) that clears it for good
    const idleClear = smoothstep(fine ? 6 : 0.6, fine ? 9.5 : 1.6, S.arrived);   // no wiping: it lifts on its own
    S.settle = Math.max(S.settle, wipeClear, idleClear);
    const prog = Math.min(1, S.scroll * ARRIVE + (1 - ARRIVE) * S.settle);   // what the shader sees
    const shown = prog;
    if (prog > 0.995 && S.settle > 0.99) { veil.style.opacity = '0'; onShown?.(1); return; }
    // wipe points: radius shrinks with age (the trail heals over ~5 s)
    const now = performance.now(); const rowH = veil.clientHeight || 1;
    pts.fill(0); const css = [];
    S.pts = S.pts.filter((q) => now - q.born < 5200);
    S.pts.forEach((q, i) => {
      const life = 1 - (now - q.born) / 5200, r = 0.2 * Math.pow(Math.max(0, life), 0.6);
      pts[i * 3] = q.x; pts[i * 3 + 1] = q.y; pts[i * 3 + 2] = r;
      if (r > 0.02) css.push(`radial-gradient(circle at ${q.px.toFixed(0)}px ${q.py.toFixed(0)}px, transparent ${(r * rowH * 0.5).toFixed(0)}px, black ${(r * rowH).toFixed(0)}px)`);
    });
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uTime, time); gl.uniform1f(U.uProg, prog); gl.uniform3fv(U.uPts, pts);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // the same holes through the veil's backdrop blur (union of the holes via mask intersection), so wiped patches are sharp as well as clear
    const feather = 'linear-gradient(to bottom, transparent 0, black 26vh)';
    const m = css.length ? `${css.join(', ')}, ${feather}` : feather;
    veil.style.setProperty('-webkit-mask-image', m); veil.style.setProperty('mask-image', m);
    veil.style.opacity = String(1 - smoothstep(0.9, 1, S.settle));
    veil.style.setProperty('--vb', `${(20 * Math.pow(1 - shown, 1.3)).toFixed(1)}px`);
    onShown?.(shown);
  });
  const hint = veil.querySelector('.veil-hint');
  return { setProgress(p) { S.scroll = p; if (p < 0.02) reset(); if (hint) hint.style.opacity = String(Math.max(0, 1 - S.wiped / 700) * (S.settle > 0.5 ? 0 : 1) * Math.min(1, p * 3)); } };
}
