# Phase 4: Contact & Deployment - Research

**Researched:** 2026-03-15
**Domain:** Formspree AJAX submission, Astro client-side JavaScript, CSS form feedback states
**Confidence:** HIGH

## Summary

Phase 4 is a focused integration phase: build one Astro component (`ContactSection.astro`), wire a Formspree AJAX form, and replace the placeholder stub in `index.astro`. All design decisions are locked in CONTEXT.md. The technical complexity lies entirely in the client-side JavaScript that intercepts form submission, calls the Formspree endpoint via `fetch`, and swaps the form for a success message — all without any page reload.

Formspree free tier supports AJAX submission using `fetch` with `Accept: application/json`. The response is `{ ok: true }` on success or `{ errors: [{ message: "..." }] }` on failure. The 50 submissions/month free limit is adequate for a portfolio contact form. No backend, no Node adapter, no Astro actions — this is a static Astro page with a `<script>` block.

The project already has every reusable asset needed: `.liquid-glass`, `.btn-hero`, `.social-icon-link`, and the HSL design token system. The component follows the same pattern as `ExperienceSection.astro` and `ProjectsSection.astro`.

**Primary recommendation:** Build a pure Astro component with a native `<script>` block for form submission — no React island, no external form library needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Section Layout**
- Centered narrow column layout (~600px max-width) — form centered on page, matching linear/vercel contact page feel
- Section heading + tagline only above the form — no intro paragraph, no extra copy
- The 3-field form (Name, Email, Message) sits inside a single liquid-glass card — consistent with skill cards and project cards
- Submit button: full-width emerald pill button using existing `btn-hero` / `btn-hero-primary` style — same as the Hero CTA

**Form Feedback States**
- Success state: Form fades out and is replaced by a success message inside the card — form is not accessible again after submission (prevents re-submit)
- Success message copy: "Message sent. I'll be in touch soon." — professional/direct, no name interpolation
- Error state: Red border on the invalid field + small error text below it (e.g. "Please enter a valid email")
- Validation trigger: On submit only — no on-blur or real-time validation; simple 3-field form doesn't need it

**Social Links**
- Small icon-only links, same treatment as HeroSection social icons (`.social-icon-link` pattern) — low visual weight, consistent
- Position: below the form card, centered horizontally — clear separation from the form
- URLs: same as HeroSection — LinkedIn: `linkedin.com/in/borinakeo` | GitHub: `github.com/Bmee007`

**Section Heading & Copy**
- Section heading: "Get In Touch"
- Section tagline: "Open to consulting engagements and full-time opportunities"
- Submit button label: "Send Message"
- Field style: placeholder text inside fields (e.g. "Your name", "your@email.com", "What can I help you with?") — no floating labels

### Claude's Discretion
- Exact CSS transition timing for the form→success fade swap
- Input field focus ring color (presumed emerald, matching the rest of the accent system)
- Loading/spinner state while Formspree request is in-flight (if any)
- Exact error message copy per field (e.g. "Name is required" vs "Please enter your name")
- Footer below the contact section — if present, keep it minimal (copyright line only)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Contact / inquiry section at bottom of page | Section wired into index.astro replacing placeholder stub at `#contact` |
| CONT-02 | Contact form with 3 fields maximum: Name, Email, Message | Native HTML form with `name`, `email`, `message` fields; no additional fields |
| CONT-03 | Form submission handled via Formspree (no backend required) | fetch POST to `https://formspree.io/f/{formId}` with `Accept: application/json` |
| CONT-04 | Success/error state shown after form submission | `response.ok` → fade form out, show success card; else → red border + error text per field |
| CONT-05 | LinkedIn profile link in contact section | `<a href="https://linkedin.com/in/borinakeo">` with `.social-icon-link` class |
| CONT-06 | GitHub profile link in contact section | `<a href="https://github.com/Bmee007">` with `.social-icon-link` class |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro (existing) | 6.x (in package.json as `^6.0.4`) | Component framework | Already installed; static output, scoped styles |
| Formspree | Free tier, no install | Form backend | Locked decision; zero backend, delivers to email |
| Native `fetch` | Browser built-in | AJAX submission | No dependency needed; works in all modern browsers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| HTML5 constraint API | Browser built-in | Client-side pre-validation | `required`, `type="email"`, `minlength` attributes on inputs before fetch fires |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<script>` in Astro | `@formspree/react` + React island | React island adds ~40KB hydration overhead; not needed for one static form |
| Native `<script>` in Astro | Astro Actions | Requires server-side rendering; project is configured for static output |
| Formspree | Web3Forms (250/month free) | CONTEXT.md locks Formspree; Web3Forms alternative is out of scope |

**Installation:** No new packages needed. Formspree is a hosted service accessed via `fetch`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── ContactSection.astro    # new — contact form + social links
├── pages/
│   └── index.astro             # replace placeholder with <ContactSection />
└── styles/
    └── global.css              # existing — .liquid-glass, .btn-hero already defined
tests/
└── phase4.spec.ts              # new — Wave 0 smoke tests for CONT-01 through CONT-06
```

### Pattern 1: Astro Component with Inline Script

**What:** An `.astro` component that declares the HTML markup in the template, scoped CSS in `<style>`, and imperative DOM logic in `<script>`. The `<script>` block is bundled as a module and runs on the client.

**When to use:** Any interactive behavior on a static Astro page where you don't need a framework (React/Vue). This is the established project pattern (ExperienceSection, ProjectsSection use scoped styles; ContactSection adds a `<script>` block for the first time).

**Example:**
```astro
---
// ContactSection.astro — no frontmatter imports needed
---

<section id="contact" class="contact-root">
  <div class="contact-inner">

    <h2 class="contact-heading">Get In Touch</h2>
    <p class="contact-tagline">Open to consulting engagements and full-time opportunities</p>

    <div class="contact-card liquid-glass" id="contact-card">

      <form id="contact-form" novalidate>
        <div class="field-group">
          <input
            id="cf-name"
            name="name"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            required
          />
          <span class="field-error" id="error-name" aria-live="polite"></span>
        </div>

        <div class="field-group">
          <input
            id="cf-email"
            name="email"
            type="email"
            placeholder="your@email.com"
            autocomplete="email"
            required
          />
          <span class="field-error" id="error-email" aria-live="polite"></span>
        </div>

        <div class="field-group">
          <textarea
            id="cf-message"
            name="message"
            placeholder="What can I help you with?"
            rows="5"
            required
          ></textarea>
          <span class="field-error" id="error-message" aria-live="polite"></span>
        </div>

        <button type="submit" class="btn-hero rounded-full contact-submit">
          Send Message
        </button>
      </form>

      <div class="contact-success" id="contact-success" hidden>
        <p>Message sent. I'll be in touch soon.</p>
      </div>

    </div>

    <div class="contact-social">
      <a href="https://linkedin.com/in/borinakeo" target="_blank" rel="noopener noreferrer"
         aria-label="LinkedIn profile" class="social-icon-link">
        <!-- LinkedIn SVG (same as HeroSection) -->
      </a>
      <a href="https://github.com/Bmee007" target="_blank" rel="noopener noreferrer"
         aria-label="GitHub profile" class="social-icon-link">
        <!-- GitHub SVG (same as HeroSection) -->
      </a>
    </div>

  </div>
</section>
```

### Pattern 2: Formspree AJAX Submission Script

**What:** A `<script>` block inside the Astro component that intercepts form submit, validates fields, POSTs to Formspree, and swaps UI state.

**When to use:** The only submission handler for this form. Runs once on page load as a module.

```typescript
// Source: https://help.formspree.io/hc/en-us/articles/360013470814
// Inside <script> in ContactSection.astro

const FORMSPREE_ID = "YOUR_FORM_ID"; // replace with actual ID

const form = document.getElementById("contact-form") as HTMLFormElement;
const successPanel = document.getElementById("contact-success") as HTMLElement;

// Field refs
const nameInput = document.getElementById("cf-name") as HTMLInputElement;
const emailInput = document.getElementById("cf-email") as HTMLInputElement;
const messageInput = document.getElementById("cf-message") as HTMLTextAreaElement;

function setFieldError(inputEl: HTMLElement, errorId: string, msg: string) {
  inputEl.classList.toggle("is-invalid", !!msg);
  const errorEl = document.getElementById(errorId)!;
  errorEl.textContent = msg;
}

function clearErrors() {
  [nameInput, emailInput, messageInput].forEach(el => el.classList.remove("is-invalid"));
  ["error-name", "error-email", "error-message"].forEach(id => {
    document.getElementById(id)!.textContent = "";
  });
}

function clientValidate(): boolean {
  let valid = true;
  if (!nameInput.value.trim()) {
    setFieldError(nameInput, "error-name", "Name is required");
    valid = false;
  }
  if (!emailInput.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
    setFieldError(emailInput, "error-email", "Please enter a valid email");
    valid = false;
  }
  if (!messageInput.value.trim()) {
    setFieldError(messageInput, "error-message", "Message is required");
    valid = false;
  }
  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  if (!clientValidate()) return;

  const submitBtn = form.querySelector("button[type=submit]") as HTMLButtonElement;
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  const data = new FormData(form);

  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      // Fade form out, show success panel
      form.style.opacity = "0";
      form.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        form.hidden = true;
        successPanel.hidden = false;
        successPanel.style.opacity = "0";
        successPanel.style.transition = "opacity 0.3s ease";
        requestAnimationFrame(() => { successPanel.style.opacity = "1"; });
      }, 300);
    } else {
      const json = await response.json() as { errors?: { message: string }[] };
      if (json.errors?.length) {
        // Map Formspree server-side errors back to fields if possible
        json.errors.forEach(err => {
          setFieldError(emailInput, "error-email", err.message);
        });
      } else {
        setFieldError(emailInput, "error-email", "Submission failed. Please try again.");
      }
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  } catch {
    setFieldError(messageInput, "error-message", "Network error. Please try again.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";
  }
});
```

### Pattern 3: z-index Safety for liquid-glass Cards

**What:** All previous liquid-glass components in this project require `z-index: 1` on inner content containers because `.liquid-glass::before` is `position: absolute; z-index: 0` and will paint over content without this fix.

**When to use:** Every element inside the contact card that must be visible (form fields, buttons, success message).

```css
/* Scoped in ContactSection.astro <style> */
.contact-card {
  position: relative;
  border-radius: 1rem;
  padding: 2.5rem;
}

/* Critical: must be > 0 to render above .liquid-glass::before pseudo-element */
#contact-form,
.contact-success {
  position: relative;
  z-index: 1;
}
```

### Anti-Patterns to Avoid
- **Floating labels:** Locked out by CONTEXT.md — use placeholder text only.
- **On-blur validation:** Locked out — validate on submit only.
- **React island for the form:** Adds framework overhead for no benefit in a static site.
- **Omitting `novalidate` from `<form>`:** Without `novalidate`, browser native validation fires before the JS handler and shows inconsistent OS-native UI instead of the custom error display.
- **Omitting `z-index: 1`:** Every prior liquid-glass component in this project has hit the "content hidden behind pseudo-element" bug. This will happen to form fields and the submit button if not addressed.
- **Using `type="submit"` input instead of `<button>`:** `<button>` is easier to style full-width as a pill and easier to target for disable state.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Custom SMTP / serverless function | Formspree (locked decision) | Spam filtering, deliverability, unsubscribe handling are all handled by Formspree |
| Client-side email regex | Custom validator | HTML `type="email"` + simple regex fallback | HTML5 constraint API covers 99% of cases; the fallback handles browsers that don't validate `type="email"` |
| Rate limiting | Custom throttle | Formspree free tier (50/month) is the natural rate limiter for a portfolio site | N/A |

**Key insight:** Formspree's value is email deliverability and spam protection — both are non-trivial to replicate correctly.

---

## Common Pitfalls

### Pitfall 1: `z-index` Invisible Content Inside Liquid-Glass
**What goes wrong:** Form fields, submit button, and success message render invisibly behind the `.liquid-glass::before` pseudo-element.
**Why it happens:** `.liquid-glass::before` is `position: absolute; z-index: 0`. Any sibling content without an explicit stacking context is painted below it. This exact bug was hit in ExperienceSection (decision log: "entry-inner z-index:1 mandatory") and SkillsSection ("skill-card-inner z-index:1 required").
**How to avoid:** Set `position: relative; z-index: 1` on the `<form>` and `#contact-success` elements.
**Warning signs:** Form fields are not clickable or appear blank; submit button appears visually absent.

### Pitfall 2: Formspree CORS Error Without `Accept: application/json`
**What goes wrong:** Fetch POST returns a redirect response or CORS error instead of JSON.
**Why it happens:** Without `Accept: application/json`, Formspree returns a 302 redirect to their "thank you" page. The browser follows the redirect and the `fetch` response cannot be inspected.
**How to avoid:** Always include `headers: { Accept: "application/json" }` in the fetch call.
**Warning signs:** `response.ok` is false even on valid submissions; network tab shows a 302 redirect.

### Pitfall 3: Formspree Form Not Activated
**What goes wrong:** Submissions return 404 or are silently dropped.
**Why it happens:** A Formspree form must be created in the Formspree dashboard and the confirmation email must be clicked before the form is active. The form ID in the endpoint URL must match the created form.
**How to avoid:** Create the Formspree form first, verify the confirmation email, then insert the form ID. A placeholder ID is acceptable for initial build (tests can mock or skip the network call).
**Warning signs:** 404 response from `https://formspree.io/f/{formId}`.

### Pitfall 4: `novalidate` Omitted — Double Validation UI
**What goes wrong:** The browser fires its own native validation popover AND the custom JS validation, causing duplicate/overlapping error UI.
**Why it happens:** Without `novalidate` on `<form>`, browser default validation intercepts submit before `addEventListener("submit")` fires.
**How to avoid:** Add `novalidate` attribute to the `<form>` element. The JS handler replaces native validation entirely.

### Pitfall 5: Astro `<script>` Runs Before DOM Is Parsed
**What goes wrong:** `document.getElementById(...)` returns `null`; form submission silently fails.
**Why it happens:** Astro modules run after the page is parsed by default, but inline `<script>` tags without `is:inline` are bundled and may reference DOM elements that don't exist yet if the script is in `<head>`.
**How to avoid:** Astro component `<script>` blocks are deferred-by-default (bundled ES modules). As long as the `<script>` is declared inside the `.astro` component template (not in `<head>`), DOM will be ready. Confirm with `DOMContentLoaded` guard if uncertain.

### Pitfall 6: Success State Inaccessible to Screen Readers
**What goes wrong:** The success message appears visually but is not announced.
**Why it happens:** Swapping `hidden` attribute without an ARIA live region.
**How to avoid:** Add `aria-live="polite"` to the `#contact-success` element OR focus it programmatically after reveal.

---

## Code Examples

### Formspree AJAX Pattern (Verified)
```javascript
// Source: https://help.formspree.io/hc/en-us/articles/360013470814-Submit-forms-with-JavaScript-AJAX
const response = await fetch("https://formspree.io/f/{formId}", {
  method: "POST",
  body: new FormData(formElement),
  headers: { Accept: "application/json" },
});

if (response.ok) {
  // show success UI
} else {
  const json = await response.json();
  // json.errors is an array of { message: string }
  json.errors?.forEach(err => console.log(err.message));
}
```

### Formspree Success Response Shape
```json
{ "ok": true }
```

### Formspree Error Response Shape
```json
{
  "error": "ValidationError",
  "errors": [
    { "field": "email", "message": "should be an email" }
  ]
}
```

### Liquid-Glass Card with z-index Fix
```css
/* Established project pattern — see ExperienceSection, SkillsSection */
.contact-card {
  position: relative;
  border-radius: 1rem;
  padding: 2.5rem;
}

#contact-form,
.contact-success {
  position: relative;
  z-index: 1; /* must be > 0 — liquid-glass::before is z-index:0 */
}
```

### Input Error State CSS
```css
input.is-invalid,
textarea.is-invalid {
  border-color: #EF4444; /* red-500 */
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
}

.field-error {
  display: block;
  font-size: 0.75rem;
  color: #EF4444;
  margin-top: 0.25rem;
  min-height: 1rem; /* prevents layout shift when error appears/disappears */
}
```

### Input Focus Ring (emerald, matching accent system)
```css
input:focus,
textarea:focus {
  outline: none;
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25), 0 0 8px rgba(16, 185, 129, 0.2);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formspree with `action` attribute (full page reload) | AJAX fetch with `Accept: application/json` | ~2017, stable since | In-page success/error state without redirect |
| Floating labels for form UX | Placeholder text (locked by CONTEXT.md) | N/A for this project | Simpler implementation |

**Deprecated/outdated:**
- `XMLHttpRequest`: Replaced by `fetch` — do not use.
- `@formspree/react`: Useful for React projects; adds unnecessary React dependency for a static Astro page.

---

## Open Questions

1. **Formspree Form ID**
   - What we know: The component needs `https://formspree.io/f/{formId}` to be functional
   - What's unclear: Whether the form has been created in the Formspree dashboard yet
   - Recommendation: Build the component with a `FORMSPREE_ID` constant placeholder. Document in the plan that Borina must create the Formspree account, create a form, and replace the placeholder ID before the form delivers email. This is a content/credentials gate, not a code blocker.

2. **Footer presence**
   - What we know: CONTEXT.md leaves footer to Claude's discretion (copyright line only if present)
   - What's unclear: Whether the planner should include a footer task in this phase
   - Recommendation: Include a minimal `<footer>` with a copyright line as a sub-task. Keeps the page structurally complete. One `<p>` element below the social links, no design complexity.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `playwright.config.ts` (root) |
| Quick run command | `npx playwright test tests/phase4.spec.ts --project=desktop` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | `#contact` section visible at bottom of page | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-01"` | Wave 0 |
| CONT-02 | Form has exactly 3 fields: name, email, message | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-02"` | Wave 0 |
| CONT-03 | Form has `action` attr or script targets Formspree endpoint | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-03"` — verify `<form>` or `<script>` contains `formspree.io` | Wave 0 |
| CONT-04 | Success and error states render (mock submission) | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-04"` — submit empty form, expect `.is-invalid`; note: live Formspree call requires actual ID | Wave 0 |
| CONT-05 | LinkedIn link visible in `#contact` | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-05"` | Wave 0 |
| CONT-06 | GitHub link visible in `#contact` | smoke | `npx playwright test tests/phase4.spec.ts --grep "CONT-06"` | Wave 0 |

**Note on CONT-03 / CONT-04:** Testing live Formspree network calls in CI requires a real form ID. The smoke tests should:
- CONT-03: Assert the fetch endpoint URL is present in a `data-formspree-id` attribute on the form or check the script contains the string `formspree.io` (DOM-verifiable without a network call).
- CONT-04 (error path): Submit the form with all fields empty — the client-side validation fires before any network call, so `.is-invalid` class appears without a live Formspree ID.
- CONT-04 (success path): Manual-only verification until a real Formspree form ID is configured.

### Sampling Rate
- **Per task commit:** `npx playwright test tests/phase4.spec.ts --project=desktop`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/phase4.spec.ts` — covers CONT-01 through CONT-06 (6 RED tests)

---

## Sources

### Primary (HIGH confidence)
- `https://formspree.io/plans` — Free tier: 50 submissions/month, AJAX supported
- `https://formspree.io/guides/astro/` — Official Formspree Astro integration guide
- `https://help.formspree.io/hc/en-us/articles/360013470814-Submit-forms-with-JavaScript-AJAX` — Fetch/AJAX pattern with `Accept: application/json`
- Project source files: `src/styles/global.css`, `src/components/HeroSection.astro`, `.planning/STATE.md` — existing patterns and z-index decisions

### Secondary (MEDIUM confidence)
- `https://docs.astro.build/en/recipes/build-forms/` — Astro form patterns; confirms static forms use `<script>` blocks
- Multiple community examples (2024) confirming AJAX works on Formspree free tier

### Tertiary (LOW confidence)
- One Pluralsight article claimed AJAX requires paid tier — contradicted by official Formspree docs and recent community reports. Treat as outdated.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Formspree docs confirm AJAX works free tier; Astro `<script>` block pattern is established in the project
- Architecture: HIGH — z-index fix is proven in prior phases; AJAX fetch pattern is from official Formspree docs
- Pitfalls: HIGH — z-index issue documented in project STATE.md decisions; `novalidate` and CORS header are standard form gotchas

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (Formspree plans are stable; Astro API is stable)
