---
phase: 03-experience-ai-projects
plan: "03"
subsystem: ui
tags: [astro, liquid-glass, projects, ai-showcase, playwright]

# Dependency graph
requires:
  - phase: 03-01
    provides: 4 RED PROJ-* Playwright smoke tests (PROJ-01 through PROJ-04) as acceptance criteria
  - phase: 02-hero-about-skills
    provides: liquid-glass global class and chip pattern (re-declared locally in scoped styles)
provides:
  - src/components/ProjectsSection.astro — AI Projects showcase section with 3 liquid-glass cards
  - Conditional GitHub links to github.com/Bmee007 on 2 of 3 cards
  - 2-column responsive grid (single col mobile, 2-col at 768px breakpoint)
  - Leadership framing headline satisfying PROJ-04 /[Ll]ead/ assertion
affects:
  - Phase 4 (contact/footer) — Projects section is now fully wired into the single-page layout

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Re-declare .skill-chip pattern locally as .project-chip in scoped <style> — Astro scoped styles do not share across components"
    - "project-card-inner z-index:1 mandatory to render content above liquid-glass ::before pseudo-element (z-index:0)"
    - "Conditional GitHub link via {project.githubUrl && (<a ...>...</a>)} — no class:list needed"

key-files:
  created:
    - src/components/ProjectsSection.astro
  modified:
    - src/pages/index.astro
    - tests/phase3.spec.ts

key-decisions:
  - "PROJ-03 strict mode fix: added .first() to test locator to handle two GitHub links without Playwright strict mode violation"
  - "Two cards have githubUrl as specified in plan; third card (Supply Chain) has null — conditional template correctly omits link"
  - "Leadership tagline uses 'Leading AI-powered transformation across ERP & WMS systems' — satisfies /[Ll]ead/ regex check"

patterns-established:
  - "Pattern: Use .first() on Playwright locators when requirement is 'at least one' and multiple elements may match"

requirements-completed: [PROJ-01, PROJ-02, PROJ-03, PROJ-04]

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 3 Plan 03: AI Projects Section Summary

**Self-contained ProjectsSection.astro with 3 liquid-glass project cards, system/AI-tech chip pills, conditional GitHub links, and leadership framing — all 4 PROJ-* smoke tests GREEN**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-15T08:27:27Z
- **Completed:** 2026-03-15T08:28:50Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Created src/components/ProjectsSection.astro with 3 AI project cards in a responsive 2-column grid
- All 4 PROJ-* Playwright smoke tests pass on both desktop and mobile viewports
- Wired ProjectsSection into index.astro, replacing the Phase 3 stub section

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ProjectsSection.astro with 3 liquid-glass project cards** - `6975864` (feat)

## Files Created/Modified

- `src/components/ProjectsSection.astro` - AI Projects section with 3 cards, chips, outcomes, conditional GitHub links
- `src/pages/index.astro` - Replaced stub #projects section with ProjectsSection component import
- `tests/phase3.spec.ts` - Fixed PROJ-03 strict mode violation (added .first() to GitHub link locator)

## Decisions Made

- Added `.first()` to PROJ-03 test locator: the test was written expecting `.toBeVisible()` which strict-mode fails with multiple matches; since two cards have GitHub links (per plan spec), the fix is `.first()` on the locator
- Leadership headline uses "Leading AI-powered transformation..." in `<p class="projects-tagline">` — satisfies the PROJ-04 `/[Ll]ead/` text assertion from within `#projects`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PROJ-03 strict mode violation in pre-written test**
- **Found during:** Task 1 (verification run after building the component)
- **Issue:** `page.locator('#projects a[href*="github.com/Bmee007"]').toBeVisible()` fails with Playwright strict mode violation because the plan specifies two project cards with `githubUrl`, producing two matching anchors
- **Fix:** Added `.first()` to the locator — `page.locator('...').first().toBeVisible()` — which selects the first visible GitHub link without triggering strict mode
- **Files modified:** tests/phase3.spec.ts
- **Verification:** PROJ-03 test now passes; all 4 PROJ-* tests pass on desktop and mobile
- **Committed in:** 6975864 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug — strict mode violation in pre-written acceptance test)
**Impact on plan:** Fix necessary for test correctness. Component matches plan spec exactly (two GitHub links is correct behavior per data array).

## Issues Encountered

Initial test run produced PROJ-03 failing with strict mode violation. Investigation showed the pre-written test assumed a single GitHub link locator would resolve to one element, but the plan's data defines two projects with `githubUrl`. Added `.first()` to the locator — plan goal achieved, all 4 PROJ-* tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ProjectsSection.astro complete and wired into the single-page layout
- All Phase 3 acceptance criteria satisfied (EXP-01 through PROJ-04 pass)
- Phase 4 (contact/footer) can proceed with a complete page layout above the fold

---
*Phase: 03-experience-ai-projects*
*Completed: 2026-03-15*
