// Shared helpers for the procedural truck generator (truck.mjs, truck-cab.mjs, truck-details.mjs, truck-trailer.mjs).
// Metres. Y up. Nose toward +Z, left side toward +X. Side details are authored once in the +X (left) frame and
// mirrored for -X with `bothSides` (winding is flipped automatically for reflected parts).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LoftGeometry } from 'three/examples/jsm/geometries/LoftGeometry.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE, LoftGeometry, RoundedBoxGeometry, mergeGeometries, mergeVertices, toCreasedNormals };
export const parts = [];
// Material tag of each part (parallel to `parts`); set with setMat() before adding a group of parts.
export const partMats = [];
let CUR = 'cab';
export const setMat = (m) => { CUR = m; };
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const V2 = (x, y) => new THREE.Vector2(x, y);
export const T = (x = 0, y = 0, z = 0) => new THREE.Matrix4().makeTranslation(x, y, z);
export const RX = (a) => new THREE.Matrix4().makeRotationX(a);
export const RY = (a) => new THREE.Matrix4().makeRotationY(a);
export const RZ = (a) => new THREE.Matrix4().makeRotationZ(a);
export const SC = (x, y = x, z = x) => new THREE.Matrix4().makeScale(x, y, z);
export const mul = (...ms) => ms.reduce((a, b) => a.multiply(b), new THREE.Matrix4());
export const D2R = Math.PI / 180;

let MIR = null; // active mirror matrix while building the right-hand side

function flipWinding(g) {
  for (const name of ['position', 'normal']) {
    const a = g.attributes[name]; if (!a) continue;
    const arr = a.array;
    for (let i = 0; i < arr.length; i += 9) for (let k = 0; k < 3; k++) { const t = arr[i + 3 + k]; arr[i + 3 + k] = arr[i + 6 + k]; arr[i + 6 + k] = t; }
    a.needsUpdate = true;
  }
}
// Signed volume (positive when triangles wind outward) of a non-indexed or indexed triangle soup.
export function signedVolume(g) {
  const p = g.attributes.position; const idx = g.index; let v = 0;
  const n = idx ? idx.count : p.count; const a = V3(0, 0, 0), b = V3(0, 0, 0), c = V3(0, 0, 0);
  for (let i = 0; i < n; i += 3) {
    const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(p, ia); b.fromBufferAttribute(p, ib); c.fromBufferAttribute(p, ic);
    v += a.dot(b.clone().cross(c)) / 6;
  }
  return v;
}
// Flip a closed solid that came out inside-out.
export function orient(g) {
  if (signedVolume(g) < 0) {
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.index.needsUpdate = true; }
    else flipWinding(g);
  }
  return g;
}

export function add(g, m) {
  if (m) g.applyMatrix4(m);
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (!g.attributes.normal) g.computeVertexNormals();
  if (g.index) g = g.toNonIndexed();
  if (MIR) { g.applyMatrix4(MIR); flipWinding(g); }
  parts.push(g); partMats.push(CUR);
  return g;
}
// Run fn(side) for the left (+1) frame and then the mirrored right (-1) frame.
export function bothSides(fn) {
  fn(1);
  MIR = SC(-1, 1, 1); try { fn(-1); } finally { MIR = null; }
}
export function mirrorOnly(fn) { MIR = SC(-1, 1, 1); try { fn(-1); } finally { MIR = null; } }

// ---------- primitive helpers ----------
export const box = (w, h, d, x, y, z) => add(new THREE.BoxGeometry(w, h, d), T(x, y, z));
export const rbox = (w, h, d, r, x, y, z, seg = 2) => add(new RoundedBoxGeometry(w, h, d, seg, r), T(x, y, z));
export const cylX = (r, len, x, y, z, seg = 24) => add(new THREE.CylinderGeometry(r, r, len, seg), mul(T(x, y, z), RZ(Math.PI / 2)));
export const cylY = (r, len, x, y, z, seg = 24) => add(new THREE.CylinderGeometry(r, r, len, seg), T(x, y, z));
export const cylZ = (r, len, x, y, z, seg = 24) => add(new THREE.CylinderGeometry(r, r, len, seg), mul(T(x, y, z), RX(Math.PI / 2)));
export const sphere = (r, x, y, z, seg = 16) => add(new THREE.SphereGeometry(r, seg, seg / 2), T(x, y, z));
export function tube(pts, r, seg = 24, rad = 10, closed = false, tension = 0.5) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => V3(...p)), closed, 'catmullrom', tension);
  return add(new THREE.TubeGeometry(curve, seg, r, rad, closed));
}
export function creased(g, deg = 40) {
  const c = toCreasedNormals(g, (deg * Math.PI) / 180);
  if (c.attributes.uv) c.deleteAttribute('uv');
  return c;
}
// Rounded rectangle, CCW in XY, 4*(n+1) points. y0 bottom, y1 top.
export function rrect(cx, y0, y1, w, rT, rB, n = 7) {
  const hw = w / 2;
  const corners = [
    [cx + hw - rB, y0 + rB, -Math.PI / 2, rB],
    [cx + hw - rT, y1 - rT, 0, rT],
    [cx - hw + rT, y1 - rT, Math.PI / 2, rT],
    [cx - hw + rB, y0 + rB, Math.PI, rB],
  ];
  const pts = [];
  for (const [ccx, ccy, a0, r] of corners)
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([ccx + r * Math.cos(a), ccy + r * Math.sin(a)]);
    }
  return pts;
}
export const sec = (z, y0, y1, w, rT, rB, cx = 0) => rrect(cx, y0, y1, w, rT, rB).map(([x, y]) => V3(x, y, z));
// Loft through sections (arrays of Vector3). When both ends are capped the result is forced outward-facing.
export function loft(sections, opts, crease = 40) {
  const g = new LoftGeometry(sections, { closed: true, ...opts });
  if (opts.capStart && opts.capEnd) orient(g);
  return add(creased(g, crease));
}
export function shapeFrom(pts, holes = []) {
  const s = new THREE.Shape(pts.map(([x, y]) => V2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => V2(x, y))));
  return s;
}
// Ring (frame) around a rounded rect, extruded along +Z local from 0..depth
export function ringGeom(w, h, r, t, depth) {
  const outer = rrect(0, -h / 2, h / 2, w, r, r);
  const inner = rrect(0, -h / 2 + t, h / 2 - t, w - 2 * t, Math.max(0.005, r - t), Math.max(0.005, r - t));
  return new THREE.ExtrudeGeometry(shapeFrom(outer, [inner]), { depth, bevelEnabled: false, curveSegments: 6 });
}
// Horizontal plate from a top-view shape. pts are [x,z]; spans y in [yTop-h, yTop].
export function plate(pts, h, yTop, bevel = 0, holes = []) {
  const sh = shapeFrom(pts, holes);
  const g = new THREE.ExtrudeGeometry(sh, bevel > 0
    ? { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 }
    : { depth: h, bevelEnabled: false, curveSegments: 8 });
  return add(g, mul(T(0, yTop, 0), RX(Math.PI / 2)));
}
// Rounded convex polygon (points [a,b]); r = corner radius, n = segments per corner.
export function roundPoly(pts, r, n = 4) {
  const out = [];
  const m = pts.length;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i + m - 1) % m], p1 = pts[i], p2 = pts[(i + 1) % m];
    const d0 = [p0[0] - p1[0], p0[1] - p1[1]], d2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l0 = Math.hypot(...d0), l2 = Math.hypot(...d2);
    const rr = Math.min(r, l0 * 0.45, l2 * 0.45);
    const a = [p1[0] + (d0[0] / l0) * rr, p1[1] + (d0[1] / l0) * rr];
    const b = [p1[0] + (d2[0] / l2) * rr, p1[1] + (d2[1] / l2) * rr];
    for (let k = 0; k <= n; k++) { // quadratic bezier a -> p1 -> b
      const t = k / n, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * p1[0] + t * t * b[0], u * u * a[1] + 2 * u * t * p1[1] + t * t * b[1]]);
    }
  }
  return out;
}
// Offset a convex CCW polygon outward by d (miter), d<0 shrinks.
export function offsetPoly(pts, d) {
  const m = pts.length; const out = [];
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i + m - 1) % m], p1 = pts[i], p2 = pts[(i + 1) % m];
    const e0 = [p1[0] - p0[0], p1[1] - p0[1]], e1 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l0 = Math.hypot(...e0), l1 = Math.hypot(...e1);
    const n0 = [e0[1] / l0, -e0[0] / l0], n1 = [e1[1] / l1, -e1[0] / l1]; // outward for CCW
    let bx = n0[0] + n1[0], by = n0[1] + n1[1]; const bl = Math.hypot(bx, by); bx /= bl; by /= bl;
    const k = d / Math.max(0.3, bx * n0[0] + by * n0[1]);
    out.push([p1[0] + bx * k, p1[1] + by * k]);
  }
  return out;
}
export const ccw = (pts) => {
  let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a > 0 ? pts : pts.slice().reverse();
};

// ---------- layout constants ----------
export const TY = 0.525; // wheel centre height (tyre OD 1.05 m)
export const ST = 4.55; // steer axle z
export const D1 = -0.4, D2 = -1.7; // drive axles
export const T1 = -12.6, T2 = -13.9; // trailer axles
export const XO = 1.085, XI = 0.755; // dual outer / inner tyre centre x
export const XS = 1.0; // steer tyre centre x
export const TRL = 16.15, TRW = 2.6; // trailer length / width
export const TRY0 = 1.3, TRY1 = 4.1; // trailer floor / roof
