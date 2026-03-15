---
phase: 02-hero-about-skills
plan: 01
subsystem: testing
tags: [playwright, smoke-tests, tdd, phase2, hero, about, skills]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: Dev server at localhost:4321 with Playwright infrastructure, #about and #skills section stubs, HeroSection.astro with H1 heading

provides:
  - 12 Playwright smoke tests (HERO-01 through SKILL-05) in tests/phase2.spec.ts
  - RED baseline for hero photo, social icons, about bio, stat callouts, and all skills section requirements
  - GREEN baseline for HERO-01 (heading) and HERO-03 (contact CTA) confirming existing stubs work

affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scoping Playwright locators to section IDs (e.g. #hero h1) to avoid strict mode violations from multiple matching elements"
    - "RED smoke tests with @smoke tag for per-requirement targeted test runs"
    - ".skill-chip and .stat-box as semantic test targets (CSS class naming drives test assertions)"

key-files:
  created:
    - tests/phase2.spec.ts
  modified: []

key-decisions:
  - "HERO-01 scoped to #hero h1 to avoid strict mode violation from Playwright overlay h1 elements (multiple h1s on page)"
  - "HERO-01 and HERO-03 accepted as GREEN baseline — heading and contact stub existed from Phase 1"
  - "10 of 12 tests fail RED confirming unimplemented sections; exceeds required minimum of 8"

patterns-established:
  - "Phase 2 test pattern: scope locators to section IDs (#hero, #about, #skills) to avoid strict mode violations"
  - "Chip-based skill display confirmed by .skill-chip locator with plain ul li count = 0 assertion"

requirements-completed:
  - HERO-01
  - HERO-02
  - HERO-03
  - HERO-04
  - ABOUT-01
  - ABOUT-02
  - ABOUT-03
  - SKILL-01
  - SKILL-02
  - SKILL-03
  - SKILL-04
  - SKILL-05

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 2 Plan 01: Phase 2 Smoke Test Scaffold Summary

**12-test Playwright smoke scaffold covering HERO, About, and Skills requirements — 10 tests fail RED establishing unimplemented section baseline**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T06:03:06Z
- **Completed:** 2026-03-15T06:08:06Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created tests/phase2.spec.ts with all 12 smoke tests matching HERO-01 through SKILL-05 requirement IDs
- 10 of 12 tests fail RED confirming unimplemented hero photo, social icons, about bio/stats, and all skills section content
- 2 tests pass GREEN (HERO-01 heading, HERO-03 contact CTA) establishing correct baseline for already-existing stubs
- Phase 1 tests remain in their prior state (FOUND-02 pre-existing failure unaffected by this plan)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tests/phase2.spec.ts with 12 RED smoke tests** - `ed07861` (test)

**Plan metadata:** (to follow in docs commit)

## Files Created/Modified

- `/Users/mylinh/projects/resume-website/tests/phase2.spec.ts` - 12 Playwright smoke tests for all Phase 2 requirements

## Decisions Made

- Scoped `h1` locator to `#hero h1` to resolve strict mode violation — the page contained 5 `h1` elements including Playwright DevTools overlay elements; scoping to section ID is the correct pattern for all phase 2 tests
- HERO-01 and HERO-03 accepted as GREEN — the plan explicitly noted these would likely pass since the heading and contact stub already exist from Phase 1
- Pre-existing FOUND-02 failure (design token `--color-bg` value mismatch) is out of scope for this plan; not caused by phase2.spec.ts creation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed HERO-01 strict mode violation from unscoped h1 locator**
- **Found during:** Task 1 (Create tests/phase2.spec.ts)
- **Issue:** `page.locator("h1")` resolved to 5 elements due to Playwright DevTools overlay injecting additional h1 elements
- **Fix:** Changed selector to `page.locator("#hero h1")` to scope to the hero section specifically
- **Files modified:** tests/phase2.spec.ts
- **Verification:** HERO-01 now passes (heading exists in Phase 1 stub as expected by plan)
- **Committed in:** ed07861 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — strict mode selector scope)
**Impact on plan:** Auto-fix corrects test accuracy without changing intent. No scope creep.

## Issues Encountered

- Playwright strict mode violation on `h1` locator: multiple h1 elements found (Playwright overlay injects h1 elements during test execution). Fixed by scoping locator to parent section ID — this pattern will apply to all phase 2 tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RED baseline established for all 10 unimplemented requirements
- Implementation tasks (02-02 through 02-05) can each verify their work with targeted test runs: `npx playwright test tests/phase2.spec.ts -g "HERO-02" --project=desktop`
- All section IDs (#hero, #about, #skills) confirmed to scope locators correctly

---
*Phase: 02-hero-about-skills*
*Completed: 2026-03-15*
