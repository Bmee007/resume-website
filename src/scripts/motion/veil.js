// src/scripts/motion/veil.js — "Let's clear the fog." The Contact chapter opens under a thick noise-driven mist (mist.js). Scrolling in thins
// it; wiping the cursor through it clears it for good (or it lifts on its own after a few seconds). The WebGL fog behind it follows.
// Without WebGL, a CSS veil fades with scroll instead. Reduced motion: no veil.
import { gsap, ScrollTrigger, reduced } from './core.js';
import { getFog } from './backdrop.js';
import { initMist } from './mist.js';

export function initVeil() {
  const veil = document.querySelector('.fog-veil');
  if (!veil) return;
  if (reduced()) { veil.style.display = 'none'; return; }
  const section = veil.closest('section');
  const fog = getFog();
  // 0 = thick mist, 1 = clear: drives the fog density and the dawn bloom behind the headline (--clear)
  const boost = (p) => { fog?.setDensityBoost?.((1 - p) * 0.9); section.style.setProperty('--clear', Math.max(0, Math.min(1, p)).toFixed(3)); };
  const mist = initMist(veil, section, { onShown: boost });
  if (mist) {
    ScrollTrigger.create({ trigger: section, start: 'top 88%', end: 'top 12%', onUpdate: (st) => mist.setProgress(st.progress), onLeaveBack: () => { mist.setProgress(0); boost(0); } });
    return;
  }
  // fallback: the CSS veil, thinned by scroll
  gsap.fromTo(veil, { '--vb': '22px' }, { '--vb': '0px', ease: 'power1.in', scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 25%', scrub: 0.5 } });
  gsap.fromTo(veil, { opacity: 1 }, { opacity: 0, ease: 'power2.in', scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 12%', scrub: 0.5, onUpdate: (st) => boost(st.progress), onLeaveBack: () => boost(1) } });
}
