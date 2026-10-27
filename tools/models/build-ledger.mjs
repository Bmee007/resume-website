// Builds public/models/ledger.glb: an open A5 hardcover ledger lying on its back, with a ribbon
// bookmark and a posted fountain pen across the gutter. Pure generated geometry (three.js in Node).
// Units: millimetres. Y up. The tail (bottom edge) of the open pages faces +Z; spine runs along Z.
//
//   node tools/models/build-ledger.mjs [out.glb]
//   npx -y @gltf-transform/cli meshopt out.glb public/models/ledger.glb
//
// Anatomy (looking along the spine, XY plane): two 15 mm text blocks, each a stack of page layers.
// Every layer is a rounded-rect ring whose height follows pageY(f, x): flat on the board, then easing
// down into the gutter to its own fold on the thrown-up spine arch. Layers are lofted into a closed
// solid so the fore-edge / head / tail show fine stepped relief, and the head/tail cross-sections show
// the fan of pages converging into the arch above the hollow. The cover (boards + flat spine inlay
// with joint grooves and raised bands) sits underneath with a 3 mm square overhang.
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { RoundedBoxGeometry } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/ledger.glb';

// ---- FileReader polyfill for GLTFExporter (binary path) --------------------
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};

// ---- helpers ----------------------------------------------------------------
const DEG = Math.PI / 180;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// Deterministic PRNG so the build is reproducible.
let seed = 1337;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rndIn = (a, b) => a + (b - a) * rnd();

const clean = (g) => { g.deleteAttribute('uv'); return mergeVertices(g, 1e-4); };
const place = (g, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
  g.applyMatrix4(m); return g;
};
const geomFrom = (pos, idx) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
};
// Mirror a geometry in X (flips winding so faces stay outward).
const mirrorX = (g) => { g.scale(-1, 1, 1); const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); return g; };

const parts = { pages: [], cover: [], ribbon: [], pen: [] };
const add = (part, g, xf) => parts[part].push(clean(xf ? place(g, xf) : g));

// =============================================================================
// DIMENSIONS
// =============================================================================
const PAGE_W = 148, PAGE_H = 210;     // A5 leaf: width across (x), height along spine (z)
const BLOCK_T = 15;                   // one side of the open text block (closed book = 30 mm)
const SPINE_W = 2 * BLOCK_T;          // width of the bound edge strip
const BOARD_T = 3, SQUARE = 3;        // cover board thickness and overhang beyond the pages
const INLAY_T = 1.4;                  // flat spine inlay thickness
const JOINT = 2.2;                    // cloth-only hinge gap between board and inlay
const Y_BOARD = BOARD_T;              // page block rests on top of the board
const CORNER_R = 5;                   // rounded page corners at the fore-edge
const LAYERS = 32;                    // page layers per block (~0.47 mm each)
const ARCH_LIFT = 0.9, ARCH_RISE = 5.2; // thrown-up spine: fold height above the board at the hinge / extra at the centre

// Height of the fold line (bound edge) at distance x (<= 0) from the spine centre.
const archY = (x) => Y_BOARD + ARCH_LIFT + ARCH_RISE * (1 - Math.min(1, (x / (SPINE_W / 2)) ** 2));
// Fold position of layer fraction f (0 = outermost leaf, 1 = middle of the book).
const xFold = (f) => -(SPINE_W / 2) * (1 - f) * 0.92;
// Curl of the outer sheets of the left block near the fore-edge: only the top CURL_N sheets lift, each by
// its own amount and reach (per-layer jitter), strongest at the front (tail) corner, so they separate there.
const BOW = 6.5;                      // pages bow up toward the gutter shoulder (thick block fanning open)
const CURL_N = 8, CURL_MAX = 2.6, CURL_CORNER = 1.6, CURL_L = 50;
const CURL_J = Array.from({ length: LAYERS + 1 }, (_, k) => (k === LAYERS ? { a: 1, l: 1, zs: 0 } : { a: 0.5 + 0.45 * rnd(), l: 1.0 + 0.45 * rnd(), zs: rndIn(-0.25, 0.25) }));
function curlY(f, x, z, side) {
  const k = Math.round(f * LAYERS); const n = k - (LAYERS - CURL_N);
  if (side !== -1 || n <= 0) return 0;
  const j = CURL_J[k]; const L = CURL_L * j.l;
  const d = (-PAGE_W + L) - x; if (d <= 0) return 0;
  const zf = smooth((z + PAGE_H / 2) / PAGE_H + j.zs);
  const tn = (n / CURL_N) ** 1.3;
  const corner = smooth((z - 50) / 50 + j.zs) * smooth((-x - (PAGE_W - 36)) / 36); // front corner: sheets part company
  return tn * j.a * (CURL_MAX * (d / L) ** 2.3 * (0.35 + 0.65 * zf) + CURL_CORNER * corner);
}
// Height of the surface of layer f at x (x <= 0, measured from the spine centre, before mirroring).
function pageY(f, x, z, side) {
  const dFore = (x + PAGE_W) / PAGE_W;                 // 0 at the fore-edge -> 1 at the spine centre
  const yFlat = Y_BOARD + f * BLOCK_T + BOW * f ** 1.4 * smooth(dFore / 0.78);
  const xf = xFold(f); const yFold = archY(xf);
  const Lg = 14 + 30 * f;                              // gutter easing length grows for the middle pages
  const u = clamp01((x - (xf - Lg)) / Lg);             // 0 flat -> 1 at the fold
  const ease = 0.5 - 0.5 * Math.cos(Math.PI * u);
  return yFlat - (yFlat - yFold) * ease + curlY(f, x, z, side);
}

// Actual top surface: the loft keeps every sheet >= SHEET_GAP above the one below, which lifts the top sheet where
// the layers converge in the gutter. This mirrors that clamp so rulings, ribbon and pen sit on what is rendered.
const SHEET_GAP = 0.05;
function surfY(x, z, side) {
  let y = -1e9; for (let k = 0; k <= LAYERS; k++) y = Math.max(y, pageY(k / LAYERS, x, z, side) + (LAYERS - k) * SHEET_GAP);
  return y;
}

// =============================================================================
// TEXT BLOCK: grids, rings, loft. Built for the left side (x <= 0) then mirrored for the right.
// =============================================================================
// Ruling layout in page-local u (0 = page's own left edge .. PAGE_W = right edge) and z.
const RULE_PITCH = 8.5, RULE_Z0 = -PAGE_H / 2 + 24, RULE_N = 20;
const RULE_Z = Array.from({ length: RULE_N }, (_, i) => RULE_Z0 + i * RULE_PITCH);
const RULE_H = 0.12, BAR_H = 0.25;    // emboss relief heights: a whisper, tapered at the ends
const COL_RULES = [30, PAGE_W - 34];  // vertical ledger column rules (date | entry | amount)

// z samples: dense at the rounded corners, ~11 mm elsewhere (the rulings are separate relief patches).
function zSamples() {
  const zs = new Set();
  for (const e of [0, 0.8, 2.2, 3.6, CORNER_R, 8, 12, 17, 24]) { zs.add(-PAGE_H / 2 + e); zs.add(PAGE_H / 2 - e); }
  for (let z = -PAGE_H / 2 + 36; z < PAGE_H / 2 - 30; z += 11) zs.add(z);
  return [...zs].sort((a, b) => a - b);
}
// x samples (as distance from the spine centre, normalised), dense in the gutter and curl region.
function sSamples() {
  const xs = new Set([0]);
  for (let x = 1.5; x <= 48; x += x < 14 ? 1.5 : 2.5) xs.add(x);
  for (let x = 52; x <= PAGE_W - 56; x += 4) xs.add(x);
  for (let x = PAGE_W - 54; x <= PAGE_W; x += x > PAGE_W - 12 ? 1.5 : 3) xs.add(x);
  xs.add(PAGE_W);
  return [...xs].filter((x) => x >= 0 && x <= PAGE_W).sort((a, b) => a - b).map((x) => x / PAGE_W);
}
// Fore-edge x (<= 0) for a given z, with rounded corners.
function xEdge(z, halfH, w) {
  const a = Math.abs(z) - (halfH - CORNER_R);
  if (a <= 0) return -w;
  return -(w - CORNER_R) - Math.sqrt(Math.max(0, CORNER_R * CORNER_R - a * a));
}

// Ledger "entries": per ruled line, [u0,u1] bars in page-local u. Date stub, description, amount.
function entryBars(side) {
  const bars = [];
  const uMin = side === -1 ? 12 : 17, uMax = side === -1 ? PAGE_W - 17 : PAGE_W - 12; // margins: 12 at fore-edge, 17 at gutter
  for (let i = 0; i < RULE_N; i++) {
    const zl = RULE_Z[i]; const row = [];
    if (i === 0) { row.push([uMin + 2, uMin + 2 + 54]); bars.push({ z: zl, row, h: BAR_H * 1.1 }); continue; } // heading
    if (i === 1) continue; // blank below heading
    const r = rnd();
    if (r < 0.12) continue; // empty line
    row.push([uMin + 2, uMin + 2 + rndIn(8, 14)]);                                   // date
    const dStart = COL_RULES[0] + 3; const dLen = rndIn(18, Math.min(68, COL_RULES[1] - 4 - dStart));
    row.push([dStart, dStart + dLen]);                                               // description
    if (rnd() < 0.8) { const aLen = rndIn(8, 16); row.push([uMax - 2 - aLen, uMax - 2]); } // amount
    bars.push({ z: zl, row, h: BAR_H });
  }
  return { bars, uMin, uMax };
}

// Relief patch: a thin skin laid on the top sheet over page-local rect [u0,u1] x [z0,z1], height h, with
// smooth tapers (ru along u, rz along z) so rules and entry bars have feathered ends instead of brick edges.
function reliefPatch(side, { u0, u1, z0, z1, h, ru, rz }) {
  const span = (a, b, r, step) => { const v = [a]; if (b - a > 2 * r + 1e-6) { v.push(a + r); for (let t = a + r + step; t < b - r - step * 0.5; t += step) v.push(t); v.push(b - r); } else v.push((a + b) / 2); v.push(b); return v; };
  const us = span(u0, u1, ru, 3), zs = span(z0, z1, rz, 3);
  const prof = (t, a, b, r) => smooth(Math.min(1, (t - a) / r, (b - t) / r));
  const pos = []; const idx = [];
  for (const z of zs) for (const u of us) {
    const xl = side === -1 ? u - PAGE_W : -u; const w = prof(u, u0, u1, ru) * prof(z, z0, z1, rz);
    pos.push(side === -1 ? xl : -xl, surfY(xl, z, side) + h * w - 0.06 * (1 - w), z);
  }
  const W = us.length;
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < W - 1; i++) { const a = j * W + i; idx.push(a, a + W, a + 1, a + 1, a + W, a + W + 1); }
  const g = geomFrom(pos, idx);
  let sy = 0; const n = g.attributes.normal; for (let i = 0; i < n.count; i++) sy += n.getY(i);
  if (sy < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
  return g;
}
// All rulings and entries for one page: horizontal rules, ledger column rules, tapered entry bars.
function buildRelief(side) {
  const { bars, uMin, uMax } = entryBars(side); const out = [];
  for (const zl of RULE_Z) out.push(reliefPatch(side, { u0: uMin, u1: uMax, z0: zl - 0.45, z1: zl + 0.45, h: RULE_H, ru: 3, rz: 0.45 }));
  for (const ur of COL_RULES) out.push(reliefPatch(side, { u0: ur - 0.45, u1: ur + 0.45, z0: RULE_Z[0] - 3.4, z1: RULE_Z[RULE_N - 1] + 0.45, h: RULE_H + 0.02, ru: 0.45, rz: 3 }));
  for (const b of bars) for (const [u0, u1] of b.row) out.push(reliefPatch(side, { u0, u1, z0: b.z - 3.2, z1: b.z - 1.3, h: b.h, ru: Math.min(1.6, (u1 - u0) / 2), rz: 0.7 }));
  return out;
}

function buildBlock(side) {
  const zs = zSamples(); const ss = sSamples(); const NZ = zs.length - 1, NX = ss.length - 1;
  // per-layer trims (jitter on the fore-edge / head / tail so the block reads as individual sheets)
  const trims = []; let drift = 0;
  for (let k = 0; k <= LAYERS; k++) {
    drift = drift * 0.6 + rndIn(-0.18, 0.18);
    trims.push({ dw: drift + rndIn(-0.12, 0.12) + (k % 2 ? 0.08 : -0.08), dh: rndIn(-0.16, 0.16) + (k % 2 ? 0.07 : -0.07) });
  }
  const fOf = (k) => k / LAYERS;
  // vertex position of layer k at grid (i, j)
  const P = (k, i, j) => {
    const f = fOf(k); const t = trims[k];
    const halfH = PAGE_H / 2 + t.dh; const w = PAGE_W + t.dw;
    const z = zs[j] * (halfH / (PAGE_H / 2));
    const xe = xEdge(z, halfH, w); const xf = xFold(f);
    const x = lerp(xf, xe, ss[i]);
    let y = pageY(f, x, z, side);
    return [x, y, z];
  };
  // Boundary walk (i, j) pairs: head row (j=0) spine->edge, fore-edge column, tail row edge->spine, spine column.
  const walk = [];
  for (let i = 0; i < NX; i++) walk.push([i, 0]);
  for (let j = 0; j < NZ; j++) walk.push([NX, j]);
  for (let i = NX; i > 0; i--) walk.push([i, NZ]);
  for (let j = NZ; j > 0; j--) walk.push([0, j]);
  const RN = walk.length;

  const pos = []; const idx = [];
  // Enforce monotone layer heights along the walk so sheets never cross (min gap 0.12 mm).
  const rings = [];
  for (let k = 0; k <= LAYERS; k++) {
    const ring = walk.map(([i, j]) => P(k, i, j));
    if (k > 0) for (let n = 0; n < RN; n++) ring[n][1] = Math.max(ring[n][1], rings[k - 1][n][1] + SHEET_GAP);
    rings.push(ring);
  }
  for (let k = 0; k <= LAYERS; k++) for (const p of rings[k]) pos.push(...p);
  // side walls
  for (let k = 0; k < LAYERS; k++) for (let n = 0; n < RN; n++) {
    const a = k * RN + n, b = k * RN + (n + 1) % RN, c = (k + 1) * RN + n, d = (k + 1) * RN + (n + 1) % RN;
    idx.push(a, b, c, b, d, c);
  }
  // top cap grid (own vertices; boundary coincides with the top ring and is welded later)
  const topStart = pos.length / 3;
  const topRing = rings[LAYERS]; const ringAt = new Map(walk.map(([i, j], n) => [i + ',' + j, n]));
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const key = i + ',' + j;
    if (ringAt.has(key)) pos.push(...topRing[ringAt.get(key)]);
    else {
      pos.push(...P(LAYERS, i, j));
    }
  }
  const G = (i, j) => topStart + j * (NX + 1) + i;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) idx.push(G(i, j), G(i + 1, j), G(i, j + 1), G(i + 1, j), G(i + 1, j + 1), G(i, j + 1));
  // bottom cap: fan from a centre point (flat enough: the bottom leaf lies on the board)
  const cStart = pos.length / 3; pos.push(-PAGE_W / 2, Y_BOARD, 0);
  for (let n = 0; n < RN; n++) idx.push(n, cStart, (n + 1) % RN);

  const g = geomFrom(pos, idx);
  // orient every side-wall triangle outward (robust against walk direction)
  { const p = g.attributes.position.array; const ix = g.index.array; const cx = -PAGE_W / 2, cy = Y_BOARD + BLOCK_T / 2, cz = 0;
    const wallTris = LAYERS * RN * 2;
    for (let t = 0; t < wallTris + RN; t++) {
      const tri = t < wallTris ? t : t + NZ * NX * 2; const o = tri * 3; const a = ix[o], b = ix[o + 1], c = ix[o + 2];
      const ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
      const e1 = [p[b * 3] - ax, p[b * 3 + 1] - ay, p[b * 3 + 2] - az], e2 = [p[c * 3] - ax, p[c * 3 + 1] - ay, p[c * 3 + 2] - az];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const mx = (ax + p[b * 3] + p[c * 3]) / 3 - cx, my = (ay + p[b * 3 + 1] + p[c * 3 + 1]) / 3 - cy, mz = (az + p[b * 3 + 2] + p[c * 3 + 2]) / 3 - cz;
      if (n[0] * mx + n[1] * my + n[2] * mz < 0) { ix[o + 1] = c; ix[o + 2] = b; }
    }
    g.computeVertexNormals();
  }
  return side === -1 ? g : mirrorX(g);
}
// Exposed top-surface height of a block (for resting the ribbon and pen): x in world (either side).
function topY(x, z) {
  const side = x < 0 ? -1 : 1; const xl = -Math.abs(x);
  return surfY(Math.max(xl, -PAGE_W), z, side);
}

add('pages', buildBlock(-1));
add('pages', buildBlock(1));
for (const side of [-1, 1]) for (const g of buildRelief(side)) add('pages', g);

// =============================================================================
// COVER: two boards, flat spine inlay, joint cloth, raised bands underneath
// =============================================================================
{
  const boardIn = SPINE_W / 2 + 2 + JOINT;                // board starts here (|x|)
  const boardOut = PAGE_W + SQUARE;
  const boardW = boardOut - boardIn; const boardL = PAGE_H + 2 * SQUARE;
  for (const s of [-1, 1]) {
    const b = new RoundedBoxGeometry(boardW, BOARD_T, boardL, 3, 1.1);
    add('cover', b, { pos: [s * (boardIn + boardW / 2), BOARD_T / 2, 0] });
  }
  // spine inlay: flat strip between the joints, slightly thinner than the boards
  const inlayW = 2 * (SPINE_W / 2 + 2);
  add('cover', new RoundedBoxGeometry(inlayW, INLAY_T, boardL, 2, 0.5), { pos: [0, INLAY_T / 2, 0] });
  // joint cloth bridging the groove (thin, slightly sunk)
  for (const s of [-1, 1]) add('cover', new THREE.BoxGeometry(JOINT + 0.6, 0.7, boardL - 0.2), { pos: [s * (inlayW / 2 + JOINT / 2), 0.35, 0] });
  // raised bands across the spine (underside, like a hubbed leather spine)
  for (const zb of [-80, -40, 0, 40, 80]) add('cover', new RoundedBoxGeometry(inlayW - 1, 1.0, 4.2, 2, 0.45), { pos: [0, -0.4, zb] });
  // blind-tooled border line around the board (shallow raised rule 1.2 mm inside the edge, visible on the squares? no: on the outside = underside)
  for (const s of [-1, 1]) {
    const rule = (w, d, x, z) => add('cover', new THREE.BoxGeometry(w, 0.25, d), { pos: [x, -0.1, z] });
    const cx = s * (boardIn + boardW / 2); const inset = 6;
    rule(boardW - 2 * inset, 0.7, cx, -(boardL / 2 - inset)); rule(boardW - 2 * inset, 0.7, cx, boardL / 2 - inset);
    rule(0.7, boardL - 2 * inset, cx - (boardW / 2 - inset), 0); rule(0.7, boardL - 2 * inset, cx + (boardW / 2 - inset), 0);
  }
}

// =============================================================================
// RIBBON BOOKMARK: 0.25 mm satin strip. Emerges at the head of the spine, lies on the right page roughly
// parallel to the gutter (drifting gently outward), rolls softly over the tail edge of the block, drops past
// the board and rests on the table with a swallow-tail cut. Few control points (centripetal Catmull-Rom, so
// no tangent kinks); on the page the strip is laid onto the real page surface and its normal.
// =============================================================================
let ribbonGeo = null;
{
  const RW = 8, RT = 0.25, HW = RW / 2, HT = RT / 2;
  const yT = (x, z) => topY(x, z);
  const XE = 30.4, eT = yT(XE, 104);
  const pts = [
    [3.0, -103.5, yT(3, -103.5) - 0.4], [5.0, -70, yT(5, -70) + 0.3], [8.5, -30, yT(8.5, -30) + 0.3],
    [13.0, 12, yT(13, 12) + 0.3], [18.5, 52, yT(18.5, 52) + 0.3], [25.0, 88, yT(25, 88) + 0.3],
    [XE - 1.2, 100.5, yT(XE - 1.2, 100.5) + 0.3], [XE - 0.3, 104.2, eT + 0.45], [XE, 105.9, eT - 0.9],
    [XE + 0.1, 106.6, eT - 4], [XE + 0.15, 106.8, 8], [XE + 0.25, 107.6, 3.7], [XE + 0.4, 108.9, 3.35],
    [XE + 0.6, 110.2, 1.2], [XE + 0.9, 112.5, 0.4], [XE + 1.8, 118, 0.3], [XE + 3.2, 124.5, 0.3],
  ].map(([x, z, y]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const L = curve.getLength();
  // sample stations by arc length: fine around the roll, coarse on the page; last station set back for the V cut
  const NOTCH = 4.5; const sv = []; { let s0 = 0; while (s0 < 1 - NOTCH / L - 1e-4) { sv.push(s0); s0 += (curve.getPointAt(s0).z > 100 ? 0.7 : 2.2) / L; } sv.push(1 - NOTCH / L, 1); }
  const N = sv.length - 1;
  const onPage = (z) => 1 - smooth((z - 100) / 4.5);
  const pageN = (x, z) => { const e = 0.5; return new THREE.Vector3(-(yT(x + e, z) - yT(x - e, z)) / (2 * e), 1, -(yT(x, z + e) - yT(x, z - e)) / (2 * e)).normalize(); };
  // 1) centre line: on the page it follows the page surface; off the edge it follows the curve
  const C = sv.map((s, i) => {
    const q = curve.getPointAt(s); const w = onPage(q.z); const u = i / N;
    const tw = 0.2 * Math.sin(u * 17 + 1.0) * w;                               // gentle twist (half the old amplitude, then conformed)
    const lift = (-0.4 + 0.6 * smooth((q.z + 103.5) / 8)) + 0.4 * (1 - Math.cos(u * 14)) * w + HW * Math.abs(Math.sin(tw));
    return { p: new THREE.Vector3(q.x, lerp(q.y, yT(q.x, q.z) + lift, w), q.z), tw, w };
  });
  // 2) frames: tangent by central differences, normal = parallel transport blended with the page normal on the page
  const T = C.map((c, i) => C[Math.min(N, i + 1)].p.clone().sub(C[Math.max(0, i - 1)].p).normalize());
  const pos = []; let nTr = new THREE.Vector3(0, 1, 0).sub(T[0].clone().multiplyScalar(T[0].y)).normalize(); let tPrev = T[0];
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const t = T[i];
    if (i > 0) { const ax = new THREE.Vector3().crossVectors(tPrev, t); const sn = ax.length(); if (sn > 1e-9) nTr.applyAxisAngle(ax.normalize(), Math.asin(Math.min(1, sn))); }
    tPrev = t;
    let n = nTr.clone().lerp(pageN(C[i].p.x, C[i].p.z), C[i].w).normalize();
    n.applyAxisAngle(t, C[i].tw); n.sub(t.clone().multiplyScalar(n.dot(t))).normalize();
    const bin = new THREE.Vector3().crossVectors(t, n).normalize();
    // never let the flat strip sink into the (curved) page across its width: lift to clear the page at the edges
    let e = 0; const pc = C[i].p;
    if (C[i].w > 0.01) for (const a of [-HW, -HW / 2, HW / 2, HW]) e = Math.max(e, yT(pc.x + bin.x * a, pc.z + bin.z * a) - (pc.y + bin.y * a) + 0.2);
    rows.push({ p: e > 0 ? pc.clone().addScaledVector(new THREE.Vector3(0, 1, 0), e * C[i].w) : pc, n, bin });
  }
  // cross-section: 5 columns across, edges cupped up by CUP so the satin strip catches light along its length
  const CUP = 0.85, COLS = 5, R = 2 * COLS; const colA = Array.from({ length: COLS }, (_, j) => -HW + (2 * HW * j) / (COLS - 1));
  const push = (r, a, b) => { const bb = b + CUP * (a / HW) ** 2; pos.push(r.p.x + r.bin.x * a + r.n.x * bb, r.p.y + r.bin.y * a + r.n.y * bb, r.p.z + r.bin.z * a + r.n.z * bb); };
  for (const r of rows) { for (let j = 0; j < COLS; j++) push(r, colA[j], -HT); for (let j = COLS - 1; j >= 0; j--) push(r, colA[j], HT); }
  const bot = (i, j) => i * R + j, top = (i, j) => i * R + COLS + (COLS - 1 - j);
  const idx = [];
  for (let i = 0; i < N; i++) for (let c = 0; c < R; c++) {
    const a = i * R + c, b = i * R + (c + 1) % R, d = (i + 1) * R + c, e = (i + 1) * R + (c + 1) % R;
    if (i === N - 1 && c !== COLS - 1 && c !== R - 1) continue; // top and bottom of the last segment carry the V cut
    idx.push(a, d, b, b, d, e);
  }
  const P3 = (q) => new THREE.Vector3(pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]);
  const tri = (i, j, k, hint) => { const nn = new THREE.Vector3().crossVectors(P3(j).sub(P3(i)), P3(k).sub(P3(i))); if (nn.dot(hint) < 0) idx.push(i, k, j); else idx.push(i, j, k); };
  { const nh = T[0].clone().negate(); for (let k = 1; k < R - 1; k++) tri(0, k, k + 1, nh); } // start cap, tucked at the head
  { // swallow-tail: apex on the last-but-one row, edge corners on the last row
    const M = N - 1; const up = rows[N].n, dn = rows[N].n.clone().negate();
    for (const [h, f] of [[up, top], [dn, bot]]) { tri(f(M, 0), f(N, 0), f(M, 1), h); tri(f(M, 1), f(N, 0), f(M, 2), h); tri(f(M, 2), f(N, COLS - 1), f(M, 3), h); tri(f(M, 3), f(N, COLS - 1), f(M, 4), h); }
    const hl = T[N].clone().multiplyScalar(0.8).add(rows[N].bin.clone().multiplyScalar(0.6)), hr = T[N].clone().multiplyScalar(0.8).sub(rows[N].bin.clone().multiplyScalar(0.6));
    tri(top(N, 0), top(M, 2), bot(M, 2), hl); tri(top(N, 0), bot(M, 2), bot(N, 0), hl);
    tri(top(N, COLS - 1), bot(M, 2), top(M, 2), hr); tri(top(N, COLS - 1), bot(N, COLS - 1), bot(M, 2), hr);
  }
  ribbonGeo = geomFrom(pos, idx);
  { // closed solid: make the winding outward by the sign of the enclosed volume
    const p = ribbonGeo.attributes.position, ix = ribbonGeo.index.array; let vol = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3();
    for (let i = 0; i < ix.length; i += 3) { A.fromBufferAttribute(p, ix[i]); B.fromBufferAttribute(p, ix[i + 1]); Cc.fromBufferAttribute(p, ix[i + 2]); vol += A.dot(B.clone().cross(Cc)); }
    if (vol < 0) { for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } ribbonGeo.computeVertexNormals(); }
  }
  add('ribbon', ribbonGeo.clone());
}

// =============================================================================
// FOUNTAIN PEN (posted): lathe body, extruded nib with slit + breather hole, clip with ball
// Local axis +Y from nib tip (y = 0) to cap finial (y = L).
// =============================================================================
{
  const penParts = [];
  // profile (r, y): feed/section/barrel/cap
  const prof = [
    [0, 10.5], [2.6, 11], [3.4, 13], [4.3, 17], [5.0, 21.5], [5.3, 23], // feed cone emerging under the nib
    [5.35, 23.2], [5.1, 28], [5.05, 33], [5.4, 37.5], [5.6, 38.6],        // section (grip), slightly waisted
    [6.2, 38.6], [6.3, 39.2], [6.55, 42], [6.85, 58], [7.0, 80], [6.9, 100], [6.65, 118], [6.5, 121], // barrel (cigar)
    [7.35, 121.5], [7.75, 122.2], [7.75, 125.4], [7.45, 126.2],         // cap lip + cap band
    [7.45, 134], [7.25, 150], [6.6, 161], [5.6, 165.5], [4.0, 167.8], [2.0, 168.8], [0, 169.1], // cap body to finial
  ];
  const L = 169.1;
  const body = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 56);
  penParts.push(body);
  // nib: 2D outline with slit + breather hole, extruded 0.7 mm, then curved across (trough) and tilted onto the feed
  {
    const s = new THREE.Shape();
    const hw = (u) => u < 13 ? 0.45 + 5.1 * Math.pow(u / 13, 0.75) : 5.55 - 1.0 * ((u - 13) / 12); // half-width along the nib (u from tip)
    const slit = 0.22, hole = 1.0, uHole = 12.5;
    const right = []; for (let u = 0; u <= 25; u += 1) right.push([hw(u), u]);
    // right side tip->tail, across the tail, left side tail->tip, then the slit up to the hole and back
    s.moveTo(slit, 0.0);
    for (const [w, u] of right) s.lineTo(w, u);
    s.lineTo(-hw(25), 25);
    for (let u = 24; u >= 0; u -= 1) s.lineTo(-hw(u), u);
    s.lineTo(-slit, 0.0);
    // slit runs up to the breather hole; walk the hole as a circle from the left slit edge round to the right
    const yJoin = uHole - Math.sqrt(Math.max(0, hole * hole - slit * slit));
    s.lineTo(-slit, yJoin);
    const a0 = Math.atan2(yJoin - uHole, -slit), a1 = Math.atan2(yJoin - uHole, slit) - 2 * Math.PI; // left join -> right join, the long way round
    for (let k = 1; k < 28; k++) { const ang = a0 + (a1 - a0) * (k / 28); s.lineTo(Math.cos(ang) * hole, uHole + Math.sin(ang) * hole); }
    s.lineTo(slit, yJoin);
    s.lineTo(slit, 0.0);
    const nib = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false, curveSegments: 4 });
    // shape (x = across, y = along u); extrude along z (thickness). Curve across: trough, and lift the tip slightly
    { const p = nib.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), u = p.getY(i); p.setZ(i, p.getZ(i) - 0.055 * x * x + 0.004 * (25 - u) ** 2 * 0.3); } }
    // orient: extrude z (thickness) -> local +X (outward from the feed), shape y (u) -> local Y axis with tip at y=0... nib tip at y = 0.5
    nib.rotateY(-Math.PI / 2);  // (x, y, z) -> (-z, y, x): thickness now along -x... we want the nib on the +x side of the axis
    nib.scale(-1, 1, 1);        // mirror to +x (fix winding below)
    { const ix = nib.index ? nib.index.array : null; if (ix) for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } }
    nib.translate(5.0, 0.6, 0); // nib rides on top (+x side) of the feed cone, tail hidden in the section
    nib.rotateZ(-7 * DEG);      // tilt the nib down toward the feed at the tip
    nib.translate(1.1, 0, 0);
    penParts.push(nib);
  }
  // clip: tapered bar standing off the cap, attached by a saddle at the finial end, ball at the tip
  {
    const clipLen = 36, y0 = 126.5, y1 = y0 + clipLen;
    const clip = new RoundedBoxGeometry(1.5, clipLen, 4.4, 2, 0.55);
    clip.translate(7.45 + 1.7 + 0.65, (y0 + y1) / 2, 0);
    // taper the clip width toward the tip
    { const p = clip.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - y0) / clipLen; p.setZ(i, p.getZ(i) * lerp(0.72, 1.05, t)); p.setX(i, p.getX(i) - 0.5 * (1 - t) * 0.0); } }
    penParts.push(clip);
    const ball = new THREE.SphereGeometry(1.35, 18, 12); ball.translate(7.45 + 1.3, y0 + 0.4, 0); penParts.push(ball);
    const saddle = new RoundedBoxGeometry(2.6, 6, 4.4, 2, 0.6); saddle.translate(7.0 + 0.7, y1 - 1.5, 0); penParts.push(saddle);
    const saddleRing = new THREE.TorusGeometry(6.95, 0.55, 10, 48); saddleRing.rotateX(Math.PI / 2); saddleRing.translate(0, y1 + 1.6, 0); penParts.push(saddleRing);
  }
  // barrel/section thread line + cap band engraving line (very fine raised rings)
  for (const [y, r] of [[39.0, 6.25], [121.6, 7.5]]) { const t = new THREE.TorusGeometry(r, 0.22, 8, 56); t.rotateX(Math.PI / 2); t.translate(0, y, 0); penParts.push(t); }

  // Placement: lying diagonally across the gutter, nib toward front-right (+x,+z); rests on the gutter shoulders.
  const theta = 36 * DEG; const yMid = 82;
  const dir = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
  const centre = new THREE.Vector3(2, 0, 22);
  // two contact points: the section (local y 30, r 5.1) and the cap band (local y 124, r 7.75)
  const contact = (ly, r) => { const x = centre.x + (ly - yMid) * dir.x, z = centre.z + (ly - yMid) * dir.z; return topY(x, z) + r + 0.1; };
  const yA = contact(30, 5.1), yB = contact(124, 7.75);
  dir.y = (yB - yA) / 94; dir.normalize();
  centre.y = yA + (yMid - 30) * dir.y;
  // Frame: local Y = pen axis; local X (nib and clip side) = world up projected, then rolled 28 deg about the
  // axis so the nib face and clip turn toward the front (+Z) camera.
  const up = new THREE.Vector3(0, 1, 0); const xw = up.clone().sub(dir.clone().multiplyScalar(up.dot(dir))).normalize();
  const zw = new THREE.Vector3().crossVectors(xw, dir).normalize();
  const origin = centre.clone().sub(dir.clone().multiplyScalar(yMid));
  const m = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z)
    .multiply(new THREE.Matrix4().makeBasis(xw, dir, zw))
    .multiply(new THREE.Matrix4().makeRotationY(28 * DEG));
  for (const g of penParts) add('pen', g.applyMatrix4(m));
  if (process.env.LEDGER_DEBUG) { // ribbon vs pen clearance (negative = intersecting)
    let worst = 1e9; const p = ribbonGeo.attributes.position; const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).sub(origin); const ly = v.dot(dir); if (ly < 0 || ly > 169) continue;
      const rad = v.sub(dir.clone().multiplyScalar(ly)).length(); let r = 0; for (let k = 1; k < prof.length; k++) if (ly <= prof[k][1]) { const t = (ly - prof[k - 1][1]) / (prof[k][1] - prof[k - 1][1] || 1); r = lerp(prof[k - 1][0], prof[k][0], t); break; }
      worst = Math.min(worst, rad - r); }
    console.error('ribbon-pen min clearance mm:', worst.toFixed(2));
  }
}

// =============================================================================
// EXPORT
// =============================================================================
const scene = new THREE.Scene();
let tris = 0;
for (const [name, list] of Object.entries(parts)) {
  const merged = mergeGeometries(list, false);
  const g = mergeVertices(merged, 1e-4);
  tris += g.index.count / 3;
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.55, metalness: 0 }));
  mesh.name = name; scene.add(mesh);
}
const exporter = new GLTFExporter();
const buf = await exporter.parseAsync(scene, { binary: true });
fs.writeFileSync(OUT, Buffer.from(buf));
console.log(JSON.stringify({ tris, bytes: fs.statSync(OUT).size, out: OUT }));
