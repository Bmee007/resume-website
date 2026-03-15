---
phase: 01-foundation-design-system
plan: "02"
subsystem: foundation
tags: [astro, tailwind, design-tokens, layout, scaffold]
dependency_graph:
  requires:
    - 01-01  # Playwright test infrastructure
  provides:
    - Astro 5.x project scaffold at project root
    - Tailwind CSS v4 configured via @tailwindcss/vite plugin
    - Design token system (@theme block in global.css)
    - BaseLayout.astro HTML shell with Google Fonts
    - Six section stubs with anchor IDs (#hero, #about, #skills, #experience, #projects, #contact)
    - SVG favicon with BK initials in accent color
  affects:
    - All subsequent phases (01-03, Phase 2, Phase 3, Phase 4) depend on these token names and anchor IDs
tech_stack:
  added:
    - astro@6.0.4 (static site generator)
    - tailwindcss@4.2.1 (utility-first CSS, CSS-first config)
    - "@tailwindcss/vite@4.x" (Vite plugin for Tailwind v4)
  patterns:
    - Tailwind v4 CSS-first design tokens via @theme block (no tailwind.config.js needed)
    - BaseLayout pattern for shared HTML shell across pages
    - ESM import.meta.url pattern for __dirname equivalent in Node test files
key_files:
  created:
    - astro.config.mjs
    - tsconfig.json
    - README.md
    - src/styles/global.css
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro
    - public/favicon.svg
  modified:
    - package.json (merged Astro + Tailwind deps with existing Playwright devDeps)
    - tests/phase1.spec.ts (ESM __dirname fix)
decisions:
  - "Astro 5.x scaffolder redirects when target dir is non-empty; solution: scaffold to temp dir, copy files manually"
  - "package.json type changed to module (ESM) by Astro scaffold; required ESM-compatible __dirname in test files"
  - "Nav component intentionally omitted from BaseLayout — added in Plan 03"
  - "Tailwind v4 @theme tokens use --color-* namespace so Tailwind auto-generates bg-*, text-*, border-* utilities"
metrics:
  duration: "3 min"
  completed_date: "2026-03-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 2
---

# Phase 1 Plan 02: Astro + Tailwind CSS v4 Scaffold Summary

Astro 5.x project scaffolded with Tailwind CSS v4 CSS-first design tokens, BaseLayout HTML shell, Google Fonts preconnect, and six section anchor stubs — all smoke tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold Astro project and install Tailwind CSS v4 | ba664e6 | astro.config.mjs, package.json, tsconfig.json, README.md |
| 2 | Define design tokens, base layout, and section stubs | b85e46e | src/styles/global.css, src/layouts/BaseLayout.astro, src/pages/index.astro, public/favicon.svg |

## Verification Results

- `npm run build` exits 0: PASS
- `npm run dev` serves at http://localhost:4321: PASS
- `--color-accent: #10B981` on `:root`: PASS (FOUND-02)
- Page title matches `Borina Keo`: PASS (FOUND-01)
- No horizontal overflow at 375px, 768px, 1280px: PASS (FOUND-03 x3)
- Required config files exist on disk: PASS (FOUND-05)
- All 6 section IDs present (#hero, #about, #skills, #experience, #projects, #contact): PASS

**Playwright results:** 6/6 FOUND smoke tests pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `__dirname` in ESM module scope**
- **Found during:** Task 2 verification (running Playwright tests)
- **Issue:** Astro scaffold requires `"type": "module"` in package.json, making the project ESM. The existing `tests/phase1.spec.ts` used `__dirname` which is not available in ES modules.
- **Fix:** Added `import { fileURLToPath } from "url"` and reconstructed `__dirname` via `path.dirname(fileURLToPath(import.meta.url))` — standard ESM pattern.
- **Files modified:** `tests/phase1.spec.ts`
- **Commit:** b85e46e

**2. [Rule 3 - Blocking] Astro scaffolder cannot scaffold into non-empty directory**
- **Found during:** Task 1 execution
- **Issue:** `npm create astro@latest .` detects non-empty directory and prompts interactively, preventing automated scaffolding.
- **Fix:** Scaffolded to `/tmp/astro-scaffold` first, then manually created all needed files in the project root. Merged `package.json` to preserve existing Playwright devDependency alongside new Astro deps.
- **Files modified:** astro.config.mjs (created), package.json (merged), tsconfig.json (created), README.md (created)
- **Commit:** ba664e6

## Key Decisions

1. **Scaffold to temp dir:** Astro scaffolder requires empty directory. Scaffolded to `/tmp/astro-scaffold` and manually merged files. This preserved the Playwright infrastructure from 01-01.
2. **ESM-first package.json:** Astro 5.x requires `"type": "module"`. Updated package.json type and fixed test files accordingly.
3. **Nav omitted from BaseLayout:** Nav component is intentionally absent — Plan 03 adds it. The `<slot />` handles all page content for now.
4. **Tailwind v4 CSS-first config:** Using `@theme {}` block in `global.css` instead of `tailwind.config.js` — this is the v4 recommended approach that eliminates the config file.
