// src/scripts/animations.js
// Central GSAP + Lenis animation system for the dark luxury editorial redesign

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Lenis smooth scroll ──────────────────────────────────────
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  // Sync Lenis RAF with GSAP ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

// ── Nav scroll state ─────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  ScrollTrigger.create({
    start: 'top -80px',
    end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('nav-scrolled', self.progress > 0);
    },
  });
}

// ── Hero split-text animation ────────────────────────────────
function initHeroAnimation() {
  const nameEl = document.getElementById('hero-name');
  if (!nameEl) return;

  // Manual character split (no SplitText plugin)
  const text = nameEl.textContent ?? '';
  nameEl.innerHTML = text
    .split('')
    .map((char) => {
      if (char === ' ') {
        return '<span style="display:inline-block; width:0.3em;"></span>';
      }
      return `<span style="display:inline-block; overflow:hidden; vertical-align:bottom;"><span class="char-inner" style="display:inline-block;">${char}</span></span>`;
    })
    .join('');

  const chars = nameEl.querySelectorAll('.char-inner');

  const tl = gsap.timeline({ delay: 0.2 });

  tl
    .from('#hero-label', {
      opacity: 0,
      x: -20,
      duration: 0.7,
      ease: 'expo.out',
    })
    .from(chars, {
      yPercent: 110,
      duration: 1.0,
      stagger: 0.035,
      ease: 'expo.out',
    }, 0.1)
    .from('#hero-title', {
      opacity: 0,
      y: 18,
      duration: 0.8,
      ease: 'expo.out',
    }, '-=0.5')
    .from('#hero-sub', {
      opacity: 0,
      y: 16,
      duration: 0.7,
      ease: 'expo.out',
    }, '-=0.5')
    .from('#hero-ctas', {
      opacity: 0,
      y: 14,
      duration: 0.6,
      ease: 'expo.out',
    }, '-=0.4')
    .from('#hero-social', {
      opacity: 0,
      y: 10,
      duration: 0.5,
      ease: 'expo.out',
    }, '-=0.3');
}

// ── Stat counters ────────────────────────────────────────────
function initCounters() {
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const target = parseFloat(el.dataset.countTo ?? '0');
    const suffix = el.dataset.countSuffix ?? '';

    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(obj.val)}${suffix}`;
          },
          onComplete: () => {
            el.textContent = `${target}${suffix}`;
          },
        });
      },
    });
  });
}

// ── Scroll reveal (data-reveal + data-reveal-heading) ────────
function initScrollReveal() {
  // Batch stagger for data-reveal elements
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      gsap.fromTo(
        batch,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'expo.out',
          onComplete: () => {
            // Ensure state is clean
            batch.forEach((el) => {
              el.style.opacity = '';
              el.style.transform = '';
              el.classList.add('is-visible');
            });
          },
        }
      );
    },
  });

  // Heading reveals (slide from left)
  document.querySelectorAll('[data-reveal-heading]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: -24 },
      {
        opacity: 1,
        x: 0,
        duration: 1.0,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
          onEnter: () => el.classList.add('is-visible'),
        },
      }
    );
  });
}

// ── Projects horizontal scroll ───────────────────────────────
function initProjectsScroll() {
  // Only on desktop
  if (window.innerWidth < 768) return;

  const section = document.getElementById('projects');
  const track   = document.getElementById('projects-track');
  if (!section || !track) return;

  // Wait a tick for layout to settle
  ScrollTrigger.refresh();

  const totalWidth = track.scrollWidth - window.innerWidth;
  if (totalWidth <= 0) return;

  gsap.to(track, {
    x: -totalWidth,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${totalWidth + window.innerWidth * 0.4}`,
      pin: true,
      scrub: 1.2,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

// ── Magnetic button effect ────────────────────────────────────
function initMagneticButtons() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect    = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;
      const deltaX  = (e.clientX - centerX) * 0.25;
      const deltaY  = (e.clientY - centerY) * 0.25;

      gsap.to(btn, {
        x: deltaX,
        y: deltaY,
        duration: 0.35,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });
}

// ── Hero orb parallax ─────────────────────────────────────────
function initHeroParallax() {
  const orb = document.getElementById('hero-orb');
  if (!orb || !window.matchMedia('(pointer: fine)').matches) return;

  document.addEventListener('mousemove', (e) => {
    const xPct = (e.clientX / window.innerWidth  - 0.5) * 25;
    const yPct = (e.clientY / window.innerHeight - 0.5) * 18;

    gsap.to(orb, {
      x: xPct,
      y: yPct,
      duration: 2.0,
      ease: 'power2.out',
    });
  });
}

// ── Master init ──────────────────────────────────────────────
export function initAll() {
  // Skip all animations if prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Make all GSAP-opacity-0 elements visible immediately
    document.querySelectorAll(
      '#hero-label, #hero-title, #hero-sub, #hero-ctas, #hero-social, #hero-name'
    ).forEach((el) => {
      el.style.opacity = '1';
    });
    // CSS [data-reveal] fallback handles the rest via .is-visible class
    document.querySelectorAll('[data-reveal], [data-reveal-heading]').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  initLenis();
  initNavScroll();

  // Hero animation fires after loader's 1.4s delay
  const loader = document.getElementById('loader');
  if (loader) {
    // Loader fires body.loaded at 1.4s — watch for it
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('loaded')) {
        observer.disconnect();
        initHeroAnimation();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Fallback: also try after 1.6s in case mutation observer missed it
    setTimeout(() => initHeroAnimation(), 1600);
  } else {
    initHeroAnimation();
  }

  initScrollReveal();
  initCounters();
  initMagneticButtons();
  initHeroParallax();

  // Projects scroll init after a brief paint delay
  setTimeout(() => initProjectsScroll(), 100);
}
