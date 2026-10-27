// Builds public/models/computer.glb: modern thin-bezel 27" monitor (rear housing bulge, ring-hinged neck with
// cable channel, plinth foot), slim aluminium low-profile keyboard with sculpted keycaps, ergonomic mouse.
// Pure generated geometry (three.js in Node). Units: millimetres. Y up, screen faces +Z.
// Then: npx -y @gltf-transform/cli meshopt raw.glb public/models/computer.glb
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { RoundedBoxGeometry } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';

const OUT = process.argv[2] || '/Users/borinakeo/resume-website/public/models/computer.glb';

// ---- FileReader polyfill for GLTFExporter (binary path) --------------------
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};

// ---- helpers ----------------------------------------------------------------
const DEG = Math.PI / 180;
// Drop uv; optionally rebuild normals with a crease angle (hard edges where faces meet sharply); re-index.
const finish = (g, creaseDeg = 0) => {
  g.deleteAttribute('uv');
  if (creaseDeg) { g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4); g = toCreasedNormals(g, creaseDeg * DEG); }
  return mergeVertices(g, 1e-4);
};
const place = (g, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
  g.applyMatrix4(m); return g;
};
const rbox = (w, h, d, r, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);

// Rounded-rect outline with a FIXED topology (cs points per corner arc, ex/ey interior points per straight edge),
// so rings of different size/radius correspond point-for-point (CCW, centred). Returns [[x,y],...].
function rrectS(w, h, r, cs = 6, ex = 2, ey = 2) {
  r = Math.max(0.4, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3));
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, 1.5 * Math.PI]];
  const edges = [ex, ey, ex, ey]; const pts = [];
  for (let c = 0; c < 4; c++) {
    const [cx, cy, a0] = corners[c];
    for (let j = 0; j <= cs; j++) { const a = a0 + (j / cs) * Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    const a1 = a0 + Math.PI / 2; const p0 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    const [nx, ny, na] = corners[(c + 1) % 4]; const p1 = [nx + r * Math.cos(na), ny + r * Math.sin(na)];
    for (let j = 1; j <= edges[c]; j++) { const t = j / (edges[c] + 1); pts.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]); }
  }
  return pts;
}
const offs = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

// Loft rings (each [[x,z],...], same count) at heights ys[] (ascending) into a surface. capTop: concentric dished
// cap (rings shrink toward the centre); capBottom: flat fan. Side walls face outward; caps wound consistently.
function loft(rings, ys, { capTop = null, capBottom = false } = {}) {
  const N = rings[0].length; const pos = []; const idx = [];
  for (let k = 0; k < rings.length; k++) for (let i = 0; i < N; i++) pos.push(rings[k][i][0], ys[k], rings[k][i][1]);
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
    const a = k * N + i, b = k * N + (i + 1) % N, c = (k + 1) * N + i, d = (k + 1) * N + (i + 1) % N;
    idx.push(a, c, b, b, c, d);
  }
  if (capTop) {
    const { dish = 0, steps = 3 } = capTop; const top = rings[rings.length - 1]; const yTop = ys[ys.length - 1];
    let prevStart = (rings.length - 1) * N;
    for (let s = 1; s <= steps; s++) {
      const f = 1 - s / steps; const start = pos.length / 3;
      if (f > 1e-6) {
        for (let i = 0; i < N; i++) pos.push(top[i][0] * f, yTop - dish * (1 - f * f), top[i][1] * f);
        for (let i = 0; i < N; i++) { const a = prevStart + i, b = prevStart + (i + 1) % N, c = start + i, d = start + (i + 1) % N; idx.push(a, c, b, b, c, d); }
        prevStart = start;
      } else {
        pos.push(0, yTop - dish, 0);
        for (let i = 0; i < N; i++) idx.push(prevStart + i, start, prevStart + (i + 1) % N);
      }
    }
  }
  if (capBottom) {
    const start = pos.length / 3; pos.push(0, ys[0], 0);
    for (let i = 0; i < N; i++) idx.push(i, start, (i + 1) % N);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// Make a lathe point out outward: flips triangles when the signed volume is negative (closed profiles only).
function orient(g) {
  const p = g.attributes.position; const ix = g.index; let v = 0;
  const n = ix ? ix.count : p.count;
  for (let t = 0; t < n; t += 3) {
    const a = ix ? ix.getX(t) : t, b = ix ? ix.getX(t + 1) : t + 1, c = ix ? ix.getX(t + 2) : t + 2;
    const ax = p.getX(a), ay = p.getY(a), az = p.getZ(a), bx = p.getX(b), by = p.getY(b), bz = p.getZ(b), cx = p.getX(c), cy = p.getY(c), cz = p.getZ(c);
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  if (v < 0 && ix) { for (let t = 0; t < n; t += 3) { const b = ix.getX(t + 1), c = ix.getX(t + 2); ix.setX(t + 1, c); ix.setX(t + 2, b); } g.computeVertexNormals(); }
  return g;
}
const lathe = (prof, seg = 48) => orient(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg));
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Smooth interpolation through control points [(t, v)...] (monotone cubic).
function spline(ctrl) {
  const ts = ctrl.map((c) => c[0]), vs = ctrl.map((c) => c[1]); const n = ts.length;
  const d = []; for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
  const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i]; const s = a * a + b * b; if (s > 9) { const tau = 3 / Math.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; } }
  return (t) => {
    t = Math.min(Math.max(t, ts[0]), ts[n - 1]); let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], x = (t - ts[i]) / h;
    const h00 = 2 * x ** 3 - 3 * x ** 2 + 1, h10 = x ** 3 - 2 * x ** 2 + x, h01 = -2 * x ** 3 + 3 * x ** 2, h11 = x ** 3 - x ** 2;
    return h00 * vs[i] + h10 * h * m[i] + h01 * vs[i + 1] + h11 * h * m[i + 1];
  };
}

const parts = { monitor: [], screen: [], stand: [], keyboard: [], keycaps: [], mouse: [] };
// The site loader reduces each mesh's material colour to a grey (linear luminance, clamped 0.35-1) that drives the vertex
// colour, so per-part shades are the only way to separate parts there: bright clay everywhere, glass and the aluminium
// case a step darker so the screen, caps and board read as different surfaces.
const SHADE = { monitor: 1.0, screen: 0.8, stand: 1.0, keyboard: 0.66, keycaps: 1.0, mouse: 1.0 };
// add(part, geometry, transform, creaseDegrees): crease > 0 gives hard edges on flat/chamfered parts.
const add = (part, g, xf, crease = 0) => parts[part].push(finish(xf ? place(g, xf) : g, crease));
const CIRCLE = (r, n = 40) => Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI)]);

// =============================================================================
// LAYOUT (world, mm). Base centre z = 10; hinge axis behind the panel; keyboard in front.
// =============================================================================
const HUB_Z = 10, HINGE_Y = 270, HINGE_Z = -6, PLINTH_TOP = 10;

// =============================================================================
// MONITOR (27" 16:9, thin bezel). Built in panel-local space: front glass plane at z = 0, panel centre at origin,
// then moved so the hinge barrel (local b) lands on the world hinge point, tilted back 4 deg about it.
// =============================================================================
const SCREEN_W = 598, SCREEN_H = 336, GAP = 1.0, BEZEL = 2.0, CHIN = 16, EDGE = 5;
const HOLE_W = SCREEN_W + 2 * GAP, HOLE_H = SCREEN_H + 2 * GAP;
const PANEL_W = HOLE_W + 2 * BEZEL, PANEL_H = HOLE_H + BEZEL + CHIN; // 604 x 356
const HOLE_CY = (CHIN - BEZEL) / 2;            // screen centre sits 7 mm above the panel centre
const GLASS_FRONT = -0.4;                      // glass recessed 0.4 mm behind the bezel face
const BULGE_D = 40, BULGE_CY = -12;            // rear housing swell: depth behind the 5 mm edge, vertical centre
const PLATEAU_Z = -(EDGE + BULGE_D);           // back of the housing, -43
const BARREL_LOCAL = [0, BULGE_CY - 0, PLATEAU_Z - 13];
const monitor = [], screenParts = [];
{
  // front bezel frame: extruded rounded rect with the screen hole and a small logo-dimple hole in the chin
  const outer = rrectS(PANEL_W, PANEL_H, 5, 8, 6, 6);
  const hole = rrectS(HOLE_W, HOLE_H, 1.4, 5, 6, 6); const holeP = offs(hole, 0, HOLE_CY);
  const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
  shape.holes.push(new THREE.Path(holeP.map(([x, y]) => new THREE.Vector2(x, y))));
  const logoY = -PANEL_H / 2 + CHIN / 2;
  shape.holes.push(new THREE.Path(offs(CIRCLE(4.8, 36), 0, logoY).map(([x, y]) => new THREE.Vector2(x, y))));
  const bevT = 0.8, depth = EDGE - 2 * bevT;
  const frame = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevT, bevelSize: 0.8, bevelSegments: 2, curveSegments: 1, steps: 1 });
  frame.translate(0, 0, -(depth + bevT));
  monitor.push([frame, 38]);
  // logo dimple floor, 1 mm below the bezel face
  const disc = new THREE.CylinderGeometry(5.2, 5.2, 3, 32); disc.rotateX(Math.PI / 2); disc.translate(0, logoY, -1.0 - 1.5); monitor.push([disc, 0]);
  const logoRing = new THREE.TorusGeometry(2.0, 0.35, 8, 28); logoRing.translate(0, logoY, -0.95); monitor.push([logoRing, 0]);
  // glass: a rounded slab filling the hole, front face recessed; thin glass gap reads as a screen edge
  const glass = rbox(SCREEN_W, SCREEN_H, 8, 1.2, 3); glass.translate(0, HOLE_CY, GLASS_FRONT - 4); screenParts.push([glass, 0]);
  // very low-relief ERP bar chart on the screen (0.35 mm), header strip, grid lines
  const relief = 0.35, zf = GLASS_FRONT + relief / 2; const chartW = 380, chartH = 190, cx = 0, cy = HOLE_CY - 20;
  const bx = (w, h, z, x, y, d = relief) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); screenParts.push([b, 0]); };
  bx(chartW, 2.5, zf, cx, cy - chartH / 2);
  const bars = 7, bw = 30, gp = (chartW - 40 - bars * bw) / (bars - 1); const heights = [0.22, 0.33, 0.30, 0.46, 0.58, 0.72, 0.92];
  for (let i = 0; i < bars; i++) { const h = chartH * heights[i]; bx(bw, h, zf, cx - chartW / 2 + 20 + bw / 2 + i * (bw + gp), cy - chartH / 2 + 2.5 + h / 2); }
  for (let k = 1; k <= 3; k++) bx(chartW, 1.2, GLASS_FRONT + relief * 0.3, cx, cy - chartH / 2 + (chartH * k) / 4, relief * 0.6);
  bx(SCREEN_W - 40, 14, zf, 0, HOLE_CY + SCREEN_H / 2 - 24);

  // rear housing: smoothstep swell from the 5 mm panel edge into a ~38 mm deep central plateau (about a third wide)
  const RHO_MIN = 0.38, K = 16; const rings = []; const ys = [];
  for (let k = 0; k <= K; k++) {
    const rho = RHO_MIN + (1 - RHO_MIN) * (k / K);          // plateau -> edge
    const tt = (1 - rho) / (1 - RHO_MIN); const depthBehind = EDGE + BULGE_D * (1 - Math.pow(1 - tt, 2.2));  // quick shoulder, flat plateau
    const w = (PANEL_W - 3) * rho, h = (PANEL_H - 3) * rho; const r = 3 + Math.pow(tt, 0.75) * 62;
    const cyk = BULGE_CY * (1 - rho) / (1 - RHO_MIN);   // centre drifts down toward the plateau
    const ring = rrectS(w, h, r, 10, 30, 18);
    rings.push(ring.map(([x, y]) => [x, -(y + cyk)])); ys.push(-depthBehind + (k === K ? 1.0 : 0));
  }
  const housing = loft(rings, ys, { capBottom: true }); housing.rotateX(Math.PI / 2);
  { const ix = housing.index; for (let t = 0; t < ix.count; t += 3) { const b = ix.getX(t + 1), c = ix.getX(t + 2); ix.setX(t + 1, c); ix.setX(t + 2, b); } housing.computeVertexNormals(); } // the z mirror flipped winding
  monitor.push([housing, 0]);

  // rear details on the plateau: hinge mount plate, vent strip (plate + ribs), cable/port cover
  const pl = (w, h, d, r, x, y, z = PLATEAU_Z) => { const g = rbox(w, h, d, r, 3); g.translate(x, y, z - d / 2 + 0.3); monitor.push([g, 0]); };
  pl(104, 50, 3.0, 8, 0, BULGE_CY - 0);                       // hinge saddle
  pl(116, 22, 1.6, 4, 0, BULGE_CY + 33);                       // vent plate
  for (let i = -7; i <= 7; i++) { const g = new THREE.BoxGeometry(2.4, 15, 1.2); g.translate(i * 7.2, BULGE_CY + 33, PLATEAU_Z - 1.6 - 0.3); monitor.push([g, 0]); }
  pl(124, 18, 2.6, 5, 0, BULGE_CY - 44);                       // cable / port cover
  // power button nub and status LED on the chin
  const pwr = new THREE.CylinderGeometry(3.2, 3.2, 3, 24); pwr.translate(PANEL_W / 2 - 40, -PANEL_H / 2 - 0.4, -EDGE / 2); monitor.push([pwr, 0]);
  const led = new THREE.CylinderGeometry(1.1, 1.1, 0.6, 12); led.rotateX(Math.PI / 2); led.translate(PANEL_W / 2 - 40, -PANEL_H / 2 + CHIN / 2 - 3, 0.0); monitor.push([led, 0]);
}
{
  const tilt = -4 * DEG;
  const [bx, by, bz] = BARREL_LOCAL;
  for (const [list, name] of [[monitor, 'monitor'], [screenParts, 'screen']]) for (const [g, crease] of list) { g.translate(-bx, -by, -bz); add(name, g, { pos: [0, HINGE_Y, HINGE_Z], rot: [tilt, 0, 0] }, crease); }
}

// =============================================================================
// STAND: plinth foot + raised hub, neck with rear cable channel & clip, ring-hinged barrel boss
// =============================================================================
{
  // plinth 220 x 170, 3 mm chamfer top & bottom, floating on a slightly smaller pad
  const PW = 220, PD = 170, PR = 26; const ring = (w, d) => rrectS(w, d, PR - (PW - w) / 2, 8, 20, 14);
  const P = (w, d, y) => ({ w, d, y });
  const prof = [P(214, 164, 1.2), P(220, 170, 4.2), P(220, 170, 7.0), P(214, 164, PLINTH_TOP)];
  const plinth = loft(prof.map(({ w, d }) => ring(w, d)), prof.map((p) => p.y), { capTop: { dish: 0, steps: 1 }, capBottom: true });
  add('stand', plinth, { pos: [0, 0, HUB_Z] }, 28);
  const pad = loft([rrectS(196, 146, 18, 8, 18, 12), rrectS(196, 146, 18, 8, 18, 12)], [0, 1.4], { capBottom: true });
  add('stand', pad, { pos: [0, 0, HUB_Z] }, 28);
  // raised hub
  const hp = [[116, 90, 22, PLINTH_TOP - 0.3], [104, 80, 22, PLINTH_TOP + 3.5], [94, 72, 20, PLINTH_TOP + 7.5]];
  const hub = loft(hp.map(([w, d, r]) => rrectS(w, d, r, 8, 12, 10)), hp.map((h) => h[3]), { capTop: { dish: 0, steps: 1 } });
  add('stand', hub, { pos: [0, 0, HUB_Z] }, 28);

  // neck: tapered slab leaning back to the hinge, with a rear cable groove (real indent) and a cover clip
  const yBot = PLINTH_TOP + 7.0, L = HINGE_Y - yBot; const tanLean = (HUB_Z - HINGE_Z) / L;
  const defs = [ // [t along neck 0..1, width, depth, radius, groove depth]
    [0.00, 96, 32, 15, 0], [0.04, 88, 26, 12, 0], [0.10, 80, 21, 9, 3.0], [0.30, 76, 19, 8, 5.5],
    [0.70, 74, 18, 8, 6], [0.92, 74, 20, 8, 5], [1.0, 72, 20, 8, 0],
  ];
  const nrings = []; const nys = [];
  for (const [t, w, d, r, gd] of defs) {
    const ring = rrectS(w, d, r, 6, 36, 4).map(([x, z]) => {
      if (Math.abs(z + d / 2) < 1e-6 && Math.abs(x) < 24) z += gd * (1 - smoothstep(11, 19, Math.abs(x)));
      return [x, z];
    });
    nrings.push(ring); nys.push(t * L);
  }
  const neck = loft(nrings, nys, { capTop: { dish: 0, steps: 1 } });
  { const p = neck.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - tanLean * p.getY(i)); neck.computeVertexNormals(); }
  add('stand', neck, { pos: [0, yBot, HUB_Z] });
  // cover clip: a slim plate bridging the cable channel part way up
  const clipT = 0.42; const clipY = yBot + clipT * L; const clipZ = HUB_Z - tanLean * clipT * L - 18 / 2 - 0.4;
  const clip = rbox(40, 34, 3.6, 1.6, 3); add('stand', clip, { pos: [0, clipY, clipZ + 0.6], rot: [Math.atan(tanLean) * 0, 0, 0] });
  // hinge: central barrel + two collar rings (ring hinge) and chamfered end caps, axis X
  const barrel = lathe([[0, 49], [10.5, 49], [12.6, 47], [13, 45], [13, -45], [12.6, -47], [10.5, -49], [0, -49]], 40); barrel.rotateZ(Math.PI / 2);
  add('stand', barrel, { pos: [0, HINGE_Y, HINGE_Z] }, 35);
  for (const sx of [-1, 1]) {
    const collar = lathe([[0, 8], [16, 8], [18.2, 6], [18.2, -6], [16, -8], [0, -8]], 44); collar.rotateZ(Math.PI / 2);
    add('stand', collar, { pos: [sx * 27, HINGE_Y, HINGE_Z] }, 35);
  }
  // neck head block joining the collars
  const head = rbox(54, 34, 26, 8, 4); add('stand', head, { pos: [0, HINGE_Y - 14, HINGE_Z - 1] });
}

// =============================================================================
// KEYBOARD: slim aluminium-style low-profile board (Mac-style 15u layout with F-row and inverted-T arrows).
// Case: chamfered rounded slab, 4.5 mm at the front rising to 11 mm at the back, on four low rubber feet.
// Keys: dished low-profile caps, 1 mm gaps, staggered rows.
// =============================================================================
const U = 19.05, KEY_GAP = 1.0;
const KB_M = 6;                                   // case margin around the key field
const KB_W = 15 * U + 2 * KB_M, KB_F_ROW = 13, KB_D = KB_F_ROW + 5 * U + 2 * KB_M;
const KB_FRONT_T = 4.5, KB_BACK_T = 11, KB_FEET = 1.2;
const KB_POS = [0, 0, 218];
const kbHz = (z) => KB_FRONT_T + (KB_BACK_T - KB_FRONT_T) * ((KB_D / 2 - z) / KB_D); // case top height at local z
const kbSlope = Math.atan((KB_BACK_T - KB_FRONT_T) / KB_D);

function keycap(wMM, dMM, h) {
  const cs = 5, ex = Math.max(1, Math.round(wMM / 9)), ey = Math.max(1, Math.round(dMM / 12));
  const rr = (w, d, r) => rrectS(w, d, r, cs, ex, ey);
  const rings = [rr(wMM, dMM, 2.4), rr(wMM - 0.3, dMM - 0.3, 2.4), rr(wMM - 1.7, dMM - 1.7, 3.0), rr(wMM - 3.0, dMM - 3.0, 3.4)];
  return loft(rings, [0, 0.7, h - 0.9, h], { capTop: { dish: 0.45, steps: 3 } });
}
{
  // case: plan-view rounded rectangle loft, then scaled in height by the wedge profile
  const rr = (w, d, r) => rrectS(w, d, r, 6, 40, 10);
  const rings = [rr(KB_W - 5, KB_D - 5, 6), rr(KB_W, KB_D, 8), rr(KB_W, KB_D, 8), rr(KB_W - 2.6, KB_D - 2.6, 7)];
  const ys0 = [0, 1.3, 3.3, 4.5];
  const body = loft(rings, ys0, { capTop: { dish: 0, steps: 1 }, capBottom: true });
  { const p = body.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * kbHz(p.getZ(i)) / 4.5); }
  add('keyboard', body, { pos: [KB_POS[0], KB_POS[1] + KB_FEET, KB_POS[2]] }, 30);
  // rubber feet
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = rbox(30, KB_FEET * 2, 12, 0.5, 2); add('keyboard', f, { pos: [sx * (KB_W / 2 - 34), 0, KB_POS[2] + sz * (KB_D / 2 - 14)] }); }

  const zBack = -KB_D / 2 + KB_M;                 // back edge of the key field (case-local z)
  const rowC = [zBack + KB_F_ROW / 2]; for (let r = 0; r < 5; r++) rowC.push(zBack + KB_F_ROW + U * r + U / 2);
  const rows = [
    { c: rowC[0], d: KB_F_ROW - KEY_GAP, h: 4.0, keys: [1.5, ...Array(12).fill(1), 1.5] },
    { c: rowC[1], d: U - KEY_GAP, h: 5.0, keys: [...Array(13).fill(1), 2] },
    { c: rowC[2], d: U - KEY_GAP, h: 5.0, keys: [1.5, ...Array(12).fill(1), 1.5] },
    { c: rowC[3], d: U - KEY_GAP, h: 5.0, keys: [1.75, ...Array(11).fill(1), 2.25] },
    { c: rowC[4], d: U - KEY_GAP, h: 5.0, keys: [2.25, ...Array(10).fill(1), 2.75] },
  ];
  const putKey = (xu, wu, zc, d, h) => {
    const w = wu * U - KEY_GAP; const x = (xu + wu / 2 - 7.5) * U;
    add('keycaps', keycap(w, d, h), { pos: [KB_POS[0] + x, KB_POS[1] + KB_FEET + kbHz(zc) - 0.15, KB_POS[2] + zc], rot: [kbSlope, 0, 0] });
  };
  for (const row of rows) { let xu = 0; for (const wu of row.keys) { putKey(xu, wu, row.c, row.d, row.h); xu += wu; } }
  // bottom row: fn ctrl opt cmd [space] cmd opt, then arrow cluster (half-height up/down)
  const zb = rowC[5]; const bot = [1, 1, 1, 1.25, 5.5, 1.25, 1]; let xu = 0;
  for (const wu of bot) { putKey(xu, wu, zb, U - KEY_GAP, 5.0); xu += wu; }
  const half = (U - KEY_GAP) / 2 - 0.4;
  putKey(12, 1, zb, U - KEY_GAP, 5.0); putKey(14, 1, zb, U - KEY_GAP, 5.0);
  putKey(13, 1, zb - U / 4, half, 5.0); putKey(13, 1, zb + U / 4, half, 5.0);
}

// =============================================================================
// MOUSE: parametric ergonomic shell with button split, wheel slot, side buttons
// =============================================================================
{
  const L = 118; const NU = 160, NV = 56;
  // half-width and height along the body (u: 0 front -> 1 back)
  const W = spline([[0, 0], [0.003, 7], [0.01, 13], [0.025, 19.5], [0.05, 24.5], [0.1, 28], [0.3, 30], [0.55, 33], [0.72, 32.5], [0.86, 28.5], [0.9, 26], [0.95, 21], [0.975, 15], [0.99, 9.5], [0.997, 5], [1, 0]]);
  const H = spline([[0, 0], [0.004, 7], [0.015, 13], [0.04, 17.5], [0.1, 21], [0.3, 28], [0.5, 36.5], [0.62, 39], [0.75, 36], [0.86, 28], [0.9, 22], [0.95, 14], [0.975, 9], [0.99, 5], [0.997, 2.5], [1, 0]]);
  const pos = []; const idx = [];
  const splitU = 0.47; // buttons/palm seam
  const wheelU0 = 0.11, wheelU1 = 0.27, wheelHalfW = 4.6;
  const vertAt = (u, v) => {
    // v in [-1,1] across; superellipse cross-section, slightly asymmetric (thumb side flatter)
    const w = W(u), h = H(u); const p = 2.6;
    const a = Math.abs(v); const y = h * Math.pow(Math.max(0, 1 - Math.pow(a, p)), 1 / p);
    let x = w * v; const z = L / 2 - u * L; // front at +z
    let yy = y;
    // grooves (only on the upper shell)
    if (y > 2) {
      // central button split, front region
      if (u < splitU) { const dx = Math.abs(x); yy -= 1.7 * Math.exp(-(dx * dx) / (2 * 0.8 * 0.8)); }
      // button/palm seam
      const du = (u - splitU) * L; yy -= 1.5 * Math.exp(-(du * du) / (2 * 0.8 * 0.8)) * Math.min(1, y / 6);
      // wheel slot
      if (u > wheelU0 && u < wheelU1 && Math.abs(x) < wheelHalfW) { const e = Math.min(1, (wheelU1 - u) * L / 2, (u - wheelU0) * L / 2, (wheelHalfW - Math.abs(x)) / 0.8); yy -= 7 * e; }
    }
    return [x, Math.max(0, yy), z];
  };
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const t = i / NU; const u = t - 0.5 * Math.sin(2 * Math.PI * t) * 0.14; const v = -1 + (2 * j) / NV; pos.push(...vertAt(u, v));
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = a + 1, c = a + (NV + 1), d = c + 1; idx.push(a, b, c, b, d, c);
  }
  // bottom: flat plate closing the shell
  const start = pos.length / 3; pos.push(0, 0, 0);
  for (let i = 0; i < NU; i++) { const a = i * (NV + 1), c = (i + 1) * (NV + 1); idx.push(a, start, c); const a2 = i * (NV + 1) + NV, c2 = (i + 1) * (NV + 1) + NV; idx.push(a2, c2, start); }
  const shell = new THREE.BufferGeometry(); shell.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); shell.setIndex(idx);
  shell.computeVertexNormals();
  // scroll wheel: knurled cylinder, axis X, sitting in the slot
  const uw = (wheelU0 + wheelU1) / 2; const zw = L / 2 - uw * L; const yTop = vertAt(uw, 0)[1] + 7; // original surface height
  const wheelR = 9.5; const wheelPts = []; const K = 60;
  const wheel = new THREE.CylinderGeometry(wheelR, wheelR, 7, K); wheel.rotateZ(Math.PI / 2);
  // knurl: push alternate radial rows in/out
  { const p = wheel.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); const ang = Math.atan2(z, y); const k = Math.round((ang / (2 * Math.PI)) * K); const r = Math.hypot(y, z); if (r > wheelR - 0.01) { const f = 1 + (k % 2 ? 0.04 : -0.0); p.setY(i, y * f); p.setZ(i, z * f); } } }
  wheel.computeVertexNormals();
  wheel.translate(0, yTop - wheelR + 4.5, zw);
  // side buttons on the thumb side (-X), low domed slivers
  const sb = (zc, len) => { const g = rbox(3.5, 5.5, len, 1.6, 3); g.translate(-W(0.5 - zc / L) - 0.6, H(0.5) * 0.45, zc); return g; };
  const sideA = sb(12, 16), sideB = sb(-6, 16);
  const mouseXf = { pos: [252, 0, 226], rot: [0, -14 * DEG, 0] };
  add('mouse', shell, mouseXf); add('mouse', wheel, mouseXf); add('mouse', sideA, mouseXf); add('mouse', sideB, mouseXf);
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
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color(SHADE[name], SHADE[name], SHADE[name]), roughness: 0.55, metalness: 0 }));
  mesh.name = name; scene.add(mesh);
}
const exporter = new GLTFExporter();
const buf = await exporter.parseAsync(scene, { binary: true });
fs.writeFileSync(OUT, Buffer.from(buf));
console.log(JSON.stringify({ tris, bytes: fs.statSync(OUT).size, out: OUT }));
