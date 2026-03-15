# Design: Contact Section Frosted Glass + Animated Circuit

**Date:** 2026-03-15
**Status:** Approved

---

## Problem

1. **Contact section legibility** — text and form elements blend into the background image at 50% opacity, making the section hard to read.
2. **Static circuit background** — the AI Integrations section circuit SVG is purely decorative with no movement; user wants nodes to visually fire signals to each other.

---

## Solution Overview

Two independent changes to two different components:

1. **ContactSection.astro** — wrap existing content in a frosted glass card
2. **ProjectsSection.astro** — replace static circuit `section-bg` div with an animated `<canvas>` element

---

## Change 1: Contact Section — Frosted Glass Card

### What Changes

Add a `contact-glass` wrapper `<div>` inside `contact-inner`, wrapping only the heading, tagline, form card, and social links. The `<footer class="site-footer">` (copyright line) lives **outside** the glass card, below it.

### Structure

```html
<div class="contact-inner section-animate">
  <div class="contact-glass">
    <h2 class="contact-heading">Get In Touch</h2>
    <p class="contact-tagline">…</p>
    <div id="contact-card" class="contact-card liquid-glass">…</div>
    <div class="contact-social">…</div>
  </div>
  <!-- footer stays outside the glass card -->
  <footer class="site-footer">…</footer>
</div>
```

### Styles

```css
.contact-glass {
  background: rgba(10, 15, 26, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  width: 100%;
  box-sizing: border-box;
}
```

**Width:** `contact-glass` fills `contact-inner` width (which is `max-width: 600px`). Remove any conflicting `max-width` on `contact-inner` or size `contact-glass` to fill it. The existing `contact-card` padding (`2.5rem`) is preserved inside — no double padding because the glass card wraps the outer container, while `contact-card` wraps only the form.

**Border token:** Use hardcoded `rgba(16, 185, 129, 0.2)` intentionally — this is a structural glass element, not a standard UI border, and the existing `hsl(var(--border-hsl))` token is not available in this component's scoped context. Documented as intentional.

### Layout

- `section-bg` (bg-contact.jpg) stays at 0.5 opacity — visible at section edges outside/around the glass card
- Glass card is centered via `contact-inner`'s existing flex centering
- `site-footer` renders below the card, not inside it

---

## Change 2: AI Integrations — Animated Circuit Canvas

### What Changes

In `ProjectsSection.astro`:
- Replace `<div class="section-bg" aria-hidden="true"></div>` with `<canvas id="circuit-canvas" aria-hidden="true"></canvas>`
- Add canvas CSS (below)
- Replace existing `projectsBgObserver` script block entirely with the new canvas animation script

**Do not delete `public/images/circuit.svg`** until the canvas implementation has been visually verified in the browser — the SVG serves as topology reference.

### Canvas CSS

```css
#circuit-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.8s ease;
}
#circuit-canvas.is-visible {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  #circuit-canvas { transition: none; }
}
```

Remove the existing `.section-bg`, `.section-bg.is-visible`, and reduced-motion overrides for those classes — they are no longer needed.

### Canvas Initialization

```js
const canvas = document.getElementById('circuit-canvas');
const ctx = canvas.getContext('2d');

// Fallback: if canvas unsupported, inject a static section-bg div
if (!ctx) {
  const fallback = document.createElement('div');
  fallback.className = 'section-bg is-visible';
  fallback.style.cssText = 'position:absolute;inset:0;background-image:url(/images/circuit.svg);background-size:cover;opacity:0.5;';
  canvas.replaceWith(fallback);
  // stop script execution
  throw new Error('canvas-unsupported');
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);  // scale once after resize, before drawing
}
const ro = new ResizeObserver(resize);
ro.observe(canvas);
resize();
```

**DPR handling:** Always multiply canvas pixel dimensions by `devicePixelRatio` and call `ctx.scale(dpr, dpr)` after each resize. This prevents blurriness on Retina/HiDPI displays (MacBook, iPhone).

### Circuit Topology (Normalized Coordinates)

Derived from `circuit.svg` viewBox `1200×300`. All positions are fractions of rendered canvas CSS width/height:

```js
const NODES = [
  [0.042,0.267],[0.100,0.267],[0.167,0.267],[0.167,0.500],
  [0.250,0.267],[0.250,0.500],[0.250,0.667],[0.333,0.267],
  [0.333,0.500],[0.333,0.667],[0.417,0.500],[0.417,0.667],
  [0.500,0.333],[0.500,0.667],[0.500,0.833],[0.583,0.333],
  [0.583,0.500],[0.583,0.667],[0.583,0.833],[0.667,0.500],
  [0.667,0.833],[0.750,0.267],[0.750,0.500],[0.750,0.667],
  [0.833,0.267],[0.833,0.500],[0.917,0.267],[0.917,0.500],
  [0.917,0.667]
];

const EDGES = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,5],[5,8],[2,7],
  [7,8],[8,9],[7,4],[4,10],[10,11],[9,11],[10,12],[12,13],
  [13,14],[11,13],[12,15],[15,16],[16,17],[17,18],[13,17],
  [16,19],[19,20],[15,21],[21,22],[22,23],[19,22],[21,24],
  [24,25],[22,25],[24,26],[26,27],[25,27],[27,28],[23,28]
];
```

Use CSS dimensions (not pixel dimensions) for geometry calculations — the `ctx.scale(dpr, dpr)` call handles the DPR mapping automatically.

### Base Draw Function

```js
function drawBase(W, H) {
  ctx.clearRect(0, 0, W, H);
  // traces
  ctx.strokeStyle = 'rgba(16,185,129,0.25)';
  ctx.lineWidth = 1.5;
  EDGES.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(NODES[a][0]*W, NODES[a][1]*H);
    ctx.lineTo(NODES[b][0]*W, NODES[b][1]*H);
    ctx.stroke();
  });
  // nodes
  NODES.forEach(([nx, ny]) => {
    ctx.beginPath();
    ctx.arc(nx*W, ny*H, 3, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(16,185,129,0.7)';
    ctx.fill();
  });
}
```

### Animation: Lightning Bursts

```js
const bursts = [];

function spawnBurst() {
  const ni = Math.floor(Math.random() * NODES.length);
  const neighbors = EDGES
    .filter(([a,b]) => a===ni || b===ni)
    .map(([a,b]) => a===ni ? b : a);
  if (!neighbors.length) return;
  const dst = neighbors[Math.floor(Math.random() * neighbors.length)];
  bursts.push({ src: ni, dst, age: 0, duration: 35 });
}

setInterval(spawnBurst, 600);
```

**Tick function:**

```js
let rafId = null;

function tick() {
  const W = canvas.getBoundingClientRect().width;
  const H = canvas.getBoundingClientRect().height;
  drawBase(W, H);

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.age++;
    const progress = b.age / b.duration;
    const alpha = progress < 0.3 ? progress/0.3 : 1 - (progress-0.3)/0.7;

    const src = NODES[b.src], dst = NODES[b.dst];
    const sx = src[0]*W, sy = src[1]*H;
    const dx = dst[0]*W, dy = dst[1]*H;

    // glowing beam
    ctx.save();
    ctx.shadowBlur = 12 * alpha;
    ctx.shadowColor = '#10b981';
    ctx.strokeStyle = `rgba(16,255,185,${alpha * 0.9})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(dx, dy); ctx.stroke();
    ctx.restore();

    // source burst
    const g1 = ctx.createRadialGradient(sx,sy,0,sx,sy,20*alpha);
    g1.addColorStop(0, `rgba(16,185,129,${alpha*0.8})`);
    g1.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.beginPath(); ctx.arc(sx,sy,20*alpha,0,Math.PI*2);
    ctx.fillStyle = g1; ctx.fill();

    // dest arrival glow (starts at 40%)
    if (progress > 0.4) {
      const da = (progress - 0.4) / 0.6;
      const g2 = ctx.createRadialGradient(dx,dy,0,dx,dy,16*da);
      g2.addColorStop(0, `rgba(16,185,129,${da*0.9})`);
      g2.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.beginPath(); ctx.arc(dx,dy,16*da,0,Math.PI*2);
      ctx.fillStyle = g2; ctx.fill();
    }

    if (b.age >= b.duration) bursts.splice(i, 1);
  }

  rafId = requestAnimationFrame(tick);
}
```

### Pause/Resume on Tab Visibility

Single top-level `rafId` handle manages pause/resume:

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
    rafId = null;
  } else if (!rafId) {
    rafId = requestAnimationFrame(tick);
  }
});
```

### Reduced Motion

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Draw static circuit only — no rAF loop, no bursts, no setInterval
  resize();
  const W = canvas.getBoundingClientRect().width;
  const H = canvas.getBoundingClientRect().height;
  drawBase(W, H);
} else {
  rafId = requestAnimationFrame(tick);
}
```

### IntersectionObserver (replaces old `projectsBgObserver`)

```js
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      canvas.classList.add('is-visible');
      if (!prefersReducedMotion && !rafId) rafId = requestAnimationFrame(tick);
      observer.unobserve(canvas);
    }
  }),
  { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
);
observer.observe(canvas);
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/ContactSection.astro` | Add `.contact-glass` wrapper div + CSS; keep footer outside |
| `src/components/ProjectsSection.astro` | Replace `section-bg` div with `<canvas>`, rewrite script block |
| `public/images/circuit.svg` | Keep as topology reference; delete only after canvas is verified |

---

## Out of Scope

- Other sections' backgrounds — no changes
- Hero video opacity — already set (0.85)
- Section bg opacity values — already set (0.5)
- Domain setup — separate task

---

## Success Criteria

- [ ] Contact heading, tagline, form, and social icons are clearly readable against the frosted glass panel
- [ ] `section-bg` (bg-contact.jpg) visible at section edges outside the glass card
- [ ] Footer copyright line renders below the glass card, not inside it
- [ ] AI Integrations section shows animated lightning bursts between circuit nodes
- [ ] Animation pauses when tab is hidden (manual: switch tabs and return)
- [ ] Static circuit renders correctly with `prefers-reduced-motion: reduce` (manual)
- [ ] Circuit not blurry on Retina display (manual: inspect on HiDPI screen)
- [ ] No layout regressions on mobile or desktop
- [ ] Existing Playwright smoke tests still pass (`npm test`)
