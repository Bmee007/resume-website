// src/scripts/motion/hero.js — hero entrance + scroll-out
import { gsap, SplitText, reduced, SCRAMBLE_CHARS } from './core.js';
import { getFog, glitchPulse } from './backdrop.js';

export function initHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const statement = hero.querySelector('.hero-statement');
  const label = hero.querySelector('.hero-label');
  const meta = Array.from(hero.querySelectorAll('.hero-meta'));
  const hint = hero.querySelector('.hero-hint');
  const fog = getFog();

  if (reduced()) {
    hero.classList.add('is-in');
    return;
  }

  gsap.set([label, ...meta, hint], { opacity: 0 });

  const split = SplitText.create(statement, { type: 'lines', mask: 'lines', linesClass: 'line', aria: 'none' });
  gsap.set(split.lines, { yPercent: 110 });
  hero.classList.add('is-in');

  // Scroll-out is wired only once the intro has settled, with explicit resting values,
  // so a scrubbed tween can never capture a mid-intro state as its "start".
  const wireScrollOut = () => {
    gsap.fromTo(split.lines, { yPercent: 0, opacity: 1 }, {
      yPercent: -40, opacity: 0, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: 0.6 },
    });
    gsap.fromTo([label, ...meta, hint], { opacity: 1, y: 0 }, {
      opacity: 0, y: -20, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: hero, start: 'top top', end: '45% top', scrub: 0.6 },
    });
  };

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: wireScrollOut });
  tl.add(() => { glitchPulse(0.7); if (fog) fog.setScene('mist'); }, 0)
    .to(label, { opacity: 1, duration: 0.6 }, 0.1)
    .to(label, { duration: 1.0, scrambleText: { text: label.dataset.text || label.textContent, chars: SCRAMBLE_CHARS, speed: 0.5 } }, 0.1)
    .to(split.lines, { yPercent: 0, duration: 1.5, stagger: 0.11 }, 0.25)
    .to(meta, { opacity: 1, y: 0, duration: 1 }, 0.9)
    .to(hint, { opacity: 1, duration: 1 }, 1.4);

  // The last word keeps thinking: cycle verbs with a scramble every few seconds.
  // SplitText wraps each original span in its own line, so address the spans directly.
  const spans = statement.querySelectorAll('.l');
  const verbLine = spans[spans.length - 1];
  if (verbLine) {
    const verbs = ['learn.', 'predict.', 'decide.', 'think.'];
    let vi = 0;
    gsap.delayedCall(5, function cycle() {
      gsap.to(verbLine, { duration: 0.45, scrambleText: { text: verbs[vi++ % verbs.length], chars: '0123456789', speed: 1, revealDelay: 0.1 } });
      gsap.delayedCall(5.5, cycle);
    });
  }
}
