---
phase: 03-experience-ai-projects
plan: "02"
subsystem: ui
tags: [astro, timeline, liquid-glass, css-animation, experience]

# Dependency graph
requires:
  - phase: 03-experience-ai-projects
    plan: "01"
    provides: 9 RED Playwright smoke tests covering EXP-01 through EXP-05 acceptance criteria
  - phase: 02-hero-about-skills
    provides: liquid-glass global class in global.css; entry-inner z-index:1 pattern established

provides:
  - ExperienceSection.astro — self-contained vertical timeline with 3 experience entries
  - Two featured entries with liquid-glass surface + emerald left-border stripe + pulsing dot animation
  - Regular entry with flat slate-800 card, no glass effect
  - CSS-only dot-pulse @keyframes animation on featured timeline entries
affects:
  - 03-03-projects-section (sibling plan; index.astro now has ExperienceSection slotted in)
  - Any future phase that queries #experience section

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "entry-inner z-index:1 required to render content above liquid-glass::before pseudo-element (z-index:0)"
    - "Use class:list directive (not string concatenation) for conditional Astro classes"
    - "Do NOT add overflow:hidden to .timeline-track — would clip the dot that sits outside the padding area"

key-files:
  created:
    - src/components/ExperienceSection.astro
  modified:
    - src/pages/index.astro

key-decisions:
  - "entry-inner z-index:1 mandatory — liquid-glass::before is position:absolute z-index:0; without it, content is hidden behind the pseudo-element"
  - "timeline-track uses padding-left:2.5rem (not margin) to position entries right of the vertical rule without creating overflow risk"
  - "is-featured .entry-card border-left:3px solid #10B981 applied via CSS selector on parent .is-featured — keeps featured visual treatment isolated to CSS"

patterns-established:
  - "Pattern: Vertical timeline dot via ::before on .timeline-entry with position:absolute left:-2.125rem — sits in the padding-left gutter of .timeline-track"

requirements-completed: [EXP-01, EXP-02, EXP-03, EXP-04, EXP-05]

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 3 Plan 02: ExperienceSection Summary

**Vertical career timeline with liquid-glass featured entries, CSS pulsing dot animation, and flat slate cards — all 5 EXP-* smoke tests pass desktop and mobile**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-15T08:24:40Z
- **Completed:** 2026-03-15T08:25:51Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Created ExperienceSection.astro — fully self-contained Astro component, zero JS, zero new deps
- Two featured entries (D365 migration, Manhattan DFIO) rendered with liquid-glass + emerald left-border stripe + pulsing dot via CSS-only @keyframes
- Regular entry (AI & ERP Integration Lead) uses flat slate-800 card with slate-700 border
- CSS vertical rule + entry dots via ::before pseudo-elements with correct z-index layering
- All 5 EXP-* Playwright smoke tests pass on both desktop and mobile

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ExperienceSection.astro with vertical timeline** - `502c1f5` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/components/ExperienceSection.astro` - Vertical timeline component with 3 entries, liquid-glass featured cards, flat regular card, CSS-only pulsing dot animation
- `src/pages/index.astro` - Replaced #experience stub section with ExperienceSection import and component tag

## Decisions Made

- `entry-inner` z-index:1 is critical — `liquid-glass::before` is `position:absolute; z-index:0`; without `entry-inner` having `z-index:1`, all text content is hidden behind the gradient border pseudo-element
- `.timeline-track` uses `padding-left: 2.5rem` (not margin) so the track width stays within the page bounds — margin would push the track right and potentially cause overflow
- Featured emerald border applied via `.is-featured .entry-card { border-left: 3px solid #10B981 }` — scoping the selector to `.is-featured` parent means featured visual treatment is isolated entirely in CSS with no inline style needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - component built from spec in a single pass; Astro build clean; all 5 EXP-* tests green immediately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ExperienceSection.astro committed and all EXP-* smoke tests GREEN
- Plan 03-03 (ProjectsSection) can proceed — index.astro still has the #projects stub section
- No blockers

---
*Phase: 03-experience-ai-projects*
*Completed: 2026-03-15*
