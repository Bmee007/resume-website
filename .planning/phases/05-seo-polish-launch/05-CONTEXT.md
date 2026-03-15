# Phase 5: SEO, Polish & Launch - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add SEO metadata (title, description, JSON-LD, OG tags, sitemap, robots.txt), scroll-triggered animations, hover polish on all interactive elements, WCAG AA contrast audit, and a styled 404 page. No new content sections — this phase makes the existing site search-visible and visually complete.

</domain>

<decisions>
## Implementation Decisions

### Scroll Animations
- Animation style: **fade + slide up** — each section fades in while rising ~20px
- Duration: **500-600ms** — moderate, elegant without feeling sluggish
- Hero section: **animates on initial page load** (name and tagline fade in on first render, like Linear's landing page)
- All other sections: animate on scroll entry via IntersectionObserver
- Element granularity: **Claude's discretion** — choose per-section what feels right (whole section vs staggered cards)
- `prefers-reduced-motion`: **required** — elements appear instantly with no movement for reduced-motion users (POLSH-01 compliance)

### OG Image (Social Sharing)
- Format: **branded text card** — static PNG, 1200x630
- Background: dark navy (`#0F172A`) matching the site
- Content: **name + title only** — "Borina Keo" large, "ERP & WMS AI Integration Leader" below
- Accent: emerald (`#10B981`) used for visual consistency with site brand
- No photo — text-only card is cleaner and more readable at LinkedIn thumbnail size

### 404 Page
- Tone: **slightly personality-forward** — a brief witty line (e.g., "Even ERP migrations hit a wrong path") with a home CTA button
- Includes **the site navigation bar** (Nav component reused) — visitor can navigate anywhere
- Styled to match the site: dark navy background, emerald accent, same typography as the rest of the site

### Hover States
- Elements requiring hover treatment: **skill cards, project cards, experience timeline entries, social icon links**
- Hover style: **lift + glow** — card translates up 4px + emerald box-shadow glow (`rgba(16,185,129,0.35)`)
- Transition duration: **150-200ms** — snappy and immediate, consistent with the scroll behavior already in the codebase
- Social icon links (Hero + Contact): verify emerald-on-hover treatment from Phase 2/4; add if missing

### Claude's Discretion
- Which sections use whole-section animation vs staggered cards within
- Exact IntersectionObserver threshold and rootMargin values
- Whether timeline entries animate individually or as a group
- Exact witty copy for the 404 page (within "brief + professional" constraint)
- Static PNG generation approach for og:image (SVG-to-PNG script, pre-built asset, or Satori)

</decisions>

<specifics>
## Specific Ideas

- Animation reference: Linear/Vercel landing pages — subtle, confident, not a portfolio showcase
- OG image should be readable at LinkedIn thumbnail size — simple text card wins over photo
- 404 witty line should reference ERP/implementation work: "Even ERP migrations hit a wrong path" as a starting reference
- Hover lift: 4px translateY is the target — consistent with common card interaction patterns

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Nav.astro`: full nav component — reuse directly on 404 page (`src/pages/404.astro`)
- `BaseLayout.astro`: has `<title>` and `<meta name="description">` props already — extend with OG/JSON-LD tags
- `.liquid-glass` (global.css): backdrop-filter glass style — project cards and skill cards already use it; lift+glow hover added via `:hover` modifier
- `#10B981` emerald glow pattern: `box-shadow: 0 0 12px rgba(16,185,129,0.35)` — established across all phases

### Established Patterns
- Scoped `<style>` blocks in Astro components — hover states added per-component
- `scroll-behavior: smooth` already in global.css
- IntersectionObserver pattern for active nav: `rootMargin: -5%/-95%` used in Nav — Phase 5 scroll animation observer uses a different threshold (e.g., `-10%` top) to trigger on entry
- Section anchor IDs (`#about`, `#skills`, `#experience`, `#projects`, `#contact`) all defined

### Integration Points
- `BaseLayout.astro` `<head>`: add OG meta tags, JSON-LD `<script type="application/ld+json">`, and canonical URL
- `src/pages/404.astro`: new file — Astro serves this automatically for 404 responses on Vercel
- `public/sitemap.xml` and `public/robots.txt`: static files served at root URL
- `public/og-image.png`: static asset referenced in `og:image` meta tag

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-seo-polish-launch*
*Context gathered: 2026-03-15*
