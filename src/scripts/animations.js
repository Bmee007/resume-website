// src/scripts/animations.js
// Central GSAP + Lenis animation system for the dark luxury editorial redesign

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import Chart from 'chart.js/auto';

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

  // Use fromTo so start + end values are both explicit — avoids GSAP misreading
  // "current state" after any prior gsap.set() call.
  const tl = gsap.timeline({ delay: 0.2 });

  tl
    .fromTo('#hero-label',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out' }
    )
    .fromTo(chars,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.0, stagger: 0.035, ease: 'expo.out' },
      0.1
    )
    .fromTo('#hero-title',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' },
      '-=0.5'
    )
    .fromTo('#hero-sub',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' },
      '-=0.5'
    )
    .fromTo('#hero-ctas',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' },
      '-=0.4'
    )
    .fromTo('#hero-social',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' },
      '-=0.3'
    );
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

let chartInstance = null;
let pendingLidaSpec = null;

function highlightText(text, highlights) {
  if (!Array.isArray(highlights) || !highlights.length) return escapeHtml(text);
  const sorted = [...highlights]
    .filter((kw) => kw && typeof kw === 'string' && kw.trim())
    .sort((a, b) => b.length - a.length);
  if (!sorted.length) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const pattern = sorted
    .map((kw) => escapeHtml(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<span class="hl">$1</span>');
}

function showChartError() {
  const skeleton = document.getElementById('chart-skeleton');
  const errEl    = document.getElementById('chart-error');
  if (skeleton) skeleton.style.display = 'none';
  if (errEl)    errEl.style.display = 'flex';
}

function renderChart(chartData) {
  const canvas   = document.getElementById('answer-chart');
  const skeleton = document.getElementById('chart-skeleton');
  const titleEl  = document.getElementById('chart-title');
  if (!canvas) return;

  if (!chartData || !Array.isArray(chartData.labels) || !Array.isArray(chartData.values)
      || !chartData.labels.length || !chartData.values.length) {
    showChartError();
    return;
  }

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  if (titleEl) titleEl.textContent = chartData.title || '';

  try {
    canvas.style.display = 'block';
    if (skeleton) skeleton.style.display = 'none';

  const AMBER       = '#d49820';
  const AMBER_ALPHA = 'rgba(212,152,32,0.18)';
  const BLUE        = '#5b8fd9';
  const GREEN       = '#4caf88';
  const ORANGE      = '#e07030';
  const GRID_COLOR  = 'rgba(255,255,255,0.06)';
  const TEXT_COLOR  = 'rgba(255,255,255,0.45)';
  const isDoughnut  = chartData.type === 'doughnut';
  const palette     = [AMBER, BLUE, GREEN, ORANGE];

  chartInstance = new Chart(canvas, {
    type: chartData.type || 'bar',
    data: {
      labels: chartData.labels || [],
      datasets: [{
        data:            chartData.values || [],
        backgroundColor: isDoughnut ? palette : AMBER_ALPHA,
        borderColor:     isDoughnut ? palette : AMBER,
        borderWidth: 1.5,
        borderRadius: chartData.type === 'bar' ? 3 : 0,
        tension: 0.35,
        fill: chartData.type === 'line',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed?.y ?? ctx.parsed;
              return ` ${v} ${chartData.unit || ''}`.trimEnd();
            },
          },
        },
      },
      scales: isDoughnut ? {} : {
        x: {
          grid:   { color: GRID_COLOR },
          ticks:  { color: TEXT_COLOR, font: { size: 10 } },
          border: { color: GRID_COLOR },
        },
        y: {
          grid:         { color: GRID_COLOR },
          ticks:        { color: TEXT_COLOR, font: { size: 10 } },
          border:       { color: GRID_COLOR },
          beginAtZero: true,
        },
      },
    },
  });
  } catch {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    canvas.style.display = 'none';
    showChartError();
  }
}

function showImageError() {
  const skeleton = document.getElementById('image-skeleton');
  const errEl    = document.getElementById('image-error');
  if (skeleton) skeleton.style.display = 'none';
  if (errEl)    errEl.style.display = 'flex';
}

async function fetchImage(prompt, abortController, lidaSpec = null) {
  const img      = document.getElementById('generated-image');
  const skeleton = document.getElementById('image-skeleton');
  const errEl    = document.getElementById('image-error');
  const timerEl  = document.getElementById('image-timer');

  if (skeleton) skeleton.style.display = 'block';
  if (errEl)    errEl.style.display = 'none';
  if (img)      { img.style.display = 'none'; img.src = ''; }

  // Elapsed-time counter
  let elapsed = 0;
  if (timerEl) timerEl.textContent = '0s';
  const tick = setInterval(() => {
    elapsed++;
    if (timerEl) timerEl.textContent = `${elapsed}s`;
  }, 1000);

  const stopTimer = () => clearInterval(tick);

  try {
    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, lidaSpec }),
      signal: abortController.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let urlReceived = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const { url, error } = JSON.parse(raw);
          if (error) throw new Error(error);
          if (url && img) {
            urlReceived = true;
            img.alt = `AI-generated visual for: ${prompt}`;
            img.src = url;
            // img.decode() fetches and decodes even when display:none (unlike onload+lazy)
            img.decode()
              .then(() => {
                stopTimer();
                if (skeleton) skeleton.style.display = 'none';
                img.style.display = 'block';
              })
              .catch(() => { stopTimer(); showImageError(); });
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }

    // Stream ended without a URL — server timed out or returned an error
    if (!urlReceived) {
      stopTimer();
      showImageError();
    }
  } catch (err) {
    stopTimer();
    if (err.name === 'AbortError') return;
    showImageError();
  }
}

async function streamAnswer(prompt, abortController) {
  const answerTextEl  = document.getElementById('answer-text');
  const answerDotsEl  = document.getElementById('answer-dots');
  const answerErrorEl = document.getElementById('answer-error');
  const statusEl      = document.getElementById('ask-status');

  if (answerDotsEl)  answerDotsEl.style.display = 'flex';
  if (answerTextEl)  answerTextEl.textContent = '';
  if (answerErrorEl) answerErrorEl.style.display = 'none';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: abortController.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader      = res.body.getReader();
    const decoder     = new TextDecoder();
    let fullText      = '';
    let displayedText = '';
    let buffer        = '';

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
          if (answerDotsEl) answerDotsEl.style.display = 'none';
          try {
            const parsed = JSON.parse(fullText);
            if (parsed.text && answerTextEl) {
              answerTextEl.innerHTML = highlightText(parsed.text, parsed.highlights);
            }
            if (parsed.chart) renderChart(parsed.chart);
            if (parsed.lidaSpec) pendingLidaSpec = parsed.lidaSpec;
            if (statusEl) statusEl.textContent = '';
          } catch { /* malformed JSON — keep streamed text */ }
          continue;
        }

        try {
          const { delta, error } = JSON.parse(raw);
          if (error) throw new Error(error);
          if (delta) {
            fullText += delta;
            const match = fullText.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (match) {
              const extracted = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
              if (extracted !== displayedText && answerTextEl) {
                displayedText = extracted;
                answerTextEl.textContent = extracted;
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
    if (answerDotsEl)  answerDotsEl.style.display = 'none';
    if (answerErrorEl) answerErrorEl.style.display = 'flex';
    if (statusEl)      statusEl.textContent = '';
  }
}

export function initAskSection() {
  if (!document.getElementById('panel-answer')) return;

  ScrollTrigger.batch('.ask-panel', {
    start: 'top 85%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out' }
    ),
  });

  const input    = document.getElementById('ask-input');
  const sendBtn  = document.getElementById('ask-send');
  const statusEl = document.getElementById('ask-status');
  let currentAbort = null;

  input?.addEventListener('input', () => {
    if (sendBtn) sendBtn.disabled = !input.value.trim();
  });

  document.querySelectorAll('.ask-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const p = chip.dataset.prompt;
      if (!p) return;
      if (input) input.value = p;
      if (sendBtn) sendBtn.disabled = false;
      sendQuestion(p);
    });
  });

  sendBtn?.addEventListener('click', () => {
    const p = input?.value.trim();
    if (p) sendQuestion(p);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const p = input.value.trim();
      if (p) { e.preventDefault(); sendQuestion(p); }
    }
  });

  async function sendQuestion(prompt) {
    if (currentAbort) { currentAbort.abort(); currentAbort = null; }
    if (sendBtn) sendBtn.disabled = true;
    if (statusEl) statusEl.textContent = 'Thinking…';

    const answerTextEl  = document.getElementById('answer-text');
    const answerDotsEl  = document.getElementById('answer-dots');
    const answerErrorEl = document.getElementById('answer-error');
    const imgEl         = document.getElementById('generated-image');
    const imgErrorEl    = document.getElementById('image-error');
    const chartCanvas   = document.getElementById('answer-chart');
    const chartErrorEl  = document.getElementById('chart-error');
    const imgSkeleton   = document.getElementById('image-skeleton');
    const chartSkeleton = document.getElementById('chart-skeleton');
    const chartTitleEl  = document.getElementById('chart-title');

    if (answerTextEl)  answerTextEl.textContent = '';
    if (answerDotsEl)  answerDotsEl.style.display = 'flex';
    if (answerErrorEl) answerErrorEl.style.display = 'none';
    if (imgEl)         { imgEl.style.display = 'none'; imgEl.src = ''; }
    if (imgErrorEl)    imgErrorEl.style.display = 'none';
    if (chartCanvas)   chartCanvas.style.display = 'none';
    if (chartErrorEl)  chartErrorEl.style.display = 'none';
    if (imgSkeleton)   { imgSkeleton.style.display = 'block'; }
    const timerReset = document.getElementById('image-timer');
    if (timerReset) timerReset.textContent = '0s';
    if (chartSkeleton) chartSkeleton.style.display = 'block';
    if (chartTitleEl)  chartTitleEl.textContent = '';

    currentAbort = new AbortController();
    pendingLidaSpec = null;

    // Stream text first — lidaSpec arrives with the [DONE] event
    await streamAnswer(prompt, currentAbort);

    // Then fetch the infographic using the spec from GPT-4o (or prompt for DALL-E fallback)
    await fetchImage(prompt, currentAbort, pendingLidaSpec);
    pendingLidaSpec = null;

    currentAbort = null;
    if (sendBtn && input?.value.trim()) sendBtn.disabled = false;
    if (answerDotsEl) answerDotsEl.style.display = 'none';
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
