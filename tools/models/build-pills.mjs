// Builds pills.glb: North-American amber prescription vial with a white child-resistant
// push-and-turn cap, wrapped pharmacy label with a raised Rx symbol and text-line relief, plus
// loose capsules and scored tablets lying at the base. Pure generated geometry (three.js in Node,
// no external assets). Units: millimetres. Y up, label/Rx faces +Z, y = 0 at the vial's foot ring.
//
//   node tools/models/build-pills.mjs /tmp/pills-raw.glb
//   npx -y @gltf-transform/cli meshopt /tmp/pills-raw.glb public/models/pills.glb
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { TessellateModifier } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/modifiers/TessellateModifier.js';
import { GLTFExporter } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/pills.glb';

// ---- FileReader polyfill for GLTFExporter (binary path) --------------------
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};

// ---- helpers ----------------------------------------------------------------
const DEG = Math.PI / 180, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const place = (g, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
  g.applyMatrix4(m); return g;
};

// Indexed grid surface. Rows i = 0..NI, columns j = 0..NJ (wrap closes the column loop).
// Winding gives outward normals for a revolve whose profile runs CCW in the (r, y) plane.
function grid(NI, NJ, f, { wrap = false } = {}) {
  const cols = wrap ? NJ : NJ + 1; const pos = []; const idx = [];
  for (let i = 0; i <= NI; i++) for (let j = 0; j < cols; j++) pos.push(...f(i, j));
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) {
    const j1 = (j + 1) % cols; const a = i * cols + j, b = i * cols + j1, c = (i + 1) * cols + j, d = (i + 1) * cols + j1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Flip winding if the first non-degenerate triangle's normal disagrees with `want`.
function orient(g, want) {
  const p = g.attributes.position, ix = g.index.array; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let t = 0; t < ix.length; t += 3) {
    A.fromBufferAttribute(p, ix[t]); B.fromBufferAttribute(p, ix[t + 1]); C.fromBufferAttribute(p, ix[t + 2]);
    const n = B.sub(A).cross(C.sub(A)); if (n.lengthSq() < 1e-9) continue;
    if (n.dot(want) < 0) { for (let k = 0; k < ix.length; k += 3) { const tmp = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = tmp; } }
    break;
  }
  g.computeVertexNormals(); return g;
}

// Revolve a profile (array of {r, y, k?}) around Y, CCW in (r, y) = solid on the left.
// `hard: true` on a point starts a new smoothing run (crease). Partial sweeps are capped with the
// triangulated profile polygon. `rfn(p, phi)` may modulate the radius (knurls).
function revolve(profile, { segs = 128, phi0 = 0, phi1 = TAU, rfn = null } = {}) {
  const full = Math.abs(phi1 - phi0 - TAU) < 1e-9;
  const runs = [[]];
  for (const p of profile) { const cur = runs[runs.length - 1]; if (p.hard && cur.length) { cur.push(p); runs.push([p]); } else cur.push(p); }
  const out = [];
  const P = (p, phi) => { const r = rfn ? rfn(p, phi) : p.r; return [r * Math.sin(phi), p.y, r * Math.cos(phi)]; };
  for (const run of runs) {
    if (run.length < 2) continue;
    out.push(grid(run.length - 1, segs, (i, j) => P(run[i], phi0 + (phi1 - phi0) * (j / segs)), { wrap: full }));
  }
  if (!full) {
    const tris = THREE.ShapeUtils.triangulateShape(profile.map((p) => new THREE.Vector2(p.r, p.y)), []);
    for (const [phi, sgn] of [[phi0, -1], [phi1, 1]]) {
      const pos = []; const idx = [];
      for (const p of profile) pos.push(...P(p, phi));
      for (const t of tris) idx.push(...t);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      out.push(orient(g, new THREE.Vector3(Math.cos(phi) * sgn, 0, -Math.sin(phi) * sgn)));
    }
  }
  return out;
}
const pt = (r, y, extra = {}) => ({ r, y, ...extra });
const arc = (cx, cy, rad, a0, a1, n, extra = (a) => ({})) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return pt(cx + rad * Math.cos(a), cy + rad * Math.sin(a), extra(a)); });

// Wrap a flat geometry (x = arc length along the body, y = height, z = radial relief) onto a
// cylinder-ish surface of radius baseR(y), centred at angle phiC. Normals recomputed by caller.
function wrapOnBody(g, phiC, baseR) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getY(i), z = p.getZ(i); const R0 = baseR(v); const R = R0 + z; const phi = phiC + u / R0;
    p.setXYZ(i, R * Math.sin(phi), v, R * Math.cos(phi));
  }
  return g;
}
// Non-indexed geometry -> merged positions, creased normals (hard edges above `angle`), indexed.
function creased(g, angle = 38 * DEG) {
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  let m = mergeVertices(g, 1e-4); m = toCreasedNormals(m, angle); return mergeVertices(m, 1e-4);
}
const tessellate = (g, maxEdge = 1.2, iters = 8) => new TessellateModifier(maxEdge, iters).modify(g);

// Parts become separate glTF materials; the site loader turns each material's baseColor luminance into a
// grey for that part (grey = 0.28 + 0.48 * L), so the L values below ARE the model's tonal design.
const PART_LUM = {
  vial: 0.18,        // amber, translucent-looking dark
  cap: 0.92,         // white child-resistant cap
  label: 0.95,       // paper label
  relief: 0.6,       // label text / barcode relief a touch darker than the paper
  rx: 0.42,          // the Rx glyph itself, a little darker again so it stays the readable focal mark
  capsuleCap: 0.9,   // capsule: bright half
  capsuleBody: 0.55, // capsule: mid half
  tablets: 0.9,      // scored white tablets
  shadow: 0.12,      // contact-shadow core under the vial and pills
  shadowSoft: 0.2,   // wider, lighter step of the contact shadow
};
const parts = Object.fromEntries(Object.keys(PART_LUM).map((k) => [k, []]));
const add = (part, g, xf) => { g.deleteAttribute('uv'); parts[part].push(xf ? place(g, xf) : g); };

// =============================================================================
// VIAL BODY: push-up base with foot ring, lightly tapered wall, soft shoulder, wide neck.
// =============================================================================
const WALL_Y0 = 2.2, WALL_Y1 = 50.5, BODY_R0 = 16.2, BODY_R1 = 16.6;
const rw = (y) => BODY_R0 + (BODY_R1 - BODY_R0) * clamp((y - WALL_Y0) / (WALL_Y1 - WALL_Y0), 0, 1);
{
  const prof = [
    pt(0, 1.3), pt(9.5, 1.3), pt(11.5, 1.15), pt(12.8, 0.65), pt(13.5, 0.15), pt(14.0, 0), pt(15.3, 0), pt(15.75, 0.15), pt(16.05, 0.55), pt(16.2, 1.2),
    pt(BODY_R0, WALL_Y0), pt(rw(20), 20), pt(rw(35), 35), pt(BODY_R1, WALL_Y1),
    pt(16.58, 51.6), pt(16.45, 52.7), pt(16.15, 53.7), pt(15.7, 54.6), pt(15.1, 55.3), pt(14.45, 55.9), pt(13.9, 56.3), pt(13.6, 56.8),
    pt(13.6, 62.0, { hard: true }), pt(0, 62.0),
  ];
  for (const g of revolve(prof, { segs: 160 })) add('vial', g);
}

// =============================================================================
// CAP: plain skirt band, 48 flat-crested vertical ribs that fade into the top fillet, flat top with a
// shallow central recess, two raised push tabs at the rim, inner skirt + underside annulus.
// =============================================================================
const CAP_R = 17.4, CAP_Y0 = 57.0, CAP_TOP = 72.0, RIBS = 48, RIB_A = 0.35;
{
  const prof = [
    pt(14.2, 60.5), pt(14.2, CAP_Y0, { hard: true }), pt(16.9, CAP_Y0, { hard: true }), pt(17.15, 57.08), pt(17.33, 57.25), pt(17.4, 57.5),
    pt(CAP_R, 58.7), pt(CAP_R, 59.3, { k: 1 }), pt(CAP_R, 64, { k: 1 }), pt(CAP_R, 69.4, { k: 1 }),
    ...arc(15.4, 70.0, 2.0, 0, Math.PI / 2, 9, (a) => ({ k: clamp(1 - a / (52 * DEG), 0, 1) })),
    pt(12.8, CAP_TOP), pt(12.45, 71.93), pt(12.2, 71.78), pt(12.05, 71.6), pt(11.9, 71.5), pt(6, 71.5), pt(0, 71.5),
  ];
  const knurl = (phi) => clamp(1.8 * Math.cos(RIBS * phi), -1, 1);
  const rfn = (p, phi) => p.r + RIB_A * (p.k || 0) * knurl(phi);
  for (const g of revolve(prof, { segs: RIBS * 10, rfn })) add('cap', g);
  // raised push tabs: rounded annular sectors at +/-X on the cap top
  for (const side of [-1, 1]) {
    const s = new THREE.Shape(); const ro = 15.5, ri = 12.6, a0 = side * 90 * DEG - 24 * DEG, a1 = side * 90 * DEG + 24 * DEG;
    s.absarc(0, 0, ro, a0, a1, false); s.absarc(0, 0, ri, a1, a0, true); s.closePath();
    let g = new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 3, curveSegments: 40 });
    g.deleteAttribute('uv'); g = creased(g); g.rotateX(-Math.PI / 2); // shape XY -> XZ, extrude -> +Y
    g.computeBoundingBox(); g.translate(0, CAP_TOP - 0.25 - g.boundingBox.min.y, 0);
    add('cap', g);
  }
  // "turn" arrows embossed in the central recess, tangential, at the front and back
  for (const ang of [0, 180]) {
    const a = new THREE.Shape(); const P = [[-3.2, -0.65], [0.6, -0.65], [0.6, -1.7], [3.2, 0], [0.6, 1.7], [0.6, 0.65], [-3.2, 0.65]];
    a.moveTo(...P[0]); for (const q of P.slice(1)) a.lineTo(...q); a.closePath();
    let g = new THREE.ExtrudeGeometry(a, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2 });
    g.deleteAttribute('uv'); g = creased(g); g.rotateX(-Math.PI / 2);
    g.computeBoundingBox(); g.translate(0, 71.5 - 0.2 - g.boundingBox.min.y, 8.6);
    g.rotateY(ang * DEG); add('cap', g);
  }
}

// =============================================================================
// LABEL: full wrap with a 0.3 mm paper edge, overlap flap at the back; relief: header band, Rx
// symbol (stem + bowl + crossed leg), bold drug-name line and five text lines.
// =============================================================================
const LAB_Y0 = 11, LAB_Y1 = 45, LAB_T = 0.45;
const labelR = (y) => rw(y) + LAB_T; // outer paper surface
{
  const prof = [pt(rw(LAB_Y0) - 0.15, LAB_Y0), pt(rw(LAB_Y0) + LAB_T, LAB_Y0, { hard: true }), pt(rw(LAB_Y1) + LAB_T, LAB_Y1, { hard: true }), pt(rw(LAB_Y1) - 0.15, LAB_Y1, { hard: true }), pt(rw(LAB_Y0) - 0.15, LAB_Y0, { hard: true })];
  for (const g of revolve(prof, { segs: 160 })) add('label', g);
  // overlap flap: the strip's end lapping over its start, 10 degrees wide, seam at the back (-Z)
  const flap = [pt(rw(LAB_Y0) + LAB_T - 0.1, LAB_Y0), pt(rw(LAB_Y0) + 2 * LAB_T, LAB_Y0, { hard: true }), pt(rw(LAB_Y1) + 2 * LAB_T, LAB_Y1, { hard: true }), pt(rw(LAB_Y1) + LAB_T - 0.1, LAB_Y1, { hard: true }), pt(rw(LAB_Y0) + LAB_T - 0.1, LAB_Y0, { hard: true })];
  for (const g of revolve(flap, { segs: 8, phi0: 180 * DEG, phi1: 191 * DEG })) add('label', g);

  // --- relief primitives ----------------------------------------------------
  const slab = (u0, u1, v0, v1, h) => {
    const w = u1 - u0; const g = new THREE.BoxGeometry(w, v1 - v0, h + 0.2, Math.max(1, Math.ceil(w / 0.8)), 1, 1);
    g.translate((u0 + u1) / 2, (v0 + v1) / 2, (h - 0.2) / 2); wrapOnBody(g, 0, labelR); g.deleteAttribute('uv'); g.computeVertexNormals(); return g;
  };
  const LINE_H = 0.5;
  // header: pharmacy cross + two bold name blocks, then an address line of small words
  add('relief', slab(-21.5, -17.5, 38.6, 42.6, LINE_H)); add('relief', slab(-20.9, -18.1, 37.4, 43.8, LINE_H));
  add('relief', slab(-15.5, -4, 39.2, 42.0, LINE_H)); add('relief', slab(-2.5, 9, 39.2, 42.0, LINE_H));
  // word blocks: [v, height, [u0, u1]...]
  const rows = [
    [36.2, 1.1, [[-21.5, -14], [-13, -5], [-4, 4], [5, 11]]],
    [31.8, 1.6, [[3, 9.5], [10.5, 16], [17, 25]]],
    [28.0, 2.3, [[3, 12.5], [13.8, 25.5]]],
    [24.4, 1.6, [[3, 7], [8, 15.5], [16.5, 20.5]]],
    [20.9, 1.6, [[3, 10], [11, 17], [18, 25.5]]],
    [17.4, 1.6, [[3, 8], [9, 16]]],
    [13.3, 1.1, [[-21.5, -16], [-15, -8], [-7, -1], [0, 7], [8, 11]]],
  ];
  for (const [v, h, words] of rows) for (const [u0, u1] of words) add('relief', slab(u0, u1, v, v + h, LINE_H));
  // barcode at the bottom right: bars of alternating widths from a fixed pattern
  { let u = 13.2; const widths = [0.5, 0.3, 0.9, 0.3, 0.5, 0.7, 0.3, 0.3, 0.9, 0.5, 0.3, 0.7, 0.3, 0.9, 0.3, 0.5, 0.3, 0.7, 0.5, 0.3];
    for (const w of widths) { add('relief', slab(u, u + w, 12.8, 16.6, LINE_H)); u += w + 0.3; } }

  // --- Rx glyph: strokes in a unit box, scaled, extruded with a bevel, tessellated, wrapped ---
  const rect = (x0, y0, x1, y1) => { const s = new THREE.Shape(); s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath(); return s; };
  const seg = ([x0, y0], [x1, y1], w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); const nx = -dy / L * w / 2, ny = dx / L * w / 2;
    const s = new THREE.Shape(); s.moveTo(x0 + nx, y0 + ny); s.lineTo(x1 + nx, y1 + ny); s.lineTo(x1 - nx, y1 - ny); s.lineTo(x0 - nx, y0 - ny); s.closePath(); return s;
  };
  // R: stem 0..1 tall, bowl in the upper half, leg descending below the baseline; a second stroke
  // crosses the leg at 60% of its length so the lower right reads as the "x" of the Rx ligature.
  const S = 0.19, RO = 0.27, CX = 0.30, CY = 1.0 - RO;
  const bowl = new THREE.Shape(); bowl.absarc(CX, CY, RO, -Math.PI / 2, Math.PI / 2, false); bowl.absarc(CX, CY, RO - S, Math.PI / 2, -Math.PI / 2, true); bowl.closePath();
  const legA = [0.32, CY - RO + S * 0.6], legB = [0.78, -0.33];
  const mid = [legA[0] + 0.6 * (legB[0] - legA[0]), legA[1] + 0.6 * (legB[1] - legA[1])];
  const cd = [1, 1.05], cl = Math.hypot(...cd), ch = 0.30; const cu = [cd[0] / cl * ch, cd[1] / cl * ch];
  const strokes = [rect(0, 0, S, 1.0), rect(S * 0.5, 1.0 - S, CX + 0.06, 1.0), rect(S * 0.5, CY - RO, CX + 0.06, CY - RO + S), bowl, seg(legA, legB, S), seg([mid[0] - cu[0], mid[1] - cu[1]], [mid[0] + cu[0], mid[1] + cu[1]], S * 0.85)];
  const RX_SCALE = 17, RX_U = -15.5, RX_V = 17.8, RX_H = 1.0;
  for (const s of strokes) {
    let g = new THREE.ExtrudeGeometry(s, { depth: RX_H, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 28 });
    g.scale(RX_SCALE, RX_SCALE, 1); // bevel offsets scale with the glyph (~0.25 mm)
    g.deleteAttribute('uv'); g = tessellate(g, 1.0, 10);
    g.computeBoundingBox(); g.translate(RX_U, RX_V, -0.25 - g.boundingBox.min.z); // sink the back bevel into the paper
    g.computeBoundingBox(); g.translate(0, 0, RX_H - g.boundingBox.max.z); // top at RX_H
    wrapOnBody(g, 0, labelR); add('rx', creased(g, 45 * DEG));
  }
}

// =============================================================================
// PILLS: three two-piece capsules (size 0) and two biconvex scored tablets on the ground plane.
// =============================================================================
function capsuleGeo() {
  const rb = 3.5, rc = 3.85, L = 21.7, yStep = 10.8;
  const prof = [
    ...arc(0, rb, rb, -Math.PI / 2, 0, 10), pt(rb, yStep, { hard: true }), pt(rc, yStep + (rc - rb), { hard: true }), pt(rc, L - rc),
    ...arc(0, L - rc, rc, 0, Math.PI / 2, 10).slice(1),
  ];
  const runs = revolve(prof, { segs: 64 }); // [body half, step ring, cap half]
  return { body: mergeGeometries(runs.slice(0, 1), false), cap: mergeGeometries(runs.slice(1), false) };
}
function tabletGeo() {
  const prof = [pt(0, 0), pt(1.5, 0.05), pt(3.0, 0.3), pt(4.0, 0.7), pt(4.6, 1.05), pt(4.9, 1.3), pt(5.0, 1.55), pt(5.0, 2.05), pt(4.9, 2.3), pt(4.6, 2.55), pt(4.0, 2.9), pt(3.0, 3.3), pt(1.5, 3.55), pt(0, 3.6)];
  const g = mergeGeometries(revolve(prof, { segs: 192 }), false);
  // score line across the top dome (along local Z), rounded-V groove 0.5 deep, 1.1 wide
  const p = g.attributes.position; const w = 0.55;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 2.2) continue; const x = p.getX(i); const f = Math.max(0, 1 - (x / w) * (x / w)); p.setY(i, y - 0.5 * Math.pow(f, 0.8)); }
  g.computeVertexNormals(); return g;
}
for (const [x, z, yaw] of [[25, 11, 20], [-25.5, 8, -55], [9, 27.5, 95]]) {
  const { body, cap } = capsuleGeo();
  for (const [h, part] of [[body, 'capsuleBody'], [cap, 'capsuleCap']]) {
    h.translate(0, -21.7 / 2, 0); h.rotateZ(Math.PI / 2); // lie along X, centred
    add(part, h, { pos: [x, 3.85, z], rot: [0, yaw * DEG, 0] });
  }
}
for (const [x, z, rot] of [[-14, 24, 30], [28, -8, -40]]) add('tablets', tabletGeo(), { pos: [x, 0, z], rot: [0, rot * DEG, 0] });

// =============================================================================
// CONTACT SHADOW: thin flat ellipses just under y = 0 (stepped light -> dark) so the vial and pills sit on
// something. Radii are kept close to the pill spread so the vial still dominates the bounding box.
// =============================================================================
for (const [rx, rz, y0, part] of [[44, 40, -0.9, 'shadowSoft'], [38, 34.5, -0.5, 'shadow']]) {
  const sh = new THREE.Shape(); sh.absellipse(0, 0, rx, rz, 0, TAU, false, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false, curveSegments: 96 });
  g.deleteAttribute('uv'); g.rotateX(Math.PI / 2); g.translate(0.5, y0 + 0.45, 8.5); add(part, g);
}

// =============================================================================
// EXPORT
// =============================================================================
const scene = new THREE.Scene();
let tris = 0; const report = {};
for (const [name, list] of Object.entries(parts)) {
  const merged = mergeGeometries(list, false);
  const g = mergeVertices(merged, 1e-4);
  tris += g.index.count / 3; report[name] = g.index.count / 3;
  const L = PART_LUM[name]; // linear grey: the loader reads the linear baseColor factor
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 }); mat.color.setRGB(L, L, L, THREE.LinearSRGBColorSpace); mat.name = name;
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = name; scene.add(mesh);
}
const box = new THREE.Box3().setFromObject(scene);
const exporter = new GLTFExporter();
const buf = await exporter.parseAsync(scene, { binary: true });
fs.writeFileSync(OUT, Buffer.from(buf));
console.log(JSON.stringify({ tris, parts: report, bytes: fs.statSync(OUT).size, bbox: [box.min.toArray().map((v) => +v.toFixed(2)), box.max.toArray().map((v) => +v.toFixed(2))], out: OUT }));
