---
phase: 03-experience-ai-projects
plan: "01"
subsystem: testing
tags: [playwright, smoke-tests, tdd, experience, projects]

# Dependency graph
requires:
  - phase: 02-hero-about-skills
    provides: Established locator scoping pattern (scope to section IDs) and @smoke test conventions used in phase3.spec.ts
provides:
  - 9 RED Playwright smoke tests covering EXP-01 through PROJ-04 requirements
  - Confirmed acceptance criteria for ExperienceSection and ProjectsSection before implementation
affects:
  - 03-02-experience-section (turns EXP-01 through EXP-05 GREEN)
  - 03-03-projects-section (turns PROJ-01 through PROJ-04 GREEN)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scope ALL Playwright locators to section IDs to prevent strict mode violations"
    - "Pre-assert element count before iteration to avoid vacuous-pass on empty stubs"
    - "Use scrollIntoViewIfNeeded() before visibility assertions"
    - "Use page.evaluate() for DOM metric checks (scrollWidth vs offsetWidth)"

key-files:
  created:
    - tests/phase3.spec.ts
  modified: []

key-decisions:
  - "EXP-05 pre-asserts 3 .timeline-entry elements before checking overflow — prevents vacuous pass on empty stub section"
  - "PROJ-02 pre-asserts card count >= 2 before iterating cards — prevents vacuous pass when no .project-card elements exist"
  - "All 9 tests confirmed RED before commit — vacuous-pass edge cases discovered and fixed inline"

patterns-established:
  - "Pattern: Guard iteration tests with an up-front count assertion to prevent vacuous-pass on empty stubs"

requirements-completed: [EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, PROJ-01, PROJ-02, PROJ-03, PROJ-04]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 3 Plan 01: Experience & AI Projects Smoke Tests Summary

**9-test Playwright RED scaffold for Phase 3 — EXP-01 through PROJ-04 — with vacuous-pass guards on EXP-05 and PROJ-02**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T08:19:37Z
- **Completed:** 2026-03-15T08:22:47Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created tests/phase3.spec.ts with 9 @smoke-tagged tests covering all Phase 3 requirements
- Confirmed all 9 tests fail RED — components not yet built
- Fixed two vacuous-pass edge cases (EXP-05 and PROJ-02) discovered during RED verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 9 RED Playwright smoke tests for Phase 3** - `257ad4c` (test)

## Files Created/Modified

- `tests/phase3.spec.ts` - 9 @smoke Playwright tests for EXP-01 through PROJ-04; all confirmed RED

## Decisions Made

- EXP-05 vacuous-pass fix: added `await expect(page.locator('#experience .timeline-entry')).toHaveCount(3)` before the scrollWidth check — without this, an empty stub section trivially passes the overflow test
- PROJ-02 vacuous-pass fix: added `expect(count).toBeGreaterThanOrEqual(2)` before the card iteration loop — without this, zero cards means the loop body never runs and the test passes vacuously

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vacuous-pass on EXP-05 mobile overflow test**
- **Found during:** Task 1 (initial RED verification run)
- **Issue:** Empty `#experience` stub has `scrollWidth === offsetWidth` by default — test passed despite section not existing with entries
- **Fix:** Added pre-assertion `toHaveCount(3)` before overflow evaluation so test fails RED correctly
- **Files modified:** tests/phase3.spec.ts
- **Verification:** Re-ran suite; EXP-05 now fails RED with "expected 0 to be 3"
- **Committed in:** 257ad4c (Task 1 commit)

**2. [Rule 1 - Bug] Fixed vacuous-pass on PROJ-02 per-card iteration test**
- **Found during:** Task 1 (initial RED verification run)
- **Issue:** Empty `#projects` stub has zero `.project-card` elements — for-loop never executes so test passed vacuously
- **Fix:** Added `expect(count).toBeGreaterThanOrEqual(2)` before the loop so test fails RED correctly
- **Files modified:** tests/phase3.spec.ts
- **Verification:** Re-ran suite; PROJ-02 now fails RED with "expected 0 to be >= 2"
- **Committed in:** 257ad4c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — vacuous-pass edge cases)
**Impact on plan:** Both fixes necessary for correctness. Plan goal achieved: all 9 tests confirmed RED.

## Issues Encountered

Initial run produced 7/9 failing and 2/9 passing. Investigated and identified vacuous-pass conditions — fixed inline before commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- tests/phase3.spec.ts is committed as the acceptance-criteria scaffold for Phase 3
- Plans 03-02 (ExperienceSection) and 03-03 (ProjectsSection) will turn these 9 tests GREEN
- No blockers

---
*Phase: 03-experience-ai-projects*
*Completed: 2026-03-15*
