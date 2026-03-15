# Phase 3: Experience & AI Projects - Research

**Researched:** 2026-03-15
**Domain:** Astro component authoring, CSS vertical timeline layout, CSS grid for project cards, CSS keyframe animation
**Confidence:** HIGH

## Summary

Phase 3 builds two Astro components — `ExperienceSection.astro` and `ProjectsSection.astro` — that replace the placeholder stubs in `index.astro`. The decisions in CONTEXT.md are fully locked: vertical single-column timeline, liquid-glass cards for featured entries, flat slate-800 for regular entries, 2-column project grid mirroring SkillsSection, and `.skill-chip` reuse for project tech labels. No new libraries are needed; everything builds on the established Phase 1/2 patterns.

The primary technical challenge is the CSS-only vertical timeline: a `::before` pseudo-element on the track provides the vertical rule, and `::before` on each entry provides the dot. Featured entries get an emerald `border-left` stripe and a `@keyframes` pulse on their dot. Because the layout is a single column at all widths, there is no responsive breakpoint complexity — EXP-05 mobile-friendliness is satisfied structurally from the start.

For the project cards, the 2-column grid is a direct copy of the SkillsSection `@media (min-width: 768px)` pattern. Each card carries system and AI-tech chips using the existing `.skill-chip` class from SkillsSection scoped styles — because `.skill-chip` is scoped to SkillsSection, ProjectsSection must re-declare the same chip CSS in its own scoped style block (Astro scoped styles do not leak between components).

**Primary recommendation:** Build ExperienceSection and ProjectsSection as pure Astro components with scoped styles, hardcoded data arrays in the frontmatter, zero JS, and zero new npm dependencies.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Timeline Layout**
- Vertical single-column layout — one entry stacks above the next, vertical line on the left
- Timeline connector: small filled emerald dot per entry; featured entries (D365 migration, Manhattan DFIO) get a subtle emerald glow pulse animation on their dot
- Regular entry dots: static, no animation
- Featured entries get a full emerald accent left-border stripe (same visual language as existing glow system) — no badge/tag label needed
- Section title: "Experience"
- Outcome-focused tagline beneath heading: e.g. "Quantified impact across ERP, WMS, and AI transformation"

**Experience Entry Content**
- 3 entries total: current role at top, 2 prior roles below (chronological descending)
- Each entry shows: Job Title, Company, Date range, 2-3 bullet accomplishments — no prose description
- Featured entries (D365 and Manhattan DFIO) use liquid-glass card surface + emerald accent border
- Regular entries use a flat slate-800 card with slate-700 border — no glass effect
- Bullet copy angle: AI integration outcomes — lead with AI results (e.g. "Led Azure OpenAI integration into D365, reducing [X] by [Y]%")
- Placeholder bullets use realistic known facts (D365, Manhattan DFIO, IBM AS400, Azure OpenAI) with metric placeholders like "[X]% reduction in Y" — Borina replaces with real numbers before launch

**AI Project Cards**
- 2-column grid on desktop, single column on mobile — mirrors SkillsSection grid pattern
- 3 placeholder cards: one D365 + AI, one Manhattan DFIO + AI, one additional AI project
- Each card shows: system integrated (chip), AI technology used (chip), measurable outcome (text), GitHub link on relevant cards
- Tech labels use .skill-chip pill pattern from SkillsSection — same border/hover treatment, no new pattern
- All project cards use liquid-glass surface (consistent with SkillsSection cards)

**Section Framing**
- AI Projects section title: "AI Integrations"
- AI Projects subheadline: "Leading AI-powered transformation across ERP & WMS systems"
- Experience section tagline: outcome-focused, e.g. "Quantified impact across ERP, WMS, and AI transformation"
- Placeholder bullet copy: realistic, references known systems and uses bracket-style metric placeholders

### Claude's Discretion
- Exact transition/animation timing for the pulsing dot on featured entries
- Spacing and padding within timeline entries
- Which of the 3 experience entries maps to "current role" vs the two prior (planner uses known facts from PROJECT.md)
- Name/title of the third AI project placeholder card (planner uses judgment)
- Whether the GitHub link on project cards is a button or inline text link

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXP-01 | Career timeline / experience section showing work history | Vertical single-column timeline using CSS pseudo-elements for rule and dots |
| EXP-02 | Each role shows: company, title, dates, and 2-3 bullet accomplishments | Hardcoded data array in frontmatter, rendered via `.map()` in template |
| EXP-03 | D365 migration from IBM AS400 featured as a key implementation | `featured: true` flag in data array drives liquid-glass surface + emerald left-border |
| EXP-04 | Manhattan DFIO implementation featured as a key implementation | Same `featured: true` flag; pulse animation on dot via `@keyframes` |
| EXP-05 | Timeline is mobile-friendly (not a broken side-by-side layout on small screens) | Single-column layout at all widths; no responsive breakpoint needed for timeline structure |
| PROJ-01 | AI integration showcase section with 2-4 featured project cards | 2-column grid on desktop (`@media min-width 768px`), single column on mobile; mirrors SkillsSection pattern |
| PROJ-02 | Each project card shows: system integrated, AI technology used, and outcome/impact | Chip elements for system + AI tech, outcome text block; all in card data array |
| PROJ-03 | GitHub link on relevant project cards (links to github.com/Bmee007) | `githubUrl` optional field in card data; render anchor conditionally |
| PROJ-04 | Section headline positions Borina as a leader, not just an implementer | Hardcoded heading: "Leading AI-powered transformation across ERP & WMS systems" |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.x (already installed) | Component authoring, static output | Project foundation; zero-JS by default |
| Tailwind CSS v4 | already installed | Utility classes where convenient | Project foundation; CSS-first @theme config |
| Geist Sans | already installed | Typography | Established in Phase 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No new dependencies needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS-only pulse animation | JS IntersectionObserver trigger | CSS is simpler, zero runtime cost; JS trigger is appropriate only if animation should fire once on scroll-entry — overkill for a subtle persistent pulse |
| Hardcoded data array in frontmatter | Separate `.ts` content file | Frontmatter is simpler for 3 entries; a separate file adds indirection without benefit at this scale |

**Installation:**
```bash
# No new dependencies — Phase 3 uses only what is already installed
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/
├── ExperienceSection.astro   # new — experience timeline
├── ProjectsSection.astro     # new — AI project cards
├── HeroSection.astro         # existing, no changes
├── AboutSection.astro        # existing, no changes
├── SkillsSection.astro       # existing, no changes
└── Nav.astro                 # existing, no changes

src/pages/
└── index.astro               # replace placeholder stubs with component imports

tests/
└── phase3.spec.ts            # new — Playwright smoke tests for EXP-* and PROJ-*
```

### Pattern 1: Astro Component with Frontmatter Data Array

**What:** Define typed data (experiences, projects) as a const array in the `---` frontmatter block. Render in template via `.map()`. All styling in the component's scoped `<style>` block.

**When to use:** Any static content section with 2-10 similar items.

**Example:**
```astro
---
// ExperienceSection.astro frontmatter
const experiences = [
  {
    title: "ERP & AI Integration Lead",
    company: "Current Company",
    dateRange: "2022 – Present",
    featured: false,
    bullets: [
      "Led Azure OpenAI integration into D365, reducing manual processing by [X]%",
      "Architected Power Automate workflows for [Y] business processes",
    ],
  },
  {
    title: "ERP Implementation Lead",
    company: "Previous Company",
    dateRange: "2019 – 2022",
    featured: true,   // D365 migration — gets liquid-glass + emerald border + pulse dot
    bullets: [
      "Directed full D365 migration from IBM AS400, cutting operational costs by [X]%",
      "Integrated Azure OpenAI into D365 procurement workflows, reducing cycle time [Y]%",
      "Led [Z]-person cross-functional team through 18-month ERP modernization",
    ],
  },
  // ...
];
---
```

### Pattern 2: CSS Vertical Timeline

**What:** A container div with a `::before` pseudo-element provides the vertical rule. Each `.timeline-entry` has a `::before` pseudo-element that renders the dot on the left edge.

**When to use:** Single-column chronological lists where the visual line connects entries.

**Example:**
```css
/* Scoped inside ExperienceSection.astro <style> block */

.timeline-track {
  position: relative;
  padding-left: 2rem;       /* space for the vertical line + dot */
}

/* Vertical connecting line */
.timeline-track::before {
  content: '';
  position: absolute;
  left: 0.5rem;             /* center of dot */
  top: 0.75rem;
  bottom: 0.75rem;
  width: 2px;
  background: hsl(var(--border-hsl));
}

/* Entry dot */
.timeline-entry::before {
  content: '';
  position: absolute;
  left: -1.625rem;          /* aligns center to the line */
  top: 1rem;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 9999px;
  background: hsl(var(--primary));   /* emerald */
}

/* Pulse on featured dot */
.timeline-entry.is-featured::before {
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
  animation: dot-pulse 2.5s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50%  { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
```

### Pattern 3: Featured Entry Liquid-Glass + Emerald Border

**What:** Featured timeline entries add the global `.liquid-glass` class plus a scoped `.is-featured` modifier that sets a `border-left` in emerald.

**When to use:** Entries that need visual elevation above regular entries.

**Example:**
```astro
<div class:list={["timeline-entry", entry.featured && "is-featured"]}>
  <div class:list={["entry-card rounded-2xl", entry.featured ? "liquid-glass" : "entry-card--flat"]}>
    <div class="entry-inner">
      <!-- content -->
    </div>
  </div>
</div>
```
```css
.entry-card--flat {
  background: #1E293B;                /* --color-surface */
  border: 1px solid #334155;          /* --color-border */
}

.is-featured .entry-card {
  border-left: 3px solid #10B981;     /* --color-accent */
}
```

### Pattern 4: Project Cards Grid (mirrors SkillsSection)

**What:** Single-column by default, 2-column at 768px breakpoint. Identical grid structure to `.skills-grid`.

**When to use:** Any 2-4 item card grid in this project.

**Example:**
```css
.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Pattern 5: Chip Reuse in ProjectsSection

**What:** `.skill-chip` is scoped to SkillsSection — it does NOT leak to ProjectsSection. ProjectsSection must declare the same chip CSS in its own scoped `<style>` block. The CSS rules are identical; only the component scope differs.

**When to use:** Every time a chip pill is needed in a component other than SkillsSection.

**Example (in ProjectsSection.astro scoped style):**
```css
/* Identical rules to SkillsSection — needed because Astro scoped styles don't share */
.project-chip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #334155;
  font-size: 0.875rem;
  color: hsl(var(--foreground) / 0.8);
  transition: border-color 0.2s, color 0.2s;
}
.project-chip:hover {
  border-color: #10B981;
  color: #10B981;
}
```

### Pattern 6: Section Header (mirrors existing sections)

**What:** Every section uses `<h2>` + `<p class="*-tagline">` inside a `*-header` wrapper with `margin-bottom: 3rem`.

**When to use:** All section headers in this project.

```astro
<div class="exp-header">
  <h2>Experience</h2>
  <p class="exp-tagline">Quantified impact across ERP, WMS, and AI transformation</p>
</div>
```
```css
.exp-header h2 {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
}
.exp-tagline {
  font-size: 1.125rem;
  color: hsl(var(--foreground) / 0.6);
  margin-top: 0.5rem;
  margin-bottom: 0;
}
```

### Anti-Patterns to Avoid

- **Using Tailwind utility classes for layout instead of scoped CSS:** Established Phase 1/2 pattern uses scoped `<style>` blocks for layout, Tailwind only for one-off utilities. New components must follow the same convention.
- **Importing `.skill-chip` from SkillsSection:** Astro scoped styles are not importable. Declare chip CSS locally in each component that needs it.
- **Two-column timeline (side-by-side entries):** This is the classic mobile breakage pattern described in EXP-05. Single-column is the explicit lock.
- **Adding z-index to `.liquid-glass` wrapper without z-index:1 on inner content div:** Phase 2 learned (stat-inner, skill-card-inner) that `.liquid-glass::before` sits at z-index:0, so inner content needs `position: relative; z-index: 1` to render on top.
- **Using `class` attribute directly with conditional — use Astro's `class:list` directive** to conditionally apply `is-featured` and `liquid-glass` together cleanly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Glass-border effect on cards | Custom gradient-border CSS from scratch | `.liquid-glass` global class in global.css | Already implemented, battle-tested in Phase 2 |
| Emerald hover on chips | New CSS | `.skill-chip`-identical rules copied to `.project-chip` | One class declaration, consistent behavior |
| Responsive grid | Custom flexbox grid | CSS Grid with `repeat(2, 1fr)` at 768px breakpoint | Identical to SkillsSection; copy the pattern |
| Emerald glow on hover | New box-shadow values | `box-shadow: 0 0 12px rgba(16,185,129,0.35)` from `--glow-accent` token | Design token established in Phase 1 |

**Key insight:** Phase 3 is a composition phase — it assembles existing visual primitives (liquid-glass, skill-chip, emerald glow, section header structure) into two new components. There is almost nothing to invent.

---

## Common Pitfalls

### Pitfall 1: Inner Content Hidden Behind liquid-glass::before

**What goes wrong:** Text and interactive elements inside a `.liquid-glass` card are invisible because the `::before` pseudo-element (z-index:0) covers them.

**Why it happens:** `.liquid-glass::before` uses `position: absolute; inset: 0` which covers the full card area. Without a z-index context on the inner wrapper, content renders below the pseudo-element.

**How to avoid:** Wrap card content in an inner div with `position: relative; z-index: 1`. Phase 2 established this for `.stat-inner` and `.skill-card-inner` — apply the same pattern to `.entry-inner` and `.project-card-inner`.

**Warning signs:** Card renders but content is not visible or partially occluded.

### Pitfall 2: Strict Mode Violation in Playwright Tests

**What goes wrong:** Playwright locator matches multiple elements (e.g., a class used in multiple sections) and throws a strict mode error.

**Why it happens:** Astro scoped styles hash class names, but test locators use `.class-name` or element types that may appear in multiple sections.

**How to avoid:** Always scope test locators to the section ID: `page.locator('#experience .timeline-entry')` not `page.locator('.timeline-entry')`. Phase 2 decision log documents this pattern.

**Warning signs:** Playwright throws "strict mode violation: locator resolved to N elements".

### Pitfall 3: CSS Vertical Line Overextends or Underextends

**What goes wrong:** The `::before` vertical rule on `.timeline-track` extends past the last dot or stops before the first dot.

**Why it happens:** Using `top: 0; bottom: 0` makes the line span the full container height; the first and last dots are at `top: 1rem` inside entries, so the line visually extends past the content.

**How to avoid:** Use `top: 0.75rem; bottom: 0.75rem` (or similar) to trim the line ends. Alternatively, `top: 1.25rem; bottom: 1.25rem` — tune visually.

**Warning signs:** Vertical rule appears to extend above the first dot or below the last dot.

### Pitfall 4: Astro `class:list` Requires Array Syntax

**What goes wrong:** Conditionally adding a class using string concatenation leads to a literal `"false"` class name in the DOM.

**Why it happens:** `class={"entry-card " + (featured ? "is-featured" : "")}` is valid but fragile; `class={"entry-card " + featured && "is-featured"}` evaluates to boolean `false` which Astro renders as the string `"false"`.

**How to avoid:** Use `class:list={["entry-card", featured && "is-featured"]}` — Astro's `class:list` directive filters falsy values automatically.

**Warning signs:** DOM shows `class="entry-card false"`.

### Pitfall 5: index.astro Must Import New Components

**What goes wrong:** ExperienceSection and ProjectsSection are built but never show up on the page.

**Why it happens:** `index.astro` currently has plain `<section id="experience">` and `<section id="projects">` stubs. Phase 3 must replace these stubs with component imports.

**How to avoid:** Edit `index.astro` as part of Phase 3:
1. Add `import ExperienceSection from "../components/ExperienceSection.astro";`
2. Add `import ProjectsSection from "../components/ProjectsSection.astro";`
3. Replace the stub sections with `<ExperienceSection />` and `<ProjectsSection />`.

**Warning signs:** Dev server shows "Experience — Phase 3" placeholder text; new component file exists but nothing changed on the page.

---

## Code Examples

Verified patterns from existing codebase:

### Astro class:list Directive (conditional classes)

```astro
<!-- Source: Astro docs pattern; consistent with project usage -->
<div class:list={["base-class", condition && "modifier-class", "rounded-2xl"]}>
```

### liquid-glass with Inner Content Wrapper

```astro
<!-- Source: AboutSection.astro and SkillsSection.astro patterns -->
<div class="liquid-glass some-card rounded-2xl">
  <div class="card-inner">
    <!-- z-index: 1 applied to .card-inner in scoped <style> -->
    content here
  </div>
</div>
```

### Section Header Pattern

```astro
<!-- Source: SkillsSection.astro and AboutSection.astro -->
<div class="section-header">
  <h2>Section Title</h2>
  <p class="section-tagline">Subheadline text</p>
</div>
```

### Emerald Glow Box-Shadow (design token)

```css
/* Source: global.css -- glow-accent token */
/* Use on hover states for cards and featured dots */
box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
```

### 2-Column Grid at 768px (mirrors SkillsSection)

```css
/* Source: SkillsSection.astro scoped styles */
.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Flat Slate Card (for non-featured entries)

```css
/* Source: --color-surface (#1E293B) and --color-border (#334155) from global.css */
.entry-card--flat {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 1rem;
}
```

### Playwright Test — Scoped to Section ID

```typescript
// Source: phase2.spec.ts established pattern
test("EXP-01 @smoke — experience section is visible with timeline entries", async ({ page }) => {
  await page.goto("/");
  const expSection = page.locator("#experience");
  await expSection.scrollIntoViewIfNeeded();
  await expect(expSection).toBeVisible();
  const entries = page.locator("#experience .timeline-entry");
  await expect(entries).toHaveCount(3);
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two-column "zigzag" timeline | Single-column vertical timeline | Locked in CONTEXT.md | No mobile breakage; simpler CSS |
| CSS class sharing across components | Each component re-declares chip CSS in scoped style | Astro architecture constraint | No import needed; class names are hashed per-component |
| `tailwind.config.js` | `@theme` block in `global.css` | Phase 1 (Tailwind v4) | Design tokens defined once in CSS, not JS |

**Deprecated/outdated:**
- Two-column timeline: Explicitly rejected in CONTEXT.md. The failure mode (broken side-by-side columns on 375px) is captured in EXP-05.
- Global CSS chip class: Not the project pattern. SkillsSection uses scoped styles; new components follow the same convention.

---

## Open Questions

1. **Which company/role maps to each of the 3 experience entries?**
   - What we know: Borina has a D365 migration (from IBM AS400) and a Manhattan DFIO implementation as "featured" roles; current role is at top
   - What's unclear: Actual company names, exact date ranges, current employer
   - Recommendation: Use placeholder company names ("Company A", or generic role descriptor) with `[Company Name]` brackets — same placeholder strategy as the metric brackets. Borina fills in before launch.

2. **Third AI project card topic**
   - What we know: CONTEXT.md says 3 cards: D365+AI, Manhattan DFIO+AI, and "one additional AI project"
   - What's unclear: The specific system or use case for the third card
   - Recommendation: Use "Supply Chain AI" (demand forecasting / pick optimization) as the third card — it maps to the "Supply Chain AI" skill already listed in SkillsSection, and provides a distinct showcase from the two ERP/WMS-specific cards.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `/Users/mylinh/projects/resume-website/playwright.config.ts` |
| Quick run command | `npx playwright test tests/phase3.spec.ts --project=desktop` |
| Full suite command | `npx playwright test --project=desktop --project=mobile` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXP-01 | `#experience` section visible, contains timeline entries | smoke | `npx playwright test tests/phase3.spec.ts -g "EXP-01" --project=desktop` | ❌ Wave 0 |
| EXP-02 | Each entry shows company, title, dates, bullets | smoke | `npx playwright test tests/phase3.spec.ts -g "EXP-02" --project=desktop` | ❌ Wave 0 |
| EXP-03 | D365 migration entry present as featured entry | smoke | `npx playwright test tests/phase3.spec.ts -g "EXP-03" --project=desktop` | ❌ Wave 0 |
| EXP-04 | Manhattan DFIO entry present as featured entry | smoke | `npx playwright test tests/phase3.spec.ts -g "EXP-04" --project=desktop` | ❌ Wave 0 |
| EXP-05 | Timeline layout does not break at 375px viewport | smoke | `npx playwright test tests/phase3.spec.ts -g "EXP-05" --project=mobile` | ❌ Wave 0 |
| PROJ-01 | `#projects` section visible, contains 2-4 project cards | smoke | `npx playwright test tests/phase3.spec.ts -g "PROJ-01" --project=desktop` | ❌ Wave 0 |
| PROJ-02 | Each project card shows system chip, AI tech chip, outcome text | smoke | `npx playwright test tests/phase3.spec.ts -g "PROJ-02" --project=desktop` | ❌ Wave 0 |
| PROJ-03 | At least one project card links to github.com/Bmee007 | smoke | `npx playwright test tests/phase3.spec.ts -g "PROJ-03" --project=desktop` | ❌ Wave 0 |
| PROJ-04 | Projects section headline contains leadership framing | smoke | `npx playwright test tests/phase3.spec.ts -g "PROJ-04" --project=desktop` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx playwright test tests/phase3.spec.ts --project=desktop`
- **Per wave merge:** `npx playwright test --project=desktop --project=mobile`
- **Phase gate:** Full suite green (all projects: desktop, tablet, mobile) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/phase3.spec.ts` — covers EXP-01 through EXP-05 and PROJ-01 through PROJ-04
- [ ] Framework install: already present (Playwright 1.58.2 installed in Phase 1)

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `src/styles/global.css`, `src/components/SkillsSection.astro`, `src/components/AboutSection.astro`, `src/pages/index.astro` — direct inspection of established patterns
- `tests/phase2.spec.ts` — Playwright locator and assertion patterns used in Phase 2
- `playwright.config.ts` — test runner configuration, viewport definitions
- `.planning/phases/03-experience-ai-projects/03-CONTEXT.md` — locked user decisions

### Secondary (MEDIUM confidence)

- Astro scoped style behavior (scoping prevents cross-component class sharing) — well-documented Astro behavior, consistent with Phase 2 observations
- CSS `class:list` directive — standard Astro pattern verified against Astro docs behavior

### Tertiary (LOW confidence)

- None — all findings are grounded in the existing codebase or locked CONTEXT.md decisions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase already exists; no new libraries
- Architecture: HIGH — patterns directly extracted from Phase 2 components
- Pitfalls: HIGH — most pitfalls are documented in STATE.md decisions log from Phase 2
- Test strategy: HIGH — Playwright infrastructure confirmed installed, phase2.spec.ts provides exact template to follow

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable — Astro 5.x, Tailwind v4, Playwright 1.x; no fast-moving dependencies introduced)
