# Phase 3: Experience & AI Projects - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build two content sections: an Experience timeline showing career history with quantified role entries, and an AI Integrations showcase displaying project cards with outcomes. After this phase, enterprise visitors can verify Borina's track record through dated roles and specific AI project evidence. Contact form and social links are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Timeline Layout
- Vertical single-column layout — one entry stacks above the next, vertical line on the left
- Timeline connector: small filled emerald dot per entry; featured entries (D365 migration, Manhattan DFIO) get a subtle emerald glow pulse animation on their dot
- Regular entry dots: static, no animation
- Featured entries get a full emerald accent left-border stripe (same visual language as existing glow system) — no badge/tag label needed
- Section title: "Experience"
- Outcome-focused tagline beneath heading: e.g. "Quantified impact across ERP, WMS, and AI transformation"

### Experience Entry Content
- 3 entries total: current role at top, 2 prior roles below (chronological descending)
- Each entry shows: Job Title, Company, Date range, 2-3 bullet accomplishments — no prose description
- Featured entries (D365 and Manhattan DFIO) use liquid-glass card surface + emerald accent border
- Regular entries use a flat slate-800 card with slate-700 border — no glass effect
- Bullet copy angle: AI integration outcomes — lead with AI results (e.g. "Led Azure OpenAI integration into D365, reducing [X] by [Y]%")
- Placeholder bullets use realistic known facts (D365, Manhattan DFIO, IBM AS400, Azure OpenAI) with metric placeholders like "[X]% reduction in Y" — Borina replaces with real numbers before launch

### AI Project Cards
- 2-column grid on desktop, single column on mobile — mirrors SkillsSection grid pattern
- 3 placeholder cards: one D365 + AI, one Manhattan DFIO + AI, one additional AI project
- Each card shows: system integrated (chip), AI technology used (chip), measurable outcome (text), GitHub link on relevant cards
- Tech labels use .skill-chip pill pattern from SkillsSection — same border/hover treatment, no new pattern
- All project cards use liquid-glass surface (consistent with SkillsSection cards)

### Section Framing
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

</decisions>

<specifics>
## Specific Ideas

- Featured timeline entries should feel elevated — the liquid-glass + emerald left-border echoes the active nav link glow from Phase 1, tying the accent system together
- The pulsing dot animation on featured entries is a subtle "this one matters" signal — should be gentle, not distracting (similar to a slow CSS pulse, not flashing)
- Project card chips reuse the exact `.skill-chip` class from SkillsSection — no new CSS needed
- The 2-column project grid mirrors the 2×2 Skills grid — Phase 3 should feel like a natural continuation of the visual language set in Phase 2

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.liquid-glass` (global.css): backdrop-filter glass effect with gradient border — use for featured timeline entries and all project cards
- `.skill-chip` (SkillsSection.astro scoped styles): pill chip with slate border + emerald hover — reuse directly for project card tech labels (system, AI tech)
- `SkillsSection.astro`: 2×2 grid pattern with `.skills-grid` — mirror this layout for project cards grid
- HSL design tokens (`--primary`, `--background`, `--border-hsl`, `--secondary`): all new components must use these

### Established Patterns
- Geist Sans for all typography
- Emerald glow on hover: `box-shadow: 0 0 12px rgba(16,185,129,0.35)` — apply to featured entry dots and card hover states
- Section header structure: `<h2>` title + `<p class="*-tagline">` subheadline — match the pattern from SkillsSection (`skills-header` / `skills-tagline`)
- Scoped `<style>` blocks in Astro components — each new component uses scoped styles

### Integration Points
- `index.astro` already has `<section id="experience">` and `<section id="projects">` stubs — Phase 3 replaces these with `<ExperienceSection />` and `<ProjectsSection />` component imports
- Nav already links to `#experience` and `#projects` — no nav changes needed
- No changes to BaseLayout, HeroSection, AboutSection, or SkillsSection

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-experience-ai-projects*
*Context gathered: 2026-03-15*
