# Visual Enhancement Design
**Date:** 2026-03-15
**Scope:** Hero video fix + thematic background imagery with scroll-in transitions across all content sections

---

## Overview

The site is fully built and functional but visually "clean to the point of dull." This enhancement adds:
1. A working hero background video (file rename only — markup already exists)
2. Thematic background imagery for each content section, with varied scroll-triggered entrance animations

No new shared components. Each component owns its own background styles and a per-component `<script>` block for the background observer. The existing BaseLayout observer is not modified.

---

## 1. Hero Video Fix

**Problem:** `HeroSection.astro` already has the video markup with `src="/hero-video.mp4"`, but the file in `public/` is named `Hero-video.mp4` (capital H). macOS is case-insensitive but Vercel/Linux deployments are not — the video silently fails in production.

**Fix:** Rename `public/Hero-video.mp4` → `public/hero-video.mp4`. No markup changes needed.

---

## 2. Background Images

Images are sourced from Unsplash (free, no attribution required for web use) and downloaded to `public/images/`. One image per section, chosen to match the professional domain of each section's content.

| File | Theme | Section |
|------|-------|---------|
| `public/images/bg-about.jpg` | Pharmaceuticals / cleanroom lab | AboutSection |
| `public/images/bg-skills.jpg` | Supply chain / logistics network | SkillsSection |
| `public/images/bg-experience.jpg` | Warehouse automation | ExperienceSection |
| `public/images/bg-projects.jpg` | Robotics / automation | ProjectsSection |
| `public/images/bg-contact.jpg` | Supply chain / logistics | ContactSection |

**Image selection criteria:** Dark-toned or easily overlayable images. Avoid images with high contrast text areas. Landscape orientation preferred (wide sections).

---

## 3. Visual Style per Section

Two styles are used across the site:

### Style 1 — Subtle section tint (About, Skills, Experience, Contact)
- A `<div class="section-bg" aria-hidden="true">` absolutely positioned inside the section root (inset: 0, z-index: 0), placed before the inner content wrapper in DOM order
- `background-image`, `background-size: cover`, `background-position: center`
- Opacity targets: 12% for About/Skills/Experience; 10% for Contact (form needs maximum readability)
- All existing section content sits in a wrapper div with `position: relative; z-index: 1` (already the pattern for `*-inner` / `*-container` divs throughout the codebase; ContactSection needs `z-index: 1` added to `.contact-inner` since its current z-index is only on child elements)

### Style 2 — Floating decorative accents (ProjectsSection only)
- Two `<div class="section-bg-accent">` elements, absolutely positioned in opposing corners:
  - `.section-bg-accent--tr` (top-right): `top: -20px; right: -20px; transform: rotate(3deg)`
  - `.section-bg-accent--bl` (bottom-left): `bottom: -20px; left: -20px; transform: rotate(-2deg)` (applied in CSS)
- Each is `width: 300px; height: 200px; border-radius: 8px; position: absolute; z-index: 0`
- `background-image: url('/images/bg-projects.jpg'); background-size: cover`
- `background-position: center top` for `--tr`; `background-position: center bottom` for `--bl`
- Opacity target: 20%
- Gradient mask fades each accent toward the section interior:
  ```css
  /* top-right accent — fades toward bottom-left */
  .section-bg-accent--tr {
    mask-image: linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, transparent 65%);
    -webkit-mask-image: linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, transparent 65%);
  }
  /* bottom-left accent — fades toward top-right */
  .section-bg-accent--bl {
    mask-image: linear-gradient(to top right, rgba(0,0,0,0.85) 0%, transparent 65%);
    -webkit-mask-image: linear-gradient(to top right, rgba(0,0,0,0.85) 0%, transparent 65%);
  }
  ```

---

## 4. Scroll-in Transitions

### Observer setup (per component `<script>` block)

Each component adds its own IntersectionObserver that targets its `.section-bg` (or `.section-bg-accent`) elements directly. `is-visible` is applied to the background element itself (not the section root). Fire-once via `unobserve`, matching the existing BaseLayout pattern.

```js
// Per-component script — add inside <script> in each affected .astro file
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
document.querySelectorAll('.section-bg, .section-bg-accent').forEach((el) => bgObserver.observe(el));
```

Note: The selector targets the background element directly, so `is-visible` lands on `.section-bg` / `.section-bg-accent`. CSS rules key off `.section-bg.is-visible`, not `.section-root.is-visible .section-bg`.

### Animations per section

| Section | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| About | `bg-fade` — opacity 0 → 0.12 (CSS transition) | 0.8s | ease |
| Skills | `bg-fade` — opacity 0 → 0.12 (CSS transition) | 0.8s | ease |
| Experience | `bg-slide-up` — opacity 0→0.12 + translateY(20px)→0 (`@keyframes`) | 0.8s | ease |
| Projects | `bg-zoom` — opacity 0→0.20 + scale(1.05)→1.0 (`@keyframes`) | 1.0s | ease |
| Contact | `bg-fade` — opacity 0 → 0.10 (CSS transition) | 0.8s | ease |

### Keyframe definitions

```css
/* Experience — slide up + fade */
@keyframes bg-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 0.12; transform: translateY(0); }
}

/* Projects — zoom in + fade (applied to both accent elements) */
@keyframes bg-zoom {
  from { opacity: 0; transform: scale(1.05) rotate(var(--accent-rotate, 3deg)); }
  to   { opacity: 0.20; transform: scale(1) rotate(var(--accent-rotate, 3deg)); }
}
```

Use `--accent-rotate` CSS custom property per accent element so the zoom keyframe preserves the element's rotation:
```css
.section-bg-accent--tr { --accent-rotate: 3deg; }
.section-bg-accent--bl { --accent-rotate: -2deg; }
```

### CSS for fade sections (About, Skills, Contact)

```css
.section-bg {
  /* ... positioning, background-image ... */
  opacity: 0;
  transition: opacity 0.8s ease;
}
.section-bg.is-visible {
  opacity: 0.12; /* or 0.10 for Contact */
}
```

### CSS for keyframe sections (Experience)

```css
.section-bg {
  /* ... positioning, background-image ... */
  opacity: 0;
}
.section-bg.is-visible {
  animation: bg-slide-up 0.8s ease forwards;
}
```

### CSS for keyframe sections (Projects accents)

```css
.section-bg-accent {
  /* ... positioning, background-image, mask ... */
  opacity: 0;
}
.section-bg-accent.is-visible {
  animation: bg-zoom 1.0s ease forwards;
}
```

### Reduced motion

For transition-based (About, Skills, Contact):
```css
@media (prefers-reduced-motion: reduce) {
  .section-bg { transition: none; }
  .section-bg.is-visible { opacity: 0.12; }
}
```

For keyframe-based (Experience):
```css
@media (prefers-reduced-motion: reduce) {
  .section-bg.is-visible {
    animation: none;
    opacity: 0.12;
    transform: translateY(0);
  }
}
```

For keyframe-based (Projects accents):
```css
@media (prefers-reduced-motion: reduce) {
  .section-bg-accent.is-visible {
    animation: none;
    opacity: 0.20;
    transform: scale(1) rotate(var(--accent-rotate, 3deg));
  }
}
```

**Initial state:** Opacity set to 0 in CSS only (not JS) to prevent flash-then-hide. Matches established decision from Phase 5.

---

## 5. Implementation Pattern

Full example — AboutSection (Style 1, bg-fade):

```astro
<section id="about" class="about-root">
  <!-- Background layer — before content in DOM, z-index 0 -->
  <div class="section-bg" aria-hidden="true"></div>

  <!-- Existing content wrapper — z-index 1 (position: relative required) -->
  <div class="about-container">
    <!-- ...existing content unchanged... -->
  </div>
</section>

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
  document.querySelectorAll('.section-bg').forEach((el) => bgObserver.observe(el));
</script>

<style>
  .about-root { position: relative; overflow: hidden; }

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

  .section-bg.is-visible { opacity: 0.12; }

  @media (prefers-reduced-motion: reduce) {
    .section-bg { transition: none; }
    .section-bg.is-visible { opacity: 0.12; }
  }

  .about-container { position: relative; z-index: 1; }
</style>
```

---

## 6. Files Changed

| File | Change |
|------|--------|
| `public/Hero-video.mp4` | Renamed to `hero-video.mp4` |
| `public/images/bg-about.jpg` | New — sourced from Unsplash |
| `public/images/bg-skills.jpg` | New — sourced from Unsplash |
| `public/images/bg-experience.jpg` | New — sourced from Unsplash |
| `public/images/bg-projects.jpg` | New — sourced from Unsplash |
| `public/images/bg-contact.jpg` | New — sourced from Unsplash |
| `src/components/AboutSection.astro` | Add section-bg div + styles + per-component observer |
| `src/components/SkillsSection.astro` | Add section-bg div + styles + per-component observer |
| `src/components/ExperienceSection.astro` | Add section-bg div + styles + observer; `bg-slide-up` keyframe |
| `src/components/ProjectsSection.astro` | Add 2 floating accent divs + styles + observer; `bg-zoom` keyframe |
| `src/components/ContactSection.astro` | Add section-bg div + styles + observer; add `z-index:1` to `.contact-inner` |

---

## 7. Out of Scope

- HeroSection video markup — already complete, file rename only
- BaseLayout.astro — no changes needed; background observer is per-component
- Nav, index.astro, global.css — no changes needed
- New shared components or utilities — each component is self-contained
