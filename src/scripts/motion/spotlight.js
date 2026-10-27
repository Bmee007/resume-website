// src/scripts/motion/spotlight.js — cursor-following light on the case-study cards and skills grid.
// Sets --sx / --sy (px inside the element) while a fine pointer is over it; CSS draws the light. No-op for touch and reduced motion.
import { reduced } from './core.js';

export function initSpotlight() {
  if (reduced() || !window.matchMedia('(pointer: fine)').matches) return;
  const attach = (el) => {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', `${(e.clientX - r.left).toFixed(0)}px`); el.style.setProperty('--sy', `${(e.clientY - r.top).toFixed(0)}px`);
      });
    }, { passive: true });
    el.addEventListener('pointerleave', () => el.style.removeProperty('--sx'));
  };
  document.querySelectorAll('.case-panel, .spec-col, .timeline-entry').forEach(attach);
}
