// Builds public/models/computer.glb: thin-bezel monitor on a stand, TKL keyboard, ergonomic mouse.
// Pure generated geometry (three.js in Node). Units: millimetres. Y up, screen faces +Z.
import * as THREE from '/Users/borinakeo/resume-website/node_modules/three/build/three.module.js';
import { RoundedBoxGeometry } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from '/Users/borinakeo/resume-website/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
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
const clean = (g) => { g.deleteAttribute('uv'); if (!g.index) g = mergeVertices(g, 1e-4); else g = mergeVertices(g, 1e-4); return g; };
const place = (g, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
  g.applyMatrix4(m); return g;
};
const rbox = (w, h, d, r, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);

// Rounded-rect perimeter sampled with N points (CCW in the XZ plane, centred).
function roundedRect(w, h, r, N) {
  r = Math.min(r, w / 2 - 1e-6, h / 2 - 1e-6);
  const pts = [];
  const straight = 2 * (w - 2 * r) + 2 * (h - 2 * r); const arcs = 2 * Math.PI * r; const total = straight + arcs;
  // Walk perimeter at equal arc-length steps starting at (+w/2, 0) going CCW.
  const segs = [];
  const c = [[w / 2 - r, h / 2 - r], [-w / 2 + r, h / 2 - r], [-w / 2 + r, -h / 2 + r], [w / 2 - r, -h / 2 + r]];
  // sequence: right edge up, arc TR, top edge left, arc TL, left edge down, arc BL, bottom edge right, arc BR
  segs.push({ type: 'line', a: [w / 2, -h / 2 + r], b: [w / 2, h / 2 - r] });
  segs.push({ type: 'arc', c: c[0], a0: 0, a1: Math.PI / 2 });
  segs.push({ type: 'line', a: [w / 2 - r, h / 2], b: [-w / 2 + r, h / 2] });
  segs.push({ type: 'arc', c: c[1], a0: Math.PI / 2, a1: Math.PI });
  segs.push({ type: 'line', a: [-w / 2, h / 2 - r], b: [-w / 2, -h / 2 + r] });
  segs.push({ type: 'arc', c: c[2], a0: Math.PI, a1: 1.5 * Math.PI });
  segs.push({ type: 'line', a: [-w / 2 + r, -h / 2], b: [w / 2 - r, -h / 2] });
  segs.push({ type: 'arc', c: c[3], a0: 1.5 * Math.PI, a1: 2 * Math.PI });
  const lens = segs.map((s) => s.type === 'line' ? Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) : r * (s.a1 - s.a0));
  for (let i = 0; i < N; i++) {
    let d = (i / N) * total; let k = 0;
    while (k < segs.length - 1 && d > lens[k]) { d -= lens[k]; k++; }
    const s = segs[k]; const t = lens[k] > 0 ? d / lens[k] : 0;
    if (s.type === 'line') pts.push([s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]);
    else { const a = s.a0 + (s.a1 - s.a0) * t; pts.push([s.c[0] + r * Math.cos(a), s.c[1] + r * Math.sin(a)]); }
  }
  return pts;
}

// Loft a list of rings (each: array of [x,z]) placed at heights ys[] into a closed side surface (indexed).
// Optional caps: 'top' (concentric dish) and 'bottom' (flat fan).
function loft(rings, ys, { capTop = null, capBottom = false } = {}) {
  const N = rings[0].length; const pos = []; const idx = [];
  for (let k = 0; k < rings.length; k++) for (let i = 0; i < N; i++) pos.push(rings[k][i][0], ys[k], rings[k][i][1]);
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
    const a = k * N + i, b = k * N + (i + 1) % N, c = (k + 1) * N + i, d = (k + 1) * N + (i + 1) % N;
    idx.push(a, c, b, b, c, d);
  }
  if (capTop) {
    // concentric rings shrinking toward centre; dish lowers the centre (parabolic)
    const { dish = 0, steps = 3 } = capTop; const top = rings[rings.length - 1]; const yTop = ys[ys.length - 1];
    let prevStart = (rings.length - 1) * N;
    for (let s = 1; s <= steps; s++) {
      const f = 1 - s / steps; const start = pos.length / 3;
      if (f > 1e-6) {
        for (let i = 0; i < N; i++) pos.push(top[i][0] * f, yTop - dish * (1 - f * f), top[i][1] * f);
        for (let i = 0; i < N; i++) { const a = prevStart + i, b = prevStart + (i + 1) % N, c = start + i, d = start + (i + 1) % N; idx.push(a, b, c, b, d, c); }
        prevStart = start;
      } else {
        pos.push(0, yTop - dish, 0);
        for (let i = 0; i < N; i++) idx.push(prevStart + i, prevStart + (i + 1) % N, start);
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

const parts = { monitor: [], stand: [], keyboard: [], mouse: [] };
const add = (part, g, xf) => parts[part].push(clean(xf ? place(g, xf) : g));

// =============================================================================
// MONITOR (27" 16:9). Panel front face at z = 0 before tilt; centred on x = 0.
// =============================================================================
const SCREEN_W = 598, SCREEN_H = 336; // active area
const BEZEL = 7, CHIN = 20, PANEL_D = 9;
const PANEL_W = SCREEN_W + 2 * BEZEL, PANEL_H = SCREEN_H + BEZEL + CHIN;
const panelBottom = 108; // height of panel bottom edge above the desk
const PANEL_CY = panelBottom + PANEL_H / 2;
const monitorGroup = []; // geometries built in panel-local space (front face at z = 0, centre y = 0), then tilted/placed

function bezelFrame() {
  const shape = new THREE.Shape();
  const ro = 5, ow = PANEL_W, oh = PANEL_H;
  shape.moveTo(-ow / 2 + ro, -oh / 2); shape.lineTo(ow / 2 - ro, -oh / 2); shape.quadraticCurveTo(ow / 2, -oh / 2, ow / 2, -oh / 2 + ro);
  shape.lineTo(ow / 2, oh / 2 - ro); shape.quadraticCurveTo(ow / 2, oh / 2, ow / 2 - ro, oh / 2);
  shape.lineTo(-ow / 2 + ro, oh / 2); shape.quadraticCurveTo(-ow / 2, oh / 2, -ow / 2, oh / 2 - ro);
  shape.lineTo(-ow / 2, -oh / 2 + ro); shape.quadraticCurveTo(-ow / 2, -oh / 2, -ow / 2 + ro, -oh / 2);
  const hole = new THREE.Path(); const iy = (CHIN - BEZEL) / 2; // screen centre is above panel centre by iy
  const iw = SCREEN_W, ih = SCREEN_H, ri = 1.5;
  hole.moveTo(-iw / 2 + ri, iy - ih / 2); hole.lineTo(iw / 2 - ri, iy - ih / 2); hole.quadraticCurveTo(iw / 2, iy - ih / 2, iw / 2, iy - ih / 2 + ri);
  hole.lineTo(iw / 2, iy + ih / 2 - ri); hole.quadraticCurveTo(iw / 2, iy + ih / 2, iw / 2 - ri, iy + ih / 2);
  hole.lineTo(-iw / 2 + ri, iy + ih / 2); hole.quadraticCurveTo(-iw / 2, iy + ih / 2, -iw / 2, iy + ih / 2 - ri);
  hole.lineTo(-iw / 2, iy - ih / 2 + ri); hole.quadraticCurveTo(-iw / 2, iy - ih / 2, -iw / 2 + ri, iy - ih / 2);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: PANEL_D, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 3, curveSegments: 6 });
  // extrude goes +z from 0..depth; we want front face at z=0 and body behind (−z)
  g.translate(0, 0, -PANEL_D - 1.2);
  return g;
}
monitorGroup.push(bezelFrame());
// Screen slab, front face recessed 1.6 mm behind the bezel front
{
  const iy = (CHIN - BEZEL) / 2; const slab = new THREE.BoxGeometry(SCREEN_W + 2, SCREEN_H + 2, 6);
  slab.translate(0, iy, -1.6 - 3);
  monitorGroup.push(slab);
  // Very low-relief ERP bar chart: baseline + 7 rising bars + 3 faint grid lines. 0.5 mm relief.
  const relief = 0.5, zf = -1.6 + relief / 2;
  const chartW = 380, chartH = 190, cx = 0, cy = iy - 20;
  const base = new THREE.BoxGeometry(chartW, 2.5, relief); base.translate(cx, cy - chartH / 2, zf); monitorGroup.push(base);
  const bars = 7, bw = 30, gap = (chartW - 40 - bars * bw) / (bars - 1);
  const heights = [0.22, 0.33, 0.30, 0.46, 0.58, 0.72, 0.92];
  for (let i = 0; i < bars; i++) {
    const h = chartH * heights[i]; const b = new THREE.BoxGeometry(bw, h, relief);
    b.translate(cx - chartW / 2 + 20 + bw / 2 + i * (bw + gap), cy - chartH / 2 + 2.5 + h / 2, zf); monitorGroup.push(b);
  }
  for (let k = 1; k <= 3; k++) { const l = new THREE.BoxGeometry(chartW, 1.2, relief * 0.6); l.translate(cx, cy - chartH / 2 + (chartH * k) / 4, -1.6 + relief * 0.3); monitorGroup.push(l); }
  // header strip (ERP title bar) and a small side nav block
  const hdr = new THREE.BoxGeometry(SCREEN_W - 40, 14, relief); hdr.translate(0, iy + SCREEN_H / 2 - 24, zf); monitorGroup.push(hdr);
}
// Rear housing: rounded bulge covering the central area, plus a thinner outer back skin
{
  const skin = rbox(PANEL_W - 10, PANEL_H - 10, 6, 2.5); skin.translate(0, 0, -PANEL_D - 1.2 - 3 + 0.5); monitorGroup.push(skin);
  const house = rbox(400, 250, 46, 16, 5); house.translate(0, -10, -PANEL_D - 1.2 - 23 - 2); monitorGroup.push(house);
  // VESA plate (100x100 pattern) with four bosses
  const vesa = rbox(118, 118, 8, 4); vesa.translate(0, -10, -PANEL_D - 1.2 - 46 - 4 - 2 + 1); monitorGroup.push(vesa);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const boss = new THREE.CylinderGeometry(5, 5, 3, 20); boss.rotateX(Math.PI / 2); boss.translate(sx * 50, -10 + sy * 50, -PANEL_D - 1.2 - 46 - 8 - 2 + 1 - 1.5); monitorGroup.push(boss); }
  // ports recess strip on the housing underside
  const ports = new THREE.BoxGeometry(160, 6, 26); ports.translate(-40, -10 - 125 + 3, -PANEL_D - 1.2 - 23 - 2); monitorGroup.push(ports);
  // power button nub under the chin (right side)
  const pwr = new THREE.CylinderGeometry(3, 3, 3, 20); pwr.translate(PANEL_W / 2 - 40, -PANEL_H / 2 - 1.2, -PANEL_D / 2 - 1.2); monitorGroup.push(pwr);
  // tiny status LED on the chin
  const led = new THREE.CylinderGeometry(1.4, 1.4, 1, 12); led.rotateX(Math.PI / 2); led.translate(PANEL_W / 2 - 40, -PANEL_H / 2 + CHIN / 2 - 3, 0.3); monitorGroup.push(led);
}
// Place the panel: tilt back 4 degrees around the hinge (which sits at the VESA plate), front face near z = 30
const MONITOR_TILT = -4 * DEG;
const monitorXf = { pos: [0, PANEL_CY, 32], rot: [MONITOR_TILT, 0, 0] };
for (const g of monitorGroup) add('monitor', g, monitorXf);

// =============================================================================
// STAND: hinge + bracket + tapered neck + lathed oval base
// =============================================================================
const hingeZ = 32 - PANEL_D - 1.2 - 46 - 8 - 2 - 6; // just behind VESA plate
const hingeY = PANEL_CY - 10;
{
  // hinge barrel (axis X)
  const barrel = new THREE.CylinderGeometry(11, 11, 76, 32); barrel.rotateZ(Math.PI / 2); add('stand', barrel, { pos: [0, hingeY, hingeZ] });
  // bracket plate bolting to the VESA
  const brk = rbox(100, 100, 6, 3); add('stand', brk, { pos: [0, hingeY, hingeZ + 6 + 3], rot: [MONITOR_TILT, 0, 0] });
  // neck: tapered rounded-rect loft, leaning back 10 degrees, from base hub to the hinge
  const neckBottomY = 16, neckTopY = hingeY + 10;
  const lean = 10 * DEG; const L = (neckTopY - neckBottomY) / Math.cos(lean);
  const N = 48; const rings = [roundedRect(84, 30, 12, N), roundedRect(78, 26, 10, N), roundedRect(62, 15, 7, N), roundedRect(58, 14, 6.5, N), roundedRect(58, 14, 6.5, N)];
  const neck = loft(rings, [0, L * 0.10, L * 0.70, L * 0.96, L], { capTop: { dish: 0, steps: 1 } });
  // bottom of neck sits at z such that top meets hinge: top z = hingeZ; bottom z = hingeZ + L*sin(lean)
  add('stand', neck, { pos: [0, neckBottomY, hingeZ + L * Math.sin(lean)], rot: [-lean, 0, 0] });
  // cable clip ring on the neck
  const clip = new THREE.TorusGeometry(26, 3, 12, 40); clip.rotateX(Math.PI / 2);
  add('stand', clip, { pos: [0, neckBottomY + L * 0.45 * Math.cos(lean), hingeZ + L * Math.sin(lean) - L * 0.45 * Math.sin(lean)], rot: [-lean, 0, 0], scale: [1.55, 1, 0.55] });
  // lathed base profile (r, y): raised hub, gentle slope, thin flat rim with rounded edge
  const prof = [[0, 24], [30, 24], [40, 22.5], [50, 17], [66, 10.5], [90, 7.5], [112, 6.5], [120, 6], [124, 4.5], [125.5, 2], [125, 0.4], [122, 0], [0, 0]];
  const base = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 96);
  // oval footprint: deeper than wide? Real bases are wider than deep. scale z 0.72
  add('stand', base, { pos: [0, 0, hingeZ + L * Math.sin(lean) + 8], scale: [1.0, 1, 0.78] });
}

// =============================================================================
// KEYBOARD (TKL main block + F row). Case is a wedge; keys follow the slope.
// =============================================================================
const U = 19.05;
const KB_ROWS = [
  // [startX offsets in u, key widths in u]
  { y: 0, keys: [[0, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6.5, 1], [7.5, 1], [8.5, 1], [9.5, 1], [11, 1], [12, 1], [13, 1], [14, 1]], h: 9.5, gapAfter: 0.5 },
  { y: 1.5, keys: 'seq', widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], h: 10.6 },
  { y: 2.5, keys: 'seq', widths: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], h: 10.0 },
  { y: 3.5, keys: 'seq', widths: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], h: 9.2 },
  { y: 4.5, keys: 'seq', widths: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], h: 9.4 },
  { y: 5.5, keys: 'seq', widths: [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25], h: 10.2 },
];
const KB_UNITS_W = 15, KB_UNITS_D = 6.5;
const KB_MARGIN = 7, KB_W = KB_UNITS_W * U + 2 * KB_MARGIN, KB_D = KB_UNITS_D * U + 2 * KB_MARGIN;
const KB_FRONT_H = 9, KB_BACK_H = 21; // wedge
const kbSlope = Math.atan((KB_BACK_H - KB_FRONT_H) / KB_D);
const KB_POS = [0, 0, 265];

function keycap(wU, dU, h, { tilt = 0 } = {}) {
  const N = 40; const w = wU * U - 1.1, d = dU * U - 1.1; // 1.1 mm gap between caps
  const tw = w - 5.2, td = d - 5.0; // top face
  const rings = [roundedRect(w, d, 1.6, N), roundedRect(w - 0.3, d - 0.3, 1.5, N), roundedRect(tw + 1.0, td + 1.0, 2.2, N), roundedRect(tw, td, 2.0, N)];
  const g = loft(rings, [0, 0.6, h - 0.9, h], { capTop: { dish: 0.55, steps: 3 } });
  if (tilt) g.rotateX(tilt);
  return g;
}
{
  // Case: side profile (z = depth axis, y = height) extruded along X with bevelled ends
  const s = new THREE.Shape(); const hd = KB_D / 2, r = 3;
  s.moveTo(-hd + r, 0); s.lineTo(hd - r, 0); s.quadraticCurveTo(hd, 0, hd, r); // front-bottom (z=+hd is front)
  s.lineTo(hd, KB_FRONT_H - r); s.quadraticCurveTo(hd, KB_FRONT_H, hd - r, KB_FRONT_H);
  s.lineTo(-hd + r, KB_BACK_H); s.quadraticCurveTo(-hd, KB_BACK_H, -hd, KB_BACK_H - r);
  s.lineTo(-hd, r); s.quadraticCurveTo(-hd, 0, -hd + r, 0);
  const caseG = new THREE.ExtrudeGeometry(s, { depth: KB_W - 6, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 5, curveSegments: 6 });
  // Extrude: shape in XY, extruded along +Z. Map: shape.x -> world z, shape.y -> world y, extrude z -> world x.
  caseG.rotateY(Math.PI / 2); // now extrude axis is +X... shape.x -> -z? verify by bbox below
  caseG.computeBoundingBox(); const bb = caseG.boundingBox;
  caseG.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  // after rotateY(+90deg): (x,y,z) -> (z, y, -x); so shape.x (depth) -> -world z; i.e. front (shape +x) -> -z. Flip to make front +z.
  caseG.scale(1, 1, -1);
  add('keyboard', caseG, { pos: KB_POS });
  // top plate recess rim: a slightly inset raised plate under keys (visible between keys)
  const plateY = (z) => KB_FRONT_H + (KB_D / 2 - z) / KB_D * (KB_BACK_H - KB_FRONT_H);
  const plate = new THREE.BoxGeometry(KB_UNITS_W * U + 3, 1.6, KB_UNITS_D * U + 3);
  add('keyboard', plate, { pos: [KB_POS[0], KB_POS[1] + plateY(0) - 0.6, KB_POS[2]], rot: [kbSlope, 0, 0] });
  // keys
  const zBack = KB_D / 2 - KB_MARGIN; // far edge of key area (local z of top row's back edge)
  for (const row of KB_ROWS) {
    const list = [];
    if (row.keys === 'seq') { let x = 0; for (const w of row.widths) { list.push([x, w]); x += w; } } else list.push(...row.keys);
    for (const [xu, wu] of list) {
      const cxU = xu + wu / 2 - KB_UNITS_W / 2; const czU = row.y + 0.5; // centre, in units from the back edge
      const localZ = zBack - czU * U; const localX = cxU * U;
      const topY = plateY(localZ) + 0.2; // sit on the plate (plate is 1.6 thick centred at plateY-0.6)
      const g = keycap(wu, 1, row.h);
      // keys rest on the sloped plate: rotate by slope around X about the plate surface
      add('keyboard', g, { pos: [KB_POS[0] + localX, KB_POS[1] + topY - Math.sin(kbSlope) * 0, KB_POS[2] + localZ], rot: [kbSlope, 0, 0] });
    }
  }
  // USB cable stub at the back centre-left
  const stub = new THREE.CylinderGeometry(2.5, 2.5, 14, 16); stub.rotateX(Math.PI / 2);
  add('keyboard', stub, { pos: [KB_POS[0] - 60, KB_POS[1] + 11, KB_POS[2] - KB_D / 2 - 6] });
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
  const mouseXf = { pos: [262, 0, 262], rot: [0, -14 * DEG, 0] };
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
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.55, metalness: 0 }));
  mesh.name = name; scene.add(mesh);
}
const exporter = new GLTFExporter();
const buf = await exporter.parseAsync(scene, { binary: true });
fs.writeFileSync(OUT, Buffer.from(buf));
console.log(JSON.stringify({ tris, bytes: fs.statSync(OUT).size, out: OUT }));
