# Visual Enhancement Design
**Date:** 2026-03-15
**Scope:** Hero video fix + thematic background imagery with scroll-in transitions across all content sections

---

## Overview

The site is fully built and functional but visually "clean to the point of dull." This enhancement adds:
1. A working hero background video (file rename only — markup already exists)
2. Thematic background imagery for each content section, with varied scroll-triggered entrance animations

No new components, no new abstractions. Each component owns its own background styles following the existing `section-animate` IntersectionObserver pattern.

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

### Style A — Subtle section tint (About, Skills, Experience, Contact)
- A `<div class="section-bg" aria-hidden="true">` is absolutely positioned inside the section (inset: 0, z-index: 0)
- `background-image`, `background-size: cover`, `background-position: center`
- Opacity target: 12% for About/Skills/Experience; 10% for Contact (form needs maximum readability)
- All existing section content sits at `z-index: 1` (already the case via existing `*-inner` z-index rules)

### Style C — Floating decorative accents (ProjectsSection only)
- Two `<div class="section-bg-accent">` elements, absolutely positioned in opposing corners (top-right and bottom-left)
- Each is ~300×200px, `border-radius: 8px`, slight rotation (`rotate(3deg)` / `rotate(-2deg)`)
- `background-image` from `bg-projects.jpg`, `background-size: cover`
- Opacity target: 20% (higher than tint style — small area, needs more presence)
- Gradient mask fades each accent toward the section interior so edges don't appear hard
- Both accents share the same source image, cropped to different positions via `background-position`

---

## 4. Scroll-in Transitions

All transitions are triggered by IntersectionObserver with `threshold: 0.15` — the same value used for `section-animate` throughout the site. The observer adds `is-visible` to the section root; CSS animates the background element when `is-visible` is present.

| Section | Keyframe | Duration | Easing |
|---------|----------|----------|--------|
| About | `bg-fade` — opacity 0 → 0.12 | 0.8s | ease |
| Skills | `bg-fade` — opacity 0 → 0.12 | 0.8s | ease |
| Experience | `bg-slide-up` — opacity 0 → 0.12 + translateY(20px) → 0 | 0.8s | ease |
| Projects | `bg-zoom` — opacity 0 → 0.20 + scale(1.05) → 1.0 | 1.0s | ease |
| Contact | `bg-fade` — opacity 0 → 0.10 | 0.8s | ease |

**Reduced motion:** All background animations respect `prefers-reduced-motion: reduce` — the `is-visible` class sets the final opacity immediately with no animation. This mirrors the existing pattern for `section-animate`.

**Initial state:** Opacity set to 0 in CSS only (not JS) to prevent flash-then-hide. This matches the established decision from Phase 5.

---

## 5. Implementation Pattern

Each modified component follows this exact structure:

```astro
<section id="about" class="about-root">
  <!-- Background layer -->
  <div class="section-bg" aria-hidden="true"></div>

  <!-- Existing content (unchanged) -->
  <div class="about-inner">...</div>
</section>

<script>
  // IntersectionObserver — same pattern as existing section-animate
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting)),
    { threshold: 0.15 }
  );
  document.querySelectorAll('.about-root').forEach(el => observer.observe(el));
</script>

<style>
  .about-root { position: relative; }

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

  .about-root.is-visible .section-bg {
    opacity: 0.12;
  }

  @media (prefers-reduced-motion: reduce) {
    .section-bg { transition: none; }
  }

  /* Ensure all existing content renders above bg */
  .about-inner { position: relative; z-index: 1; }
</style>
```

For ProjectsSection, the floating accent variant replaces `.section-bg` with two `.section-bg-accent` elements using the `bg-zoom` keyframe.

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
| `src/components/AboutSection.astro` | Add section-bg div + styles + observer |
| `src/components/SkillsSection.astro` | Add section-bg div + styles + observer |
| `src/components/ExperienceSection.astro` | Add section-bg div + styles + observer |
| `src/components/ProjectsSection.astro` | Add floating accent divs + styles + observer |
| `src/components/ContactSection.astro` | Add section-bg div + styles + observer |

---

## 7. Out of Scope

- HeroSection video markup — already complete, file rename only
- Nav, index.astro, global.css — no changes needed
- New shared components or utilities — each component is self-contained
