---
phase: 01-foundation-design-system
plan: 04
subsystem: testing
tags: [playwright, smoke-tests, nav, css-visibility]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: Nav.astro with .desktop-nav CSS class and mobile hamburger menu
provides:
  - Corrected phase 1 smoke test suite passing all 30 tests across 3 viewport projects
affects: [phase-02, future-smoke-tests]

# Tech tracking
tech-stack:
  added: []
  patterns: [Use .desktop-nav locator (not .nav-links) for desktop nav assertions, Use toBeInViewport() expect assertion (not locator.isInViewport()), Open hamburger menu before clicking mobile nav links in tests]

key-files:
  created: []
  modified: [tests/phase1.spec.ts]

key-decisions:
  - "NAV-04 assertion uses .desktop-nav with not.toBeVisible() — CSS-driven visibility, not class attribute check"
  - "NAV-02 uses toBeInViewport() expect assertion — locator.isInViewport() is not available in Playwright 1.58.2"
  - "NAV-02 mobile path opens hamburger menu before clicking nav link since desktop nav is hidden at 375px"
  - "NAV-03 scopes locator to .desktop-nav to avoid strict mode violation from duplicate .nav-link elements in mobile menu"

patterns-established:
  - "Test desktop nav visibility: page.locator('.desktop-nav').not.toBeVisible() — not class attribute checks"
  - "Viewport-aware nav clicks: check hamburger visibility and branch to mobile-nav-link path at mobile widths"
  - "Strict locator scoping: scope nav link selectors to .desktop-nav or .mobile-nav-link to avoid ambiguity"

requirements-completed: [NAV-04, FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, NAV-01, NAV-02, NAV-03]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 1 Plan 04: Fix NAV-04 Smoke Test (Gap Closure) Summary

**Phase 1 smoke gate unblocked: all 30 Playwright tests pass across desktop/tablet/mobile with corrected .desktop-nav CSS-visibility assertions and viewport-aware nav click logic**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T01:08:58Z
- **Completed:** 2026-03-15T01:13:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Fixed NAV-04: replaced `.nav-links`/`toHaveClass(/hidden/)` with `.desktop-nav`/`not.toBeVisible()` to match actual Nav.astro DOM
- Fixed NAV-02: replaced non-existent `locator.isInViewport()` with correct `expect().toBeInViewport()` assertion; added hamburger-open path for mobile viewport
- Fixed NAV-03: scoped locator to `.desktop-nav a[href="#skills"]` to prevent strict mode violation from mobile menu duplicate links
- Smoke suite exits 0 with all 30 tests passing (10 tests x 3 viewport projects)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix NAV-04 smoke test class name mismatch (+ NAV-02 and NAV-03 auto-fixes)** - `cae87aa` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `tests/phase1.spec.ts` - Corrected NAV-04, NAV-02, NAV-03 assertions for correct Playwright API and actual Nav.astro DOM structure

## Decisions Made

- Used `not.toBeVisible()` (not `toHaveClass(/hidden/)`) because `.desktop-nav` hides via CSS `display:none`, not a class toggle
- Used `expect(locator).toBeInViewport()` not `locator.isInViewport()` — the latter is not available in Playwright 1.58.2
- Added hamburger-open branch in NAV-02 because desktop nav is CSS-hidden at 375px and Playwright refuses to click hidden elements
- Scoped NAV-03 to `.desktop-nav` to avoid strict-mode violation from the mobile menu sharing `.nav-link` class

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed NAV-02 non-existent `isInViewport()` locator method**
- **Found during:** Task 1 (running smoke suite after NAV-04 fix)
- **Issue:** `page.locator("#about").isInViewport()` throws TypeError — method does not exist on Locator in Playwright 1.58.2
- **Fix:** Changed to `expect(page.locator("#about")).toBeInViewport()` — the correct expect assertion API
- **Files modified:** tests/phase1.spec.ts
- **Verification:** NAV-02 passes on all 3 viewport projects
- **Committed in:** cae87aa (Task 1 commit)

**2. [Rule 1 - Bug] Fixed NAV-02 mobile: desktop nav link not clickable at 375px**
- **Found during:** Task 1 (smoke suite after initial fixes)
- **Issue:** `page.click('a[href="#about"]')` at 375px tries to click the `.desktop-nav` link which is CSS `display:none` — Playwright correctly refuses
- **Fix:** Added hamburger-visibility check; if hamburger is shown (mobile), open mobile menu first then click `.mobile-nav-link[href="#about"]`
- **Files modified:** tests/phase1.spec.ts
- **Verification:** NAV-02 passes on mobile project (375px)
- **Committed in:** cae87aa (Task 1 commit)

**3. [Rule 1 - Bug] Fixed NAV-03 strict mode violation from ambiguous locator**
- **Found during:** Task 1 (smoke suite after initial NAV-04 fix)
- **Issue:** `a[href="#skills"].nav-link` resolved to 2 elements: desktop nav link and mobile nav link (both have `.nav-link` class) — Playwright strict mode rejects this
- **Fix:** Changed locator to `.desktop-nav a[href="#skills"]` to uniquely target the desktop nav Skills link
- **Files modified:** tests/phase1.spec.ts
- **Verification:** NAV-03 passes on all 3 viewport projects with no strict mode error
- **Committed in:** cae87aa (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 x Rule 1 - Bug)
**Impact on plan:** All auto-fixes were necessary for the smoke suite to function correctly. The original test file had several broken assertions beyond the NAV-04 fix described in the plan. No scope creep — all fixes are in the same file (tests/phase1.spec.ts).

## Issues Encountered

- The plan described only one fix (NAV-04 class name), but running the suite revealed 3 additional broken assertions in NAV-02 and NAV-03. All were auto-fixed per Rule 1 (broken behavior/incorrect output).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 smoke gate is fully unblocked: `npx playwright test --grep @smoke` exits 0 with 30/30 tests passing
- Phase 2 content sections can begin with confidence that the navigation, layout, and design token foundation is verified
- No blockers remain from Phase 1

---
*Phase: 01-foundation-design-system*
*Completed: 2026-03-15*
