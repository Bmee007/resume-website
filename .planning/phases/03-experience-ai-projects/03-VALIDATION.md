---
phase: 3
slug: experience-ai-projects
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test tests/phase3.spec.ts --project=desktop` |
| **Full suite command** | `npx playwright test --project=desktop --project=mobile` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/phase3.spec.ts --project=desktop`
- **After every plan wave:** Run `npx playwright test --project=desktop --project=mobile`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | EXP-01…PROJ-04 | smoke stub | `npx playwright test tests/phase3.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | EXP-01, EXP-02, EXP-03, EXP-04, EXP-05 | smoke | `npx playwright test tests/phase3.spec.ts -g "EXP" --project=desktop` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | PROJ-01, PROJ-02, PROJ-03, PROJ-04 | smoke | `npx playwright test tests/phase3.spec.ts -g "PROJ" --project=desktop` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | EXP-01…PROJ-04 | smoke | `npx playwright test tests/phase3.spec.ts --project=desktop --project=mobile` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase3.spec.ts` — smoke test stubs for EXP-01 through EXP-05 and PROJ-01 through PROJ-04
- [ ] Framework install: already present (Playwright 1.58.2 installed in Phase 1)

*Wave 0 creates `tests/phase3.spec.ts` before any component code is written.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Metric placeholders look intentional (brackets readable) | EXP-02 | Visual/copy judgment | Load page, read bullet text — brackets like `[X]%` should look deliberate, not broken |
| Pulse animation on featured dots feels subtle | EXP-03, EXP-04 | Animation feel is subjective | Load page, scroll to Experience — emerald dot pulse should be gentle, not distracting |
| Leadership framing reads naturally | PROJ-04 | Copy tone is subjective | Read "AI Integrations" section headline — should feel authoritative, not self-promotional |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
