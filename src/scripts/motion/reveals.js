// src/scripts/motion/reveals.js — generic entrance system
import { gsap, ScrollTrigger, SplitText, reduced } from './core.js';

/** Line-masked text rises (SplitText with mask). Elements opt in with data-split. */
export function initSplitReveals(root = document) {
  root.querySelectorAll('[data-split]').forEach((el) => {
    if (reduced()) { el.classList.add('is-in'); return; }
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      aria: 'none',
      autoSplit: true,
      onSplit(self) {
        el.classList.add('is-in');
        const tw = gsap.from(self.lines, {
          yPercent: 110,
          rotate: 0.001,
          duration: 1.3,
          stagger: 0.09,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
        if (el.hasAttribute('data-split-exit')) {
          gsap.fromTo(el, { opacity: 1, y: 0 }, { opacity: 0, y: -24, ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: el, start: 'bottom 55%', end: 'bottom 5%', scrub: 0.5 } });
        }
        return tw;
      },
    });
  });
}

/** Plain fade-rise for blocks. Elements opt in with data-reveal. */
export function initBlockReveals(root = document) {
  const els = root.querySelectorAll('[data-reveal]');
  if (reduced()) { els.forEach((el) => el.classList.add('is-in')); return; }
  ScrollTrigger.batch(els, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      batch.forEach((el) => el.classList.add('is-in'));
      gsap.fromTo(batch, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out',
        clearProps: 'transform',
      });
    },
  });
}

/** Mono labels decode in (Igloo-style scramble). Elements opt in with data-scramble. */
export function initScrambles(root = document) {
  root.querySelectorAll('[data-scramble]').forEach((el) => {
    const final = el.textContent;
    if (reduced()) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(el, {
        duration: 0.4,
        scrambleText: { text: final, chars: '0123456789', speed: 1, revealDelay: 0.05 },
      }),
    });
  });
}

/** Numeric readouts count up. data-count="99.7" data-suffix="%" data-decimals="1". */
export function initCounters(root = document) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count ?? '0');
    const decimals = parseInt(el.dataset.decimals ?? '0', 10);
    const prefix = el.dataset.prefix ?? '';
    const suffix = el.dataset.suffix ?? '';
    const fmt = (v) => `${prefix}${v.toFixed(decimals)}${suffix}`;
    if (reduced()) { el.textContent = fmt(target); return; }
    el.textContent = fmt(0);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, { v: target, duration: 2.0, ease: 'expo.out', onUpdate: () => { el.textContent = fmt(o.v); } });
      },
    });
  });
}

/** Hairline rules draw themselves in. Elements opt in with data-rule. */
export function initRules(root = document) {
  const els = root.querySelectorAll('[data-rule]');
  if (reduced()) return;
  els.forEach((el) => {
    gsap.fromTo(el, { scaleX: 0, transformOrigin: 'left center' }, {
      scaleX: 1, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}
