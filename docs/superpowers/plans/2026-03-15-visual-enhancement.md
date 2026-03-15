# Visual Enhancement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hero video, thematic background imagery, and varied scroll-in transitions to all five content sections of the Borina Keo resume site.

**Architecture:** Per-component background div (`div.section-bg`) absolutely positioned behind content, revealed via a per-component IntersectionObserver (`rootMargin: '-10% 0px -10% 0px'`, fire-once). Images downloaded from Unsplash to `public/images/`. Each component owns its own styles and script — BaseLayout is not touched.

**Tech Stack:** Astro 5.x, Tailwind CSS v4 (scoped styles only), Playwright 1.x (smoke tests), CSS `@keyframes`, IntersectionObserver API

---

## File Map

| File | Action | Notes |
|------|--------|-------|
| `public/Hero-video.mp4` | Rename → `hero-video.mp4` | Fix case for Linux/Vercel |
| `public/images/bg-about.jpg` | Create | Pharmaceutical/lab imagery |
| `public/images/bg-skills.jpg` | Create | Supply chain/logistics |
| `public/images/bg-experience.jpg` | Create | Warehouse automation |
| `public/images/bg-projects.jpg` | Create | Robotics/automation |
| `public/images/bg-contact.jpg` | Create | Supply chain/logistics |
| `src/components/AboutSection.astro` | Modify | Add section-bg + bg-fade transition |
| `src/components/SkillsSection.astro` | Modify | Add section-bg + bg-fade transition |
| `src/components/ExperienceSection.astro` | Modify | Add section-bg + bg-slide-up keyframe |
| `src/components/ProjectsSection.astro` | Modify | Add 2 floating accents + bg-zoom keyframe |
| `src/components/ContactSection.astro` | Modify | Add section-bg + bg-fade + z-index fix |

---

## Chunk 1: Setup — Video Fix + Images

### Task 1: Fix hero video filename case

**Files:**
- Rename: `public/Hero-video.mp4` → `public/hero-video.mp4`

- [ ] **Step 1: Rename the file**

```bash
cd ~/projects/resume-website
mv public/Hero-video.mp4 public/hero-video.mp4
```

- [ ] **Step 2: Verify HeroSection.astro src matches**

```bash
grep "hero-video" src/components/HeroSection.astro
```

Expected output: `<source src="/hero-video.mp4" type="video/mp4" />`

- [ ] **Step 3: Start dev server and verify video plays**

```bash
npm run dev
```

Open http://localhost:4321 — the hero background should show a dark video playing behind the hero content. (Previously it was a silent fail; after rename it will play.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: rename Hero-video.mp4 to hero-video.mp4 for case-sensitive Linux/Vercel"
```

---

### Task 2: Download background images

**Files:**
- Create: `public/images/bg-about.jpg`
- Create: `public/images/bg-skills.jpg`
- Create: `public/images/bg-experience.jpg`
- Create: `public/images/bg-projects.jpg`
- Create: `public/images/bg-contact.jpg`

- [ ] **Step 1: Create images directory**

```bash
mkdir -p public/images
```

- [ ] **Step 2: Download all 5 images**

```bash
# Pharmaceutical/lab — About section
curl -L "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1920&q=80" \
  -o public/images/bg-about.jpg

# Supply chain/logistics — Skills section
curl -L "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80" \
  -o public/images/bg-skills.jpg

# Warehouse automation — Experience section
curl -L "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80" \
  -o public/images/bg-experience.jpg

# Robotics — Projects section
curl -L "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80" \
  -o public/images/bg-projects.jpg

# Supply chain/logistics — Contact section
curl -L "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1920&q=80" \
  -o public/images/bg-contact.jpg
```

- [ ] **Step 3: Verify all 5 files downloaded and are non-zero**

```bash
ls -lh public/images/
```

Expected: 5 `.jpg` files, each >100KB.

- [ ] **Step 4: Commit**

```bash
git add public/images/
git commit -m "assets: add thematic background images for all content sections"
```

---

## Chunk 2: About + Skills (Style 1, bg-fade)

### Task 3: AboutSection — subtle tint, fade-in

**Files:**
- Modify: `src/components/AboutSection.astro`

The `about-root` is the section element. The inner content is `.about-container.section-animate`. `.about-root` currently has no `position` or `overflow` set.

- [ ] **Step 1: Add section-bg div inside `<section id="about">`**

In `src/components/AboutSection.astro`, insert the background div as the **first child** of `<section id="about" class="about-root">`:

```html
<section id="about" class="about-root">

  <!-- Background layer -->
  <div class="section-bg" aria-hidden="true"></div>

  <!-- existing .about-container content unchanged below -->
```

- [ ] **Step 2: Add styles to the scoped `<style>` block**

Add these rules inside the existing `<style>` block (after `.about-root { ... }`):

```css
/* ── Background layer ─────────────────────────────────── */
.about-root {
  position: relative;
  overflow: hidden;
}

.section-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/images/bg-about.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.section-bg.is-visible {
  opacity: 0.12;
}

@media (prefers-reduced-motion: reduce) {
  .section-bg { transition: none; }
  .section-bg.is-visible { opacity: 0.12; }
}

/* Ensure existing content renders above background */
.about-container {
  position: relative;
  z-index: 1;
}
```

Note: `.about-container` already has other styles in the file — **add** `position: relative; z-index: 1;` to the existing `.about-container` rule rather than creating a duplicate selector.

- [ ] **Step 3: Add per-component observer script**

Add a `<script>` block at the bottom of `AboutSection.astro` (after the closing `</style>`):

```html
<script>
  // Background reveal — fire-once IntersectionObserver matching BaseLayout pattern
  const bgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          bgObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
  );
  document.querySelectorAll('#about .section-bg').forEach((el) => bgObserver.observe(el));
</script>
```

Note the scoped selector `#about .section-bg` — prevents this observer from accidentally targeting `.section-bg` elements in other sections if scripts run in the same page context.

- [ ] **Step 4: Verify no duplicate `.about-container` selector was introduced**

```bash
grep -c "\.about-container" src/components/AboutSection.astro
```

Expected: `1` — if you get `2`, merge the two rules into one.

- [ ] **Step 5: Verify in dev server**

With dev server running (`npm run dev`), open http://localhost:4321 and scroll to the About section. The background image should fade in as the section enters view. Text should remain fully legible over the dim image.

- [ ] **Step 6: Commit**

```bash
git add src/components/AboutSection.astro
git commit -m "feat(about): add pharmaceutical bg image with fade-in scroll transition"
```

---

### Task 4: SkillsSection — subtle tint, fade-in

**Files:**
- Modify: `src/components/SkillsSection.astro`

The `skills-root` is the section element. Inner content: `.skills-container.section-animate`. Same pattern as Task 3.

- [ ] **Step 1: Add section-bg div as first child of `<section id="skills" class="skills-root">`**

```html
<section id="skills" class="skills-root">

  <!-- Background layer -->
  <div class="section-bg" aria-hidden="true"></div>

  <!-- existing .skills-container content unchanged below -->
```

- [ ] **Step 2: Add styles to scoped `<style>` block**

Add after `.skills-root { ... }` rule:

```css
/* ── Background layer ─────────────────────────────────── */
.skills-root {
  position: relative;
  overflow: hidden;
}

.section-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/images/bg-skills.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.section-bg.is-visible {
  opacity: 0.12;
}

@media (prefers-reduced-motion: reduce) {
  .section-bg { transition: none; }
  .section-bg.is-visible { opacity: 0.12; }
}
```

Also add `position: relative; z-index: 1;` to the existing `.skills-container` rule.

- [ ] **Step 3: Add per-component observer script**

```html
<script>
  const bgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          bgObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
  );
  document.querySelectorAll('#skills .section-bg').forEach((el) => bgObserver.observe(el));
</script>
```

Note: the selector is scoped to `#skills .section-bg` (not just `.section-bg`) to prevent this observer from targeting background elements in other sections — all five component scripts run in the same page context.

- [ ] **Step 4: Verify no duplicate `.skills-container` selector was introduced**

```bash
grep -c "\.skills-container" src/components/SkillsSection.astro
```

Expected: `1` — if you get `2`, merge the two rules into one.

- [ ] **Step 5: Verify in dev server**

Scroll to Skills section — background should fade in. Skill chips and grid should remain fully visible over the image.

- [ ] **Step 6: Commit**

```bash
git add src/components/SkillsSection.astro
git commit -m "feat(skills): add supply chain bg image with fade-in scroll transition"
```

---

## Chunk 3: Experience + Projects (keyframe animations)

### Task 5: ExperienceSection — subtle tint, slide-up + fade

**Files:**
- Modify: `src/components/ExperienceSection.astro`

Inner content: `.exp-container.section-animate`. Uses `@keyframes bg-slide-up`.

- [ ] **Step 1: Add section-bg div as first child of `<section id="experience" class="exp-root">`**

```html
<section id="experience" class="exp-root">

  <!-- Background layer -->
  <div class="section-bg" aria-hidden="true"></div>

  <!-- existing .exp-container content unchanged below -->
```

- [ ] **Step 2: Add styles to scoped `<style>` block**

```css
/* ── Background layer ─────────────────────────────────── */
@keyframes bg-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 0.12; transform: translateY(0); }
}

.exp-root {
  position: relative;
  overflow: hidden;
}

.section-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/images/bg-experience.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0;
}

.section-bg.is-visible {
  animation: bg-slide-up 0.8s ease forwards;
}

@media (prefers-reduced-motion: reduce) {
  .section-bg.is-visible {
    animation: none;
    opacity: 0.12;
    transform: translateY(0);
  }
}
```

Add `position: relative; z-index: 1;` to the existing `.exp-container` rule.

- [ ] **Step 3: Add per-component observer script**

```html
<script>
  const bgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          bgObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
  );
  document.querySelectorAll('#experience .section-bg').forEach((el) => bgObserver.observe(el));
</script>
```

- [ ] **Step 4: Verify in dev server**

Scroll to Experience section — background should slide upward while fading in (subtle translateY + opacity animation). Timeline entries should remain fully legible.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExperienceSection.astro
git commit -m "feat(experience): add warehouse bg image with slide-up fade scroll transition"
```

---

### Task 6: ProjectsSection — floating accents, zoom + fade

**Files:**
- Modify: `src/components/ProjectsSection.astro`

This uses Style 2: two floating `section-bg-accent` divs in opposing corners. Inner content: `.projects-container.section-animate`.

- [ ] **Step 1: Add two accent divs as first children of `<section id="projects" class="projects-root">`**

```html
<section id="projects" class="projects-root">

  <!-- Floating background accents (Style 2) -->
  <div class="section-bg-accent section-bg-accent--tr" aria-hidden="true"></div>
  <div class="section-bg-accent section-bg-accent--bl" aria-hidden="true"></div>

  <!-- existing .projects-container content unchanged below -->
```

- [ ] **Step 2: Add styles to scoped `<style>` block**

```css
/* ── Floating background accents ─────────────────────── */
@keyframes bg-zoom {
  from { opacity: 0; transform: scale(1.05) rotate(var(--accent-rotate, 3deg)); }
  to   { opacity: 0.20; transform: scale(1) rotate(var(--accent-rotate, 3deg)); }
}

.projects-root {
  position: relative;
  overflow: hidden;
}

.section-bg-accent {
  position: absolute;
  width: 300px;
  height: 200px;
  border-radius: 8px;
  z-index: 0;
  background-image: url('/images/bg-projects.jpg');
  background-size: cover;
  opacity: 0;
}

.section-bg-accent--tr {
  top: -20px;
  right: -20px;
  --accent-rotate: 3deg;
  background-position: center top;
  mask-image: linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, transparent 65%);
  -webkit-mask-image: linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, transparent 65%);
}

.section-bg-accent--bl {
  bottom: -20px;
  left: -20px;
  --accent-rotate: -2deg;
  background-position: center bottom;
  mask-image: linear-gradient(to top right, rgba(0,0,0,0.85) 0%, transparent 65%);
  -webkit-mask-image: linear-gradient(to top right, rgba(0,0,0,0.85) 0%, transparent 65%);
}

.section-bg-accent.is-visible {
  animation: bg-zoom 1.0s ease forwards;
}

@media (prefers-reduced-motion: reduce) {
  .section-bg-accent.is-visible {
    animation: none;
    opacity: 0.20;
    transform: scale(1) rotate(var(--accent-rotate, 3deg));
  }
}
```

Add `position: relative; z-index: 1;` to the existing `.projects-container` rule.

- [ ] **Step 3: Add per-component observer script**

```html
<script>
  const bgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          bgObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
  );
  document.querySelectorAll('#projects .section-bg-accent').forEach((el) => bgObserver.observe(el));
</script>
```

- [ ] **Step 4: Verify in dev server**

Scroll to Projects section — both corner accents should zoom-and-fade in together. The top-right accent fades toward the interior; the bottom-left does the same. Project cards should be fully unobstructed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectsSection.astro
git commit -m "feat(projects): add robotics floating accent images with zoom-fade scroll transition"
```

---

## Chunk 4: Contact + Final Verification

### Task 7: ContactSection — subtle tint, fade-in, z-index fix

**Files:**
- Modify: `src/components/ContactSection.astro`

Inner content: `.contact-inner.section-animate`. Note: existing z-index:1 is only on `#contact-form` and `.contact-success` child elements — `.contact-inner` itself needs `position: relative; z-index: 1` to sit above `.section-bg`.

- [ ] **Step 1: Add section-bg div as first child of `<section id="contact" class="contact-root">`**

```html
<section id="contact" class="contact-root">

  <!-- Background layer -->
  <div class="section-bg" aria-hidden="true"></div>

  <!-- existing .contact-inner content unchanged below -->
```

- [ ] **Step 2: Add styles to scoped `<style>` block**

```css
/* ── Background layer ─────────────────────────────────── */
.contact-root {
  position: relative;
  overflow: hidden;
}

.section-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/images/bg-contact.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.section-bg.is-visible {
  opacity: 0.10;
}

@media (prefers-reduced-motion: reduce) {
  .section-bg { transition: none; }
  .section-bg.is-visible { opacity: 0.10; }
}
```

Also add `position: relative; z-index: 1;` to the existing `.contact-inner` rule. The existing z-index:1 on `#contact-form` and `.contact-success` children is untouched.

- [ ] **Step 3: Add per-component observer script**

```html
<script>
  const bgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          bgObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
  );
  document.querySelectorAll('#contact .section-bg').forEach((el) => bgObserver.observe(el));
</script>
```

- [ ] **Step 4: Verify in dev server**

Scroll to Contact — background fades in at 10% opacity (slightly more subtle than other sections). Form card and fields should remain fully usable and legible.

- [ ] **Step 5: Commit**

```bash
git add src/components/ContactSection.astro
git commit -m "feat(contact): add supply chain bg image with fade-in scroll transition"
```

---

### Task 8: Final end-to-end verification

- [ ] **Step 1: Run existing smoke test suite**

```bash
npm run build && npm run preview &
sleep 3
npx playwright test
```

Expected: All existing tests pass. The background imagery is purely additive — no existing functionality should regress.

- [ ] **Step 2: Full manual scroll-through**

With preview server running, scroll through the entire page top to bottom:
- Hero: video playing in background
- About: lab image fades in
- Skills: supply chain image fades in
- Experience: warehouse image slides up + fades in
- Projects: robotics accents zoom in at corners
- Contact: supply chain image fades in at 10%

Check that each section's text, cards, and interactive elements are fully legible and unobstructed.

- [ ] **Step 3: Check reduced motion**

In browser DevTools → Rendering tab → check "Emulate CSS media feature prefers-reduced-motion: reduce". Reload and scroll through:
- About / Skills / Experience / Contact: backgrounds should appear instantly at target opacity, no animation
- Projects: both corner accents should appear instantly at their target opacity (20%) **and** at their correct rotation — top-right accent tilted 3deg clockwise, bottom-left tilted 2deg counter-clockwise. If either accent appears un-rotated (flat), `var(--accent-rotate)` failed to resolve — verify the CSS custom property is declared on the element and the reduced-motion block includes `transform: scale(1) rotate(var(--accent-rotate, 3deg))`.

- [ ] **Step 4: Stop preview server and clean up**

```bash
pkill -f "astro preview" || true
```

- [ ] **Step 5: Final commit (if any cleanup needed)**

If any tweaks were made during verification:

```bash
git add -p
git commit -m "fix(visual): adjust background opacity/positioning after full review"
```
