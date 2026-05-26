// src/scripts/animations.js
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import Chart from 'chart.js/auto';

gsap.registerPlugin(ScrollTrigger, Flip);

// ── Lenis smooth scroll ──────────────────────────────────────
function initLenis() {
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 2,
  });
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// ── Aurora canvas ─────────────────────────────────────────────
function initAuroraCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W = 0, H = 0;
  function resize() {
    const p = canvas.parentElement;
    W = canvas.width  = p ? p.offsetWidth  : window.innerWidth;
    H = canvas.height = p ? p.offsetHeight : window.innerHeight;
  }
  resize();
  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);

  const t0 = performance.now();
  const blobs = [
    { cx: 0.24, cy: 0.42, r: 0.52, rgb: [212, 148,  28], a: 0.22, spd: 0.00017, ph: 0.00 },
    { cx: 0.70, cy: 0.55, r: 0.40, rgb: [190, 105,  22], a: 0.14, spd: 0.00013, ph: 2.10 },
    { cx: 0.48, cy: 0.18, r: 0.34, rgb: [245, 185,  50], a: 0.10, spd: 0.00024, ph: 4.20 },
    { cx: 0.84, cy: 0.32, r: 0.28, rgb: [ 75,  85, 215], a: 0.07, spd: 0.00015, ph: 1.25 },
    { cx: 0.10, cy: 0.74, r: 0.24, rgb: [ 95,  55, 185], a: 0.05, spd: 0.00020, ph: 3.70 },
  ];

  let animId;
  function frame(ts) {
    ctx.clearRect(0, 0, W, H);
    const t = ts - t0;
    for (const b of blobs) {
      const ox = Math.sin(t * b.spd + b.ph) * 0.15 * W;
      const oy = Math.cos(t * b.spd * 0.71 + b.ph) * 0.11 * H;
      const x  = b.cx * W + ox;
      const y  = b.cy * H + oy;
      const r  = b.r * Math.max(W, H);
      const g  = ctx.createRadialGradient(x, y, 0, x, y, r);
      const [R, G, B] = b.rgb;
      g.addColorStop(0,    `rgba(${R},${G},${B},${b.a})`);
      g.addColorStop(0.42, `rgba(${R},${G},${B},${(b.a * 0.22).toFixed(3)})`);
      g.addColorStop(1,    `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    animId = requestAnimationFrame(frame);
  }
  animId = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animId); }
    else { animId = requestAnimationFrame(frame); }
  });
}

// ── Scroll progress bar ───────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ── Section background parallax ───────────────────────────────
function initParallaxBg() {
  document.querySelectorAll('[data-parallax-bg]').forEach((section) => {
    gsap.fromTo(section,
      { backgroundPositionY: '30%' },
      {
        backgroundPositionY: '70%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2.5,
        },
      }
    );
  });
}

// ── Portrait mouse tilt ───────────────────────────────────────
function initPortraitTilt() {
  const wrap = document.querySelector('.hero-portrait-wrap');
  if (!wrap || !window.matchMedia('(pointer: fine)').matches) return;
  document.addEventListener('mousemove', (e) => {
    const xPct = (e.clientX / window.innerWidth  - 0.5) * 7;
    const yPct = (e.clientY / window.innerHeight - 0.5) * 5;
    gsap.to(wrap, {
      rotateY: xPct,
      rotateX: -yPct,
      transformPerspective: 900,
      duration: 2.0,
      ease: 'power2.out',
    });
  });
}

// ── Timeline spine scroll fill ────────────────────────────────
function initTimelineSpine() {
  const fill     = document.querySelector('.timeline-spine-fill');
  const timeline = document.querySelector('.timeline');
  if (!fill || !timeline) return;
  ScrollTrigger.create({
    trigger: timeline,
    start: 'top 68%',
    end: 'bottom 68%',
    scrub: 1.2,
    onUpdate: (self) => {
      fill.style.height = `${self.progress * 100}%`;
    },
  });
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

  initAuroraCanvas();

  const text = nameEl.textContent ?? '';
  nameEl.innerHTML = text
    .split('')
    .map((char) => {
      if (char === ' ') return '<span style="display:inline-block;width:0.3em;"></span>';
      return `<span style="display:inline-block;overflow:hidden;vertical-align:bottom;"><span class="char-inner" style="display:inline-block;">${char}</span></span>`;
    })
    .join('');

  const chars = nameEl.querySelectorAll('.char-inner');
  const tl = gsap.timeline({ delay: 0.15 });

  tl
    .fromTo('#hero-label',
      { opacity: 0, x: -28, filter: 'blur(6px)' },
      { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' }
    )
    .fromTo(chars,
      { yPercent: 115, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.030, ease: 'expo.out' },
      0.1
    )
    .fromTo('.hero-portrait-wrap',
      { opacity: 0, scale: 1.06, filter: 'blur(12px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out' },
      0.2
    )
    .fromTo('#hero-title',
      { opacity: 0, y: 24, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'expo.out' },
      '-=0.7'
    )
    .fromTo('#hero-sub',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' },
      '-=0.6'
    )
    .fromTo('#hero-ctas',
      { opacity: 0, y: 18, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'expo.out' },
      '-=0.5'
    )
    .fromTo('#hero-social',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' },
      '-=0.35'
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
          duration: 2.0,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = `${Math.round(obj.val)}${suffix}`; },
          onComplete: () => { el.textContent = `${target}${suffix}`; },
        });
      },
    });
  });
}

// ── Scroll reveal ─────────────────────────────────────────────
function initScrollReveal() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      gsap.fromTo(
        batch,
        { opacity: 0, y: 40, scale: 0.97, filter: 'blur(4px)' },
        {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
          duration: 0.9, stagger: 0.1, ease: 'expo.out',
          onComplete: () => {
            batch.forEach((el) => {
              el.style.opacity   = '';
              el.style.transform = '';
              el.style.filter    = '';
              el.classList.add('is-visible');
            });
          },
        }
      );
    },
  });

  document.querySelectorAll('[data-reveal-heading]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: -36, filter: 'blur(6px)' },
      {
        opacity: 1, x: 0, filter: 'blur(0px)',
        duration: 1.1, ease: 'expo.out',
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

// ── Magnetic button effect ────────────────────────────────────
function initMagneticButtons() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect    = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;
      gsap.to(btn, {
        x: (e.clientX - centerX) * 0.28,
        y: (e.clientY - centerY) * 0.28,
        duration: 0.3, ease: 'power2.out',
      });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

// ── Hero orb parallax ─────────────────────────────────────────
function initHeroParallax() {
  const orb = document.getElementById('hero-orb');
  if (!orb || !window.matchMedia('(pointer: fine)').matches) return;
  document.addEventListener('mousemove', (e) => {
    gsap.to(orb, {
      x: (e.clientX / window.innerWidth  - 0.5) * 25,
      y: (e.clientY / window.innerHeight - 0.5) * 18,
      duration: 2.0, ease: 'power2.out',
    });
  });
}

// ── Ask section helpers ───────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let chartInstance    = null;
let pendingChartData = null;
let pendingVisualQuery = null;

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

function fmtVal(v, unit = '') {
  const abs = Math.abs(v);
  const n = abs >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
          : abs >= 1_000    ? `${(v / 1_000).toFixed(0)}K`
          : v % 1 === 0     ? String(v)
          : v.toFixed(1);
  return unit ? `${n}${unit}` : n;
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
            grid:        { color: GRID_COLOR },
            ticks:       { color: TEXT_COLOR, font: { size: 10 } },
            border:      { color: GRID_COLOR },
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

function renderStatCard(prompt, chartData) {
  const visual   = document.getElementById('metrics-visual');
  const skeleton = document.getElementById('metrics-skeleton');
  if (skeleton) skeleton.style.display = 'none';
  if (!visual || !chartData?.values?.length) return false;

  const unit   = chartData.unit || '';
  const maxVal = Math.max(...chartData.values);
  const heroI  = chartData.values.indexOf(maxVal);

  const bars = chartData.labels.map((label, i) => {
    const pct = Math.round((chartData.values[i] / maxVal) * 100);
    return `<div class="vis-bar-row">
      <span class="vis-bar-label">${escapeHtml(label)}</span>
      <div class="vis-bar-track"><div class="vis-bar-fill" style="width:${pct}%"></div></div>
      <span class="vis-bar-value">${escapeHtml(fmtVal(chartData.values[i], unit))}</span>
    </div>`;
  }).join('');

  visual.innerHTML = `
    <div class="vis-question">${escapeHtml(prompt)}</div>
    <div class="vis-hero">
      <div class="vis-hero-value">${escapeHtml(fmtVal(maxVal, unit))}</div>
      <div class="vis-hero-label">${escapeHtml(chartData.labels[heroI])}</div>
    </div>
    <div class="vis-bars">${bars}</div>`;

  visual.style.display = 'flex';
  return true;
}

async function renderVisual(prompt, visualQuery) {
  const visual   = document.getElementById('generated-visual');
  const skeleton = document.getElementById('image-skeleton');
  if (!visual) return;

  if (visualQuery) {
    try {
      const res  = await fetch(`/api/pexels?q=${encodeURIComponent(visualQuery)}`);
      const data = await res.json();
      if (data.url) {
        if (skeleton) skeleton.style.display = 'none';
        visual.innerHTML = `
          <img
            src="${escapeHtml(data.url)}"
            alt="${escapeHtml(visualQuery)}"
            class="vis-photo"
            loading="lazy"
            decoding="async"
          />
          <div class="vis-photo-credit">
            Photo by <a href="${escapeHtml(data.photographer_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.photographer)}</a> · Pexels
          </div>`;
        visual.style.display = 'flex';
        return;
      }
    } catch { /* no photo available */ }
  }

  if (skeleton) skeleton.style.display = 'none';
  visual.style.display = 'none';
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
            if (parsed.chart) { renderChart(parsed.chart); pendingChartData = parsed.chart; }
            if (parsed.visual_query) { pendingVisualQuery = parsed.visual_query; }
            if (statusEl) statusEl.textContent = '';
          } catch { /* malformed JSON */ }
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
      { opacity: 0, y: 24, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.07, ease: 'expo.out' }
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

    const answerTextEl   = document.getElementById('answer-text');
    const answerDotsEl   = document.getElementById('answer-dots');
    const answerErrorEl  = document.getElementById('answer-error');
    const visualEl       = document.getElementById('generated-visual');
    const metricsVisual  = document.getElementById('metrics-visual');
    const chartCanvas    = document.getElementById('answer-chart');
    const chartErrorEl   = document.getElementById('chart-error');
    const imgSkeleton    = document.getElementById('image-skeleton');
    const metricsSkel    = document.getElementById('metrics-skeleton');
    const chartSkeleton  = document.getElementById('chart-skeleton');
    const chartTitleEl   = document.getElementById('chart-title');

    if (answerTextEl)  answerTextEl.textContent = '';
    if (answerDotsEl)  answerDotsEl.style.display = 'flex';
    if (answerErrorEl) answerErrorEl.style.display = 'none';
    if (visualEl)      visualEl.style.display = 'none';
    if (metricsVisual) metricsVisual.style.display = 'none';
    if (chartCanvas)   chartCanvas.style.display = 'none';
    if (chartErrorEl)  chartErrorEl.style.display = 'none';
    if (imgSkeleton)   imgSkeleton.style.display = 'block';
    if (metricsSkel)   metricsSkel.style.display = 'block';
    if (chartSkeleton) chartSkeleton.style.display = 'block';
    if (chartTitleEl)  chartTitleEl.textContent = '';

    pendingChartData   = null;
    pendingVisualQuery = null;
    currentAbort = new AbortController();

    await streamAnswer(prompt, currentAbort);
    await renderVisual(prompt, pendingVisualQuery);
    renderStatCard(prompt, pendingChartData);

    currentAbort = null;
    if (sendBtn && input?.value.trim()) sendBtn.disabled = false;
    if (answerDotsEl) answerDotsEl.style.display = 'none';
    if (statusEl && statusEl.textContent === 'Thinking…') statusEl.textContent = '';
  }
}

// ── Master init ──────────────────────────────────────────────
export function initAll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-reveal], [data-reveal-heading]').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  initLenis();
  initNavScroll();
  initScrollProgress();
  initParallaxBg();

  const loader = document.getElementById('loader');
  if (loader) {
    let heroInited = false;
    function runHeroInits() {
      if (heroInited) return;
      heroInited = true;
      initHeroAnimation();
      initPortraitTilt();
      initTimelineSpine();
      initAskSection();
    }
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('loaded')) {
        observer.disconnect();
        runHeroInits();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setTimeout(runHeroInits, 1650);
  } else {
    initHeroAnimation();
    initPortraitTilt();
    initTimelineSpine();
    initAskSection();
  }

  initScrollReveal();
  initCounters();
  initMagneticButtons();
  initHeroParallax();
}
