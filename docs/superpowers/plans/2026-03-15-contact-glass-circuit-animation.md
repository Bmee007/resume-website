# Contact Glass + Circuit Animation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a frosted glass card to the Contact section for legibility, and replace the static circuit SVG background in the AI Integrations section with an animated canvas that fires lightning bursts between nodes.

**Architecture:** Two independent component edits — ContactSection.astro gets a wrapper div + CSS, ProjectsSection.astro gets a `<canvas>` element replacing the `section-bg` div plus a fully rewritten script block. No shared state, no new files, no new dependencies.

**Tech Stack:** Astro 5.x, Tailwind CSS v4, vanilla JS Canvas API, Playwright 1.58.2 (regression tests)

---

## Chunk 1: ContactSection — Frosted Glass Card

**Files:**
- Modify: `src/components/ContactSection.astro`

### Task 1: Add frosted glass wrapper to ContactSection

- [ ] **Step 1: Confirm the test baseline passes before touching anything**

  Run:
  ```bash
  cd ~/projects/resume-website && npm test -- --grep "CONT"
  ```
  Expected: all CONT-* tests pass (or match current baseline). Note any pre-existing failures so you don't accidentally own them.

- [ ] **Step 2: Wrap heading, tagline, form card, and social links in `.contact-glass`**

  In `src/components/ContactSection.astro`, find the `<div class="contact-inner section-animate">` block. Wrap `h2.contact-heading`, `p.contact-tagline`, `div#contact-card`, and `div.contact-social` in a new `<div class="contact-glass">`. The `<footer class="site-footer">` must remain **outside** the glass div, as a direct child of `contact-inner`.

  Replace the inner content of `contact-inner` so it reads:

  ```html
  <div class="contact-inner section-animate">
    <div class="contact-glass">
      <h2 class="contact-heading">Get In Touch</h2>
      <p class="contact-tagline">Open to consulting engagements and full-time opportunities</p>

      <div id="contact-card" class="contact-card liquid-glass">
        <!-- form and success panel unchanged -->
      </div>

      <div class="contact-social">
        <!-- social links unchanged -->
      </div>
    </div>
    <!-- footer stays outside the glass card -->
    <footer class="site-footer">
      <p>&copy; 2025 Borina Keo</p>
    </footer>
  </div>
  ```

  Do not move or modify any content inside `contact-card`, `contact-social`, or `site-footer` — only add the wrapper div.

- [ ] **Step 3: Add `.contact-glass` CSS to the `<style>` block**

  Inside the `<style>` block in `ContactSection.astro`, add after the `.contact-inner` rule:

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

  Note: `rgba(16, 185, 129, 0.2)` is intentionally hardcoded — this is a structural glass element, not a standard UI border, and `hsl(var(--border-hsl))` is not available in this component's scoped context.

- [ ] **Step 4: Run smoke tests to confirm no regressions**

  ```bash
  cd ~/projects/resume-website && npm test
  ```

  Expected: same pass/fail count as Step 1 baseline. No new failures.

- [ ] **Step 5: Visually verify in the browser**

  Start the dev server if not running:
  ```bash
  cd ~/projects/resume-website && npm run dev
  ```

  Open `http://localhost:4321` (or whichever port Astro uses), scroll to the Contact section, and confirm:
  - Frosted glass panel is visible around heading + tagline + form + social links
  - Background image (bg-contact.jpg) is visible at section edges outside the glass card
  - Footer copyright line renders below the glass card, not inside it
  - Form fields and text are clearly readable through the glass

- [ ] **Step 6: Commit**

  ```bash
  cd ~/projects/resume-website && git add src/components/ContactSection.astro
  git commit -m "feat: add frosted glass card to contact section for legibility"
  ```

---

## Chunk 2: ProjectsSection — Animated Circuit Canvas

**Files:**
- Modify: `src/components/ProjectsSection.astro`

### Task 2: Replace static section-bg with animated canvas

- [ ] **Step 1: Confirm test baseline before touching anything**

  ```bash
  cd ~/projects/resume-website && npm test -- --grep "PROJ"
  ```

  Expected: all PROJ-* tests pass (or match current baseline). Note any pre-existing failures.

- [ ] **Step 2: Replace the `section-bg` div with a canvas element**

  In `src/components/ProjectsSection.astro`, find:
  ```html
  <!-- Background image -->
  <div class="section-bg" aria-hidden="true"></div>
  ```

  Replace with:
  ```html
  <!-- Animated circuit canvas -->
  <canvas id="circuit-canvas" aria-hidden="true"></canvas>
  ```

- [ ] **Step 3: Replace `.section-bg` CSS rules with canvas CSS**

  In the `<style>` block, find and remove these rules entirely:
  ```css
  /* ── Background image ────────────────────────────────── */
  .section-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: url('/images/circuit.svg');
    background-size: cover;
    background-position: center;
    opacity: 0;
    transition: opacity 0.8s ease;
  }

  .section-bg.is-visible {
    opacity: 0.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .section-bg { transition: none; }
    .section-bg.is-visible { opacity: 0.5; }
  }
  ```

  Replace them with:
  ```css
  /* ── Animated circuit canvas ─────────────────────────── */
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

- [ ] **Step 4: Replace the entire `<script>` block with the new canvas animation script**

  Find and remove the existing `<script>` block (the `projectsBgObserver` script), and replace it with this complete script:

  ```html
  <script>
    const canvas = document.getElementById('circuit-canvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('circuit-canvas not found');
    const ctx = canvas.getContext('2d');

    // Fallback: if canvas unsupported, inject a static section-bg div
    if (!ctx) {
      const fallback = document.createElement('div');
      fallback.className = 'section-bg is-visible';
      fallback.style.cssText = 'position:absolute;inset:0;background-image:url(/images/circuit.svg);background-size:cover;opacity:0.5;';
      canvas.replaceWith(fallback);
      throw new Error('canvas-unsupported');
    }

    // ── Topology ────────────────────────────────────────────
    const NODES: [number, number][] = [
      [0.042,0.267],[0.100,0.267],[0.167,0.267],[0.167,0.500],
      [0.250,0.267],[0.250,0.500],[0.250,0.667],[0.333,0.267],
      [0.333,0.500],[0.333,0.667],[0.417,0.500],[0.417,0.667],
      [0.500,0.333],[0.500,0.667],[0.500,0.833],[0.583,0.333],
      [0.583,0.500],[0.583,0.667],[0.583,0.833],[0.667,0.500],
      [0.667,0.833],[0.750,0.267],[0.750,0.500],[0.750,0.667],
      [0.833,0.267],[0.833,0.500],[0.917,0.267],[0.917,0.500],
      [0.917,0.667]
    ];

    const EDGES: [number, number][] = [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,5],[5,8],[2,7],
      [7,8],[8,9],[7,4],[4,10],[10,11],[9,11],[10,12],[12,13],
      [13,14],[11,13],[12,15],[15,16],[16,17],[17,18],[13,17],
      [16,19],[19,20],[15,21],[21,22],[22,23],[19,22],[21,24],
      [24,25],[22,25],[24,26],[26,27],[25,27],[27,28],[23,28]
    ];

    // ── Resize / DPR ────────────────────────────────────────
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ── Base draw ───────────────────────────────────────────
    function drawBase(W: number, H: number) {
      ctx!.clearRect(0, 0, W, H);
      ctx!.strokeStyle = 'rgba(16,185,129,0.25)';
      ctx!.lineWidth = 1.5;
      EDGES.forEach(([a, b]) => {
        ctx!.beginPath();
        ctx!.moveTo(NODES[a][0]*W, NODES[a][1]*H);
        ctx!.lineTo(NODES[b][0]*W, NODES[b][1]*H);
        ctx!.stroke();
      });
      NODES.forEach(([nx, ny]) => {
        ctx!.beginPath();
        ctx!.arc(nx*W, ny*H, 3, 0, Math.PI*2);
        ctx!.fillStyle = 'rgba(16,185,129,0.7)';
        ctx!.fill();
      });
    }

    // ── Animation bursts ────────────────────────────────────
    interface Burst { src: number; dst: number; age: number; duration: number; }
    const bursts: Burst[] = [];

    function spawnBurst() {
      const ni = Math.floor(Math.random() * NODES.length);
      const neighbors = EDGES
        .filter(([a,b]) => a===ni || b===ni)
        .map(([a,b]) => a===ni ? b : a);
      if (!neighbors.length) return;
      const dst = neighbors[Math.floor(Math.random() * neighbors.length)];
      bursts.push({ src: ni, dst, age: 0, duration: 35 });
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function startInterval() {
      if (!intervalId) intervalId = setInterval(spawnBurst, 600);
    }
    function stopInterval() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    // ── Tick ────────────────────────────────────────────────
    let rafId: number | null = null;

    function tick() {
      const { width: W, height: H } = canvas!.getBoundingClientRect();
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
        ctx!.save();
        ctx!.shadowBlur = 12 * alpha;
        ctx!.shadowColor = '#10b981';
        ctx!.strokeStyle = `rgba(16,255,185,${alpha * 0.9})`;
        ctx!.lineWidth = 2.5;
        ctx!.beginPath(); ctx!.moveTo(sx, sy); ctx!.lineTo(dx, dy); ctx!.stroke();
        ctx!.restore();

        // source burst
        const g1 = ctx!.createRadialGradient(sx,sy,0,sx,sy,20*alpha);
        g1.addColorStop(0, `rgba(16,185,129,${alpha*0.8})`);
        g1.addColorStop(1, 'rgba(16,185,129,0)');
        ctx!.beginPath(); ctx!.arc(sx,sy,20*alpha,0,Math.PI*2);
        ctx!.fillStyle = g1; ctx!.fill();

        // dest arrival glow (starts at 40%)
        if (progress > 0.4) {
          const da = (progress - 0.4) / 0.6;
          const g2 = ctx!.createRadialGradient(dx,dy,0,dx,dy,16*da);
          g2.addColorStop(0, `rgba(16,185,129,${da*0.9})`);
          g2.addColorStop(1, 'rgba(16,185,129,0)');
          ctx!.beginPath(); ctx!.arc(dx,dy,16*da,0,Math.PI*2);
          ctx!.fillStyle = g2; ctx!.fill();
        }

        if (b.age >= b.duration) bursts.splice(i, 1);
      }

      rafId = requestAnimationFrame(tick);
    }

    // ── Reduced motion ──────────────────────────────────────
    // Declared before event listeners so all handlers can reference it
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Tab visibility pause/resume ──────────────────────────
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopInterval();
      } else if (!prefersReducedMotion && rafId === null && canvas!.classList.contains('is-visible')) {
        startInterval();
        rafId = requestAnimationFrame(tick);
      }
    });

    if (prefersReducedMotion) {
      resize();
      const W = canvas.getBoundingClientRect().width;
      const H = canvas.getBoundingClientRect().height;
      drawBase(W, H);
    }

    // ── IntersectionObserver ─────────────────────────────────
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          canvas!.classList.add('is-visible');
          if (!prefersReducedMotion && !rafId) {
            startInterval();
            rafId = requestAnimationFrame(tick);
          }
          observer.unobserve(canvas!);
        }
      }),
      { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
    );
    observer.observe(canvas);
  </script>
  ```

- [ ] **Step 5: Run smoke tests to confirm no regressions**

  ```bash
  cd ~/projects/resume-website && npm test
  ```

  Expected: same pass/fail count as Step 1 baseline. No new failures.

- [ ] **Step 6: Visually verify in the browser**

  Open `http://localhost:4321`, scroll to the AI Integrations section, and confirm:
  - Circuit nodes and trace lines are visible as before
  - Lightning bursts animate between nodes (green glowing beams)
  - Animation pauses when you switch to another tab and returns when you come back
  - No blurriness on Retina/HiDPI display (inspect on MacBook screen)
  - No layout regressions on mobile (narrow browser window)

- [ ] **Step 7: Commit**

  ```bash
  cd ~/projects/resume-website && git add src/components/ProjectsSection.astro
  git commit -m "feat: replace static circuit svg with animated canvas lightning bursts"
  ```

---

## Final Verification

- [ ] **Deploy to Vercel** (if auto-deploy is configured, push triggers it; otherwise run `vercel --prod`)

  ```bash
  cd ~/projects/resume-website && git push
  ```

- [ ] **Confirm circuit.svg is still present** (keep until canvas is verified in production)

  ```bash
  ls ~/projects/resume-website/public/images/circuit.svg
  ```
