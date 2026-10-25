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

The procedural map in `src/scripts/models.js` remains as the instant stand-in before `canada.glb` arrives.
