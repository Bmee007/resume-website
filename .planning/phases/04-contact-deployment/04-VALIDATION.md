---
phase: 4
slug: contact-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `playwright.config.ts` (root) |
| **Quick run command** | `npx playwright test tests/phase4.spec.ts --project=desktop` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/phase4.spec.ts --project=desktop`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | CONT-01–06 | smoke | `npx playwright test tests/phase4.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | CONT-01, CONT-02 | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-01\|CONT-02" --project=desktop` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | CONT-03, CONT-04 | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-03\|CONT-04" --project=desktop` | ❌ W0 | ⬜ pending |
| 4-02-03 | 02 | 1 | CONT-05, CONT-06 | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-05\|CONT-06" --project=desktop` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | CONT-01–06 | smoke | `npx playwright test --project=desktop` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase4.spec.ts` — 6 RED stubs for CONT-01 through CONT-06

*Wave 0 must create the test file before any implementation begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Form delivers email via Formspree | CONT-03, CONT-04 (success path) | Requires real Formspree form ID and live network call; cannot be automated without credentials | 1. Create Formspree account at formspree.io 2. Create form, verify email 3. Insert form ID 4. Submit test message 5. Confirm email delivery to Borina |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
