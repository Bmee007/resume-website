// Procedural North American semi-truck (long-nose sleeper tractor + 53' dry van).
// Metres. Y up. Nose toward +Z, left side toward +X (site convention).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LoftGeometry } from 'three/examples/jsm/geometries/LoftGeometry.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import fs from 'node:fs';

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/truck.glb';
const parts = [];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);

function add(g, m) {
  if (m) g.applyMatrix4(m);
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (!g.attributes.normal) g.computeVertexNormals();
  if (g.index) g = g.toNonIndexed();
  parts.push(g);
  return g;
}
const T = (x = 0, y = 0, z = 0) => new THREE.Matrix4().makeTranslation(x, y, z);
const RX = (a) => new THREE.Matrix4().makeRotationX(a);
const RY = (a) => new THREE.Matrix4().makeRotationY(a);
const RZ = (a) => new THREE.Matrix4().makeRotationZ(a);
const mul = (...ms) => ms.reduce((a, b) => a.multiply(b), new THREE.Matrix4());

// ---------- primitive helpers ----------
const box = (w, h, d, x, y, z) => add(new THREE.BoxGeometry(w, h, d), T(x, y, z));
const rbox = (w, h, d, r, x, y, z, seg = 3) => add(new RoundedBoxGeometry(w, h, d, seg, r), T(x, y, z));
const cylX = (r, len, x, y, z, seg = 24) => add(new THREE.CylinderGeometry(r, r, len, seg), mul(T(x, y, z), RZ(Math.PI / 2)));
const cylY = (r, len, x, y, z, seg = 24) => add(new THREE.CylinderGeometry(r, r, len, seg), T(x, y, z));
const cylZ = (r, len, x, y, z, seg = 24) => add(new THREE.CylinderGeometry(r, r, len, seg), mul(T(x, y, z), RX(Math.PI / 2)));
const sphere = (r, x, y, z, seg = 16) => add(new THREE.SphereGeometry(r, seg, seg / 2), T(x, y, z));
function tube(pts, r, seg = 24, rad = 10) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => V3(...p)));
  return add(new THREE.TubeGeometry(curve, seg, r, rad, false));
}
function creased(g, deg = 40) {
  const c = toCreasedNormals(g, (deg * Math.PI) / 180);
  if (c.attributes.uv) c.deleteAttribute('uv');
  return c;
}

// Rounded rectangle, CCW in XY, 4*(n+1) points. y0 bottom, y1 top.
function rrect(cx, y0, y1, w, rT, rB, n = 7) {
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
const sec = (z, y0, y1, w, rT, rB, cx = 0) => rrect(cx, y0, y1, w, rT, rB).map(([x, y]) => V3(x, y, z));
function loft(sections, opts, crease = 40) {
  const g = new LoftGeometry(sections, { closed: true, ...opts });
  return add(creased(g, crease));
}
// Shape from 2D point list (and optional holes)
function shapeFrom(pts, holes = []) {
  const s = new THREE.Shape(pts.map(([x, y]) => V2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => V2(x, y))));
  return s;
}
// Ring (frame) around a rounded rect, extruded along +Z local from 0..depth
function ringGeom(w, h, r, t, depth) {
  const outer = rrect(0, -h / 2, h / 2, w, r, r);
  const inner = rrect(0, -h / 2 + t, h / 2 - t, w - 2 * t, Math.max(0.005, r - t), Math.max(0.005, r - t));
  return new THREE.ExtrudeGeometry(shapeFrom(outer, [inner]), { depth, bevelEnabled: false, curveSegments: 6 });
}
// Panel on a cab side. pts are [z,y]; side=+1 left (+X), -1 right. Extruded outward by depth from plane x=side*x0.
function sidePanel(pts, holes, depth, side, x0) {
  const sh = shapeFrom(pts.map(([z, y]) => [-side * z, y]), holes.map((h) => h.map(([z, y]) => [-side * z, y])));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  return add(g, mul(T(side * x0, 0, 0), RY((side * Math.PI) / 2)));
}
// Horizontal plate from a top-view shape. pts are [x,z]; spans y in [yTop-h, yTop].
function plate(pts, h, yTop, bevel = 0, holes = []) {
  const sh = shapeFrom(pts, holes);
  const g = new THREE.ExtrudeGeometry(sh, bevel > 0
    ? { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 }
    : { depth: h, bevelEnabled: false, curveSegments: 8 });
  return add(g, mul(T(0, yTop, 0), RX(Math.PI / 2)));
}

// ---------- layout constants ----------
const TY = 0.525; // wheel centre height (tyre OD 1.05 m)
const ST = 4.55; // steer axle z
const D1 = -0.4, D2 = -1.7; // drive axles
const T1 = -12.6, T2 = -13.9; // trailer axles
const XO = 1.085, XI = 0.755; // dual outer / inner tyre centre x
const XS = 1.0; // steer tyre centre x
const TRL = 16.15, TRW = 2.6; // trailer length / width
const TRY0 = 1.3, TRY1 = 4.1; // trailer floor / roof

// ---------- wheels ----------
function tyreGeom() {
  const R = 0.525, rb = 0.29;
  const p = [[rb, -0.1], [0.33, -0.13], [0.40, -0.148], [0.46, -0.15], [0.50, -0.14], [0.515, -0.125], [R, -0.105]];
  const gw = 0.011, gd = 0.016;
  for (const g of [-0.066, -0.022, 0.022, 0.066]) p.push([R, g - gw], [R - gd, g - gw + 0.003], [R - gd, g + gw - 0.003], [R, g + gw]);
  p.push([R, 0.105], [0.515, 0.125], [0.50, 0.14], [0.46, 0.15], [0.40, 0.148], [0.33, 0.13], [rb, 0.1]);
  const lathe = new THREE.LatheGeometry(p.map(([r, y]) => V2(r, y)), 56);
  lathe.rotateZ(-Math.PI / 2); // axis Y -> X, +Y -> +X
  return creased(lathe, 35);
}
const TYRE = tyreGeom();
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
function wheel(x, y, z, rim) {
  const m = x >= 0 ? T(x, y, z) : mul(T(x, y, z), RY(Math.PI));
  add(TYRE.clone(), m);
  add(rim.clone(), m);
}
// steer
wheel(XS, TY, ST, RIM_OUT); wheel(-XS, TY, ST, RIM_OUT);
for (const z of [D1, D2, T1, T2]) {
  wheel(XO, TY, z, RIM_IN); wheel(-XO, TY, z, RIM_IN);
  wheel(XI, TY, z, RIM_PLAIN); wheel(-XI, TY, z, RIM_PLAIN);
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
  const g = new LoftGeometry(secs, { closed: true, capStart: true, capEnd: true }); add(creased(g, 40));
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
  add(creased(new LoftGeometry(secs, { closed: true, capStart: true, capEnd: true }), 40));
}

// ---------- cab ----------
const cabSecs = [
  sec(1.0, 1.1, 3.08, 2.5, 0.22, 0.05),
  sec(2.1, 1.1, 3.08, 2.5, 0.22, 0.05),
  sec(2.92, 1.1, 3.08, 2.5, 0.24, 0.05),
  sec(3.02, 1.1, 3.0, 2.5, 0.3, 0.05),
  sec(3.45, 1.1, 2.0, 2.5, 0.12, 0.05),
];
loft(cabSecs, { capStart: true, capEnd: true }, 38);
// windshield surround (sloped plane from (z 3.45,y 2.0) to (z 3.02,y 3.0)) + centre divider + wipers
{
  const dz = 3.02 - 3.45, dy = 3.0 - 2.0; const len = Math.hypot(dz, dy); const ang = Math.atan2(dz, dy); // rotation about X
  const mid = { y: 2.5, z: (3.45 + 3.02) / 2 };
  const place = (g, u, v, out) => add(g, mul(T(0, mid.y, mid.z), RX(ang), T(u, v, out)));
  place(ringGeom(2.3, len - 0.1, 0.1, 0.045, 0.02), 0, 0, 0.0);
  place(new THREE.BoxGeometry(0.05, len - 0.15, 0.02), 0, 0, 0.01);
  for (const s of [1, -1]) place(new THREE.BoxGeometry(0.02, 0.62, 0.015).applyMatrix4(RZ(s * 0.5)), s * 0.5, -0.1, 0.015); // wipers
  // sun visor
  rbox(2.35, 0.03, 0.34, 0.01, 0, 3.06, 3.13);
  for (let i = -2; i <= 2; i++) sphere(0.035, i * 0.27, 3.09, 3.22, 10);
}
// doors (proud panels with window cut-outs) and side detail
for (const s of [1, -1]) {
  const door = [[2.12, 1.16], [3.4, 1.16], [3.4, 2.0], [3.14, 2.86], [2.12, 2.86]];
  const win = [[2.26, 2.1], [3.3, 2.1], [3.1, 2.76], [2.26, 2.76]];
  sidePanel(door, [win], 0.03, s, 1.25);
  rbox(0.04, 0.05, 0.2, 0.012, s * 1.285, 1.78, 2.32); // handle
  // grab handles
  cylY(0.014, 1.1, s * 1.3, 1.85, 3.46, 10); for (const y of [1.33, 2.37]) cylX(0.012, 0.06, s * 1.275, y, 3.46, 8);
  cylY(0.014, 1.0, s * 1.3, 1.8, 2.06, 10); for (const y of [1.33, 2.27]) cylX(0.012, 0.06, s * 1.275, y, 2.06, 8);
  // sleeper window bezel
  add(ringGeom(0.6, 0.42, 0.06, 0.03, 0.02), mul(T(s * 1.25, 2.35, 1.55), RY((s * Math.PI) / 2)));
  // mirrors (west-coast) : arms + head + convex spot mirror
  for (const y of [1.98, 2.62]) cylX(0.016, 0.3, s * 1.4, y, 3.38, 10);
  rbox(0.07, 0.72, 0.24, 0.02, s * 1.55, 2.3, 3.4);
  rbox(0.06, 0.2, 0.2, 0.02, s * 1.55, 1.68, 3.4); cylY(0.014, 0.2, s * 1.52, 1.85, 3.4, 8);
  // hood mirror on fender
  cylY(0.012, 0.16, s * 1.08, 1.98, 4.95, 8); rbox(0.05, 0.22, 0.17, 0.015, s * 1.08, 2.14, 4.95);
  // cab steps + fairing behind steer wheel
  rbox(0.42, 0.07, 0.62, 0.015, s * 1.0, 0.5, 3.6); rbox(0.42, 0.07, 0.62, 0.015, s * 1.0, 0.82, 3.6);
  box(0.04, 0.68, 0.62, s * 0.78, 0.8, 3.6); box(0.38, 0.03, 0.04, s * 1.0, 1.12, 3.3);
  box(0.42, 0.5, 0.03, s * 1.0, 0.65, 3.3); // back plate
  // fuel tank with straps, end caps, step on top
  cylZ(0.33, 1.55, s * 0.88, 0.76, 2.4, 36);
  for (const z of [2.0, 2.8]) cylZ(0.345, 0.05, s * 0.88, 0.76, z, 36);
  for (const z of [1.63, 3.17]) cylZ(0.3, 0.04, s * 0.88, 0.76, z, 36);
  cylY(0.05, 0.05, s * 0.88, 1.1, 2.9, 12); // filler cap
  rbox(0.36, 0.03, 0.9, 0.01, s * 0.9, 1.11, 2.4); // step plate on tank
  box(0.1, 0.4, 0.08, s * 0.5, 0.9, 2.0); box(0.1, 0.4, 0.08, s * 0.5, 0.9, 2.8); // tank hangers
  // side extenders + exhaust stack
  rbox(0.04, 2.55, 0.5, 0.01, s * 1.24, 2.55, 0.76);
  cylY(0.07, 2.75, s * 1.12, 2.68, 0.78, 20); cylY(0.105, 1.3, s * 1.12, 2.05, 0.78, 20);
  const elbow = new THREE.TorusGeometry(0.15, 0.07, 10, 14, Math.PI / 2); add(elbow, mul(T(s * 0.97, 1.3, 0.78), RZ(s > 0 ? -Math.PI / 2 : Math.PI)));
  cylX(0.07, 0.5, s * 0.72, 1.15, 0.78, 16);
  cylY(0.06, 0.1, s * 1.12, 4.08, 0.78, 16); // stack tip
}
// roof fairing (ramps from windshield header up to trailer height)
const fairSecs = [];
for (const z of [2.95, 2.8, 2.65, 2.5, 2.35, 2.2, 2.05, 1.85, 1.5, 1.0]) {
  const t = Math.min(1, (2.95 - z) / 1.0); const k = t * t * (3 - 2 * t); // smoothstep rise
  fairSecs.push(sec(z, 3.0, 3.08 + 0.9 * k, 1.9 + 0.6 * k, 0.035 + 0.43 * k, 0.03));
}
loft(fairSecs, { capStart: true, capEnd: true }, 38);
// air / electrical lines cab -> trailer
for (const x of [-0.22, 0, 0.22]) tube([[x, 3.3, 0.98], [x, 2.85, 0.5], [x, 3.45, 0.04]], 0.022, 20, 8);
box(0.7, 0.16, 0.08, 0, 3.52, 0.04);

// ---------- trailer ----------
rbox(TRW, TRY1 - TRY0, TRL, 0.05, 0, (TRY0 + TRY1) / 2, -TRL / 2, 2);
for (const s of [1, -1]) {
  for (let i = 0; i < 26; i++) box(0.025, 2.56, 0.05, s * 1.3125, 2.72, -0.35 - i * 0.61); // posts
  box(0.03, 0.12, TRL, s * 1.315, 4.0, -TRL / 2); // top rail
  box(0.04, 0.22, TRL, s * 1.32, 1.36, -TRL / 2); // bottom rail
}
// aero side skirts
for (const s of [1, -1]) {
  const skirt = [[-4.3, 1.27], [-11.3, 1.27], [-11.3, 0.5], [-10.9, 0.42], [-5.0, 0.42], [-4.3, 0.75]];
  sidePanel(skirt, [], 0.03, s, 1.27);
  for (const z of [-5.5, -7.5, -9.5]) box(0.08, 0.6, 0.06, s * 1.1, 0.85, z); // brackets (inside)
}
// front top aero lip
box(TRW + 0.06, 0.12, 0.03, 0, 4.0, 0.015);
// floor crossmembers
for (let z = -0.6; z > -TRL + 0.4; z -= 0.3) box(2.5, 0.1, 0.05, 0, 1.25, z);
// rear frame, doors, hinges, lock rods, lights
{
  const zr = -TRL;
  for (const s of [1, -1]) box(0.1, 2.82, 0.09, s * 1.25, 2.7, zr - 0.04);
  box(2.6, 0.12, 0.09, 0, 4.03, zr - 0.04);
  box(2.6, 0.17, 0.1, 0, 1.385, zr - 0.045);
  for (const s of [1, -1]) {
    box(1.17, 2.5, 0.03, s * 0.605, 2.72, zr - 0.06); // door
    for (const y of [1.72, 2.45, 3.18, 3.86]) { // hinges
      box(0.11, 0.26, 0.04, s * 1.26, y, zr - 0.1); cylY(0.02, 0.3, s * 1.32, y, zr - 0.105, 10);
      box(0.24, 0.07, 0.015, s * 1.08, y, zr - 0.08);
    }
    for (const x of [0.42, 0.88]) { // lock rods
      cylY(0.017, 2.45, s * x, 2.72, zr - 0.115, 10);
      for (const y of [1.5, 3.94]) box(0.09, 0.07, 0.07, s * x, y, zr - 0.1);
      for (const y of [2.1, 2.95]) box(0.08, 0.05, 0.05, s * x, y, zr - 0.095);
      box(0.035, 0.42, 0.035, s * (x + 0.04), 1.85, zr - 0.14); box(0.06, 0.05, 0.06, s * (x + 0.04), 2.04, zr - 0.115); // handle + keeper
    }
    rbox(0.3, 0.12, 0.05, 0.02, s * 1.0, 1.385, zr - 0.1); // tail lights
  }
  rbox(2.4, 0.1, 0.1, 0.02, 0, 0.55, zr + 0.08); // underride bar
  for (const s of [1, -1]) box(0.08, 0.72, 0.08, s * 0.72, 0.9, zr + 0.2);
  box(0.3, 0.16, 0.02, 0, 0.75, zr + 0.02); // plate
  // mudflaps
  box(2.4, 0.06, 0.06, 0, 1.21, T2 - 0.85);
  for (const s of [1, -1]) box(0.6, 0.85, 0.02, s * 0.92, 0.75, T2 - 0.85);
}
// landing gear
for (const s of [1, -1]) {
  box(0.13, 0.72, 0.13, s * 0.95, 0.92, -3.4); box(0.1, 0.22, 0.1, s * 0.95, 0.5, -3.4); box(0.3, 0.07, 0.26, s * 0.95, 0.42, -3.4);
  box(0.12, 0.08, 0.5, s * 0.95, 1.28, -3.4);
}
cylX(0.025, 1.9, 0, 0.78, -3.4, 10);
tube([[-0.95, 1.2, -3.4], [0.95, 0.68, -3.4]], 0.02, 2, 8); tube([[0.95, 1.2, -3.4], [-0.95, 0.68, -3.4]], 0.02, 2, 8);
cylX(0.015, 0.45, -1.22, 0.98, -3.4, 8); cylZ(0.015, 0.2, -1.44, 0.98, -3.3, 8); // crank (right side)
// slider / suspension / axles
for (const s of [1, -1]) box(0.1, 0.38, 3.8, s * 0.48, 1.06, -13.35);
for (const z of [-11.6, -13.25, -15.1]) box(0.96, 0.3, 0.08, 0, 1.06, z);
for (const z of [T1, T2]) {
  cylX(0.07, 1.95, 0, TY, z);
  for (const s of [1, -1]) {
    cylY(0.15, 0.24, s * 0.56, 0.75, z - 0.44);
    box(0.08, 0.07, 1.1, s * 0.56, 0.52, z + 0.08);
    cylZ(0.085, 0.22, s * 0.62, 0.68, z + 0.22, 16);
  }
}

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
