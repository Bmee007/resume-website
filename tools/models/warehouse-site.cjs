// Site: diorama plinth, paving, curbs, landscape beds, car park, security gate, fence, light poles, container yard.
'use strict';
const D = require('./warehouse-dims.cjs');
const V = require('./warehouse-vehicles.cjs');
const { PLINTH: PL, COURT, YARD, Z1, OFF } = D;

const FENCE_X = -32.5, FENCE_Z = COURT.z1, GATE = { x0: -15, x1: 1 };

function plinth(k) {
  const { boxMM, frustum, withMat } = k;
  const b = PL.bevel, vert = PL.th - b;
  withMat('plinth', () => {
    boxMM(PL.x0, PL.x1, -vert, -0.05, PL.z0, PL.z1);                                     // vertical band
    frustum(PL.x0, PL.x1, PL.z0, PL.z1, -vert, -PL.th, b);                               // 45-degree under-chamfer
  });
  withMat('asphalt', () => boxMM(PL.x0 + 0.2, PL.x1 - 0.2, -0.05, 0, PL.z0 + 0.2, PL.z1 - 0.2)); // asphalt skin
  // 0.3 m perimeter curb with a drive opening at the gate
  withMat('concrete', () => {
    const w = 0.5, h = 0.3;
    boxMM(PL.x0, PL.x1, 0, h, PL.z0, PL.z0 + w); boxMM(PL.x0, PL.x0 + w, 0, h, PL.z0, PL.z1); boxMM(PL.x1 - w, PL.x1, 0, h, PL.z0, PL.z1);
    boxMM(PL.x0, GATE.x0, 0, h, PL.z1 - w, PL.z1); boxMM(GATE.x1, PL.x1, 0, h, PL.z1 - w, PL.z1);
  });
}

function paving(k) {
  const { boxMM, withMat, prismX } = k;
  withMat('asphalt', () => {
    boxMM(COURT.x0, COURT.x1, 0, 0.12, Z1, COURT.z1 - 0.5);                                // truck court slab
    boxMM(GATE.x0, GATE.x1, 0, 0.12, COURT.z1 - 0.5, PL.z1);                              // gate throat
  });
  withMat('concrete', () => {
    boxMM(-55, -30, 0, 0.18, Z1, Z1 + 5);                                                // office sidewalk
    boxMM(-46.4, -39.6, 0, 0.18, Z1 + 5, 22);                                            // entrance walk
    boxMM(COURT.x1, YARD.x0, 0, 0.12, 36, 48);                                            // court-to-yard connector
  });
  withMat('stripe', () => { for (let z = 17.2; z < 22; z += 0.9) boxMM(-46.4, -39.6, 0.18, 0.26, z, z + 0.45); }); // crosswalk bars
  // yard hardstand
  withMat('asphalt', () => boxMM(YARD.x0, YARD.x1, 0, 0.12, YARD.z0, YARD.z1));
}

function beds(k) {
  const { boxMM, withMat } = k;
  withMat('bed', () => {
    boxMM(PL.x0 + 0.5, -55, 0, 0.3, PL.z0 + 0.5, PL.z1 - 0.5);                           // west strip
    boxMM(-55, 46, 0, 0.3, PL.z0 + 0.5, -29);                                            // back strip
    boxMM(-55, -33, 0, 0.3, 43.5, PL.z1 - 0.5);                                          // car-park front strip
    boxMM(-46.4, -43.7, 0, 0.3, 30, 41);                                                 // car-park island
    boxMM(YARD.x1 + 0.2, PL.x1 - 0.5, 0, 0.3, PL.z0 + 0.5, PL.z1 - 0.5);                 // east verge
  });
  // island kerbs round the car-park island
  withMat('concrete', () => boxMM(-46.6, -43.5, 0.3, 0.4, 29.8, 41.2));
}

function trees(k) {
  let s = 1;
  const t = (x, z, h = 8, r = 2.9) => { s += 3; V.tree(k, x, z, h + ((s * 7) % 5) * 0.4, r + ((s * 3) % 4) * 0.12, s); };
  for (let z = -27; z < 52; z += 12) t(-56.6, z, 8.5, 2.6);
  for (let x = -46; x < 46; x += 15) t(x, -31.3, 8.5, 2.6);
  t(-45, 35.5, 7.5, 2.6);
  for (const x of [-51, -42, -35.5]) t(x, 48.5, 7, 2.5);
  for (const [x, z] of [[-53, 45], [-54, 14.5]]) t(x, z, 6.5, 2.2);
}

function carPark(k) {
  const { boxMM, withTransform, withMat } = k;
  const sx = -54.5, pitch = 2.7, n = 7;
  const rows = [[17, 22.5, 1], [30, 35.5, 0], [35.5, 41, 0]];
  withMat('stripe', () => {
    for (const [z0, z1, entrance] of rows) {
      for (let i = 0; i <= n; i++) {
        const x = sx + pitch * i;
        if (entrance && x > -47 && x < -40) continue;
        boxMM(x - 0.1, x + 0.1, 0.0, 0.12, z0, z1);
      }
      boxMM(sx, sx + pitch * n, 0, 0.12, z0 === 17 ? z0 : z1 - 0.2, z0 === 17 ? z0 + 0.2 : z1);   // head line
    }
  });
  withMat('concrete', () => {
    for (let i = 0; i < n; i++) boxMM(sx + pitch * i + 0.5, sx + pitch * i + 2.2, 0.0, 0.2, 17.4, 17.65); // wheel stops
  });
  const cars = [[1, 0, 'sedan', 1], [1, 1, 'suv', 1], [1, 5, 'sedan', 1], [1, 6, 'suv', 1], [2, 0, 'suv', -1], [2, 2, 'sedan', -1], [2, 4, 'sedan', -1], [2, 6, 'suv', -1], [3, 1, 'sedan', -1], [3, 5, 'suv', -1], [3, 6, 'sedan', -1]];
  let ci = 0;
  for (const [row, i, kind, dir] of cars) {
    const x = sx + pitch * (i + 0.5);
    if (row === 2 && i === 3) continue;
    const zc = row === 1 ? 19.8 : row === 2 ? 32.8 : 38.2;
    withTransform(k.T(x, 0, zc).multiply(new k.THREE.Matrix4().makeRotationY(dir > 0 ? 0 : Math.PI)), () => V.car(k, kind, 1 + ((ci++ * 5) % 6)));
  }
}

function lightPole(k, x, z, h = 13) {
  const { boxMM, cylY, withMat } = k;
  withMat('pole', () => {
    boxMM(x - 0.6, x + 0.6, 0, 0.9, z - 0.6, z + 0.6);
    cylY(0.2, x, 0.9, h, z, 10, 0.32);
    boxMM(x - 1.7, x + 1.7, h - 0.1, h + 0.25, z - 0.25, z + 0.25);
  });
  withMat('glass', () => { for (const s of [-1, 1]) boxMM(x + s * 1.35 - 0.7, x + s * 1.35 + 0.7, h - 0.55, h - 0.1, z - 0.35, z + 0.35); });
}

function lights(k) {
  for (const [x, z] of [[-27, 47], [-3.8, 38], [33, 38], [43, 47], [-48, 25.7], [-36, 43], [-37, 14.5], [53.2, 4], [53.2, 38], [53.2, -24], [20, -29.5]]) lightPole(k, x, z);
}

function fenceRun(k, x0, z0, x1, z1) {
  const { boxMM, cylY, rod, withMat } = k;
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(len / 3));
  withMat('fence', () => {
    for (let i = 0; i <= n; i++) { const t = i / n; cylY(0.1, x0 + (x1 - x0) * t, 0, 2.5, z0 + (z1 - z0) * t, 6); }
    for (const y of [2.3, 1.2, 0.2]) {
      if (Math.abs(z1 - z0) < 1e-6) boxMM(Math.min(x0, x1), Math.max(x0, x1), y, y + 0.1, z0 - 0.05, z0 + 0.05);
      else boxMM(x0 - 0.05, x0 + 0.05, y, y + 0.1, Math.min(z0, z1), Math.max(z0, z1));
    }
    // diagonal braces every second bay so the fence reads as mesh rather than a rail
    for (let i = 0; i < n; i += 2) {
      const a = [x0 + (x1 - x0) * (i / n), 0.3, z0 + (z1 - z0) * (i / n)], b = [x0 + (x1 - x0) * ((i + 1) / n), 2.3, z0 + (z1 - z0) * ((i + 1) / n)];
      rod(0.035, a, b, 4);
    }
  });
}

function security(k) {
  const { boxMM, cylY, withMat } = k;
  fenceRun(k, FENCE_X, 14, FENCE_X, FENCE_Z);
  fenceRun(k, FENCE_X, FENCE_Z, GATE.x0, FENCE_Z);
  fenceRun(k, GATE.x1, FENCE_Z, YARD.x1 + 0.5, FENCE_Z);
  fenceRun(k, YARD.x1 + 0.5, FENCE_Z, YARD.x1 + 0.5, YARD.z0);
  fenceRun(k, YARD.x0 - 1.0, YARD.z0, YARD.x1 + 0.5, YARD.z0);
  fenceRun(k, YARD.x0 - 1.0, YARD.z0, YARD.x0 - 1.0, 41);
  fenceRun(k, YARD.x0 - 1.0, 46.5, YARD.x0 - 1.0, YARD.z1);
  fenceRun(k, YARD.x0 - 1.0, YARD.z1, YARD.x1 + 0.5, YARD.z1);
  // gate piers + guard booth on a median island, boom barriers across both lanes
  withMat('concrete', () => {
    boxMM(-8.9, -6.1, 0, 0.3, FENCE_Z - 9, FENCE_Z + 2);                                              // median island
    boxMM(GATE.x0 - 0.5, GATE.x0 + 0.5, 0, 3.2, FENCE_Z - 0.5, FENCE_Z + 0.5); boxMM(GATE.x1 - 0.5, GATE.x1 + 0.5, 0, 3.2, FENCE_Z - 0.5, FENCE_Z + 0.5);
  });
  const bx = -7.5, bz = FENCE_Z - 3.9, az = FENCE_Z - 3.5;
  withMat('wall', () => {
    boxMM(bx - 1.6, bx + 1.6, 0.3, 1.2, bz - 1.6, bz + 1.6);                            // sill wall
    boxMM(bx - 1.7, bx + 1.7, 3.0, 3.3, bz - 2.0, bz + 2.0);                            // roof with overhang
    boxMM(bx - 1.4, bx + 1.4, 3.3, 3.7, bz - 1.4, bz + 1.4);
    for (const [x0, x1, z0, z1] of [[bx - 1.6, bx - 1.4, bz - 1.6, bz + 1.6], [bx + 1.4, bx + 1.6, bz - 1.6, bz + 1.6], [bx - 1.6, bx + 1.6, bz - 1.6, bz - 1.4], [bx - 1.6, bx + 1.6, bz + 1.4, bz + 1.6]]) boxMM(x0, x1, 1.2, 3.0, z0, z1);
  });
  withMat('glass', () => boxMM(bx - 1.4, bx + 1.4, 1.2, 3.0, bz - 1.4, bz + 1.4));      // glazing
  withMat('pole', () => { for (const [px, pz] of [[GATE.x0 + 0.7, az], [GATE.x1 - 0.7, az]]) { boxMM(px - 0.3, px + 0.3, 0, 1.2, pz - 0.3, pz + 0.3); } });
  withMat('stripe', () => {
    for (const [px, dir] of [[GATE.x0 + 0.7, 1], [GATE.x1 - 0.7, -1]]) {
      const len = 6.2, ax0 = Math.min(px, px + dir * len), ax1 = Math.max(px, px + dir * len);
      boxMM(ax0, ax1, 1.0, 1.25, az - 0.15, az + 0.15);                                            // boom arm
    }
  });
  withMat('pole', () => {
    for (const [px, dir] of [[GATE.x0 + 0.7, 1], [GATE.x1 - 0.7, -1]]) {
      for (let i = 0; i < 5; i++) { const a = px + dir * (0.9 + i * 1.2); boxMM(Math.min(a, a + dir * 0.6), Math.max(a, a + dir * 0.6), 1.25, 1.4, az - 0.18, az + 0.18); } // stripe blocks
    }
  });
  withMat('pole', () => { cylY(0.2, -3.7, 0, 1.15, az, 8); cylY(0.2, -11.3, 0, 1.15, az, 8); }); // arm rests
}

function yard(k) {
  const { withTransform, T, boxMM, withMat } = k;
  const cols = [48.9, 51.75, 54.6, 57.45];
  const heights = [[3, 2, 1, 3], [2, 3, 3, 1], [1, 2, 0, 3], [3, 0, 1, 2], [2, 1, 3, 0], [1, 2, 2, 1]];
  heights.forEach((row, j) => row.forEach((n, i) => {
    for (let lv = 0; lv < n; lv++) withTransform(T(cols[i], 0.12 + lv * 2.59, 4.0 + j * 6.5), () => V.container(k, { tone: 1 + ((i * 2 + j * 3 + lv) % 3) }));
  }));
  // pallet yard: rows of wrapped loads, stacked two high, on the north half
  for (let r = 0; r < 12; r++) for (let c = 0; c < 5; c++) {
    if ((r * 5 + c) % 7 === 3) continue;
    withTransform(T(YARD.x0 + 1.3 + c * 2.2, 0.12, -30.5 + r * 2.3), () => V.pallets(k, 1 + ((r + c) % 2)));
  }
}

function site(k) {
  plinth(k); paving(k); beds(k); trees(k); carPark(k); lights(k); security(k); yard(k);
}

module.exports = { site };
