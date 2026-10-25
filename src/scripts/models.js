// src/scripts/models.js
// Procedural solid models for the story object. Each builder returns one merged,
// non-indexed BufferGeometry with per-triangle attributes the shatter shader needs:
//   aShade  — per-part lightness (0 dark … 1 light)
//   aCenter — triangle centroid (fragments shrink toward it while dissolving)
//   aDir    — random fly-away direction
//   aPhase  — random dissolve order
// Units match the old wireframe (±1.4), y up, z toward the viewer.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { MAINLAND, ISLANDS } from './canada-outline.js';
import { DCS, lccProjector } from './shapes.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** Place a geometry: position, optional rotation (Euler xyz), optional scale, shade. */
function part(geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], shade = 0.7 } = {}) {
  const g = geo.clone();
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s)));
  g.computeVertexNormals();
  const n = g.attributes.position.count;
  g.setAttribute('aShade', new THREE.BufferAttribute(new Float32Array(n).fill(shade), 1));
  return g;
}

/** Merge parts, drop the index, and attach the shatter attributes. */
function finish(parts, seed, { tessellate = true } = {}) {
  const prepared = parts.map((g) => { const ng = g.index ? g.toNonIndexed() : g; return ng; });
  // Only keep attributes all parts share
  const keep = ['position', 'normal', 'aShade', 'color'];
  const common = keep.filter((k) => prepared.every((g) => g.attributes[k]));
  for (const g of prepared) for (const k of Object.keys(g.attributes)) if (!common.includes(k)) g.deleteAttribute(k);
  // Tessellate so large flat faces shatter into many small shards instead of two big triangles
  const merged = mergeGeometries(prepared, false);
  const geo = tessellate ? new TessellateModifier(0.16, 6).modify(merged) : merged;
  const pos = geo.attributes.position;
  const n = pos.count;
  const center = new Float32Array(n * 3), dir = new Float32Array(n * 3), phase = new Float32Array(n);
  const rnd = seeded(seed);
  for (let i = 0; i < n; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    // fly outward from the model centre with some randomness
    const len = Math.hypot(cx, cy, cz) || 1;
    const dx = cx / len * 0.6 + (rnd() - 0.5), dy = cy / len * 0.6 + (rnd() - 0.5) + 0.2, dz = cz / len * 0.6 + (rnd() - 0.5);
    const ph = rnd();
    for (let k = 0; k < 3; k++) {
      center.set([cx, cy, cz], (i + k) * 3);
      dir.set([dx, dy, dz], (i + k) * 3);
      phase[i + k] = ph;
    }
  }
  geo.setAttribute('aCenter', new THREE.BufferAttribute(center, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  if (geo.attributes.aShade && !geo.attributes.color) {
    const sh = geo.attributes.aShade; const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = 0.62 + 0.38 * sh.getX(i); col[i * 3] = v; col[i * 3 + 1] = v; col[i * 3 + 2] = v; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  geo.computeBoundingSphere();
  return geo;
}

const box = (w, h, d, r = 0.03) => new RoundedBoxGeometry(w, h, d, 2, r);
const cyl = (rt, rb, h, seg = 24) => new THREE.CylinderGeometry(rt, rb, h, seg);

/* ── Truck ─────────────────────────────────────────────────── */
export function truck() {
  const P = [];
  P.push(part(box(1.65, 0.85, 0.84, 0.05), { p: [-0.52, 0.375, 0], shade: 0.9 }));            // trailer
  P.push(part(box(0.58, 0.6, 0.76, 0.05), { p: [0.71, 0.25, 0], shade: 0.8 }));                // cab
  P.push(part(box(0.36, 0.27, 0.72, 0.04), { p: [1.17, 0.085, 0], shade: 0.8 }));              // hood
  P.push(part(box(0.5, 0.26, 0.74, 0.03), { p: [0.6, 0.66, 0], r: [0, 0, 0.35], shade: 0.75 })); // wind deflector
  P.push(part(box(0.56, 0.22, 0.7, 0.01), { p: [0.71, 0.4, 0.06], shade: 0.25 }));             // windows band
  P.push(part(box(2.6, 0.08, 0.5, 0.01), { p: [0, -0.07, 0], shade: 0.3 }));                   // chassis
  for (const z of [-0.4, 0.4]) for (const x of [-1.08, -0.74, 0.76, 1.18]) {
    P.push(part(cyl(0.17, 0.17, 0.12), { p: [x, -0.22, z], r: [Math.PI / 2, 0, 0], shade: 0.15 }));
    P.push(part(cyl(0.07, 0.07, 0.13), { p: [x, -0.22, z], r: [Math.PI / 2, 0, 0], shade: 0.7 }));
  }
  return finish(P, 11);
}

/* ── Computer ──────────────────────────────────────────────── */
export function computer() {
  const P = [];
  P.push(part(box(1.9, 1.1, 0.08, 0.04), { p: [0, 0.6, 0], shade: 0.85 }));                    // monitor
  P.push(part(box(1.7, 0.9, 0.02, 0.005), { p: [0, 0.6, 0.045], shade: 0.18 }));              // screen
  // a rising chart on the screen, as thin bars
  [0.3, 0.45, 0.38, 0.62, 0.55, 0.85, 0.95].forEach((v, i) => {
    P.push(part(box(0.12, v * 0.6, 0.02, 0.005), { p: [-0.66 + i * 0.22, 0.2 + v * 0.3, 0.06], shade: 0.9 }));
  });
  P.push(part(box(0.2, 0.36, 0.08, 0.02), { p: [0, -0.12, 0], shade: 0.6 }));                 // neck
  P.push(part(cyl(0.42, 0.42, 0.04, 32), { p: [0, -0.3, 0.08], s: [1, 1, 0.55], shade: 0.65 })); // base
  P.push(part(box(1.5, 0.06, 0.46, 0.02), { p: [0, -0.59, 0.45], shade: 0.8 }));              // keyboard
  for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) {
    P.push(part(box(0.07, 0.02, 0.07, 0.005), { p: [-0.66 + c * 0.094, -0.55, 0.3 + r * 0.095], shade: 0.35 }));
  }
  P.push(part(new THREE.SphereGeometry(1, 20, 14), { p: [1.05, -0.56, 0.5], s: [0.1, 0.05, 0.15], shade: 0.75 })); // mouse
  return finish(P, 23);
}

/* ── Warehouse ─────────────────────────────────────────────── */
export function warehouse() {
  const P = [];
  P.push(part(box(2.8, 0.8, 1.3, 0.02), { p: [0, -0.15, 0], shade: 0.85 }));                    // walls
  // gable roof: triangular prism extruded along x
  const tri = new THREE.Shape([new THREE.Vector2(-0.68, 0.25), new THREE.Vector2(0.68, 0.25), new THREE.Vector2(0, 0.64)]);
  const roof = new THREE.ExtrudeGeometry(tri, { depth: 2.86, bevelEnabled: false });
  P.push(part(roof, { p: [-1.43, 0, 0], r: [0, Math.PI / 2, 0], shade: 0.55 }));
  for (const cx of [-1.0, -0.5, 0, 0.5, 1.0]) P.push(part(box(0.32, 0.55, 0.03, 0.005), { p: [cx, -0.28, 0.655], shade: 0.22 })); // dock doors
  P.push(part(box(2.7, 0.04, 0.26, 0.005), { p: [0, 0.12, 0.78], shade: 0.4 }));                // canopy
  for (const x of [-1.3, 0, 1.3]) P.push(part(cyl(0.015, 0.015, 0.66), { p: [x, -0.22, 0.88], shade: 0.3 }));
  P.push(part(box(2.9, 0.02, 0.55, 0.005), { p: [0, -0.56, 0.92], shade: 0.65 }));              // apron
  P.push(part(box(0.9, 0.18, 0.02, 0.005), { p: [-0.6, 0.02, 0.66], shade: 0.95 }));            // sign
  return finish(P, 37);
}

/* ── Canada ────────────────────────────────────────────────── */
/** Project lon/lat to the map plane (x right, z toward viewer; north = −z). */
export function canadaPlan() {
  const proj = lccProjector();
  const raw = MAINLAND.map(([lo, la]) => proj(lo, la));
  const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = 2.8 / (maxX - minX), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const toXZ = (lon, lat) => { const [x, y] = proj(lon, lat); return [(x - cx) * k, -(y - cy) * k]; };
  return {
    mainland: MAINLAND.map(([lo, la]) => toXZ(lo, la)),
    islands: ISLANDS.map((isl) => isl.map(([lo, la]) => toXZ(lo, la))),
    pins: DCS.map((d) => ({ ...d, xz: toXZ(d.lon, d.lat) })),
  };
}

/** City pins + west→east route, shared by the procedural map and the relief GLB. */
export function canadaPins() {
  const { pins } = canadaPlan();
  const P = [];
  const H = 0.13;
  pins.forEach(({ xz: [x, z] }) => {
    P.push(part(cyl(0.007, 0.007, H), { p: [x, H / 2, z], shade: 0.2 }));
    P.push(part(new THREE.SphereGeometry(0.022, 16, 12), { p: [x, H, z], shade: 0.15 }));
  });
  const pts = [];
  for (let i = 0; i < pins.length; i++) {
    const [x, z] = pins[i].xz; pts.push(new THREE.Vector3(x, H, z));
    if (i < pins.length - 1) { const [nx, nz] = pins[i + 1].xz; pts.push(new THREE.Vector3((x + nx) / 2, H + 0.07, (z + nz) / 2)); }
  }
  P.push(part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.007, 8, false), { shade: 0.3 }));
  const labels = pins.map((p) => ({ text: p.city.toUpperCase(), pos: [p.xz[0], H + 0.07, p.xz[1]] }));
  return { parts: P, labels };
}

export function canada() {
  const { mainland, islands } = canadaPlan();
  const P = [];
  const slab = (ring, depth, shade) => {
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))); // shape in XY, y = north
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    P.push(part(g, { p: [0, 0, 0], r: [-Math.PI / 2, 0, 0], shade }));
  };
  slab(mainland, 0.07, 0.85);
  islands.forEach((isl) => slab(isl, 0.05, 0.8));
  const pins = canadaPins();
  const geo = finish(P.concat(pins.parts), 41);
  geo.userData.labels = pins.labels;
  return geo;
}

/* ── Brain ─────────────────────────────────────────────────── */
export function brain() {
  const P = [];
  // Fold field in 3D (plane waves — no pole singularities). Rounded ridges = gyri, soft valleys = sulci.
  const dirs = [[0.82, 0.31, 0.48], [-0.35, 0.74, 0.57], [0.52, -0.46, 0.72], [0.1, 0.95, -0.3]];
  const freqs = [6.8, 5.7, 7.6, 4.9];
  const ridge = (p, k, side) => {
    const [dx, dy, dz] = dirs[k];
    const wander = 0.9 * Math.sin(2.1 * (p[1] * 0.8 + p[2] * 0.6) + side) + 0.5 * Math.sin(1.7 * (p[0] * side) - 1.3 * p[2]);
    return Math.pow(Math.abs(Math.sin(freqs[k] * (dx * p[0] + dy * p[1] + dz * p[2]) + wander + k)), 0.55);
  };
  const hemi = (side) => {
    let g = mergeVertices(new THREE.IcosahedronGeometry(1, 30));   // weld → smooth shading
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      const f = 0.38 * ridge(p, 0, side) + 0.3 * ridge(p, 1, side) + 0.2 * ridge(p, 2, side) + 0.12 * ridge(p, 3, side);
      const fine = 0.3 * Math.pow(Math.abs(Math.sin(11.5 * (0.6 * p[0] + 0.8 * p[2]) + 2.0 * p[1])), 0.6);
      let w = 0.17 * (0.75 * f + 0.25 * fine) - 0.1;
      // medial face: flatten toward the fissure and quiet the folds there
      const medial = Math.min(1, Math.max(0, (side * p[0] - 0.25) / 0.5));
      const ms = medial * medial * (3 - 2 * medial);
      w *= 1 - 0.85 * ms;
      const r = 1 + w;
      pos.setXYZ(i, p[0] * r * (1 - 0.25 * ms), p[1] * r, p[2] * r);
    }
    g.computeVertexNormals();
    // elongated front→back, taller than wide; the two halves shoulder to shoulder with a slight cant
    P.push(part(g, { p: [side * 0.4, 0.06, 0], r: [0, side * 0.05, side * -0.07], s: [0.5, 0.72, 0.92], shade: 0.85 }));
  };
  hemi(-1); hemi(1);
  let cb = mergeVertices(new THREE.IcosahedronGeometry(1, 14));
  const cp = cb.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
    const r = 1 + 0.05 * Math.pow(Math.abs(Math.sin(9 * x + 3 * z)), 0.7) - 0.03;
    cp.setXYZ(i, x * r, y * r, z * r);
  }
  cb.computeVertexNormals();
  P.push(part(cb, { p: [0, -0.5, -0.42], s: [0.42, 0.24, 0.3], shade: 0.7 }));                 // cerebellum
  P.push(part(cyl(0.09, 0.12, 0.5, 16), { p: [0, -0.72, -0.2], r: [0.25, 0, 0], shade: 0.6 }));  // brain stem
  return finish(P, 53);
}

export const MODELS = { truck, computer, warehouse, canada, brain };


/* ── Lifelike GLB assets ───────────────────────────────────────
   Drop a model at /public/models/<name>.glb and it replaces the procedural stand-in.
   The mesh is centred, scaled so its longest axis spans 2.8 units (matching the
   procedural models), and given the same shatter attributes. Material colours
   become per-vertex greys so the site's single mono material still applies. */
let gltfLoader = null;
function getLoader() {
  if (gltfLoader) return gltfLoader;
  // All site models are meshopt-compressed; Draco is deliberately not wired (keeps a 150 KB decoder out of the bundle)
  gltfLoader = new GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  return gltfLoader;
}

/** Per-model orientation fixes (radians, applied after normalisation) and label hooks. */
const GLB_ORIENT = { brain: [0, 0, 0], truck: [0, 0, 0], computer: [0, 0, 0], warehouse: [0, 0, 0] };

let manifestPromise = null;
/** /models/manifest.json lists the GLBs that exist: { "brain": "brain.glb", ... }. One fetch, no 404 noise. */
function manifest() {
  if (!manifestPromise) manifestPromise = fetch('/models/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return manifestPromise;
}

export async function loadModel(name) {
  const list = await manifest();
  if (!list[name]) return null;
  const url = `/models/${list[name]}`;
  const gltf = await getLoader().loadAsync(url);
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  const parts = [];
  // Quantized attributes (KHR_mesh_quantization / meshopt) are Int8/Int16; copy to Float32 before transforming
  const toFloat = (attr) => {
    const n = attr.count, sz = attr.itemSize, out = new Float32Array(n * sz);
    for (let i = 0; i < n; i++) { out[i * sz] = attr.getX(i); if (sz > 1) out[i * sz + 1] = attr.getY(i); if (sz > 2) out[i * sz + 2] = attr.getZ(i); }
    return new THREE.BufferAttribute(out, sz);
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.clone();
    const pos = toFloat(g.attributes.position);
    const clean = new THREE.BufferGeometry();
    clean.setAttribute('position', pos);
    if (g.attributes.normal) clean.setAttribute('normal', toFloat(g.attributes.normal));
    if (g.index) clean.setIndex(g.index.clone());
    g = clean;
    g.applyMatrix4(o.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    const n = g.attributes.position.count;
    // material colour → per-vertex grey (luminance), so one mono material lights everything
    const c = (o.material && o.material.color) ? o.material.color : new THREE.Color(0.8, 0.8, 0.8);
    const lum = Math.min(1, Math.max(0.35, 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b));
    const col = new Float32Array(n * 3).fill(0.4 + 0.36 * lum);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aShade', new THREE.BufferAttribute(new Float32Array(n).fill(lum), 1));
    if (!g.attributes.normal) g.computeVertexNormals();
    parts.push(g);
  });
  if (!parts.length) return null;
  if (name === 'canada') {
    // Authored in the site's own frame (same LCC fit as canadaPlan), so no recentring; add the pins + route
    const pins = canadaPins();
    const pinParts = pins.parts.map((g) => (g.index ? g.toNonIndexed() : g));
    for (const g of pinParts) {
      const n = g.attributes.position.count;
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(0.42), 3));
    }
    const geo = finish(parts.concat(pinParts), 97, { tessellate: false });
    geo.userData.labels = pins.labels;
    return geo;
  }
  const merged = mergeGeometries(parts, false);
  merged.computeBoundingBox();
  const size = new THREE.Vector3(); merged.boundingBox.getSize(size);
  const centre = new THREE.Vector3(); merged.boundingBox.getCenter(centre);
  const s = 2.8 / Math.max(size.x, size.y, size.z);
  const rot = GLB_ORIENT[name] || [0, 0, 0];
  merged.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, 0, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(s, s, s)).multiply(new THREE.Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z)));
  if (!merged.attributes.normal) merged.computeVertexNormals();
  // Dense scans don't need tessellating; coarse low-poly assets do
  const tris = merged.attributes.position.count / 3;
  return finish([merged], 97, { tessellate: tris < 20000 });
}
