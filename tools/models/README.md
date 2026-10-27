# Model generators

Reproducible sources for the GLBs in `public/models/`. Each writes a GLB; then compress with
`npx -y @gltf-transform/cli meshopt in.glb out.glb` and register in `public/models/manifest.json`
(+ a line in `public/models/CREDITS.md`). Review any GLB with the site's lighting:

    NODE_PATH=$PWD/node_modules node tools/render-model.cjs public/models/<name>.glb out-prefix

| Script | Model | Notes |
|---|---|---|
| `truck.mjs` | truck.glb | Procedural sleeper tractor + 53' van (three.js lofts/lathes). `node truck.mjs out.glb` |
| `gen-warehouse.cjs` | warehouse.glb | Procedural distribution centre with docks, office, yard. |
| `build-computer.mjs` | computer.glb | Procedural monitor + TKL keyboard + mouse. |
| `build-canada.py` | canada.glb | Relief model: Natural Earth 10m outline/lakes/province lines + ETOPO1 (NOAA, public domain) via ERDDAP; shapely/numpy → GLB, then gltf-transform simplify (lock-border) + meshopt. Authored in site units; the loader skips normalisation for this one and adds the pins. |
| `build-brain.mjs` | brain.glb | Processes the NIH 3D "Brain, Male" (CC BY 4.0) export: strips internal structures, joins, simplifies, meshopt. Needs the source download in place; see the script header. |
| `build-bot.mjs` | bot.glb | Procedural companion robot ("Illumi"): displacement-mapped lathes/ellipsoid meshed with an adaptive quadtree; then gltf-transform simplify (gentle) + `renormal.mjs` + meshopt. See the script header for the exact commands. |
| `build-pills.mjs` | pills.glb | Procedural amber Rx vial: lathed body (push-up base, foot ring, soft shoulder), 48-rib push-and-turn cap with top tabs/arrows, wrapped label with raised Rx glyph, word-block text and barcode relief, plus capsules and scored tablets at the base. `node build-pills.mjs raw.glb` then meshopt. |

The procedural map in `src/scripts/models.js` remains as the instant stand-in before `canada.glb` arrives.
