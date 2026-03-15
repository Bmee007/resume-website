# Requirements: Borina Keo — Resume Website

**Defined:** 2026-03-14
**Core Value:** Position Borina Keo as the go-to leader for integrating AI into ERP/WMS systems — converting visitors into inbound leads or interview requests.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: Project scaffolded with Astro 5.x and Tailwind CSS v4
- [x] **FOUND-02**: Dark theme design tokens (colors, typography, spacing) defined as CSS custom properties
- [x] **FOUND-03**: Site is fully responsive (mobile, tablet, desktop)
- [x] **FOUND-04**: Site deployed to Vercel with a live public URL
- [x] **FOUND-05**: `.gitignore`, `README.md`, and project config files in place

### Navigation

- [x] **NAV-01**: Sticky navigation bar with Borina's name/logo and section links
- [x] **NAV-02**: Smooth scroll to sections on nav link click
- [x] **NAV-03**: Active section highlighted in nav as user scrolls
- [x] **NAV-04**: Mobile hamburger menu that opens/closes correctly

### Hero

- [x] **HERO-01**: Full-viewport hero section with name ("Borina Keo"), title ("ERP & WMS AI Integration Leader"), and tagline
- [x] **HERO-02**: Professional photo displayed prominently (LinkedIn photo as placeholder)
- [x] **HERO-03**: Single primary CTA button ("Contact Me") that scrolls to contact section
- [x] **HERO-04**: LinkedIn and GitHub icon links in hero

### About

- [x] **ABOUT-01**: About / bio section with professional summary drawn from LinkedIn profile
- [x] **ABOUT-02**: Highlights D365, Manhattan DFIO, IBM AS400 migration, and AI integration expertise
- [x] **ABOUT-03**: Years of experience and professional positioning statement visible

### Skills

- [x] **SKILL-01**: Skills & expertise section organized by category (ERP, WMS, AI/ML, Leadership)
- [x] **SKILL-02**: ERP category includes: Microsoft Dynamics 365, IBM AS400, legacy migration
- [x] **SKILL-03**: WMS category includes: Manhattan DFIO, warehouse operations
- [x] **SKILL-04**: AI/ML category includes: Azure OpenAI / Microsoft Copilot, Power Automate + AI Builder, custom ML/Python models, supply chain AI (demand forecasting, pick optimization)
- [x] **SKILL-05**: Visual skill display (tags, badges, or grouped cards) — not a plain bullet list

### Experience

- [x] **EXP-01**: Career timeline / experience section showing work history
- [x] **EXP-02**: Each role shows: company, title, dates, and 2-3 bullet accomplishments
- [x] **EXP-03**: D365 migration from IBM AS400 featured as a key implementation
- [x] **EXP-04**: Manhattan DFIO implementation featured as a key implementation
- [x] **EXP-05**: Timeline is mobile-friendly (not a broken side-by-side layout on small screens)

### AI Projects

- [x] **PROJ-01**: AI integration showcase section with 2-4 featured project cards
- [x] **PROJ-02**: Each project card shows: system integrated (D365/Manhattan), AI technology used (Azure OpenAI, Power Automate, etc.), and outcome/impact
- [x] **PROJ-03**: GitHub link on relevant project cards (links to github.com/Bmee007)
- [x] **PROJ-04**: Section headline positions Borina as a leader, not just an implementer

### Contact

- [x] **CONT-01**: Contact / inquiry section at bottom of page
- [x] **CONT-02**: Contact form with 3 fields maximum: Name, Email, Message
- [x] **CONT-03**: Form submission handled via Formspree (no backend required)
- [x] **CONT-04**: Success/error state shown after form submission
- [x] **CONT-05**: LinkedIn profile link in contact section
- [x] **CONT-06**: GitHub profile link in contact section

### SEO & Performance

- [x] **SEO-01**: Page title and meta description optimized for "ERP AI integration consultant" search intent
- [x] **SEO-02**: Schema.org `Person` JSON-LD markup with name, LinkedIn, GitHub, and job title
- [x] **SEO-03**: Open Graph tags (og:title, og:description, og:image 1200x630) for LinkedIn share cards
- [x] **SEO-04**: Lighthouse performance score ≥ 90 on mobile
- [x] **SEO-05**: All images have descriptive alt text
- [x] **SEO-06**: Sitemap and robots.txt present

### Polish

- [x] **POLSH-01**: Scroll-triggered fade-in animations on section entry (respects prefers-reduced-motion)
- [x] **POLSH-02**: Hover states on all interactive elements (links, buttons, cards)
- [x] **POLSH-03**: Consistent electric blue/green accent color used throughout
- [x] **POLSH-04**: Typography is legible on dark background (sufficient contrast ratios — WCAG AA)
- [x] **POLSH-05**: 404 page styled to match site

## v2 Requirements

### Social Proof

- **PROOF-01**: LinkedIn recommendations / testimonials section
- **PROOF-02**: Client logos or company names (with permission)
- **PROOF-03**: Certifications section (Microsoft, SAP, PMP, etc.)

### Content Enhancements

- **ENH-01**: Downloadable PDF resume button
- **ENH-02**: Blog / thought leadership section (AI + ERP articles)
- **ENH-03**: Case studies as full separate pages with detailed project breakdowns
- **ENH-04**: Dark/light mode toggle

### Functionality

- **FUNC-01**: Analytics integration (privacy-first — Vercel Analytics or Plausible)
- **FUNC-02**: Cal.com or Calendly booking widget for consulting discovery calls

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / login | Public portfolio site — no user accounts needed |
| CMS backend | Static content is fine for v1; easier to maintain |
| Multi-language | English-only for target audience |
| Video background / splash screen | Kills performance and credibility with enterprise clients |
| Animated loading screen | Anti-feature — enterprise audience has zero patience for it |
| Dark/light toggle | Added complexity for v1; dark-only is a brand decision |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| HERO-01 | Phase 2 | Complete |
| HERO-02 | Phase 2 | Complete |
| HERO-03 | Phase 2 | Complete |
| HERO-04 | Phase 2 | Complete |
| ABOUT-01 | Phase 2 | Complete |
| ABOUT-02 | Phase 2 | Complete |
| ABOUT-03 | Phase 2 | Complete |
| SKILL-01 | Phase 2 | Complete |
| SKILL-02 | Phase 2 | Complete |
| SKILL-03 | Phase 2 | Complete |
| SKILL-04 | Phase 2 | Complete |
| SKILL-05 | Phase 2 | Complete |
| EXP-01 | Phase 3 | Complete |
| EXP-02 | Phase 3 | Complete |
| EXP-03 | Phase 3 | Complete |
| EXP-04 | Phase 3 | Complete |
| EXP-05 | Phase 3 | Complete |
| PROJ-01 | Phase 3 | Complete |
| PROJ-02 | Phase 3 | Complete |
| PROJ-03 | Phase 3 | Complete |
| PROJ-04 | Phase 3 | Complete |
| CONT-01 | Phase 4 | Complete |
| CONT-02 | Phase 4 | Complete |
| CONT-03 | Phase 4 | Complete |
| CONT-04 | Phase 4 | Complete |
| CONT-05 | Phase 4 | Complete |
| CONT-06 | Phase 4 | Complete |
| SEO-01 | Phase 5 | Complete |
| SEO-02 | Phase 5 | Complete |
| SEO-03 | Phase 5 | Complete |
| SEO-04 | Phase 5 | Complete |
| SEO-05 | Phase 5 | Complete |
| SEO-06 | Phase 5 | Complete |
| POLSH-01 | Phase 5 | Complete |
| POLSH-02 | Phase 5 | Complete |
| POLSH-03 | Phase 5 | Complete |
| POLSH-04 | Phase 5 | Complete |
| POLSH-05 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 — traceability populated after roadmap creation*
