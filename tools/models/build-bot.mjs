// Builds public/models/bot.glb: "Illumi", a seated companion/assistant robot (bust with arms on a rounded base).
// Pure generated geometry (three.js in Node). Units: millimetres. Y up, face toward +Z.
//
// Approach: every shell is a parametric surface (surface of revolution or ellipsoid) whose radius is modulated by
// a displacement field, so panel gaps, vents, the visor recess, eye apertures, the charging port, speaker slots
// and the chest ring are real geometry that reads in a single clay material. Surfaces are meshed with an adaptive
// restricted quadtree (refined where the surface bends or its normal turns), with analytic vertex normals.
//
// Materials: 12 glTF materials (shell, glass, lens, joint, screen, bezel, vent, pad, port, three shadow bands), one mesh
// each. The site turns each base colour's luminance into a per-part grey, so this is how the bot gets tonal parts.
// Regions are carved by per-surface `tag` functions evaluated on the same charts as the displacement fields, and the
// adaptive mesher splits cells on material borders so colour edges follow the features.
//
// Pipeline (final GLB: ~116k tris, ~1.34 MB). The last two steps are NOT optional, see renormal.mjs / pack-glb.mjs:
//   node tools/models/build-bot.mjs /tmp/bot-raw.glb
//   npx -y @gltf-transform/cli simplify --ratio 0.6 --error 0.0003 --lock-border true /tmp/bot-raw.glb /tmp/bot-s.glb
//   node tools/models/renormal.mjs /tmp/bot-s.glb /tmp/bot-n.glb   # inward winding + near-to-far sort per material
//   node tools/models/pack-glb.mjs /tmp/bot-n.glb public/models/bot.glb   # order-preserving meshopt, 14/10-bit
// (pack-glb needs: npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer)
//
// Why the odd finishing (the "dirt flecks" bug): the site draws the model transparent + DoubleSide (opacity 0.6 in
// the Intelligence chapter). three.js renders such materials in two passes, back faces first, then front faces, and
// blends the second over the first. A closed, OUTWARD-wound shell therefore shows its far inner wall and every nested
// part through the near skin at 40%: dark seam ghosts and flecks. Winding every shell INWARD puts the visible near
// skin in the first pass and makes the far wall fail the depth test, so the model reads as solid translucent clay
// from any angle; the remaining order dependence (an arm in front of the torso) is fixed by the near-to-far
// triangle sort for the chapter's camera. Also: analytic normals instead of face-averaged ones (the average across a
// groove bends the corner normals of the big flat triangles next to it and shows as glossy wedges), and normals at
// 10 bit instead of the default 8-bit octahedral.
// Debug: VERBOSE=1 prints per-part triangle counts; PART=head,neck exports a subset.
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { mergeVertices } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/bot-raw.glb';

// ---- FileReader polyfill for GLTFExporter (binary path) --------------------
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};

// ---- math helpers -----------------------------------------------------------
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
// signed distance to a rounded rectangle (half extents hw, hh; corner radius r), negative inside
const sdRR = (dx, dy, hw, hh, r) => {
  const qx = Math.abs(dx) - hw + r, qy = Math.abs(dy) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
};
const sdCircle = (dx, dy, r) => Math.hypot(dx, dy) - r;
// flat-bottomed recess inside sd<0 with a filleted edge of width `soft`
// (soft is floored at ~1.3 mm: the finest cells are ~1 mm, a narrower fillet aliases into dashed, glinting edges)
const recess = (sd, depth, soft) => depth * (1 - sstep(-Math.max(soft, 1.3), 0, sd));
// U-shaped groove centred on sd=0 (panel gap)
const groove = (sd, w, depth) => { const t = Math.abs(sd) / (w / 2); return t >= 1 ? 0 : depth * (1 - t * t); };
// raised dome inside radius r (negative displacement = outward); sd is the signed distance to the circle
const dome = (sd, r, h) => { if (sd >= 0) return 0; const t = (sd + r) / r; return -h * Math.sqrt(Math.max(0, 1 - t * t)); };

// ---- materials ---------------------------------------------------------------
// glTF base colours as grey luminance L (linear). The site's loader (src/scripts/models.js) maps L (clamped 0.12..1)
// to a per-part grey 0.28 + 0.48 L, so L 1.0 -> 0.76 (bright shell) and L 0.1 -> 0.34 (near-black glass). The site's
// clearcoat/rim light washes dark parts toward mid grey, so the dark and light ends are pushed to the clamp limits.
const MAT = { SHELL: 0, GLASS: 1, LENS: 2, JOINT: 3, SCREEN: 4, BEZEL: 5, VENT: 6, PAD: 7, PORT: 8, SHADOW: 9, SHADOW2: 10, SHADOW3: 11 };
const MAT_DEF = [
  ['shell', 1.0], ['glass', 0.1], ['lens', 1.0], ['joint', 0.28], ['screen', 0.12],
  ['bezel', 0.5], ['vent', 0.15], ['pad', 0.2], ['port', 0.12], ['shadow', 0.12], ['shadow-mid', 0.2], ['shadow-edge', 0.3],
];

// ---- mesh builders ----------------------------------------------------------
// Adaptive parametric surface: a restricted quadtree over (u, v) in [0,1]^2 (v wraps around) that splits a cell
// whenever the true surface deviates from the bilinear patch through its corners by more than `eps` mm, OR whenever
// the true surface normal deviates from the interpolated corner normals by more than `maxAngle` degrees (shading
// error: a big flat triangle whose corner normals were bent by a nearby groove renders as a visible wedge under the
// site's glossy clearcoat). Vertex normals are the analytic surface normals (central differences of the surface
// function), not averages of the adaptive triangles around them. Hanging nodes are stitched crack-free with an
// ear-clipped polygon. Returns an indexed BufferGeometry with outward winding and normals.
function adaptiveSurface(evalP, { cols = 4, rows = 8, maxLevel = 6, eps = 0.22, stencilMM = 0.7, maxAngle = 4, tag = null, mat = MAT.SHELL } = {}) {
  const leaves = new Map(); const key = (l, i, j) => l + ',' + i + ',' + j;
  const cellsU = (l) => cols << l, cellsV = (l) => rows << l;
  const uv = (l, i, j) => [i / cellsU(l), j / cellsV(l)];
  const cache = new Map();
  const P = (u, v) => { const k = u.toFixed(7) + ',' + v.toFixed(7); let p = cache.get(k); if (!p) { p = evalP(u, v); cache.set(k, p); } return p; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // analytic normal along du x dv (the winding direction of the triangles below); null at degenerate points (poles)
  const H = 2e-4;
  const normalAt = (u, v) => {
    const a = evalP(Math.max(0, u - H), v), b = evalP(Math.min(1, u + H), v), c = evalP(u, v - H), d = evalP(u, v + H);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz);
    return l > 1e-3 * lu * lv && l > 1e-9 ? [nx / l, ny / l, nz / l] : null;
  };
  const ncache = new Map();
  const N = (u, v) => { const k = u.toFixed(7) + ',' + v.toFixed(7); let n = ncache.get(k); if (n === undefined) { n = normalAt(u, v); ncache.set(k, n); } return n; };
  const cosMax = Math.cos((maxAngle * Math.PI) / 180);
  const normalsDeviate = (u0, v0, u1, v1) => {
    const n00 = N(u0, v0), n10 = N(u1, v0), n01 = N(u0, v1), n11 = N(u1, v1);
    if (!n00 || !n10 || !n01 || !n11) return false; // at a pole: shading there is handled by the mesh normal
    const M = 4;
    for (let a = 0; a <= M; a++) for (let b = 0; b <= M; b++) {
      const s = a / M, t = b / M; const tn = normalAt(u0 + (u1 - u0) * s, v0 + (v1 - v0) * t); if (!tn) continue;
      let x = 0, y = 0, z = 0;
      for (const [w, n] of [[(1 - s) * (1 - t), n00], [s * (1 - t), n10], [(1 - s) * t, n01], [s * t, n11]]) { x += w * n[0]; y += w * n[1]; z += w * n[2]; }
      const l = Math.hypot(x, y, z) || 1; if ((x * tn[0] + y * tn[1] + z * tn[2]) / l < cosMax) return true;
    }
    return false;
  };
  const needsSplit = (l, i, j) => {
    const [u0, v0] = uv(l, i, j), [u1, v1] = uv(l, i + 1, j + 1);
    const c00 = P(u0, v0), c10 = P(u1, v0), c01 = P(u0, v1), c11 = P(u1, v1);
    const size = Math.max(dist(c00, c10), dist(c01, c11), dist(c00, c01), dist(c10, c11));
    const n = clamp(Math.ceil(size / stencilMM) + 1, 3, 17);
    for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) {
      if ((a === 0 || a === n) && (b === 0 || b === n)) continue;
      const s = a / n, t = b / n; const p = evalP(u0 + (u1 - u0) * s, v0 + (v1 - v0) * t);
      let err = 0;
      for (let k = 0; k < 3; k++) { const bl = (1 - s) * (1 - t) * c00[k] + s * (1 - t) * c10[k] + (1 - s) * t * c01[k] + s * t * c11[k]; err += (p[k] - bl) ** 2; }
      if (err > eps * eps) return true;
    }
    if (tag) { // split where the material region boundary crosses the cell, so colour edges follow the feature
      const t0 = tag(u0, v0);
      for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) if (tag(u0 + ((u1 - u0) * a) / 4, v0 + ((v1 - v0) * b) / 4) !== t0) return true;
    }
    return normalsDeviate(u0, v0, u1, v1);
  };
  const split = (l, i, j) => { leaves.delete(key(l, i, j)); const out = []; for (const di of [0, 1]) for (const dj of [0, 1]) { const c = [l + 1, 2 * i + di, 2 * j + dj]; leaves.set(key(...c), c); out.push(c); } return out; };
  const queue = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { leaves.set(key(0, i, j), [0, i, j]); queue.push([0, i, j]); }
  while (queue.length) { const [l, i, j] = queue.pop(); if (l < maxLevel && needsSplit(l, i, j)) queue.push(...split(l, i, j)); }
  // leaf lookup by parametric point
  const leafAt = (u, v) => {
    if (u < 0 || u >= 1) return null; v = ((v % 1) + 1) % 1;
    for (let l = maxLevel; l >= 0; l--) { const i = Math.floor(u * cellsU(l)), j = Math.floor(v * cellsV(l)); const c = leaves.get(key(l, i, j)); if (c) return c; }
    return null;
  };
  // balance: neighbours differ by at most one level
  let changed = true;
  while (changed) {
    changed = false;
    for (const [l, i, j] of Array.from(leaves.values())) {
      if (!leaves.has(key(l, i, j))) continue;
      const [u0, v0] = uv(l, i, j), [u1, v1] = uv(l, i + 1, j + 1); const du = (u1 - u0) * 1e-3, dv = (v1 - v0) * 1e-3;
      const probes = [[u0 - du, (v0 + v1) / 2], [u1 + du, (v0 + v1) / 2], [(u0 + u1) / 2, v0 - dv], [(u0 + u1) / 2, v1 + dv]];
      for (const [pu, pv] of probes) { const nb = leafAt(pu, pv); if (nb && nb[0] < l - 1) { split(...nb); changed = true; } }
    }
  }
  if (process.env.VERBOSE) { const h = []; for (const [l] of leaves.values()) h[l] = (h[l] || 0) + 1; console.error('  leaves/level', JSON.stringify(h)); }
  // triangulate with doubled integer keys (cell centres need half steps)
  const NU = cellsU(maxLevel) * 2, NV = cellsV(maxLevel) * 2;
  const verts = new Map(); const pos = []; const nrm = []; const idx = []; const tags = [];
  const vtx = (I, J) => { J = ((J % NV) + NV) % NV; const k = I * NV + J; let id = verts.get(k); if (id === undefined) { id = pos.length / 3; const p = P(I / NU, J / NV); const n = N(I / NU, J / NV) || [0, 0, 0]; pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); verts.set(k, id); } return id; };
  for (const [l, i, j] of leaves.values()) {
    const step = 2 << (maxLevel - l); const I0 = i * step, J0 = j * step, I1 = I0 + step, J1 = J0 + step, Im = I0 + step / 2, Jm = J0 + step / 2;
    const [u0, v0] = uv(l, i, j), [u1, v1] = uv(l, i + 1, j + 1); const du = (u1 - u0) * 1e-3, dv = (v1 - v0) * 1e-3;
    const finer = (pu, pv) => { const nb = leafAt(pu, pv); return nb && nb[0] > l; };
    const ring = [[I0, J0]];
    if (finer((u0 + u1) / 2, v0 - dv)) ring.push([Im, J0]);
    ring.push([I1, J0]); if (finer(u1 + du, (v0 + v1) / 2)) ring.push([I1, Jm]);
    ring.push([I1, J1]); if (finer((u0 + u1) / 2, v1 + dv)) ring.push([Im, J1]);
    ring.push([I0, J1]); if (finer(u0 - du, (v0 + v1) / 2)) ring.push([I0, Jm]);
    earClip(ring.map(([I, J]) => ({ I, J, id: vtx(I, J) })), pos, (a, b, c) => {
      idx.push(a.id, b.id, c.id); tags.push(tag ? tag((a.I + b.I + c.I) / 3 / NU, (a.J + b.J + c.J) / 3 / NV) : mat);
    });
  }
  return finishSurface(pos, idx, nrm, tags);
}

// Triangulate a convex (in uv) cell ring that may carry collinear hanging nodes. Clips strictly convex corners only,
// picking the best-shaped triangle first, so no zero-area slivers are produced (a corner fan makes
// corner/midpoint/corner collinear triples, whose faces flip or collapse under quantisation and show as dark flecks).
function earClip(ring, pos, emit) {
  const quality = (a, b, c) => {
    const ax = pos[3 * a], ay = pos[3 * a + 1], az = pos[3 * a + 2], bx = pos[3 * b], by = pos[3 * b + 1], bz = pos[3 * b + 2], cx = pos[3 * c], cy = pos[3 * c + 1], cz = pos[3 * c + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const area2 = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    const l2 = ux * ux + uy * uy + uz * uz + vx * vx + vy * vy + vz * vz + (cx - bx) ** 2 + (cy - by) ** 2 + (cz - bz) ** 2;
    return l2 > 0 ? (2 * Math.sqrt(3) * area2) / l2 : 0;
  };
  const r = ring.slice();
  while (r.length > 3) {
    let best = -1, bestQ = -1; const n = r.length;
    for (let k = 0; k < n; k++) {
      const p = r[(k + n - 1) % n], c = r[k], q = r[(k + 1) % n];
      if ((c.I - p.I) * (q.J - c.J) - (c.J - p.J) * (q.I - c.I) <= 0) continue; // collinear or reflex in uv
      const sc = quality(p.id, c.id, q.id); if (sc > bestQ) { bestQ = sc; best = k; }
    }
    if (best < 0) best = 0; // cannot happen for a convex ring; keeps the loop finite
    const n2 = r.length; emit(r[(best + n2 - 1) % n2], r[best], r[(best + 1) % n2]); r.splice(best, 1);
  }
  emit(r[0], r[1], r[2]);
}

// Weld by position, drop degenerate faces, orient the shell outward (positive signed volume) and finish the normals:
// analytic surface normals where available (flipped together with the winding), angle-weighted mesh normals at
// poles. Consistent outward winding matters: the site's double-sided material flips the normal of every back face,
// so any face wound against its neighbours renders as a dark fleck.
function finishSurface(pos, idx, nrm, tags) {
  const map = new Map(); const remap = new Int32Array(pos.length / 3); const P = []; const Nn = [];
  for (let i = 0; i < pos.length; i += 3) {
    const k = `${Math.round(pos[i] * 1e3)},${Math.round(pos[i + 1] * 1e3)},${Math.round(pos[i + 2] * 1e3)}`; let id = map.get(k);
    if (id === undefined) { id = P.length / 3; map.set(k, id); P.push(pos[i], pos[i + 1], pos[i + 2]); Nn.push(nrm[i], nrm[i + 1], nrm[i + 2]); }
    else if (Nn[3 * id] === 0 && Nn[3 * id + 1] === 0 && Nn[3 * id + 2] === 0) { Nn[3 * id] = nrm[i]; Nn[3 * id + 1] = nrm[i + 1]; Nn[3 * id + 2] = nrm[i + 2]; }
    remap[i / 3] = id;
  }
  let keep = []; const keepTags = []; let vol = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let t = 0; t < idx.length; t += 3) {
    const a = remap[idx[t]], b = remap[idx[t + 1]], c = remap[idx[t + 2]]; if (a === b || b === c || a === c) continue;
    keep.push(a, b, c); keepTags.push(tags[t / 3]); A.fromArray(P, 3 * a); B.fromArray(P, 3 * b); C.fromArray(P, 3 * c); vol += A.dot(B.clone().cross(C));
  }
  if (vol < 0) { for (let t = 0; t < keep.length; t += 3) { const x = keep[t + 1]; keep[t + 1] = keep[t + 2]; keep[t + 2] = x; } for (let i = 0; i < Nn.length; i++) Nn[i] = -Nn[i]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(keep);
  const mesh = angleWeightedNormals(P, keep); // fallback where the analytic normal is undefined (poles)
  for (let i = 0; i < Nn.length; i += 3) if (Nn[i] === 0 && Nn[i + 1] === 0 && Nn[i + 2] === 0) { Nn[i] = mesh[i]; Nn[i + 1] = mesh[i + 1]; Nn[i + 2] = mesh[i + 2]; }
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.userData.tags = keepTags; // material id per triangle
  return g;
}

function angleWeightedNormals(P, ix) {
  const N = new Float32Array(P.length);
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t < ix.length; t += 3) {
    for (let k = 0; k < 3; k++) v[k].fromArray(P, 3 * ix[t + k]);
    fn.crossVectors(e1.subVectors(v[1], v[0]), e2.subVectors(v[2], v[0])); const l = fn.length(); if (l < 1e-12) continue; fn.divideScalar(l);
    for (let k = 0; k < 3; k++) {
      e1.subVectors(v[(k + 1) % 3], v[k]).normalize(); e2.subVectors(v[(k + 2) % 3], v[k]).normalize();
      const w = Math.acos(clamp(e1.dot(e2), -1, 1)); const i = ix[t + k];
      N[3 * i] += fn.x * w; N[3 * i + 1] += fn.y * w; N[3 * i + 2] += fn.z * w;
    }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  return N;
}

// Surface of revolution around Y from a 2D profile (array of [r, y], bottom -> top) smoothed with a centripetal
// Catmull-Rom spline; u runs along the profile (arc length), v around (theta = 0 faces +Z).
// disp(theta, y, r, u) returns an inward displacement (mm) along the surface normal.
function lathe(profile, cols, rows, disp = () => 0, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(profile.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  const NS = 4096; const pts = [], tans = [];
  for (let i = 0; i <= NS; i++) { const t = i / NS; pts.push(curve.getPointAt(t)); tans.push(curve.getTangentAt(t)); }
  const evalP = (u, v) => {
    const f = clamp(u, 0, 1) * NS; const i = Math.min(NS - 1, Math.floor(f)); const a = f - i;
    const p = pts[i], q = pts[i + 1], tg = tans[i], th = v * TAU;
    const r = Math.max(0, p.x + (q.x - p.x) * a), y = p.y + (q.y - p.y) * a;
    let nr = tg.y, ny = -tg.x; const nl = Math.hypot(nr, ny) || 1; nr /= nl; ny /= nl;
    const d = r > 1e-6 ? disp(th, y, r, u) : 0;
    const rr = r - d * nr, yy = y - d * ny;
    return [rr * Math.sin(th), yy, rr * Math.cos(th)];
  };
  const { tag, ...rest } = opts; // tag(theta, y, r) -> material id, evaluated on the undisplaced surface
  const tagAt = tag ? (u, v) => { const f = clamp(u, 0, 1) * NS; const i = Math.min(NS - 1, Math.floor(f)); const a = f - i; const p = pts[i], q = pts[i + 1]; return tag(v * TAU, p.y + (q.y - p.y) * a, Math.max(0, p.x + (q.x - p.x) * a)); } : null;
  return adaptiveSurface(evalP, { cols, rows, ...rest, tag: tagAt });
}

// Ellipsoid (radii rx, ry, rz) with displacement along its true normal. disp(dir, p) where dir is the unit
// sphere direction and p the undisplaced point; u = atan2(dir.x, dir.z) (0 faces +Z), v = asin(dir.y).
function ellipsoid(rx, ry, rz, cols, rows, disp = () => 0, opts = {}) {
  const evalP = (u, v) => {
    const phi = u * Math.PI; const th = v * TAU;
    const dir = [Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th)];
    const p = [rx * dir[0], ry * dir[1], rz * dir[2]];
    let n = [p[0] / (rx * rx), p[1] / (ry * ry), p[2] / (rz * rz)]; const nl = Math.hypot(...n) || 1; n = n.map((c) => c / nl);
    const d = disp(dir, p);
    return [p[0] - d * n[0], p[1] - d * n[1], p[2] - d * n[2]];
  };
  const { tag, ...rest } = opts; // tag(dir, p) -> material id, evaluated on the undisplaced surface
  const tagAt = tag ? (u, v) => { const phi = u * Math.PI, th = v * TAU; const dir = [Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th)]; return tag(dir, [rx * dir[0], ry * dir[1], rz * dir[2]]); } : null;
  return adaptiveSurface(evalP, { cols, rows, ...rest, tag: tagAt });
}

const place = (g, { pos = [0, 0, 0], rot = [0, 0, 0], quat = null, scale = [1, 1, 1] } = {}) => {
  const q = quat || new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(...scale))); return g;
};

// Every surface is registered with a default material (per-triangle tags from a surface's `tag` win).
const geoms = [];
const add = (part, g, xf, mat) => { if (xf) place(g, xf); if (mat !== undefined) g.userData.tags = new Array(g.index.count / 3).fill(mat); geoms.push({ part, g }); };

// =============================================================================
// LAYOUT (world y, mm). Drive ring on the floor, bell pelvis, waist gap, tapered torso with a shoulder line,
// ring-joint neck, small visor head. Head height ~0.55 x torso height.
// =============================================================================
const RING_H = 18;                 // drive ring
const PELVIS_Y0 = 16, PELVIS_H = 124;
const WAIST_Y = PELVIS_Y0 + PELVIS_H;        // 140
const TORSO_Y0 = WAIST_Y + 10, TORSO_H = 210; // 150..360
const TORSO_ZSCALE = 0.84;
const SHOULDER_LY = 170, SHOULDER_X = 104, SHOULDER_Z = 8;
const SHOULDER_Y = TORSO_Y0 + SHOULDER_LY;    // 326
const NECK_Y0 = TORSO_Y0 + TORSO_H - 6;       // 354
const NECK_BALL = [0, NECK_Y0 + 54, 6];
const HEAD_R = [68, 60, 64];
const HEAD_CENTRE = [0, NECK_BALL[1] + 44, 10];

// =============================================================================
// BASE: drive ring with three rounded foot pods, bell-shaped pelvis skirt with service details
// =============================================================================
{
  const ring = lathe([[0, 0], [96, 0], [116, 1], [124, 4], [126, 9], [125, 14], [118, RING_H - 1], [100, RING_H], [0, RING_H]], 3, 8,
    (th, y) => groove(y - 9, 2.6, 1.0), { maxLevel: 5 });
  add('body', ring, undefined, MAT.JOINT);
  for (const a of [0, 120, -120]) {
    const pod = ellipsoid(24, 11, 18, 2, 4, () => 0, { maxLevel: 4 });
    add('body', pod, { pos: [Math.sin(a * DEG) * 110, 9, Math.cos(a * DEG) * 110], rot: [0, a * DEG, 0] }, MAT.JOINT);
  }
  // Soft contact shadow: a flat, three-band dark ellipse (dark core, mid, light feathered edge) just below the foot
  // pods. A single-sided sheet. renormal.mjs inverts every winding and negates every normal, so it is generated
  // wound facing down with normals pointing down/away from the camera; after the flip it is front-facing from above
  // with a normal tilted toward the camera (0, 0.45, 0.9). Pointing straight up would be lit like a plate, and a
  // down-facing normal gets the full fresnel rim at the site's grazing view, turning it pale blue.
  const SEG = 96, bands = [[0, 108, MAT.SHADOW], [108, 142, MAT.SHADOW2], [142, 176, MAT.SHADOW3]];
  const ringPts = (r) => Array.from({ length: SEG }, (_, k) => { const a = (k / SEG) * TAU; return [Math.sin(a) * r, 0, Math.cos(a) * r * 0.82 + 6]; });
  const sp = [], sn = [], si = [], st = []; const radii = [0, 108, 142, 176]; let base = [];
  radii.forEach((r, ri) => { base.push(sp.length / 3); if (ri === 0) { sp.push(0, 0, 6); sn.push(0, -0.45, -0.9); } else for (const q of ringPts(r)) { sp.push(...q); sn.push(0, -0.45, -0.9); } });
  for (let k = 0; k < SEG; k++) { const k1 = (k + 1) % SEG;
    si.push(base[0], base[1] + k1, base[1] + k); st.push(bands[0][2]); // winding faces down (reversed by renormal.mjs)
    for (let b2 = 1; b2 < 3; b2++) { const a0 = base[b2] + k, a1 = base[b2] + k1, c0 = base[b2 + 1] + k, c1 = base[b2 + 1] + k1; si.push(a0, c1, c0, a0, a1, c1); st.push(bands[b2][2], bands[b2][2]); }
  }
  const shadow = new THREE.BufferGeometry(); shadow.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); shadow.setAttribute('normal', new THREE.Float32BufferAttribute(sn, 3)); shadow.setIndex(si); shadow.userData.tags = st;
  add('body', shadow, { pos: [0, -3.2, 0] });
}
const pelvisProfile = [[0, 0], [60, 0], [100, 0], [112, 1.5], [119, 6], [122, 16], [120, 36], [114, 60], [100, 82], [86, 100], [74, 112], [66, 118], [60, 122], [40, 124], [0, 124]];
function pelvisDisp(th, y, r) {
  let d = 0;
  const front = wrap(th), back = wrap(th - Math.PI);
  d += groove(y - 10, 2.6, 1.0);                     // skirt lip panel gap
  d += groove(y - 92, 2.4, 0.9);                     // upper shell panel gap
  // charging port (USB-C style) low on the back + power button beside it
  { const sd = sdRR(back * r, y - 40, 11, 5, 4); d += recess(sd, 2.6, 1.2); const sd2 = sdRR(back * r, y - 40, 5.2, 1.7, 1.6); d += recess(sd2, 2.2, 0.6); }
  { const sd = sdCircle(back * r - 30, y - 42, 6.5); d += recess(sd, 1.2, 1); d += dome(sdCircle(back * r - 30, y - 42, 5), 5, 1.0); }
  // status LED pinhole on the front, front bumper sensor slots
  d += recess(sdCircle(front * r, y - 30, 1.8), 0.8, 0.6);
  for (const k of [-1, 1]) { const sd = sdRR(front * r - k * 42, y - 24, 10, 1.6, 1.6); d += recess(sd, 1.5, 0.8); }
  // rear vent slots on the pelvis
  for (let k = 0; k < 4; k++) { const sd = sdRR(back * r, y - (58 + k * 7.5), 20, 1.3, 1.3); d += recess(sd, 1.6, 0.7); }
  return d;
}
function pelvisTag(th, y, r) {
  const front = wrap(th), back = wrap(th - Math.PI);
  if (sdRR(back * r, y - 40, 12, 6, 4) < 0 || sdCircle(back * r - 30, y - 42, 7.5) < 0) return MAT.PORT;      // charging port + power button
  if (sdRR(back * r, y - 69, 24, 14, 3) < 0) return MAT.VENT;                                                  // rear vent field
  for (const k of [-1, 1]) if (sdRR(front * r - k * 42, y - 24, 12, 3.5, 2) < 0) return MAT.VENT;               // front bumper sensor slots
  return MAT.SHELL;
}
add('body', lathe(pelvisProfile, 4, 8, pelvisDisp, { maxLevel: 6, eps: 0.3, maxAngle: 5, tag: pelvisTag }), { pos: [0, PELVIS_Y0, 0] });
// waist joint ring, sitting in the gap between pelvis and torso
add('body', lathe([[0, 0], [50, 0], [58, 1.5], [62, 5], [62, 20], [58, 23], [50, 24], [0, 24]], 2, 4, (th, y) => groove(y - 12, 2.6, 0.9), { maxLevel: 5 }), { pos: [0, WAIST_Y - 8, 0] }, MAT.JOINT);

// =============================================================================
// TORSO: tapered shell with a shoulder line, chest tablet, display ring, grille slots, mic ports, seams
// =============================================================================
const torsoProfile = [[0, 0], [50, 0], [70, 1], [78, 5], [82, 18], [86, 48], [94, 84], [104, 120], [110, 152], [112, 172], [110, 186], [102, 196], [90, 203], [70, 207], [50, 208.5], [0, 209]];
function torsoDisp(th, y, r) {
  let d = 0;
  const front = wrap(th), back = wrap(th - Math.PI), sideL = wrap(th - Math.PI / 2), sideR = wrap(th + Math.PI / 2);
  d += groove(y - 12, 2.6, 1.0);                       // skirt panel gap
  d += groove(y - 188, 2.6, 1.1);                      // shoulder-line (yoke) panel gap
  d += groove(back * r, 2.4, 1.0) * sstep(12, 15, y) * (1 - sstep(185, 188, y));     // rear vertical seam
  for (const s of [sideL, sideR]) d += groove(s * r, 2.4, 1.0) * sstep(12, 15, y) * (1 - sstep(130, 134, y)); // side shell seams
  // chest tablet: bezel recess with a deeper screen, plus a home-button dimple
  { const sd = sdRR(front * r, y - 92, 38, 28, 7); d += recess(sd, 2.4, 2.0); d += recess(sd + 4, 1.2, 1.6); d += recess(sdCircle(front * r, y - 92 - 24, 2.2), 0.5, 0.5); }
  // display/indicator ring on the upper chest: groove ring + sunk disc + raised lens
  { const dx = front * r, dy = y - 152; const sd = sdCircle(dx, dy, 12); d += groove(sd, 2.6, 1.3); d += recess(sd + 1.5, 0.7, 1.0); d += dome(sdCircle(dx, dy, 5.5), 5.5, 0.8); }
  // speaker grilles: 2 columns x 5 short slots on each side of the lower chest
  for (const sgn of [-1, 1]) for (let c = 0; c < 2; c++) for (let k = 0; k < 5; k++) {
    const sd = sdRR(wrap(th - sgn * 34 * DEG) * r - (c - 0.5) * 12 * sgn, y - (40 + k * 6.5), 4.6, 1.2, 1.2); d += recess(sd, 1.5, 0.7);
  }
  // side mic ports under the shoulders + rear vent field
  for (const s of [sideL, sideR]) { d += recess(sdCircle(s * r, y - 126, 3), 1.4, 0.8); d += recess(sdCircle(s * r - 10, y - 126, 3), 1.4, 0.8); }
  { const sdF = sdRR(back * r, y - 100, 32, 22, 8); d += recess(sdF, 0.6, 2); for (let k = 0; k < 6; k++) { const sd = sdRR(back * r, y - (84 + k * 6.8), 24, 1.3, 1.3); d += recess(sd, 1.8, 0.7); } }
  // shoulder sockets (the shoulder domes nest in these; only the rim gap is visible)
  for (const s of [sideL, sideR]) { const sd = sdCircle(s * r, y - SHOULDER_LY, 38); d += recess(sd, 3, 4); d += groove(sd + 1, 2.6, 1.2); }
  return d;
}
function torsoTag(th, y, r) {
  const front = wrap(th), back = wrap(th - Math.PI), sideL = wrap(th - Math.PI / 2), sideR = wrap(th + Math.PI / 2);
  { const sd = sdRR(front * r, y - 92, 38, 28, 7); if (sd < -4) return MAT.SCREEN; if (sd < 0.5) return MAT.BEZEL; } // chest tablet: dark screen in a mid bezel
  { const dx = front * r, dy = y - 152; const sd = sdCircle(dx, dy, 12);                                         // indicator ring: lit core, dark disc, grey rim
    if (sdCircle(dx, dy, 5.5) < 0) return MAT.LENS; if (sd < 0) return MAT.SCREEN; if (sd < 2.6) return MAT.JOINT; }
  for (const sgn of [-1, 1]) if (sdRR(wrap(th - sgn * 34 * DEG) * r, y - 53, 12, 15, 3) < 0) return MAT.VENT;     // speaker grille fields
  if (sdRR(back * r, y - 100, 32, 22, 8) < 0) return MAT.VENT;                                                  // rear vent field
  for (const s of [sideL, sideR]) if (sdCircle(s * r, y - 126, 4.5) < 0 || sdCircle(s * r - 10, y - 126, 4.5) < 0) return MAT.VENT; // side mic ports
  return MAT.SHELL;
}
add('body', lathe(torsoProfile, 4, 8, torsoDisp, { maxLevel: 6, eps: 0.3, maxAngle: 5, tag: torsoTag }), { pos: [0, TORSO_Y0, 0], scale: [1, 1, TORSO_ZSCALE] });

// =============================================================================
// NECK: collar, core column with three separated ring joints, ball joint
// =============================================================================
{
  const collar = lathe([[0, 0], [40, 0], [50, 1], [54, 4], [52, 8], [46, 11], [44, 15], [38, 17], [0, 17]], 2, 4, (th, y) => groove(y - 9.5, 2.2, 0.6), { maxLevel: 5 });
  add('neck', collar, { pos: [0, NECK_Y0 + 4, 6] });
  const core = lathe([[0, 0], [20, 0], [23, 1], [23, 44], [20, 45], [0, 45]], 2, 4, () => 0, { maxLevel: 4 });
  add('neck', core, { pos: [0, NECK_Y0 + 14, 6] }, MAT.JOINT);
  for (let k = 0; k < 3; k++) {
    const ring = lathe([[0, 0], [24, 0], [29, 1], [31, 3], [31, 6], [29, 8], [24, 9], [0, 9]], 2, 4, () => 0, { maxLevel: 4 });
    add('neck', ring, { pos: [0, NECK_Y0 + 18 + k * 12, 6] }, MAT.JOINT);
  }
  add('neck', ellipsoid(27, 27, 27, 2, 4, () => 0, { maxLevel: 4 }), { pos: NECK_BALL }, MAT.JOINT);
}

// =============================================================================
// HEAD: small ellipsoid with lipped visor recess, eye apertures with lens domes, shell seam, ear discs,
// forehead camera, rear sensor bump
// =============================================================================
function headDisp(dir, p) {
  const u = Math.atan2(dir[0], dir[2]); const v = Math.asin(clamp(dir[1], -1, 1));
  const R = 64;
  let d = 0;
  // visor: squircle in the angular chart, sunk 2.8 mm with a crisp edge, then a clear inner lip step
  const U0 = 56 * DEG, V0 = 37 * DEG, n = 2.7;
  const vv = v - (-4 * DEG);
  const sq = Math.pow(Math.pow(Math.abs(u / U0), n) + Math.pow(Math.abs(vv / V0), n), 1 / n);
  const sdV = (sq - 1) * U0 * R;
  d += recess(sdV, 2.8, 3.2);
  d += recess(sdV + 5.5, 1.2, 2.4);
  // eye apertures: rounded rectangles cut into the visor, each with a small lens dome inside
  for (const s of [-1, 1]) {
    const dx = wrap(u - s * 0.27) * R * Math.cos(v), dy = (v - 0.04) * R;
    const sd = sdRR(dx, dy, 9, 10, 4.5); d += recess(sd, 2.2, 0.9);
    d += dome(sdCircle(dx, dy, 5), 5, 1.3);
  }
  // forehead camera dimple with a lens dome
  { const dx = u * R * Math.cos(v), dy = (v - 45 * DEG) * R; const sd = sdCircle(dx, dy, 3.6); d += recess(sd, 1.0, 0.7); d += dome(sdCircle(dx, dy, 2.4), 2.4, 0.7); }
  // front/back shell seam: circle around the face at 80 degrees from +Z
  { const g = Math.acos(clamp(dir[2], -1, 1)); d += groove((g - 80 * DEG) * R, 2.2, 1.0); }
  // ear discs (microphone/speaker): sunk disc with a concentric ring pattern and a centre dome
  for (const s of [-1, 1]) {
    const dx = wrap(u - s * Math.PI / 2) * R * Math.cos(v), dy = v * R; const rr = Math.hypot(dx, dy);
    const sd = sdCircle(dx, dy, 13); d += recess(sd, 1.4, 1.0);
    if (rr < 10) d += 0.4 * (1 - Math.cos(rr * TAU / 3.6)) * 0.5 * sstep(1, 2.5, rr);
    d += dome(sdCircle(dx, dy, 2), 2, 0.5);
  }
  // rear sensor bump (depth camera) with a lens recess, and the rear service seam
  { const dx = wrap(u - Math.PI) * R * Math.cos(v), dy = (v - 8 * DEG) * R; d += dome(sdCircle(dx, dy, 11), 11, 2.6); d += recess(sdCircle(dx, dy, 3), 0.8, 0.6); }
  { const dx = wrap(u - Math.PI) * R * Math.cos(v); d += groove(dx, 2.0, 0.9) * sstep(-45 * DEG, -35 * DEG, v) * (1 - sstep(-6 * DEG, -2 * DEG, v)); d += groove(dx, 2.0, 0.9) * sstep(20 * DEG, 24 * DEG, v) * (1 - sstep(44 * DEG, 50 * DEG, v)); }
  return d;
}
// Material regions of the head (same charts as headDisp): near-black glass visor with a mid bezel lip, bright eye lens
// domes, grey ear discs and rear sensor.
function headTag(dir) {
  const u = Math.atan2(dir[0], dir[2]); const v = Math.asin(clamp(dir[1], -1, 1)); const R = 64;
  const U0 = 56 * DEG, V0 = 37 * DEG, n = 2.7; const vv = v - (-4 * DEG);
  const sdV = (Math.pow(Math.pow(Math.abs(u / U0), n) + Math.pow(Math.abs(vv / V0), n), 1 / n) - 1) * U0 * R;
  for (const s of [-1, 1]) { const dx = wrap(u - s * 0.27) * R * Math.cos(v), dy = (v - 0.04) * R; if (sdCircle(dx, dy, 5.2) < 0 && sdV < 0) return MAT.LENS; }
  if (sdV < 0) return sdV > -4 ? MAT.BEZEL : MAT.GLASS;
  { const dx = u * R * Math.cos(v), dy = (v - 45 * DEG) * R; if (sdCircle(dx, dy, 3.6) < 0) return MAT.GLASS; }          // forehead camera
  for (const s of [-1, 1]) { const dx = wrap(u - s * Math.PI / 2) * R * Math.cos(v), dy = v * R; if (sdCircle(dx, dy, 13) < 0) return MAT.JOINT; } // ear discs
  { const dx = wrap(u - Math.PI) * R * Math.cos(v), dy = (v - 8 * DEG) * R; if (sdCircle(dx, dy, 3) < 0) return MAT.GLASS; if (sdCircle(dx, dy, 11) < 0) return MAT.JOINT; } // rear sensor
  return MAT.SHELL;
}
{
  const head = ellipsoid(HEAD_R[0], HEAD_R[1], HEAD_R[2], 4, 8, headDisp, { maxLevel: 6, eps: 0.28, maxAngle: 5, tag: headTag });
  // attentive: pitched 6 degrees down toward the viewer, a touch of roll and yaw toward the three-quarter camera
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(6 * DEG, -6 * DEG, 5 * DEG, 'YXZ'));
  const off = new THREE.Vector3(HEAD_CENTRE[0] - NECK_BALL[0], HEAD_CENTRE[1] - NECK_BALL[1], HEAD_CENTRE[2] - NECK_BALL[2]).applyQuaternion(q);
  add('head', head, { pos: [NECK_BALL[0] + off.x, NECK_BALL[1] + off.y, NECK_BALL[2] + off.z], quat: q });
}

// =============================================================================
// HANDS: palm plate with seams, four two-phalanx fingers with knuckle joints and fingertip pads, thumb.
// Built in a local frame: fingers along +Y, palm normal +Z, `side` = which local X side carries the thumb.
// =============================================================================
const LV = { maxLevel: 3 };
// hinge pin across a finger joint: short cylinder along local X with an end-cap groove, radius slightly over the finger
function pin(r, len) {
  const g = lathe([[0, 0], [r * 0.8, 0], [r, 0.8], [r, len - 0.8], [r * 0.8, len], [0, len]], 2, 4, () => 0, LV);
  g.rotateZ(Math.PI / 2); g.translate(len / 2, 0, 0); return g;
}
function phalanx(L, r0, r1, pad) {
  return lathe([[0, 0], [r0 * 0.7, 0], [r0, 1.5], [r0, L * 0.45], [r1, L - 2], [r1 * 0.7, L], [0, L]], 2, 4,
    pad ? (th, y) => 1.3 * Math.max(0, Math.cos(th)) ** 2 * sstep(3, 8, y) * (1 - sstep(L - 2.5, L, y)) : () => 0,
    pad ? { ...LV, maxLevel: 4, tag: (th, y) => (Math.cos(th) > 0.3 && y > 3 && y < L - 2 ? MAT.PAD : MAT.SHELL) } : LV);
}
function buildHand(side) {
  const parts = []; // [geometry, matrix]
  const put = (g, pos, quat = new THREE.Quaternion(), scale = [1, 1, 1], mat) => {
    if (mat !== undefined) g.userData.tags = new Array(g.index.count / 3).fill(mat);
    parts.push(place(g, { pos: pos.toArray ? pos.toArray() : pos, quat, scale }));
  };
  // palm: flattened ellipsoid with a plate seam on both faces
  const palm = ellipsoid(23, 28, 8, 3, 4, (dir, p) => {
    if (Math.abs(dir[2]) < 0.35) return 0;
    const sd = sdRR(p[0], p[1] - 2, 15, 19, 6); return groove(sd, 2.2, 0.8) + recess(sd, 0.4, 1.5);
  }, { maxLevel: 4, tag: (dir, p) => (Math.abs(dir[2]) > 0.35 && sdRR(p[0], p[1] - 2, 15, 19, 6) < 0 ? MAT.BEZEL : MAT.SHELL) }); // palm plate
  put(palm, [0, 0, 0]);
  // wrist cuff joining the forearm
  put(lathe([[0, 0], [12, 0], [15, 1.5], [15, 10], [13, 12], [0, 12]], 2, 4, (th, y) => groove(y - 6, 2, 0.6), LV), [0, -30, 0]);
  const fingerX = [-13.5, -4.5, 4.5, 13.5];
  for (let i = 0; i < 4; i++) {
    const x = fingerX[i]; const fan = (x / 13.5) * 5 * DEG; const len = i === 1 || i === 2 ? 1 : 0.9;
    const L1 = 27 * len, L2 = 21 * len;
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(22 * DEG, 0, -fan, 'ZXY'));
    const K = new THREE.Vector3(x, 25, 0);
    put(pin(5.3, 11.8), K, q1, undefined, MAT.JOINT);
    put(phalanx(L1, 4.9, 4.5, false), K, q1);
    const q2 = q1.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(26 * DEG, 0, 0)));
    const P = K.clone().add(new THREE.Vector3(0, L1, 0).applyQuaternion(q1));
    put(pin(4.7, 10.6), P, q2, undefined, MAT.JOINT);
    put(phalanx(L2, 4.4, 3.8, true), P, q2);
  }
  // thumb: two phalanges from the palm base, pointing outward and toward the palm
  {
    const T = new THREE.Vector3(side * 20, 0, 3);
    const dir1 = new THREE.Vector3(side * 0.82, 0.5, 0.28).normalize();
    const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1);
    put(ellipsoid(6.4, 6.4, 6.4, 2, 4, () => 0, LV), T, undefined, undefined, MAT.JOINT);
    put(phalanx(21, 5.4, 4.9, false), T, q1);
    const P = T.clone().add(dir1.clone().multiplyScalar(18));
    const dir2 = new THREE.Vector3(side * 0.55, 0.55, 0.63).normalize();
    const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir2);
    put(pin(5, 11.2), P, q1, undefined, MAT.JOINT);
    put(phalanx(17, 4.7, 4.1, true), P, q2);
  }
  return parts;
}

// =============================================================================
// ARMS: domed shoulder shell nested in the torso socket, capsule upper arm, elbow hidden in the forearm cup,
// flattened forearm shell, articulated hand. Pose: elbows close to the torso, forearms forward and open, palms up.
// =============================================================================
function buildArm(part, side, upperDir, foreDir, palmNormal) {
  const S = new THREE.Vector3(side * (SHOULDER_X - 4), SHOULDER_Y, SHOULDER_Z);
  const ua = new THREE.Vector3(...upperDir).normalize(), fa = new THREE.Vector3(...foreDir).normalize();
  const LU = 92, LF = 90;
  const upper = lathe([[0, 0], [16, 0.6], [28, 4], [34, 12], [36.5, 24], [35, 38], [31, 50], [28.5, 62], [28, LU - 22], [26, LU - 8], [18, LU - 1], [0, LU]], 3, 4,
    (th, y) => groove(y - 44, 2.4, 1.0), { maxLevel: 5 });
  const qU = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ua);
  add(part, upper, { pos: S.clone().add(ua.clone().multiplyScalar(-26)).toArray(), quat: qU });
  const E = S.clone().add(ua.clone().multiplyScalar(LU - 30));
  add(part, ellipsoid(18, 18, 18, 2, 4, () => 0, { maxLevel: 4 }), { pos: E.toArray() }, MAT.JOINT);
  // forearm frame: Y along the forearm, Z = palm normal projected perpendicular to it
  const Y = fa.clone(); const pn = new THREE.Vector3(...palmNormal);
  const Z = pn.sub(Y.clone().multiplyScalar(Y.dot(pn))).normalize();
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
  const qF = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  const fore = lathe([[0, 0], [14, 0.5], [23, 4], [29, 14], [30.5, 30], [30, 48], [27.5, LF - 24], [23, LF - 8], [18, LF - 2], [13, LF], [0, LF]], 3, 4,
    (th, y) => groove(y - (LF - 14), 2.4, 0.9) + groove(y - 16, 2.4, 0.8), { maxLevel: 5 });
  add(part, fore, { pos: E.clone().add(Y.clone().multiplyScalar(-18)).toArray(), quat: qF, scale: [1, 1, 0.84] });
  // hand: local X side carrying the thumb is the body side (local X = Y x Z)
  const W = E.clone().add(fa.clone().multiplyScalar(LF - 16));
  const thumbSide = Math.sign(X.x * -side) || 1;
  const handOrigin = W.clone().add(Y.clone().multiplyScalar(34));
  for (const g of buildHand(thumbSide)) add(part, g, { pos: handOrigin.toArray(), quat: qF });
}
// robot's right arm (-X) and left arm (+X): hanging close to the torso, forearms forward and slightly open,
// palms up and turned a little inward (presenting / listening)
buildArm('armR', -1, [-0.1, -0.95, 0.26], [-0.14, 0.22, 0.96], [-0.5, 1, 0]);
buildArm('armL', +1, [0.1, -0.95, 0.26], [0.14, 0.22, 0.96], [0.5, 1, 0]);

// =============================================================================
// EXPORT
// =============================================================================
const scene = new THREE.Scene();
let tris = 0;
const ONLY = process.env.PART ? process.env.PART.split(',') : null; // debug: PART=head node build-bot.mjs out.glb
// One mesh per material: bucket every surface's triangles by tag (vertices on a material border are duplicated into
// both buckets with identical positions and normals, so shading stays continuous).
const buckets = MAT_DEF.map(() => ({ pos: [], nrm: [], idx: [] }));
for (const { part, g } of geoms) {
  if (ONLY && !ONLY.includes(part)) continue;
  const P = g.attributes.position, N = g.attributes.normal, ix = g.index.array, tg = g.userData.tags;
  const maps = new Map();
  const vert = (m, i) => {
    const bk = buckets[m]; let mp = maps.get(m); if (!mp) { mp = new Map(); maps.set(m, mp); }
    let id = mp.get(i); if (id === undefined) { id = bk.pos.length / 3; mp.set(i, id); bk.pos.push(P.getX(i), P.getY(i), P.getZ(i)); bk.nrm.push(N.getX(i), N.getY(i), N.getZ(i)); }
    return id;
  };
  for (let t = 0; t < ix.length; t += 3) { const m = tg[t / 3]; buckets[m].idx.push(vert(m, ix[t]), vert(m, ix[t + 1]), vert(m, ix[t + 2])); }
}
buckets.forEach((bk, m) => {
  if (!bk.idx.length) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(bk.nrm, 3)); geo.setIndex(bk.idx);
  const [name, L] = MAT_DEF[m]; tris += bk.idx.length / 3;
  if (process.env.VERBOSE) console.error(name, bk.idx.length / 3);
  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(L, L, L, THREE.LinearSRGBColorSpace), roughness: 0.5, metalness: 0 }); material.name = name;
  const mesh = new THREE.Mesh(geo, material); mesh.name = name; scene.add(mesh);
});
const exporter = new GLTFExporter();
const buf = await exporter.parseAsync(scene, { binary: true });
fs.writeFileSync(OUT, Buffer.from(buf));
console.log(JSON.stringify({ tris, bytes: fs.statSync(OUT).size, out: OUT }));
