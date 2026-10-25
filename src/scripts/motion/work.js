// src/scripts/motion/work.js — pinned horizontal case-study track (desktop only)
import { gsap, ScrollTrigger, reduced } from './core.js';

export function initWork() {
  const section = document.getElementById('projects');
  const track = document.getElementById('projects-track');
  const progress = document.getElementById('projects-progress');
  const counter = document.getElementById('projects-counter');
  const total = track.querySelectorAll('.case-panel:not(.project-card--end)').length;
  if (!section || !track) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
      if (reduced()) return;
      const distance = () => track.scrollWidth - window.innerWidth + 72; // + rail clearance
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance() + window.innerHeight * 0.3}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => document.body.classList.toggle('work-pinned', self.isActive),
          onUpdate: (self) => {
            if (progress) progress.style.transform = `scaleX(${self.progress})`;
            if (counter) counter.textContent = String(1 + Math.round(self.progress * (total - 1))).padStart(2, '0');
          },
        },
      });
      // Panels parallax slightly against the track for depth
      track.querySelectorAll('.case-panel .case-num').forEach((el) => {
        gsap.fromTo(el, { xPercent: 30 }, { xPercent: -30, ease: 'none', scrollTrigger: { containerAnimation: tween, trigger: el, start: 'left right', end: 'right left', scrub: true } });
      });
  });
}
