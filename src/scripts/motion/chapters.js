// src/scripts/motion/chapters.js — the scene director.
// Each <section data-scene data-tone data-lattice> drives: fog palette, html tone,
// lattice morph/position, the progress rail, and a glitch pulse on entry.
import { gsap, ScrollTrigger, reduced } from './core.js';
import { getFog, getLattice, glitchPulse, setLatticeInk } from './backdrop.js';

const LATTICE_INDEX = { truck: 0, computer: 1, warehouse: 2, canada: 3, brain: 4 };

export function initChapters() {
  const sections = Array.from(document.querySelectorAll('section[data-scene]'));
  const fog = getFog();
  const lattice = getLattice();
  const html = document.documentElement;
  const railNum = document.getElementById('rail-num');
  const railLabel = document.getElementById('rail-label');
  const railFill = document.getElementById('rail-fill');

  const applyChapter = (s, pulse) => {
    const tone = s.dataset.tone || 'light';
    html.dataset.tone = tone;
    fog?.setScene(s.dataset.scene);
    setLatticeInk(tone);
    if (pulse && !reduced()) glitchPulse(0.55);
    if (railNum && s.dataset.chapter !== undefined) {
      if (reduced()) railNum.textContent = s.dataset.chapter;
      else gsap.to(railNum, { duration: 0.35, scrambleText: { text: s.dataset.chapter, chars: '0123456789', speed: 1 } });
    }
    if (railLabel && s.dataset.label !== undefined) {
      if (reduced()) railLabel.textContent = s.dataset.label;
      else gsap.to(railLabel, { duration: 0.4, scrambleText: { text: s.dataset.label, chars: '0123456789', speed: 1 } });
    }
    document.querySelectorAll('.nav-link, .rail-dot').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === `#${s.id}`);
    });
  };

  // Model assets: the first chapter's model now, the rest when their chapter is within ~1.5 screens
  if (lattice && lattice.ensure) {
    sections.forEach((s, i) => {
      const names = [s.dataset.lattice, window.innerWidth < 900 ? null : s.dataset.latticeThen].filter((n) => n && n !== 'off');
      if (!names.length) return;
      if (i === 0) names.forEach((n) => lattice.ensure(n));
      else ScrollTrigger.create({ trigger: s, start: window.innerWidth < 900 ? 'top 130%' : 'top 250%', once: true, onEnter: () => names.forEach((n) => lattice.ensure(n)) });
    });
  }

  sections.forEach((s, i) => {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => applyChapter(s, i > 0),
      onEnterBack: () => applyChapter(s, true),
    });
  });
  // Initial state without a pulse
  if (sections[0]) applyChapter(sections[0], false);

  // Lattice choreography: explicit from/to per section so fast scrolling can't desync
  if (lattice && !reduced()) {
    // Every chapter owns the object while it is on screen. Pose, blend and opacity are computed from the
    // section's position on each update, so fast scrolls and jumps can never leave a stale state behind,
    // and a blend goes straight from the previous model to the next (never through the ones between).
    const small = window.innerWidth < 900;
    const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;
    const num = (v, f) => (v !== undefined ? parseFloat(v) : f);
    let prev = { morph: 4, cx: small ? 0.5 : 0.62, cy: small ? 0.3 : 0.46, scale: small ? 0.86 : 0.78, rotX: 0.3, rotY: 0.5, opacity: 1 };
    let prevOff = false;
    sections.forEach((s) => {
      const d = s.dataset; if (!d.lattice) return;
      const off = d.lattice === 'off';
      const pose = (name, cx, cy, sc, rx, ry, op) => ({ morph: LATTICE_INDEX[name] ?? prev.morph, cx, cy, scale: sc, rotX: rx, rotY: ry, opacity: op });
      const next = off
        ? { ...prev, opacity: 0 }
        : small
          ? pose(d.lattice, num(d.latticeCxSm, 0.5), num(d.latticeCySm, 0.3), num(d.latticeScaleSm, 0.82), num(d.latticeRx, prev.rotX), num(d.latticeRy, prev.rotY), 0.92)
          : pose(d.lattice, num(d.latticeCx, prev.cx), num(d.latticeCy, prev.cy), num(d.latticeScale, prev.scale), num(d.latticeRx, prev.rotX), num(d.latticeRy, prev.rotY), num(d.latticeOpacity, 1));
      // optional second model inside the chapter (desktop only)
      const then = !small && !off && d.latticeThen && LATTICE_INDEX[d.latticeThen] !== undefined
        ? pose(d.latticeThen, num(d.latticeThenCx, next.cx), num(d.latticeThenCy, next.cy), num(d.latticeThenScale, next.scale), num(d.latticeThenRx, next.rotX), num(d.latticeThenRy, next.rotY), next.opacity)
        : null;
      const from = prev, afterOff = prevOff;
      ScrollTrigger.create({
        trigger: s, start: 'top 100%', end: 'bottom bottom', // exactly one owner at any scroll position
        onUpdate: () => {
          const vh = window.innerHeight, top = s.getBoundingClientRect().top / vh; // in viewport heights
          // enter window: phones wait for the object band to arrive; after an 'off' chapter (the pinned work
          // track) wait until the previous content has left so nothing is drawn over it
          const [e0, e1] = small ? [0.45, 0.08] : afterOff ? [0.35, 0.05] : [0.95, 0.3];
          const tIn = smooth((e0 - top) / (e0 - e1));
          const tThen = then ? smooth((0 - top) / 0.6) : 0;          // top → −60vh
          const tOut = small ? smooth((-top - 0.1) / 0.3) : 0;        // phones: leave while top travels −10vh → −40vh
          const target = then && tThen > 0 ? then : next;
          const base = then && tThen > 0 ? next : from;
          const t = then && tThen > 0 ? tThen : tIn;
          const st = lattice.state;
          st.blend = { a: base.morph, b: target.morph, t };
          st.cx = lerp(base.cx, target.cx, t); st.cy = lerp(base.cy, target.cy, t); st.scale = lerp(base.scale, target.scale, t);
          st.rotX = lerp(base.rotX, target.rotX, t); st.rotY = lerp(base.rotY, target.rotY, t);
          st.opacity = lerp(base.opacity, target.opacity, t) * (1 - tOut);
        },
      });
      prev = then || next; prevOff = off;
    });
    if (small) {
      const line = document.getElementById('progress-line');
      if (line) gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
    }
  } else if (lattice && reduced()) {
    // Reduced motion: no scrubbing, but each chapter still gets its own pose (set instantly on entry)
    const small = window.innerWidth < 900;
    const poseOf = (s) => {
      const d = s.dataset; const key = d.latticeThen || d.lattice;
      return {
        morph: key === 'off' ? lattice.state.morph : LATTICE_INDEX[key] ?? lattice.state.morph,
        cx: small ? 0.5 : parseFloat(d.latticeThenCx ?? d.latticeCx ?? 0.5),
        cy: small ? 0.3 : parseFloat(d.latticeThenCy ?? d.latticeCy ?? 0.5),
        scale: small ? 0.82 : parseFloat(d.latticeThenScale ?? d.latticeScale ?? 1),
        opacity: key === 'off' ? 0 : small ? 0.9 : Math.min(0.5, parseFloat(d.latticeOpacity ?? '1')),
        rotX: parseFloat(d.latticeThenRx ?? d.latticeRx ?? 0.35), rotY: parseFloat(d.latticeThenRy ?? d.latticeRy ?? 0.6),
      };
    };
    sections.filter((s) => s.dataset.lattice).forEach((s) => {
      ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 60%', onEnter: () => Object.assign(lattice.state, poseOf(s)), onEnterBack: () => Object.assign(lattice.state, poseOf(s)) });
    });
    if (sections[0]) Object.assign(lattice.state, poseOf(sections[0]));
  }

  // Desktop keeps the rail; the phone branch above owns the bottom line
  const line = window.innerWidth >= 900 ? null : document.getElementById('progress-line');
  if (line && reduced()) {
    gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
  }

  // Progress rail fill
  if (railFill) {
    gsap.fromTo(railFill, { scaleY: 0, transformOrigin: 'top' }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });
  }
}
