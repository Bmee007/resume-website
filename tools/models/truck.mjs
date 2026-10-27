// Procedural North American semi-truck (long-nose sleeper tractor + 53' dry van).
// Metres. Y up. Nose toward +Z, left side toward +X (site convention).
// Entry point: `node truck.mjs out.glb`. Parts live in truck-lib / truck-cab / truck-details / truck-trailer.
import fs from 'node:fs';
import {
  THREE, LoftGeometry, mergeGeometries, mergeVertices, parts, V3, V2, T, RX, RY, RZ, mul, add, box, rbox, cylX, cylY, cylZ, sphere,
  tube, creased, rrect, loft, shapeFrom, ringGeom, plate, TY, ST, D1, D2, T1, T2, XO, XI, XS,
} from './truck-lib.mjs';
import { buildCab } from './truck-cab.mjs';
import { buildDetails } from './truck-details.mjs';
import { buildTrailer } from './truck-trailer.mjs';

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/truck.glb';

// ---------- wheels ----------
function tyreGeom(seg = 56) {
  const R = 0.525, rb = 0.29;
  const p = [[rb, -0.1], [0.33, -0.13], [0.40, -0.148], [0.46, -0.15], [0.50, -0.14], [0.515, -0.125], [R, -0.105]];
  const gw = 0.011, gd = 0.016;
  for (const g of [-0.066, -0.022, 0.022, 0.066]) p.push([R, g - gw], [R - gd, g - gw + 0.003], [R - gd, g + gw - 0.003], [R, g + gw]);
  p.push([R, 0.105], [0.515, 0.125], [0.50, 0.14], [0.46, 0.15], [0.40, 0.148], [0.33, 0.13], [rb, 0.1]);
  const lathe = new THREE.LatheGeometry(p.map(([r, y]) => V2(r, y)), seg);
  lathe.rotateZ(-Math.PI / 2); // axis Y -> X, +Y -> +X
  return creased(lathe, 35);
}
const TYRE = tyreGeom(), TYRE_LO = tyreGeom(36); // inner duals are mostly hidden: cheaper tyre
// rim: dish = +1 (face dished outward, steer), -1 (dished inward, outer dual), 0 (plain inner dual)
function rimGeom(dish) {
  const gs = [];
  const discX = dish > 0 ? 0.07 : dish < 0 ? -0.075 : 0;
  const coneStartX = dish > 0 ? -0.01 : dish < 0 ? 0.085 : 0.0;
  const prof = [[0.255, -0.11], [0.29, -0.115], [0.29, -0.1], [0.265, -0.1], [0.265, 0.1], [0.29, 0.1], [0.29, 0.115], [0.26, 0.11], [0.26, coneStartX], [0.235, discX]];
  const l = new THREE.LatheGeometry(prof.map(([r, y]) => V2(r, y)), 48);
  l.rotateZ(-Math.PI / 2);
  gs.push(creased(l, 35));
  // disc with hand holes
  const outer = []; const N = 48;
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; outer.push([0.236 * Math.cos(a), 0.236 * Math.sin(a)]); }
  const holes = [];
  const hub = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; hub.push([0.112 * Math.cos(a), 0.112 * Math.sin(a)]); }
  holes.push(hub);
  if (dish !== 0) for (let k = 0; k < 5; k++) {
    const a0 = ((18 + 72 * k) * Math.PI) / 180; const h = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; h.push([0.188 * Math.cos(a0) + 0.036 * Math.cos(a), 0.188 * Math.sin(a0) + 0.036 * Math.sin(a)]); }
    holes.push(h);
  }
  const disc = new THREE.ShapeGeometry(shapeFrom(outer, holes), 4);
  disc.deleteAttribute('uv');
  // ShapeGeometry faces +Z; rotate so it faces +X (outer face)
  disc.applyMatrix4(mul(T(discX, 0, 0), RY(Math.PI / 2)));
  gs.push(disc);
  if (dish !== 0) {
    // back of disc (so hand holes are not see-through to nothing), brake drum
    const drum = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 32); drum.applyMatrix4(mul(T(discX - 0.115, 0, 0), RZ(Math.PI / 2))); gs.push(drum);
    // hub + lug nuts
    const hubC = new THREE.CylinderGeometry(0.113, 0.113, 0.05, 32); hubC.applyMatrix4(mul(T(discX + 0.02, 0, 0), RZ(Math.PI / 2))); gs.push(hubC);
    if (dish > 0) { const cap = new THREE.SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(0.6, 1, 1); cap.applyMatrix4(mul(T(discX + 0.045, 0, 0), RZ(-Math.PI / 2))); gs.push(cap); }
    else { const c2 = new THREE.CylinderGeometry(0.075, 0.08, 0.06, 24); c2.applyMatrix4(mul(T(discX + 0.07, 0, 0), RZ(Math.PI / 2))); gs.push(c2); }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const nut = new THREE.CylinderGeometry(0.019, 0.019, 0.04, 6); nut.applyMatrix4(mul(T(discX + 0.02, 0.143 * Math.cos(a), 0.143 * Math.sin(a)), RZ(Math.PI / 2))); gs.push(nut);
    }
  } else {
    const hubC = new THREE.CylinderGeometry(0.113, 0.113, 0.04, 24); hubC.applyMatrix4(mul(T(discX, 0, 0), RZ(Math.PI / 2))); gs.push(hubC);
  }
  for (const g of gs) { if (g.attributes.uv) g.deleteAttribute('uv'); if (!g.attributes.normal) g.computeVertexNormals(); }
  return mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)));
}
const RIM_OUT = rimGeom(1), RIM_IN = rimGeom(-1), RIM_PLAIN = rimGeom(0);
function wheel(x, y, z, rim, tyre = TYRE) {
  const m = x >= 0 ? T(x, y, z) : mul(T(x, y, z), RY(Math.PI));
  add(tyre.clone(), m);
  add(rim.clone(), m);
}
// steer
wheel(XS, TY, ST, RIM_OUT); wheel(-XS, TY, ST, RIM_OUT);
for (const z of [D1, D2, T1, T2]) {
  wheel(XO, TY, z, RIM_IN); wheel(-XO, TY, z, RIM_IN);
  wheel(XI, TY, z, RIM_PLAIN, TYRE_LO); wheel(-XI, TY, z, RIM_PLAIN, TYRE_LO);
}

// ---------- tractor frame & drivetrain ----------
for (const s of [1, -1]) box(0.09, 0.28, 8.3, s * 0.43, 0.86, 1.45); // rails z -2.7 .. 5.6
for (const z of [5.3, 3.6, 2.2, 0.9, -0.1, -1.1, -2.6]) box(0.86, 0.22, 0.08, 0, 0.86, z);
box(0.9, 0.3, 0.1, 0, 0.86, -2.68); // rear crossmember
box(0.96, 0.025, 1.5, 0, 1.01, 0.1); // deck plate
rbox(0.95, 0.45, 2.0, 0.04, 0, 1.0, 4.4); // engine block (under hood)
cylZ(0.17, 0.9, 0, 0.72, 2.75); // transmission
tube([[0, 0.66, 2.3], [0.05, 0.6, 0.8], [0.1, 0.56, -0.3]], 0.045, 8, 10); // driveshaft
cylZ(0.3, 0.9, -0.95, 0.72, 1.25); // DEF tank (right)
rbox(0.5, 0.5, 0.6, 0.03, 0.95, 0.75, 1.25); // battery box (left)
// drive axles + suspension
for (const z of [D1, D2]) {
  cylX(0.085, 1.95, 0, TY, z);
  const diff = new THREE.SphereGeometry(0.2, 20, 12); diff.scale(1, 1, 1.15); add(diff, T(0.08, TY, z + 0.06));
  for (const s of [1, -1]) {
    cylY(0.14, 0.2, s * 0.52, 0.62, z - 0.42); // air bag
    box(0.08, 0.06, 1.05, s * 0.52, 0.5, z + 0.1); // trailing arm
    cylZ(0.085, 0.22, s * 0.6, 0.68, z - 0.2, 16); // brake chamber
  }
}
// steer axle
cylX(0.055, 1.9, 0, TY - 0.03, ST);
for (const s of [1, -1]) box(0.08, 0.12, 1.5, s * 0.5, 0.62, ST); // leaf springs
// drive fenders (half fenders) + mudflaps
for (const s of [1, -1]) for (const z of [D1, D2]) {
  const pts = []; const r0 = 0.57, r1 = 0.61, a0 = 0.35, a1 = Math.PI - 0.35, n = 20;
  // profile in (z,y): sweep an arc; build as loft of thin rectangles
  const secs = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * (a1 - a0); const cz = Math.cos(a), cy = Math.sin(a);
    const w0 = 0.66, cx = s * 0.92;
    secs.push([V3(cx - w0 / 2, TY + r0 * cy, z + r0 * cz), V3(cx + w0 / 2, TY + r0 * cy, z + r0 * cz), V3(cx + w0 / 2, TY + r1 * cy, z + r1 * cz), V3(cx - w0 / 2, TY + r1 * cy, z + r1 * cz)]);
  }
  loft(secs, { capStart: true, capEnd: true }, 40);
  box(0.05, 0.3, 0.05, s * 0.92, TY + 0.6 + 0.15, z); // bracket
}
for (const s of [1, -1]) { box(0.6, 0.6, 0.02, s * 0.92, 0.56, D2 - 0.72); box(0.62, 0.05, 0.06, s * 0.92, 0.88, D2 - 0.7); box(0.05, 0.05, 0.4, s * 0.6, 0.9, D2 - 0.5); }
// fifth wheel
plate([[-0.46, 0.45], [0.46, 0.45], [0.46, -0.3], [0.3, -0.45], [0.17, -0.45], [0.055, -0.12], [-0.055, -0.12], [-0.17, -0.45], [-0.3, -0.45], [-0.46, -0.3]].map(([x, z]) => [x, z - 0.78]), 0.045, 1.245, 0.01);
for (const s of [1, -1]) box(0.1, 0.19, 0.5, s * 0.36, 1.11, -0.78);
box(1.0, 0.03, 0.7, 0, 1.03, -0.78);

// ---------- hood ----------
// Two-tier section: wide fender shoulders + narrower hood crown. CCW from bottom-right.
function hoodSec(z, yb, yf, yc, wf, wc, rf, rc, rb = 0.06, n = 6) {
  const arc = (cx, cy, r, a0) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
  const pts = [
    ...arc(wf / 2 - rb, yb + rb, rb, -Math.PI / 2),
    ...arc(wf / 2 - rf, yf - rf, rf, 0),
    [wc / 2 + 0.02, yf], [wc / 2, yf + 0.02],
    ...arc(wc / 2 - rc, yc - rc, rc, 0),
    ...arc(-wc / 2 + rc, yc - rc, rc, Math.PI / 2),
    [-wc / 2, yf + 0.02], [-wc / 2 - 0.02, yf],
    ...arc(-wf / 2 + rf, yf - rf, rf, Math.PI / 2),
    ...arc(-wf / 2 + rb, yb + rb, rb, Math.PI),
  ];
  return pts.map(([x, y]) => V3(x, y, z));
}
const HF = { z: 5.72, yb: 0.9, yf: 1.4, yc: 1.84, wf: 2.04, wc: 1.72, rf: 0.14, rc: 0.3 };
const hoodSecs = [
  hoodSec(3.45, 1.12, 1.52, 2.0, 2.44, 1.96, 0.14, 0.28),
  hoodSec(4.1, 1.08, 1.5, 1.97, 2.38, 1.9, 0.14, 0.29),
  hoodSec(4.7, 1.02, 1.47, 1.93, 2.28, 1.84, 0.14, 0.3),
  hoodSec(5.2, 0.96, 1.44, 1.89, 2.16, 1.78, 0.14, 0.3),
  hoodSec(5.55, 0.92, 1.41, 1.86, 2.07, 1.74, 0.14, 0.3),
  hoodSec(HF.z, HF.yb, HF.yf, HF.yc, HF.wf, HF.wc, HF.rf, HF.rc),
];
loft(hoodSecs, { capStart: false, capEnd: false }, 30);
// hood front face with grille opening (ShapeGeometry faces +Z)
{
  const outer = hoodSec(0, HF.yb, HF.yf, HF.yc, HF.wf, HF.wc, HF.rf, HF.rc).map((v) => [v.x, v.y]);
  const grille = rrect(0, 1.2, 1.76, 1.3, 0.08, 0.08);
  const face = new THREE.ShapeGeometry(shapeFrom(outer, [grille]), 4); add(face, T(0, 0, 5.72));
  // grille recess back plate, bars, bezel
  box(1.3, 0.56, 0.02, 0, 1.48, 5.615);
  for (let i = 0; i < 7; i++) box(1.26, 0.03, 0.05, 0, 1.24 + i * 0.08, 5.67);
  box(0.035, 0.54, 0.05, 0, 1.48, 5.675);
  add(ringGeom(1.36, 0.62, 0.1, 0.03, 0.03), T(0, 1.48, 5.72));
  // headlights: bezel + recessed lens
  for (const s of [1, -1]) {
    add(ringGeom(0.42, 0.2, 0.05, 0.022, 0.025), T(s * 0.74, 1.08, 5.72));
    rbox(0.37, 0.15, 0.03, 0.01, s * 0.74, 1.08, 5.715);
  }
  // hood badge / emblem
  rbox(0.14, 0.1, 0.02, 0.01, 0, 1.82, 5.725);
}
// bumper (top-view shape), two-piece with lower air dam
{
  const bump = (zf, xi, zb, w) => {
    const pts = [];
    const qa = new THREE.QuadraticBezierCurve(V2(xi, zf), V2(xi + 0.32, zf - 0.02), V2(w, zb)).getPoints(10);
    const qb = new THREE.QuadraticBezierCurve(V2(w - 0.12, zb), V2(xi + 0.28, zf - 0.14), V2(xi, zf - 0.12)).getPoints(10);
    // right half then mirror: build full outline CCW in (x,z)
    const right = qa.map((p) => [p.x, p.y]); const rightIn = qb.map((p) => [p.x, p.y]);
    const outline = [...right, ...rightIn, ...rightIn.slice().reverse().map(([x, z]) => [-x, z]), ...right.slice().reverse().map(([x, z]) => [-x, z])];
    return outline;
  };
  plate(bump(5.92, 0.85, 5.3, 1.25), 0.5, 0.96, 0.03);
  plate(bump(5.86, 0.8, 5.35, 1.2), 0.12, 0.45, 0.012);
  for (const s of [1, -1]) { add(ringGeom(0.22, 0.14, 0.03, 0.02, 0.02), T(s * 0.95, 0.7, 5.84)); } // fog lights (approx on curve)
  box(0.3, 0.16, 0.02, 0, 0.62, 5.93); // licence plate
  for (const s of [1, -1]) box(0.08, 0.06, 0.1, s * 0.35, 0.38, 5.82); // tow hooks
}
// steer fender arches
for (const s of [1, -1]) {
  const r0 = 0.56, r1 = 0.65, a0 = -0.15, a1 = Math.PI + 0.15, n = 22, w0 = 0.5, cx = s * 0.98;
  const secs = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * (a1 - a0); const cz = Math.cos(a), cy = Math.sin(a);
    secs.push([V3(cx - w0 / 2, TY + r0 * cy, ST + r0 * cz), V3(cx + w0 / 2, TY + r0 * cy, ST + r0 * cz), V3(cx + w0 / 2, TY + r1 * cy, ST + r1 * cz), V3(cx - w0 / 2, TY + r1 * cy, ST + r1 * cz)]);
  }
  loft(secs, { capStart: true, capEnd: true }, 40);
}


// ---------- cab, details, trailer ----------
const triSoFar = () => parts.reduce((a, g) => a + g.attributes.position.count / 3, 0);
if (process.env.TRUCK_DEBUG) console.log('tractor-before-cab', triSoFar());
buildCab();
if (process.env.TRUCK_DEBUG) console.log('after cab', triSoFar());
buildDetails();
if (process.env.TRUCK_DEBUG) console.log('after details', triSoFar());
buildTrailer();
if (process.env.TRUCK_DEBUG) console.log('after trailer', triSoFar());

// ---------- merge, weld, export ----------
let merged = mergeGeometries(parts, false);
merged = mergeVertices(merged, 1e-4);
const pos = merged.attributes.position, nor = merged.attributes.normal;
merged.computeBoundingBox();
const bb = merged.boundingBox;
const triCount = merged.index.count / 3;
console.log('tris', triCount, 'verts', pos.count, 'bbox', bb.min.toArray().map((v) => +v.toFixed(2)), bb.max.toArray().map((v) => +v.toFixed(2)));

function writeGLB(geom, file) {
  const p = new Float32Array(geom.attributes.position.array);
  const n = new Float32Array(geom.attributes.normal.array);
  const idx = new Uint32Array(geom.index.array);
  const pad4 = (n) => (n + 3) & ~3;
  const bufs = [p, n, idx]; const views = []; let off = 0;
  for (const b of bufs) { views.push({ buffer: 0, byteOffset: off, byteLength: b.byteLength }); off += pad4(b.byteLength); }
  views[0].target = 34962; views[1].target = 34962; views[2].target = 34963;
  const bin = Buffer.alloc(off);
  for (let i = 0; i < bufs.length; i++) Buffer.from(bufs[i].buffer, bufs[i].byteOffset, bufs[i].byteLength).copy(bin, views[i].byteOffset);
  const json = {
    asset: { version: '2.0', generator: 'resume-website procedural truck builder' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'truck' }],
    meshes: [{ name: 'truck', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0, mode: 4 }] }],
    materials: [{ name: 'clay', pbrMetallicRoughness: { baseColorFactor: [0.78, 0.8, 0.82, 1], metallicFactor: 0, roughnessFactor: 0.6 } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: p.length / 3, type: 'VEC3', min: bb.min.toArray(), max: bb.max.toArray() },
      { bufferView: 1, componentType: 5126, count: n.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5125, count: idx.length, type: 'SCALAR' },
    ],
    bufferViews: views, buffers: [{ byteLength: bin.length }],
  };
  let js = Buffer.from(JSON.stringify(json)); const jsPad = pad4(js.length); js = Buffer.concat([js, Buffer.alloc(jsPad - js.length, 0x20)]);
  const header = Buffer.alloc(12); header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const ch1 = Buffer.alloc(8); ch1.writeUInt32LE(js.length, 0); ch1.writeUInt32LE(0x4e4f534a, 4);
  const ch2 = Buffer.alloc(8); ch2.writeUInt32LE(bin.length, 0); ch2.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([header, ch1, js, ch2, bin]));
  console.log('wrote', file, fs.statSync(file).size, 'bytes');
}
writeGLB(merged, OUT);
