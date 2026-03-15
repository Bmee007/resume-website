---
phase: 1
slug: foundation-design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) — no unit test framework installed yet |
| **Config file** | `playwright.config.ts` — Wave 0 installs |
| **Quick run command** | `npx playwright test --grep @smoke` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds (smoke), ~90 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --grep @smoke`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-??-01 | TBD | 0 | FOUND-01 | smoke | `npx playwright test --grep "FOUND-01"` | ❌ W0 | ⬜ pending |
| 1-??-02 | TBD | 0 | FOUND-02 | smoke | `npx playwright test --grep "FOUND-02"` | ❌ W0 | ⬜ pending |
| 1-??-03 | TBD | 0 | FOUND-03 | smoke | `npx playwright test --grep "FOUND-03"` | ❌ W0 | ⬜ pending |
| 1-??-04 | TBD | 0 | FOUND-04 | manual | N/A — browser verify post-deploy | — | ⬜ pending |
| 1-??-05 | TBD | 0 | FOUND-05 | smoke | `npx playwright test --grep "FOUND-05"` | ❌ W0 | ⬜ pending |
| 1-??-06 | TBD | 0 | NAV-01 | smoke | `npx playwright test --grep "NAV-01"` | ❌ W0 | ⬜ pending |
| 1-??-07 | TBD | 0 | NAV-02 | smoke | `npx playwright test --grep "NAV-02"` | ❌ W0 | ⬜ pending |
| 1-??-08 | TBD | 0 | NAV-03 | smoke | `npx playwright test --grep "NAV-03"` | ❌ W0 | ⬜ pending |
| 1-??-09 | TBD | 0 | NAV-04 | smoke | `npx playwright test --grep "NAV-04"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase1.spec.ts` — smoke tests for FOUND-01, FOUND-02, FOUND-03, FOUND-05, NAV-01, NAV-02, NAV-03, NAV-04
- [ ] `playwright.config.ts` — base URL `http://localhost:4321`, viewport configs for 375/768/1280
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel preview URL returns HTTP 200 | FOUND-04 | Requires live deployment — no local equivalent | After `git push`, open Vercel dashboard, confirm preview URL loads without errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
