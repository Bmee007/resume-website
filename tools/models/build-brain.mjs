// Build public/models/brain.glb from the NIH 3D / HRA "Brain, Male" reference organ.
// Steps: drop internal (hidden) structures -> orient (front = +Z, up = +Y) -> join -> weld -> simplify -> quantize+meshopt.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { join, weld, simplify, quantize, meshopt, prune, dedup, flatten, getBounds } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

const [, , inPath, outPath, ratioArg = '0.3', errorArg = '0.0008'] = process.argv;
const RATIO = parseFloat(ratioArg);
const ERROR = parseFloat(errorArg);

// Structures fully enclosed by cortex/cerebellum/brainstem; invisible in a mono render.
const INTERNAL = /(nucle|thalam|ventricle|aqueduct|central_canal|commissure|corpus_callosum|fornix|caudate|putamen|globus_pallidus|hippocamp|amygdal|claustrum|hypothalamus|_HTH|white_matter|pineal|septal|accumbens|substantia_nigra|red_nucleus|zona_incerta|geniculate|basal_forebrain|stria_terminalis|pretectal|habenular|optic_radiation|mammillothalamic|cerebellar_deep|internal_segment|external_segment|midline_nuclear|central_nuclear|anterior_olfactory|cortical_nucleus|lateral_nucleus|medial_nucleus)/i;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const doc = await io.read(inPath);
const root = doc.getRoot();

const triCount = (mesh) => mesh.listPrimitives().reduce((s, p) => s + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);

let kept = 0, dropped = 0, keptTris = 0, droppedTris = 0;
const centroid = (node) => {
  const m = node.getMesh(); if (!m) return null;
  const pos = m.listPrimitives()[0].getAttribute('POSITION');
  const c = [0, 0, 0]; const n = pos.getCount(); const v = [0, 0, 0];
  for (let i = 0; i < n; i++) { pos.getElement(i, v); c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; }
  return c.map((x) => x / n);
};
const marks = {};
for (const node of root.listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const name = node.getName();
  if (/frontal_pole|occipital_pole|cerebellar_vermis|superior_frontal_gyrus|medulla/i.test(name)) marks[name] = centroid(node);
  const t = triCount(mesh);
  if (INTERNAL.test(name)) { dropped++; droppedTris += t; node.setMesh(null); node.dispose(); }
  else { kept++; keptTris += t; }
}
console.log(`kept ${kept} structures (${keptTris} tris), dropped ${dropped} internal (${droppedTris} tris)`);
console.log('landmarks (local coords):', JSON.stringify(marks, (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v)));

for (const m of root.listMeshes()) for (const p of m.listPrimitives()) p.setMaterial(null);
root.listMaterials().forEach((m) => m.dispose());
await doc.transform(prune(), flatten(), join({ keepNamed: false }), weld({ tolerance: 1e-6, toleranceNormal: 0.5 }));
let mesh = root.listMeshes()[0];
console.log('after join+weld:', root.listMeshes().length, 'meshes,', triCount(mesh), 'tris');

await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR, lockBorder: false }));
mesh = root.listMeshes()[0];
console.log('after simplify:', triCount(mesh), 'tris');

// Orientation: data is Y-up from Blender; put the frontal pole on +Z (see landmarks printed above).
const node = root.listNodes().find((n) => n.getMesh());
const sceneBounds = getBounds(root.listScenes()[0]);
const c = sceneBounds.min.map((a, i) => (a + sceneBounds.max[i]) / 2);
node.setTranslation([-c[0], -c[1], -c[2]]);
if (process.env.FLIP_Z === '1') node.setRotation([0, 1, 0, 0]); // 180 deg about Y
node.setName('brain');
mesh.setName('brain');

await doc.transform(prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
root.getAsset().generator = 'build-brain.mjs (gltf-transform)';
root.getAsset().copyright = 'HRA 3D Reference Organ for Brain, Male v1.3 (Kristen Browne; Heidi Schlehlein, 2023) CC BY 4.0, via NIH 3D 3DPX-020960';
await io.write(outPath, doc);
console.log('wrote', outPath);
