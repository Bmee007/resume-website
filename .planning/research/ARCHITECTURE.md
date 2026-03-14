# Architecture Research

**Domain:** Static personal portfolio / resume website
**Researched:** 2026-03-14
**Confidence:** HIGH (static portfolio sites are an extremely well-established domain with stable patterns)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │   Nav    │  │  Hero    │  │ Sections │  │   Contact    │    │
│  │(sticky)  │  │(#hero)   │  │(#about   │  │  (#contact)  │    │
│  │          │  │          │  │ #skills  │  │              │    │
│  │          │  │          │  │ #exp     │  │              │    │
│  │          │  │          │  │ #projects│  │              │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     Single HTML Document                         │
│              (index.html — all sections inline)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   style.css  │  │   main.js    │  │  assets/              │  │
│  │ (all styles) │  │(scroll/anim) │  │  (fonts, images, ico) │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Static Hosting Layer                         │
│              (GitHub Pages / Netlify / Vercel)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `<nav>` | Site-wide navigation with smooth-scroll anchor links; sticky on scroll; hamburger on mobile | Scroll events via `main.js`; all section IDs |
| `#hero` | First impression — name, title, tagline, primary CTA button, professional photo | `#contact` anchor (CTA target) |
| `#about` | Professional bio built from LinkedIn content; personal brand narrative | Standalone, no dependencies |
| `#skills` | ERP/WMS/AI expertise displayed as tag clouds or categorized lists | Standalone |
| `#experience` | Career timeline — D365 migration from AS400, Manhattan DFIO roles | May reference `#projects` for linked case studies |
| `#projects` | AI integration showcase / case studies; featured work with outcomes | Standalone; may link to GitHub |
| `#contact` | Inquiry form or CTA with mailto/Formspree fallback; LinkedIn link | External: Formspree API or mailto |
| `<footer>` | Copyright, social links (LinkedIn, GitHub), secondary nav | Social profile URLs |
| `schema.json-ld` | Inline `<script type="application/ld+json">` Person markup for SEO | Rendered inside `<head>` |

## Recommended Project Structure

```
resume-website/
├── index.html              # Single-page document, all sections
├── style.css               # All styles (or split — see below)
├── main.js                 # Scroll behavior, nav highlight, form submit
├── assets/
│   ├── images/
│   │   ├── borina-photo.jpg        # Placeholder → swap with professional photo
│   │   ├── borina-photo@2x.jpg     # 2x retina version
│   │   └── og-image.jpg            # Open Graph social share image (1200×630)
│   ├── icons/
│   │   ├── favicon.ico
│   │   ├── favicon-32x32.png
│   │   ├── favicon-16x16.png
│   │   └── apple-touch-icon.png
│   └── fonts/                      # Only if self-hosting (optional — Google Fonts CDN is fine)
│       └── (font files if needed)
└── .planning/              # GSD project planning (not deployed)
```

**Optional CSS split for maintainability (if style.css grows large):**

```
css/
├── base.css        # Reset, custom properties (CSS variables), typography
├── layout.css      # Grid/flexbox page structure
├── components.css  # Nav, hero, sections, cards, buttons
├── utilities.css   # Helper classes (spacing, text alignment)
└── animations.css  # Scroll fade-in, hover effects
```

Linked in `index.html` with `<link>` tags. For a single-developer static site, one `style.css` is fine until it exceeds ~600 lines.

### Structure Rationale

- **Single `index.html`:** Portfolio visitors land and scroll; no routing needed. Single-page keeps load fast and SEO simple (one URL to rank).
- **`assets/images/`:** Keeps HTML clean. The `borina-photo.jpg` naming makes swap easy — replace the file, no HTML edits needed.
- **`og-image.jpg`:** Critical for LinkedIn sharing (the primary audience will share this link on LinkedIn).
- **`main.js` minimal:** No framework. Vanilla JS for scroll-spy nav highlighting, smooth scroll polyfill, mobile menu toggle, optional form submission.
- **No build toolchain for v1:** GitHub Pages serves static files directly. No Webpack/Vite needed unless adding PostCSS or bundling.

## Architectural Patterns

### Pattern 1: CSS Custom Properties for Theming

**What:** Define the entire color palette and spacing scale as CSS variables on `:root`. All components reference variables, never hardcoded hex values.

**When to use:** Always, on any project with a defined color system. Essential for a dark theme with accent colors.

**Trade-offs:** Zero runtime cost, excellent browser support (97%+), makes theme changes a single-file edit. No downside for this use case.

**Example:**
```css
:root {
  /* Color palette */
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #12121a;
  --color-bg-card: #1a1a28;
  --color-accent: #00d4ff;        /* Electric blue */
  --color-accent-glow: rgba(0, 212, 255, 0.15);
  --color-text-primary: #f0f0f5;
  --color-text-muted: #8888aa;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing scale */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 2rem;
  --space-lg: 4rem;
  --space-xl: 8rem;

  /* Layout */
  --max-width: 1100px;
  --section-padding: var(--space-xl) var(--space-md);
}
```

### Pattern 2: Single-Page Section Layout with Anchor Navigation

**What:** All content sections exist in one HTML document. `<nav>` uses `href="#section-id"` links. JavaScript adds active state to nav as user scrolls (scroll-spy). `scroll-behavior: smooth` handles animation.

**When to use:** Portfolio sites with 4–8 content sections. Works because there is no need for routing — the audience scrolls linearly.

**Trade-offs:** Simple, fast, no JS framework needed. Limitation: URL does not update per-section without additional `history.pushState` logic (skip that for v1).

**Example:**
```html
<!-- Nav -->
<nav id="site-nav">
  <a href="#about">About</a>
  <a href="#skills">Skills</a>
  <a href="#experience">Experience</a>
  <a href="#projects">Projects</a>
  <a href="#contact">Contact</a>
</nav>

<!-- Section -->
<section id="about" aria-labelledby="about-heading">
  <h2 id="about-heading">About</h2>
  ...
</section>
```

```css
html { scroll-behavior: smooth; }
```

```js
// Scroll-spy: highlight active nav link
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`nav a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));
```

### Pattern 3: Scroll-Triggered Fade-In Animations

**What:** Elements start invisible (`opacity: 0; transform: translateY(20px)`) and animate in when they enter the viewport. Uses `IntersectionObserver` — no scroll event listeners (better performance).

**When to use:** For the "polished" modern feel required by this project. Apply to section headings, skill tags, timeline entries, and project cards.

**Trade-offs:** Adds visual sophistication with minimal JS. Risk: over-animation feels gimmicky — limit to 1-2 animations per section entry, not every element.

**Example:**
```css
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```js
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target); // fire once
    }
  });
}, { threshold: 0.15 });
fadeEls.forEach(el => fadeObserver.observe(el));
```

## Data Flow

### Content Flow (Static Site)

```
LinkedIn Profile (source of truth for bio/experience)
    |
    v (manual extraction — copy/paste or scrape once)
index.html (hardcoded HTML content — sections below)
    |
    +---> #about     (bio paragraph)
    +---> #skills    (skills list)
    +---> #experience (timeline entries)
    +---> #projects  (case study cards)
    |
    v
Browser renders → User reads → User clicks CTA
    |
    v
#contact section → form submit
    |
    +---> Option A: Formspree (POST to formspree.io endpoint, no backend)
    +---> Option B: mailto: link (opens email client, zero infra)
    +---> Option C: Netlify Forms (if hosted on Netlify, built-in)
```

### SEO Data Flow

```
index.html <head>
    ├── <title>Borina Keo — ERP/WMS AI Integration Leader</title>
    ├── <meta name="description" content="...">
    ├── <meta property="og:*" content="...">    ← LinkedIn/social sharing
    ├── <meta name="twitter:*" content="...">
    └── <script type="application/ld+json">     ← Google rich results
            Person schema (see below)
        </script>
```

### Schema.org Person Markup

Embed as inline JSON-LD in `<head>`. This is the Google-preferred format (confirmed by Google's structured data documentation).

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Borina Keo",
  "jobTitle": "ERP/WMS AI Integration Leader",
  "description": "Implementation leader specializing in integrating AI into ERP and WMS systems, including Microsoft Dynamics 365 and Manhattan DFIO.",
  "url": "https://borinakeo.com",
  "image": "https://borinakeo.com/assets/images/borina-photo.jpg",
  "sameAs": [
    "https://www.linkedin.com/in/borina-keo-3534ab80/",
    "https://github.com/Bmee007"
  ],
  "knowsAbout": [
    "Microsoft Dynamics 365",
    "Manhattan DFIO",
    "ERP Implementation",
    "WMS Implementation",
    "AI Integration",
    "Supply Chain Technology",
    "IBM AS400 Migration"
  ],
  "alumniOf": {
    "@type": "Organization",
    "name": "[Organization name from LinkedIn]"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "professional inquiries",
    "url": "https://borinakeo.com/#contact"
  }
}
```

**Key properties for Google's "People Also Search" / knowledge panel eligibility:**
- `name` — required
- `url` — the canonical URL of this page
- `sameAs` — links to LinkedIn/GitHub signal identity authority
- `jobTitle` — affects keyword relevance for professional searches
- `image` — enables image in rich results
- `knowsAbout` — additional keyword signal for ERP/AI/WMS searches

### Asset Management

**Professional photo (swappable):**
```html
<!-- Use a consistent filename so swapping is a file replacement, not HTML edit -->
<img
  src="assets/images/borina-photo.jpg"
  srcset="assets/images/borina-photo.jpg 1x, assets/images/borina-photo@2x.jpg 2x"
  alt="Borina Keo — ERP and WMS AI Integration Leader"
  width="400" height="400"
  loading="eager"
>
```

The `alt` text doubles as a keyword-rich description for image SEO.

**Fonts:**
Use Google Fonts via `<link>` in `<head>` with `preconnect` hints. For a dark modern tech look:
- Headings: `Inter` or `Outfit` (clean, modern)
- Body: `Inter` (same — consistent, highly legible)
- Code/tech labels: `JetBrains Mono` (signals technical credibility)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

`display=swap` prevents invisible text during font load.

### Contact Form Integration

**Recommendation: Formspree (no backend required)**

Formspree accepts HTML form `POST` and emails results to a configured address. No server, no JavaScript required for basic submission. Works on GitHub Pages, Netlify, Vercel.

```html
<form action="https://formspree.io/f/{form-id}" method="POST">
  <input type="text" name="name" placeholder="Your name" required>
  <input type="email" name="email" placeholder="Your email" required>
  <input type="text" name="subject" placeholder="Subject">
  <textarea name="message" placeholder="How can I help you?" required></textarea>
  <button type="submit">Send Message</button>
</form>
```

For AJAX submission (no page redirect on success), add ~15 lines of vanilla JS that `fetch()` POSTs to Formspree and shows a success message.

**Alternative: mailto: CTA only**
If simplicity is the priority for v1, a prominent "Email Me" button with `href="mailto:borina@example.com"` delivers the same lead-capture with zero infra. Appropriate for v1.

### LinkedIn Data Integration

**Approach: Manual one-time extraction (recommended for v1)**

LinkedIn's API requires OAuth and does not expose full profile content to third-party apps. Scraping violates ToS. The practical approach:

1. Visit LinkedIn profile → manually copy bio, experience entries, skills
2. Hardcode content into `index.html`
3. LinkedIn profile link (`<a href="https://www.linkedin.com/in/borina-keo-3534ab80/">`) provides the live, authoritative reference

This is the correct v1 approach: static content is fast, no rate limits, no broken scraper maintenance. The `sameAs` schema.org property links the two identities for SEO authority.

## Suggested Build Order

Dependencies drive the order. Build foundational layers before dependent components:

```
1. HTML skeleton + meta/SEO head    ← foundation; everything else is inside this
        |
        v
2. CSS custom properties + reset    ← design tokens that all components consume
        |
        v
3. Nav + hero section               ← first visible impression; validates design direction
        |
        v
4. About + skills sections          ← core content from LinkedIn extraction
        |
        v
5. Experience timeline              ← most content-heavy section; benefits from seeing About first
        |
        v
6. Projects / AI showcase           ← depends on knowing what to feature
        |
        v
7. Contact section + form           ← tail CTA; Formspree setup is external dependency
        |
        v
8. Footer + social links
        |
        v
9. main.js (scroll-spy, animations, form handler)  ← JS wires up completed HTML
        |
        v
10. Schema.org JSON-LD + OG meta    ← fill in final URLs/content once all sections are done
        |
        v
11. Responsive polish (mobile breakpoints, final QA)
```

**Rationale for this order:**
- Nav and hero provide the earliest design validation feedback (worth building first)
- JS is last because it depends on all DOM elements existing
- Schema.org and OG tags are last because they reference the final deployed URL and real photo
- Responsive polish is last because adjusting layout is easier once content is final

## Anti-Patterns

### Anti-Pattern 1: JavaScript Framework for a Static Portfolio

**What people do:** Reach for React/Vue/Next.js because it's familiar.

**Why it's wrong:** Adds a build toolchain, node_modules, hydration overhead, and deployment complexity for a site with zero dynamic data. GitHub Pages hosting becomes more complex. Time-to-first-paint increases. For 6 sections of static content, a framework provides zero user benefit.

**Do this instead:** Plain HTML/CSS/JS. Deploy the folder directly to GitHub Pages with no build step.

### Anti-Pattern 2: Inline Styles and No CSS Variables

**What people do:** Set `color: #00d4ff` directly on individual elements throughout the file.

**Why it's wrong:** Changing the accent color (which will happen when iterating on the design) requires a global find-and-replace across dozens of declarations. Inconsistency creeps in.

**Do this instead:** All color values defined as CSS custom properties on `:root`. Components only reference `var(--color-accent)`.

### Anti-Pattern 3: Forgetting the Open Graph Image

**What people do:** Skip `og:image` meta tag, thinking SEO only matters for Google.

**Why it's wrong:** The primary audience (recruiters, hiring managers, potential clients) will share this URL on LinkedIn. Without an `og:image`, LinkedIn renders a blank card — dramatically reducing click-through. The target audience literally lives on LinkedIn.

**Do this instead:** Create a 1200×630px `og-image.jpg` early in the process. Include name, title, and a visual that matches the site aesthetic.

### Anti-Pattern 4: Photo with No Swap Path

**What people do:** Embed photo as a base64 string or use a LinkedIn photo URL directly.

**Why it's wrong:** LinkedIn photos expire or change. Base64 bloats HTML. There's no clean path to swap in a professional photo later.

**Do this instead:** `assets/images/borina-photo.jpg` as a file reference. Swap = replace the file. Zero HTML changes.

### Anti-Pattern 5: Omitting `aria-labelledby` on Sections

**What people do:** Use `<section id="about">` without an accessible name.

**Why it's wrong:** Screen readers announce unnamed sections as "section" with no context. Also, accessibility is an SEO signal.

**Do this instead:** `<section id="about" aria-labelledby="about-heading"><h2 id="about-heading">About</h2>`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Formspree | HTML `<form action="https://formspree.io/f/{id}">` POST | Free tier: 50 submissions/month; sufficient for lead capture |
| Google Fonts | `<link>` in `<head>` with `preconnect` hints | Use `display=swap`; consider self-hosting if privacy matters |
| GitHub Pages | Push `index.html` to `gh-pages` branch or root of `main` | Custom domain via CNAME file; HTTPS automatic |
| LinkedIn | Outbound link only (`sameAs` in schema + visible link) | No API; manual content extraction for v1 |
| GitHub | Outbound link to `github.com/Bmee007` | Display in nav or footer; no API needed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Nav ↔ Sections | `href="#id"` anchor links + `IntersectionObserver` scroll-spy | All section IDs must be stable (changing breaks nav links) |
| Hero CTA ↔ Contact | `href="#contact"` anchor | CTA in hero must match contact section `id` exactly |
| Schema.org ↔ Content | JSON-LD in `<head>` references content in `<body>` | Keep manually in sync — `jobTitle` in schema must match visible headline |
| CSS Variables ↔ Components | `:root` declares, all selectors consume | One file to rule all colors; no component imports needed |
| JS ↔ DOM | `querySelectorAll` by ID and class | JS is non-blocking; loaded at end of `<body>` with `defer` |

## Confidence Notes

| Area | Confidence | Basis |
|------|------------|-------|
| File structure | HIGH | Industry-standard pattern for static sites; unchanged for years |
| CSS custom properties approach | HIGH | Well-established, 97%+ browser support |
| Schema.org Person properties | HIGH | schema.org spec is stable; `name`, `url`, `sameAs`, `jobTitle` are core properties |
| Formspree integration | MEDIUM | Formspree is well-established but pricing/free tier limits should be verified at formspree.io before build |
| Google Fonts specific recommendations | MEDIUM | Font taste is subjective; verify current favorites at fonts.google.com |
| LinkedIn API limitations | HIGH | LinkedIn has had strict API restrictions since 2018; manual extraction is the correct v1 approach |

## Sources

- schema.org/Person — Property definitions (training knowledge, stable spec)
- Google Structured Data — Person markup guidelines (training knowledge, verify at developers.google.com/search/docs/appearance/structured-data/person)
- Formspree documentation — formspree.io/docs (verify free tier limits before build)
- CSS Custom Properties — MDN Web Docs (high confidence, W3C standard)
- IntersectionObserver API — MDN Web Docs (high confidence, baseline browser support since 2019)
- GitHub Pages documentation — docs.github.com/pages (verify CNAME/custom domain steps)

---
*Architecture research for: Static personal portfolio / resume website (Borina Keo)*
*Researched: 2026-03-14*
