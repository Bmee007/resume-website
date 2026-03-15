# Roadmap: Borina Keo — Resume Website

## Overview

Four and a half phases take this project from zero to a live, SEO-optimized personal brand site. Phase 1 builds the scaffolding and navigation shell. Phase 2 completes the above-the-fold identity (hero, bio, skills). Phase 3 delivers the credibility evidence (experience timeline and AI project showcase). Phase 4 wires the contact form and deploys to Vercel. Phase 5 adds the finishing layer: animations, SEO metadata, performance polish, and launch validation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Design System** - Astro/Tailwind scaffold, design tokens, responsive base, sticky nav, and deployment pipeline (completed 2026-03-15)
- [ ] **Phase 2: Hero, About & Skills** - Full-viewport hero with photo and CTA, professional bio, and categorized skills display
- [x] **Phase 3: Experience & AI Projects** - Career timeline with quantified impact and AI integration showcase cards (completed 2026-03-15)
- [x] **Phase 4: Contact & Deployment** - Formspree contact form wired end-to-end, social links, and live Vercel URL (completed 2026-03-15)
- [x] **Phase 5: SEO, Polish & Launch** - SEO metadata, Open Graph, JSON-LD, animations, performance audit, and responsive QA (completed 2026-03-15)

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: A deployable Astro project exists with the full design system defined and a functioning sticky navigation bar
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` serves the site locally with no errors
  2. The sticky nav bar is visible on every scroll position, shows Borina's name, and links scroll smoothly to section anchors
  3. Active section is highlighted in the nav as the user scrolls through the page
  4. The hamburger menu opens and closes correctly on a 375px-wide viewport
  5. Visiting the Vercel preview URL loads the site from a public URL
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Playwright test scaffold (Wave 0 smoke tests for all Phase 1 requirements)
- [x] 01-02-PLAN.md — Astro scaffold + Tailwind v4 design tokens + BaseLayout + section stubs
- [x] 01-03-PLAN.md — Nav component (sticky, scroll-state, active section, hamburger) + Vercel deployment
- [ ] 01-04-PLAN.md — Gap closure: fix NAV-04 smoke test class name mismatch (.nav-links → .desktop-nav)

### Phase 2: Hero, About & Skills
**Goal**: Visitors who land on the site immediately understand who Borina is, what she does, and what makes her expertise distinct
**Depends on**: Phase 1
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04, ABOUT-01, ABOUT-02, ABOUT-03, SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05
**Success Criteria** (what must be TRUE):
  1. Above-the-fold viewport shows name, specific title ("ERP & WMS AI Integration Leader"), tagline, professional photo, and a "Contact Me" CTA button
  2. Clicking "Contact Me" scrolls to the contact section without a page reload
  3. LinkedIn and GitHub icon links are visible in the hero and navigate to the correct profiles
  4. The About section contains a professional bio that names D365, Manhattan DFIO, IBM AS400 migration, and AI integration
  5. The Skills section displays named technologies (not a plain bullet list) organized into at least four domain categories: ERP, WMS, AI/ML, and Leadership
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Phase 2 Playwright smoke test scaffold (12 RED tests, Wave 0)
- [ ] 02-02-PLAN.md — Hero refactor: two-column split, circular photo, social icon links
- [ ] 02-03-PLAN.md — AboutSection component: two-column bio + 3 stat callout boxes
- [ ] 02-04-PLAN.md — SkillsSection component: 2x2 grid of liquid-glass category cards with pill chips
- [ ] 02-05-PLAN.md — Wire AboutSection + SkillsSection into index.astro + visual verification checkpoint

### Phase 3: Experience & AI Projects
**Goal**: Enterprise visitors can verify Borina's track record through a timeline of quantified roles and a showcase of specific AI integration projects
**Depends on**: Phase 2
**Requirements**: EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. The experience timeline shows each role with company, title, date range, and 2-3 bullet accomplishments
  2. The D365 migration from IBM AS400 and Manhattan DFIO implementation each appear as featured entries in the timeline
  3. The timeline renders without layout breakage on a 375px viewport (no side-by-side columns that collapse poorly)
  4. The AI projects section contains 2-4 cards, each naming the integrated system, the AI technology used, and a measurable outcome
  5. At least one project card links to github.com/Bmee007, and the section headline positions Borina as a leader rather than an implementer
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Phase 3 Playwright smoke tests (9 RED tests for EXP-01 through PROJ-04, Wave 0)
- [ ] 03-02-PLAN.md — ExperienceSection component: vertical timeline, featured entries, CSS-only pulse dot
- [ ] 03-03-PLAN.md — ProjectsSection component: 2-column grid, liquid-glass cards, chips, GitHub links
- [ ] 03-04-PLAN.md — Wire ExperienceSection + ProjectsSection into index.astro + visual checkpoint

### Phase 4: Contact & Deployment
**Goal**: A visitor who wants to hire or inquire can submit a contact form and receive confirmation; Borina's social profiles are accessible from the contact section
**Depends on**: Phase 3
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. The contact section is present at the bottom of the page with a form containing exactly three fields: Name, Email, and Message
  2. Submitting the form with valid data delivers the message to Borina via Formspree and shows a success confirmation on the page
  3. Submitting the form with invalid or missing data shows an inline error state (not a silent failure)
  4. LinkedIn and GitHub profile links are visible and correct in the contact section
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Phase 4 Playwright smoke test scaffold (6 RED tests, Wave 0)
- [ ] 04-02-PLAN.md — ContactSection component + wire into index.astro (form, states, social links, footer)
- [ ] 04-03-PLAN.md — Formspree account activation + visual verification checkpoint

### Phase 5: SEO, Polish & Launch
**Goal**: The site earns a Lighthouse performance score of 90+ on mobile, ranks for intended keywords, and looks polished enough to impress Fortune 500 decision-makers
**Depends on**: Phase 4
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, POLSH-01, POLSH-02, POLSH-03, POLSH-04, POLSH-05
**Success Criteria** (what must be TRUE):
  1. Lighthouse mobile performance score is 90 or above on the live Vercel URL
  2. The page `<title>` and meta description contain "ERP AI integration consultant" terminology; sharing the URL on LinkedIn renders a correct Open Graph card with a 1200x630 image
  3. Sections fade in on scroll entry and all interactive elements (links, buttons, cards) have visible hover states
  4. Body text on the dark background meets WCAG AA contrast (4.5:1 minimum), and the electric blue/green accent is consistent throughout
  5. A styled 404 page, sitemap.xml, and robots.txt are accessible at their expected URLs
**Plans**: 6 plans

Plans:
- [x] 05-01-PLAN.md — Phase 5 Playwright smoke test scaffold (9 RED tests, Wave 0) (completed 2026-03-15)
- [ ] 05-02-PLAN.md — SEO head: BaseLayout OG/JSON-LD/canonical, sitemap integration, robots.txt
- [ ] 05-03-PLAN.md — Scroll animations: hero CSS keyframe load + section IntersectionObserver reveals
- [ ] 05-04-PLAN.md — Hover states: lift+glow on cards and social links, emerald accent audit
- [ ] 05-05-PLAN.md — 404 page + alt text audit + OG image + Lighthouse/WCAG human checkpoint
- [ ] 05-06-PLAN.md — Gap closure: create public/og-image.png branded PNG to pass SEO-05 smoke test

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 4/4 | Complete   | 2026-03-15 |
| 2. Hero, About & Skills | 4/5 | In Progress|  |
| 3. Experience & AI Projects | 4/4 | Complete   | 2026-03-15 |
| 4. Contact & Deployment | 3/3 | Complete   | 2026-03-15 |
| 5. SEO, Polish & Launch | 6/6 | Complete   | 2026-03-15 |
