// Re-load a GLB, recompute smooth vertex normals, and write it back.
// Use after `gltf-transform simplify`, which keeps the original per-vertex normals on a changed triangulation
// and leaves fillets/grooves looking fuzzy. Usage: node tools/models/renormal.mjs in.glb out.glb
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { GLTFLoader } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'node:fs';

globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); } };

const [inp, out] = process.argv.slice(2);
if (!inp || !out) { console.error('usage: node tools/models/renormal.mjs in.glb out.glb'); process.exit(1); }
const buf = fs.readFileSync(inp);
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
let tris = 0;
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  // de-interleave positions (gltf-transform interleaves attributes) into a plain buffer
  const src = o.geometry; const pa = src.attributes.position; const pos = new Float32Array(pa.count * 3);
  for (let i = 0; i < pa.count; i++) { pos[3 * i] = pa.getX(i); pos[3 * i + 1] = pa.getY(i); pos[3 * i + 2] = pa.getZ(i); }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(Array.from(src.index.array));
  g = mergeVertices(g, 1e-4); g.computeVertexNormals(); o.geometry = g; tris += g.index.count / 3;
  o.material = new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.5, metalness: 0 });
});
const bin = await new GLTFExporter().parseAsync(gltf.scene, { binary: true });
fs.writeFileSync(out, Buffer.from(bin));
console.log(JSON.stringify({ tris, bytes: fs.statSync(out).size, out }));
