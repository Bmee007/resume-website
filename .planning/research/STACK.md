# Stack Research

**Domain:** Professional personal brand / resume-portfolio website (B2B consultant, ERP/AI/WMS)
**Researched:** 2026-03-14
**Confidence:** MEDIUM-HIGH (Tailwind v4.2 verified via official docs; Vercel/Astro integration verified via official Vercel docs; Astro 5.x and other library versions based on training data through August 2025 — current versions may be higher patch releases)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | 5.x | Static site generator / framework | Ships zero JS by default — perfect for a static portfolio. Lighthouse scores near 100 out of the box, which matters for SEO. Uses `.astro` component syntax (HTML-first) but supports React/Vue islands when interactivity is needed. Explicitly designed for content-focused, static-first sites. Far less overhead than Next.js for a site with no backend. |
| Tailwind CSS | 4.2 | Utility-first CSS framework | v4 uses native CSS cascade layers and `@theme` variables — no config file needed. Ships under 10kB to production after purging. Built-in dark mode via `dark:` prefix is essential for this project's dark theme. Deep Astro integration is first-class. Verified current version 4.2 via official docs. |
| TypeScript | 5.x | Type safety | Astro has first-class TypeScript support. For a solo project this small, TypeScript is optional but recommended — it makes component props self-documenting and catches rename errors when updating content. Use `.astro` files with typed frontmatter. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Motion (formerly Framer Motion) | 11.x | Scroll-triggered and entrance animations | For the hero section fade-in, timeline section reveal-on-scroll, and skills section entrance effects. Use the lightweight `motion/react` import. Only load on client — Astro islands pattern keeps this from bloating the static build. Use for: hero entrance, section reveals, skill bar animations. |
| @astrojs/sitemap | 3.x | Auto-generate sitemap.xml | One-line integration in `astro.config.mjs`. Critical for SEO — search engines need sitemap.xml to index all sections. Generates automatically at build time. |
| @astrojs/image (built into Astro 5) | built-in | Image optimization | Astro 5 ships native image optimization. Use `<Image>` component for the profile photo — it generates WebP, lazy-loads, and adds `width`/`height` to prevent layout shift. Zero config needed. |
| sharp | 0.33.x | Image processing backend | Required peer dependency for Astro's image optimization in Node environments. Install as dev dependency. |
| @astrojs/vercel | 7.x | Vercel deployment adapter | Required to use Vercel features (Image Optimization, Web Analytics, Speed Insights) with Astro. For a purely static site, `@astrojs/vercel/static` is the correct import. Verified in Vercel official docs. |

### Contact Form Solutions

| Option | Type | Purpose | Notes |
|--------|------|---------|-------|
| Formspree | SaaS (free tier) | Contact form backend | The standard solution for static sites with contact forms. Free tier: 50 submissions/month, email notifications, spam filtering. No backend code needed — POST to their endpoint. Works perfectly with a static Astro build on Vercel. Install nothing; just point form `action` to Formspree endpoint. |
| Web3Forms | SaaS (free tier) | Alternative contact form backend | 250 submissions/month free (vs Formspree's 50). No file needed on their server — API key embedded in form. Good alternative if submission volume is a concern. |

**Recommendation: Formspree** for initial setup due to simpler integration and widespread community documentation. Switch to Web3Forms if 50/month limit is hit.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| VS Code + Astro extension | IDE support | Official Astro VS Code extension provides syntax highlighting, IntelliSense for `.astro` files, TypeScript integration. Essential — `.astro` files are not recognized without it. |
| Prettier + prettier-plugin-astro | Code formatting | `prettier-plugin-astro` formats `.astro` files correctly. Add to `.prettierrc`: `{"plugins": ["prettier-plugin-astro"]}`. |
| ESLint + eslint-plugin-astro | Linting | Catches common Astro mistakes. Optional for a solo project but catches accessibility issues. |

### SEO Tooling

| Tool | Purpose | Notes |
|------|---------|-------|
| Astro built-in `<head>` management | Meta tags, OpenGraph | No extra library needed. Astro's `<head>` slot is fully controllable per-page. Add `<title>`, `<meta name="description">`, OpenGraph tags, and Twitter Card tags manually in a shared `BaseLayout.astro`. |
| @astrojs/sitemap (listed above) | sitemap.xml | Auto-generated. Submit to Google Search Console post-launch. |
| Schema.org JSON-LD | Structured data | Add a `<script type="application/ld+json">` block in `BaseLayout.astro` with `Person` schema. This is the single highest-impact SEO action for a personal brand site — enables rich results in Google for the name "Borina Keo ERP consultant". No library needed; hand-write the JSON-LD. |
| robots.txt | Crawl control | Create `public/robots.txt` allowing all crawlers. Astro serves `public/` as-is. |

---

## Hosting Recommendation: Vercel

**Use Vercel.** Not GitHub Pages, not Netlify.

**Why Vercel over GitHub Pages:**
- GitHub Pages requires a separate build workflow (`gh-pages` branch / GitHub Actions). Vercel detects Astro automatically and deploys on every push with zero config.
- GitHub Pages does not support custom `_headers` files for Cache-Control, which limits performance tuning.
- Vercel's global CDN has more PoPs than GitHub's CDN.
- Vercel provides built-in Web Analytics and Speed Insights that integrate with the `@astrojs/vercel` adapter — useful for tracking if the site is converting (visitors to contact form opens).

**Why Vercel over Netlify:**
- Vercel's Astro integration is more actively maintained (Vercel employs Astro contributors).
- For a purely static site, both are equivalent in capability — but Vercel has superior DX: `vercel --prod` deploys in ~30 seconds, preview URLs are generated per commit automatically.
- Netlify's free tier is comparable, but Vercel's Image Optimization integration with Astro is tighter.

**Vercel free tier is sufficient** for a personal portfolio site with low traffic.

---

## Installation

```bash
# Scaffold Astro project (use the "minimal" or "portfolio" starter)
npm create astro@latest resume-website -- --template minimal --typescript strict

# Navigate to project
cd resume-website

# Add Tailwind CSS via Astro integration
npx astro add tailwind

# Add Vercel adapter
npx astro add vercel

# Add sitemap
npx astro add sitemap

# Motion for animations (client-side only)
npm install motion

# Image processing
npm install -D sharp

# Dev tooling
npm install -D prettier prettier-plugin-astro
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro 5.x | Next.js 15 | If you need SSR, server actions, or API routes that will grow over time. For a pure marketing/portfolio static site, Next.js adds 40-60kB of React runtime overhead with no benefit. |
| Astro 5.x | Hugo | If the developer is comfortable with Go templates and wants even faster build times. Hugo has no JS ecosystem — animating the hero and timeline sections requires vanilla JS or Alpine. Not worth the DX tradeoff for this project. |
| Astro 5.x | Gatsby | Avoid entirely (see "What NOT to Use"). |
| Tailwind CSS v4 | CSS Modules | Use CSS Modules only if the team dislikes utility-first CSS. For a solo project, Tailwind is faster to iterate on dark/light themes and responsive breakpoints. |
| Tailwind CSS v4 | Bootstrap 5 | Bootstrap is appropriate if the designer wants pre-built components. But Bootstrap's default aesthetic is corporate/generic — it will NOT produce the "dark modern" look needed to impress enterprise decision-makers. Tailwind gives full design control. |
| Motion 11.x | GSAP | Use GSAP if you need timeline-based animations (staggered sequences, scroll-driven narratives). For this project's needs (entrance animations, scroll reveals), Motion is lighter and has better React/Astro integration. GSAP's free tier license is also more restrictive for commercial consulting sites. |
| Vercel | Netlify | Use Netlify if you are already on Netlify for other projects and want a single platform. Netlify Forms is a viable alternative to Formspree. Otherwise, Vercel is preferred for Astro. |
| Formspree | Netlify Forms | Use Netlify Forms only if hosting on Netlify — it's free and built-in. On Vercel, use Formspree. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Gatsby | Maintenance-mode framework. GraphQL data layer is massive overkill for a static portfolio. Build times are slow. Astro produces equivalent or better Lighthouse scores with a fraction of the complexity. | Astro 5.x |
| Create React App | Deprecated (officially unmaintained since 2023). No SSG support. SPA architecture is SEO-hostile without additional configuration. | Astro 5.x |
| WordPress (even headless) | A WordPress backend for a personal portfolio in 2025 is engineering overkill. Hosting costs money, requires maintenance, and is a security surface. The content for this site will rarely change. | Static Astro — update content by editing `.astro` files |
| CSS animations for scroll reveals only | `IntersectionObserver` + CSS `@keyframes` works but requires writing boilerplate JS and CSS. Motion's `whileInView` prop is more readable and handles edge cases (reduced motion preference). | Motion `whileInView` |
| jQuery | No use case on a modern static site. Adds 30kB for zero benefit when vanilla JS or Motion covers all interaction needs. | Vanilla JS or Motion |
| Tailwind CSS v3.x | v4 is the current major version as of 2025. v3 will not receive new features. v4 dropped the `tailwind.config.js` file in favor of native CSS `@theme` — cleaner and faster. | Tailwind CSS v4.2 |
| Google Analytics (GA4) | Privacy concerns, GDPR consent banners, cookie popups — all of which create friction on a professional consulting site. For basic traffic intelligence, Vercel's built-in Web Analytics (privacy-first, no cookies) is sufficient. | Vercel Web Analytics (included in `@astrojs/vercel` adapter) |

---

## Stack Patterns by Variant

**If Borina wants to add a blog later:**
- Use Astro's Content Collections API (built into Astro 5)
- Store posts as `.md` or `.mdx` files in `src/content/blog/`
- No CMS needed for v1; add Contentlayer or Sanity in v2 if post volume grows
- This is a non-breaking addition — the static architecture supports it cleanly

**If the site needs a downloadable resume PDF:**
- Place the PDF in `public/resume-borina-keo.pdf`
- Link directly — Astro serves `public/` as static assets
- No special handling needed; Vercel CDN will cache it

**If enterprise clients request a dark/light mode toggle:**
- Tailwind v4's `dark:` prefix works with `class` strategy: add `dark` class to `<html>`
- Store preference in `localStorage`, toggle via a small vanilla JS snippet in `<head>`
- Motion can animate the theme transition with a `layoutId` crossfade

**If Borina adds case studies as separate pages:**
- Use Astro's file-based routing: `src/pages/case-studies/[slug].astro`
- Content Collections with Zod schema validation keeps data consistent
- Each case study gets its own URL and SEO meta tags — good for search ranking on "D365 migration" or "Manhattan WMS implementation" queries

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| astro@5.x | @astrojs/tailwind@5.x | Use `npx astro add tailwind` — installs compatible version automatically |
| astro@5.x | @astrojs/vercel@7.x | Use `npx astro add vercel` — installs compatible version automatically |
| astro@5.x | @astrojs/sitemap@3.x | Use `npx astro add sitemap` — installs compatible version automatically |
| tailwindcss@4.2 | @tailwindcss/vite@4.2 | Tailwind v4 uses a Vite plugin instead of PostCSS by default; Astro's `astro add tailwind` command handles this automatically |
| motion@11.x | astro@5.x | Motion components must be in Astro island components (`.tsx` or `.jsx` with `client:load` or `client:visible`). Motion does not run in `.astro` frontmatter. |
| sharp@0.33.x | astro@5.x | Required dev dependency for `<Image>` optimization. Must be installed separately — not bundled with Astro. |

---

## Sources

- Vercel official docs (`/docs/frameworks/astro`) — Astro/Vercel integration, adapter configuration, static rendering — **VERIFIED, HIGH confidence**
- Tailwind CSS official homepage (tailwindcss.com) — v4.2 current version, `@theme` variables, dark mode, bundle size — **VERIFIED, HIGH confidence**
- Astro docs (`docs.astro.build`) — Access blocked during research session; version and feature claims based on training data through August 2025 — **MEDIUM confidence, verify Astro version at docs.astro.build before starting**
- Motion / Framer Motion (motion.dev) — Access blocked; v11.x claim based on training data — **LOW-MEDIUM confidence, verify at npmjs.com/package/motion**
- Formspree (formspree.io) — Access blocked; 50 submissions/month free tier claim based on training data — **LOW-MEDIUM confidence, verify current pricing at formspree.io**
- Web3Forms (web3forms.com) — Access blocked; 250 submissions/month claim based on training data — **LOW-MEDIUM confidence**
- Gatsby/CRA deprecation — widely documented across community sources as of 2024-2025 — **HIGH confidence**

---

*Stack research for: B2B consultant resume / personal brand static website*
*Researched: 2026-03-14*
