// Final geometry pass for story-object GLBs that are shown semi-transparent and double-sided on the site.
//
//   node tools/models/renormal.mjs in.glb out.glb [--pose cx,cy,scale,rx,ry] [--aspect 1.6]
//
// 1. Drops degenerate faces and makes the winding INWARD (see below), keeping the generator's analytic normals
//    (negated with the flip); angle-weighted mesh normals are only the fallback when a mesh has none.
// 2. (Inward winding: three.js draws transparent DoubleSide materials in two passes, back faces first. Inward-wound
//    closed shells put the visible near skin in the first pass, so the far wall and nested parts never show through.
//    Use --outward to keep outward winding.)
// 3. Merges everything into ONE mesh and sorts its triangles near-to-far from the camera of the chapter that shows
//    the model. Why: src/scripts/scene3d.js draws the model with transparent + DoubleSide at the chapter's opacity
//    (0.6 for the Intelligence chapter) and depthWrite on, and loadModel() keeps the file's triangle order. Blending
//    is order dependent: whenever a far wall, the inside of a shell or a part nested in another is drawn BEFORE the
//    wall in front of it, it shows through as dark flecks and scratch-like seam ghosts. Near-first order lets the
//    depth buffer reject everything behind the visible skin, so the result looks like one clean translucent shell.
//    The order must survive compression, so pack with tools/models/pack-glb.mjs, not `gltf-transform meshopt`
//    (which always runs a vertex-cache reorder).
//
// --pose  the chapter's data-lattice-cx, -cy, -scale, -rx, -ry (defaults: ChapterIntelligence.astro, the bot).
// --aspect  viewport width / height used to place the model off-axis (default 1.6, i.e. 1440x900).
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { GLTFLoader } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';

globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); } };

const args = process.argv.slice(2); const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const [cx, cy, scale, rx, ry] = flag('--pose', '0.87,0.32,0.5,0.12,-0.4').split(',').map(Number);
const aspect = Number(flag('--aspect', '1.6'));
const inward = !args.includes('--outward'); if (!inward) args.splice(args.indexOf('--outward'), 1);
const [inp, out] = args;
if (!inp || !out) { console.error('usage: node tools/models/renormal.mjs in.glb out.glb [--pose cx,cy,scale,rx,ry] [--aspect 1.6]'); process.exit(1); }

const buf = fs.readFileSync(inp);
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));

// ---- 1. clean each mesh ------------------------------------------------------
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function angleWeightedNormals(pos, idx) {
  const N = new Float32Array(pos.length); const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t < idx.length; t += 3) {
    for (let k = 0; k < 3; k++) v[k].fromArray(pos, 3 * idx[t + k]);
    fn.crossVectors(e1.subVectors(v[1], v[0]), e2.subVectors(v[2], v[0])); const l = fn.length(); if (l < 1e-12) continue; fn.divideScalar(l);
    for (let k = 0; k < 3; k++) {
      e1.subVectors(v[(k + 1) % 3], v[k]).normalize(); e2.subVectors(v[(k + 2) % 3], v[k]).normalize();
      const w = Math.acos(clamp(e1.dot(e2), -1, 1)); const i = idx[t + k];
      N[3 * i] += fn.x * w; N[3 * i + 1] += fn.y * w; N[3 * i + 2] += fn.z * w;
    }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  return N;
}
const meshes = []; let dropped = 0, flipped = 0;
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const src = o.geometry; const pa = src.attributes.position; const na = src.attributes.normal;
  const P = new Float32Array(pa.count * 3), Nsrc = na ? new Float32Array(pa.count * 3) : null;
  for (let i = 0; i < pa.count; i++) { // de-interleave / de-quantise
    P[3 * i] = pa.getX(i); P[3 * i + 1] = pa.getY(i); P[3 * i + 2] = pa.getZ(i);
    if (na) { Nsrc[3 * i] = na.getX(i); Nsrc[3 * i + 1] = na.getY(i); Nsrc[3 * i + 2] = na.getZ(i); }
  }
  const ix = src.index.array; const keep = []; let vol = 0;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t], b = ix[t + 1], c = ix[t + 2];
    if (a === b || b === c || a === c) { dropped++; continue; }
    A.fromArray(P, 3 * a); B.fromArray(P, 3 * b); C.fromArray(P, 3 * c);
    if (B.clone().sub(A).cross(C.clone().sub(A)).length() < 1e-9) { dropped++; continue; }
    keep.push(a, b, c); vol += A.dot(B.clone().cross(C));
  }
  // Keep the generator's analytic normals when present (they follow the surface function, not the adaptive
  // triangulation); only fall back to angle-weighted mesh normals. The winding flip negates them too.
  const flip = inward ? vol > 0 : vol < 0;
  if (flip) { flipped++; for (let t = 0; t < keep.length; t += 3) { const x = keep[t + 1]; keep[t + 1] = keep[t + 2]; keep[t + 2] = x; } }
  let nrm;
  if (Nsrc) { nrm = Nsrc; if (flip) for (let i = 0; i < nrm.length; i++) nrm[i] = -nrm[i]; } else nrm = angleWeightedNormals(P, keep);
  meshes.push({ pos: P, idx: keep, nrm });
});

// ---- 2. merge into one mesh and sort near-to-far ---------------------------------
let nv = 0; for (const m of meshes) nv += m.pos.length / 3;
const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3); const tris = []; let off = 0;
for (const m of meshes) {
  pos.set(m.pos, off * 3); nrm.set(m.nrm, off * 3);
  for (let t = 0; t < m.idx.length; t += 3) tris.push([m.idx[t] + off, m.idx[t + 1] + off, m.idx[t + 2] + off]);
  off += m.pos.length / 3;
}
// Camera in the model's own frame, replicating src/scripts/scene3d.js + models.js (loadModel centres the bbox and
// scales the longest axis to 2.8; the group is placed at (cx, cy), scaled min(vw, vh)*0.3*scale, rotated XYZ(rx, ry)).
const bb = new THREE.Box3(); for (let i = 0; i < pos.length; i += 3) bb.expandByPoint(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]));
const size = bb.getSize(new THREE.Vector3()), centre = bb.getCenter(new THREE.Vector3()); const s = 2.8 / Math.max(size.x, size.y, size.z);
const vh = 2 * Math.tan((32 * Math.PI) / 360) * 6.4, vw = vh * aspect;
const groupPos = new THREE.Vector3((cx - 0.5) * vw, -(cy - 0.5) * vh, 0), groupScale = Math.min(vw, vh) * 0.3 * scale;
const rot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, 0, 'XYZ'));
const eye = new THREE.Vector3(0, 0, 6.4).sub(groupPos).divideScalar(groupScale).applyMatrix4(rot.clone().invert()).divideScalar(s).add(centre);
const dist = tris.map(([a, b, c]) => {
  const x = (pos[3 * a] + pos[3 * b] + pos[3 * c]) / 3 - eye.x, y = (pos[3 * a + 1] + pos[3 * b + 1] + pos[3 * c + 1]) / 3 - eye.y, z = (pos[3 * a + 2] + pos[3 * b + 2] + pos[3 * c + 2]) / 3 - eye.z;
  return x * x + y * y + z * z;
});
const order = dist.map((_, i) => i).sort((i, j) => dist[i] - dist[j]);
const index = new Uint32Array(tris.length * 3); order.forEach((t, k) => { index.set(tris[t], 3 * k); });

const g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(new THREE.BufferAttribute(index, 1));
const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.5, metalness: 0 })); mesh.name = 'bot';
const scene = new THREE.Scene(); scene.add(mesh);
fs.writeFileSync(out, Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true })));
console.log(JSON.stringify({ tris: tris.length, bytes: fs.statSync(out).size, droppedDegenerate: dropped, windingFlipped: flipped, eyeModelMM: eye.toArray().map((v) => Math.round(v)), out }));
