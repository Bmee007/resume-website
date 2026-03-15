---
phase: 05-seo-polish-launch
plan: 02
subsystem: seo
tags: [astro, sitemap, open-graph, json-ld, structured-data, robots-txt, seo]

# Dependency graph
requires:
  - phase: 05-01
    provides: Phase 5 smoke tests in RED state (SEO-01, SEO-02, SEO-03, SEO-06 failing)
  - phase: 04-contact-deployment
    provides: BaseLayout.astro with basic head tags; fully deployed Astro site
provides:
  - OG meta tags (og:type, og:url, og:title, og:description, og:image) in BaseLayout.astro
  - Twitter Card meta tags in BaseLayout.astro
  - JSON-LD Person schema with sameAs LinkedIn + GitHub in BaseLayout.astro
  - Canonical link tag in BaseLayout.astro
  - Keyword-optimized default title and meta description in index.astro
  - astro.config.mjs with @astrojs/sitemap integration and site URL
  - public/robots.txt with User-agent, Allow, and Sitemap directive
  - dist/sitemap-index.xml generated at build time
affects: [future SEO phases, deployment verification, Google Search Console setup]

# Tech tracking
tech-stack:
  added: ["@astrojs/sitemap@^3.7.1"]
  patterns:
    - "Astro.site used for absolute OG image URL via new URL(ogImage, siteBase).href"
    - "JSON-LD injected via <script type='application/ld+json' set:html={JSON.stringify(data)} />"
    - "BaseLayout Props extended with optional OG/canonical fields with sensible defaults"

key-files:
  created:
    - public/robots.txt
  modified:
    - src/layouts/BaseLayout.astro
    - astro.config.mjs
    - src/pages/index.astro
    - package.json

key-decisions:
  - "site URL set to https://borinakeo.vercel.app in astro.config.mjs with TODO comment to update before launch"
  - "ogImage defaults to /og-image.png — absolute URL computed via new URL(ogImage, siteBase) using Astro.site"
  - "robots.txt sitemap URL kept in sync with astro.config.mjs site value"
  - "SEO-06 verified against built preview server (port 4321) not dev server — sitemap only exists post-build"

patterns-established:
  - "BaseLayout accepts optional ogTitle/ogDescription/ogImage/canonicalUrl with defaults from title/description"
  - "All OG image URLs are made absolute using Astro.site as base"
  - "Person JSON-LD schema is co-located in BaseLayout for global structured data presence"

requirements-completed: [SEO-01, SEO-02, SEO-03, SEO-06]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 5 Plan 02: SEO Metadata Summary

**OG tags, JSON-LD Person schema, canonical link, sitemap integration, and robots.txt added to BaseLayout.astro — SEO-01, SEO-02, SEO-03, SEO-06 all GREEN**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T12:58:46Z
- **Completed:** 2026-03-15T13:03:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed @astrojs/sitemap and wired into astro.config.mjs with site URL; build produces dist/sitemap-index.xml
- Extended BaseLayout.astro with full OG tag suite, Twitter Card tags, JSON-LD Person schema (name, jobTitle, url, sameAs LinkedIn + GitHub), and canonical link
- Updated index.astro title to "Borina Keo — ERP & WMS AI Integration Leader | AI Consultant" with keyword-rich explicit description
- Created public/robots.txt with Sitemap directive pointing to sitemap-index.xml
- Smoke tests SEO-01, SEO-02, SEO-03, SEO-06 all pass GREEN against built preview server

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @astrojs/sitemap and add site URL to astro.config.mjs** - `e2402b8` (feat)
2. **Task 2: Extend BaseLayout.astro with OG tags, JSON-LD, canonical; create robots.txt** - `602bf7b` (feat)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - Extended Props interface; added canonical, OG, Twitter Card, JSON-LD to head
- `astro.config.mjs` - Added site URL and @astrojs/sitemap integration
- `src/pages/index.astro` - Updated title with ERP/AI keywords; added explicit keyword-rich description
- `public/robots.txt` - Created with User-agent/Allow/Sitemap directives
- `package.json` - Added @astrojs/sitemap dependency

## Decisions Made
- Used `https://borinakeo.vercel.app` as site URL with a TODO comment — actual Vercel URL must be confirmed and updated before launch
- OG image absolute URL computed via `new URL(ogImage, siteBase).href` using `Astro.site` to handle relative paths correctly
- robots.txt sitemap URL kept in sync with astro.config.mjs site value for consistency
- SEO-06 test requires preview server (built output) rather than dev server — sitemap is only generated at build time

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- SEO-06 initially tested against dev server (returned 404 for sitemap) — resolved by switching to preview server on port 4321 as documented in plan. This is expected behavior: sitemap is a build artifact not served by the dev server.

## User Setup Required

None - no external service configuration required. However, update the site URL in astro.config.mjs and public/robots.txt from `https://borinakeo.vercel.app` to the real Vercel URL before launch.

## Next Phase Readiness
- SEO-01, SEO-02, SEO-03, SEO-06 requirements GREEN
- SEO-05 (OG image HTTP 200) still requires public/og-image.png asset to be created (Phase 5 plan 03)
- POLSH tests (scroll animation, hover, emerald accent, 404, footer) not yet implemented
- robots.txt and sitemap URL should be verified against final Vercel deployment URL

---
*Phase: 05-seo-polish-launch*
*Completed: 2026-03-15*
