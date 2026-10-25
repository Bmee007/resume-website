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
      const names = [s.dataset.lattice, s.dataset.latticeThen].filter((n) => n && n !== 'off');
      if (!names.length) return;
      if (i === 0) names.forEach((n) => lattice.ensure(n));
      else ScrollTrigger.create({ trigger: s, start: 'top 250%', once: true, onEnter: () => names.forEach((n) => lattice.ensure(n)) });
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
    const small = window.innerWidth < 900;
    // On phones the lattice becomes a crest behind the chapter mark unless a -sm value is given
    const pick = (d, key, fallback) => {
      const sm = d[`${key}Sm`];
      if (small && sm !== undefined) return parseFloat(sm);
      if (small && key === 'latticeCy') return 0.15;
      if (small && key === 'latticeCx') return 0.5;
      if (small && key === 'latticeScale') return 0.36;
      return d[key] !== undefined ? parseFloat(d[key]) : fallback;
    };
    let prev = { morph: 4, cx: 0.5, cy: 0.5, scale: 1, opacity: 1, rotX: 0.35, rotY: 0.6 };
    sections.forEach((s) => {
      if (!s.dataset.lattice) return;
      const d = s.dataset;
      const next = {
        morph: d.lattice === 'off' ? prev.morph : LATTICE_INDEX[d.lattice] ?? prev.morph,
        cx: pick(d, 'latticeCx', prev.cx),
        cy: pick(d, 'latticeCy', prev.cy),
        scale: pick(d, 'latticeScale', prev.scale),
        opacity: d.lattice === 'off' ? 0 : parseFloat(d.latticeOpacity ?? '1'),
        rotX: d.latticeRx !== undefined ? parseFloat(d.latticeRx) : prev.rotX,
        rotY: d.latticeRy !== undefined ? parseFloat(d.latticeRy) : prev.rotY,
      };
      gsap.fromTo(lattice.state, { ...prev }, {
        ...next, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: s, start: 'top 95%', end: 'top 30%', scrub: 0.9 },
      });
      prev = next;
      if (small && !d.latticeThen && next.opacity > 0) {
        // Phones: the object sits in a band above the text; fade it once the heading has scrolled past
        gsap.fromTo(lattice.state, { opacity: next.opacity }, {
          opacity: 0, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: s, start: 'top 10%', end: () => `+=${window.innerHeight * 0.45}`, scrub: 0.6 },
        });
        prev = { ...next, opacity: 0 };
      }
      // Optional second image inside the same chapter, reached as the reader scrolls on
      if (d.latticeThen && LATTICE_INDEX[d.latticeThen] !== undefined) {
        const then = {
          ...next,
          morph: LATTICE_INDEX[d.latticeThen],
          cx: d.latticeThenCx !== undefined && !small ? parseFloat(d.latticeThenCx) : next.cx,
          cy: small ? 0.13 : d.latticeThenCy !== undefined ? parseFloat(d.latticeThenCy) : next.cy,
          scale: small ? 0.34 : d.latticeThenScale !== undefined ? parseFloat(d.latticeThenScale) : next.scale,
          opacity: small ? Math.min(next.opacity, 0.45) : next.opacity,
          rotX: d.latticeThenRx !== undefined ? parseFloat(d.latticeThenRx) : next.rotX,
          rotY: d.latticeThenRy !== undefined ? parseFloat(d.latticeThenRy) : next.rotY,
        };
        gsap.fromTo(lattice.state, { ...next }, {
          ...then, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: s, start: 'top top', end: () => `+=${window.innerHeight * 0.6}`, scrub: 0.9 },
        });
        prev = then;
        if (small) {
          gsap.fromTo(lattice.state, { opacity: then.opacity }, {
            opacity: 0, ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: s, start: () => `top+=${window.innerHeight * 0.7} top`, end: () => `+=${window.innerHeight * 0.4}`, scrub: 0.6 },
          });
          prev = { ...then, opacity: 0 };
        }
      }
    });
  } else if (lattice && reduced()) {
    // Reduced motion: no scrubbing, but each chapter still gets its own pose (set instantly on entry)
    const small = window.innerWidth < 900;
    const poseOf = (s) => {
      const d = s.dataset; const key = d.latticeThen || d.lattice;
      return {
        morph: key === 'off' ? lattice.state.morph : LATTICE_INDEX[key] ?? lattice.state.morph,
        cx: small ? 0.5 : parseFloat(d.latticeThenCx ?? d.latticeCx ?? 0.5),
        cy: small ? 0.15 : parseFloat(d.latticeThenCy ?? d.latticeCy ?? 0.5),
        scale: small ? 0.36 : parseFloat(d.latticeThenScale ?? d.latticeScale ?? 1),
        opacity: key === 'off' ? 0 : Math.min(0.5, parseFloat(d.latticeOpacity ?? '1')),
        rotX: parseFloat(d.latticeThenRx ?? d.latticeRx ?? 0.35), rotY: parseFloat(d.latticeThenRy ?? d.latticeRy ?? 0.6),
      };
    };
    sections.filter((s) => s.dataset.lattice).forEach((s) => {
      ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 60%', onEnter: () => Object.assign(lattice.state, poseOf(s)), onEnterBack: () => Object.assign(lattice.state, poseOf(s)) });
    });
    if (sections[0]) Object.assign(lattice.state, poseOf(sections[0]));
  }

  // Phone bottom progress line
  const line = document.getElementById('progress-line');
  if (line && !reduced()) {
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
