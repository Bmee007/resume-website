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
  // the mist banks part: left and right blobs slide out, the lower one sinks, while the whole veil thins
  const parts = [['.veil-a', '-42vw', '-6vh'], ['.veil-b', '42vw', '-4vh'], ['.veil-c', '0vw', '30vh']];
  parts.forEach(([sel, vx, vy]) => {
    const el = veil.querySelector(sel); if (!el) return;
    gsap.fromTo(el, { '--vx': '0vw', '--vy': '0vh' }, { '--vx': vx, '--vy': vy, ease: 'power2.inOut', scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 5%', scrub: 0.6 } });
  });
  gsap.fromTo(veil, { opacity: 1 }, {
    opacity: 0, ease: 'power2.in',
    scrollTrigger: {
      trigger: section, start: 'top 88%', end: 'top 12%', scrub: 0.5,
      onUpdate: (st) => boost(st.progress),
      onLeaveBack: () => boost(1),
    },
  });
}
