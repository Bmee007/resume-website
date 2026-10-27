// src/scripts/motion/mist.js — the finale's mist: a real noise-driven volume, not a gradient.
// Domain-warped fractal noise drifts across the Contact chapter; as the reader scrolls in its threshold rises, so the mist breaks up
// and clears unevenly, and the cursor wipes a soft, organic hole through it ("clear the fog"). Renders only while Contact is on screen.
import { gsap, ScrollTrigger } from './core.js';

const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
const FRAG = /* glsl */`
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uProg;
uniform vec2 uMouse; uniform vec2 uTrail; uniform float uAmt;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y; vec2 p = vec2(uv.x * asp, uv.y);
  float t = uTime * 0.035;
  vec2 q = vec2(fbm(p * 1.5 + vec2(t, -t * 0.6)), fbm(p * 1.5 + vec2(5.2, 1.3) - vec2(t * 0.8)));
  float n = fbm(p * 2.1 + q * 1.7 + vec2(t * 1.4, t * 0.3));
  // the threshold rises with scroll: the mist tears into banks and lifts away unevenly
  float thr = mix(-0.25, 1.0, uProg);
  float cover = smoothstep(thr - 0.28, thr + 0.16, n);
  float body = 0.5 + 0.5 * n;                              // denser where the noise peaks
  float a = clamp(cover * (0.62 + 0.5 * body), 0.0, 0.97);
  // the cursor wipes an organic hole; a lagging second blob drags a short trail behind it
  vec2 m = vec2(uMouse.x * asp, uMouse.y), tr = vec2(uTrail.x * asp, uTrail.y);
  float rough = 0.05 * n;
  float hole = smoothstep(0.07 + rough, 0.27 + rough * 2.0, distance(p, m));
  float hole2 = smoothstep(0.04 + rough, 0.2 + rough * 2.0, distance(p, tr));
  a *= mix(1.0, hole * (0.55 + 0.45 * hole2), uAmt);
  vec3 col = vec3(0.90, 0.935, 0.965) * (0.84 + 0.2 * n);   // cool white, a little shadowed in the thick banks
  gl_FragColor = vec4(col * a, a);
}`;

export function initMist(veil, section) {
  const canvas = document.createElement('canvas'); canvas.className = 'mist-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG); if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uRes', 'uTime', 'uProg', 'uMouse', 'uTrail', 'uAmt']) U[n] = gl.getUniformLocation(prog, n);
  gl.clearColor(0, 0, 0, 0);
  veil.prepend(canvas); veil.classList.add('has-mist');

  const hint = veil.querySelector('.veil-hint');
  const S = { prog: 0, mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, amt: 0, active: false };
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;       // mist is low-frequency: half resolution is invisible
    canvas.width = Math.max(2, Math.floor(veil.clientWidth * dpr)); canvas.height = Math.max(2, Math.floor(veil.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize(); window.addEventListener('resize', resize, { passive: true }); ScrollTrigger.addEventListener('refresh', resize);
  window.addEventListener('pointermove', (e) => {
    const r = veil.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    S.mx = (e.clientX - r.left) / r.width; S.my = 1 - (e.clientY - r.top) / r.height; S.amt = 1;
    veil.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`); veil.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
  }, { passive: true });
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => { S.active = self.isActive; } });

  gsap.ticker.add((time) => {
    if (!S.active || S.prog > 0.995) return;
    S.amt *= 0.985;                                                      // the hole lingers while the cursor rests, then heals
    S.tx += (S.mx - S.tx) * 0.06; S.ty += (S.my - S.ty) * 0.06;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uTime, time); gl.uniform1f(U.uProg, S.prog);
    gl.uniform2f(U.uMouse, S.mx, S.my); gl.uniform2f(U.uTrail, S.tx, S.ty); gl.uniform1f(U.uAmt, S.amt * (1 - S.prog));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // the same hole through the veil's backdrop blur, so the wiped patch is sharp as well as clear (radius matches the shader's)
    veil.style.setProperty('--mr', `${(0.3 * veil.clientHeight * S.amt * (1 - S.prog)).toFixed(0)}px`);
  });
  return { setProgress(p) { S.prog = p; if (hint) hint.style.opacity = String(Math.max(0, 1 - p * 3.2)); } };
}
