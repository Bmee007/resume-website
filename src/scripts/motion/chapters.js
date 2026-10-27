// src/scripts/motion/chapters.js — the scene director.
// Each <section data-scene data-tone data-lattice> drives: fog palette, html tone,
// lattice morph/position, the progress rail, and a glitch pulse on entry.
import { gsap, ScrollTrigger, reduced } from './core.js';
import { getFog, getLattice, glitchPulse, setLatticeInk } from './backdrop.js';
import { LATTICE_INDEX } from '../states.js';

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

  // Spacer zones (phones) preload their model a couple of screens ahead too
  if (lattice && lattice.ensure) document.querySelectorAll('[data-zone-model]').forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 220%', once: true, onEnter: () => lattice.ensure(el.dataset.zoneModel) }));

  // Model assets: the first chapter's model now, the rest when their chapter is within ~1.5 screens
  if (lattice && lattice.ensure) {
    sections.forEach((s, i) => {
      const names = [s.dataset.lattice, window.innerWidth < 900 ? null : s.dataset.latticeThen].filter((n) => n && n !== 'off');
      if (!names.length) return;
      if (i === 0) names.forEach((n) => lattice.ensure(n));
      else ScrollTrigger.create({ trigger: s, start: window.innerWidth < 900 ? 'top 130%' : 'top 250%', once: true, onEnter: () => names.forEach((n) => lattice.ensure(n)) });
    });
  }

  // Tone / fog / rail follow whichever chapter covers the viewport's midline, in both scroll directions.
  // (Per-section enter/leave triggers flipped the tone light on the way back while the dark Work
  // track still filled most of the screen; a midline rule has no direction.)
  let current = null;
  const syncTone = () => {
    const mid = window.innerHeight * 0.5;
    let s = sections[0];
    for (const c of sections) { const r = c.getBoundingClientRect(); if (r.top <= mid) s = c; }
    if (s !== current) { const first = current === null; current = s; applyChapter(s, !first); }
  };
  syncTone();
  gsap.ticker.add(syncTone);
  ScrollTrigger.addEventListener('refresh', syncTone);

  // Lattice choreography: explicit from/to per section so fast scrolling can't desync
  if (lattice && !reduced()) {
    // One driver owns the story object. On every scroll update it picks the chapter whose top has crossed
    // that chapter's own entry line (derived from where its object sits, so the object never assembles
    // over the previous chapter's text), assembles the object in place, and dissolves it from the
    // chapter's own exit edge. No per-chapter tweens, so order of updates and fast jumps cannot desync it.
    const small = window.innerWidth < 900;
    const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;
    const num = (v, f) => (v !== undefined ? parseFloat(v) : f);
    const chapters = [];
    let prev = { morph: 4, cx: small ? 0.5 : 0.62, cy: small ? 0.3 : 0.46, scale: small ? 0.86 : 0.78, rotX: 0.3, rotY: 0.5, opacity: 1 };
    sections.forEach((s) => {
      const d = s.dataset; if (!d.lattice) return;
      const off = d.lattice === 'off';
      const pose = (name, cx, cy, sc, rx, ry, op) => ({ morph: LATTICE_INDEX[name] ?? prev.morph, cx, cy, scale: sc, rotX: rx, rotY: ry, opacity: op });
      const next = off ? { ...prev, opacity: 0 }
        : small ? pose(d.lattice, num(d.latticeCxSm, 0.5), num(d.latticeCySm, 0.3), num(d.latticeScaleSm, 0.82), num(d.latticeRx, prev.rotX), num(d.latticeRy, prev.rotY), 0.92)
        : pose(d.lattice, num(d.latticeCx, prev.cx), num(d.latticeCy, prev.cy), num(d.latticeScale, prev.scale), num(d.latticeRx, prev.rotX), num(d.latticeRy, prev.rotY), num(d.latticeOpacity, 1));
      const then = !small && !off && d.latticeThen && LATTICE_INDEX[d.latticeThen] !== undefined
        ? pose(d.latticeThen, num(d.latticeThenCx, next.cx), num(d.latticeThenCy, next.cy), num(d.latticeThenScale, next.scale), num(d.latticeThenRx, next.rotX), num(d.latticeThenRy, next.rotY), next.opacity)
        : null;
      // entry line: the chapter's top must have risen past the object's top edge (in viewport heights)
      // entry line in viewport heights; data-lattice-enter overrides the derived one (e.g. to wait for a heading to pass)
      const e0 = off ? 0.25 : d.latticeEnter !== undefined ? Math.max(0.05, Math.min(0.95, parseFloat(d.latticeEnter))) : Math.max(0.12, Math.min(0.95, next.cy - next.scale * 0.33));
      const e1 = Math.max(0, e0 - (!off && next.opacity < 0.7 ? 0.1 : 0.2)); // ghosts finish assembling sooner, so they are formed when the headline lands
      // data-lattice-then-at="<selector>": the second model assembles as that element rises into view
      const thenAt = then && d.latticeThenAt ? s.querySelector(d.latticeThenAt) : null;
      // exit line (viewport heights past the chapter top): data-lattice-exit overrides the ghost/hero rules
      const exitAt = d.latticeExit !== undefined ? parseFloat(d.latticeExit) : null;
      chapters.push({ el: s, next, then, thenAt, e0, e1, exitAt, ghost: !off && next.opacity < 0.7 });
      prev = then || next;
    });
    // Phones: each object lives in its own zone (a chapter's top padding, or a [data-zone-model] spacer) and scrolls with it.
    // The zone closest to the viewport's upper-middle owns the object, which assembles as the zone arrives and shatters as it leaves.
    const zones = [];
    const zoneOf = (el, name, own) => ({ el, name, own, morph: LATTICE_INDEX[name] ?? 0, pad: 0,
      scale: num(el.dataset.latticeScaleSm ?? el.dataset.zoneScale, 0.82), rx: num(el.dataset.latticeRx ?? el.dataset.zoneRx, 0.3), ry: num(el.dataset.latticeRy ?? el.dataset.zoneRy, 0.5) });
    if (small) {
      sections.forEach((s) => { if (s.dataset.lattice && s.dataset.lattice !== 'off') zones.push(zoneOf(s, s.dataset.lattice, false)); });
      document.querySelectorAll('[data-zone-model]').forEach((el) => zones.push(zoneOf(el, el.dataset.zoneModel, true)));
    }
    const measureZones = () => zones.forEach((z) => { if (!z.own) z.pad = parseFloat(getComputedStyle(z.el).paddingTop) || 0; });
    const phoneUpdate = () => {
      const vh = window.innerHeight; const target = 0.4 * vh;
      let best = null, bd = Infinity;
      for (const z of zones) {
        const r = z.el.getBoundingClientRect(); const cy = z.own ? r.top + r.height / 2 : r.top + z.pad / 2;
        const d = Math.abs(cy - target); if (d < bd) { bd = d; best = { z, cy }; }
      }
      if (!best) return;
      const vis = 1 - smooth((bd / vh - 0.3) / 0.35);               // fully formed within 0.3vh of the sweet spot, gone beyond 0.65vh
      const st = lattice.state;
      st.blend = { a: best.z.morph, b: best.z.morph, t: 0 }; st.assemble = vis;
      st.cx = 0.5; st.cy = best.cy / vh; st.scale = best.z.scale; st.rotX = best.z.rx; st.rotY = best.z.ry;
      st.opacity = vis > 0.001 ? 0.92 : 0;
    };
    const update = () => {
      if (small) { phoneUpdate(); return; }
      const vh = window.innerHeight;
      let owner = chapters[0];
      for (const ch of chapters) { if (ch.el.getBoundingClientRect().top / vh < ch.e0) owner = ch; }
      const r = owner.el.getBoundingClientRect(); const top = r.top / vh, bottom = r.bottom / vh;
      const { next, then, thenAt, e0, e1, exitAt, ghost } = owner;
      const tIn = smooth((e0 - top) / (e0 - e1));
      const tThen = !then ? 0
        : thenAt ? smooth((0.85 - thenAt.getBoundingClientRect().top / vh) / 0.45)        // keyed element: 85vh → 40vh
        : smooth((0 - top) / 0.6);                                                        // else chapter top → −60vh
      const tOut = owner === chapters[chapters.length - 1] ? 0
        : (exitAt !== null && !small) ? smooth((-top - exitAt) / 0.3)                    // chapter-specified exit line
        : ((ghost && !then) || small) ? smooth((-top - (small ? 0.1 : 0.2)) / 0.3)       // single-model ghosts (and phones) leave once the heading has passed
        : smooth((0.6 - bottom) / 0.35);                                                  // hero-size objects leave with the chapter's last content
      const st = lattice.state;
      if (then && tThen > 0) {
        st.blend = { a: next.morph, b: then.morph, t: tThen }; st.assemble = 1;
        st.cx = lerp(next.cx, then.cx, tThen); st.cy = lerp(next.cy, then.cy, tThen); st.scale = lerp(next.scale, then.scale, tThen);
        st.rotX = lerp(next.rotX, then.rotX, tThen); st.rotY = lerp(next.rotY, then.rotY, tThen);
        st.opacity = lerp(next.opacity, then.opacity, tThen) * (1 - tOut);
      } else {
        st.blend = { a: next.morph, b: next.morph, t: 0 }; st.assemble = tIn;
        st.cx = next.cx; st.cy = next.cy; st.scale = next.scale; st.rotX = next.rotX; st.rotY = next.rotY;
        st.opacity = next.opacity * tIn * (1 - tOut);
      }
    };
    // The dark chapters' scrim has a soft hole around the story object (see global.css); keep it on the object
    const darkSecs = sections.filter((s) => s.dataset.tone === 'dark');
    const punchHoles = () => {
      if (!darkSecs.length) return;
      const st = lattice.state; const w = window.innerWidth, h = window.innerHeight;
      const r = lattice.isStills ? Math.min(w, h) * 0.92 * st.scale * 0.58 : Math.min(w, h) * 0.3 * st.scale * 1.2 * (h > 0 ? 1 : 1);
      const a = Math.max(0, Math.min(1, st.opacity * (st.assemble ?? 1)));
      const x = st.cx * w, y = st.cy * h;
      for (const s of darkSecs) {
        const top = s.getBoundingClientRect().top;
        s.style.setProperty('--ox', `${x.toFixed(0)}px`); s.style.setProperty('--oy', `${(y - top).toFixed(0)}px`);
        s.style.setProperty('--or', `${r.toFixed(0)}px`); s.style.setProperty('--oa', a.toFixed(3));
      }
    };
    // Drive from the ticker (not a scroll-bounded trigger, whose updates stop once scrolled past its end)
    let lastY = -1, lastH = -1;
    gsap.ticker.add(() => { if (window.scrollY !== lastY || window.innerHeight !== lastH) { lastY = window.scrollY; lastH = window.innerHeight; update(); punchHoles(); } });
    ScrollTrigger.addEventListener('refresh', () => { measureZones(); update(); punchHoles(); });
    measureZones(); update(); punchHoles();
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
