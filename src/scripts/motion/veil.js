// src/scripts/motion/veil.js — "Let's clear the fog." The Contact chapter opens under a dense veil of
// mist that thins as the reader scrolls in, uncovering the section; the WebGL fog behind it thickens
// and clears in step. Reduced motion: no veil.
import { gsap, reduced } from './core.js';
import { getFog } from './backdrop.js';

export function initVeil() {
  const veil = document.querySelector('.fog-veil');
  if (!veil) return;
  if (reduced()) { veil.style.display = 'none'; return; }
  const section = veil.closest('section');
  const fog = getFog();
  const boost = (p) => fog?.setDensityBoost?.((1 - p) * 0.9);
  gsap.fromTo(veil, { opacity: 1 }, {
    opacity: 0, ease: 'power2.in',
    scrollTrigger: {
      trigger: section, start: 'top 88%', end: 'top 12%', scrub: 0.5,
      onUpdate: (st) => boost(st.progress),
      onLeaveBack: () => boost(1),
    },
  });
}
