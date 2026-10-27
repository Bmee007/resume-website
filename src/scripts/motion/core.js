// src/scripts/motion/core.js — shared GSAP + Lenis setup
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Flip);

export { gsap, ScrollTrigger, SplitText, Flip };
if (typeof window !== 'undefined') window.__ST = ScrollTrigger; // review hook

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(pointer: fine)').matches;
export const SCRAMBLE_CHARS = '0123456789/·—ABCDEFXZ';

let lenis = null;

export function initLenis() {
  if (lenis || reduced()) return lenis;
  lenis = new Lenis({
    duration: 1.25,
    easing: (t) => 1 - Math.pow(1 - t, 4), // quart out: physical deceleration, no overshoot
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis() { return lenis; }

/** Smooth-scroll to a hash target; falls back to native scrolling. */
export function scrollToHash(hash, opts = {}) {
  const el = document.querySelector(hash);
  if (!el) return;
  window.__navHoldUntil = performance.now() + 2200;   // the nav stays visible while an anchor jump glides (see Nav.astro)
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6, ...opts });
  else el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
}

/** Wire every in-page anchor to Lenis so nav clicks glide instead of jump. */
export function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') { e.preventDefault(); if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0 }); return; }
      if (!document.querySelector(hash)) return;
      e.preventDefault();
      history.replaceState(null, '', hash);
      scrollToHash(hash);
    });
  });
}
