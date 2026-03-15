# Deferred Items Log

## FOUND-02 Test Failure (Pre-Existing)

**Discovered during:** Plan 02-02 execution
**Scope:** Out of scope for 02-02 (pre-existing issue from 01-02 execution)

**Issue:** `tests/phase1.spec.ts` FOUND-02 checks for CSS variable `--color-bg` in the `@theme` block. This variable was removed from `src/styles/global.css` during Phase 01-02 execution (replaced with HSL-based `--background` token). The test still expects the old `--color-bg: #0F172A` value.

**Evidence:**
- `git diff HEAD src/styles/global.css` shows `--color-bg` removed from the working tree
- The test assertion: `expect(bgColor === "#0F172A" || bgColor === "rgb(15, 23, 42)").toBe(true)` fails because `--color-bg` is now empty string
- All other Phase 1 tests (9 of 10) pass

**Resolution options:**
1. Update FOUND-02 test to check `--background` (HSL token) instead of `--color-bg`
2. Re-add `--color-bg` as an alias in global.css

**Recommended fix:** Update the test to check the actual current design tokens (`--color-accent` + `--background`).
