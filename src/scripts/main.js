// src/scripts/main.js — boot sequence
import { ScrollTrigger, initLenis, initAnchorLinks, reduced } from './motion/core.js';
import { initBackdrop } from './motion/backdrop.js';
import { runLoader } from './motion/loader.js';
import { initHero } from './motion/hero.js';
import { initChapters } from './motion/chapters.js';
import { initSplitReveals, initBlockReveals, initScrambles, initCounters, initRules } from './motion/reveals.js';
import { initMagnetic, initNavScramble } from './motion/magnetic.js';
import { initWork } from './motion/work.js';
import { initCharts } from './motion/charts.js';
import { initAmbient } from './motion/ambient.js';
import { initAsk } from './ask.js';

export async function boot() {
  document.documentElement.classList.add('js');
  initBackdrop();
  initLenis();
  initAnchorLinks();

  try { await document.fonts.ready; } catch { /* fonts API unsupported: proceed */ }

  initAmbient();
  await runLoader();
  initHero();
  initChapters();
  initSplitReveals();
  initBlockReveals();
  initScrambles();
  initCounters();
  initRules();
  initMagnetic();
  initNavScramble();
  initWork();
  initCharts();
  initAsk();

  // Layout settled after fonts + splits
  requestAnimationFrame(() => ScrollTrigger.refresh());
  if (reduced()) document.body.classList.add('reduced-motion');
}
