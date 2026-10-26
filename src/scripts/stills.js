// src/scripts/stills.js — the phone story object.
// Pre-rendered stills (tools/render-stills.cjs) in place of Three.js + GLBs: same state contract as
// scene3d (morph / cx / cy / scale / opacity / intro / ink / glow), so the chapter director is unchanged.
// Crossfade between images with a soft blur so chapter changes still feel like a dissolve.

const STATES = ['truck', 'computer', 'warehouse', 'canada', 'brain'];

export function createStills(layer) {
  const imgs = {};
  for (const name of STATES) {
    const img = document.createElement('img');
    img.alt = ''; img.decoding = 'async'; img.className = 'still';
    img.dataset.src = `/models/still/${name}.webp`;
    layer.appendChild(img); imgs[name] = img;
  }
  const state = { morph: 4, rotY: 0.6, rotX: 0.35, tiltX: 0, tiltY: 0, scale: 1, opacity: 1, cx: 0.5, cy: 0.5, ink: [36, 46, 62], glow: 0, intro: 1, userX: 0, userY: 0, spinX: 0, spinY: 0 };
  let w = 1, h = 1;
  const resize = () => { w = layer.clientWidth || innerWidth; h = layer.clientHeight || innerHeight; };
  resize(); addEventListener('resize', resize, { passive: true });
  const loaded = new Set();
  function ensure(name) { const img = imgs[name]; if (!img || loaded.has(name)) return; loaded.add(name); img.src = img.dataset.src; }

  function render(t) {
    let si, sj, f;
    if (state.blend) { si = state.blend.a; sj = state.blend.b; f = Math.max(0, Math.min(1, state.blend.t)); if (si === sj) f = 0; }
    else { const m = Math.max(0, Math.min(STATES.length - 1, state.morph)); si = Math.floor(m); sj = Math.min(STATES.length - 1, si + 1); f = m - si; }
    const ease = f * f * (3 - 2 * f);
    const burst = Math.sin(ease * Math.PI);
    // Box the trimmed still so wide objects fill the width and tall ones the height
    const box = Math.min(w, h) * 0.92 * state.scale * state.intro;
    const x = state.cx * w, y = state.cy * h + Math.sin(t * 0.7) * 3;
    for (const name of STATES) {
      const img = imgs[name];
      let a = 0, s = 1;
      if (name === STATES[si]) { a = 1 - ease; s = 1 - burst * 0.08; }
      else if (name === STATES[sj] && sj !== si) { a = ease; s = 1 + (1 - ease) * 0.08; }
      const vis = a * state.opacity;
      if (vis < 0.01) { img.style.opacity = '0'; continue; }
      if (!loaded.has(name)) ensure(name);
      img.style.opacity = String(vis);
      img.style.filter = burst > 0.02 ? `blur(${(burst * 6).toFixed(1)}px) brightness(${1 + state.glow * 0.3})` : (state.glow > 0.02 ? `brightness(${1 + state.glow * 0.3})` : '');
      const ar = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1;
      const iw = ar >= 1 ? box * Math.min(1.18, Math.sqrt(ar)) : box * Math.sqrt(ar);
      const ih = iw / ar;
      img.style.transform = `translate(${(x - iw / 2).toFixed(1)}px, ${(y - ih / 2).toFixed(1)}px) scale(${s.toFixed(3)})`;
      img.style.width = `${iw.toFixed(0)}px`;
    }
  }
  return { render, state, STATES, ensure, screenBounds: () => null, isStills: true };
}
