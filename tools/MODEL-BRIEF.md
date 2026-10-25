# Story-object models — brief for model agents

The site (Astro + Three.js, repo at /Users/borinakeo/resume-website) renders a single "story object" that
shatters from one model into the next as the reader scrolls. Models are rendered in a MONO physically based
material (grey clay/ice, soft studio light). Textures are ignored; ONLY geometry matters. A model must read
unmistakably as the real thing from silhouette and surface form alone.

## Deliverable
- `public/models/<name>.glb` (binary glTF 2.0). Budget: ≤ 2.5 MB on disk, ≤ 250k triangles (prefer ≤ 120k).
  Meshopt or Draco compression is welcome (the loader supports both).
- Add `"<name>": "<name>.glb"` to `public/models/manifest.json` (JSON object; keep other entries).
- Append a line to `public/models/CREDITS.md`: model name, source URL, author, licence. Only CC0 /
  public-domain / CC-BY (with attribution) assets, or geometry you generated yourself.
- Orientation: Y up. The object's natural "front" faces +Z (toward the camera); "left side" faces +X is fine
  for vehicles/buildings seen in three-quarter view. Scale and centring are handled by the loader (longest
  axis is normalised to 2.8 units), so size doesn't matter, orientation does.
- Single object, no ground plane, no environment, no cameras/lights baked in the file, no animations.

## Check your work (mandatory, every iteration)
    cd /Users/borinakeo/resume-website && NODE_PATH=$PWD/node_modules node tools/render-model.cjs public/models/<name>.glb /private/tmp/claude-502/-Users-borinakeo/12b2f5b9-a82a-5ae8-8105-1a3434fe0f2f/scratchpad/shots/<name>-lab
Prints `{tris, meshes, bytes, size, ok}` and writes three PNGs (`-a` three-quarter, `-b` other side, `-c` top).
LOOK at the PNGs (Read tool) and judge honestly against a photo of the real object. Iterate until it is lifelike.
Do not stop at "recognisable". Reject anything that looks like primitives glued together.

## How to get a lifelike mesh
1. Source a real asset (preferred): Khronos glTF-Sample-Assets (raw.githubusercontent.com/KhronosGroup/
   glTF-Sample-Assets/main/Models/...), Smithsonian 3D (3d.si.edu, CC0), NIH 3D (3d.nih.gov, public-domain
   anatomy, STL/OBJ), NASA 3D resources, Poly Pizza (poly.pizza, CC0; direct .glb links on model pages),
   OpenGameArt (CC0 filter), Wikimedia Commons (STL/OBJ with CC0/CC-BY). Use WebSearch/WebFetch/curl.
   Download into a fresh empty directory under the scratchpad, never into the repo until checked.
2. Convert if needed: `npx -y @gltf-transform/cli` (optimize, weld, simplify, meshopt), or `npx -y obj2gltf`,
   or write a small Node script with three's STLLoader/OBJLoader + a GLB writer.
   Node 26 is available. Playwright + Chrome are available for the lab.
3. If nothing sourceable exists, generate high-fidelity geometry yourself in Node (three.js in Node works
   for geometry; export with `@gltf-transform/core` Document API or three's GLTFExporter in a Playwright page).
   Think in anatomy/engineering, not primitives: real proportions, bevels, panel lines, correct part counts.

Report back: final tris/bytes, source + licence, and a one-line honest verdict on realism per view.
