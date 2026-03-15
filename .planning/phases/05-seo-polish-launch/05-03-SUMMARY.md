---
phase: 05-seo-polish-launch
plan: "03"
subsystem: ui
tags: [css-animation, intersection-observer, scroll-reveal, keyframes, prefers-reduced-motion, astro]

# Dependency graph
requires:
  - phase: 05-01
    provides: Phase 5 smoke tests including POLSH-01 scroll-animation assertion
provides:
  - CSS hero-fade-in keyframe animation on HeroSection heading and subheading
  - section-animate CSS class and IntersectionObserver scroll-reveal for About, Skills, Experience, Projects, Contact sections
  - Shared IntersectionObserver script in BaseLayout body
  - prefers-reduced-motion compliance throughout animations
affects:
  - future-visual-polish
  - accessibility

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS keyframe load animation for above-fold hero content (no JS)
    - IntersectionObserver scroll-reveal pattern with single shared observer in BaseLayout
    - Astro scoped style isolation requires section-animate CSS duplicated in each component

key-files:
  created: []
  modified:
    - src/components/HeroSection.astro
    - src/components/AboutSection.astro
    - src/components/SkillsSection.astro
    - src/components/ExperienceSection.astro
    - src/components/ProjectsSection.astro
    - src/components/ContactSection.astro
    - src/layouts/BaseLayout.astro

key-decisions:
  - "Astro scoped style isolation: section-animate CSS must be declared independently in each component's scoped block — global CSS or BaseLayout styles do not reach component elements"
  - "Initial hidden state set only in CSS (opacity: 0 in .section-animate rule) — never in JS — prevents flash-then-hide glitch"
  - "Single shared IntersectionObserver in BaseLayout body handles all sections; no per-component JS needed"
  - "Animate section container div (not the section root) as one unit per section — no staggered card animations to avoid layout flash"

patterns-established:
  - "Hero animation pattern: CSS keyframe only, no JS, hero-fade-in with 150ms stagger between heading and subheading"
  - "Section reveal pattern: .section-animate CSS class + IntersectionObserver adds .is-visible class; rootMargin -10%/0px/-10%/0px fires when 10% inside viewport"
  - "prefers-reduced-motion pattern: both hero and section animations reset to opacity 1, transform none, animation/transition none"

requirements-completed:
  - POLSH-01

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 5 Plan 03: Scroll Animations Summary

**CSS keyframe hero load animation and IntersectionObserver scroll-reveal for all five non-hero sections, respecting prefers-reduced-motion throughout**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T12:58:57Z
- **Completed:** 2026-03-15T13:03:05Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Hero heading fades in on page load (600ms ease) with subheading following 150ms later — pure CSS keyframe, no JS
- All five non-hero sections (About, Skills, Experience, Projects, Contact) now start hidden (opacity 0, translateY 20px) and animate in as user scrolls to them
- Single shared IntersectionObserver script in BaseLayout fires once per element and unobserves after trigger
- prefers-reduced-motion respected: all animations disabled, content immediately visible for users with motion sensitivity
- POLSH-01 smoke test passes GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hero load animation to HeroSection.astro** - `7366387` (feat)
2. **Task 2: Add section-animate to all sections + shared IntersectionObserver in BaseLayout** - `04c3c2a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/HeroSection.astro` - Added @keyframes hero-fade-in; animation on .hero-heading (0ms) and .hero-sub (150ms delay); prefers-reduced-motion override
- `src/components/AboutSection.astro` - Added section-animate class to .about-container; scoped section-animate CSS
- `src/components/SkillsSection.astro` - Added section-animate class to .skills-container; scoped section-animate CSS
- `src/components/ExperienceSection.astro` - Added section-animate class to .exp-container; scoped section-animate CSS
- `src/components/ProjectsSection.astro` - Added section-animate class to .projects-container; scoped section-animate CSS
- `src/components/ContactSection.astro` - Added section-animate class to .contact-inner; scoped section-animate CSS
- `src/layouts/BaseLayout.astro` - Added shared IntersectionObserver script at end of body

## Decisions Made

- Astro scoped style isolation: section-animate CSS must be declared independently in each component's scoped style block. Adding it only in global.css or BaseLayout would not style the elements correctly due to Astro's CSS scoping by component.
- Initial hidden state is set only in CSS (opacity: 0 in .section-animate rule), never in JavaScript. This prevents the flash-then-hide glitch where elements briefly appear visible before JS hides them.
- One .section-animate wrapper per section animates as a single unit. Individual card staggering was avoided as it introduces layout flash complexity.
- IntersectionObserver rootMargin -10%/0px/-10%/0px chosen so sections trigger when 10% inside the viewport — prevents animations triggering on barely-visible edge cases.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Playwright project name is "desktop" not "chromium" (per existing playwright.config.ts from earlier phases). Test was run with `--project=desktop`. POLSH-01 passes GREEN.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scroll animations complete; site now has polished Linear/Vercel-style section reveals
- Ready for Plan 05-04 (hover effects / POLSH-02) or any remaining Phase 5 plans
- No blockers

## Self-Check: PASSED

- HeroSection.astro: FOUND
- BaseLayout.astro: FOUND
- 05-03-SUMMARY.md: FOUND
- Commit 7366387 (Task 1): FOUND
- Commit 04c3c2a (Task 2): FOUND

---
*Phase: 05-seo-polish-launch*
*Completed: 2026-03-15*
