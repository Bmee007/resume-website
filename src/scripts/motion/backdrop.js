// src/scripts/motion/backdrop.js — fog shader + lattice, one shared RAF
import { gsap, finePointer } from './core.js';
import { createFog } from '../fog.js';

let fog = null;
let lattice = null;

export async function initBackdrop() {
  const fogCanvas = document.getElementById('fog-canvas');
  const latCanvas = document.getElementById('lattice-canvas');
  if (fogCanvas) fog = createFog(fogCanvas);
  // Phones: pre-rendered stills, no Three.js and no GLBs (≈3 MB saved). Desktop: the live 3D scene.
  const small = window.innerWidth < 900;
  try {
    if (small) {
      const { createStills } = await import('../stills.js');
      lattice = createStills(document.getElementById('lattice-labels'));
      document.body.classList.add('is-stills');
    } else if (latCanvas) {
      const { createScene } = await import('../scene3d.js');
      lattice = createScene(latCanvas, document.getElementById('lattice-labels'));
    }
  } catch (e) { console.error('[backdrop] story object', e); lattice = null; }
  if (fog) document.body.classList.add('has-webgl');
  window.__lattice = lattice; // review hook (harmless in production)

  gsap.ticker.add((time) => {
    if (fog) fog.render(time);
    if (lattice) lattice.render(time);
  });

  // Mouse parallax (fine pointers only; touch gets the breathing drift)
  if (finePointer()) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      if (fog) fog.setMouse(x, -y);
      if (lattice) { lattice.state.tiltX = x; lattice.state.tiltY = y; }
    }, { passive: true });
  }

  // Drag the story object: hover shows a DRAG cursor, dragging spins it with inertia
  if (lattice) initDrag();

  // Pause rendering when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (!fog) return;
    document.hidden ? fog.pause() : fog.resume();
  });

  return { fog, lattice };
}

export function getFog() { return fog; }
export function getLattice() { return lattice; }

/** Chromatic-aberration pulse on the fog + bloom on the lattice. */
export function glitchPulse(strength = 1) {
  if (!fog) return;
  const main = document.querySelector('main');
  if (main) { main.classList.add('is-glitching'); setTimeout(() => main.classList.remove('is-glitching'), 420); }
  const o = { v: strength };
  gsap.to(o, {
    v: 0, duration: 0.9, ease: 'expo.out',
    onUpdate: () => { fog.glitch(o.v); if (lattice) lattice.state.glow = o.v * 0.8; },
  });
}

/** Lattice ink follows the chapter tone so it stays legible on light and dark fog. */
export function setLatticeInk(tone) {
  if (!lattice) return;
  const target = tone === 'dark' ? [226, 232, 240] : [36, 46, 62];
  gsap.to(lattice.state.ink, { 0: target[0], 1: target[1], 2: target[2], duration: 1.2, ease: 'power2.out' });
}


function initDrag() {
  const over = (x, y) => {
    const b = lattice.screenBounds && lattice.screenBounds();
    if (!b) return false;
    const dx = x - b.x, dy = y - b.y;
    return dx * dx + dy * dy < b.r * b.r;
  };
  let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0;
  const body = document.body;
  window.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      vx = dx * (e.pointerType === 'touch' ? 0.009 : 0.006); vy = dy * 0.004;
      lattice.state.userY += vx; lattice.state.userX += vy;
      lattice.state.spinY = 0; lattice.state.spinX = 0;
      return;
    }
    // only when the pointer isn't over interactive content
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const onUi = el && el.closest('a, button, input, textarea, p, h1, h2, h3, li, dl, figure, .console, .fig, .dc-roster, .ledger, .timeline, .syllabus, .work-track, .t-mono');
    body.classList.toggle('can-drag', !onUi && over(e.clientX, e.clientY));
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const onUi = el && el.closest('a, button, input, textarea, .console, .fig, .dc-roster, .ledger, .timeline, .syllabus, .work-track');
      if (onUi || !over(e.clientX, e.clientY)) return;
    } else if (!body.classList.contains('can-drag') || e.button !== 0) return;
    dragging = true; lx = e.clientX; ly = e.clientY; vx = vy = 0;
    body.classList.add('is-dragging', 'has-dragged');
  });
  const end = () => {
    if (!dragging) return;
    dragging = false; body.classList.remove('is-dragging', 'can-drag');
    lattice.state.spinY = vx; lattice.state.spinX = vy; // fling
  };
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end); window.addEventListener('blur', end);
}
