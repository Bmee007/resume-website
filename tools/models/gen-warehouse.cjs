// Generates public/models/warehouse.glb — a modern tilt-up distribution centre, metres, Y up, dock face +Z.
// All geometry is authored here (no external assets). Output is a single merged indexed mesh.
'use strict';
const fs = require('fs');
const path = require('path');
const THREE = require('/Users/borinakeo/resume-website/node_modules/three/build/three.cjs');

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/warehouse.glb';

// ---------------------------------------------------------------- collector
const parts = [];
let xform = new THREE.Matrix4();
function add(geom, m) {
  if (m) geom.applyMatrix4(m);
  geom.applyMatrix4(xform);
  parts.push(geom);
}
function withTransform(m, fn) { const prev = xform; xform = prev.clone().multiply(m); try { fn(); } finally { xform = prev; } }

/** axis-aligned box by min/max */
function boxMM(x0, x1, y0, y1, z0, z1) {
  if (x1 - x0 < 1e-6 || y1 - y0 < 1e-6 || z1 - z0 < 1e-6) return;
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  add(g, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
}
/** vertical cylinder (axis Y) by centre-x/z, y range */
function cylY(r, x, y0, y1, z, seg = 16) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg);
  add(g, new THREE.Matrix4().makeTranslation(x, (y0 + y1) / 2, z));
}
/** cylinder along X (wheels, axles): centre y,z and x range */
function cylX(r, x0, x1, y, z, seg = 20) {
  const g = new THREE.CylinderGeometry(r, r, x1 - x0, seg);
  const m = new THREE.Matrix4().makeTranslation((x0 + x1) / 2, y, z).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
  add(g, m);
}
/** cylinder along Z: centre x,y and z range */
function cylZ(r, x, y, z0, z1, seg = 16) {
  const g = new THREE.CylinderGeometry(r, r, z1 - z0, seg);
  const m = new THREE.Matrix4().makeTranslation(x, y, (z0 + z1) / 2).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  add(g, m);
}
/** thin rod between two points */
function rod(r, a, b, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  const dir = B.clone().sub(A).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
  add(g, m);
}
/** prism from polygon in (z,y) extruded over x range */
function prismX(ptsZY, x0, x1) {
  const shape = new THREE.Shape(ptsZY.map(([u, v]) => new THREE.Vector2(u, v)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false });
  const m = new THREE.Matrix4().makeTranslation(x1, 0, 0).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
  add(g, m);
}
/** prism from polygon in (x,y) extruded over z range */
function prismZ(ptsXY, z0, z1) {
  const shape = new THREE.Shape(ptsXY.map(([u, v]) => new THREE.Vector2(u, v)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false });
  add(g, new THREE.Matrix4().makeTranslation(0, 0, z0));
}

/**
 * Wall with rectangular openings. axis 'x': wall runs along x (a = x), thickness along z (n0..n1).
 * axis 'z': wall runs along z (a = z), thickness along x (n0..n1). openings: {a0,a1,y0,y1}
 */
function wall(axis, a0, a1, y0, y1, n0, n1, openings = []) {
  const bps = new Set([a0, a1]);
  for (const o of openings) { if (o.a0 > a0 && o.a0 < a1) bps.add(o.a0); if (o.a1 > a0 && o.a1 < a1) bps.add(o.a1); }
  const xs = [...bps].sort((p, q) => p - q);
  for (let i = 0; i < xs.length - 1; i++) {
    const sa = xs[i], sb = xs[i + 1]; if (sb - sa < 1e-6) continue;
    const mid = (sa + sb) / 2;
    const cuts = openings.filter((o) => o.a0 <= mid && o.a1 >= mid).map((o) => [Math.max(o.y0, y0), Math.min(o.y1, y1)]).sort((p, q) => p[0] - q[0]);
    let cur = y0; const segs = [];
    for (const [c0, c1] of cuts) { if (c0 > cur + 1e-6) segs.push([cur, c0]); cur = Math.max(cur, c1); }
    if (cur < y1 - 1e-6) segs.push([cur, y1]);
    for (const [s0, s1] of segs) axis === 'x' ? boxMM(sa, sb, s0, s1, n0, n1) : boxMM(n0, n1, s0, s1, sa, sb);
  }
}

/**
 * Tilt-up panel wall: outer panel layer with reveal joints (vertical pitch + one horizontal band) and a
 * backing layer 0.1 m behind that shows in the joints. `through` openings cut both layers.
 * axis/a0/a1 as wall(); outer = coordinate of outer face; s = +1 if the inside is in +n direction.
 */
function panelWall(axis, a0, a1, yTop, outer, s, through = [], { pitch = 7.5, jointsAt = null, band = 8.4 } = {}) {
  const T = 0.25, G = 0.1, R = 0.1;
  const joints = jointsAt || (() => { const j = []; for (let a = a0 + pitch; a < a1 - 0.5; a += pitch) j.push(a); return j; })();
  const gaps = joints.map((a) => ({ a0: a - G / 2, a1: a + G / 2, y0: 0, y1: yTop }));
  gaps.push({ a0: a0, a1: a1, y0: band, y1: band + G });
  const n0 = Math.min(outer, outer + s * T), n1 = Math.max(outer, outer + s * T);
  wall(axis, a0, a1, 0, yTop, n0, n1, [...through, ...gaps]);
  const b0 = Math.min(outer + s * R, outer + s * (T + R)), b1 = Math.max(outer + s * R, outer + s * (T + R));
  wall(axis, a0, a1, 0, yTop - 0.05, b0, b1, through);
}

// ---------------------------------------------------------------- dimensions
const X0 = -60, X1 = 60, Z0 = -30, Z1 = 30;      // main footprint
const H = 12.0;                                   // roof deck
const P = 12.8;                                   // parapet top
const FLOOR = 1.2;                                // dock height
const OFF_X0 = -60, OFF_X1 = -36, OFF_Z1 = 40, OFF_H = 8.4, OFF_P = 9.2; // office block
const DOCK_X = Array.from({ length: 20 }, (_, k) => -29 + 4 * k);        // door centres
const DOCK_W = 2.75, DOCK_H = 3.0;
const OPEN_DOORS = new Set([0, 7, 13, 17]);
const TRAILER_DOORS = new Set([3, 9, 14]);
const TRACTOR_DOOR = 3;
const COMPACTOR_DOOR = 19;
const MAN1 = -33.9, MAN2 = 50.0;                  // man doors with dock stairs
const RAMP_X0 = 53.5, RAMP_X1 = 57.8;             // drive-in opening
const APRON_X0 = -63, APRON_X1 = 63, APRON_Z1 = 58;
const GATE_X0 = -32, GATE_X1 = -22;

// ---------------------------------------------------------------- main walls
// front wall (+Z) — openings
const frontOpen = [];
for (const c of DOCK_X) frontOpen.push({ a0: c - DOCK_W / 2, a1: c + DOCK_W / 2, y0: FLOOR, y1: FLOOR + DOCK_H });
frontOpen.push({ a0: MAN1 - 0.5, a1: MAN1 + 0.5, y0: FLOOR, y1: FLOOR + 2.1 });
frontOpen.push({ a0: MAN2 - 0.5, a1: MAN2 + 0.5, y0: FLOOR, y1: FLOOR + 2.1 });
frontOpen.push({ a0: RAMP_X0, a1: RAMP_X1, y0: FLOOR, y1: FLOOR + 4.5 });
const frontJoints = [...DOCK_X.map((c) => c - 2), 49, 52.3, 59.0];
panelWall('x', X0, X1, P, Z1, -1, frontOpen, { jointsAt: frontJoints });
// back wall (-Z)
const backOpen = [
  { a0: -50.5, a1: -48.5, y0: 2.0, y1: 3.6 },  // louvre
  { a0: -10.5, a1: -9.5, y0: FLOOR, y1: FLOOR + 2.1 },
  { a0: 29.5, a1: 30.5, y0: FLOOR, y1: FLOOR + 2.1 },
];
panelWall('x', X0, X1, P, Z0, +1, backOpen);
// end walls
panelWall('z', Z0, Z1, P, X1, -1, [{ a0: -1, a1: 1, y0: FLOOR, y1: FLOOR + 2.1 }]);
panelWall('z', Z0, Z1, P, X0, +1, []);
// roof deck
boxMM(X0 + 0.25, X1 - 0.25, H - 0.4, H, Z0 + 0.25, Z1 - 0.25);
// parapet coping
boxMM(X0 - 0.1, X1 + 0.1, P, P + 0.08, Z1 - 0.35, Z1 + 0.1);
boxMM(X0 - 0.1, X1 + 0.1, P, P + 0.08, Z0 - 0.1, Z0 + 0.35);
boxMM(X0 - 0.1, X0 + 0.35, P, P + 0.08, Z0, Z1);
boxMM(X1 - 0.35, X1 + 0.1, P, P + 0.08, Z0, Z1);

// louvre blades (back wall)
for (let i = 0; i < 6; i++) boxMM(-50.5, -48.5, 2.05 + i * 0.26, 2.05 + i * 0.26 + 0.06, Z0 + 0.12, Z0 + 0.45);
// back / end man doors (recessed leaf + stoop)
for (const [x, z0, z1] of [[-10, Z0 + 0.2, Z0 + 0.26], [30, Z0 + 0.2, Z0 + 0.26]]) {
  boxMM(x - 0.5, x + 0.5, FLOOR, FLOOR + 2.1, z0, z1);
  dockStairs(x, Z0, -1, +1);
}
boxMM(X1 - 0.26, X1 - 0.2, FLOOR, FLOOR + 2.1, -0.5, 0.5);
dockStairsZ(0, X1, +1, -1);

// ---------------------------------------------------------------- dock face
const SHELTER_D = 0.75;
DOCK_X.forEach((c, k) => {
  const open = OPEN_DOORS.has(k);
  if (!open) {
    // roll-up door leaf flush with inside face + slat ribs
    boxMM(c - DOCK_W / 2, c + DOCK_W / 2, FLOOR, FLOOR + DOCK_H, Z1 - 0.26, Z1 - 0.18);
    for (let i = 1; i < 10; i++) boxMM(c - DOCK_W / 2, c + DOCK_W / 2, FLOOR + i * 0.3 - 0.02, FLOOR + i * 0.3 + 0.02, Z1 - 0.18, Z1 - 0.15);
  } else {
    // open door: dock leveller plate inside and hanging lip, door curtain rolled up as a drum above
    boxMM(c - 1.0, c + 1.0, FLOOR - 0.02, FLOOR + 0.04, Z1 - 2.7, Z1 - 0.1);
    boxMM(c - 1.0, c + 1.0, FLOOR - 0.42, FLOOR + 0.02, Z1 - 0.1, Z1 + 0.06);
    cylX(0.22, c - 1.45, c + 1.45, FLOOR + DOCK_H + 0.3, Z1 - 0.45, 16);
    // interior floor patch + a couple of pallet racks visible through the opening
    boxMM(c - 3, c + 3, FLOOR - 0.1, FLOOR, Z1 - 12, Z1 - 0.3);
    for (const dx of [-2.4, 2.4]) for (let r = 0; r < 3; r++) {
      const zr = Z1 - 5 - r * 2.8;
      for (const px of [dx - 1.3, dx + 1.3]) boxMM(px - 0.05, px + 0.05, FLOOR, FLOOR + 7, zr - 0.05, zr + 0.05);
      for (let lvl = 1; lvl < 4; lvl++) boxMM(dx - 1.4, dx + 1.4, FLOOR + lvl * 2.0, FLOOR + lvl * 2.0 + 0.1, zr - 0.55, zr + 0.55);
    }
  }
  // door track guards (steel angles at jambs)
  for (const sx of [-1, 1]) boxMM(c + sx * 1.47 - 0.07, c + sx * 1.47 + 0.07, FLOOR, FLOOR + 1.0, Z1, Z1 + 0.14);
  // laminated bumpers
  for (const sx of [-1, 1]) boxMM(c + sx * 1.07 - 0.16, c + sx * 1.07 + 0.16, FLOOR - 0.5, FLOOR, Z1, Z1 + 0.12);
  // rigid dock shelter: side frames, head, sloped hood, fabric curtains
  for (const sx of [-1, 1]) boxMM(c + sx * 1.7 - 0.2, c + sx * 1.7 + 0.2, FLOOR + 0.3, FLOOR + DOCK_H + 0.5, Z1, Z1 + SHELTER_D);
  boxMM(c - 1.9, c + 1.9, FLOOR + DOCK_H + 0.5, FLOOR + DOCK_H + 0.9, Z1, Z1 + SHELTER_D);
  prismX([[Z1, FLOOR + DOCK_H + 0.9], [Z1, FLOOR + DOCK_H + 1.35], [Z1 + SHELTER_D, FLOOR + DOCK_H + 0.9]], c - 1.9, c + 1.9);
  for (const sx of [-1, 1]) boxMM(c + sx * 1.35 - 0.15, c + sx * 1.35 + 0.15, FLOOR + 0.3, FLOOR + DOCK_H + 0.5, Z1 + SHELTER_D - 0.15, Z1 + SHELTER_D);
  boxMM(c - 1.5, c + 1.5, FLOOR + DOCK_H, FLOOR + DOCK_H + 0.5, Z1 + SHELTER_D - 0.15, Z1 + SHELTER_D);
  // dock light arm + wheel chock pipe guides on the apron
  boxMM(c + 1.95, c + 2.1, FLOOR + DOCK_H + 1.2, FLOOR + DOCK_H + 1.35, Z1, Z1 + 0.6);
  cylZ(0.08, c + 2.05, FLOOR + DOCK_H + 1.45, Z1 + 0.55, Z1 + 0.65, 8);
});
// man-door leaves + dock stairs (front)
for (const x of [MAN1, MAN2]) boxMM(x - 0.5, x + 0.5, FLOOR, FLOOR + 2.1, Z1 - 0.26, Z1 - 0.2);
dockStairs(MAN1, Z1, +1, +1);
dockStairs(MAN2, Z1, +1, +1);

/** concrete dock stairs: landing in front of a man door at x, wall face z, side s (+1 outward), dir (+1 steps descend to +x) */
function dockStairs(x, zFace, s, dir) {
  const zA = zFace, zB = zFace + s * 1.4;
  const z0 = Math.min(zA, zB), z1 = Math.max(zA, zB);
  boxMM(x - 0.7, x + 0.7, 0, FLOOR, z0, z1);                       // landing
  for (let i = 0; i < 6; i++) {
    const xa = x + dir * (0.7 + 0.3 * i), xb = x + dir * (0.7 + 0.3 * (i + 1));
    boxMM(Math.min(xa, xb), Math.max(xa, xb), 0, FLOOR - 0.2 * (i + 1), z0, z1);
  }
  // railing: posts + top rail on the outer edge
  const zr = zFace + s * 1.35;
  const posts = [[x - 0.65, FLOOR], [x + 0.65, FLOOR], [x + dir * 1.6, FLOOR - 0.6], [x + dir * 2.5, 0.0]];
  for (const [px, py] of posts) cylY(0.03, px, py, py + 1.0, zr, 6);
  rod(0.03, [x - 0.65, FLOOR + 1.0, zr], [x + 0.65, FLOOR + 1.0, zr]);
  rod(0.03, [x + dir * 0.65, FLOOR + 1.0, zr], [x + dir * 2.5, 1.0, zr]);
}
/** same for a wall running along z (end wall) */
function dockStairsZ(z, xFace, s, dir) {
  const m = new THREE.Matrix4().makeTranslation(xFace, 0, z).multiply(new THREE.Matrix4().makeRotationY(-s * Math.PI / 2));
  withTransform(m, () => dockStairs(0, 0, +1, dir));
}

// ---------------------------------------------------------------- dock canopy
const CAN_X0 = -36, CAN_X1 = 49, CAN_D = 2.6, CAN_Y = 5.7;
boxMM(CAN_X0, CAN_X1, CAN_Y, CAN_Y + 0.12, Z1, Z1 + CAN_D);                 // deck
boxMM(CAN_X0, CAN_X1, CAN_Y - 0.25, CAN_Y + 0.4, Z1 + CAN_D - 0.3, Z1 + CAN_D); // fascia
boxMM(CAN_X0, CAN_X1, CAN_Y - 0.25, CAN_Y + 0.12, Z1 + 0.05, Z1 + 0.35);         // wall ledger
for (let x = CAN_X0 + 1; x <= CAN_X1; x += 4) {
  boxMM(x - 0.08, x + 0.08, CAN_Y - 0.25, CAN_Y, Z1, Z1 + CAN_D - 0.3);              // joists
  if ((Math.round(x - CAN_X0 - 1) / 4) % 2 === 0) rod(0.05, [x, 9.0, Z1], [x, CAN_Y + 0.3, Z1 + CAN_D - 0.15]); // tie rods
}
// wall-pack lights above canopy
for (let x = CAN_X0 + 8; x < CAN_X1; x += 16) boxMM(x - 0.25, x + 0.25, 9.6, 9.95, Z1, Z1 + 0.3);

// ---------------------------------------------------------------- drive-in ramp
const RZ1 = 46;
const rampC = (RAMP_X0 + RAMP_X1) / 2;
boxMM(RAMP_X0, RAMP_X1, FLOOR, FLOOR + 4.5, Z1 - 0.26, Z1 - 0.18);       // sectional door leaf
for (let i = 1; i < 8; i++) boxMM(RAMP_X0, RAMP_X1, FLOOR + i * 0.56 - 0.02, FLOOR + i * 0.56 + 0.02, Z1 - 0.18, Z1 - 0.15);
prismX([[Z1, 0], [Z1, FLOOR], [RZ1, 0]], RAMP_X0 - 0.3, RAMP_X1 + 0.3); // ramp slab
for (const [x0, x1] of [[RAMP_X0 - 0.6, RAMP_X0 - 0.3], [RAMP_X1 + 0.3, RAMP_X1 + 0.6]]) {
  prismX([[Z1, 0], [Z1, FLOOR + 1.0], [RZ1 - 2, 0.9], [RZ1 - 2, 0]], x0, x1); // retaining walls with curb
}
for (const x of [RAMP_X0 - 0.15, RAMP_X1 + 0.15]) cylY(0.1, x, FLOOR, FLOOR + 1.2, Z1 + 0.6, 10); // bollards

// ---------------------------------------------------------------- roof plant
function rtu(x, z, w = 3.6, d = 2.2, h = 1.6, y = H) {
  boxMM(x - w / 2 + 0.3, x + w / 2 - 0.3, y, y + 0.35, z - d / 2 + 0.2, z + d / 2 - 0.2);   // curb
  boxMM(x - w / 2, x + w / 2, y + 0.35, y + 0.35 + h, z - d / 2, z + d / 2);              // cabinet
  boxMM(x - w / 2 + 0.05, x + w / 2 - 0.05, y + 0.35 + h, y + 0.35 + h + 0.08, z - d / 2 + 0.05, z + d / 2 - 0.05); // lid
  const fy = y + 0.35 + h + 0.08;
  cylY(Math.min(d, w) * 0.22, x + w * 0.22, fy, fy + 0.14, z, 20); cylY(Math.min(d, w) * 0.22, x - w * 0.22, fy, fy + 0.14, z, 20);
  cylY(Math.min(d, w) * 0.17, x + w * 0.22, fy + 0.14, fy + 0.19, z, 16); cylY(Math.min(d, w) * 0.17, x - w * 0.22, fy + 0.14, fy + 0.19, z, 16);
  boxMM(x - w / 2 - 0.5, x - w / 2, y + 0.35 + h * 0.35, y + 0.35 + h * 0.9, z - d * 0.3, z + d * 0.3); // economiser hood
  boxMM(x - w / 2 - 0.5, x - w / 2 + 0.02, y + 0.35 + h * 0.9, y + 0.35 + h * 0.98, z - d * 0.32, z + d * 0.32);
  boxMM(x - 0.25, x + 0.25, y, y + 0.9, z + d / 2, z + d / 2 + 0.3); // disconnect / gas line box
}
for (const z of [-16, 0, 15]) for (let i = 0; i < 5; i++) rtu(-48 + 24 * i, z);
// skylight strips (ridged) with curbs
for (const z of [-24, -8, 8, 22]) for (const x of [-42, -14, 14, 42]) {
  boxMM(x - 9, x + 9, H, H + 0.3, z - 1.2, z + 1.2);
  prismX([[z - 1.25, H + 0.3], [z + 1.25, H + 0.3], [z, H + 0.85]], x - 9.05, x + 9.05);
  for (let xx = x - 9; xx <= x + 9.01; xx += 1.5) prismX([[z - 1.3, H + 0.3], [z + 1.3, H + 0.3], [z, H + 0.9]], xx - 0.03, xx + 0.03); // glazing bars follow the ridge
}
// exhaust fans (mushroom), smoke vents, hatch, pipe vents
for (let i = 0; i < 8; i++) { const x = -52 + 15 * i, z = 26.5; cylY(0.45, x, H, H + 0.5, z, 16); cylY(0.65, x, H + 0.5, H + 0.75, z, 16); cylY(0.2, x, H + 0.75, H + 0.85, z, 12); }
for (let i = 0; i < 6; i++) boxMM(-50 + 20 * i, -50 + 20 * i + 2.4, H, H + 0.35, -27.5, -26.3);
boxMM(-56, -55.1, H, H + 0.45, -1, 0); boxMM(-56.05, -55.05, H + 0.45, H + 0.55, -1.05, 0.05);
for (const [x, z] of [[-30, 20], [10, -20], [40, 4], [-5, 27], [55, -12]]) { cylY(0.12, x, H, H + 0.6, z, 10); boxMM(x - 0.25, x + 0.25, H + 0.6, H + 0.75, z - 0.25, z + 0.25); }
// roof access ladder on back wall with cage
boxMM(-20.25, -20.15, 1.5, P + 1.0, Z0 - 0.3, Z0 - 0.2); boxMM(-19.35, -19.25, 1.5, P + 1.0, Z0 - 0.3, Z0 - 0.2);
for (let y = 1.8; y < P + 0.8; y += 0.3) boxMM(-20.25, -19.25, y, y + 0.04, Z0 - 0.3, Z0 - 0.2);
for (let y = 3.5; y < P; y += 1.5) { boxMM(-20.7, -18.8, y, y + 0.05, Z0 - 0.9, Z0 - 0.85); boxMM(-20.7, -20.65, y, y + 0.05, Z0 - 0.9, Z0); boxMM(-18.85, -18.8, y, y + 0.05, Z0 - 0.9, Z0); }

// downspouts: conductor head at parapet, pipe to boot
function downspout(x, z, nx, nz) { // (nx,nz) outward normal
  const hx = x + nx * 0.25, hz = z + nz * 0.25;
  boxMM(hx - 0.3 - Math.abs(nz) * 0 , hx + 0.3, P - 1.1, P - 0.4, hz - 0.3, hz + 0.3);
  cylY(0.12, hx, 0.45, P - 1.1, hz, 10);
  boxMM(hx - 0.2, hx + 0.2, 0, 0.5, hz - 0.2, hz + 0.2);
  boxMM(Math.min(x, hx) - 0.25 * Math.abs(nz), Math.max(x, hx) + 0.25 * Math.abs(nz), P - 0.9, P - 0.5, Math.min(z, hz) - 0.25 * Math.abs(nx), Math.max(z, hz) + 0.25 * Math.abs(nx)); // scupper
}
for (const x of [-48, -24, 0, 24, 48]) downspout(x, Z0, 0, -1);
for (const z of [-15, 15]) { downspout(X1, z, 1, 0); downspout(X0, z, -1, 0); }

// ---------------------------------------------------------------- office block (2 storeys + glazed entrance tower)
{
  const x0 = OFF_X0, x1 = OFF_X1, z1 = OFF_Z1;
  const winRows = [[FLOOR + 1.0, FLOOR + 2.9], [FLOOR + 4.9, FLOOR + 6.9]];
  const TW_X0 = -46, TW_X1 = -40, TW_Z1 = 42.5, TW_H = 10.8, TW_P = 11.2;
  // front wall (+Z) with ribbon windows
  const fo = [];
  for (const [y0, y1] of winRows) { fo.push({ a0: x0 + 1.2, a1: TW_X0 - 0.6, y0, y1 }); fo.push({ a0: TW_X1 + 0.6, a1: x1 - 1.2, y0, y1 }); }
  panelWall('x', x0, x1, OFF_P, z1, -1, fo, { pitch: 6, band: 4.9 });
  glaze('x', fo, z1 - 0.22, z1 - 0.18, +1);
  // entrance tower: solid flanks, fully glazed front with mullions/transoms, taller parapet
  boxMM(TW_X0, TW_X0 + 0.3, 0, TW_P, Z1, TW_Z1); boxMM(TW_X1 - 0.3, TW_X1, 0, TW_P, Z1, TW_Z1);
  boxMM(TW_X0, TW_X1, TW_H - 0.3, TW_H, Z1, TW_Z1 - 0.25);                      // roof deck
  boxMM(TW_X0, TW_X1, TW_H, TW_P, TW_Z1 - 0.3, TW_Z1);                         // front parapet band
  boxMM(TW_X0 - 0.1, TW_X1 + 0.1, TW_P, TW_P + 0.08, TW_Z1 - 0.4, TW_Z1 + 0.1); // coping
  boxMM(TW_X0 - 0.1, TW_X0 + 0.4, TW_P, TW_P + 0.08, Z1, TW_Z1); boxMM(TW_X1 - 0.4, TW_X1 + 0.1, TW_P, TW_P + 0.08, Z1, TW_Z1);
  boxMM(TW_X0 + 0.3, TW_X1 - 0.3, 0, FLOOR, TW_Z1 - 0.3, TW_Z1);               // plinth under glazing
  boxMM(TW_X0 + 0.3, TW_X1 - 0.3, FLOOR, TW_H, TW_Z1 - 0.5, TW_Z1 - 0.46);     // curtain wall glass (recessed 0.5)
  for (let x = TW_X0 + 0.3; x <= TW_X1 - 0.3 + 0.01; x += 1.5) boxMM(x - 0.06, x + 0.06, FLOOR, TW_H, TW_Z1 - 0.5, TW_Z1 - 0.1); // mullions
  for (const y of [FLOOR + 3.4, FLOOR + 6.9]) boxMM(TW_X0 + 0.3, TW_X1 - 0.3, y - 0.12, y + 0.12, TW_Z1 - 0.5, TW_Z1 - 0.1);  // transoms / slab edges
  boxMM(TW_X0 + 1.5, TW_X1 - 1.5, FLOOR, FLOOR + 2.6, TW_Z1 - 0.46, TW_Z1 - 0.4); // entrance doors
  boxMM(TW_X0 + 1.5, TW_X1 - 1.5, FLOOR + 2.6, FLOOR + 2.7, TW_Z1 - 0.5, TW_Z1 - 0.1);
  // entrance canopy on two slender columns
  boxMM(TW_X0 - 1.5, TW_X1 + 1.5, FLOOR + 3.4, FLOOR + 3.7, TW_Z1 - 0.3, TW_Z1 + 3.2);
  boxMM(TW_X0 - 1.5, TW_X1 + 1.5, FLOOR + 3.1, FLOOR + 3.7, TW_Z1 + 2.9, TW_Z1 + 3.2);
  for (const x of [TW_X0 - 1.1, TW_X1 + 1.1]) cylY(0.15, x, 0, FLOOR + 3.4, TW_Z1 + 2.9, 14);
  // landing + 6 steps, planters, bollards, flagpole; raised plaza sidewalk in front of the office
  boxMM(TW_X0 - 0.5, TW_X1 + 0.5, 0, FLOOR, TW_Z1, TW_Z1 + 1.5);
  for (let i = 0; i < 6; i++) boxMM(TW_X0 - 0.5, TW_X1 + 0.5, 0, FLOOR - 0.2 * (i + 1), TW_Z1 + 1.5 + 0.32 * i, TW_Z1 + 1.5 + 0.32 * (i + 1));
  for (const [px0, px1] of [[TW_X0 - 3.6, TW_X0 - 0.8], [TW_X1 + 0.8, TW_X1 + 3.6]]) { boxMM(px0, px1, 0, 0.6, TW_Z1, TW_Z1 + 2.2); boxMM(px0 + 0.15, px1 - 0.15, 0.6, 0.75, TW_Z1 + 0.15, TW_Z1 + 2.05); }
  for (const x of [TW_X0 - 2.2, TW_X0 - 0.6, TW_X1 + 0.6, TW_X1 + 2.2]) cylY(0.1, x, 0, 1.0, TW_Z1 + 4.6, 10);
  boxMM(x0 - 2, x1 + 1.5, 0, 0.12, z1, 46.0);                                  // sidewalk / plaza
  cylY(0.07, -57, 0, 11, 45, 10); boxMM(-57.4, -56.6, 0, 0.5, 44.6, 45.4);    // flagpole
  boxMM(x1 - 3.5, x1 - 0.5, 0, 1.5, 45.0, 45.5); boxMM(x1 - 3.7, x1 - 0.3, 1.5, 1.65, 44.9, 45.6); // monument sign
  // west / east office walls with ribbon windows
  const wo = []; for (const [y0, y1] of winRows) wo.push({ a0: Z1 + 1.0, a1: z1 - 1.2, y0, y1 });
  panelWall('z', Z1, z1, OFF_P, x0, +1, wo, { pitch: 6, band: 4.9 });
  glaze('z', wo, x0 + 0.18, x0 + 0.22, -1);
  panelWall('z', Z1, z1, OFF_P, x1, -1, wo, { pitch: 6, band: 4.9 });
  glaze('z', wo, x1 - 0.22, x1 - 0.18, +1);
  // roof deck + coping + two small RTUs
  boxMM(x0 + 0.25, x1 - 0.25, OFF_H - 0.3, OFF_H, Z1 - 0.3, z1 - 0.25);
  boxMM(x0 - 0.1, x1 + 0.1, OFF_P, OFF_P + 0.08, z1 - 0.35, z1 + 0.1);
  boxMM(x0 - 0.1, x0 + 0.35, OFF_P, OFF_P + 0.08, Z1, z1);
  boxMM(x1 - 0.35, x1 + 0.1, OFF_P, OFF_P + 0.08, Z1, z1);
  rtu(-54, 35, 2.4, 1.6, 1.1, OFF_H); rtu(-38.5, 34, 2.4, 1.6, 1.1, OFF_H);
  // staff car park: stalls along the fence, wheel stops, cars
  for (let i = 0; i < 9; i++) boxMM(-61.5 + 2.7 * i - 0.8, -61.5 + 2.7 * i + 0.8, 0, 0.14, 56.5, 56.65);
  const carKinds = ['sedan', 'suv', 'sedan', null, 'suv', 'sedan', null, 'sedan', 'suv'];
  carKinds.forEach((kind, i) => { if (!kind) return; withTransform(new THREE.Matrix4().makeTranslation(-61.5 + 2.7 * i, 0, 54.5).multiply(new THREE.Matrix4().makeRotationY(i % 3 === 1 ? Math.PI : 0)), () => car(kind)); });
  boxMM(-62.5, -37.5, 0, 0.25, 46.0, 47.0); // planted island between office walkway and parking aisle
}
/** passenger car from a side-profile extrusion (z = length, y = height) plus wheels; local: centred, facing +z */
function car(kind) {
  const sedan = [[-2.3, 0.3], [-2.3, 0.8], [-1.8, 0.95], [-0.9, 1.35], [0.5, 1.42], [1.2, 1.05], [2.2, 0.9], [2.3, 0.6], [2.3, 0.3]];
  const suv = [[-2.4, 0.35], [-2.4, 1.0], [-2.2, 1.6], [-1.9, 1.74], [0.9, 1.74], [1.5, 1.3], [2.4, 1.1], [2.45, 0.6], [2.45, 0.35]];
  const prof = kind === 'suv' ? suv : sedan; const w = kind === 'suv' ? 1.9 : 1.8;
  prismX(prof, -w / 2, w / 2);
  const r = kind === 'suv' ? 0.37 : 0.33;
  for (const z of [-1.45, 1.45]) for (const sx of [-1, 1]) cylX(r, sx * (w / 2 - 0.2) - 0.11, sx * (w / 2 - 0.2) + 0.11, r, z, 14);
  boxMM(-w / 2 - 0.1, w / 2 + 0.1, 0.9, 1.0, prof[prof.length - 1][0] - 0.3, prof[prof.length - 1][0] + 0.05); // bumper line
}
/** glazing recessed in openings, with mullions every 1.5 m and a transom at the floor line. out = outward sign along n */
function glaze(axis, openings, n0, n1, out) {
  const m0 = out > 0 ? n0 : n0 - 0.12, m1 = out > 0 ? n1 + 0.12 : n1;
  for (const o of openings) {
    const ym = (o.y0 + o.y1) / 2;
    if (axis === 'x') {
      boxMM(o.a0, o.a1, o.y0, o.y1, n0, n1);
      for (let a = o.a0 + 1.5; a < o.a1 - 0.2; a += 1.5) boxMM(a - 0.04, a + 0.04, o.y0, o.y1, m0, m1);
      boxMM(o.a0, o.a1, ym - 0.03, ym + 0.03, m0, m1);
    } else {
      boxMM(n0, n1, o.y0, o.y1, o.a0, o.a1);
      for (let a = o.a0 + 1.5; a < o.a1 - 0.2; a += 1.5) boxMM(m0, m1, o.y0, o.y1, a - 0.04, a + 0.04);
      boxMM(m0, m1, ym - 0.03, ym + 0.03, o.a0, o.a1);
    }
  }
}

// ---------------------------------------------------------------- yard / apron
boxMM(APRON_X0, APRON_X1, -0.3, 0, Z1 - 0.5, APRON_Z1);            // apron slab (dock side only)
boxMM(APRON_X0, APRON_X1, 0, 0.15, APRON_Z1 - 0.3, APRON_Z1);      // curbs
boxMM(APRON_X0, APRON_X0 + 0.3, 0, 0.15, Z1, APRON_Z1);
boxMM(APRON_X1 - 0.3, APRON_X1, 0, 0.15, Z1, APRON_Z1);
// trailer bay stripes along far edge (slightly raised so they catch light)
for (let x = 34; x <= 50; x += 4) boxMM(x - 0.08, x + 0.08, 0, 0.03, APRON_Z1 - 17, APRON_Z1 - 0.3);
// yard light poles
for (const x of [-12, 18]) {
  const z = APRON_Z1 - 1.2;
  boxMM(x - 0.4, x + 0.4, 0, 0.8, z - 0.4, z + 0.4);
  cylY(0.14, x, 0.8, 12.5, z, 12);
  boxMM(x - 1.1, x + 1.1, 12.3, 12.45, z - 0.07, z + 0.07);
  for (const sx of [-1, 1]) boxMM(x + sx * 1.1 - 0.4, x + sx * 1.1 + 0.4, 12.0, 12.3, z - 0.25, z + 0.25);
}
// perimeter fence along the far edge (posts + rails), with a gate gap
for (let x = APRON_X0; x <= APRON_X1; x += 3) if (x < GATE_X0 || x > GATE_X1) cylY(0.04, x, 0.15, 2.5, APRON_Z1 - 0.15, 6);
for (const [fx0, fx1] of [[APRON_X0, GATE_X0], [GATE_X1, APRON_X1]]) {
  boxMM(fx0, fx1, 2.45, 2.5, APRON_Z1 - 0.18, APRON_Z1 - 0.12);
  boxMM(fx0, fx1, 1.3, 1.34, APRON_Z1 - 0.17, APRON_Z1 - 0.13);
  boxMM(fx0, fx1, 0.3, 0.33, APRON_Z1 - 0.17, APRON_Z1 - 0.13);
}
for (const x of [GATE_X0, GATE_X1]) cylY(0.12, x, 0.15, 2.8, APRON_Z1 - 0.15, 10); // gate posts
// gate house with roof overhang, boom barriers and a median island
{
  const gx = GATE_X0 - 2.3, gz = APRON_Z1 - 3.4;
  boxMM(gx - 1.5, gx + 1.5, 0, 0.25, gz - 1.6, gz + 1.6);
  boxMM(gx - 1.3, gx + 1.3, 0.25, 1.2, gz - 1.4, gz + 1.4);                       // sill wall
  for (const [x0, x1, z0, z1] of [[gx - 1.3, gx - 1.15, gz - 1.4, gz + 1.4], [gx + 1.15, gx + 1.3, gz - 1.4, gz + 1.4], [gx - 1.3, gx + 1.3, gz - 1.4, gz - 1.25], [gx - 1.3, gx + 1.3, gz + 1.25, gz + 1.4]]) boxMM(x0, x1, 1.2, 3.0, z0, z1); // glazing frame
  boxMM(gx - 1.1, gx + 1.1, 1.2, 3.0, gz - 1.2, gz + 1.2);                       // glass block
  boxMM(gx - 2.0, gx + 2.0, 3.0, 3.3, gz - 2.0, gz + 2.0);                       // roof
  boxMM(gx - 0.4, gx + 0.4, 3.3, 3.9, gz - 0.4, gz + 0.4);                       // rooftop AC
  boxMM(GATE_X0 + 4.6, GATE_X1 - 4.6, 0, 0.15, APRON_Z1 - 6, APRON_Z1);          // median island
  for (const [px, dir] of [[GATE_X0 + 0.6, 1], [GATE_X1 - 0.6, -1]]) {
    boxMM(px - 0.2, px + 0.2, 0, 1.1, gz - 0.2, gz + 0.2);                        // boom cabinet
    const ax0 = Math.min(px, px + dir * 4.2), ax1 = Math.max(px, px + dir * 4.2);
    boxMM(ax0, ax1, 1.05, 1.15, gz - 0.05, gz + 0.05);                            // boom arm
  }
}
// transformer pad at back-west corner
boxMM(-57, -51.5, 0, 0.2, Z0 - 5.5, Z0 - 1.2);
boxMM(-56.3, -54.1, 0.2, 2.1, Z0 - 4.8, Z0 - 3.0); boxMM(-56.6, -53.8, 2.1, 2.2, Z0 - 5.0, Z0 - 2.8);
for (let i = 0; i < 5; i++) boxMM(-56.3 - 0.25, -56.3, 0.4 + i * 0.3, 0.45 + i * 0.3, Z0 - 4.7, Z0 - 3.1);
boxMM(-53.4, -52.0, 0.2, 2.3, Z0 - 4.6, Z0 - 3.4);
for (const [x, z] of [[-57.3, Z0 - 5.8], [-51.2, Z0 - 5.8], [-57.3, Z0 - 0.9], [-51.2, Z0 - 0.9]]) cylY(0.1, x, 0, 1.2, z, 10);
// self-contained trash compactor at the last dock position
{
  const c = DOCK_X[COMPACTOR_DOOR], zf = Z1 + SHELTER_D - 0.1;
  boxMM(c - 1.2, c + 1.2, FLOOR - 0.1, FLOOR + 2.0, zf, zf + 1.8);                // charge box
  boxMM(c - 1.25, c + 1.25, 0.15, 2.65, zf + 1.8, zf + 8.2);                       // container
  for (let z = zf + 2.2; z < zf + 8.0; z += 0.6) boxMM(c - 1.3, c + 1.3, 0.2, 2.6, z - 0.04, z + 0.04); // ribs
  boxMM(c - 1.0, c + 1.0, 0.15, 2.7, zf + 8.2, zf + 8.35);                         // rear door
  boxMM(c + 1.25, c + 1.95, 0.15, 1.5, zf + 1.9, zf + 3.4);                        // power unit
  for (const z of [zf + 2.2, zf + 7.9]) boxMM(c - 1.4, c + 1.4, 0, 0.15, z - 0.15, z + 0.15); // skids
}

// ---------------------------------------------------------------- vehicles
/** 53' dry van. Local: rear face at z=0, body extends +z, centred on x=0. */
function trailer({ skirt = true } = {}) {
  const L = 16.15, W = 2.6, y0 = 1.3, y1 = 4.1;
  boxMM(-W / 2, W / 2, y0, y1, 0.08, L);                                      // body
  boxMM(-W / 2 + 0.06, W / 2 - 0.06, y0 + 0.1, y1 - 0.1, 0, 0.08);           // rear doors (recessed slightly)
  for (const sx of [-1, 1]) boxMM(sx * 0.55 - 0.03, sx * 0.55 + 0.03, y0 + 0.2, y1 - 0.2, -0.04, 0.08); // lock rods
  boxMM(-W / 2 - 0.03, W / 2 + 0.03, y0, y0 + 0.12, 0, L);                   // bottom rail
  boxMM(-W / 2 - 0.02, W / 2 + 0.02, y1 - 0.08, y1 + 0.02, 0, L);            // top rail
  for (const sx of [-1, 1]) for (let z = 0.08; z < L; z += 1.2) boxMM(sx * (W / 2) - 0.01, sx * (W / 2) + 0.025 * 1, y0 + 0.12, y1 - 0.08, z, z + 0.05); // side posts
  boxMM(-1.15, 1.15, 0.5, 0.6, 0.02, 0.12); for (const sx of [-1, 1]) boxMM(sx * 0.75 - 0.05, sx * 0.75 + 0.05, 0.6, y0, 0.05, 0.12); // ICC bar
  // bogie: slider, axles, dual wheels
  boxMM(-1.0, 1.0, 0.95, y0, 1.5, 4.7);
  for (const z of [2.3, 3.6]) {
    cylX(0.08, -1.2, 1.2, 0.5, z, 10);
    for (const sx of [-1, 1]) { cylX(0.5, sx > 0 ? 0.6 : -0.95, sx > 0 ? 0.95 : -0.6, 0.5, z, 20); cylX(0.5, sx > 0 ? 0.95 : -1.3, sx > 0 ? 1.3 : -0.95, 0.5, z, 20); }
    for (const sx of [-1, 1]) boxMM(sx * 1.25 - 0.45, sx * 1.25 + 0.45, 0.9, 1.0, z - 0.75, z + 0.75); // mudflap bracket
  }
  for (const sx of [-1, 1]) boxMM(sx * 1.0 - 0.3, sx * 1.0 + 0.3, 0.15, 0.95, 1.2, 1.26); // mudflaps
  // landing gear
  for (const sx of [-1, 1]) { boxMM(sx * 0.9 - 0.08, sx * 0.9 + 0.08, 0.35, y0, 11.4, 11.56); boxMM(sx * 0.9 - 0.18, sx * 0.9 + 0.18, 0.25, 0.38, 11.25, 11.7); }
  boxMM(-0.9, 0.9, 0.95, 1.0, 11.45, 11.52);
  if (skirt) for (const sx of [-1, 1]) boxMM(sx * 1.25 - 0.02, sx * 1.25 + 0.02, 0.5, y0, 5.2, 11.0); // aero skirt
  boxMM(-1.1, 1.1, y0 - 0.14, y0, 13.3, L - 0.2); cylY(0.05, 0, y0 - 0.3, y0 - 0.14, 15.1, 8);        // upper coupler + kingpin
  boxMM(-W / 2 + 0.2, W / 2 - 0.2, y0 + 0.4, y1 - 0.4, L, L + 0.08);                                   // nose panel
}
/** day-cab tractor. Local: fifth wheel at origin, forward = +z. */
function tractor() {
  boxMM(-0.5, 0.5, 0.8, 1.0, -1.7, 4.8);                                 // frame
  boxMM(-0.9, 0.9, 1.0, 1.12, -0.5, 0.5);                                 // fifth wheel plate
  for (const z of [-0.65, 0.65]) { cylX(0.08, -1.2, 1.2, 0.5, z, 10); for (const sx of [-1, 1]) { cylX(0.5, sx * 0.78 - 0.17, sx * 0.78 + 0.17, 0.5, z, 20); cylX(0.5, sx * 1.12 - 0.17, sx * 1.12 + 0.17, 0.5, z, 20); } }
  cylX(0.08, -1.2, 1.2, 0.5, 4.1, 10); for (const sx of [-1, 1]) cylX(0.5, sx * 1.1 - 0.17, sx * 1.1 + 0.17, 0.5, 4.1, 20); // steer
  for (const sx of [-1, 1]) boxMM(sx * 1.25 - 0.3, sx * 1.25 + 0.3, 0.95, 1.05, -1.5, 1.45);              // rear fenders
  boxMM(-1.25, 1.25, 1.0, 3.5, 0.9, 3.1);                                 // cab
  boxMM(-1.2, 1.2, 3.5, 3.58, 0.95, 3.05);
  prismX([[0.9, 3.58], [0.9, 4.15], [3.0, 3.58]], -1.1, 1.1);              // roof deflector
  boxMM(-1.15, 1.15, 2.0, 3.3, 3.1, 3.16);                                 // windscreen (recessed frame)
  boxMM(-1.0, 1.0, 1.0, 2.35, 3.1, 5.0);                                   // hood
  boxMM(-1.05, 1.05, 1.15, 2.2, 4.95, 5.1);                                // grille
  boxMM(-1.25, 1.25, 0.55, 1.0, 5.0, 5.25);                                // bumper
  for (const sx of [-1, 1]) { boxMM(sx * 1.2 - 0.25, sx * 1.2 + 0.25, 1.0, 1.95, 3.1, 5.0); }           // front fenders
  for (const sx of [-1, 1]) cylZ(0.33, sx * 0.95, 0.75, 1.4, 2.7, 14);                                 // fuel tanks
  cylY(0.08, 1.2, 1.0, 4.0, 0.95, 8);                                                                   // exhaust stack
  for (const sx of [-1, 1]) { boxMM(sx * 1.45 - 0.05, sx * 1.45 + 0.05, 1.9, 2.9, 3.0, 3.1); boxMM(sx * 1.35 - 0.02, sx * 1.55 + 0.02, 2.9, 2.94, 2.5, 3.1); } // mirrors
}
// trailers at docks (rear at shelter face)
DOCK_X.forEach((c, k) => {
  if (!TRAILER_DOORS.has(k)) return;
  withTransform(new THREE.Matrix4().makeTranslation(c, 0, Z1 + SHELTER_D - 0.1), () => {
    trailer({ skirt: k !== 10 });
    if (k === TRACTOR_DOOR) withTransform(new THREE.Matrix4().makeTranslation(0, 0, 15.1), tractor);
  });
});
// trailers parked in yard bays (rear toward fence)
for (const x of [36, 40, 48, 52]) {
  withTransform(new THREE.Matrix4().makeTranslation(x, 0, APRON_Z1 - 1.0).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), () => trailer({ skirt: x % 8 === 0 }));
}
// bobtail tractor parked in the yard
withTransform(new THREE.Matrix4().makeTranslation(-4, 0, APRON_Z1 - 6).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)), tractor);

// ---------------------------------------------------------------- landscaping
/** low-poly tree: tapered trunk + jittered icosahedron canopy (two lobes) */
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function tree(x, z, h = 6, r = 1.7) {
  const trunk = new THREE.CylinderGeometry(0.12, 0.22, h * 0.45, 8);
  add(trunk, new THREE.Matrix4().makeTranslation(x, h * 0.225, z));
  for (const [dx, dy, dz, rr] of [[0, h * 0.68, 0, r], [r * 0.45, h * 0.55, r * 0.2, r * 0.62], [-r * 0.35, h * 0.8, -r * 0.3, r * 0.55]]) {
    const g = new THREE.IcosahedronGeometry(rr, 2);
    const a = g.attributes.position; for (let i = 0; i < a.count; i++) { const k = 0.93 + rnd() * 0.14; a.setXYZ(i, a.getX(i) * k, a.getY(i) * k * 0.9, a.getZ(i) * k); }
    g.computeVertexNormals();
    add(g, new THREE.Matrix4().makeTranslation(x + dx, dy, z + dz));
  }
}
// planting strip west of the car park + island trees + trees by the sign and gate
boxMM(-66, -63, -0.3, 0.25, Z1 - 0.5, APRON_Z1);
for (const z of [34, 40, 46, 52, 57]) tree(-64.5, z, 5.5 + rnd() * 1.5, 1.6 + rnd() * 0.4);
for (const x of [-58, -51, -41]) tree(x, 46.5, 4.8 + rnd(), 1.4 + rnd() * 0.3);
tree(-38.5, 56.0, 5.0, 1.5);
for (const z of [-24, -12, 0, 12, 24]) { boxMM(X0 - 4.5, X0 - 1.5, -0.3, 0.25, z - 1.5, z + 1.5); tree(X0 - 3, z, 5.5 + rnd() * 1.5, 1.6 + rnd() * 0.4); }

// ---------------------------------------------------------------- merge + GLB
function merge(geoms) {
  let nv = 0, ni = 0;
  for (const g of geoms) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const g of geoms) {
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array, c = g.attributes.position.count;
    pos.set(p.subarray(0, c * 3), vo * 3); nor.set(n.subarray(0, c * 3), vo * 3);
    if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo; io += ia.length; }
    else { for (let i = 0; i < c; i++) idx[io + i] = vo + i; io += c; }
    vo += c;
  }
  return { pos, nor, idx };
}
function writeGLB(file, { pos, nor, idx }) {
  const n = pos.length / 3;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const v = pos[i * 3 + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
  const pad4 = (b) => (4 - (b % 4)) % 4;
  const posB = Buffer.from(pos.buffer), norB = Buffer.from(nor.buffer), idxB = Buffer.from(idx.buffer);
  const idxPad = Buffer.alloc(pad4(idxB.length));
  const bin = Buffer.concat([posB, norB, idxB, idxPad]);
  const json = {
    asset: { version: '2.0', generator: 'resume-website warehouse generator (three.js geometry)' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'warehouse' }],
    materials: [{ name: 'clay', pbrMetallicRoughness: { baseColorFactor: [0.79, 0.82, 0.86, 1], metallicFactor: 0, roughnessFactor: 0.6 } }],
    meshes: [{ name: 'warehouse', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0, mode: 4 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: n, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: n, type: 'VEC3' },
      { bufferView: 2, componentType: idx instanceof Uint32Array ? 5125 : 5123, count: idx.length, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posB.length, target: 34962 },
      { buffer: 0, byteOffset: posB.length, byteLength: norB.length, target: 34962 },
      { buffer: 0, byteOffset: posB.length + norB.length, byteLength: idxB.length, target: 34963 },
    ],
    buffers: [{ byteLength: bin.length }],
  };
  let jsonB = Buffer.from(JSON.stringify(json), 'utf8');
  jsonB = Buffer.concat([jsonB, Buffer.alloc(pad4(jsonB.length), 0x20)]);
  const header = Buffer.alloc(12); header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonB.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonB.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([header, jh, jsonB, bh, bin]));
  return { verts: n, tris: idx.length / 3, bytes: 12 + 16 + jsonB.length + bin.length, min, max };
}
const merged = merge(parts);
const stats = writeGLB(OUT, merged);
console.log(JSON.stringify({ parts: parts.length, ...stats }));
