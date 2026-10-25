// src/scripts/motion/charts.js — scroll-in reveal for the Lieflat-style figures.
// Beads/dots pop (12ms stagger), rungs grow (fast → slow), tracks draw. Quartic-out, no bounce.
import { gsap, ScrollTrigger, reduced } from './core.js';

export function initCharts(root = document) {
  const figs = root.querySelectorAll('[data-chart]');
  figs.forEach((fig) => {
    if (reduced()) { fig.classList.add('is-in'); return; }
    const pops = fig.querySelectorAll('.c-pop');
    const grows = fig.querySelectorAll('.c-grow');
    const rises = fig.querySelectorAll('.c-rise');
    const draws = fig.querySelectorAll('.c-draw');
    const vals = fig.querySelectorAll('.c-val');
    // empty NodeLists make GSAP warn, so guard each group
    if (pops.length) gsap.set(pops, { scale: 0, transformOrigin: 'center' });
    if (grows.length) gsap.set(grows, { scaleX: 0, transformOrigin: 'left center' });
    if (rises.length) gsap.set(rises, { scaleY: 0, transformOrigin: 'center bottom' });
    if (vals.length) gsap.set(vals, { opacity: 0 });
    draws.forEach((el) => { const len = el.getTotalLength ? el.getTotalLength() : 600; gsap.set(el, { strokeDasharray: len, strokeDashoffset: len }); });

    ScrollTrigger.create({
      trigger: fig, start: 'top 85%', once: true,
      onEnter: () => {
        fig.classList.add('is-in');
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        if (draws.length) tl.to(draws, { strokeDashoffset: 0, duration: 1.1, stagger: 0.08 }, 0);
        if (rises.length) tl.to(rises, { scaleY: 1, duration: 0.6, stagger: 0.008 }, 0.1);
        if (grows.length) tl.to(grows, { scaleX: 1, duration: 0.55, stagger: 0.03 }, 0.1);
        if (pops.length) tl.to(pops, { scale: 1, duration: 0.5, stagger: 0.012 }, 0.2);
        if (vals.length) tl.to(vals, { opacity: 1, duration: 0.6, stagger: 0.05 }, 0.7);
      },
    });
  });
}
