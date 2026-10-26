# Through the Fog — immersive redesign (2026-10-25)

## Intent
Turn the resume site from a static dark-amber "editorial" page into a scroll-driven story
in the language of igloo.inc and mont-fort.com: cold atmospheric palette, a persistent 3D
story object, numbered chapters, mono telemetry labels, glitch and frost transitions.
Audience is Fortune 500 / 3PL decision-makers and employers evaluating Borina Keo as the
leader who integrates AI into ERP (Dynamics 365) and WMS (Manhattan DFIO).

## Story arc (one page, seven chapters)
| Chapter | id | Scene | Tone | Lattice state |
|---|---|---|---|---|
| Intro | `#hero` | mist | light | brain, centre-right |
| Manifesto | `#manifesto` | clearing | light | truck |
| 01 Origin — AS400 → D365 | `#about` | storm | dark | computer |
| 02 Network — DFIO × 7 DCs | `#network` | steel | light | warehouse → Canada map (7 pins) |
| 03 Intelligence — AI layer + live console | `#ask` | summit | light | brain, faint |
| 04 Change — D365, Copilot, Claude, Gemini training | `#change` | clearing | light | brain, faint |
| 05 Record — roles + spec sheet | `#experience` / `#skills` | clearing | light | brain, large, 12% |
| 06 Work — pinned case studies | `#projects` | deep | dark | off |
| 07 Contact | `#contact` | mist | light | brain, faint |

The fog goes mist → storm → clearing → light: the legacy era is the dark chapter, the AI
layer is the brightest. The lattice is a wireframe drawing that morphs through four images as the story advances:
a shipping truck (Manifesto, distribution), a desktop computer (Origin, the ERP), a warehouse that
unfolds into a Lambert-conic map of Canada with the seven DCs pinned and chained west→east
(Network, DFIO; `data-lattice-then`), and a brain (Intelligence onward, the AI layer). Shapes are 3D polylines in
`src/scripts/shapes.js`, sampled to a fixed 380 nodes so node i flies to node i; mid-morph
nodes scatter slightly and both edge sets fade on a steep curve so the transition reads as a dissolve.

## Palette (OKLCH, hue 245 throughout)
fog-0 0.965 · fog-1 0.915 · steel 0.72 · slate 0.58 · deep 0.43/0.085 · storm 0.23 · abyss 0.135 · ice 0.80/0.09 (accent, dark chapters only).
Semantic tokens `--ink / --ink-2 / --ink-3 / --line / --accent` flip under `[data-tone="dark"]`
on both the section and `<html>` (chrome follows the chapter under it).

## Type
Jost Variable (display, weight 200–300, uppercase, tracked) + IBM Plex Mono (telemetry,
numbers, labels). No serif, no Geist.

## Motion system (`src/scripts`)
- `fog.js` — raw WebGL fragment shader: 2-layer fbm mist, per-chapter colours/density/horizon
  lerped each frame, chromatic-aberration + tear on `uGlitch`, rendered at 0.5× DPR.
- `shapes.js` — the four wireframe drawings (truck, computer, warehouse, brain) as 3D polylines.
- `lattice.js` — 2D canvas, hand-rolled perspective projection, 300 nodes sampled from the
  polylines; morph/position/scale/opacity/tilt/yaw scrubbed per chapter.
- `motion/core.js` — GSAP (ScrollTrigger, SplitText, ScrambleText, Flip) + Lenis.
- `motion/loader.js` — 000→100 counter, label scramble, frost wipe (clip-path).
- `motion/hero.js` — line-mask statement reveal, label scramble, cycling verb, scroll-out.
- `motion/chapters.js` — the scene director: reads `data-scene/tone/chapter/label/lattice-*`
  from each section and drives fog, tone, lattice, rail and glitch pulse.
- `motion/reveals.js` — `data-split` (line masks), `data-reveal`, `data-scramble`,
  `data-count`, `data-rule`.
- `motion/work.js` — pinned horizontal track ≥900px.
- `ask.js` — live console streaming from `/api/chat` (unchanged protocol, readout rows FLIP).

Reduced motion: loader removed, no Lenis, all reveals instant, static lattice at 30%.

## Non-goals
Three.js / WebGL UI, sound, page transitions, CMS. Content facts unchanged from `api/chat.ts`.

## Verification
`npm run build`, `npx astro check`, `npm test` (Playwright against installed Chrome;
set `PW_CHANNEL=""` for bundled Chromium). Scroll FPS measured at display cap on desktop
and emulated mobile.

## Figures (Lieflat Charts grammar, 2026-10-25)
Charts follow `~/workspace/projects/lieflat-charts` (Lupi Basics / Editorial): hairline tracks and ticks,
countable units, caption four-piece (title as a conclusion · subtitle carries legend and units · figure ·
source line), quartic-out stagger reveal on scroll, `prefers-reduced-motion` renders static. Colour system
is the site's mono-tinted ink ladder (`--ink`, `--ink-3`, `--line-2`), one system across the whole page.
Candidate audit per figure (≥3 compared; main-force templates first):
- Origin — before/after of two indexed measures → **F12 Dumbbell Queue** (chosen; beads = index points).
  Rejected F6 Paired Rungs (used in Work), F1 Rung Bars (loses the before/after contract).
- Network — single value 0–100 (pick accuracy 99.7%) → **F11 Tick Gauge** laid flat (chosen; one tick = 1%).
  Rejected L14 Hundred Field (99.7 can't be shown honestly in 100 dots), F1 Rung Bars (one bar is not a chart).
- Intelligence — share of a hundred (90% of tier-1 queries) → **L14 Hundred Field** (chosen; one dot = one in a hundred).
  Rejected F4 Tick Donut (two segments), G4 Dot Waffle (Glance; no justification to downgrade).
- Work — per case, two measures before/after → **F6 Paired Rungs** (chosen; sister figures share one template
  for comparability). Rejected F12 (already used in Origin), F9 Waterfall (not a decomposition).
Components live in `src/components/charts/`; the reveal lives in `src/scripts/motion/charts.js`.
The map outline is Natural Earth 50m (public domain), Douglas–Peucker simplified by `scratchpad/simplify.py`
into `src/scripts/canada-outline.js` (150 mainland + 11 island rings).

## Story object v3 — solid 3D (2026-10-25)
The wireframe is replaced by real geometry in Three.js (`src/scripts/models.js` builds truck, computer,
warehouse, Canada map and brain procedurally; `src/scripts/scene3d.js` renders them). Transitions keep the
same choreography: a per-triangle shatter shader shrinks each face toward its centroid and flings it along
a random direction in phase order, while the next model assembles in reverse. The state contract
(morph / cx / cy / scale / opacity / rotX / rotY / tilt / ink / glow) is unchanged, so the scene director
and all `data-lattice-*` attributes still drive it. Lighting is a matte clay-ice: one key, a weak back
fill, hemispheric sky, cool Fresnel rim; ink colour follows chapter tone. City labels are DOM spans
projected from the map pins. Brand marks (`Icon.astro`) use inline monochrome paths; Claude and Gemini
glyphs come from `simple-icons`. The loader runs at 45% length on repeat visits in a session.

## Story object v4 — lifelike assets + interaction (2026-10-25, evening)
- Rendering moved to `MeshPhysicalMaterial` (clearcoat/sheen, ACES tone-mapping, RoomEnvironment PMREM,
  key + rim + hemisphere lights). The shatter is injected via `onBeforeCompile` so lighting stays PBR.
- Models load from `public/models/<name>.glb` listed in `public/models/manifest.json`; procedural
  stand-ins render instantly and are swapped as GLBs arrive. Loader normalises (longest axis 2.8),
  converts material colour to per-vertex grey, and adds shatter attributes. Credits in
  `public/models/CREDITS.md`. `tools/render-model.cjs` + `tools/model-lab.html` render any GLB with
  the site's lighting for review; `tools/MODEL-BRIEF.md` is the brief given to model agents.
- Interaction: the story object is draggable (inertia fling, decays back to the chapter pose) with a
  DRAG cursor state; rail dots jump to chapters; nav labels decode on hover; Toronto local time and a
  synthesised ambient-wind toggle (Web Audio, off by default, session-remembered) in the chrome;
  case counter on the pinned work track. Hero verb cycle uses a 0.45 s digit-only decode every 5.5 s.
- Inspiration pass (Awwwards SOTD, Oct 2026): Brandon Yasin, Huy Phan, Signal-A, FORMAT — shared motifs
  adopted: local time/location readout, mono micro-labels, counters, restrained palette, cursor states.

### Lifelike models delivered (2026-10-25, night)
Four parallel model agents produced `public/models/{brain,truck,computer,warehouse}.glb` (0.6–1.2 MB each,
51k–130k tris, meshopt + quantization). Brain is the NIH 3D "Brain, Male" reference organ (CC BY 4.0,
credited in `public/models/CREDITS.md`); truck, workstation and distribution centre are procedural
three.js builds (own work, CC0) whose generators live in `tools/models/`. Loader fix: quantized
Int8/Int16 attributes are dequantized to Float32 before transforms, and source normals are kept.
Accessibility: axe reports 0 violations on desktop and mobile (mobile menu uses `inert`, SplitText
`aria: 'none'`, ledger is an `<ol>`, dark chapters carry an 86% storm tint so contrast holds without WebGL).

### Entry gate + Awwwards review round 2 (2026-10-26)
Reviewed 10 Site of the Day winners (Oct 2026) at several scroll depths. Four of six most recent
open with an "Enter with sound / Enter without sound" gate (Emotion Agency, Overworld Audio, Forge,
Pegassi); Belgrade Arbor and ESR use chromatic image reveals, section progress counters and video heroes;
Signal-A uses mixed-weight statement typography. Adopted: the loader is now an entry gate — the BK
monogram draws itself (DrawSVG) during the 000→100 count, then the visitor chooses sound on/off (the
gesture that unlocks Web Audio); the choice is remembered per session and repeat visits auto-enter.
Hero statement uses weight 300/500 contrast. The story object is draggable by touch as well as mouse.
Rejected: video heroes (no footage), full-screen image displacement (no photography on this site).
Performance: models load lazily (hero model at boot, others when their chapter is within 2.5 screens);
Draco is not wired (all GLBs are meshopt) which drops a 150 KB decoder chunk; main bundle 262 KB gz.
Chapter changes fire a 420 ms chromatic text split on headings alongside the fog glitch; phones show a
one-time "drag to rotate" hint under the hero object.

Canada relief (2026-10-26): `public/models/canada.glb` (163k tris, 1.27 MB) — Natural Earth 10m coastline,
lakes and province grooves with ETOPO1 relief (non-linear exaggeration so the Shield reads). Authored in the
site frame; `loadModel` keeps its origin and overlays the seven city pins + route from `canadaPins()`.

### Independent jury review + fix pass (2026-10-26)
A fresh agent scored the site as an Awwwards juror from a 27-frame walkthrough plus live probes:
Design 7.0 · Usability 5.5 · Creativity 7.0 · Content 6.5 → 6.5 overall, "borderline Honorable Mention".
Fixed from its list: fixed nav now has a chapter-toned blurred surface and hides on fast scroll-down;
models repositioned clear of text (Origin/Network/Intelligence/Contact) and drag only starts over the
object; Work rail hides while the track is pinned with end clearance; console shows LIVE/OFFLINE from a
GET health check, serves saved answers for the four prompts when offline, labels the monitor feed
"illustrative", and lists platform years instead of invented percentages; numbers reconciled across
chapters (15% / −5% / +12%; 14% = PO approval cycle); chart captions no longer carry template codenames;
Record scope stated; hero video removed; phone DPR capped at 1.5; gate ~1.6 s; scrambles ≤0.4 s.
Verified after the pass: 96/96 Playwright, axe 0 violations, build + check clean.

### Awwwards pass 3 (2026-10-26, afternoon)
Reviewed Forge Automotive (SOTD Oct 25), Brandon Yasin (Oct 24) past their entry screens; Cartier blocked
by its CDN. Adopted: Yasin's row-wide hover captions on the Work panels (hovering one panel reveals mono
captions on all, hovered panel lifts, siblings settle); Forge's bottom-edge progress line, used on phones
where the chapter rail is hidden. Portrait: "Profile pic 2" cut out with macOS Vision person segmentation
and composited onto a steel-blue studio backdrop (`tools`-free one-off in the session scratchpad; result is
`public/images/Profile.jpg`). Site is live at borinakeo.com from branch `claude/hero-page-ai-demo-3JR8X`.

### Jury re-score (2026-10-26)
Independent re-score after the fix pass: Design 7.5 · Usability 6.5 · Creativity 7.5 · Content 6.5 →
**7.1 overall, clear Honorable Mention** (was 6.5, borderline). Verified fixed: nav collisions, drag cursor,
scramble length, console honesty, codenames, percentages, "Fortune 500". Fixed in this pass from its list:
12→13% on the Intelligence copy; nine→seven centres in the agent bank; work counter (end card excluded);
case metrics hidden behind media at 900px tall (media height capped); rail now hides during the pin;
Change/Manifesto/Contact models parked clear of text; telemetry wraps below 1300px; mobile menu tap
targets 44px; phones skip the in-chapter map morph (it collided with the roster); models load at 130%
on phones; project JPEGs resized to 1200px; saved answers now say so in the status line; 3 MB of unused
legacy images removed. Still open from the jury: a dedicated low-weight mobile experience, the Manifesto
exit clip, Illumi live for the jury (key is set in Vercel production).

### Phone experience (2026-10-26, evening)
Below 900px the story object is `src/scripts/stills.js`: five pre-rendered WebP stills of the models at
their chapter poses (`tools/render-stills.cjs`, trimmed, 4–19 KB each), crossfaded with a blur burst on
chapter change; same state contract as `scene3d.js`, so the chapter director is unchanged. Three.js and
the GLBs are now a desktop-only dynamic import (scene3d chunk 185 KB gz, split from the 79 KB main
bundle). Phone full-scroll payload 4.3 MB → 2.0 MB; no WebGL model canvas on phones. The object owns the
upper half of each chapter (cy 0.3, scale 0.82, full opacity) and chapter text starts at 58vh.

### Jury pass 4 → unified choreography (2026-10-26)
Jury #4 (production): 8.0 / 7.6 / 8.0 / 7.3 → **7.8, firm Honorable Mention**; blocker moved from mobile to
the desktop 3D layer (models on the chapter numerals, flat look, intermittent wrong model, particles over
the Work cards). Response: one choreography for all viewports — each chapter owns the object from
`top 100%` to `bottom bottom` and computes pose/blend/opacity from its own position (no sandwiched
tweens, blends go directly previous→next model via `state.blend`); chapter numerals retired (rail +
telemetry number the chapters); fresnel rim + stronger key/rim/env on the clay material; post-Work
entry delayed to 35vh so nothing draws over the cards; tap targets ≥44px via id-scoped rules; Illumi
answers 3–5 grounded sentences with no opening simile and streams text as it arrives.

### Jury pass 5 → single owner driver (2026-10-26)
Jury #5 (production): 8.3 / 8.0 / 8.1 / 7.6 → **8.1, upper Honorable Mention**, "close but no"; remaining gap:
object choreography vs typography (brain through the Network KPI figures on handoff, Contact brain cropped,
Record map arriving in Change, truck/computer still matte). Response: the story object is now driven by one
ticker-fed function — the owning chapter is the last whose top has crossed its own entry line (derived from
its object's top edge), objects assemble in place (`state.assemble`) instead of travelling between chapters,
hero-size objects leave with the chapter's last content and ghosts leave once the heading has passed. Fast
full-page scrolls now land on the right model every time (3/3). Material: roughness .42, clearcoat .45,
env 1.8. Contact brain sits below the form in frame; Contact's desktop top padding reduced; hamburger 44px;
Illumi: similes banned outright, no unrelated stats.
