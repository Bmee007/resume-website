// Tractor details: West-coast mirrors, grab rails, step boxes, fuel tanks, exhaust stacks, air lines.
import {
  THREE, orient, V3, T, RX, RY, RZ, mul, D2R, add, box, rbox, cylX, cylY, cylZ, sphere, tube, creased, shapeFrom, rrect, roundPoly,
  bothSides, parts, mirrorOnly, setMat,
} from './truck-lib.mjs';
import { onSkin, xSkin } from './truck-cab.mjs';

const lathe = (prof, seg = 32, a0 = 0, a1 = Math.PI * 2) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg, a0, a1);
const tubeG = (pts, r, seg = 24, rad = 8, closed = false, tension = 0.5) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V3(...p)), closed, 'catmullrom', tension), seg, r, rad, closed);
// Flat band around the Y axis (ring of thickness t, height h) centred at (x,y,z)
const bandY = (rOut, rIn, h, x, y, z, seg = 16) => {
  const sh = new THREE.Shape(); sh.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, rIn, 0, Math.PI * 2, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: seg });
  return add(g, mul(T(x, y - h / 2, z), RX(Math.PI / 2), T(0, 0, -h)));
};
const bandZ = (rOut, rIn, h, x, y, z, seg = 24) => {
  const sh = new THREE.Shape(); sh.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, rIn, 0, Math.PI * 2, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: seg });
  return add(g, T(x, y, z - h / 2));
};

// ---------- mirror head: rolled-edge frame, recessed glass, shell back (face looks toward -Z) ----------
function mirrorHead(w, h, depth, x, y, zFace, rad = 0.045) {
  const outer = rrect(0, -h / 2, h / 2, w, rad, rad, 3);
  const inner = rrect(0, -h / 2 + 0.018, h / 2 - 0.018, w - 0.036, rad - 0.012, rad - 0.012, 3);
  setMat('chrome');
  const frame = new THREE.ExtrudeGeometry(shapeFrom(outer, [inner]), { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
  add(frame, T(x, y, zFace));
  const glass = new THREE.ExtrudeGeometry(shapeFrom(rrect(0, -h / 2 + 0.012, h / 2 - 0.012, w - 0.024, rad - 0.01, rad - 0.01, 3)), { depth: 0.018, bevelEnabled: false, curveSegments: 6 });
  setMat('glass'); add(glass, T(x, y, zFace + depth * 0.45)); setMat('chrome');
  const back = new THREE.ExtrudeGeometry(shapeFrom(rrect(0, -h / 2 * 0.94, h / 2 * 0.94, w * 0.9, rad * 0.9, rad * 0.9, 3)), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
  add(back, T(x, y, zFace + depth + 0.012));
}
// West-coast mirror (left frame): two tubular loops from the door pillar out to a vertical post carrying the head.
function westCoastMirror() {
  setMat('chrome');
  const r = 0.0085; // ~17 mm tube
  const xm = 1.17, reach = 0.46;
  const loop = (y, zf, dz, dy) => {
    const x1 = xm + reach;
    const pts = [[xm, y, zf], [xm + 0.18, y + dy * 0.4, zf - 0.005], [x1 - 0.06, y + dy, zf - 0.02], [x1, y + dy, zf - 0.06], [x1 - 0.05, y + dy, zf - 0.105],
      [xm + 0.2, y + dy * 0.5, zf - dz + 0.015], [xm, y, zf - dz]];
    add(tubeG(pts, r, 20, 6, false, 0.35));
  };
  loop(1.98, 3.21, 0.11, 0.0); loop(2.5, 3.05, 0.12, 0.0);
  // diagonal brace from the lower pad up to the upper loop outer end
  add(tubeG([[xm, 2.0, 3.12], [xm + 0.3, 2.2, 3.1], [xm + reach - 0.01, 2.46, 3.0]], r * 0.9, 8, 6));
  // vertical post (leans back with the A-pillar) + head
  const post = [[xm + reach, 1.74, 3.16], [xm + reach, 2.0, 3.12], [xm + reach, 2.5, 3.0], [xm + reach, 2.72, 2.97]];
  add(tubeG(post, 0.011, 8, 6));
  const hy = 2.26, hz = 3.06;
  mirrorHead(0.2, 0.66, 0.05, xm + reach + 0.095, hy, hz - 0.05);
  for (const y of [hy + 0.2, hy - 0.2]) add(tubeG([[xm + reach, y, 3.06], [xm + reach + 0.05, y, 3.02], [xm + reach + 0.1, y, 3.03]], 0.008, 6, 5));
  // convex spot mirror below
  add(tubeG([[xm + reach, 1.9, 3.14], [xm + reach + 0.1, 1.84, 3.12], [xm + reach + 0.17, 1.82, 3.09]], 0.008, 6, 5));
  mirrorHead(0.17, 0.2, 0.045, xm + reach + 0.22, 1.78, 3.06, 0.06);
  // mount pads
  rbox(0.03, 0.12, 0.1, 0.01, xm - 0.005, 1.98, 3.16); rbox(0.03, 0.12, 0.1, 0.01, xm - 0.02, 2.5, 3.0);
}
// Hood / fender mirror: stalk loop + small convex head
function hoodMirror() {
  setMat('chrome');
  add(tubeG([[1.02, 1.55, 4.94], [1.06, 1.85, 4.94], [1.1, 2.02, 4.96], [1.16, 2.08, 4.99]], 0.01, 10, 6));
  add(tubeG([[1.02, 1.55, 4.94], [1.06, 1.5, 4.88], [1.12, 1.92, 4.9]], 0.007, 6, 5));
  mirrorHead(0.14, 0.24, 0.04, 1.2, 2.2, 4.93, 0.05);
  rbox(0.1, 0.03, 0.12, 0.012, 1.02, 1.545, 4.94);
}

// ---------- grab rails: bent tube standing off the skin on flange plates ----------
function grabRail(z, y0, len, stand = 0.055, r = 0.014) {
  setMat('chrome');
  const m = onSkin(y0, z, 0);
  const b = 0.05;
  const path = [[0.0, 0, 0], [stand * 0.7, 0.0, 0], [stand, b, 0], [stand, len - b, 0], [stand * 0.7, len, 0], [0.0, len, 0]];
  add(tubeG(path, r, 18, 7, false, 0.2), m);
  for (const y of [0.0, len]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 14), mul(m, T(0.002, y, 0), RZ(Math.PI / 2)));
  for (const y of [len * 0.3, len * 0.7]) add(new THREE.BoxGeometry(0.014, 0.05, 0.03), mul(m, T(stand * 0.55 - 0.02, y, 0)));
}

// ---------- step box (cab entry) ----------
function stepBox(zc) {
  setMat('alu');
  const L = 0.64, x = 1.0;
  // outer faceplate with two tread openings
  const zs = (z) => -(z - zc); // shape X = -(z - zc)
  const face = shapeFrom(rrect(0, 0.45, 1.1, L, 0.03, 0.04, 4).map(([a, y]) => [a, y]), [
    rrect(0, 0.52, 0.64, L - 0.12, 0.02, 0.02, 3), rrect(0, 0.84, 0.96, L - 0.12, 0.02, 0.02, 3)]);
  add(new THREE.ExtrudeGeometry(face, { depth: 0.03, bevelEnabled: false, curveSegments: 4 }), mul(T(1.19, 0, zc), RY(Math.PI / 2)));
  box(0.03, 0.65, L - 0.04, 0.84, 0.77, zc); // inner wall
  box(0.4, 0.65, 0.03, x, 0.77, zc + L / 2 - 0.02); box(0.4, 0.65, 0.03, x, 0.77, zc - L / 2 + 0.02); // end walls
  for (const y of [0.58, 0.9]) {
    rbox(0.4, 0.035, L - 0.1, 0.01, x, y - 0.012, zc);
    for (let i = -2; i <= 2; i++) box(0.36, 0.01, 0.028, x, y + 0.012, zc + i * 0.1); // grip ribs
  }
  box(0.4, 0.04, L - 0.04, x, 0.47, zc); // bottom plate
  setMat('dark'); for (const dz of [-0.2, 0.2]) box(0.4, 0.05, 0.07, 0.65, 1.0, zc + dz); // hanger arms to frame
}

// ---------- fuel tank (left frame) ----------
function fuelTank(zc = 1.95, x = 0.88, y = 0.72) {
  const R = 0.31, hl = 0.74;
  const prof = [[0, -hl - 0.05], [0.14, -hl - 0.047], [0.24, -hl - 0.03], [0.29, -hl - 0.012], [R, -hl + 0.02], [R, hl - 0.02], [0.29, hl + 0.012], [0.24, hl + 0.03], [0.14, hl + 0.047], [0, hl + 0.05]];
  const g = creased(orient(lathe(prof, 40).rotateX(Math.PI / 2)), 40);
  setMat('alu'); add(g, T(x, y, zc));
  setMat('chrome');
  for (const dz of [-0.45, 0.45]) { // straps
    bandZ(R + 0.012, R - 0.002, 0.07, x, y, zc + dz);
    box(0.05, 0.05, 0.075, x + 0.1, y - R - 0.012, zc + dz); // buckle underneath-outboard
    box(0.03, 0.34, 0.05, x - 0.05, y + R + 0.15, zc + dz); // hanger to frame rail
    box(0.05, 0.03, 0.07, x, y + R + 0.02, zc + dz);
  }
  for (const dz of [-0.62, 0.62]) bandZ(R + 0.006, R - 0.002, 0.02, x, y, zc + dz); // baffle weld lines
  cylY(0.05, 0.04, x + 0.08, y + R + 0.01, zc + 0.5, 14); cylY(0.036, 0.03, x + 0.08, y + R + 0.04, zc + 0.5, 12); // filler neck + cap
  setMat('alu'); rbox(0.34, 0.025, 0.7, 0.008, x + 0.02, y + R + 0.005, zc - 0.1); // step plate
  for (let i = -3; i <= 3; i++) box(0.3, 0.01, 0.025, x + 0.02, y + R + 0.022, zc - 0.1 + i * 0.09);
}

// ---------- exhaust stack (left frame, behind the sleeper) ----------
function exhaustStack() {
  setMat('chrome');
  const x = 1.12, z = 0.76, rp = 0.065;
  // aftertreatment can (capsule) and pipe
  const can = lathe([[0, 1.28], [0.07, 1.285], [0.12, 1.3], [0.135, 1.34], [0.135, 2.35], [0.12, 2.39], [0.07, 2.405], [0, 2.41]], 28);
  add(creased(orient(can), 40), T(x, 0, z));
  // upper pipe with mitred tip
  const pipe = new THREE.CylinderGeometry(rp, rp, 1.7, 24, 1, true);
  const pa = pipe.attributes.position;
  for (let i = 0; i < pa.count; i++) if (pa.getY(i) > 0) pa.setY(i, pa.getY(i) - pa.getX(i) * 0.45);
  add(creased(pipe, 40), T(x, 3.25, z));
  // heat-shield half shell on the cab side (+Z), standing off the pipe
  const shield = lathe([[0.126, 1.75], [0.126, 3.05], [0.112, 3.05], [0.112, 1.75], [0.126, 1.75]], 18, -Math.PI / 2, Math.PI);
  add(creased(shield, 50), T(x, 0, z));
  for (const y of [1.85, 2.4, 2.95]) { bandY(0.134, 0.108, 0.035, x, y, z); } // shield straps
  // clamp band at the can/pipe joint, with lug and bolt
  bandY(0.148, 0.136, 0.05, x, 2.37, z);
  box(0.03, 0.06, 0.03, x + 0.155, 2.37, z); cylZ(0.01, 0.06, x + 0.155, 2.37, z, 8);
  bandY(0.075, 0.064, 0.04, x, 3.6, z); // tip clamp
  bandY(0.148, 0.136, 0.04, x, 1.38, z);
  // lower elbow + feed pipe to the frame
  const elbow = new THREE.TorusGeometry(0.15, 0.065, 12, 16, Math.PI / 2); add(elbow, mul(T(0.97, 1.3, z), RZ(-Math.PI / 2)));
  cylX(0.065, 0.5, 0.72, 1.15, z, 18);
  cylX(0.075, 0.03, 0.97, 1.15, z, 18);
  // brackets to the sleeper rear wall
  for (const y of [1.9, 2.9]) { rbox(0.14, 0.035, 0.34, 0.01, x, y, 0.95); bandY(0.125, 0.11, 0.03, x, y + 0.02, z); }
}

export function buildDetails() {
  const tri = () => parts.reduce((a, g) => a + g.attributes.position.count / 3, 0);
  for (const [n, f] of [['mirror', westCoastMirror], ['hoodMirror', hoodMirror], ['stack', exhaustStack], ['tank', fuelTank]]) { const a = tri(); bothSides(() => f()); if (process.env.TRUCK_DEBUG) console.log(n, tri() - a); }
  bothSides(() => {
    grabRail(2.245, 1.7, 1.0); grabRail(3.35, 1.62, 0.34, 0.05);
    stepBox(3.12);
    // fairing-to-sleeper side step plate / mud guard behind steer wheel
    setMat('rubber'); rbox(0.42, 0.5, 0.03, 0.01, 1.0, 0.65, 3.62);
  });
  // air / electrical lines (coiled pigtails) sleeper -> trailer
  setMat('rubber');
  for (const [x, c] of [[-0.24, 0], [0.0, 1], [0.24, 2]]) {
    const pts = [[x, 3.0, 0.99], [x, 3.0, 0.9]];
    const turns = 6, n = 60;
    for (let i = 0; i <= n; i++) { const a = (i / n) * turns * Math.PI * 2; pts.push([x + 0.06 * Math.cos(a), 3.05 + 0.06 * Math.sin(a), 0.85 - (0.7 * i) / n]); }
    pts.push([x, 3.35, 0.1], [x, 3.4, 0.05]);
    add(tubeG(pts, 0.014, 150, 4));
    setMat('dark'); cylZ(0.03, 0.05, x, 3.0, 1.0, 10); cylZ(0.03, 0.05, x, 3.4, 0.03, 10); setMat('rubber');
  }
  setMat('dark'); box(0.8, 0.14, 0.05, 0, 3.0, 1.005); box(0.8, 0.14, 0.05, 0, 3.4, 0.015);
}
