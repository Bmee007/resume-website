# Phase 1: Foundation & Design System - Research

**Researched:** 2026-03-14
**Domain:** Astro 5.x, Tailwind CSS v4, sticky navigation, Vercel deployment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Color Palette
- Accent: `#10B981` (Tailwind emerald-500 / teal-shifted green)
- Background: `#0F172A` (Tailwind slate-900 / dark navy)
- Card/surface background: `#1E293B` (Tailwind slate-800)
- Border color: `#334155` (Tailwind slate-700)
- Primary text: `#F8FAFC` (Tailwind slate-50 / near-white)
- Subtle glow on interactive elements: `box-shadow: 0 0 12px rgba(16,185,129,0.35)` on hover states and active nav links

#### Typography
- Headings: DM Sans, weight 700
- Body text: Inter, weight 400
- Hero title ("Borina Keo"): ~56px / DM Sans 700
- Subheadings/section labels: DM Sans 600
- Load both fonts from Google Fonts (or self-hosted for performance)

#### Navigation Structure
- 5 nav links (left-to-right): About / Skills / Experience / Projects / Contact
- No link to Hero section
- Left side: "Borina Keo" in DM Sans 700, `#F8FAFC`, hover color `#10B981`
- Clicking the name scrolls to top
- Nav behavior on scroll: transparent at page top → frosted-glass after ~80px scroll
  - Scrolled state: `background: rgba(15, 23, 42, 0.85)`, `backdrop-filter: blur(12px)`, `border-bottom: 1px solid #334155`
- Active section link: `color: #10B981` + subtle glow `0 0 8px rgba(16,185,129,0.4)`

#### Mobile Menu Behavior
- Hamburger opens a slide-down panel from the nav bar (links stacked vertically below navbar)
- Hamburger icon animates into an X when open (CSS transition)
- Tapping any nav link auto-closes the menu before smooth-scrolling to destination
- Mobile breakpoint: ≤768px (or Tailwind's `md:` breakpoint)

### Claude's Discretion
- Exact CSS custom property naming convention (--color-accent vs --accent, etc.)
- Transition/animation duration for nav scroll behavior and mobile menu open/close
- Exact padding and spacing scale values beyond what Tailwind provides by default
- How to handle section stub content (placeholder text, empty divs with IDs, etc.)
- Favicon approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Project scaffolded with Astro 5.x and Tailwind CSS v4 | `npm create astro@latest` + `@tailwindcss/vite` plugin documented in official Tailwind Astro guide |
| FOUND-02 | Dark theme design tokens (colors, typography, spacing) defined as CSS custom properties | Tailwind v4 `@theme` directive generates both utility classes and CSS variables from a single CSS-first config |
| FOUND-03 | Site is fully responsive (mobile, tablet, desktop) | Tailwind's responsive prefix system (`md:`, `lg:`) + `scroll-smooth` on `<html>` covers all breakpoints |
| FOUND-04 | Site deployed to Vercel with a live public URL | Astro static sites deploy to Vercel zero-config — no adapter needed, push to Git and import on Vercel |
| FOUND-05 | `.gitignore`, `README.md`, and project config files in place | `npm create astro@latest` scaffolds `.gitignore`, `astro.config.mjs`, `tsconfig.json`, `package.json` automatically |
| NAV-01 | Sticky navigation bar with Borina's name/logo and section links | `position: sticky; top: 0; z-index: 50` pattern; `<nav>` component as Astro component |
| NAV-02 | Smooth scroll to sections on nav link click | `scroll-smooth` Tailwind class on `<html>` + CSS `scroll-behavior: smooth` handles native anchor scrolling |
| NAV-03 | Active section highlighted in nav as user scrolls | IntersectionObserver API with `rootMargin: "-5% 0% -95% 0%"` — triggers when section hits top 5% zone |
| NAV-04 | Mobile hamburger menu that opens/closes correctly | Vanilla JS `<script>` in Astro component toggles CSS class; CSS transition animates hamburger→X |
</phase_requirements>

---

## Summary

Phase 1 establishes a greenfield Astro 5.x + Tailwind CSS v4 project with a complete design token system and a fully functional sticky navigation bar, then deploys it to Vercel. The stack is a well-understood combination with strong official documentation coverage.

Tailwind CSS v4 introduces a CSS-first configuration model — design tokens live in an `@theme {}` block inside a `.css` file rather than a `tailwind.config.js`. This is a critical paradigm shift from v3 that affects every subsequent phase. The `@theme` directive simultaneously generates CSS custom properties (e.g., `var(--color-accent)`) and Tailwind utility classes (e.g., `bg-accent`, `text-accent`), making the design system usable in both contexts without duplication.

The sticky navigation requires two distinct JavaScript behaviors: (1) a `scroll` event listener that toggles a `.scrolled` CSS class on the nav after 80px, and (2) an `IntersectionObserver` watching the five section elements to highlight the active nav link. Both are implemented as vanilla JS inside `<script>` tags within the Astro nav component — no UI framework required.

**Primary recommendation:** Scaffold with `npm create astro@latest`, install `tailwindcss @tailwindcss/vite`, define all design tokens in `src/styles/global.css` inside `@theme {}`, build the nav as a single `Nav.astro` component with an inline `<script>`, and deploy to Vercel by connecting the Git repo with zero additional configuration.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.x (latest) | Site framework, routing, component model | Zero JS by default; file-based routing; `.astro` component format handles HTML+CSS+JS in one file; Lighthouse-friendly |
| tailwindcss | 4.x (latest) | Utility CSS + design token system | v4 `@theme` is the CSS-first successor to v3's `tailwind.config.js`; generates both utility classes and CSS variables |
| @tailwindcss/vite | 4.x | Vite plugin that integrates Tailwind into Astro's build | Official Tailwind-recommended integration path for Astro 5.x (replaces the legacy `@astrojs/tailwind` adapter) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/vercel | latest | Server adapter for Vercel SSR features | Only needed if using Vercel Image Optimization or Analytics. Static-only deployment does NOT need it |
| astro-google-fonts-optimizer | 2.x | Optimized Google Fonts loading with preconnect | Use if NOT using Astro's experimental Fonts API; preconnects and inlines critical CSS |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `<script>` in Nav.astro | Astro Islands with React/Svelte | Overkill for a toggle + IntersectionObserver; adds JS bundle weight with no benefit |
| Google Fonts via `<link>` | Astro experimental Fonts API (5.7+) | Experimental Fonts API is still flagged experimental as of March 2026; a `<link rel="preconnect">` + `<link rel="stylesheet">` pattern is stable and performant |
| Tailwind utilities only | Pure CSS custom properties | `@theme` generates both at once — no reason to avoid it |

**Installation:**
```bash
npm create astro@latest resume-website -- --template minimal
cd resume-website
npm install tailwindcss @tailwindcss/vite
```

---

## Architecture Patterns

### Recommended Project Structure
```
resume-website/
├── public/
│   └── favicon.svg          # Static assets, served as-is
├── src/
│   ├── components/
│   │   └── Nav.astro        # Sticky nav — the primary Phase 1 component
│   ├── layouts/
│   │   └── BaseLayout.astro # HTML shell: <head>, global styles, Nav slot
│   ├── pages/
│   │   └── index.astro      # Single-page entry; all section stubs live here
│   └── styles/
│       └── global.css       # @import "tailwindcss" + @theme {} design tokens
├── astro.config.mjs          # Tailwind vite plugin registered here
├── tsconfig.json
└── package.json
```

### Pattern 1: Tailwind v4 CSS-First Design Tokens
**What:** All design tokens (colors, fonts, spacing) defined in one `@theme {}` block in `global.css`. Tailwind reads this and generates utility classes; the same variables are available as CSS custom properties on `:root`.
**When to use:** Every time a design value is needed — use the utility class in markup, use the CSS variable in custom CSS.
**Example:**
```css
/* src/styles/global.css */
/* Source: https://tailwindcss.com/docs/theme */

@import "tailwindcss";

@theme {
  /* Colors */
  --color-bg:      #0F172A;
  --color-surface: #1E293B;
  --color-border:  #334155;
  --color-text:    #F8FAFC;
  --color-accent:  #10B981;

  /* Typography */
  --font-heading: "DM Sans", sans-serif;
  --font-body:    "Inter", sans-serif;
}

/* Smooth scrolling — applies scroll-behavior: smooth to the page */
html {
  scroll-behavior: smooth;
}
```

### Pattern 2: Astro Layout Component
**What:** `BaseLayout.astro` wraps every page with the `<html>/<head>/<body>` shell, imports global CSS, loads fonts, and includes the `<Nav>` component. Pages pass a `title` prop.
**When to use:** Single layout for this single-page site; every section stub `index.astro` uses it.
**Example:**
```astro
---
// src/layouts/BaseLayout.astro
// Source: https://docs.astro.build/en/basics/layouts/
import Nav from "../components/Nav.astro";
import "../styles/global.css";

interface Props { title: string; }
const { title } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <!-- Google Fonts: DM Sans + Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Inter:wght@400&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-bg text-text font-body">
    <Nav />
    <slot />
  </body>
</html>
```

### Pattern 3: Sticky Nav with Scroll-State Toggle
**What:** The nav starts transparent. A `scroll` event listener adds a `.scrolled` CSS class after 80px, which switches to the frosted-glass style. CSS transitions handle the visual change smoothly.
**When to use:** The locked nav behavior (transparent → frosted-glass at 80px scroll).
**Example:**
```astro
---
// src/components/Nav.astro
// Source: Pattern derived from MDN scroll events + Tailwind backdrop-filter docs
---
<header id="site-nav" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" id="nav-name" class="font-heading font-bold text-text hover:text-accent transition-colors">
      Borina Keo
    </a>

    <!-- Desktop links -->
    <nav class="hidden md:flex gap-8">
      <a href="#about"      class="nav-link">About</a>
      <a href="#skills"     class="nav-link">Skills</a>
      <a href="#experience" class="nav-link">Experience</a>
      <a href="#projects"   class="nav-link">Projects</a>
      <a href="#contact"    class="nav-link">Contact</a>
    </nav>

    <!-- Hamburger (mobile) -->
    <button id="hamburger" class="md:hidden" aria-label="Toggle menu" aria-expanded="false">
      <span class="hamburger-bar block w-6 h-0.5 bg-text mb-1.5 transition-all duration-300"></span>
      <span class="hamburger-bar block w-6 h-0.5 bg-text mb-1.5 transition-all duration-300"></span>
      <span class="hamburger-bar block w-6 h-0.5 bg-text transition-all duration-300"></span>
    </button>
  </div>

  <!-- Mobile panel -->
  <div id="mobile-menu" class="hidden md:hidden flex-col px-6 pb-4 gap-4">
    <a href="#about"      class="nav-link mobile-nav-link">About</a>
    <a href="#skills"     class="nav-link mobile-nav-link">Skills</a>
    <a href="#experience" class="nav-link mobile-nav-link">Experience</a>
    <a href="#projects"   class="nav-link mobile-nav-link">Projects</a>
    <a href="#contact"    class="nav-link mobile-nav-link">Contact</a>
  </div>
</header>

<style>
  #site-nav {
    background: transparent;
    border-bottom: 1px solid transparent;
  }
  #site-nav.scrolled {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom-color: #334155;
  }
  .nav-link {
    color: #F8FAFC;
    text-decoration: none;
    transition: color 0.2s, text-shadow 0.2s;
  }
  .nav-link:hover,
  .nav-link.active {
    color: #10B981;
  }
  .nav-link.active {
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  }
  /* Hamburger → X animation */
  #hamburger[aria-expanded="true"] .hamburger-bar:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }
  #hamburger[aria-expanded="true"] .hamburger-bar:nth-child(2) {
    opacity: 0;
  }
  #hamburger[aria-expanded="true"] .hamburger-bar:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }
</style>

<script>
  // Scroll state: transparent → frosted glass after 80px
  const nav = document.getElementById("site-nav");
  window.addEventListener("scroll", () => {
    nav?.classList.toggle("scrolled", window.scrollY > 80);
  }, { passive: true });

  // Active section spy via IntersectionObserver
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: "-5% 0% -95% 0%", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));

  // Mobile hamburger toggle
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");

  hamburger?.addEventListener("click", () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu?.classList.toggle("hidden");
    mobileMenu?.classList.toggle("flex");
  });

  // Close mobile menu on nav link tap, then scroll
  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger?.setAttribute("aria-expanded", "false");
      mobileMenu?.classList.add("hidden");
      mobileMenu?.classList.remove("flex");
    });
  });
</script>
```

### Pattern 4: Section Stubs with Anchor IDs
**What:** Placeholder `<section>` elements with the exact IDs all nav links reference. Minimal visible content — just enough to have scrollable height. Real content fills in Phases 2-4.
**When to use:** Required in Phase 1 so nav scroll and active-section highlighting are testable end-to-end.
**Example:**
```astro
<!-- src/pages/index.astro -->
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Borina Keo — ERP & WMS AI Integration Leader">
  <!-- Hero (above fold, no nav link) -->
  <section id="hero" class="min-h-screen flex items-center justify-center">
    <p class="text-text/40">Hero — Phase 2</p>
  </section>
  <section id="about"      class="min-h-screen flex items-center justify-center">
    <p class="text-text/40">About — Phase 2</p>
  </section>
  <section id="skills"     class="min-h-screen flex items-center justify-center">
    <p class="text-text/40">Skills — Phase 2</p>
  </section>
  <section id="experience" class="min-h-screen flex items-center justify-center">
    <p class="text-text/40">Experience — Phase 3</p>
  </section>
  <section id="projects"   class="min-h-screen flex items-center justify-center">
    <p class="text-text/40">Projects — Phase 3</p>
  </section>
  <section id="contact"    class="min-h-screen flex items-center justify-center">
    <p class="text-text/40">Contact — Phase 4</p>
  </section>
</BaseLayout>
```

### Anti-Patterns to Avoid
- **Using `tailwind.config.js` for design tokens:** In v4, this file is optional and mostly unused. Tokens must live in `@theme {}` in the CSS file. Mixing both leads to unexpected utility class conflicts.
- **Adding `@astrojs/tailwind` integration:** This is the v3 adapter. For v4 use the `@tailwindcss/vite` Vite plugin directly in `astro.config.mjs`. The two are incompatible.
- **`is:inline` on script tags:** Disables Astro's bundling, deduplication, and TypeScript support. Only use for rare third-party scripts. Nav JS does not need it.
- **Listening to `scroll` for active section detection:** CPU-intensive; fires on every pixel scroll. Use `IntersectionObserver` instead.
- **Installing `@astrojs/vercel` adapter for static sites:** Only needed for SSR/on-demand rendering. Static Astro + Vercel = zero-config, no adapter.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Active section detection | Custom scroll position math | `IntersectionObserver` API (browser native) | Async, performant, handles resize/viewport changes automatically |
| Smooth scroll to anchor | `window.scrollTo` with easing | `scroll-behavior: smooth` on `<html>` | Zero JS; browser handles deceleration curve; respects `prefers-reduced-motion` if combined with media query |
| CSS utility classes from design tokens | Custom CSS class naming | Tailwind `@theme` directive | `@theme` generates both the utility class AND the CSS variable simultaneously |
| Font loading optimization | Manual `<link>` with complex preload logic | Google Fonts URL with `display=swap` + `preconnect` links | Correct ordering (preconnect before stylesheet) is enough for good LCP; no custom logic needed |
| Mobile menu state management | JS framework component | `aria-expanded` + CSS class toggle with vanilla JS | Single boolean state, no reactivity needed; Astro's `<script>` handles it natively |

**Key insight:** The interactive behaviors in this phase (nav scroll, active section, hamburger) are all single-boolean state machines. They do not require a UI framework — vanilla JS in Astro `<script>` blocks is the right tool.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 `@theme` Token Names Don't Match Utility Class Names
**What goes wrong:** Defining `--color-accent: #10B981` in `@theme` and expecting `bg-accent` to work — it does. But defining `--bg-color: #0F172A` generates `bg-bg-color`, which reads awkwardly. Naming matters.
**Why it happens:** Tailwind v4 derives the utility class name directly from the CSS variable name: `--color-{name}` → `bg-{name}`, `text-{name}`, `border-{name}`.
**How to avoid:** Use `--color-*` namespace for all colors. Recommended naming: `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-accent`.
**Warning signs:** `bg-surface` class has no effect in the browser → check that the token is in `--color-surface`, not `--surface`.

### Pitfall 2: IntersectionObserver rootMargin Units
**What goes wrong:** Setting `rootMargin: "80px 0px 0px 0px"` to account for the sticky nav height. Works initially. Breaks if nav height changes between viewport sizes.
**Why it happens:** `rootMargin` is read-only after `new IntersectionObserver()` is called — you cannot update it dynamically.
**How to avoid:** Use percentage-based margins: `"-5% 0% -95% 0%"`. This creates a thin detection band near the top of the viewport, independent of nav height.
**Warning signs:** Two sections appear active simultaneously, or active state lags a full scroll distance behind position.

### Pitfall 3: Astro Script Deduplication
**What goes wrong:** Placing the nav `<script>` in `Nav.astro` (which is included in the layout) and also in `BaseLayout.astro` results in the script running only once (Astro deduplication) — this is actually correct behavior and not a bug, but can confuse debugging.
**Why it happens:** Astro intentionally deduplicates module scripts included multiple times.
**How to avoid:** Put nav scripts only in `Nav.astro`. Do not duplicate them in the layout. Understand that Astro deduplication is a feature.

### Pitfall 4: backdrop-filter Requires a Non-Opaque Background
**What goes wrong:** Setting `backdrop-filter: blur(12px)` but `background: transparent` — the blur has no visible effect.
**Why it happens:** `backdrop-filter` only renders a visible effect when the element has some transparency (partial opacity, rgba background).
**How to avoid:** Always pair with a semi-transparent background: `background: rgba(15, 23, 42, 0.85)`. The locked nav scrolled state already includes this correctly.
**Warning signs:** Frosted glass nav looks identical to fully opaque nav at 100% opacity.

### Pitfall 5: Google Fonts and FOUT (Flash of Unstyled Text)
**What goes wrong:** Page loads with system font, then jumps to DM Sans/Inter after fonts download — jarring visual.
**Why it happens:** Missing `display=swap` in the Google Fonts URL, or missing `preconnect` hints that delay font file download.
**How to avoid:** Include both `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` before the stylesheet link. Include `&display=swap` in the font URL.

---

## Code Examples

Verified patterns from official sources:

### Tailwind v4 Vite Plugin in astro.config.mjs
```javascript
// Source: https://tailwindcss.com/docs/guides/astro
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### @theme Block for This Project's Design Tokens
```css
/* src/styles/global.css */
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

@theme {
  /* --- Colors --- */
  --color-bg:      #0F172A;   /* slate-900 / page background */
  --color-surface: #1E293B;   /* slate-800 / card/surface background */
  --color-border:  #334155;   /* slate-700 / border color */
  --color-text:    #F8FAFC;   /* slate-50  / primary text */
  --color-accent:  #10B981;   /* emerald-500 / interactive accent */

  /* --- Fonts --- */
  --font-heading: "DM Sans", sans-serif;
  --font-body:    "Inter", sans-serif;
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
  scroll-behavior: smooth;
}
```

### IntersectionObserver for Scroll Spy (Vanilla JS)
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
// rootMargin creates a detection band 5% from top, ignoring the bottom 95% of viewport
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`
          );
        });
      }
    });
  },
  { rootMargin: "-5% 0% -95% 0%", threshold: 0 }
);

document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));
```

### Google Fonts Preload Pattern (BaseLayout Head)
```html
<!-- Source: https://web.dev/optimize-webfont-loading/ -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700&family=Inter:wght@400&display=swap"
  rel="stylesheet"
/>
```

### Vercel Deployment (No adapter needed for static Astro)
```bash
# Source: https://docs.astro.build/en/guides/deploy/vercel/
# Static Astro sites: push to Git, import on vercel.com — zero config needed
# If you want Vercel Analytics or Image Optimization:
npx astro add vercel
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `theme.extend` | `@theme {}` block in CSS file | Tailwind CSS v4.0 (Jan 2025) | No JS config file needed; tokens are CSS variables automatically |
| `@astrojs/tailwind` integration package | `@tailwindcss/vite` Vite plugin | Astro 5.2 + Tailwind 4 (early 2025) | Direct Vite plugin is faster; old package is for Tailwind v3 only |
| `scroll` event listener for active section | `IntersectionObserver` API | Browser baseline 2022 | Async and performant; no per-pixel event flood |
| Scroll event listener for nav transparency | Same: `scroll` event with `passive: true` | N/A | Still correct; IntersectionObserver is better for section detection, scroll event is fine for simple threshold check |
| Astro 4 Content Collections API | Astro 5 Content Layer API | Astro 5.0 (Dec 2024) | Not relevant for Phase 1 (no content collections used) |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Tailwind v3 adapter — do not install for a v4 project
- `tailwind.config.js` content array: Not needed in v4; Tailwind scans automatically
- `@apply` heavy stylesheets: v4 prefers `@theme` tokens used directly as utility classes

---

## Open Questions

1. **Astro Experimental Fonts API vs Google Fonts `<link>`**
   - What we know: Astro 5.7 introduced `fontProviders.google()` which auto-downloads and self-hosts fonts. It is flagged as `experimental` as of March 2026.
   - What's unclear: There are open GitHub issues about the Fonts API (`issue #15515: "Experimental Fonts API dead?"`), suggesting possible instability.
   - Recommendation: Use the proven `<link>` approach with `preconnect` hints for Phase 1. Revisit for Phase 5 (Polish/Performance). Do not bet the foundation on an experimental API.

2. **Favicon approach (Claude's Discretion)**
   - What we know: Astro serves `public/favicon.svg` by default.
   - What's unclear: Client has no specified favicon asset.
   - Recommendation: Use a simple SVG favicon with the accent color (`#10B981`) for Phase 1. A placeholder green square or initials "BK" SVG is sufficient until branding assets exist.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) — no unit test framework installed yet |
| Config file | None — Wave 0 must install and configure |
| Quick run command | `npx playwright test --grep @smoke` |
| Full suite command | `npx playwright test` |

**Rationale for Playwright:** This phase's success criteria are behavioral (sticky nav visible at all scroll positions, active section highlighting, hamburger opens/closes at 375px). These are inherently browser behaviors, not unit-testable logic. Playwright is the right tool. No unit tests are warranted for Phase 1.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | `npm run dev` starts without errors, index page loads | smoke | `npx playwright test --grep "FOUND-01"` | ❌ Wave 0 |
| FOUND-02 | `--color-accent` CSS variable resolves to `#10B981` on `:root` | smoke | `npx playwright test --grep "FOUND-02"` | ❌ Wave 0 |
| FOUND-03 | Page viewport at 375px, 768px, 1280px renders without overflow | smoke | `npx playwright test --grep "FOUND-03"` | ❌ Wave 0 |
| FOUND-04 | Vercel preview URL returns HTTP 200 | manual | N/A — verified in browser after deployment | — |
| FOUND-05 | `.gitignore`, `package.json`, `astro.config.mjs` exist in repo | smoke | `npx playwright test --grep "FOUND-05"` | ❌ Wave 0 |
| NAV-01 | Nav bar `position: fixed` and visible at bottom of page on scroll | smoke | `npx playwright test --grep "NAV-01"` | ❌ Wave 0 |
| NAV-02 | Clicking "About" nav link scrolls `#about` into viewport | smoke | `npx playwright test --grep "NAV-02"` | ❌ Wave 0 |
| NAV-03 | Scrolling to `#skills` section sets `.active` on Skills nav link | smoke | `npx playwright test --grep "NAV-03"` | ❌ Wave 0 |
| NAV-04 | At 375px viewport, hamburger button visible; clicking opens mobile menu; link tap closes it | smoke | `npx playwright test --grep "NAV-04"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep @smoke` (runs only smoke-tagged tests, < 30s)
- **Per wave merge:** `npx playwright test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/phase1.spec.ts` — covers all FOUND-* and NAV-* requirements above
- [ ] `playwright.config.ts` — base URL pointing to `http://localhost:4321` (Astro dev default), viewport configs for 375/768/1280
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Astro Installation Guide](https://tailwindcss.com/docs/guides/astro) — exact v4 setup steps with `@tailwindcss/vite`
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) — `@theme` directive syntax and namespaces
- [Astro Install and Setup](https://docs.astro.build/en/install-and-setup/) — `npm create astro@latest` command and project structure
- [Astro Project Structure](https://docs.astro.build/en/basics/project-structure/) — canonical directory layout
- [Astro Vercel Deployment](https://docs.astro.build/en/guides/deploy/vercel/) — static = zero-config, no adapter needed
- [Astro Client-Side Scripts](https://docs.astro.build/en/guides/client-side-scripts/) — `<script>` tag behavior, deduplication
- [MDN IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver_API) — rootMargin, threshold

### Secondary (MEDIUM confidence)
- [Astro 5.2 Release Notes](https://astro.build/blog/astro-520/) — confirms Tailwind 4 native support via Vite plugin
- [Astro Experimental Fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/) — still experimental, not recommended for Phase 1
- [Astro 5.7 Release](https://astro.build/blog/astro-570/) — Fonts API released as experimental in April 2025

### Tertiary (LOW confidence — for validation only)
- [Astro sticky nav IntersectionObserver patterns](https://dev.to/fazzaamiarso/add-toc-with-scroll-spy-in-astro-3d25) — community guide, verified against MDN spec
- [GitHub issue: Experimental Fonts API dead?](https://github.com/withastro/astro/issues/15515) — signals API instability, justifies using `<link>` approach instead

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Official docs consulted for Astro + Tailwind v4; versions and commands verified
- Architecture: HIGH — Project structure and `@theme` syntax from official sources
- Nav patterns: HIGH — IntersectionObserver from MDN; scroll event from browser standard; CSS from MDN backdrop-filter
- Pitfalls: MEDIUM — Some from official docs, some derived from known v3→v4 migration differences
- Validation: MEDIUM — Playwright chosen based on behavioral test requirements; exact config derived from Playwright defaults

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable stack; Tailwind v4 and Astro 5.x are mature releases)
