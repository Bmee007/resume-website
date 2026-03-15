# Phase 2: Hero, About & Skills - Research

**Researched:** 2026-03-15
**Domain:** Astro 6.x component authoring, Tailwind CSS v4 utility patterns, CSS layout (two-column split, grid), accessible social icon links
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Video Background**
- Keep the video background implemented in Phase 1, but make it optional
- Static fallback must render correctly when `/hero-video.mp4` is absent — dark gradient background, no broken layout
- Video is a progressive enhancement, not a launch requirement

**Hero Layout**
- Desktop: Split two-column — headline/tagline/CTAs on left, portrait photo on right
- Mobile: Stacked — photo above, text below (or text above, photo below — Claude's discretion for mobile feel)
- Keep the existing announcement badge (liquid-glass pill at top) — update badge label text if needed
- H1 structure: "Borina Keo" on line 1, "ERP & WMS AI Integration Leader" on line 2 (two-line heading)
- Keep the tech marquee at the bottom of the hero section, full-width below the split content

**Hero Photo Treatment**
- Circular crop with a thin emerald (`#10B981`) border ring
- Placeholder image: `/public/borina-photo.jpg` — place a generic placeholder file there with a clear TODO comment in the component
- Real photo drops in by replacing that file; no code changes needed

**Hero Social Links (HERO-04)**
- LinkedIn and GitHub icon links sit below the CTA buttons in a small inline horizontal row
- Icon size ~24px, secondary visual weight (dimmed, brighten on hover to emerald)

**About Section Layout**
- Desktop: Two-column — bio paragraph on the left, stat callouts stacked on the right
- Mobile: Single column, stats below the bio
- Bio text: realistic placeholder drawn from known facts (D365, Manhattan DFIO, IBM AS400 migration, AI integration) — marked clearly as placeholder for Borina to replace with real copy
- Key terms (D365, Manhattan DFIO, IBM AS400) appear naturally in bio prose — no inline chip treatment

**About Stat Callouts**
- 3 stat boxes on the right column: Years of experience, ERP/WMS implementations, AI integrations deployed
- Exact numbers are placeholders — Borina confirms real values before launch
- Stat boxes use liquid-glass card style consistent with Phase 1 patterns

**Skills Display**
- Container: 4 liquid-glass category cards in a 2×2 grid on desktop, single column on mobile
- Categories: ERP Systems, WMS Systems, AI/ML, Leadership
- Chips inside each card: minimal pill-shaped tags — 1px border (`#334155`), text only, no fill
  - Hover state: emerald accent border + text color (`#10B981`)
- Key skills per category defined in REQUIREMENTS.md (SKILL-02 through SKILL-04)

### Claude's Discretion
- Mobile stacking order in hero (text-above-photo vs photo-above-text)
- Exact stat box visual treatment (border, number size, label typography)
- Emoji or icon used as category header icon in skill cards
- Transition/animation durations for hover states
- Exact bio placeholder copy (realistic, professional, uses known facts)
- Leadership skill chip content

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HERO-01 | Full-viewport hero section with name, title ("ERP & WMS AI Integration Leader"), and tagline | Existing HeroSection.astro has centered layout; needs refactor to two-column split. CSS Grid `grid-cols-1 md:grid-cols-2` pattern. |
| HERO-02 | Professional photo displayed prominently | `<img>` with `rounded-full`, `object-cover`, emerald ring via CSS `outline` or `ring` utility. Placeholder file at `/public/borina-photo.jpg`. |
| HERO-03 | Single primary CTA "Contact Me" that scrolls to contact section | Already implemented as `<a href="#contact">`. Smooth scroll is set on `html` in global.css. No change needed to scroll behavior. |
| HERO-04 | LinkedIn and GitHub icon links in hero | Inline SVG icons (no external library needed) at ~24px, below CTAs in a flex row. Links to `https://linkedin.com/in/borinakeo` and `https://github.com/Bmee007`. |
| ABOUT-01 | About / bio section with professional summary | New `AboutSection.astro` component; two-column CSS Grid on desktop, single column on mobile. |
| ABOUT-02 | Highlights D365, Manhattan DFIO, IBM AS400, and AI integration expertise | Placeholder bio prose that naturally names these systems. |
| ABOUT-03 | Years of experience and professional positioning statement visible | 3 stat callout boxes in right column using `.liquid-glass` class. |
| SKILL-01 | Skills & expertise section organized by category | New `SkillsSection.astro`; 2×2 CSS Grid of category cards. |
| SKILL-02 | ERP category: Microsoft Dynamics 365, IBM AS400, legacy migration | Hard-coded array in Astro frontmatter, rendered as pill chips. |
| SKILL-03 | WMS category: Manhattan DFIO, warehouse operations | Same pattern as SKILL-02. |
| SKILL-04 | AI/ML category: Azure OpenAI / Microsoft Copilot, Power Automate + AI Builder, custom ML/Python models, supply chain AI | Same pattern. |
| SKILL-05 | Visual skill display — not a plain bullet list | Pill chip design with 1px border, hover emerald state. CSS handles the visual. |
</phase_requirements>

---

## Summary

Phase 2 builds three content sections entirely within Astro's component model, extending the design system already established in Phase 1. No new npm packages are required — all visual needs (glass effect, emerald accent, Geist Sans, responsive layout) are already wired in `global.css` and Tailwind CSS v4.

The hero section requires a structural refactor of `HeroSection.astro` from a centered stack to a two-column split layout. The content exists in the current component; the work is reorganizing the HTML grid and adding the photo column and social icon row. The video background stays as a progressive enhancement with a graceful dark-gradient fallback when the file is absent.

The About and Skills sections are brand-new Astro components (`AboutSection.astro`, `SkillsSection.astro`) that will be imported into `index.astro` in place of the placeholder `<p>` stubs currently sitting inside `<section id="about">` and `<section id="skills">`. Both sections reuse `.liquid-glass` for cards and follow the established HSL token system — no new CSS patterns need to be invented.

**Primary recommendation:** Author all three sections as self-contained `.astro` files with scoped `<style>` blocks. Use CSS Grid with `grid-cols-1 md:grid-cols-2` for responsive layout. Reuse `.liquid-glass`, `hsl(var(--primary))`, and `--glow-accent` from global.css exactly as Nav.astro and HeroSection.astro do.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^6.0.4 (already installed) | Component authoring, static rendering | Already in project; zero-JS by default |
| Tailwind CSS v4 | ^4.0.0 (already installed) | Utility classes for spacing/layout | Already configured via `@tailwindcss/vite` |
| @fontsource/geist-sans | ^5.2.5 (already installed) | Geist Sans typeface | Already imported in global.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Inline SVG icons | n/a | LinkedIn, GitHub icons | No icon library needed; 2 icons at fixed size |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline SVG for social icons | lucide-react or heroicons npm package | npm package adds JS dependency and bundle overhead for only 2 icons; inline SVG is zero-cost |
| Scoped Astro `<style>` | Tailwind utility classes only | Scoped styles are cleaner for complex pseudo-element patterns like `.liquid-glass::before` already in global.css |

**Installation:**

No new packages needed. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── HeroSection.astro     # REFACTOR: add photo column + social row
│   ├── AboutSection.astro    # NEW: two-column bio + stat callouts
│   ├── SkillsSection.astro   # NEW: 2x2 grid of skill category cards
│   └── Nav.astro             # unchanged
├── layouts/
│   └── BaseLayout.astro      # unchanged
├── pages/
│   └── index.astro           # UPDATE: import + mount new components
└── styles/
    └── global.css            # unchanged — .liquid-glass already defined
public/
└── borina-photo.jpg          # NEW: placeholder image file (TODO comment)
```

### Pattern 1: Astro Component with Scoped Styles

**What:** Each section is an `.astro` file with an HTML template, optional frontmatter data, and a scoped `<style>` block. No framework JS required.

**When to use:** All three components in this phase. Astro scopes styles automatically — no CSS Modules or BEM needed.

**Example:**
```astro
---
// AboutSection.astro
const stats = [
  { value: "10+", label: "Years of Experience" },
  { value: "2", label: "Full ERP Migrations" },
  { value: "5+", label: "AI Integrations Deployed" },
];
---
<section id="about" class="about-root">
  <!-- template here -->
</section>
<style>
  .about-root { /* scoped to this component */ }
</style>
```

### Pattern 2: Two-Column Split via CSS Grid

**What:** CSS Grid with `grid-template-columns: 1fr 1fr` on desktop, single column on mobile.

**When to use:** Hero split (content left / photo right) and About split (bio left / stats right).

**Example:**
```css
/* Desktop: two-column */
.hero-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* Mobile: single column (default, mobile-first) */
/* .hero-split { display: grid; grid-template-columns: 1fr; } — default */

@media (min-width: 768px) {
  .hero-split { grid-template-columns: 1fr 1fr; }
}
```

### Pattern 3: Reusing `.liquid-glass` for Cards

**What:** Apply the `.liquid-glass` utility class from global.css to skill category cards and About stat boxes. The class provides backdrop-filter blur, gradient border via `::before` pseudo-element, and subtle inner shadow.

**When to use:** Any card/box that needs the glass panel aesthetic.

**Example:**
```astro
<div class="liquid-glass stat-box rounded-2xl">
  <span class="stat-value">10+</span>
  <span class="stat-label">Years of Experience</span>
</div>
```

Note: `.liquid-glass` uses `position: relative` and `overflow: hidden` — child content must account for this (`z-index: 1` on content inside).

### Pattern 4: Skill Chips with Hover State

**What:** Pill-shaped `<span>` elements with a 1px border, transparent background. On hover, border and text switch to emerald.

**When to use:** All skill tags inside category cards.

**Example:**
```astro
<span class="skill-chip">{skill}</span>
```
```css
.skill-chip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #334155;
  font-size: 0.875rem;
  color: hsl(var(--foreground) / 0.8);
  transition: border-color 0.2s, color 0.2s;
}
.skill-chip:hover {
  border-color: #10B981;
  color: #10B981;
}
```

### Pattern 5: Circular Photo with Emerald Ring

**What:** `<img>` with `border-radius: 50%`, `object-fit: cover`, and an emerald ring. Use CSS `outline` with `outline-offset` or a wrapping `<div>` with a gradient border technique.

**When to use:** Portrait photo in hero right column.

**Example:**
```css
.hero-photo {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  object-fit: cover;
  outline: 2px solid #10B981;
  outline-offset: 4px;
  box-shadow: var(--glow-accent);
}
```

### Pattern 6: Static Video Fallback

**What:** The `<video>` element silently shows nothing when the source file is missing — the browser simply renders no video. The existing `.hero-overlay` gradient background remains visible regardless of whether the video loads.

**When to use:** Already implemented in Phase 1. No additional code change needed for the fallback — the dark gradient overlay renders independently of the video element.

**Key insight:** The hero background works as: `background-color (--background)` → `<video>` layer (optional, 0.25 opacity) → `.hero-overlay` gradient. Even with no video file, the dark gradient overlay produces a fully styled background.

### Pattern 7: Mounting New Components in index.astro

**What:** Replace the placeholder `<section id="about">` and `<section id="skills">` stubs in `index.astro` with imported component tags.

**When to use:** When AboutSection.astro and SkillsSection.astro are ready.

**Example:**
```astro
---
import AboutSection from "../components/AboutSection.astro";
import SkillsSection from "../components/SkillsSection.astro";
---
<BaseLayout title="...">
  <HeroSection />
  <AboutSection />
  <SkillsSection />
  <!-- Phase 3 stubs remain below -->
</BaseLayout>
```

The section `id` attributes (`#about`, `#skills`) must live on the outermost element of each new component — not in `index.astro` — so that nav scroll links continue to work.

### Anti-Patterns to Avoid

- **Nesting `<section id="about">` twice:** If `AboutSection.astro` contains `<section id="about">`, `index.astro` must NOT wrap it in another `<section id="about">`. The current index.astro stubs must be replaced (not wrapped).
- **Using Tailwind's `ring-*` utilities for the photo border:** Tailwind v4 uses CSS-first config. `ring-*` utilities exist but the emerald color must reference the design token (`hsl(var(--primary))`) not a Tailwind color name. Using a plain CSS `outline` on the `<img>` is simpler and more predictable.
- **Adding `position: absolute` children to `.liquid-glass` without `z-index: 1`:** The `.liquid-glass::before` pseudo-element creates a stacking context. Content inside glass cards needs `position: relative; z-index: 1` if it needs to appear above the border gradient.
- **Forgetting `overflow: hidden` context on circular photo wrapper:** `.liquid-glass` already sets `overflow: hidden`, so don't nest the photo inside a glass card — apply the circle/ring directly to the `<img>` element.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scroll to `#contact` | Custom JS scroll handler | Native `scroll-behavior: smooth` on `html` (already set in global.css) | Already works; clicking `<a href="#contact">` scrolls natively |
| Glass panel border effect | Custom gradient border on each card | `.liquid-glass` utility class from global.css | Already tested, reuse it |
| Tech marquee animation | New CSS animation | Existing `marquee-track` + `@keyframes marquee` in global.css | Already defined; add to `.marquee-viewport` wrapper |
| Social icons (LinkedIn, GitHub) | SVG icon library npm package | Inline SVG paths (2 icons only) | Zero dependency, zero bundle cost |
| Responsive breakpoints | Custom media query values | Tailwind's `md:` prefix (768px) consistent with Nav.astro | Keeps breakpoints consistent across components |

**Key insight:** Nearly all infrastructure is already in place from Phase 1. Phase 2 is content + layout, not infrastructure.

---

## Common Pitfalls

### Pitfall 1: Duplicate `<section id="about">` After Mounting Component

**What goes wrong:** `index.astro` already has `<section id="about">` as a stub. If `AboutSection.astro` also starts with `<section id="about">`, the page will have two elements with the same ID. Nav scroll spy will target the first one (the empty stub), breaking navigation.

**Why it happens:** Easy to forget to clean up the stub when mounting the real component.

**How to avoid:** When adding `<AboutSection />` and `<SkillsSection />` to `index.astro`, delete the entire stub `<section>` elements. The new components own their own section IDs.

**Warning signs:** Clicking "About" in the nav scrolls to a blank area instead of the bio content.

### Pitfall 2: `.liquid-glass::before` Covers Content

**What goes wrong:** Content inside a `.liquid-glass` div disappears or is unclickable because the `::before` pseudo-element (which creates the gradient border) sits on top of it.

**Why it happens:** The `::before` has `z-index: 0` and the content has no explicit stacking context, so rendering order is undefined.

**How to avoid:** Always give direct children of `.liquid-glass` cards `position: relative; z-index: 1`.

**Warning signs:** Text in stat boxes is invisible or buttons inside cards don't respond to clicks.

### Pitfall 3: Hero Two-Column Layout Breaks on Tablet

**What goes wrong:** The two-column grid collapses to single column at `md:` (768px) but the photo is very large or very small, making the layout look broken at mid-widths.

**Why it happens:** Fixed `width`/`height` on the photo doesn't adapt to the grid column width.

**How to avoid:** Use `width: 100%; max-width: 320px` on the photo container with `aspect-ratio: 1 / 1` and `object-fit: cover`. Let the grid column constrain the size rather than hardcoding pixels.

**Warning signs:** Photo overflows its column or is 10px wide on iPad.

### Pitfall 4: Video `<source>` Error Pollutes Console When File Absent

**What goes wrong:** Browser logs a network error for `/hero-video.mp4` when the file doesn't exist, even though the fallback renders correctly visually.

**Why it happens:** The `<video>` element tries to load the source regardless of whether the file exists.

**How to avoid:** This is cosmetic only — the visual fallback works as expected. The error is acceptable during development. Note it clearly in the component comment so the team isn't confused. For production, Borina can drop in the real video file to eliminate the error.

**Warning signs:** Console shows `Failed to load resource: net::ERR_FILE_NOT_FOUND` for hero-video.mp4. Expected — not a code bug.

### Pitfall 5: Social Icon Links Have No Accessible Label

**What goes wrong:** Icon-only `<a>` tags with no text content are announced as empty links by screen readers.

**Why it happens:** SVG icons have no inherent text alternative.

**How to avoid:** Add `aria-label="LinkedIn profile"` and `aria-label="GitHub profile"` to the social icon anchor elements.

---

## Code Examples

Verified patterns from project source code inspection:

### Using HSL Design Tokens (from global.css)
```css
/* Correct pattern — matches Nav.astro and HeroSection.astro */
color: hsl(var(--foreground));
background: hsl(var(--primary));
border-color: hsl(var(--border-hsl));

/* Emerald accent glow — already defined as CSS custom property */
box-shadow: var(--glow-accent);   /* 0 0 12px rgba(16,185,129,0.35) */
```

### Skill Data as Frontmatter Array (Astro pattern)
```astro
---
const categories = [
  {
    title: "ERP Systems",
    skills: ["Microsoft Dynamics 365", "IBM AS400", "Legacy Migration"],
  },
  {
    title: "WMS Systems",
    skills: ["Manhattan DFIO", "Warehouse Operations"],
  },
  {
    title: "AI / ML",
    skills: [
      "Azure OpenAI / Microsoft Copilot",
      "Power Automate + AI Builder",
      "Custom ML / Python Models",
      "Supply Chain AI",
    ],
  },
  {
    title: "Leadership",
    skills: [
      "Team Leadership",
      "Stakeholder Management",
      "Change Management",
      "ERP Rollout Strategy",
    ],
  },
];
---
{categories.map((cat) => (
  <div class="liquid-glass skill-card rounded-2xl">
    <h3 class="skill-cat-title">{cat.title}</h3>
    <div class="skill-chips">
      {cat.skills.map((s) => <span class="skill-chip">{s}</span>)}
    </div>
  </div>
))}
```

### LinkedIn and GitHub Inline SVG Icons
```astro
<!-- LinkedIn icon ~24px -->
<a href="https://linkedin.com/in/borinakeo" target="_blank" rel="noopener noreferrer"
   aria-label="LinkedIn profile" class="social-icon-link">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
</a>

<!-- GitHub icon ~24px -->
<a href="https://github.com/Bmee007" target="_blank" rel="noopener noreferrer"
   aria-label="GitHub profile" class="social-icon-link">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
</a>
```

### Social Icon Hover State (CSS)
```css
.social-icon-link {
  color: hsl(var(--foreground) / 0.4);
  transition: color 0.2s;
}
.social-icon-link:hover {
  color: #10B981; /* emerald */
}
```

### 2x2 Skills Grid
```css
.skills-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `theme.extend` | CSS-first `@theme {}` block in global.css | Tailwind v4 | No JS config file needed; already implemented in Phase 1 |
| DM Sans / Inter font | Geist Sans via `@fontsource/geist-sans` | Phase 1 execution | All type must use Geist Sans |
| `import.meta.env` for conditional rendering | Astro frontmatter conditionals | Astro 5+ | Use `const hasPhoto = true` style flags in frontmatter if needed |

**Deprecated/outdated:**
- `tailwind.config.js` theme extension: Not used in this project — all tokens are in `global.css @theme {}` block.
- Astro `<style global>`: Not needed — global styles live in `global.css` imported by `BaseLayout.astro`.

---

## Open Questions

1. **Exact stat numbers for About callouts**
   - What we know: Placeholders are "10+ Years", "2 Full ERP Migrations", "5+ AI Integrations" (from CONTEXT.md)
   - What's unclear: Borina's actual numbers — these require her confirmation before launch
   - Recommendation: Mark each stat value with a `<!-- TODO: confirm with Borina -->` HTML comment

2. **LinkedIn profile URL slug**
   - What we know: LinkedIn profile exists (referenced throughout requirements); GitHub is `github.com/Bmee007`
   - What's unclear: Exact LinkedIn URL slug (e.g., `/in/borinakeo` or similar)
   - Recommendation: Use `https://linkedin.com/in/borinakeo` as placeholder with a `<!-- TODO: verify LinkedIn URL -->` comment

3. **Hero photo file format and aspect ratio**
   - What we know: Placeholder goes to `/public/borina-photo.jpg`
   - What's unclear: Whether the real photo will be square, portrait, or other ratio
   - Recommendation: Design the circular crop at a fixed `aspect-ratio: 1/1` with `object-fit: cover` so any photo dimensions work correctly

---

## Validation Architecture

nyquist_validation is enabled in config.json.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/phase2.spec.ts --project=desktop` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HERO-01 | Hero shows "Borina Keo" and "ERP & WMS AI Integration Leader" in viewport | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "HERO-01" --project=desktop` | ❌ Wave 0 |
| HERO-02 | Portrait photo is visible with circular styling | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "HERO-02" --project=desktop` | ❌ Wave 0 |
| HERO-03 | "Contact Me" CTA scrolls to `#contact` section | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "HERO-03" --project=desktop` | ❌ Wave 0 |
| HERO-04 | LinkedIn and GitHub links are visible and have correct href | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "HERO-04" --project=desktop` | ❌ Wave 0 |
| ABOUT-01 | About section is present and visible | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "ABOUT-01" --project=desktop` | ❌ Wave 0 |
| ABOUT-02 | Bio text contains "D365", "Manhattan DFIO", "IBM AS400" | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "ABOUT-02" --project=desktop` | ❌ Wave 0 |
| ABOUT-03 | Stat callouts are visible (years of experience, etc.) | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "ABOUT-03" --project=desktop` | ❌ Wave 0 |
| SKILL-01 | Skills section contains four category cards | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "SKILL-01" --project=desktop` | ❌ Wave 0 |
| SKILL-02 | ERP category contains "Microsoft Dynamics 365" and "IBM AS400" | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "SKILL-02" --project=desktop` | ❌ Wave 0 |
| SKILL-03 | WMS category contains "Manhattan DFIO" | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "SKILL-03" --project=desktop` | ❌ Wave 0 |
| SKILL-04 | AI/ML category contains "Azure OpenAI" and "Power Automate" | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "SKILL-04" --project=desktop` | ❌ Wave 0 |
| SKILL-05 | Skill display is not a plain `<ul>` list — uses chip/badge elements | e2e smoke | `npx playwright test tests/phase2.spec.ts -g "SKILL-05" --project=desktop` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/phase2.spec.ts --project=desktop`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/phase2.spec.ts` — covers HERO-01 through SKILL-05 (all 12 requirements above)

*(The existing `tests/phase1.spec.ts` covers FOUND-01 through NAV-04 and must remain green throughout.)*

---

## Sources

### Primary (HIGH confidence)
- Project source inspection: `src/components/HeroSection.astro`, `src/components/Nav.astro`, `src/styles/global.css`, `src/pages/index.astro`, `src/layouts/BaseLayout.astro` — all read directly
- `.planning/phases/02-hero-about-skills/02-CONTEXT.md` — locked decisions and existing code insights
- `playwright.config.ts` — confirmed test framework, project configuration, base URL

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirement definitions for HERO-01 through SKILL-05
- `.planning/STATE.md` — accumulated project decisions and Phase 1 outcomes

### Tertiary (LOW confidence)
- None — all claims verified against actual project source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct inspection of package.json and source files
- Architecture: HIGH — patterns derived from existing project code (Nav.astro, HeroSection.astro, global.css)
- Pitfalls: HIGH — identified from actual code structure (liquid-glass pseudo-element, existing section stubs, video fallback behavior)
- Test plan: HIGH — Playwright config read directly; test patterns match existing phase1.spec.ts style

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (stable stack — Astro 6.x, Tailwind v4, Playwright 1.58.2 are production-stable)
