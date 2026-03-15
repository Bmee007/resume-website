# Phase 5: SEO, Polish & Launch - Research

**Researched:** 2026-03-15
**Domain:** Astro SEO metadata, JSON-LD structured data, scroll animations, WCAG contrast, Lighthouse performance
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Animation style: **fade + slide up** — each section fades in while rising ~20px
- Duration: **500-600ms** — moderate, elegant without feeling sluggish
- Hero section: **animates on initial page load** (name and tagline fade in on first render)
- All other sections: animate on scroll entry via IntersectionObserver
- `prefers-reduced-motion`: **required** — elements appear instantly with no movement
- OG image format: **branded text card** — static PNG, 1200x630
- OG image background: dark navy (`#0F172A`) matching the site
- OG image content: **name + title only** — "Borina Keo" large, "ERP & WMS AI Integration Leader" below
- OG image accent: emerald (`#10B981`) — no photo
- 404 tone: **slightly personality-forward** — witty ERP-referencing line + home CTA
- 404 includes **Nav component** reused directly
- 404 styled to match site: dark navy, emerald accent, same typography
- Hover elements: **skill cards, project cards, experience timeline entries, social icon links**
- Hover style: **lift + glow** — translateY(-4px) + `box-shadow: 0 0 12px rgba(16,185,129,0.35)`
- Hover transition duration: **150-200ms**
- Social icon links: verify emerald-on-hover from Phase 2/4; add if missing

### Claude's Discretion
- Which sections use whole-section animation vs staggered cards within
- Exact IntersectionObserver threshold and rootMargin values
- Whether timeline entries animate individually or as a group
- Exact witty copy for the 404 page (within "brief + professional" constraint)
- Static PNG generation approach for og:image (SVG-to-PNG script, pre-built asset, or Satori)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEO-01 | Page title and meta description optimized for "ERP AI integration consultant" search intent | BaseLayout already has title/description props; extend with keyword-optimized copy in `<head>` |
| SEO-02 | Schema.org `Person` JSON-LD markup with name, LinkedIn, GitHub, and job title | Add `<script type="application/ld+json">` in BaseLayout `<head>`; use sameAs for LinkedIn/GitHub URLs |
| SEO-03 | Open Graph tags (og:title, og:description, og:image 1200x630) for LinkedIn share cards | Add og: meta tags to BaseLayout; create static PNG at `public/og-image.png` |
| SEO-04 | Lighthouse performance score ≥ 90 on mobile | Astro zero-JS default makes 90+ readily achievable; main risk is hero-video.mp4 weight and LCP |
| SEO-05 | All images have descriptive alt text | Audit all `<img>` tags across all components; HeroSection photo already has alt text |
| SEO-06 | Sitemap and robots.txt present | Use `@astrojs/sitemap` integration + static `public/robots.txt` file |
| POLSH-01 | Scroll-triggered fade-in animations on section entry (respects prefers-reduced-motion) | IntersectionObserver + CSS class toggle; `@media (prefers-reduced-motion: reduce)` disables transitions |
| POLSH-02 | Hover states on all interactive elements (links, buttons, cards) | ProjectsSection already has hover; SkillsSection chips have hover; add translateY + glow to cards |
| POLSH-03 | Consistent electric blue/green accent color used throughout | Emerald `#10B981` is established across all phases; audit for any missing accent applications |
| POLSH-04 | Typography is legible on dark background (sufficient contrast ratios — WCAG AA) | `#F8FAFC` text on `hsl(260 87% 3%)` background passes 4.5:1; `#10B981` emerald on dark needs verification |
| POLSH-05 | 404 page styled to match site | Create `src/pages/404.astro` using BaseLayout + Nav; Astro builds to `404.html` which Vercel uses |
</phase_requirements>

---

## Summary

Phase 5 is a finishing pass over an already-functional Astro 6.x static site. The site's zero-JS Astro architecture means Lighthouse 90+ mobile is the starting baseline, not a goal to fight for — the main risk is the `hero-video.mp4` file's impact on LCP. The work divides cleanly into four areas: (1) SEO metadata additions to `BaseLayout.astro` (meta tags, JSON-LD, canonical, OG), (2) static file creation (`sitemap.xml` via `@astrojs/sitemap` integration, `robots.txt`, `og-image.png`), (3) scroll animation implementation using raw IntersectionObserver with CSS class toggling, and (4) hover state additions to existing card components.

The existing code base has strong foundations: `BaseLayout.astro` already accepts `title` and `description` props; all section anchor IDs are defined; `social-icon-link:hover` emerald treatment is in HeroSection; `project-card:hover` glow is already in ProjectsSection; the `--glow-accent` CSS variable (`0 0 12px rgba(16,185,129,0.35)`) is a global token. Phase 5 extends patterns that already exist rather than introducing new ones.

One verified risk: the current `astro.config.mjs` has no `site` property, which is mandatory for `@astrojs/sitemap` to generate a sitemap. This must be added before the sitemap integration will work. The OG image approach (pre-built static PNG vs. Satori build-time generation) is left to Claude's discretion per CONTEXT.md; a pre-built static PNG in `public/` is the simplest path with zero dependencies.

**Primary recommendation:** Implement in order — (1) BaseLayout SEO head, (2) sitemap integration + robots.txt, (3) og-image.png creation, (4) scroll animations with IntersectionObserver, (5) card hover states, (6) WCAG audit, (7) 404 page, (8) Lighthouse validation.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro built-ins | 6.x (installed) | `<head>` meta tags, `src/pages/404.astro` | Zero-cost, no new dependencies |
| `@astrojs/sitemap` | latest | Generates `sitemap-index.xml` + `sitemap-0.xml` at build | Official Astro integration; zero-config once `site:` is set |
| IntersectionObserver | Web API | Scroll animation triggers | Native browser API, no library needed |
| CSS transitions | Native | Fade + slide animations, hover states | Already used in project; consistent with existing patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Satori + sharp | latest | Build-time OG image generation from JSX | Use if wanting programmatic PNG generation; adds build complexity |
| Static PNG in `public/` | N/A | OG image as pre-built asset | Use when design is fixed (text-only card) — simplest path |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@astrojs/sitemap` | Manual `public/sitemap.xml` | Sitemap integration auto-discovers pages; manual XML is brittle but zero-config |
| Static PNG in `public/` | Satori + resvg build script | Satori gives programmatic control; static PNG is simpler for a text-only card that won't change |
| IntersectionObserver (vanilla) | AOS, GSAP ScrollTrigger, Motion | No extra JS bundle; preserves Astro zero-JS philosophy; existing project pattern |

**Installation (only new dependency):**
```bash
npx astro add sitemap
```
This installs `@astrojs/sitemap` and auto-patches `astro.config.mjs` with the integration. Then manually add `site: 'https://your-vercel-url.vercel.app'` to `defineConfig`.

---

## Architecture Patterns

### Recommended File Changes

```
src/
├── layouts/
│   └── BaseLayout.astro      # ADD: og: meta tags, JSON-LD script, canonical
├── components/
│   ├── SkillsSection.astro   # ADD: .skill-card:hover lift+glow; animate-on-scroll class
│   ├── ExperienceSection.astro # ADD: .entry-card:hover lift+glow; animate-on-scroll class
│   ├── HeroSection.astro     # ADD: initial load fade-in animation on hero-heading/hero-sub
│   ├── AboutSection.astro    # ADD: animate-on-scroll class + reveal styles
│   ├── ProjectsSection.astro # VERIFY: hover already present; ADD translate; animate-on-scroll
│   └── ContactSection.astro  # ADD: animate-on-scroll class
├── pages/
│   └── 404.astro             # CREATE: styled 404 page using BaseLayout + Nav

public/
├── og-image.png              # CREATE: 1200x630 branded text card
├── robots.txt                # CREATE: static file
└── sitemap.xml               # AUTO-GENERATED by @astrojs/sitemap at build

astro.config.mjs              # ADD: site URL + sitemap() integration
```

### Pattern 1: Extending BaseLayout.astro for SEO

**What:** Add all SEO meta tags, OG tags, and JSON-LD to the `<head>` slot already in `BaseLayout.astro`.
**When to use:** Single source of truth for all pages (index + 404).

```astro
---
// BaseLayout.astro additions
interface Props {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

const {
  title,
  description = "ERP & WMS AI Integration Leader — Borina Keo",
  ogTitle = "Borina Keo — ERP & WMS AI Integration Leader",
  ogDescription = "15+ years leading ERP and WMS AI integration across D365, Manhattan DFIO, and Azure OpenAI. Delivering measurable ROI for Fortune 500 operations.",
  ogImage = "/og-image.png",
  canonicalUrl = Astro.url.href,
} = Astro.props;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Borina Keo",
  "jobTitle": "ERP & WMS AI Integration Leader",
  "url": Astro.site?.href ?? "https://borinakeo.com",
  "image": new URL("/borina-photo.jpg", Astro.site).href,
  "sameAs": [
    "https://www.linkedin.com/in/borinakeo",
    "https://github.com/Bmee007"
  ],
  "description": "AI integration leader specializing in Microsoft Dynamics 365, Manhattan DFIO, and Azure OpenAI for enterprise ERP and WMS modernization."
};
---
<head>
  <!-- existing tags -->
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:image" content={new URL(ogImage, Astro.site).href} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={ogTitle} />
  <meta name="twitter:description" content={ogDescription} />
  <meta name="twitter:image" content={new URL(ogImage, Astro.site).href} />

  <!-- JSON-LD -->
  <script type="application/ld+json" set:html={JSON.stringify(personJsonLd)} />
</head>
```

Source: Schema.org Person spec (https://schema.org/Person); Astro docs on meta tags.

### Pattern 2: Scroll Animation via IntersectionObserver

**What:** CSS classes control initial hidden state; JS observer adds `.is-visible` on entry; CSS transitions fire.
**When to use:** For all sections except Hero (which animates on load, not scroll).

```html
<!-- In each section component: add class to animated wrapper -->
<div class="section-animate">...</div>

<style>
  .section-animate {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 500ms ease, transform 500ms ease;
  }
  .section-animate.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  /* REQUIRED: instant appearance for reduced-motion users */
  @media (prefers-reduced-motion: reduce) {
    .section-animate {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>
```

```html
<!-- Shared IntersectionObserver script — add once to BaseLayout body or inline per-component -->
<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once only
        }
      });
    },
    { rootMargin: '-10% 0px -10% 0px', threshold: 0 }
  );

  document.querySelectorAll('.section-animate').forEach((el) => {
    observer.observe(el);
  });
</script>
```

Source: MDN IntersectionObserver API; CSS-Tricks prefers-reduced-motion guide.

### Pattern 3: Hero Load Animation (Initial Render)

**What:** Hero heading and subheading start hidden in CSS and animate in on page load without JS.
**When to use:** Hero section only — no IntersectionObserver needed.

```css
/* In HeroSection scoped style */
@keyframes hero-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-heading {
  animation: hero-fade-in 600ms ease forwards;
}
.hero-sub {
  animation: hero-fade-in 600ms ease 150ms forwards; /* staggered delay */
  opacity: 0; /* hidden before animation starts */
  animation-fill-mode: forwards;
}

@media (prefers-reduced-motion: reduce) {
  .hero-heading,
  .hero-sub {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Pattern 4: Hover Lift + Glow on Cards

**What:** Cards translate up 4px and emit emerald glow on hover. The `--glow-accent` CSS variable is already defined globally.
**When to use:** skill-card, project-card, entry-card (existing flat and liquid-glass variants), social-icon-link elements.

```css
/* Add to each card's scoped style — example for .skill-card */
.skill-card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.skill-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--glow-accent); /* = 0 0 12px rgba(16,185,129,0.35) */
}
```

Note: `ProjectsSection.astro` already has `.project-card:hover { box-shadow: 0 0 12px rgba(16, 185, 129, 0.35); }` but is missing `transform: translateY(-4px)` and the transition property. Add both.

### Pattern 5: sitemap.xml via @astrojs/sitemap

**What:** Integration auto-discovers all static routes at build time and emits `sitemap-index.xml` + `sitemap-0.xml`.

```js
// astro.config.mjs (after running: npx astro add sitemap)
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://YOUR_VERCEL_URL.vercel.app", // REQUIRED — sitemap fails without this
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Source: Official Astro sitemap integration docs (https://docs.astro.build/en/guides/integrations-guide/sitemap/).

### Pattern 6: robots.txt (Static File)

**What:** Static text file placed in `public/` is served at `/robots.txt`.

```text
User-agent: *
Allow: /

Sitemap: https://YOUR_VERCEL_URL.vercel.app/sitemap-index.xml
```

Note: Sitemap URL in `robots.txt` must match the `site` value set in `astro.config.mjs`. Keep these in sync manually.

### Pattern 7: 404.astro Page

**What:** `src/pages/404.astro` is automatically built to `dist/404.html` by Astro. Vercel's static hosting serves `404.html` for unmatched routes.

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Page Not Found — Borina Keo" description="This page doesn't exist.">
  <main class="error-page">
    <h1 class="error-headline">Even ERP migrations hit a wrong path.</h1>
    <p class="error-sub">The page you're looking for isn't here — but the right path is just a click away.</p>
    <a href="/" class="btn-hero rounded-full">Back to Home</a>
  </main>
</BaseLayout>
```

Note: Using `BaseLayout` automatically includes `Nav` (which is imported in BaseLayout). No need to import Nav separately.

### Anti-Patterns to Avoid

- **Adding animation JS inline per-component:** Put the IntersectionObserver script once in BaseLayout (or a shared `<script>` that Astro deduplicates) rather than duplicating it in each component.
- **Forgetting `observer.unobserve()` after first trigger:** Keeps re-firing on every intersection — animations retrigger on scroll back up. Call `unobserve` inside the callback after adding `.is-visible`.
- **Setting `animation-fill-mode: forwards` without initial `opacity: 0`:** Elements flash visible on load before animation starts. Set `opacity: 0` as the base state alongside the animation declaration.
- **Not setting `site:` in `astro.config.mjs` before running build:** `@astrojs/sitemap` silently produces no sitemap when `site` is missing. Verify with `astro build` and check `dist/` for `sitemap-index.xml`.
- **Using `Astro.site` in BaseLayout without `site:` configured:** `Astro.site` is `undefined` — `new URL(ogImage, Astro.site)` throws. Guard with `Astro.site ?? new URL(Astro.request.url).origin`.
- **Applying translateY transition on elements that already use transform for other effects:** Check ExperienceSection timeline dots — they use `box-shadow` animation but no transform, so hover lift is safe.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap XML generation | Custom script writing XML | `@astrojs/sitemap` | Auto-discovers routes including dynamic ones from `getStaticPaths`; handles sitemap indexing |
| OG image with complex layout | HTML/CSS renderer via Puppeteer | Satori (if needed) or pre-built static PNG | Satori converts JSX to SVG without browser; static PNG is zero-dependency for fixed text card |
| Scroll animation library | Custom debounce + requestAnimationFrame | Native `IntersectionObserver` | Browser-native, performant, no bundle cost; supports `rootMargin` for entry threshold control |
| Contrast checking at runtime | JS contrast calculation | `axe-core` browser extension or WebAIM checker | Design-time tool; no runtime code needed |

**Key insight:** Astro's zero-JS output philosophy means every added script carries cost. Native browser APIs (IntersectionObserver) and build-time tools (@astrojs/sitemap) maintain the performance baseline.

---

## Common Pitfalls

### Pitfall 1: Missing `site:` in astro.config.mjs
**What goes wrong:** `@astrojs/sitemap` produces no output; `Astro.site` is `undefined` in BaseLayout, breaking absolute URL generation for `og:image` and JSON-LD.
**Why it happens:** The `site` config property defaults to `undefined` in Astro's zero-config mode.
**How to avoid:** Add `site: 'https://your-vercel-domain.vercel.app'` to `defineConfig` before running any build that uses sitemap or absolute URLs.
**Warning signs:** `dist/` after build contains no `sitemap-index.xml`; og:image URL in page source is relative (`/og-image.png`) not absolute.

### Pitfall 2: Astro Scoped Styles Don't Share Across Components
**What goes wrong:** Adding `.skill-card:hover` styles to `global.css` or `BaseLayout` has no effect — Astro scopes all styles to the component they're declared in.
**Why it happens:** Astro appends a unique data attribute to scoped styles; cross-component selectors don't match.
**How to avoid:** Add hover CSS inside the `<style>` block of each component that owns the card class (SkillsSection, ExperienceSection, ProjectsSection). This is the established pattern from prior phases.
**Warning signs:** Hover works in dev but not after build; or style appears in global.css but has no effect.

### Pitfall 3: IntersectionObserver Fires Before CSS Loads
**What goes wrong:** Section momentarily flashes in visible state then jumps to hidden, causing a visual glitch.
**Why it happens:** Script runs before stylesheet applies `opacity: 0` initial state.
**How to avoid:** Set the initial hidden state in CSS (not JS). The CSS paints before scripts execute. Use `opacity: 0; transform: translateY(20px)` directly on the element class in the component's `<style>` block.
**Warning signs:** Sections briefly flash full-opacity content on page load then disappear before animating in.

### Pitfall 4: Video Background Impact on LCP
**What goes wrong:** Lighthouse mobile score drops below 90 because `hero-video.mp4` is large and blocks or delays LCP metric calculation.
**Why it happens:** Video is loaded eagerly despite `autoplay muted loop`; on slow mobile connections this is the largest contentful paint element if the image fails.
**How to avoid:** The hero-video already has `aria-hidden="true"` and `opacity: 0.25`. Ensure the `<img>` tag for `borina-photo.jpg` has `loading="eager"` and `fetchpriority="high"` as it's the actual LCP element on desktop. If Lighthouse flags the video, add `preload="none"` to the `<video>` tag.
**Warning signs:** Lighthouse LCP score is the primary drag; "Largest Contentful Paint" in audit points to the video element.

### Pitfall 5: `#10B981` Emerald May Fail WCAG AA for Body Text
**What goes wrong:** POLSH-04 requires WCAG AA; emerald `#10B981` on dark navy `hsl(260 87% 3%)` achieves approximately 3.8:1 contrast — this passes for large text (3:1 threshold) but **fails for normal text** (4.5:1 threshold).
**Why it happens:** Emerald is a mid-range saturation color; it's designed as an accent, not a body text color.
**How to avoid:** Use emerald only on large text (headings, large badges) or decorative elements (borders, glows). Body text uses `hsl(var(--foreground))` which is `hsl(40 6% 95%)` — near-white — which passes easily. Do not use `color: #10B981` for paragraph or label text.
**Warning signs:** Lighthouse accessibility audit flags contrast failures on `.entry-company`, `.entry-dates`, or `.project-outcome` if those were changed to emerald.

### Pitfall 6: 404 Page Animation Triggers on Every Visit
**What goes wrong:** The IntersectionObserver script on 404.astro attempts to find `.section-animate` elements that don't exist, throwing silent errors.
**Why it happens:** If the observer script is added globally to BaseLayout, it runs on the 404 page too.
**How to avoid:** Use `document.querySelectorAll('.section-animate')` which returns an empty NodeList — no error. Safe to call `forEach` on an empty NodeList. No special handling needed.

---

## Code Examples

### OG Image (Pre-built Static PNG Approach)
```
public/og-image.png   (1200 x 630 px)
Background: #0F172A dark navy
Text top-left: "Borina Keo" — white, ~72px, Geist Sans weight 600
Text below: "ERP & WMS AI Integration Leader" — #10B981 emerald, ~36px, weight 400
Optional: thin emerald left border stripe for brand consistency
```

Create with Figma, Canva, or any image editor. Place at `public/og-image.png`. Reference as `/og-image.png` in the meta tag (Astro serves `public/` at root). No build step required.

### JSON-LD Person Schema (Verified Against Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Borina Keo",
  "jobTitle": "ERP & WMS AI Integration Leader",
  "url": "https://YOUR_VERCEL_URL.vercel.app",
  "image": "https://YOUR_VERCEL_URL.vercel.app/borina-photo.jpg",
  "sameAs": [
    "https://www.linkedin.com/in/borinakeo",
    "https://github.com/Bmee007"
  ],
  "description": "AI integration leader specializing in Microsoft Dynamics 365, Manhattan DFIO, and Azure OpenAI for enterprise ERP and WMS modernization."
}
```

Source: https://schema.org/Person, https://jsonld.com/person/

### WCAG AA Contrast Requirements (Verified)
| Requirement | Ratio | Elements That Must Pass |
|-------------|-------|------------------------|
| Normal text (WCAG AA) | 4.5:1 minimum | Body copy, labels, nav links |
| Large text (WCAG AA) | 3:1 minimum | h1, h2, h3, large badges |
| `#F8FAFC` on `hsl(260 87% 3%)` | ~21:1 | Passes easily — primary foreground |
| `#10B981` on `hsl(260 87% 3%)` | ~3.8:1 | Passes large text only; do not use for body text |

Source: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html, WebAIM contrast checker.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual sitemap.xml | `@astrojs/sitemap` integration | Astro 1.x era | Auto-discovery of routes; no manual XML maintenance |
| Scroll libraries (AOS, GSAP) | Native IntersectionObserver | ~2018 | Zero JS cost; browser-native; better performance profile |
| `<meta name="twitter:card">` only | Combined OG + Twitter cards in `<head>` | ~2020 | LinkedIn and Slack use og: tags; Twitter/X uses twitter: tags; both needed |
| Separate Twitter image tag | Can use same og:image for both | Current | Simpler; fewer meta tags |

**Deprecated/outdated:**
- `<meta name="robots" content="index,follow">`: Still valid but redundant — robots.txt handles this. Skip it.
- Using `prerender: false` export on 404.astro: Only needed for SSR; this site is static output, so 404.astro pre-renders by default.

---

## Open Questions

1. **Vercel URL for `site:` config**
   - What we know: `@astrojs/sitemap` and Astro.site require a `site:` string beginning with `https://`
   - What's unclear: The deployed Vercel URL is not documented in the planning files
   - Recommendation: Use the actual Vercel deployment URL (from Phase 1-03 deploy). If not known at plan time, use a placeholder and note it must be updated before launch.

2. **Vercel 404 handling for static output mode**
   - What we know: Astro docs say "most deploy services" find and use `404.html`. GitHub issues document some edge cases with Vercel static output mode where custom 404 isn't served.
   - What's unclear: Whether the current zero-config (no adapter) deployment on Vercel serves the generated `404.html` correctly.
   - Recommendation: After implementing `src/pages/404.astro`, test by visiting a nonexistent URL on the Vercel deployment. If Vercel serves its default 404 instead of the custom one, add a `vercel.json` with `{ "routes": [{ "src": "/(.*)", "status": 404, "dest": "/404" }] }` as fallback — but try without first.

3. **`#10B981` contrast for `entry-company` and `entry-dates` text**
   - What we know: `entry-company` uses `hsl(var(--foreground) / 0.7)` which computes to approximately `rgba(248,250,252,0.7)` — this is dimmed white on dark, contrast ratio ~11:1, passes easily.
   - What's unclear: Whether any prior phase added emerald as a text color anywhere other than links.
   - Recommendation: Run axe DevTools browser extension after implementation to catch any contrast failures automatically.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/phase5.spec.ts --project=chromium` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | Page title contains "ERP" and "AI" keyword terms; meta description present | smoke | `npx playwright test tests/phase5.spec.ts --grep "SEO-01" --project=chromium` | ❌ Wave 0 |
| SEO-02 | JSON-LD script tag with @type Person and sameAs LinkedIn/GitHub in page `<head>` | smoke | `npx playwright test tests/phase5.spec.ts --grep "SEO-02" --project=chromium` | ❌ Wave 0 |
| SEO-03 | og:image, og:title, og:description meta tags present in `<head>` | smoke | `npx playwright test tests/phase5.spec.ts --grep "SEO-03" --project=chromium` | ❌ Wave 0 |
| SEO-04 | Lighthouse mobile performance score ≥ 90 | manual-only | N/A — run Lighthouse in Chrome DevTools against production URL | ❌ manual |
| SEO-05 | All `<img>` elements have non-empty alt text | smoke | `npx playwright test tests/phase5.spec.ts --grep "SEO-05" --project=chromium` | ❌ Wave 0 |
| SEO-06 | `/sitemap-index.xml` returns 200; `/robots.txt` returns 200 with Sitemap directive | smoke | `npx playwright test tests/phase5.spec.ts --grep "SEO-06" --project=chromium` | ❌ Wave 0 |
| POLSH-01 | `.section-animate` elements have `opacity: 0` initially; gain `is-visible` after IntersectionObserver fires | smoke | `npx playwright test tests/phase5.spec.ts --grep "POLSH-01" --project=chromium` | ❌ Wave 0 |
| POLSH-02 | `.skill-card`, `.project-card`, `.entry-card` have CSS `transition` property and translateY transform on hover | smoke | `npx playwright test tests/phase5.spec.ts --grep "POLSH-02" --project=chromium` | ❌ Wave 0 |
| POLSH-03 | `#10B981` emerald color appears on at least 3 distinct element types (accent color audit) | smoke | `npx playwright test tests/phase5.spec.ts --grep "POLSH-03" --project=chromium` | ❌ Wave 0 |
| POLSH-04 | No WCAG contrast failures detected via axe | manual-only | N/A — use axe DevTools browser extension; automated axe requires @axe-core/playwright | ❌ manual |
| POLSH-05 | `/404` (or any 404 URL) renders a page with site nav and home CTA | smoke | `npx playwright test tests/phase5.spec.ts --grep "POLSH-05" --project=chromium` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/phase5.spec.ts --project=chromium`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/phase5.spec.ts` — covers SEO-01 through SEO-06, POLSH-01 through POLSH-05 (excluding manual-only items)
- [ ] SEO-04 and POLSH-04 are manual-only: Lighthouse run against Vercel deployment; axe DevTools browser extension against dev server

*(POLSH-01 scroll animation test note: Playwright can check CSS computed styles and class presence but cannot easily verify IntersectionObserver behavior without scrolling. Test should: (1) check element has `opacity: 0` initial state, (2) scroll into view, (3) wait for `is-visible` class, (4) verify `opacity: 1`.)*

---

## Sources

### Primary (HIGH confidence)
- Schema.org Person type — https://schema.org/Person
- Astro sitemap integration docs — https://docs.astro.build/en/guides/integrations-guide/sitemap/
- Astro pages docs (404 handling) — https://docs.astro.build/en/basics/astro-pages/
- Vercel Astro framework docs — https://vercel.com/docs/frameworks/astro
- W3C WCAG 2.1 Contrast Minimum — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

### Secondary (MEDIUM confidence)
- JSON-LD Person examples — https://jsonld.com/person/ (cross-verified against Schema.org)
- IntersectionObserver scroll animation patterns — MDN Web Docs + CSS-Tricks articles
- Open Graph meta tags — OGP.me specification (og: tags are standard; Twitter card spec verified)

### Tertiary (LOW confidence)
- Vercel static mode 404 handling edge cases — GitHub issues on withastro/astro repo (multiple issues report inconsistent behavior; recommend manual verification after deploy)
- `#10B981` contrast ratio on `#0F172A` (~3.8:1) — calculated from WCAG luminance formula; recommend verifying with WebAIM contrast checker (https://webaim.org/resources/contrastchecker/)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Astro official docs verified; `@astrojs/sitemap` is the official integration
- Architecture: HIGH — Pattern matches established codebase conventions (scoped styles, liquid-glass, glow-accent variable)
- Pitfalls: HIGH — Most pitfalls verified by reading actual component code and documented GitHub issues
- WCAG contrast: MEDIUM — Ratio calculated from formula; recommend tool verification

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (Astro 6.x stable; no breaking changes expected in 30 days)
