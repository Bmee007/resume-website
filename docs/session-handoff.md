# Session Handoff — Ask Borina Keo Interactive Section

## Branch
`claude/hero-page-ai-demo-3JR8X`

## What's done ✓

1. **HeroSection.astro** — bugs fixed:
   - Removed `opacity: 0` from CSS on `.hero-label`, `.hero-title`, `.hero-sub`, `.hero-ctas`, `.hero-social`
   - Fixed name overflow: `clamp(4rem, 11vw, 9rem)` → `clamp(3.5rem, 9vw, 7rem)` + `overflow-wrap: break-word`

2. **animations.js** — fixed:
   - Added `gsap.set([...], { opacity: 0 })` at top of `initHeroAnimation()` so visibility doesn't depend on CSS
   - Simplified reduced-motion block (no longer needs to force `opacity: 1` on hero elements)

3. **astro.config.mjs** — updated:
   - Added `output: "hybrid"` and `adapter: vercel()` from `@astrojs/vercel/serverless`

4. **Dependencies installed**: `@astrojs/vercel`, `openai`

5. **.env.example** — created with `OPENAI_API_KEY` (Option B) and commented Option A (self-hosted OpenCode)

6. **src/pages/api/chat.ts** — created:
   - Full SSR streaming endpoint (`export const prerender = false`)
   - Uses `openai` SDK, points to OpenAI or self-hosted OpenCode via env vars
   - Returns SSE stream of JSON delta tokens
   - Full system prompt with Borina's facts embedded

## What's still needed ✗

### 7. `src/components/AskSection.astro` (NEW — not started)
Full component. Structure:
```
<section id="ask">
  <!-- full-width header -->
  <div class="ask-header">
    <span class="section-num">02</span>
    <h2 class="ask-heading display-serif">Ask Borina Keo<br/><em>to show you.</em></h2>
    <p class="ask-subhead">Type a question or pick a prompt — the dashboard answers in real time.</p>
  </div>

  <!-- 2-col split -->
  <div class="ask-split">

    <!-- LEFT: chat -->
    <div class="ask-left">
      4 chips with data-prompt attribute (id="ask-chips")
      <input id="ask-input" maxlength="500" />
      <button id="ask-send" disabled>send SVG</button>
      <div id="ask-status" aria-live="polite"></div>
    </div>

    <!-- RIGHT: bento grid (id="ask-bento") -->
    5 cards:
      #card-metric-big  data-card="metric"     grid-row:span 2 (default hero)
      #card-alert       data-card="alert"
      #card-yrs         data-card="experience"
      #card-ai          data-card="ai"          aria-live="polite"  ← answer card
      #card-skills      data-card="skills"      grid-column:span 2

    Dynamic text targets:
      #metric-value, #metric-label, #metric-sub
      #alert-list  (innerHTML replaced)
      #ai-prompt-text, #ai-response-text
      #skill-list  (innerHTML replaced)
  </div>
</section>
```

CSS needed (scoped):
- `.ask-header` full-width heading area, border-bottom
- `.ask-split` — `display:grid; grid-template-columns:1fr 1.2fr; gap:clamp(2,4vw,4rem)`
- `.ask-left` — flex col, gap 1.25rem
- `.ask-chips` — flex wrap, gap 0.5rem
- `.ask-chip` — amber border button, hover fills amber
- `.ask-input-field` — surface-raised bg, border-strong, full width
- `.ask-send-btn` — amber bg, disabled:opacity-40
- `.ask-status` — 0.75rem, fg-subtle
- `#ask-bento` — `display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr 1fr; gap:0.75rem; height:520px`
- `.bento-card` — surface bg, border, padding 1.125rem, overflow hidden, position relative
- `.bento-card::before` — top amber gradient line, opacity 0, transitions to 1 on hover
- `.bento-hero` — `grid-row:span 2` (toggled by JS FLIP)
- `.bento-full-row` — `grid-column:span 2`
- Card internals: `.card-tag`, `.mini-bars`, `.bar`, `.bar--hi`, `.big-num` (DM Serif 4.5rem amber), `.big-label`, `.big-sub`
- `.alert-header`, `.alert-badge`, `.pulse-dot` (green pulsing), `.alert-list`, `.alert-item`
- `.yr-num` (DM Serif 3.5rem amber), `.yr-label`, `.yr-sub`
- `.ai-prompt`, `.ai-response` (amber left-border 2px), `.typing-cursor` (blink anim)
- `.ai-dots` / `.dot-anim` (3 staggered dots)
- `.skill-list`, `.skill-row`, `.skill-bar-bg`, `.skill-bar-fill--amber/blue/green`
- Mobile <768px: `.ask-split` → single col; `#ask-bento` → `height:auto`; `#card-metric-big` loses span 2

Color vars needed (add to scoped or reuse from global):
`--green: oklch(0.72 0.18 145)` and `--blue: oklch(0.65 0.17 240)` (not in global.css)

Reference `mockups/proposal-3.html` for exact card HTML and CSS — it's a working render of the bento grid.

### 8. `src/scripts/animations.js` — extend (not started)

Add at TOP of file:
```js
import { Flip } from 'gsap/Flip';
gsap.registerPlugin(ScrollTrigger, Flip);
```

Add new exported function `initAskSection()` — call it from `initAll()` inside the loader MutationObserver callback (after `initHeroAnimation()`):
```js
initAskSection();
```

`initAskSection()` contains:

**A. Scroll-triggered bento entrance:**
```js
ScrollTrigger.batch('.bento-card', {
  start: 'top 85%', once: true,
  onEnter: (batch) => gsap.fromTo(batch,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out' }
  ),
});
```

**B. LAYOUT MAP** for GSAP FLIP:
```js
const LAYOUTS = {
  metric:     { hero: 'card-metric-big' },
  alert:      { hero: 'card-alert' },
  experience: { hero: 'card-yrs' },
  skills:     { hero: 'card-skills' },
  ai:         { hero: 'card-ai' },
};
```
`applyLayout(highlightCard)`:
1. `Flip.getState(cards)` — BEFORE DOM changes
2. Remove `.bento-hero` from all cards
3. Add `.bento-hero` to `document.getElementById(LAYOUTS[highlightCard].hero)`
4. `Flip.from(state, { duration:0.6, ease:'expo.out', stagger:0.05, absolute:true })`

**C. `updateCardContent(updates)`:**
For each section (metric, alert_items, skills, ai), do:
`gsap.to(target, { opacity:0, duration:0.2, onComplete: () => { update DOM; gsap.to(target, {opacity:1, duration:0.35}) } })`

**D. `streamAnswer(prompt, abortController)`:**
```js
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({ prompt }),
  signal: abortController.signal,
});
// ReadableStream reader loop
// Accumulate fullText from delta chunks
// Regex /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/ to extract text progressively → show in #ai-response-text with typing cursor
// On [DONE]: JSON.parse(fullText) → applyLayout + updateCardContent
```

**E. Chat wiring (`initHeroChat()` pattern but for #ask-* IDs):**
- `#ask-input` input event → enable/disable `#ask-send`
- `.ask-chip` click → set input value + fire sendQuestion
- `#ask-send` click + Enter key → sendQuestion
- `sendQuestion(prompt)`: set loading, update `#ai-prompt-text`, call streamAnswer with new AbortController

### 9. `src/pages/index.astro` — update (not started)
```js
import AskSection from "../components/AskSection.astro";
// Add between HeroSection and AboutSection:
<AskSection />
```
Also update AboutSection's section number from "02" to "03" if it has one hardcoded.

### 10. `src/components/Nav.astro` — add link (not started)
Add `<a href="#ask">Ask</a>` to the nav links list (same styling as existing links).
Check `Nav.astro` for exact pattern — links are likely in a `<nav>` with class `nav-links`.

## Full plan file
`/root/.claude/plans/can-we-use-a-cheeky-stroustrup.md`

## Reference files
- `mockups/proposal-3.html` — complete working bento grid HTML+CSS (copy card markup from here)
- `mockups/proposal-1.html` — chat panel reference
- `src/components/HeroSection.astro` — color vars, existing patterns to reuse
- `src/scripts/animations.js` — existing GSAP patterns, add to this file

## Key design tokens (not in global.css, add scoped)
```css
--green: oklch(0.72 0.18 145);
--blue:  oklch(0.65 0.17 240);
```

## Commit message to use when done
```
feat: add Ask Borina Keo interactive section + fix hero visibility bugs

- Fix hero elements permanently invisible (move opacity:0 from CSS to gsap.set)
- Fix hero name overflow at wide viewports (reduce clamp max, add overflow-wrap)
- Add AskSection.astro: bento dashboard + chat input wired to /api/chat
- Add src/pages/api/chat.ts: SSR streaming endpoint (OpenCode/GPT-4o)
- Add GSAP Flip card rearrangement triggered by AI highlight_card response
- Switch Astro to hybrid output mode with Vercel adapter
```
