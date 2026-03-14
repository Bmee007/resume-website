# Project Research Summary

**Project:** Borina Keo Resume Website
**Domain:** B2B consultant personal brand / portfolio — ERP/WMS/AI integration specialist
**Researched:** 2026-03-14
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a static personal brand site for a senior ERP/WMS implementation consultant who needs to convert enterprise decision-makers and hiring managers into inbound inquiries. The audience is sophisticated — Fortune 500 procurement leads and CIOs who have been burned by AI-washing and generic consultants — which means the site must lead with specificity and evidence rather than claims. The recommended approach is a no-backend static site built with Astro 5.x and Tailwind CSS v4, hosted on Vercel, organized as a single-page document with anchor navigation across 7 sections: hero, about, skills, experience, AI integrations showcase, contact, and footer.

The biggest implementation risk is content, not technology. The patterns here are well-established and the stack is proven. What differentiates a site that generates consulting inquiries from one that generates nothing is whether each AI claim is paired with a named tool and measurable outcome, whether experience entries include project scale (users, facilities, transaction volume), and whether the hero positions Borina with surgical specificity — "Integrating AI into Microsoft Dynamics 365 and Manhattan DFIO" — rather than the generic "ERP consultant" label every competitor already has. Content architecture decisions must be locked before any design or build work begins.

The secondary risk is dual-audience positioning. The project brief is open to both consulting clients and full-time employers, which is a legitimate business reality but a messaging trap if handled naively. The recommendation is to lead with the consulting narrative (enterprise buyers, case studies, ROI framing) and make FTE availability accessible but not the primary signal. A single "Let's Talk" CTA pointing to a low-friction contact form should be the primary conversion action; resume download and LinkedIn links are supporting, not primary.

## Key Findings

### Recommended Stack

Astro 5.x is the clear choice for this project. It ships zero JavaScript by default, produces near-perfect Lighthouse scores with no configuration, and was purpose-built for static content sites. Next.js adds 40-60kB of React runtime overhead with zero benefit for a site with no dynamic data. Tailwind CSS v4.2 handles the dark theme with its `dark:` prefix and `@theme` variables, and integrates first-class with Astro. Motion 11.x handles scroll-triggered entrance animations as Astro islands, keeping animation code isolated from the static build. Formspree provides a no-backend contact form on Vercel's free tier.

**Core technologies:**
- Astro 5.x: static site generator — zero JS by default, near-100 Lighthouse, HTML-first component model ideal for a static portfolio
- Tailwind CSS v4.2: utility-first CSS — native CSS `@theme` variables, built-in `dark:` prefix, under 10kB production bundle
- TypeScript 5.x: type safety — makes component props self-documenting; optional but recommended for the Astro island components
- Motion 11.x: animations — scroll-triggered section reveals and hero entrance effects as Astro islands with `client:visible`
- Formspree: contact form backend — free tier, no backend code, works on Vercel static
- Vercel: hosting — zero-config Astro detection, preview URLs per commit, built-in privacy-first analytics

**What to avoid:** Gatsby (maintenance-mode), Create React App (deprecated), Google Analytics (requires cookie consent banners that create friction with the target audience), and a dark/light mode toggle (significant CSS complexity for a site where dark is a brand signal, not a preference).

### Expected Features

Research identifies a clear three-tier feature hierarchy for this audience. Table stakes are the baseline that enterprise visitors assume exist — missing any of these makes the site feel unfinished. Differentiators are where Borina wins against the hundreds of generic ERP consultant sites. Anti-features are exclusions that protect launch timeline and user experience.

**Must have (table stakes):**
- Hero section with name, specific title, and above-the-fold CTA — enterprise buyers decide in 3 seconds
- Professional headshot — B2B buyers buy from people; a placeholder gray box signals unfinished
- About / bio narrative — 2-3 paragraphs, not bullet points; human voice alongside professional credentials
- Skills section with named systems (D365, Manhattan DFIO) organized by domain — logos and specific names outweigh generic "ERP experience"
- Career timeline with quantified impact — company, role, dates, and 2-3 outcomes with numbers per entry
- AI integrations showcase (2-3 case studies) — Problem / Approach / Outcome / Stack format; client name optional
- Contact form (Formspree) + email fallback — form preferred over bare email address
- LinkedIn and GitHub links — prominent; credibility anchors for this audience
- Dark modern responsive design — dark background, electric blue/green accent, tested at 375px / 768px / 1280px
- SEO meta tags targeting niche keywords ("Manhattan DFIO consultant", "D365 AI integration")

**Should have (competitive, add post-launch):**
- Social proof / testimonials — one quote from a past colleague or client outweighs a page of credentials
- Technology ecosystem visual / skills matrix — replaces undifferentiated skills list as complexity grows
- "Available for" positioning clarifier — add when analytics reveal whether consulting or FTE inquiries dominate
- Structured data / JSON-LD Person schema — enables Google rich results for "Borina Keo ERP consultant" searches

**Defer (v2+):**
- Blog / writing section — only if Borina commits to 4-6 posts per year; an empty blog actively hurts credibility
- Case study detail pages — full-page deep-dives; add only after 3+ complete case studies exist
- Video introduction — high production value required; defer until a professional recording opportunity exists

### Architecture Approach

The correct architecture for this site is a single `index.html` document with all sections inline, anchor navigation, and no routing. This keeps the build simple (one URL to rank for SEO), fast (no route transitions), and easy to maintain (one file for all content). The entire color system should be defined as CSS custom properties on `:root` — this is mandatory for a dark theme with an accent color, as it reduces a palette change to a single-file edit. Scroll-spy navigation (using `IntersectionObserver`) provides the "polished" feel without any JS framework. Animations use `IntersectionObserver` fade-in patterns — start invisible at `opacity: 0; transform: translateY(20px)`, animate to visible on viewport entry, fire once.

**Major components:**
1. `<nav>` (sticky) — anchor links to all section IDs; hamburger on mobile; active state via scroll-spy
2. `#hero` — name, specific title, one-liner positioning, professional photo, primary CTA button
3. `#about` + `#skills` — bio narrative (from LinkedIn) and named-system expertise organized by domain (ERP, WMS, AI/ML, Integration, Cloud)
4. `#experience` — career timeline; company / role / dates / 2-3 quantified outcomes per entry
5. `#projects` — AI integrations showcase; 2-3 case study cards with Problem/Approach/Outcome/Stack
6. `#contact` — Formspree form (3 fields max) + mailto fallback; LinkedIn and GitHub links
7. SEO layer — `<title>`, `<meta description>`, OpenGraph tags, and inline JSON-LD Person schema in `<head>`

Build order driven by dependencies: HTML skeleton + CSS custom properties first, then nav/hero (earliest design validation), then about/skills (LinkedIn content extraction), then experience timeline (content-heavy), then projects showcase, then contact form wiring, then JS (scroll-spy and animations), then SEO metadata (needs final URLs), then responsive polish.

### Critical Pitfalls

1. **Vague AI positioning reads as buzzword padding** — name the actual tools (Azure OpenAI, Copilot for D365, Power Automate), pair every AI claim with a measurable outcome ("reduced manual reconciliation by 40%"), and ensure no AI content could be copy-pasted unchanged onto a competitor's site. Fix this in the content writing phase before any design work.

2. **Dual-audience messaging serves neither audience** — lead with consulting/client-facing narrative in hero, about, and case studies. FTE openness should be accessible but not contaminate the primary pitch. Resolve the primary positioning statement and CTA hierarchy before wireframing.

3. **Missing enterprise-scale proof** — "led D365 migration" without context (users, facilities, transaction volume, team size) signals inexperience to Fortune 500 buyers. Every major project entry needs three data points: scale, role scope, and measurable outcome. Use anonymous framing when NDA prevents client names ("Fortune 500 3PL, 12 distribution centers").

4. **Dark theme executed poorly looks amateurish** — the difference between Stripe/Linear/Vercel dark and DeviantArt-era dark is contrast ratios, typography hierarchy, and accent color restraint. Enforce WCAG AA (4.5:1 body text), use the electric blue/green accent for CTAs and highlights only (not section backgrounds), and use font-weight 400-500 minimum on dark backgrounds.

5. **Contact form that silently drops submissions** — a static site with no form backend is the most common launch-day failure. Wire up Formspree before any other content goes live, complete the verification email, and test with a real end-to-end submission before launch. A single missed enterprise inquiry could represent a $50K+ engagement.

## Implications for Roadmap

Based on combined research, the build should flow through 4 phases: content/strategy, foundation, content sections, and polish/launch. Content decisions gate all design decisions, which gate all implementation decisions — this is the most important sequencing insight from the research.

### Phase 1: Content and Strategy
**Rationale:** The single highest-leverage activity is resolving positioning specificity and extracting quantified project content before touching code. Every downstream decision — headlines, section hierarchy, CTA copy, SEO keywords, JSON-LD schema — depends on having finalized content. Building beautiful components around vague content is the most expensive mistake this project can make.
**Delivers:** Finalized hero positioning statement; extracted bio from LinkedIn; 3-5 experience entries with scale data and quantified outcomes; 2-3 AI integration case studies in Problem/Approach/Outcome format; skills inventory organized by domain; primary CTA hierarchy decision (consulting-first or dual-audience)
**Addresses:** Hero section, About, Skills, Experience, Projects (FEATURES.md MVP list)
**Avoids:** Vague AI positioning (Pitfall 1), dual-audience confusion (Pitfall 2), missing enterprise proof (Pitfall 3), generic SEO keywords (Pitfall 8)

### Phase 2: Foundation and Design System
**Rationale:** CSS custom properties and the design system must exist before any section components are built. The dark theme color palette, typography scale, spacing system, and responsive breakpoints are consumed by every subsequent component — retroactively applying these is time-consuming and introduces inconsistency.
**Delivers:** HTML skeleton with SEO `<head>` (title, meta, OG tags, JSON-LD placeholder), CSS custom property system (colors, typography, spacing), base reset, font loading (Inter + JetBrains Mono via Google Fonts with preconnect), and the sticky nav component
**Uses:** Tailwind CSS v4.2 `@theme` variables, Astro BaseLayout component
**Implements:** CSS custom properties pattern, single-page anchor navigation architecture
**Avoids:** Dark theme credibility failure (Pitfall 4), inline styles anti-pattern (ARCHITECTURE.md Anti-Pattern 2)

### Phase 3: Content Sections
**Rationale:** Build sections in dependency order — hero first (earliest design validation), then about/skills (core LinkedIn content), then experience timeline (most content-heavy, benefits from seeing prior sections), then AI integrations showcase (references experience entries), then contact section (external Formspree dependency).
**Delivers:** All 7 sections of the single-page site: hero with headshot and CTA, about bio, skills by domain category, career timeline with quantified impact, AI integrations showcase with case study cards, contact form wired to Formspree, footer with LinkedIn/GitHub links
**Uses:** Astro component islands for Motion animations (`client:visible`), Formspree form endpoint, Astro `<Image>` component for optimized headshot
**Implements:** Scroll-triggered fade-in pattern, contact form integration, responsive layouts
**Avoids:** Photo without swap path (ARCHITECTURE.md Anti-Pattern 4), contact form going nowhere (Pitfall 6), mobile layout failures (Pitfall 7)

### Phase 4: Polish, SEO, and Launch
**Rationale:** JS (scroll-spy, animations), final SEO metadata, and responsive QA are last because they depend on all content and DOM elements existing. Performance optimization (image compression, Lighthouse audit) must pass before launch given the credibility contradiction of a slow site for a technology consultant.
**Delivers:** Scroll-spy nav highlighting, `main.js` wiring, finalized JSON-LD Person schema with real URLs, Open Graph image (1200x630px), Lighthouse Performance score 90+, LCP under 2.5s on mobile simulation, responsive verification at 375px/390px/768px/1440px, favicon, custom 404 page, Formspree end-to-end test
**Uses:** `@astrojs/sitemap` (auto-generates sitemap.xml), `@astrojs/vercel` adapter, Vercel Web Analytics
**Avoids:** Slow load (Pitfall 5), missing OG image (ARCHITECTURE.md Anti-Pattern 3), "looks done but isn't" launch failures (PITFALLS.md checklist)

### Phase Ordering Rationale

- Content before design because positioning specificity is a content problem, not a design problem — naming Azure OpenAI vs. generic "AI" cannot be resolved in Figma
- Design system before sections because CSS custom properties are consumed by all components; retroactive theming is expensive
- Contact form wired early in Phase 3 (not last) because a missed inquiry cannot be recovered; build the Formspree integration the same session as building the contact section
- JS last because scroll-spy and animation observers depend on all DOM elements existing — adding JS before sections are built creates order-dependent bugs
- Mobile polish last but not optional — verified breakpoints (375px, 390px, 768px) are a launch requirement, not a v2 concern

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Content/Strategy):** Keyword research for "Manhattan DFIO consultant" and "D365 AI integration" search volume should be verified with a live SEO tool (Ahrefs, Google Search Console) once the site is live; the niche keyword recommendations are based on training knowledge, not verified search volume data
- **Phase 3 (Contact Form):** Verify Formspree free tier (50 submissions/month) is sufficient or switch to Web3Forms (250/month free); pricing should be confirmed at formspree.io before wiring

Phases with standard patterns (can proceed without additional research):
- **Phase 2 (Foundation):** Static site foundation with Tailwind + Astro is extremely well-documented; no novel patterns required
- **Phase 4 (Polish/Launch):** Lighthouse audit, OG image verification, and responsive QA are standard launch checklists with well-established tooling

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Tailwind v4.2 and Vercel/Astro integration verified via official docs; Astro 5.x and Motion 11.x based on training data through August 2025 — verify current versions at docs.astro.build and npmjs.com before starting |
| Features | MEDIUM | Web search unavailable; B2B consultant UX patterns based on training knowledge; core recommendations (specificity, case studies, named systems) are stable principles regardless of current trends |
| Architecture | HIGH | Static single-page portfolio architecture is an extremely well-established, stable domain; CSS custom properties, IntersectionObserver, and anchor navigation patterns are W3C standards with 97%+ browser support |
| Pitfalls | MEDIUM | Enterprise buyer psychology and B2B UX patterns are well-established; dark theme contrast requirements are WCAG standards (HIGH confidence); specific pitfall framing based on training knowledge |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Astro 5.x exact version and API:** Verify at docs.astro.build before scaffolding — Content Collections API and Image component APIs may have changed from training data
- **Motion 11.x Astro island integration:** Verify `motion/react` import pattern works with current Astro islands (`client:visible`) at npmjs.com/package/motion — the integration pattern is sound but API surface should be confirmed
- **Formspree free tier limits:** Verify 50 submissions/month is sufficient; if consulting inquiries scale, Web3Forms (250/month free) is the documented alternative
- **Niche keyword search volume:** The specific keyword recommendations ("Manhattan DFIO implementation consultant," "AS400 to D365 migration") are directionally correct but actual search volume is unverified — validate with Google Search Console after launch
- **Borina's actual LinkedIn content:** Research assumed content exists on LinkedIn; actual extraction of bio, experience entries with quantifiable outcomes, and case study material is the first and most important step before any build work

## Sources

### Primary (HIGH confidence)
- Vercel official docs (`/docs/frameworks/astro`) — Astro/Vercel adapter integration, static rendering configuration
- Tailwind CSS official homepage (tailwindcss.com) — v4.2 verified current version, `@theme` variables, dark mode, production bundle size
- WCAG 2.1 contrast minimum standard — 4.5:1 body text, 3:1 large text requirements
- Google Core Web Vitals (web.dev/vitals) — LCP 2.5s "good" threshold
- schema.org/Person — stable structured data specification

### Secondary (MEDIUM confidence)
- Astro docs (docs.astro.build) — access blocked during research; Astro 5.x features based on training data through August 2025
- B2B consultant site conversion patterns — training knowledge of professional services UX; enterprise buyer behavior
- Formspree documentation (formspree.io/docs) — free tier limits based on training data; verify current pricing

### Tertiary (LOW confidence)
- Motion 11.x (motion.dev) — version and Astro island integration pattern based on training data; verify at npmjs.com/package/motion
- Web3Forms (web3forms.com) — 250/month free tier based on training data; verify current offer
- Niche ERP/AI keyword search volume — directional recommendations only; no live SEO data available during research session

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
