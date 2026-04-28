// src/scripts/animations.js
// Central GSAP + Lenis animation system for the dark luxury editorial redesign

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

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

  // Set GSAP starting state here (not in CSS) so elements are visible if JS fails
  gsap.set(['#hero-label', '#hero-title', '#hero-sub', '#hero-ctas', '#hero-social'], {
    opacity: 0,
  });

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

// ── Ask Borina Keo section ───────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LAYOUTS = {
  metric:     'card-metric-big',
  alert:      'card-alert',
  experience: 'card-yrs',
  skills:     'card-skills',
  ai:         'card-ai',
};

function applyLayout(highlightCard) {
  if (!highlightCard || !LAYOUTS[highlightCard]) return;

  const cards = document.querySelectorAll('#ask-bento .bento-card');
  if (!cards.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cards.forEach((c) => c.classList.remove('bento-hero'));
    document.getElementById(LAYOUTS[highlightCard])?.classList.add('bento-hero');
    return;
  }

  const state = Flip.getState(cards);
  cards.forEach((c) => c.classList.remove('bento-hero'));
  document.getElementById(LAYOUTS[highlightCard])?.classList.add('bento-hero');
  Flip.from(state, { duration: 0.6, ease: 'expo.out', stagger: 0.05, absolute: true });
}

function updateCardContent(updates) {
  if (!updates) return;

  function fadeSwap(el, apply) {
    if (!el) return;
    gsap.to(el, {
      opacity: 0, duration: 0.2,
      onComplete: () => { apply(); gsap.to(el, { opacity: 1, duration: 0.35 }); },
    });
  }

  if (updates.metric) {
    const { value, label, sub } = updates.metric;
    if (value) fadeSwap(document.getElementById('metric-value'), () => {
      document.getElementById('metric-value').textContent = value;
    });
    if (label) fadeSwap(document.getElementById('metric-label'), () => {
      document.getElementById('metric-label').textContent = label;
    });
    if (sub) fadeSwap(document.getElementById('metric-sub'), () => {
      document.getElementById('metric-sub').textContent = sub;
    });
  }

  if (updates.alert_items && Array.isArray(updates.alert_items)) {
    const alertList = document.getElementById('alert-list');
    fadeSwap(alertList, () => {
      alertList.innerHTML = updates.alert_items.map((item, i) => `
        <div class="alert-item${i > 0 ? ' alert-item--green' : ''}">
          <div class="alert-icon" aria-hidden="true">${escapeHtml(item.icon)}</div>
          <div>
            <div class="alert-text">${escapeHtml(item.text)}</div>
            <div class="alert-meta">${escapeHtml(item.meta)}</div>
          </div>
        </div>
      `).join('');
    });
  }

  if (updates.skills && Array.isArray(updates.skills)) {
    const skillList = document.getElementById('skill-list');
    fadeSwap(skillList, () => {
      skillList.innerHTML = updates.skills.map((skill) => `
        <div class="skill-row">
          <div class="skill-top">
            <span class="skill-name">${escapeHtml(skill.name)}</span>
            <span class="skill-pct${skill.color && skill.color !== 'amber' ? ` skill-pct--${skill.color}` : ''}">${escapeHtml(String(skill.pct))}%</span>
          </div>
          <div class="skill-bar-bg">
            <div class="skill-bar-fill skill-bar-fill--${escapeHtml(skill.color || 'amber')}" style="width:${Number(skill.pct) || 0}%"></div>
          </div>
        </div>
      `).join('');
    });
  }

  if (updates.ai_response) {
    fadeSwap(document.getElementById('ai-response-text'), () => {
      document.getElementById('ai-response-text').textContent = updates.ai_response;
    });
  }
}

async function streamAnswer(prompt, abortController) {
  const aiResponseEl = document.getElementById('ai-response-text');
  const aiDotsEl     = document.getElementById('ai-dots');
  const statusEl     = document.getElementById('ask-status');

  if (aiDotsEl) aiDotsEl.style.display = 'flex';
  if (aiResponseEl) aiResponseEl.textContent = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: abortController.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText     = '';
    let displayedText = '';
    let buffer       = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();

        if (raw === '[DONE]') {
          if (aiDotsEl) aiDotsEl.style.display = 'none';
          try {
            const parsed = JSON.parse(fullText);
            if (parsed.highlight_card) applyLayout(parsed.highlight_card);
            if (parsed.updates) updateCardContent(parsed.updates);
            if (statusEl) statusEl.textContent = '';
          } catch {
            /* malformed JSON — show what we streamed */
          }
          continue;
        }

        try {
          const { delta, error } = JSON.parse(raw);
          if (error) throw new Error(error);
          if (delta) {
            fullText += delta;
            // Progressively extract "text" field while streaming
            const match = fullText.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (match) {
              const extracted = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
              if (extracted !== displayedText && aiResponseEl) {
                displayedText = extracted;
                aiResponseEl.textContent = extracted;
              }
            }
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (aiDotsEl) aiDotsEl.style.display = 'none';
    if (statusEl) statusEl.textContent = 'Something went wrong — please try again.';
  }
}

export function initAskSection() {
  const bento = document.getElementById('ask-bento');
  if (!bento) return;

  // Scroll-triggered card entrance
  ScrollTrigger.batch('.bento-card', {
    start: 'top 85%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out' }
    ),
  });

  const input   = document.getElementById('ask-input');
  const sendBtn = document.getElementById('ask-send');
  const statusEl  = document.getElementById('ask-status');
  const aiPromptEl = document.getElementById('ai-prompt-text');
  const aiDotsEl  = document.getElementById('ai-dots');

  let currentAbort = null;

  // Enable/disable send on input
  input?.addEventListener('input', () => {
    if (sendBtn) sendBtn.disabled = !input.value.trim();
  });

  // Chip clicks
  document.querySelectorAll('.ask-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (!prompt) return;
      if (input) input.value = prompt;
      if (sendBtn) sendBtn.disabled = false;
      sendQuestion(prompt);
    });
  });

  // Send button
  sendBtn?.addEventListener('click', () => {
    const prompt = input?.value.trim();
    if (prompt) sendQuestion(prompt);
  });

  // Enter key
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const prompt = input.value.trim();
      if (prompt) { e.preventDefault(); sendQuestion(prompt); }
    }
  });

  async function sendQuestion(prompt) {
    if (currentAbort) { currentAbort.abort(); currentAbort = null; }

    if (sendBtn) sendBtn.disabled = true;
    if (statusEl) statusEl.textContent = 'Thinking…';

    // Update AI card prompt display immediately
    if (aiPromptEl) {
      gsap.to(aiPromptEl, {
        opacity: 0, duration: 0.15,
        onComplete: () => {
          aiPromptEl.textContent = `"${prompt}"`;
          gsap.to(aiPromptEl, { opacity: 1, duration: 0.25 });
        },
      });
    }

    currentAbort = new AbortController();
    await streamAnswer(prompt, currentAbort);

    currentAbort = null;
    if (sendBtn && input?.value.trim()) sendBtn.disabled = false;
    if (aiDotsEl) aiDotsEl.style.display = 'none';
    if (statusEl && statusEl.textContent === 'Thinking…') statusEl.textContent = '';
  }
}

// ── Master init ──────────────────────────────────────────────
export function initAll() {
  // Skip all animations if prefers-reduced-motion
  // Hero elements are visible by default (opacity set via gsap.set in initHeroAnimation,
  // not in CSS), so no manual override needed here.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    let heroInited = false;
    function runHeroInits() {
      if (heroInited) return;
      heroInited = true;
      initHeroAnimation();
      initAskSection();
    }
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('loaded')) {
        observer.disconnect();
        runHeroInits();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Fallback: if observer missed the class change, run after 1.6s
    setTimeout(runHeroInits, 1600);
  } else {
    initHeroAnimation();
    initAskSection();
  }

  initScrollReveal();
  initCounters();
  initMagneticButtons();
  initHeroParallax();

  // Projects scroll init after a brief paint delay
  setTimeout(() => initProjectsScroll(), 100);
}
