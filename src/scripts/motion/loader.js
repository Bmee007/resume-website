// src/scripts/motion/loader.js — calibration counter + self-drawing mark, then the entry gate
import { gsap, reduced, getLenis, SCRAMBLE_CHARS } from './core.js';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { getLattice, getFog } from './backdrop.js';
import { setAmbient } from './ambient.js';

gsap.registerPlugin(DrawSVGPlugin);

export function runLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return Promise.resolve();

  const num = loader.querySelector('.loader-num');
  const label = loader.querySelector('.loader-label');
  const marks = loader.querySelectorAll('.loader-mark .mk');
  const gate = loader.querySelector('.loader-enter');
  const lattice = getLattice();
  const fog = getFog();
  const lenis = getLenis();
  lenis?.stop();

  if (reduced()) {
    loader.remove();
    document.body.classList.add('loaded');
    lenis?.start();
    return Promise.resolve();
  }

  let seen = false, audioPref = null;
  try { seen = sessionStorage.getItem('bk-seen') === '1'; audioPref = sessionStorage.getItem('bk-audio'); sessionStorage.setItem('bk-seen', '1'); } catch { /* storage blocked */ }

  if (lattice) { lattice.state.intro = 0.55; lattice.state.opacity = 0.0; }
  if (fog) fog.state.density = 1;
  gsap.set(marks, { drawSVG: '0%' });

  return new Promise((resolve) => {
    const o = { v: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    tl.timeScale(seen ? 2.2 : 1.45); // ~1.6 s to the choice on a first visit
    tl.to(o, { v: 100, duration: 1.5, ease: 'power3.inOut', onUpdate: () => { if (num) num.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .to(marks, { drawSVG: '100%', duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0.1)
      .to(label, { duration: 1.0, scrambleText: { text: 'SYSTEMS ONLINE', chars: SCRAMBLE_CHARS, speed: 0.4 } }, 0.6)
      .to(document.querySelector('.loader-corner--bl span') || {}, { duration: 0.8, scrambleText: { text: 'Systems ready', chars: SCRAMBLE_CHARS, speed: 0.5 } }, 1.2);   // the corner no longer says "loading" once the gate is ready

    const enter = (withSound) => {
      setAmbient(withSound);
      if (gate) gate.hidden = true;
      const out = gsap.timeline();
      out.to(label, { duration: 0.6, scrambleText: { text: withSound ? 'ENTERING · SOUND ON' : 'ENTERING', chars: SCRAMBLE_CHARS, speed: 0.6 } }, 0)
        .to(lattice ? lattice.state : {}, { opacity: 1, intro: 1, duration: 1.6, ease: 'expo.out' }, 0.1)
        .to(loader, { clipPath: 'inset(100% 0 0 0)', duration: 1.0, ease: 'expo.inOut', onStart: resolve }, 0.35)
        .add(() => { loader.remove(); document.body.classList.add('loaded'); lenis?.start(); });
    };

    tl.add(() => {
      // Returning visitors in this session skip the question and keep their choice
      if (seen && audioPref !== null) { enter(audioPref === '1'); return; }
      if (gate) { gate.hidden = false; gsap.from(gate.children, { opacity: 0, y: 10, duration: 0.7, stagger: 0.1, ease: 'expo.out' }); }
      loader.querySelector('#enter-sound')?.addEventListener('click', () => enter(true), { once: true });
      loader.querySelector('#enter-silent')?.addEventListener('click', () => enter(false), { once: true });
    });
  });
}
