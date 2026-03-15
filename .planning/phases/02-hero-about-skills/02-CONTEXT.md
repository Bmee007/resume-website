# Phase 2: Hero, About & Skills - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the identity layer — hero section with photo and CTAs, professional About bio with stat callouts, and a categorized Skills display. After this phase, any visitor landing on the site immediately understands who Borina is, what she does, and what systems she works with. Experience timeline and AI project showcase are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Video Background (conflict resolution)
- Keep the video background implemented in Phase 1, but make it optional
- Static fallback must render correctly when `/hero-video.mp4` is absent — dark gradient background, no broken layout
- Video is a progressive enhancement, not a launch requirement

### Hero Layout
- **Desktop:** Split two-column — headline/tagline/CTAs on left, portrait photo on right
- **Mobile:** Stacked — photo above, text below (or text above, photo below — Claude's discretion for mobile feel)
- Keep the existing announcement badge (liquid-glass pill at top) — update badge label text if needed
- H1 structure: "Borina Keo" on line 1, "ERP & WMS AI Integration Leader" on line 2 (two-line heading)
- Keep the tech marquee at the bottom of the hero section, full-width below the split content

### Hero Photo Treatment
- Circular crop with a thin emerald (`#10B981`) border ring
- Placeholder image: `/public/borina-photo.jpg` — place a generic placeholder file there with a clear TODO comment in the component
- Real photo drops in by replacing that file; no code changes needed

### Hero Social Links (HERO-04)
- LinkedIn and GitHub icon links sit **below the CTA buttons** in a small inline horizontal row
- Icon size ~24px, secondary visual weight (dimmed, brighten on hover to emerald)

### About Section Layout
- **Desktop:** Two-column — bio paragraph on the left, stat callouts stacked on the right
- **Mobile:** Single column, stats below the bio
- Bio text: realistic placeholder drawn from known facts (D365, Manhattan DFIO, IBM AS400 migration, AI integration) — marked clearly as placeholder for Borina to replace with real copy
- Key terms (D365, Manhattan DFIO, IBM AS400) appear naturally in bio prose — no inline chip treatment, just normal text

### About Stat Callouts
- 3 stat boxes on the right column:
  1. **Years of experience** — e.g. "10+ Years"
  2. **ERP/WMS implementations** — e.g. "2 Full ERP Migrations"
  3. **AI integrations deployed** — e.g. "5+ AI Integrations"
- Exact numbers are placeholders — Borina confirms real values before launch
- Stat boxes use liquid-glass card style consistent with Phase 1 patterns

### Skills Display (SKILL-01 through SKILL-05)
- **Container:** 4 liquid-glass category cards in a **2×2 grid** on desktop, single column on mobile
- **Categories:** ERP Systems · WMS Systems · AI/ML · Leadership
- **Chips inside each card:** Minimal pill-shaped tags — 1px border (`#334155`), text only, no fill
  - Hover state: emerald accent border + text color (`#10B981`)
- **Key skills per category** (from REQUIREMENTS.md):
  - ERP: Microsoft Dynamics 365, IBM AS400, Legacy migration
  - WMS: Manhattan DFIO, Warehouse operations
  - AI/ML: Azure OpenAI / Microsoft Copilot, Power Automate + AI Builder, Custom ML / Python models, Supply chain AI (demand forecasting, pick optimization)
  - Leadership: (Claude's discretion — draw from LinkedIn context: team leadership, stakeholder management, change management for ERP rollouts)

### Claude's Discretion
- Mobile stacking order in hero (text-above-photo vs photo-above-text)
- Exact stat box visual treatment (border, number size, label typography)
- Emoji or icon used as category header icon in skill cards
- Transition/animation durations for hover states
- Exact bio placeholder copy (realistic, professional, uses known facts)
- Leadership skill chip content

</decisions>

<specifics>
## Specific Ideas

- The liquid-glass utility (defined in global.css Phase 1) should be reused for skill category cards and About stat boxes — keeps visual language consistent
- Emerald ring on portrait mirrors the active nav link glow from Phase 1 — coherent accent system
- Tech marquee in hero serves as a quick trust signal before visitors scroll to Skills section — keep both, they serve different moments in the scroll journey

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HeroSection.astro`: Existing hero stub with video background, badge, h1, subheading, CTAs, and tech marquee. Needs photo column added and social icons added below CTAs.
- `.liquid-glass` utility class (global.css): backdrop-filter glass effect with gradient border — reuse for skill category cards and stat callout boxes
- `global.css` HSL design tokens: `--background`, `--foreground`, `--primary` (emerald), `--border-hsl`, `--secondary` — use these throughout Phase 2 components

### Established Patterns
- Geist Sans for all type (font changed from DM Sans/Inter during Phase 1 execution)
- HSL token system for colors (`hsl(var(--primary))` etc.) — new components must follow this pattern
- `rounded-full` pill shapes for badges and buttons (set in Phase 1)
- Emerald glow on interactive elements: `box-shadow: 0 0 12px rgba(16,185,129,0.35)` — apply to hover states

### Integration Points
- Section IDs already defined in Phase 1 stubs: `#about`, `#skills` — new Astro components slot into those existing section wrappers
- `BaseLayout.astro` wraps all pages — new section components are imported and placed in `index.astro` between existing stubs
- Nav links already point to `#about` and `#skills` — no nav changes needed in Phase 2

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-hero-about-skills*
*Context gathered: 2026-03-15*
