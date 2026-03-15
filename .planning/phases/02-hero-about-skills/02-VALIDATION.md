---
phase: 2
slug: hero-about-skills
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test tests/phase2.spec.ts --project=desktop` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/phase2.spec.ts --project=desktop`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-W0-01 | W0 | 0 | HERO-01 through SKILL-05 | stub | `npx playwright test tests/phase2.spec.ts --project=desktop` | ❌ W0 | ⬜ pending |
| 2-01-01 | 01 | 1 | HERO-01, HERO-02, HERO-03, HERO-04 | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "HERO" --project=desktop` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | ABOUT-01, ABOUT-02, ABOUT-03 | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "ABOUT" --project=desktop` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05 | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "SKILL" --project=desktop` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase2.spec.ts` — 12 stub tests covering HERO-01 through SKILL-05
- [ ] Existing `tests/phase1.spec.ts` must remain green throughout phase 2 execution

*Wave 0 must create `tests/phase2.spec.ts` before any implementation plans run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Photo renders with circular emerald ring | HERO-02 | Visual styling check | Open site in browser, verify circular crop with emerald border visible |
| Skill chips show emerald hover state | SKILL-05 | CSS hover state | Open site, hover over skill chips, verify border/text turns emerald |
| Video fallback renders correctly when file absent | HERO-01 | File-absence condition | Remove hero-video.mp4, verify dark gradient background still renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
