// Cab + sleeper hull, skin panels, recessed doors, windshield, sun visor and the solid roof fairing.
import {
  THREE, parts, V3, T, RX, RY, RZ, mul, D2R, add, box, rbox, cylX, cylY, cylZ, sphere, creased, loft, shapeFrom, plate, rrect,
  roundPoly, offsetPoly, bothSides, setMat,
} from './truck-lib.mjs';

// ---------- side-wall geometry ----------
export const TAN6 = Math.tan(6 * D2R), COS6 = Math.cos(6 * D2R), SIN6 = Math.sin(6 * D2R);
export const Y_SKIRT = 1.5; // top of the lower skirt (rocker)
export const Y_WALL0 = 1.55; // where the tumblehome wall starts
export const X_SKIN0 = 1.22; // outer skin plane x at Y_WALL0 (skirt sticks out 30 mm further)
export const RECESS = 0.03; // skin -> hull
export const X_SKIRT = 1.25;
export const xSkin = (y) => X_SKIN0 - TAN6 * (y - Y_WALL0);
export const xHull = (y) => xSkin(y) - RECESS;
export const slopeY = (z) => 2.945 - 2.538 * (z - 3.05); // windshield slope: roof-edge height at z (z >= 3.05)
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const bowShift = (x, y, bow) => bow * Math.max(0, 1 - (x / 1.25) ** 2) * smooth(1.7, 2.0, y);

// Matrix that puts a local frame (x = outward normal, y = up the wall, z = forward) on the left skin at height y.
export const onSkin = (y, z, off = 0) => mul(T(xSkin(y) + off, y, z), RZ(6 * D2R));

// ---------- hull ----------
const CROWN_X = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0];
const roofY = (p, x) => p.yt + p.crown * (1 - (x / xHull(p.yt)) ** 2);
function halfProfile(p) {
  const pts = [[0, 1.1]];
  const rb = 0.07;
  for (let i = 0; i <= 3; i++) { const a = -Math.PI / 2 + (i / 3) * (Math.PI / 2); pts.push([X_SKIRT - rb + rb * Math.cos(a), 1.1 + rb + rb * Math.sin(a)]); }
  pts.push([X_SKIRT, Y_SKIRT - 0.025], [X_SKIRT - 0.014, Y_SKIRT]); // rocker top edge
  pts.push([xHull(Y_SKIRT), Y_SKIRT]); // ledge
  const yW = p.yt - 0.14;
  const W = [xHull(yW), yW], C = [xHull(p.yt), p.yt], R = [CROWN_X[0], roofY(p, CROWN_X[0])];
  pts.push(W);
  for (let i = 1; i <= 6; i++) { const t = i / 6, u = 1 - t; pts.push([u * u * W[0] + 2 * u * t * C[0] + t * t * R[0], u * u * W[1] + 2 * u * t * C[1] + t * t * R[1]]); }
  for (let i = 1; i < CROWN_X.length; i++) pts.push([CROWN_X[i], roofY(p, CROWN_X[i])]);
  return pts;
}
function hullSection(z, o = {}) {
  const p = { yt: 3.0, crown: 0.06, shr: 0, bow: 0, ...o };
  const half = halfProfile(p);
  const ring = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
  const yc = (1.1 + p.yt) / 2, hh = (p.yt - 1.1) / 2;
  return ring.map(([x, y]) => {
    let X = x, Y = y;
    if (p.shr) { X = x * (1 - p.shr / 1.25); Y = yc + (y - yc) * (1 - p.shr / hh); }
    return V3(X, Y, z + bowShift(x, y, p.bow));
  });
}
const SL = { yt: 3.22 }; // sleeper roof level
function buildHull() {
  setMat('cab');
  const secs = [
    hullSection(1.0, { ...SL, shr: 0.085 }), hullSection(1.015, { ...SL, shr: 0.05 }), hullSection(1.04, { ...SL, shr: 0.022 }),
    hullSection(1.08, { ...SL, shr: 0.006 }), hullSection(1.14, SL), hullSection(2.075, SL),
    // cab / sleeper body break: a 25 mm groove with the roof stepping down 0.22 m
    hullSection(2.1, { ...SL, shr: 0.05 }), hullSection(2.125, { ...SL, shr: 0.05 }),
    hullSection(2.15, { shr: 0.05 }), hullSection(2.17, { shr: 0.05 }), hullSection(2.2, {}),
    hullSection(2.96, {}), hullSection(3.0, { yt: 2.993, bow: 0.03 }), hullSection(3.03, { yt: 2.975, bow: 0.06 }),
    hullSection(3.05, { yt: 2.945, bow: 0.06 }),
    hullSection(3.45, { yt: 1.93, crown: 0.02, bow: 0.06 }),
  ];
  loft(secs, { capStart: true, capEnd: true }, 38);
}

// ---------- skin plates (door recess etc.) in the +X frame ----------
function sidePlate(outline, holes, depth) {
  const uv = ([z, y]) => [-z, (y - Y_WALL0) / COS6];
  const sh = shapeFrom(outline.map(uv), holes.map((h) => h.map(uv)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 });
  const m = new THREE.Matrix4().makeBasis(V3(0, 0, -1), V3(-SIN6, COS6, 0), V3(COS6, SIN6, 0)).setPosition(xHull(Y_WALL0), Y_WALL0, 0);
  return add(g, m);
}
const DOOR = [[2.30, 1.62], [3.28, 1.62], [3.28, 1.90], [3.10, 2.52], [2.95, 2.74], [2.30, 2.74]];
const WIN = [[2.40, 1.98], [3.12, 1.98], [2.99, 2.46], [2.88, 2.64], [2.40, 2.64]];
const CAB_SKIN = [[2.2, 1.55], [3.42, 1.55], [3.42, 1.856], [3.35, 2.03], [3.2, 2.41], [3.1, 2.67], [3.05, 2.795], [3.0, 2.82], [2.2, 2.82]];
const SL_SKIN = [[1.14, 1.55], [2.08, 1.55], [2.08, 3.06], [1.14, 3.06]];
const SL_WIN = [[1.55, 2.36], [2.0, 2.36], [2.0, 2.84], [1.55, 2.84]];
const SL_BAY = [[1.3, 1.72], [2.0, 1.72], [2.0, 2.12], [1.3, 2.12]];
const GAP = 0.008;

function sideBody() {
  const door = roundPoly(DOOR, 0.05, 4), doorHole = roundPoly(offsetPoly(DOOR, GAP), 0.058, 4);
  const win = roundPoly(WIN, 0.06, 4);
  setMat('cab');
  sidePlate(CAB_SKIN, [doorHole], RECESS); // outer skin with the door opening
  sidePlate(door, [win], 0.02); // door panel, recessed 10 mm; the window is a 30 mm deep glass recess
  setMat('rubber'); sidePlate(roundPoly(offsetPoly(WIN, 0.03), 0.07, 4), [win], 0.027); // window seal frame
  setMat('glass'); sidePlate(win, [], 0.022); // glass pane filling the window opening
  setMat('chrome');
  // handle + lock
  add(new THREE.BoxGeometry(0.03, 0.04, 0.2), mul(onSkin(1.86, 2.46, 0.004), T(0, 0, 0)));
  add(new THREE.BoxGeometry(0.03, 0.06, 0.05), onSkin(1.86, 2.34, 0.002));
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 14), mul(onSkin(1.98, 2.5, -0.002), RZ(Math.PI / 2)));
  // sleeper: window and baggage bay
  const slWin = roundPoly(SL_WIN, 0.07, 4), bay = roundPoly(SL_BAY, 0.04, 3), bayHole = roundPoly(offsetPoly(SL_BAY, GAP), 0.048, 3);
  setMat('sleeper'); sidePlate(SL_SKIN, [roundPoly(offsetPoly(SL_WIN, 0.0), 0.07, 4), bayHole], RECESS);
  sidePlate(bay, [], 0.02);
  setMat('rubber'); sidePlate(roundPoly(offsetPoly(SL_WIN, 0.03), 0.09, 4), [slWin], 0.038);
  setMat('glass'); sidePlate(slWin, [], 0.03);
  setMat('chrome'); add(new THREE.BoxGeometry(0.03, 0.035, 0.18), onSkin(1.92, 1.9, 0.004));
  setMat('dark'); for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.012, 0.012, 0.3), onSkin(2.02 - i * 0.028, 1.55, 0.002)); // louvre slats
  // mirror mount pads on the door front edge
  setMat('chrome'); for (const y of [1.98, 2.5]) add(new THREE.BoxGeometry(0.03, 0.12, 0.1), onSkin(y, y > 2.2 ? 3.04 : 3.2, 0.0));
  // marker lamps on the cab side (amber, flush)
  setMat('lamp'); for (const [y, z] of [[2.86, 2.9]]) add(new THREE.SphereGeometry(0.03, 10, 6), mul(onSkin(y, z, 0.0), SC1(0.5, 1, 1)));
}
const SC1 = (x, y, z) => new THREE.Matrix4().makeScale(x, y, z);

// ---------- windshield (curved glass recess + frame) ----------
const PA = { z: 3.05, yt: 2.945, crown: 0.06, bow: 0.06 }, PB = { z: 3.45, yt: 1.93, crown: 0.02, bow: 0.06 };
const surfAt = (p, x) => { const y = roofY(p, x); return V3(x, y, p.z + bowShift(x, y, p.bow)); };
export const surfP = (x, t) => surfAt(PA, x).lerp(surfAt(PB, x), t);
export function surfFrame(x, t) {
  const e = 1e-3, p = surfP(x, t);
  const dx = surfP(x + e, t).sub(surfP(x - e, t)).normalize();
  const dt = surfP(x, t + e).sub(surfP(x, t - e)).normalize();
  let n = dt.clone().cross(dx).normalize();
  if (n.z < 0) n.negate();
  const ty = n.clone().cross(dx).normalize();
  return { p, tx: dx, ty, n };
}
function loopXT(hw, t0, t1, cx, ct, nSeg = 10) {
  const c = [[-hw + cx, t0], [hw - cx, t0], [hw, t0 + ct], [hw, t1 - ct], [hw - cx, t1], [-hw + cx, t1], [-hw, t1 - ct], [-hw, t0 + ct]];
  const out = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length];
    for (let k = 0; k < nSeg; k++) { const f = k / nSeg; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  }
  return out;
}
const onSurf = (loop, off) => loop.map(([x, t]) => { const f = surfFrame(x, t); return f.p.clone().addScaledVector(f.n, off); });
function strip(A, B, want) {
  const pos = []; const n = A.length;
  const tri = (a, b, c, w) => { const nn = b.clone().sub(a).cross(c.clone().sub(a)); if (nn.dot(w) < 0) [b, c] = [c, b]; pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, w = want(i);
    tri(A[i], A[j], B[i], w); tri(A[j], B[j], B[i], w);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return add(creased(g, 55));
}
function frameRing(outerLoop, innerLoop, h) {
  const O0 = onSurf(outerLoop, 0), O1 = onSurf(outerLoop, h), I1 = onSurf(innerLoop, h), I0 = onSurf(innerLoop, 0);
  const cen = O0.reduce((a, p) => a.add(p), V3(0, 0, 0)).multiplyScalar(1 / O0.length);
  strip(O0, O1, (i) => O0[i].clone().sub(cen));
  strip(O1, I1, (i) => surfFrame(...outerLoop[i]).n);
  strip(I1, I0, (i) => cen.clone().sub(I0[i]));
}
// Glass pane: nested loops shrinking toward the centre, 4 mm proud of the cab surface and under the 16 mm frame.
function windshieldGlass(hw, t0, t1, cx, ct) {
  const base = loopXT(hw, t0, t1, cx, ct, 8), mx = 0, mt = (t0 + t1) / 2;
  const layer = (k) => base.map(([x, t]) => [mx + (x - mx) * k, mt + (t - mt) * k]);
  const ks = [1, 0.8, 0.6, 0.4, 0.2, 0.04];
  for (let i = 0; i < ks.length - 1; i++) {
    const A = onSurf(layer(ks[i]), 0.004), B = onSurf(layer(ks[i + 1]), 0.004);
    strip(A, B, (j) => surfFrame(...layer(ks[i])[j]).n);
  }
}
function buildWindshield() {
  const t0 = 0.05, t1 = 0.86, hw = 0.88;
  setMat('glass'); windshieldGlass(hw - 0.045, t0 + 0.04, t1 - 0.04, 0.085, 0.09);
  setMat('rubber');
  frameRing(loopXT(hw, t0, t1, 0.1, 0.1), loopXT(hw - 0.045, t0 + 0.04, t1 - 0.04, 0.085, 0.09), 0.016);
  frameRing(loopXT(0.03, t0 + 0.04, t1 - 0.04, 0.0, 0.0, 6), loopXT(0.012, t0 + 0.04, t1 - 0.04, 0.0, 0.0, 6), 0.02); // centre divider
  // wipers: pivot near the bottom edge, resting at an angle
  for (const [x, a] of [[0.38, 1.25], [-0.38, 1.25]]) {
    const f = surfFrame(x, 0.8);
    const basis = new THREE.Matrix4().makeBasis(f.tx, f.ty, f.n).setPosition(f.p.clone().addScaledVector(f.n, 0.028));
    add(new THREE.BoxGeometry(0.014, 0.6, 0.012), mul(basis, RZ(x > 0 ? -a : a), T(0, 0.28, 0)));
    add(new THREE.BoxGeometry(0.02, 0.2, 0.018), mul(basis, RZ(x > 0 ? -a : a), T(0, 0.08, 0)));
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), mul(basis, RX(Math.PI / 2)));
  }
}

// ---------- sun visor ----------
function buildVisor() {
  setMat('cab');
  const pts = [[-1.1, 2.95]];
  for (let i = 0; i <= 12; i++) { const x = -1.1 + (2.2 * i) / 12; pts.push([x, 3.3 + 0.055 * (1 - (x / 1.1) ** 2) - 0.1 * Math.pow(Math.abs(x) / 1.1, 6)]); }
  pts.push([1.1, 2.95]);
  plate(pts, 0.06, 3.06, 0.008);
  for (const s of [1, -1]) { box(0.03, 0.05, 0.28, s * 1.0, 3.015, 3.12); box(0.03, 0.05, 0.28, s * 0.45, 3.035, 3.12); }
  setMat('lamp'); for (let i = -2; i <= 2; i++) rbox(0.09, 0.03, 0.05, 0.012, i * 0.24, 3.085, 3.27 + 0.05 * (1 - (i * 0.24 / 1.1) ** 2)); // marker lamps
}

// ---------- roof fairing: solid wedge, full-width cheeks dropping to the roof ----------
export const FAIR = { zNose: 2.72, zRise: 1.55, zRear: 1.0, y0: 3.12, y1: 3.98, w: 2.2 };
function fairTop(z) { const t = Math.min(1, Math.max(0, (FAIR.zNose - z) / (FAIR.zNose - FAIR.zRise))); return FAIR.y0 + (FAIR.y1 - FAIR.y0) * (1 - Math.pow(1 - t, 1.6)); }
function fairBottom(z) { return z > 2.17 ? 2.90 : z < 2.1 ? 3.10 : 2.90 + 0.2 * (2.17 - z) / 0.07; }
function fairSection(z, shr = 0) {
  const y0 = fairBottom(z), y1 = fairTop(z) - shr, w = FAIR.w - 2 * shr * 0.9;
  const rT = Math.min(0.12, (y1 - y0) * 0.45);
  const ring = rrect(0, y0, y1, w, rT, 0.02, 6);
  return ring.map(([x, y]) => V3(x, y, z));
}
function buildFairing() {
  setMat('sleeper');
  const zs = [];
  const rear = [[1.0, 0.05], [1.015, 0.025], [1.04, 0.01], [1.08, 0.003]];
  const nose = [[2.7, 0.1], [2.705, 0.055], [2.713, 0.03], [2.724, 0.014], [2.74, 0.005]];
  zs.push(...rear);
  for (let z = 1.15; z < 2.1; z += 0.1) zs.push([z, 0]);
  zs.push([2.1, 0], [2.17, 0]);
  for (const z of [2.25, 2.35, 2.45, 2.53, 2.6, 2.66]) zs.push([z, 0]);
  zs.push(...nose.slice().map(([z, s]) => [z, s]));
  zs.sort((a, b) => a[0] - b[0]);
  loft(zs.map(([z, s]) => fairSection(z, s)), { capStart: true, capEnd: true }, 40);
}

export function buildCab() {
  buildHull();
  bothSides(sideBody);
  buildWindshield();
  buildVisor();
  buildFairing();
}
