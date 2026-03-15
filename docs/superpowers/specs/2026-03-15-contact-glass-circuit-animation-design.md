# Design: Contact Section Frosted Glass + Animated Circuit

**Date:** 2026-03-15
**Status:** Approved

---

## Problem

1. **Contact section legibility** — text and form elements blend into the background image at 50% opacity, making the section hard to read.
2. **Static circuit background** — the AI Integrations section circuit SVG is purely decorative with no movement; user wants nodes to visually fire signals to each other.

---

## Solution Overview

Two independent changes to two different components:

1. **ContactSection.astro** — wrap existing content in a frosted glass card
2. **ProjectsSection.astro** — replace static circuit SVG with an animated canvas

---

## Change 1: Contact Section — Frosted Glass Card

### What Changes

Add a `contact-glass` wrapper `<div>` around the entire `contact-inner` content block (heading, tagline, form, social links).

### Styles

```css
.contact-glass {
  background: rgba(10, 15, 26, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
}
```

### Layout

- The `section-bg` (bg-contact.jpg) stays at 0.5 opacity — remains visible at the section edges around the glass card
- The glass card is centered horizontally via `margin: 0 auto`
- Existing `contact-card` (liquid-glass form wrapper) is preserved inside the glass panel

### No structural changes needed elsewhere — only ContactSection.astro is modified.

---

## Change 2: AI Integrations — Animated Circuit Canvas

### What Changes

Replace the `<div class="section-bg">` in ProjectsSection.astro with a `<canvas id="circuit-canvas">` element. Remove the static `circuit.svg` reference.

### Canvas Geometry

Reproduce the same circuit topology currently in `circuit.svg`:
- ~16 nodes positioned across the canvas at relative coordinates
- ~20 edges connecting them (matching the SVG trace layout)
- Nodes: emerald filled circles, radius 4px
- Traces: emerald lines, 1.5px stroke, opacity 0.25 (base state)

### Animation: Lightning Bursts (Option B)

Every ~600ms, randomly select a node and fire a signal to a connected neighbor:

1. **Source node** — burst with a radial glow gradient (radius expands to ~20px, fades over 35 frames)
2. **Beam** — glowing line from source to destination, `rgba(16,255,185,0.9)` with `shadowBlur: 12`, fades in then out over 35 frames
3. **Destination node** — secondary glow appears at ~40% through the animation, fades in as the signal "arrives"
4. **Loop** — multiple simultaneous bursts allowed; each runs independently

### Canvas Setup

```js
// Canvas fills the section absolutely, z-index: 0
// Resize observer updates canvas dimensions on layout change
// document.addEventListener('visibilitychange') pauses rAF when tab hidden
// Graceful fallback: if canvas not supported, section-bg div is shown instead
```

### CSS

```css
#circuit-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.8s ease;
}
#circuit-canvas.is-visible {
  opacity: 1;
}
```

IntersectionObserver triggers `.is-visible` on scroll (same pattern as other sections).

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/ContactSection.astro` | Add `.contact-glass` wrapper div + CSS |
| `src/components/ProjectsSection.astro` | Replace `section-bg` div with `<canvas>`, add JS animation, remove static SVG reference |
| `public/images/circuit.svg` | No longer used — can be deleted after implementation |

---

## Out of Scope

- Other sections' backgrounds — no changes
- Hero video opacity — already set at 85%
- Section bg opacity values — already set at 50%
- Domain setup — separate task

---

## Success Criteria

- [ ] Contact section heading, tagline, form, and social icons are clearly readable against the frosted glass panel
- [ ] Circuit bg remains visible at the edges of the contact section
- [ ] AI Integrations section shows animated lightning bursts between circuit nodes
- [ ] Animation pauses when tab is hidden
- [ ] No layout regressions on mobile or desktop
- [ ] Existing Playwright smoke tests still pass
