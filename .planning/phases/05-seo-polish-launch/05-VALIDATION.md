---
phase: 5
slug: seo-polish-launch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build + manual browser verification |
| **Config file** | astro.config.mjs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | SEO-01 | build | `npm run build` | ✅ | ⬜ pending |
| 5-01-02 | 01 | 1 | SEO-02 | build | `npm run build` | ✅ | ⬜ pending |
| 5-01-03 | 01 | 1 | SEO-03 | build | `npm run build` | ✅ | ⬜ pending |
| 5-01-04 | 01 | 1 | SEO-04 | build | `npm run build` | ✅ | ⬜ pending |
| 5-02-01 | 02 | 1 | SEO-05 | build | `npm run build` | ✅ | ⬜ pending |
| 5-02-02 | 02 | 1 | SEO-06 | build | `npm run build` | ✅ | ⬜ pending |
| 5-03-01 | 03 | 2 | POLSH-01 | build | `npm run build` | ✅ | ⬜ pending |
| 5-03-02 | 03 | 2 | POLSH-02 | build | `npm run build` | ✅ | ⬜ pending |
| 5-03-03 | 03 | 2 | POLSH-03 | build | `npm run build` | ✅ | ⬜ pending |
| 5-04-01 | 04 | 2 | POLSH-04 | build | `npm run build` | ✅ | ⬜ pending |
| 5-04-02 | 04 | 2 | POLSH-05 | manual | see manual section | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Astro build pipeline is already configured from Phase 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lighthouse mobile score ≥ 90 | POLSH-01 | Requires live Vercel URL + browser DevTools | Open Chrome DevTools → Lighthouse → Mobile → Run audit |
| LinkedIn OG card renders correctly | SEO-03 | Requires live URL + LinkedIn post inspector | Use LinkedIn Post Inspector at linkedin.com/post-inspector |
| Scroll fade-in animations trigger | POLSH-02 | Requires browser interaction | Open preview, scroll through sections, verify fade-ins |
| Hover states visible on all interactive elements | POLSH-03 | Requires mouse interaction | Hover over cards, links, buttons in preview |
| 404 page served at /404 | POLSH-05 | Vercel edge behavior | Navigate to /nonexistent-path on live deployment |
| sitemap.xml accessible | SEO-05 | Requires deployed URL | Navigate to /sitemap-index.xml or /sitemap-0.xml |
| robots.txt accessible | SEO-06 | Requires deployed URL | Navigate to /robots.txt |
| WCAG AA contrast on body text | POLSH-04 | Visual + tool verification | Use WebAIM contrast checker on foreground/background colors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
