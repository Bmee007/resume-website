// 53' dry van trailer: shell with posts/ribs, aero skirts, rear doors with ribs, impact guard, mud flaps, lamps, gear, tandem.
import {
  THREE, V3, T, RX, RY, RZ, mul, add, box, rbox, cylX, cylY, cylZ, sphere, tube, creased, shapeFrom, rrect, plate,
  bothSides, setMat, TY, T1, T2, TRL, TRW, TRY0, TRY1,
} from './truck-lib.mjs';

const lens = (rx, ry, rz, x, y, z) => add(new THREE.SphereGeometry(1, 12, 8), mul(T(x, y, z), new THREE.Matrix4().makeScale(rx, ry, rz)));

function shell() {
  setMat('white');
  rbox(TRW, TRY1 - TRY0, TRL, 0.05, 0, (TRY0 + TRY1) / 2, -TRL / 2, 2);
  for (const s of [1, -1]) {
    for (let i = 0; i < 26; i++) { // side posts every 0.61 m, proud of the sheet
      box(0.034, 2.56, 0.075, s * 1.315, 2.72, -0.35 - i * 0.61);
      box(0.034, 0.05, 0.095, s * 1.315, 4.0, -0.35 - i * 0.61); // post head caps
    }
    box(0.04, 0.12, TRL, s * 1.318, 4.0, -TRL / 2); // top rail
    setMat('trim'); box(0.05, 0.22, TRL, s * 1.325, 1.36, -TRL / 2); // bottom rail
    box(0.02, 0.04, TRL - 0.4, s * 1.305, 2.35, -TRL / 2); // logistics-track line
    setMat('white');
  }
  box(TRW + 0.06, 0.12, 0.03, 0, 4.0, 0.015); // front top aero lip
  // front wall: vertical ribs
  for (let i = -8; i <= 8; i++) box(0.075, 2.62, 0.028, i * 0.15, 2.7, 0.012);
  box(TRW, 0.12, 0.05, 0, 3.98, 0.02); box(TRW, 0.14, 0.05, 0, 1.42, 0.02);
  // roof seams
  setMat('trim');
  for (let z = -0.8; z > -TRL + 0.5; z -= 1.22) box(TRW - 0.1, 0.014, 0.07, 0, 4.1, z);
  // dark underside pan + floor crossmembers
  setMat('dark'); box(TRW - 0.1, 0.05, TRL - 0.3, 0, TRY0 - 0.02, -TRL / 2);
  for (let z = -0.6; z > -TRL + 0.4; z -= 0.3) box(2.5, 0.1, 0.05, 0, 1.25, z);
}
function skirts() {
  setMat('trim');
  for (const s of [1, -1]) {
    const skirt = [[-4.3, 1.27], [-11.3, 1.27], [-11.3, 0.5], [-10.9, 0.42], [-5.0, 0.42], [-4.3, 0.75]];
    const sh = shapeFrom(skirt.map(([z, y]) => [-s * z, y]));
    add(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), mul(T(s * 1.27, 0, 0), RY((s * Math.PI) / 2)));
    for (const z of [-5.5, -7.5, -9.5]) box(0.08, 0.6, 0.06, s * 1.1, 0.85, z);
    for (const z of [-5.0, -6.5, -8.0, -9.5, -11.0]) box(0.02, 0.5, 0.05, s * 1.3, 0.85, z); // stiffener ribs
    box(0.04, 0.05, 6.9, s * 1.285, 0.46, -7.6); // lower stiffener fold
  }
}
function lamps() {
  setMat('lamp');
  for (const s of [1, -1]) {
    for (const z of [-0.9, -4.7, -8.5, -12.2, -15.5]) lens(0.012, 0.02, 0.04, s * 1.335, 1.64, z); // amber side markers
    for (const z of [-0.5, -15.7]) lens(0.012, 0.025, 0.05, s * 1.335, 3.93, z);
    for (const x of [1.2]) lens(0.025, 0.025, 0.012, s * x, 3.95, 0.04); // front clearance lamps
  }
  for (const x of [-0.15, 0, 0.15]) lens(0.04, 0.022, 0.014, x, 3.93, -TRL - 0.12); // rear ID lamps
  // ABS lamps: round amber lens in a housing, left rear corner and side
  cylZ(0.04, 0.03, 1.22, 1.62, -TRL - 0.14, 16); setMat('dark'); rbox(0.1, 0.1, 0.03, 0.01, 1.22, 1.62, -TRL - 0.115);
  setMat('lamp'); add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), mul(T(1.355, 1.1, -11.5), RZ(Math.PI / 2)));
  setMat('dark'); box(0.04, 0.1, 0.1, 1.33, 1.1, -11.5);
}
function rear() {
  const zr = -TRL;
  setMat('white');
  for (const s of [1, -1]) box(0.1, 2.82, 0.09, s * 1.25, 2.7, zr - 0.04);
  box(2.6, 0.12, 0.09, 0, 4.03, zr - 0.04);
  box(2.6, 0.17, 0.1, 0, 1.385, zr - 0.045);
  for (const s of [1, -1]) {
    box(1.17, 2.5, 0.03, s * 0.605, 2.72, zr - 0.06); // door
    for (let i = 0; i < 7; i++) box(0.05, 2.36, 0.018, s * (0.1 + i * 0.158), 2.72, zr - 0.083); // pressed ribs
    box(1.1, 0.07, 0.022, s * 0.605, 3.9, zr - 0.083); box(1.1, 0.07, 0.022, s * 0.605, 1.56, zr - 0.083);
    setMat('trim');
    for (const y of [1.72, 2.45, 3.18, 3.86]) { // hinges
      box(0.11, 0.26, 0.04, s * 1.26, y, zr - 0.1); cylY(0.02, 0.3, s * 1.32, y, zr - 0.105, 10);
      box(0.24, 0.07, 0.015, s * 1.08, y, zr - 0.08);
    }
    for (const x of [0.42, 0.88]) { // lock rods
      cylY(0.017, 2.45, s * x, 2.72, zr - 0.115, 10);
      for (const y of [1.5, 3.94]) box(0.09, 0.07, 0.07, s * x, y, zr - 0.1);
      for (const y of [2.1, 2.95]) box(0.08, 0.05, 0.05, s * x, y, zr - 0.095);
      box(0.035, 0.42, 0.035, s * (x + 0.04), 1.85, zr - 0.14); box(0.06, 0.05, 0.06, s * (x + 0.04), 2.04, zr - 0.115);
    }
    setMat('dark'); rbox(0.3, 0.12, 0.05, 0.02, s * 1.0, 1.385, zr - 0.1); // tail light clusters
    setMat('lamp'); lens(0.04, 0.04, 0.014, s * 1.0, 1.385, zr - 0.128); lens(0.03, 0.03, 0.014, s * 0.88, 1.385, zr - 0.128);
    setMat('white');
  }
  // rear impact guard: bar, vertical posts, diagonal braces, end caps, reflector tabs
  setMat('trim');
  rbox(2.4, 0.16, 0.1, 0.02, 0, 0.55, zr + 0.08);
  for (const s of [1, -1]) {
    box(0.1, 0.75, 0.08, s * 0.72, 0.92, zr + 0.2);
    tube([[s * 0.72, 0.6, zr + 0.16], [s * 1.12, 1.3, zr + 0.4]], 0.024, 2, 8);
    box(0.06, 0.06, 0.12, s * 1.12, 1.3, zr + 0.42);
    rbox(0.1, 0.2, 0.12, 0.02, s * 1.2, 0.55, zr + 0.08);
    box(0.012, 0.1, 0.07, s * 1.0, 0.43, zr + 0.08);
  }
  setMat('white'); box(0.3, 0.16, 0.02, 0, 0.75, zr + 0.02); // plate
  // mudflaps: rounded hanging flap, weighted lower edge, ribs, hanger bar and arms
  setMat('dark'); box(2.4, 0.06, 0.06, 0, 1.21, T2 - 0.85);
  setMat('rubber');
  for (const s of [1, -1]) {
    const fl = shapeFrom(rrect(0, 0.3, 1.18, 0.6, 0.01, 0.06, 5));
    add(new THREE.ExtrudeGeometry(fl, { depth: 0.022, bevelEnabled: false, curveSegments: 4 }), T(s * 0.92, 0, T2 - 0.86));
    box(0.6, 0.05, 0.04, s * 0.92, 0.34, T2 - 0.835); // weighted lip
    for (let i = -2; i <= 2; i++) box(0.018, 0.5, 0.012, s * 0.92 + i * 0.1, 0.75, T2 - 0.87);
    setMat('dark'); box(0.5, 0.06, 0.05, s * 0.92, 1.2, T2 - 0.85);
    for (const dx of [-0.2, 0.2]) box(0.04, 0.05, 0.42, s * 0.92 + dx, 1.19, T2 - 0.65);
    setMat('rubber');
  }
}
function gearAndSlider() {
  setMat('dark');
  for (const s of [1, -1]) {
    box(0.13, 0.72, 0.13, s * 0.95, 0.92, -3.4); box(0.1, 0.22, 0.1, s * 0.95, 0.5, -3.4); box(0.3, 0.07, 0.26, s * 0.95, 0.42, -3.4);
    box(0.12, 0.08, 0.5, s * 0.95, 1.28, -3.4);
  }
  cylX(0.025, 1.9, 0, 0.78, -3.4, 10);
  tube([[-0.95, 1.2, -3.4], [0.95, 0.68, -3.4]], 0.02, 2, 8); tube([[0.95, 1.2, -3.4], [-0.95, 0.68, -3.4]], 0.02, 2, 8);
  cylX(0.015, 0.45, -1.22, 0.98, -3.4, 8); cylZ(0.015, 0.2, -1.44, 0.98, -3.3, 8);
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
}
export function buildTrailer() { shell(); skirts(); lamps(); rear(); gearAndSlider(); }
