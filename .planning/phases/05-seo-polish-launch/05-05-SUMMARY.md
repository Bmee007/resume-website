---
phase: 05-seo-polish-launch
plan: "05"
subsystem: ui
tags: [astro, 404, accessibility, seo, alt-text, og-image]

# Dependency graph
requires:
  - phase: 05-02
    provides: BaseLayout with OG tags and SEO head — used by 404 page
  - phase: 05-03
    provides: scroll animations and IntersectionObserver in BaseLayout
  - phase: 05-04
    provides: hover states and emerald accent polish
provides:
  - "src/pages/404.astro — styled 404 page with ERP-themed copy and home CTA"
  - "All img alt text verified non-empty across HeroSection components"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "404.astro uses BaseLayout (not Nav directly) — auto-includes Nav without duplicate import"
    - "min-height: calc(100svh - 5rem) fills viewport below fixed nav on error pages"

key-files:
  created:
    - src/pages/404.astro
  modified: []

key-decisions:
  - "404.astro imports BaseLayout (not Nav directly) — BaseLayout auto-includes Nav, avoids double nav"
  - "min-height calc(100svh - 5rem) accounts for fixed 5rem nav height on error page"
  - "ERP-themed copy: 'Even ERP migrations hit a wrong path' with professional sub-copy"
  - "Alt text audit: hero photo has 'Borina Keo — ERP & WMS AI Integration Leader', brand icons use tech.name — all non-empty"
  - "OG image (public/og-image.png) is a user_setup item — human must create 1200x630 PNG before SEO-05 fully passes"

patterns-established:
  - "Error pages: BaseLayout + scoped CSS centering via flex, min-height accounting for nav"

requirements-completed: [POLSH-05]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 5 Plan 05: Final Polish — 404 Page, Alt Text Audit, OG Image Summary

**Styled Astro 404 page with ERP-themed copy, BaseLayout nav integration, and complete img alt text audit across HeroSection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T13:11:32Z
- **Completed:** 2026-03-15T13:13:37Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify — awaiting user)
- **Files modified:** 1

## Accomplishments
- Created `src/pages/404.astro` — ERP-themed witty headline, professional sub-copy, home CTA button
- 404 page uses BaseLayout (auto-includes Nav) — POLSH-05 smoke test passes GREEN
- Verified all img alt text: hero photo descriptive (>20 chars, includes "Borina Keo"), brand icons use `alt={tech.name}`
- 8 of 9 Phase 5 automated tests pass GREEN (SEO-05 OG image check awaits human-created asset)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create styled 404 page and audit all image alt text** - `9ca5b0d` (feat)

**Plan metadata:** TBD (docs commit after checkpoint approval)

## Files Created/Modified
- `src/pages/404.astro` — Styled error page with ERP-themed copy, BaseLayout integration, home CTA, scoped CSS centering

## Decisions Made
- Used BaseLayout import (not direct Nav import) — BaseLayout renders Nav automatically, avoids double nav bar
- `min-height: calc(100svh - 5rem)` fills the viewport below the 5rem fixed navigation
- Alt text audit confirmed: all img elements have non-empty, descriptive alt attributes — no fixes needed
- OG image (`public/og-image.png`) is a human-created asset documented in user_setup — cannot be auto-generated

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used `--project=desktop` instead of `--project=chromium`**
- **Found during:** Task 1 (test verification)
- **Issue:** Plan's verify command uses `--project=chromium` but playwright.config.ts defines `desktop`, `tablet`, `mobile` projects — chromium project does not exist
- **Fix:** Used `--project=desktop` (Chromium-based) for test execution
- **Files modified:** None (config not changed — command adjusted)
- **Verification:** Tests run successfully with `--project=desktop`
- **Committed in:** N/A (command adjustment only)

---

**Total deviations:** 1 auto-fixed (1 blocking — incorrect project name in verify command)
**Impact on plan:** Minor adjustment, no behavior change. All tests run correctly.

## User Setup Required

**OG image creation required before SEO-05 fully passes:**

Create `public/og-image.png` (1200x630px):
- Background: #0F172A dark navy
- Top: "Borina Keo" in white, ~72px, weight 600
- Below: "ERP & WMS AI Integration Leader" in #10B981 emerald, ~36px
- Optional: thin emerald left-edge stripe for brand accent

Use Figma, Canva, or any image editor. Place at `public/og-image.png`.

## Checkpoint: Human Verification Awaiting

The following manual steps are required before this plan is fully complete:

1. **Full smoke test suite** — `npx playwright test tests/phase5.spec.ts --project=desktop` (8/9 pass currently; SEO-05 needs OG image)
2. **Create public/og-image.png** — see User Setup Required above
3. **Lighthouse mobile score 90+** — run after `npm run build && npm run preview`
4. **WCAG AA contrast check** — axe DevTools or Lighthouse Accessibility audit
5. **LinkedIn OG card preview** — draft a post with the live Vercel URL
6. **404 page on live URL** — visit `https://[vercel-url]/this-page-does-not-exist`

## Next Phase Readiness
- Phase 5 is complete pending checkpoint approval
- After user approves: run full test suite, commit OG image, finalize REQUIREMENTS.md
- No blockers for site deployment — the 404 page and all automated tests (except OG image) are ready

---
*Phase: 05-seo-polish-launch*
*Completed: 2026-03-15*
