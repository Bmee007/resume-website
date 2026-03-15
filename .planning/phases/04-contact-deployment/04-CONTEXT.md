# Phase 4: Contact & Deployment - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a contact form section at the bottom of the page — visitors can reach Borina via a 3-field Formspree-powered form, and LinkedIn/GitHub profile links are accessible from this section. Deployment verification (confirming the live Vercel URL renders the completed site) is in scope. No new layout sections, no backend, no authentication.

</domain>

<decisions>
## Implementation Decisions

### Section Layout
- Centered narrow column layout (~600px max-width) — form centered on page, matching linear/vercel contact page feel
- Section heading + tagline only above the form — no intro paragraph, no extra copy
- The 3-field form (Name, Email, Message) sits inside a single liquid-glass card — consistent with skill cards and project cards
- Submit button: full-width emerald pill button using existing `btn-hero` / `btn-hero-primary` style — same as the Hero CTA

### Form Feedback States
- **Success state:** Form fades out and is replaced by a success message inside the card — form is not accessible again after submission (prevents re-submit)
- **Success message copy:** "Message sent. I'll be in touch soon." — professional/direct, no name interpolation
- **Error state:** Red border on the invalid field + small error text below it (e.g. "Please enter a valid email")
- **Validation trigger:** On submit only — no on-blur or real-time validation; simple 3-field form doesn't need it

### Social Links
- Small icon-only links, same treatment as HeroSection social icons (`.social-icon-link` pattern) — low visual weight, consistent
- Position: below the form card, centered horizontally — clear separation from the form
- URLs: same as HeroSection — LinkedIn: `linkedin.com/in/borinakeo` | GitHub: `github.com/Bmee007`

### Section Heading & Copy
- Section heading: **"Get In Touch"** — universal, works for both consulting leads and hiring managers
- Section tagline: **"Open to consulting engagements and full-time opportunities"** — directly signals both paths from PROJECT.md
- Submit button label: **"Send Message"**
- Field style: placeholder text inside fields (e.g. "Your name", "your@email.com", "What can I help you with?") — no floating labels

### Claude's Discretion
- Exact CSS transition timing for the form→success fade swap
- Input field focus ring color (presumed emerald, matching the rest of the accent system)
- Loading/spinner state while Formspree request is in-flight (if any)
- Exact error message copy per field (e.g. "Name is required" vs "Please enter your name")
- Footer below the contact section — if present, keep it minimal (copyright line only)

</decisions>

<specifics>
## Specific Ideas

- The form card should feel like a natural continuation of the liquid-glass cards used in Skills and Projects — same backdrop-filter, gradient border, dark surface
- Social icons below the form echo the hero social links — the page opens and closes with the same icon treatment, bookending the experience
- "Message sent. I'll be in touch soon." is the entire success message — no emoji, no effusive thank-you language, consistent with the professional tone of the rest of the site

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.liquid-glass` (global.css): backdrop-filter glass card with gradient border — use as wrapper for the contact form
- `.btn-hero` / `.btn-hero-primary` (HeroSection.astro scoped styles or global): full-width emerald pill CTA — reuse for Submit button
- `.social-icon-link` (HeroSection.astro scoped styles): icon link with dim-by-default, emerald-on-hover treatment — reuse directly for contact section social icons
- HSL design tokens (`--primary`, `--background`, `--border-hsl`, `--secondary`): all new elements use these

### Established Patterns
- Section header structure: `<h2>` title + `<p class="*-tagline">` subheadline — match ExperienceSection and ProjectsSection
- Scoped `<style>` blocks in Astro components — new ContactSection.astro follows same pattern
- Geist Sans for all typography
- Emerald glow on hover: `box-shadow: 0 0 12px rgba(16,185,129,0.35)` — apply to submit button hover and input focus states

### Integration Points
- `index.astro` already has `<section id="contact">` stub — Phase 4 replaces it with `<ContactSection />` component import
- Nav already links to `#contact` — no nav changes needed
- Formspree endpoint URL needed: `https://formspree.io/f/{formId}` — Formspree form must be created and ID inserted before this is functional (placeholder ID acceptable for initial build)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-contact-deployment*
*Context gathered: 2026-03-15*
