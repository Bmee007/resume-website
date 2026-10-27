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



// ---- 5x7 dot-matrix font + raised-pixel relief builder (for the AS/400 5250 screen) ----------------------------
const FONT_SRC = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.', E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.###.', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#', I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
  J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....', Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
  3: '#####|...#.|..#..|...#.|....#|#...#|.###.', 4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '.': '.....|.....|.....|.....|.....|..##.|..##.', ',': '.....|.....|.....|.....|..##.|..##.|...#.', ':': '.....|..##.|..##.|.....|..##.|..##.|.....',
  '-': '.....|.....|.....|.###.|.....|.....|.....', '/': '....#|....#|...#.|..#..|.#...|#....|#....', '=': '.....|.....|#####|.....|#####|.....|.....',
  '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.', ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...', '>': '#....|.#...|..#..|...#.|..#..|.#...|#....',
  '_': '.....|.....|.....|.....|.....|.....|#####', ' ': '.....|.....|.....|.....|.....|.....|.....',
};
const FONT = Object.fromEntries(Object.entries(FONT_SRC).map(([k, v]) => [k, v.split('|')]));
const CELL_W = 6, CELL_H = 8;                   // 5x7 glyph + 1 blank column + 1 blank row

// Rasterise text rows into a boolean pixel grid (cols x rows of characters).
function rasterText(lines, cols, rows) {
  const W = cols * CELL_W, H = rows * CELL_H; const lit = new Uint8Array(W * H);
  lines.forEach((ln, r) => {
    if (r >= rows) return;
    for (let c = 0; c < Math.min(ln.length, cols); c++) {
      const g = FONT[ln[c]] || FONT[' '];
      for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (g[gy][gx] === '#') lit[(r * CELL_H + gy) * W + c * CELL_W + gx] = 1;
    }
  });
  return { lit, W, H };
}
// Extrude a pixel grid into raised blocks (top faces greedy-merged, side walls only where a neighbour is empty).
// ox/oy: world x of the grid's left edge and y of its top edge; z0 base, hgt height. Non-indexed positions.
function gridRelief(lit, W, H, px, py, ox, oy, z0, hgt) {
  const pos = []; const X = (i) => ox + i * px, Y = (j) => oy - j * py, z1 = z0 + hgt;
  const at = (i, j) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : lit[j * W + i]);
  const quad = (a, b, c, d, n) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) { const t = b; b = d; d = t; }
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  const seen = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (!at(i, j) || seen[j * W + i]) continue;
    let w = 1; while (i + w < W && at(i + w, j) && !seen[j * W + i + w]) w++;
    let h = 1; outer: while (j + h < H) { for (let k = 0; k < w; k++) if (!at(i + k, j + h) || seen[(j + h) * W + i + k]) break outer; h++; }
    for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) seen[(j + b) * W + i + a] = 1;
    quad([X(i), Y(j), z1], [X(i + w), Y(j), z1], [X(i + w), Y(j + h), z1], [X(i), Y(j + h), z1], [0, 0, 1]);
  }
  // horizontal walls (face up / down), merged along x
  for (let j = 0; j <= H; j++) for (const dir of [-1, 1]) {
    let i = 0;
    while (i < W) {
      const edge = (k) => (dir < 0 ? at(k, j) && !at(k, j - 1) : at(k, j - 1) && !at(k, j));
      if (!edge(i)) { i++; continue; }
      let e = i; while (e < W && edge(e)) e++;
      const y = Y(j); quad([X(i), y, z0], [X(e), y, z0], [X(e), y, z1], [X(i), y, z1], [0, dir < 0 ? 1 : -1, 0]); i = e;
    }
  }
  // vertical walls (face left / right), merged along y
  for (let i = 0; i <= W; i++) for (const dir of [-1, 1]) {
    let j = 0;
    while (j < H) {
      const edge = (k) => (dir < 0 ? at(i, k) && !at(i - 1, k) : at(i - 1, k) && !at(i, k));
      if (!edge(j)) { j++; continue; }
      let e = j; while (e < H && edge(e)) e++;
      const x = X(i); quad([x, Y(j), z0], [x, Y(e), z0], [x, Y(e), z1], [x, Y(j), z1], [dir < 0 ? -1 : 1, 0, 0]); j = e;
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
}


const parts = { monitor: [], screen: [], screentext: [], screencard: [], stand: [], keyboard: [], keycaps: [], fkeys: [], mouse: [], mousebtn: [], mousebase: [], wheel: [] };
// The site loader reduces each mesh's material colour to a grey (linear luminance, clamped 0.35-1) that drives the vertex
// colour, so per-mesh shades are the only way to separate surfaces there. Strategy: bright clay bezel/stand/keys, the
// dark glass (minimum shade) carrying bright raised text, a mid-grey "new UI" card, darker case / modifier keys / mouse base.
const SHADE = {
  monitor: 1.0, screen: 0.35, screentext: 1.0, screencard: 0.62, stand: 1.0, keyboard: 0.5, keycaps: 1.0, fkeys: 0.72,
  mouse: 0.82, mousebtn: 1.0, mousebase: 0.4, wheel: 0.42,
};
// Keyboard + mouse are scaled about the keyboard centre so the monitor stays the hero (set after layout).
const PERIPH = { scale: 0.9, parts: new Set(['keyboard', 'keycaps', 'fkeys', 'mouse', 'mousebtn', 'mousebase', 'wheel']), cz: 215 };
// add(part, geometry, transform, creaseDegrees): crease > 0 gives hard edges on flat/chamfered parts.
const add = (part, g, xf, crease = 0) => {
  g = xf ? place(g, xf) : g;
  if (PERIPH.parts.has(part)) { g.translate(0, 0, -PERIPH.cz); g.scale(PERIPH.scale, PERIPH.scale, PERIPH.scale); g.translate(0, 0, PERIPH.cz); }
  parts[part].push(finish(g, crease));
};
const CIRCLE = (r, n = 40) => Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI)]);

// =============================================================================
// LAYOUT (world, mm). Base centre z = 10; hinge axis behind the panel; keyboard in front.
// =============================================================================
const HUB_Z = 10, HINGE_Y = 288, HINGE_Z = -6, PLINTH_TOP = 10;

// =============================================================================
// MONITOR (~30" 16:9, thin bezel; the screen is the hero). Built in panel-local space: front glass plane at z = 0, panel
// centre at origin, then moved so the hinge barrel (local b) lands on the world hinge point, tilted back 4 deg about it.
// The glass is recessed and shows an AS/400 5250 green-screen main menu in raised block text, with a small modern
// "D365" card (grid of tiles) in the corner: old -> new.
// =============================================================================
const SCREEN_W = 670, SCREEN_H = 377, GAP = 1.0, BEZEL = 2.0, CHIN = 18, EDGE = 5;
const HOLE_W = SCREEN_W + 2 * GAP, HOLE_H = SCREEN_H + 2 * GAP;
const PANEL_W = HOLE_W + 2 * BEZEL, PANEL_H = HOLE_H + BEZEL + CHIN;
const HOLE_CY = (CHIN - BEZEL) / 2;            // screen centre sits above the panel centre
const GLASS_FRONT = -3.2;                      // glass recessed 3.2 mm behind the bezel face
const TEXT_H = 1.2;                            // raised character height
const BULGE_D = 40, BULGE_CY = -12;            // rear housing swell: depth behind the 5 mm edge, vertical centre
const PLATEAU_Z = -(EDGE + BULGE_D);
const BARREL_LOCAL = [0, BULGE_CY - 0, PLATEAU_Z - 13];
const monitor = [], screenParts = { screen: [], screentext: [], screencard: [] };
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
  const disc = new THREE.CylinderGeometry(5.2, 5.2, 3, 32); disc.rotateX(Math.PI / 2); disc.translate(0, logoY, -1.0 - 1.5); monitor.push([disc, 0]);
  const logoRing = new THREE.TorusGeometry(2.0, 0.35, 8, 28); logoRing.translate(0, logoY, -0.95); monitor.push([logoRing, 0]);

  // recessed glass (dark shade) with the 5250 screen in raised block text
  const glass = rbox(SCREEN_W, SCREEN_H, 8, 1.2, 3); glass.translate(0, HOLE_CY, GLASS_FRONT - 4); screenParts.screen.push([glass, 0]);
  const COLS = 80, ROWS = 24;
  const mx = 7, my = 6;                                      // margin inside the glass
  const TW = SCREEN_W - 2 * mx, TH = SCREEN_H - 2 * my;
  const px = TW / (COLS * CELL_W), py = TH / (ROWS * CELL_H);
  const ox = -TW / 2, oy = HOLE_CY + TH / 2;
  const cellW = CELL_W * px, cellH = CELL_H * py;
  const cx0 = (c) => ox + c * cellW, cy0 = (r) => oy - r * cellH; // char cell top-left
  const pad = (s, n) => s.padEnd(n, ' ').slice(0, n);
  const L = Array(ROWS).fill('');
  L[0] = pad(' MAIN                      AS/400 MAIN MENU                      SYSTEM: KOHLAS01', COLS);
  L[2] = ' SELECT ONE OF THE FOLLOWING:';
  L[4] = '     1. USER TASKS';
  L[5] = '     2. OFFICE TASKS';
  L[6] = '     3. GENERAL SYSTEM TASKS';
  L[7] = '     4. FILES, LIBRARIES, AND FOLDERS';
  L[8] = '     5. PROGRAMMING';
  L[9] = '     6. COMMUNICATIONS';
  L[10] = '     7. DEFINE OR CHANGE THE SYSTEM';
  L[11] = '     8. PROBLEM HANDLING';
  L[12] = '     9. DISPLAY A MENU';
  L[13] = '    10. INFORMATION ASSISTANT OPTIONS';
  L[14] = '    11. CLIENT ACCESS TASKS';
  L[16] = '    90. SIGN OFF';
  L[18] = ' SELECTION OR COMMAND';
  L[19] = ' ===> ';
  L[21] = ' F3=EXIT   F4=PROMPT   F9=RETRIEVE   F12=CANCEL   F13=INFORMATION ASSISTANT';
  L[22] = ' F23=SET INITIAL MENU';
  L[23] = ' (C) COPYRIGHT IBM CORP. 1980, 1999.';
  const HILITE_ROW = 8, HILITE_C0 = 4, HILITE_C1 = 24;     // highlighted menu row (wider raised bar)
  const barBox = (c0, c1, r, h, zBase, shadeList) => {
    const b = new THREE.BoxGeometry((c1 - c0) * cellW, cellH * 0.94, h); b.translate(cx0((c0 + c1) / 2), cy0(r + 0.5), zBase + h / 2); shadeList.push([b, 0]);
  };
  // text layers: normal text, then text sitting on top of reverse-video bars
  const bodyLines = L.map((s, r) => (r === 0 || r === HILITE_ROW ? '' : s));
  const t1 = rasterText(bodyLines, COLS, ROWS);
  screenParts.screentext.push([gridRelief(t1.lit, t1.W, t1.H, px, py, ox, oy, GLASS_FRONT, TEXT_H), 1]);
  // header bar (full width, raised) + its text lifted on top
  barBox(0, COLS, 0, TEXT_H, GLASS_FRONT, screenParts.screentext);
  const hdrOnly = L.map((s, r) => (r === 0 ? s : '')); const t2 = rasterText(hdrOnly, COLS, ROWS);
  screenParts.screentext.push([gridRelief(t2.lit, t2.W, t2.H, px, py, ox, oy, GLASS_FRONT + TEXT_H, 0.9), 1]);
  // highlighted menu row
  barBox(HILITE_C0, HILITE_C1, HILITE_ROW, TEXT_H, GLASS_FRONT, screenParts.screentext);
  const hiOnly = L.map((s, r) => (r === HILITE_ROW ? s : '')); const t3 = rasterText(hiOnly, COLS, ROWS);
  screenParts.screentext.push([gridRelief(t3.lit, t3.W, t3.H, px, py, ox, oy, GLASS_FRONT + TEXT_H, 0.9), 1]);
  // blinking-cursor block after "===> "
  { const b = new THREE.BoxGeometry(cellW * 0.85, cellH * 0.9, 2.4); b.translate(cx0(6.5), cy0(19.5), GLASS_FRONT + 1.2); screenParts.screentext.push([b, 0]); }
  // F-key footer separator rule
  { const b = new THREE.BoxGeometry(COLS * cellW - 2 * cellW, 1.2, 0.9); b.translate(0, cy0(20.5), GLASS_FRONT + 0.45); screenParts.screentext.push([b, 0]); }

  // modern "D365" card in the right-hand corner: mid-grey slab + bright tile grid
  {
    const CW = 236, CH = 168, ccx = SCREEN_W / 2 - 18 - CW / 2, ccy = HOLE_CY - SCREEN_H / 2 + 16 + CH / 2 + 24;
    const slab = rbox(CW, CH, 3.0, 1.4, 3); slab.translate(ccx, ccy, GLASS_FRONT + 1.5); screenParts.screencard.push([slab, 0]);
    const zc = GLASS_FRONT + 3.0; const R = (w, h, dz, x, y, r = 1.0) => { const b = rbox(w, h, dz, Math.min(r, dz / 2 - 0.01, w / 2 - 0.01), 2); b.translate(ccx + x, ccy + y, zc + dz / 2 - 0.05); screenParts.screentext.push([b, 0]); };
    R(CW - 12, 14, 1.6, 0, CH / 2 - 14, 1);                       // title bar
    for (let i = 0; i < 3; i++) R(5, 5, 1.2, -CW / 2 + 16 + i * 9, CH / 2 - 14, 2);   // window dots on the title bar (little squares)
    const navW = 40; for (let i = 0; i < 5; i++) R(navW - 10, 8, 1.2, -CW / 2 + 6 + navW / 2, CH / 2 - 34 - i * 17, 1);  // nav list
    const gx0 = -CW / 2 + navW + 14, gw = CW - navW - 26, cols = 3, rows = 3, gap = 7;
    const tw = (gw - gap * (cols - 1)) / cols, th = (CH - 46 - gap * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) R(tw, th, 2.4, gx0 + tw / 2 + c * (tw + gap), CH / 2 - 30 - th / 2 - r * (th + gap), 2);
  }

  // rear housing: swell from the 5 mm panel edge into a ~40 mm deep central plateau (about a third wide)
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
  pl(124, 22, 1.6, 4, 0, BULGE_CY + 33);                       // vent plate
  for (let i = -7; i <= 7; i++) { const g = new THREE.BoxGeometry(2.4, 15, 1.2); g.translate(i * 7.6, BULGE_CY + 33, PLATEAU_Z - 1.6 - 0.3); monitor.push([g, 0]); }
  pl(132, 18, 2.6, 5, 0, BULGE_CY - 44);                       // cable / port cover
  const pwr = new THREE.CylinderGeometry(3.2, 3.2, 3, 24); pwr.translate(PANEL_W / 2 - 40, -PANEL_H / 2 - 0.4, -EDGE / 2); monitor.push([pwr, 0]);
  const led = new THREE.CylinderGeometry(1.1, 1.1, 0.6, 12); led.rotateX(Math.PI / 2); led.translate(PANEL_W / 2 - 40, -PANEL_H / 2 + CHIN / 2 - 3, 0.0); monitor.push([led, 0]);
}
{
  const tilt = -4 * DEG;
  const [bx, by, bz] = BARREL_LOCAL;
  const put = (name, list) => { for (const [g, crease] of list) { g.translate(-bx, -by, -bz); add(name, g, { pos: [0, HINGE_Y, HINGE_Z], rot: [tilt, 0, 0] }, crease); } };
  put('monitor', monitor); for (const k of Object.keys(screenParts)) put(k, screenParts[k]);
}


// =============================================================================
// STAND: plinth foot + raised hub, neck with rear cable channel & clip, ring-hinged barrel boss
// =============================================================================
{
  // plinth 232 x 180, 3 mm chamfer top & bottom, floating on a slightly smaller pad
  const PW = 232, PD = 180, PR = 26; const ring = (w, d) => rrectS(w, d, PR - (PW - w) / 2, 8, 20, 14);
  const P = (w, d, y) => ({ w, d, y });
  const prof = [P(PW - 6, PD - 6, 1.2), P(PW, PD, 4.2), P(PW, PD, 7.0), P(PW - 6, PD - 6, PLINTH_TOP)];
  const plinth = loft(prof.map(({ w, d }) => ring(w, d)), prof.map((p) => p.y), { capTop: { dish: 0, steps: 1 }, capBottom: true });
  add('stand', plinth, { pos: [0, 0, HUB_Z] }, 28);
  const pad = loft([rrectS(PW - 26, PD - 36, 18, 8, 18, 12), rrectS(PW - 26, PD - 36, 18, 8, 18, 12)], [0, 1.4], { capBottom: true });
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
// KEYBOARD: slim aluminium-style low-profile board (Mac-style 15u layout with a short function row and inverted-T arrows).
// Case: chamfered rounded slab, 4.5 mm at the front rising to 11 mm at the back, on four low rubber feet (darker shade).
// Keys: dished low-profile caps, 1 mm gaps, staggered rows. Function row + modifier keys are a second (greyer) mesh so the
// Mac-style structure reads even at small size.
// =============================================================================
const U = 19.05, KEY_GAP = 1.0;
const KB_M = 6;                                   // case margin around the key field
const KB_W = 15 * U + 2 * KB_M, KB_F_ROW = 14.5, KB_D = KB_F_ROW + 5 * U + 2 * KB_M;
const KB_FRONT_T = 4.5, KB_BACK_T = 11, KB_FEET = 1.2;
const KB_POS = [0, 0, PERIPH.cz];
const kbHz = (z) => KB_FRONT_T + (KB_BACK_T - KB_FRONT_T) * ((KB_D / 2 - z) / KB_D); // case top height at local z
const kbSlope = Math.atan((KB_BACK_T - KB_FRONT_T) / KB_D);

function keycap(wMM, dMM, h) {
  const cs = 4, ex = Math.max(1, Math.round(wMM / 10)), ey = 1;
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
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = rbox(30, KB_FEET * 2, 12, 0.5, 2); add('keyboard', f, { pos: [sx * (KB_W / 2 - 34), 0, KB_POS[2] + sz * (KB_D / 2 - 14)] }); }

  const zBack = -KB_D / 2 + KB_M;                 // back edge of the key field (case-local z)
  const rowC = [zBack + KB_F_ROW / 2]; for (let r = 0; r < 5; r++) rowC.push(zBack + KB_F_ROW + U * r + U / 2);
  // [key widths, height, depth, isModifier(w != 1)]
  const rows = [
    { c: rowC[0], d: 11.2, h: 3.8, keys: [1.5, ...Array(12).fill(1), 1.5], fn: true },
    { c: rowC[1], d: U - KEY_GAP, h: 5.0, keys: [...Array(13).fill(1), 2] },
    { c: rowC[2], d: U - KEY_GAP, h: 5.0, keys: [1.5, ...Array(12).fill(1), 1.5] },
    { c: rowC[3], d: U - KEY_GAP, h: 5.0, keys: [1.75, ...Array(11).fill(1), 2.25] },
    { c: rowC[4], d: U - KEY_GAP, h: 5.0, keys: [2.25, ...Array(10).fill(1), 2.75] },
  ];
  const putKey = (xu, wu, zc, d, h, part) => {
    const w = wu * U - KEY_GAP; const x = (xu + wu / 2 - 7.5) * U;
    const xf = { pos: [KB_POS[0] + x, KB_POS[1] + KB_FEET + kbHz(zc) - 0.15, KB_POS[2] + zc], rot: [kbSlope, 0, 0] };
    add(part, keycap(w, d, h), xf);
    return xf;
  };
  rows.forEach((row, ri) => {
    let xu = 0;
    row.keys.forEach((wu, ki) => {
      const mod = row.fn || wu !== 1;
      const xf = putKey(xu, wu, row.c, row.d, row.h, mod ? 'fkeys' : 'keycaps');
      if (row.fn && ki === row.keys.length - 1) { // Touch ID ring on the top-right key
        const ring = new THREE.TorusGeometry(3.6, 0.45, 8, 28); ring.rotateX(Math.PI / 2); ring.translate(0, row.h - 0.3, 0); add('fkeys', ring, xf);
      }
      xu += wu;
    });
  });
  // bottom row: fn ctrl opt cmd [space] cmd opt, then arrow cluster (half-height up/down)
  const zb = rowC[5]; const bot = [1, 1, 1, 1.25, 5.5, 1.25, 1]; let xu = 0;
  bot.forEach((wu) => { putKey(xu, wu, zb, U - KEY_GAP, 5.0, wu === 5.5 ? 'keycaps' : 'fkeys'); xu += wu; });
  const half = (U - KEY_GAP) / 2 - 0.4;
  putKey(12, 1, zb, U - KEY_GAP, 5.0, 'fkeys'); putKey(14, 1, zb, U - KEY_GAP, 5.0, 'fkeys');
  putKey(13, 1, zb - U / 4, half, 5.0, 'fkeys'); putKey(13, 1, zb + U / 4, half, 5.0, 'fkeys');
}


// =============================================================================
// MOUSE: ergonomic wireless mouse. Shell (palm + split left/right buttons as separate shades) on an inset dark base with
// a shadow-line ledge, ridged scroll wheel in a recessed slot, two thumb buttons. Front (buttons) points to -Z, away from the user.
// =============================================================================
{
  const L = 118, NU = 140, NV = 52, LIFT = 1.8;
  const W = spline([[0, 0], [0.003, 7], [0.01, 13], [0.025, 19.5], [0.05, 24.5], [0.1, 28], [0.3, 30], [0.55, 33], [0.72, 32.5], [0.86, 28.5], [0.9, 26], [0.95, 21], [0.975, 15], [0.99, 9.5], [0.997, 5], [1, 0]]);
  const H = spline([[0, 0], [0.004, 7], [0.015, 13], [0.04, 17.5], [0.1, 21], [0.3, 28], [0.5, 36.5], [0.62, 39], [0.75, 36], [0.86, 28], [0.9, 22], [0.95, 14], [0.975, 9], [0.99, 5], [0.997, 2.5], [1, 0]]);
  const splitU = 0.47;
  const wheelU0 = 0.10, wheelU1 = 0.28, wheelHalfW = 5.6;
  const zOf = (u) => -L / 2 + u * L;
  const vertAt = (u, v) => {
    const w = W(u), h = H(u); const p = 2.6;
    const a = Math.abs(v); const y = h * Math.pow(Math.max(0, 1 - Math.pow(a, p)), 1 / p);
    const x = w * v; let yy = y;
    if (y > 2) {
      if (u < splitU) { yy -= 2.6 * Math.exp(-(x * x) / (2 * 0.9 * 0.9)); }                                   // left/right button split
      const du = (u - splitU) * L; yy -= 2.2 * Math.exp(-(du * du) / (2 * 0.9 * 0.9)) * Math.min(1, y / 6);   // button / palm seam
      if (u > wheelU0 && u < wheelU1 && Math.abs(x) < wheelHalfW) { const e = Math.min(1, (wheelU1 - u) * L / 2, (u - wheelU0) * L / 2, (wheelHalfW - Math.abs(x)) / 0.8); yy -= 7.5 * e; }
    }
    return [x, Math.max(0, yy) + LIFT, zOf(u)];
  };
  const pos = []; const idxBtn = []; const idxPalm = [];
  const uOf = (t) => t - 0.5 * Math.sin(2 * Math.PI * t) * 0.14;
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) pos.push(...vertAt(uOf(i / NU), -1 + (2 * j) / NV));
  for (let i = 0; i < NU; i++) {
    const list = uOf((i + 0.5) / NU) < splitU ? idxBtn : idxPalm;
    for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, c = a + (NV + 1), d = c + 1; list.push(a, c, b, b, c, d); }
  }
  const shellOf = (idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  // computeVertexNormals per half would split the seam normals; compute on the whole shell then copy to both halves
  const whole = shellOf([...idxBtn, ...idxPalm]); const nrm = whole.attributes.normal;
  const shellBtn = shellOf(idxBtn), shellPalm = shellOf(idxPalm); shellBtn.setAttribute('normal', nrm.clone()); shellPalm.setAttribute('normal', nrm.clone());
  // base: footprint inset 2.2 mm from the shell, LIFT tall, dark
  const half = []; for (let k = 0; k <= 40; k++) { const u = 0.03 + (0.985 - 0.03) * (k / 40); half.push([Math.max(1, W(u) - 2.4), L / 2 - u * L]); }
  const outline = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  const baseShape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const base = new THREE.ExtrudeGeometry(baseShape, { depth: LIFT + 0.2, bevelEnabled: false, curveSegments: 1 }); base.rotateX(-Math.PI / 2);
  // ridged scroll wheel (axis X) standing proud of the slot
  const uw = (wheelU0 + wheelU1) / 2; const zw = zOf(uw); const R = 10.5, WW = 7.8, K2 = 56;
  const wheel = new THREE.CylinderGeometry(R, R, WW, K2, 1); wheel.rotateZ(Math.PI / 2);
  { const p = wheel.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); const r = Math.hypot(y, z); if (r < R * 0.9) continue; const k = Math.round((Math.atan2(z, y) / (2 * Math.PI)) * K2); const f = k % 2 === 0 ? 1 : 0.93; p.setY(i, y * f); p.setZ(i, z * f); } }
  wheel.computeVertexNormals();
  const surf = H(uw) + LIFT - 1.8;                       // surface height at the wheel before the slot cut
  wheel.translate(0, surf + 1.8 - R, zw);
  // thumb buttons on the -X side
  const sb = (u, len) => { const g = rbox(3.6, 6.5, len, 1.7, 3); g.translate(-W(u) + 0.8, LIFT + H(u) * 0.42, zOf(u)); return g; };
  const mouseXf = { pos: [252, 0, 226], rot: [0, 8 * DEG, 0] };
  add('mouse', shellPalm, mouseXf); add('mousebtn', shellBtn, mouseXf);
  add('mousebase', base, mouseXf, 30); add('wheel', wheel, mouseXf);
  add('mousebtn', sb(0.33, 17), mouseXf); add('mousebtn', sb(0.44, 15), mouseXf);
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

