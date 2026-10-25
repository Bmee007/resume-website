// src/scripts/motion/magnetic.js — buttons lean toward the pointer, settle with expo (no elastic)
import { gsap, finePointer, reduced, SCRAMBLE_CHARS } from './core.js';

export function initMagnetic() {
  if (!finePointer() || reduced()) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || '0.3');
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength;
      const dy = (e.clientY - (r.top + r.height / 2)) * strength;
      gsap.to(el, { x: dx, y: dy, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'expo.out' });
    });
  });
}


/** Nav labels decode on hover (Igloo-style), once per entry. */
export function initNavScramble() {
  if (!finePointer() || reduced()) return;
  document.querySelectorAll('.nav-txt').forEach((el) => {
    const text = el.dataset.text || el.textContent;
    let tw = null;
    el.closest('a')?.addEventListener('mouseenter', () => {
      if (tw) tw.kill();
      tw = gsap.to(el, { duration: 0.6, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.7 } });
    });
  });
}
