# Phase 1: Foundation & Design System - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the Astro 5.x + Tailwind CSS v4 project, define the full visual design system as CSS custom properties, and build a working sticky navigation bar with smooth scroll and active-section highlighting. Deployment pipeline to Vercel is also in scope. All visible content sections (hero, about, skills, experience, projects, contact) are stub/placeholder in this phase — real content fills in during Phases 2-4.

</domain>

<decisions>
## Implementation Decisions

### Color Palette
- Accent: `#10B981` (Tailwind emerald-500 / teal-shifted green)
- Background: `#0F172A` (Tailwind slate-900 / dark navy)
- Card/surface background: `#1E293B` (Tailwind slate-800)
- Border color: `#334155` (Tailwind slate-700)
- Primary text: `#F8FAFC` (Tailwind slate-50 / near-white)
- Subtle glow on interactive elements: `box-shadow: 0 0 12px rgba(16,185,129,0.35)` on hover states and active nav links

### Typography
- Headings: DM Sans, weight 700
- Body text: Inter, weight 400
- Hero title ("Borina Keo"): ~56px / DM Sans 700 — moderate scale, professional balance, not oversized
- Subheadings/section labels: DM Sans 600
- Load both fonts from Google Fonts (or self-hosted for performance)

### Navigation Structure
- 5 nav links (left-to-right): About / Skills / Experience / Projects / Contact
- No link to Hero section (above the fold, no nav link needed)
- Left side: "Borina Keo" in DM Sans 700, `#F8FAFC`, hover color `#10B981`
- Clicking the name scrolls to top
- Nav behavior on scroll: transparent at page top → frosted-glass after ~80px scroll
  - Scrolled state: `background: rgba(15, 23, 42, 0.85)`, `backdrop-filter: blur(12px)`, `border-bottom: 1px solid #334155`
- Active section link: `color: #10B981` + subtle glow `0 0 8px rgba(16,185,129,0.4)`

### Mobile Menu Behavior
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project, no existing components

### Established Patterns
- None established — Phase 1 creates the patterns all subsequent phases follow
- Tailwind CSS v4 uses CSS-first config (`@theme` in CSS, not `tailwind.config.js`) — this changes how design tokens are defined vs v3

### Integration Points
- Section anchor IDs must be defined in Phase 1 so nav links can scroll to them (even if sections are stubs):
  - `#about`, `#skills`, `#experience`, `#projects`, `#contact`
- Vercel deployment config (vercel.json or zero-config Astro adapter) set up in this phase

</code_context>

<specifics>
## Specific Ideas

- Visual reference feel: Planetscale, Neon DB (dark navy + accent glow aesthetic)
- Nav frosted-glass on scroll: Apple / Linear / Vercel pattern — transparent hero blends into the page, nav solidifies as you read
- Accent glow signals "AI-native, electric" without being garish — `rgba(16,185,129,0.35)` keeps it subtle

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-design-system*
*Context gathered: 2026-03-14*
