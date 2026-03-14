# Feature Research

**Domain:** Professional resume/portfolio website — senior B2B technology consultant (ERP/WMS/AI integration)
**Researched:** 2026-03-14
**Confidence:** MEDIUM (web search unavailable; based on training knowledge of B2B consultant sites, conversion UX patterns, and enterprise buyer behavior through August 2025)

---

## Feature Landscape

### Table Stakes (Visitors Expect These)

Features enterprise decision-makers and hiring managers assume exist. Missing these = site feels unprofessional, visitor leaves.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero section — name, title, one-liner value prop | First impression; enterprise buyers skim before deciding to scroll | LOW | "Leader in AI-enhanced ERP/WMS transformation" must be clear within 3 seconds; avoid jargon-heavy openers |
| Professional headshot | Trust signal; B2B buyers buy from people, not credentials | LOW | LinkedIn photo works as placeholder; high-res swap slot must be easy |
| Clear contact CTA | Visitors convert to leads only if the action is obvious | LOW | Button above the fold AND at the bottom; "Let's Talk" > "Contact" for consulting posture |
| Professional bio / About section | Buyers want context: who is this person, why should I trust them | MEDIUM | 2–3 paragraph narrative > bullet-point bio; include years of experience, systems expertise, and a human angle |
| Skills / Expertise section | Enterprise buyers scan for specific system competency (D365, Manhattan DFIO) | LOW | Logos + named systems carry more weight than generic "ERP consultant" text |
| Career timeline / Experience section | Validates seniority and scope of past work; replaces a resume PDF | MEDIUM | Company names, project scale (users impacted, $ saved), duration — not just job titles |
| LinkedIn profile link | Standard professional credibility signal; buyers verify there | LOW | Prominent placement; open in new tab |
| Mobile responsive layout | 40%+ of cold outreach response clicks happen on mobile | MEDIUM | Dark themes require extra care on mobile contrast and tap targets |
| Contact form or email link | Converts passive interest into active inquiry | LOW–MEDIUM | Form preferred over bare email address (spam reduction, structured inquiry) |
| Fast page load / performance | Enterprise users on corporate networks; slow load = bounced session | MEDIUM | Static site eliminates most risk; images must be optimized |

### Differentiators (Competitive Advantage)

Features that distinguish Borina from the hundreds of generic "ERP consultant" LinkedIn profiles and basic resume sites. These are where the site wins or loses against other candidates in the same meeting.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI integration case studies — project-level narrative | Enterprise buyers need to see evidence, not just claims; "Led AI integration" is table stakes at senior level; a specific story (what system, what AI capability, what outcome) is rare and memorable | HIGH | 2–3 case studies minimum; structure: Problem → Approach → Outcome → Stack used; omit client names if NDA required |
| Quantified impact metrics embedded in experience | "$X saved," "Y% reduction in fulfillment errors," "Z warehouses migrated" — numbers make seniority legible to buyers who don't know ERP | MEDIUM | Pull from LinkedIn bullets but rewrite as narrative impact; numbers should be defensible |
| Specific system name-drops with proof | "Manhattan DFIO" and "Microsoft Dynamics 365" named prominently signals deep domain knowledge vs. generic ERP familiarity; logos if licensed | LOW | Many consultants say "WMS experience"; naming Manhattan DFIO specifically signals tier-1 implementation depth |
| AI-in-ERP positioning statement | The intersection of AI and legacy ERP/WMS is an emerging, undersupplied specialty in 2026; owning this label clearly is a differentiator | LOW | One strong header/subheader: "Integrating AI into Microsoft D365 and Manhattan DFIO" beats a long bio at communicating specialty |
| GitHub profile link with relevant repos | Signals technical credibility beyond PowerPoint decks; AI integration work may have code artifacts | LOW | Link to github.com/Bmee007; even partial repos or READMEs add credibility with technical hiring managers |
| Technology ecosystem visual (skills cloud or matrix) | Gives buyers a fast scannable map of the full tech stack: ERP, WMS, AI tools, cloud platforms, integration middleware | MEDIUM | Categorized by domain beats an undifferentiated list of 30 skills |
| "Available for" explicit positioning | Removes ambiguity for both consulting buyers and FTE hiring managers; visitors self-qualify | LOW | "Open to: Enterprise consulting engagements / Senior leadership roles" — honest and specific reduces wasted inquiry |
| Social proof signals | Testimonials or notable client logos signal that others with budget have trusted this person | HIGH | If NDA prevents specifics, even "worked with Fortune 500 3PLs" or a testimonial from a former colleague carries weight; optional but high-value |
| Dark, tech-forward visual design | Signals AI-native identity; stands out against the sea of white Bootstrap templates used by traditional ERP consultants | LOW–MEDIUM | Dark background with electric blue/green accent is already specified; execution must be clean, not "gamer aesthetic" |

### Anti-Features (Deliberately Excluded from v1)

Features that seem appealing but create problems disproportionate to their value for this specific site and audience.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Blog / content publishing | "Thought leadership" sounds good; some consultants build audiences via writing | Adds CMS complexity, requires ongoing content production, and delays launch indefinitely; an empty blog is worse than no blog | If content matters later, add a "Writing" section linking to LinkedIn articles or external publications — no backend needed |
| Real-time contact form with backend | "Professional" contact UX | Requires server or serverless function, introduces maintenance burden, exposes spam risk; static site has no backend by design | Formspree, Netlify Forms, or similar form services handle this without a backend; or a mailto: link is sufficient for v1 |
| Authentication / admin panel | "Easier content updates" | Massive complexity for a static personal site; overkill when content changes rarely | Hardcode content for v1; if updates become frequent, migrate to a headless CMS (Contentful, Sanity) later |
| Portfolio PDF download (resume as PDF) | "Some employers prefer PDF" | PDFs go stale; creates dual-maintenance problem; SEO value lost | Link directly to LinkedIn, which stays current; offer "request resume via contact form" if needed |
| Dark/light mode toggle | "Accessibility and preference" | Complicates CSS architecture significantly; dark mode is intentional brand signal, not just a preference | Ensure dark theme passes WCAG contrast ratios; one well-executed dark theme beats a poorly executed toggle |
| Animated loading screens / splash screens | "Premium feel" | Delays access to content; reduces conversion; enterprise buyers on slow corporate proxies abandon immediately | Subtle entrance animations on scroll (e.g., fade-in sections) achieve visual polish without blocking content |
| Client portal / gated resources | "Value-add for clients" | Wrong audience for a lead-generation site; gating content reduces indexability and first-touch trust | All content public for v1; consulting resources belong in a separate client engagement tool, not a personal website |
| Live chat widget | "Immediate engagement" | Adds third-party JS weight; requires active monitoring to be useful; abandoned chat windows signal neglect | A prominent "Email me directly" CTA with a response time commitment ("I respond within 24 hours") outperforms idle chat |

---

## Feature Dependencies

```
Hero section (name + title + CTA)
    └──requires──> Professional headshot (credibility anchor for hero)
    └──requires──> Contact CTA destination (form or email)

Case studies / AI integration showcase
    └──requires──> Project experience content (from career history)
    └──requires──> Impact metrics (quantified outcomes)

Skills / expertise section
    └──enhances──> Career timeline (cross-references technology used per role)

GitHub link
    └──enhances──> AI integration showcase (links to code artifacts if available)

Contact form
    └──requires──> Form backend or third-party service (Formspree / Netlify Forms)
    └──conflicts──> Backend-free static site constraint (must use external form service)

Social proof / testimonials
    └──requires──> Permission from referenced individuals or clients
    └──enhances──> Case studies (testimonials tied to specific projects)

SEO metadata
    └──enhances──> All content sections (titles, descriptions, structured data)
    └──requires──> Finalized copy (can't optimize before content exists)
```

### Dependency Notes

- **Hero requires headshot:** A hero with placeholder gray box reads as unfinished to B2B buyers; LinkedIn photo should be baked in from day one, not deferred.
- **Case studies require metrics:** A case study without outcomes reads as a job description. Quantified results are what separate consulting portfolio entries from resume bullets.
- **Contact form conflicts with pure static:** The site is static, so a form requires an external service. This is a solved problem (Formspree free tier, Netlify Forms) but must be decided before implementation.
- **SEO requires finalized copy:** SEO title tags, meta descriptions, and structured data should be written after section copy is finalized, not retrofitted.

---

## MVP Definition

### Launch With (v1)

Minimum needed to credibly represent Borina to enterprise buyers and trigger inbound inquiries.

- [ ] Hero section — name, title ("ERP/WMS & AI Integration Leader"), one-liner positioning, and CTA button
- [ ] Professional headshot — LinkedIn photo placeholder with easy swap mechanism
- [ ] About / bio section — 2–3 paragraph narrative from LinkedIn, human + professional voice
- [ ] Skills & expertise section — named systems (D365, Manhattan DFIO, AI tools) organized by category
- [ ] Career timeline — 3–5 roles with company, title, dates, and 2–3 quantified impact bullets each
- [ ] AI integrations showcase — 2–3 project/case study entries with Problem/Approach/Outcome structure
- [ ] Contact section — form (Formspree or similar) + email address fallback
- [ ] LinkedIn and GitHub links — in header/nav and footer
- [ ] Dark, modern design — dark background, electric blue/green accent, responsive
- [ ] SEO meta tags — page title, description, keywords targeting "ERP AI integration consultant"
- [ ] Mobile responsive — tested at 375px, 768px, 1280px breakpoints

### Add After Validation (v1.x)

Add once the site is live and gathering real visitor behavior.

- [ ] Social proof / testimonials section — add when 1–2 willing recommenders are identified; triggers when first inbound inquiries ask for references
- [ ] Technology ecosystem visual / skills matrix — add when skills list grows unwieldy or analytics show visitors bouncing on skills section
- [ ] "Available for" positioning clarifier — add when it becomes clear whether consulting vs. FTE inquiries dominate
- [ ] Structured data / JSON-LD for Person schema — add to improve LinkedIn/Google search appearance; low effort, high SEO return
- [ ] Analytics (privacy-respecting, e.g., Plausible or Fathom) — add to understand which sections drive contact clicks

### Future Consideration (v2+)

Defer until v1 has demonstrated lead generation value and content cadence is established.

- [ ] Blog / writing section — only if Borina commits to publishing at least 4–6 pieces per year; empty blog hurts credibility
- [ ] Case study detail pages — full-page deep-dives on individual projects; adds navigational complexity; defer until 3+ complete case studies exist
- [ ] Video introduction — 60–90 second "why hire me" video; high production value required to not backfire; defer until professional recording opportunity exists
- [ ] Speaking / appearances section — if Borina speaks at SAP, Microsoft, or WMS/logistics conferences; adds credibility but requires content to exist first
- [ ] CMS integration (Contentful, Sanity) — only if content update frequency justifies the complexity; v1 static hardcode is sufficient for a site updated quarterly

---

## Feature Prioritization Matrix

| Feature | Visitor Value | Implementation Cost | Priority |
|---------|--------------|---------------------|----------|
| Hero section with positioning + CTA | HIGH | LOW | P1 |
| Professional headshot | HIGH | LOW | P1 |
| Career timeline with quantified impact | HIGH | MEDIUM | P1 |
| AI integration case studies | HIGH | HIGH | P1 |
| Skills section (named systems) | HIGH | LOW | P1 |
| Contact form | HIGH | LOW | P1 |
| About / bio narrative | HIGH | LOW | P1 |
| Dark modern design + responsive | HIGH | MEDIUM | P1 |
| LinkedIn + GitHub links | MEDIUM | LOW | P1 |
| SEO meta tags | MEDIUM | LOW | P1 |
| Social proof / testimonials | HIGH | HIGH | P2 |
| Technology ecosystem visual | MEDIUM | MEDIUM | P2 |
| "Available for" positioning | MEDIUM | LOW | P2 |
| Analytics | MEDIUM | LOW | P2 |
| Structured data / JSON-LD | LOW | LOW | P2 |
| Case study detail pages | MEDIUM | HIGH | P3 |
| Blog / writing section | LOW | HIGH | P3 |
| Video introduction | MEDIUM | HIGH | P3 |
| Speaking section | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor / Comparable Profile Analysis

Note: Direct competitor URLs not verifiable without web access. Analysis draws from training knowledge of ERP consultant personal sites and enterprise technology leader portfolios observed through August 2025.

| Section/Feature | Typical ERP Consultant Site | Typical Digital Transformation Leader Site | Recommended Approach for Borina |
|---|---|---|---|
| Hero | Generic title ("ERP Consultant"), stock photo | Bold positioning statement, professional photo | Specific niche + AI angle: "Integrating AI into Microsoft D365 & Manhattan DFIO" |
| Experience | Chronological resume dump | Executive narrative with business outcomes | Timeline with quantified outcomes + named systems |
| Skills | Long undifferentiated list | Category-organized with depth indicators | Grouped by domain: ERP, WMS, AI/ML, Integration, Cloud |
| Case studies | Often missing entirely | Often present but vague (NDA constraints) | 2–3 entries with Problem/Approach/Outcome; omit client name if needed |
| Design | White Bootstrap template, 2015 aesthetic | Clean, modern; often agency-quality | Dark + electric accent; signals AI-native identity |
| Social proof | LinkedIn recommendations linked | Logos of past employers/clients | Testimonial quotes (with permission) + "worked with" employer list |
| CTA | "Download my resume" | "Schedule a consultation" | "Let's Talk" — positions as peer-level engagement, not job application |

### Profiles in Similar Domain (Training Knowledge, MEDIUM confidence)

**ERP/Digital Transformation consultant personal sites that follow high-converting patterns:**
- Consultants who win enterprise work typically have: named client logos (or "Fortune 500" language when NDA prevents specifics), 2–4 detailed case studies with business outcomes, explicit specialization (not "full-stack ERP"), and a professional photo that signals executive presence
- Sites that underperform: generic titles ("IT Consultant"), no case studies, PDF resume as primary artifact, no clear CTA, generic white template

**AI integration specialist positioning (emerging pattern as of 2025):**
- Leading consultants in the AI+ERP intersection are positioning around specific platforms (Copilot for D365, AI Builder in Power Platform, warehouse AI for WMS) rather than generic "AI experience"
- The word "implementation" in the title signals executional credibility vs. "strategy" which signals advisory-only
- GitHub presence for AI integration work carries increasing weight as buyers want to see that the consultant can work alongside engineering teams, not just manage vendors

---

## Conversion Patterns for B2B Consultant Sites

These are patterns from conversion research on professional services and B2B consultant sites, applicable to Borina's positioning.

**What drives the contact click:**
1. Specificity — "I do exactly what you need" reads in seconds via named systems and clear niche
2. Evidence — one real case study outweighs ten years of experience claims
3. Accessibility — CTA must appear within the first viewport AND at the end of the page; two touchpoints minimum
4. Trust signals — professional photo, LinkedIn link, named employers/clients, years of experience (explicit)
5. Low friction — contact form asks 3 questions maximum (name, company, inquiry type); more fields = more abandonment

**What kills the conversion:**
- Vague value propositions ("I help companies transform their operations")
- Missing photo or clearly stock photo
- Contact method buried in footer or "Contact" page click required
- Slow load (>3 seconds on desktop; enterprise proxies make this worse)
- Overwhelming walls of text in experience section
- Skills section that looks like a keyword-stuffed resume

---

## Sources

- Training knowledge: professional portfolio and B2B consultant site conversion patterns (through August 2025) — MEDIUM confidence; web verification unavailable in this session
- Project context: `/Users/mylinh/projects/resume-website/.planning/PROJECT.md` — scope and constraints
- Domain: ERP consultant market positioning patterns, Manhattan Associates DFIO customer profiles, Microsoft Dynamics 365 ecosystem consultant landscape
- Conversion UX: professional services website conversion research, B2B buyer behavior patterns for technology consulting engagements

**Confidence note:** Web search and WebFetch were not available during this research session. All findings reflect training knowledge. Key claims to verify with a live web search when possible:
- Current SEO keyword volume for "ERP AI integration consultant" and related terms
- Whether any high-profile ERP/AI consultants have notable personal sites that should be studied as direct references
- Current state of Manhattan Associates DFIO ecosystem (consultant community, job market keywords)

---

*Feature research for: Senior B2B technology consultant portfolio — ERP/WMS/AI integration*
*Researched: 2026-03-14*
