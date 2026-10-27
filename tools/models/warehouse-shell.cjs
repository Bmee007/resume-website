// Warehouse shell: tilt-wall envelope with pilasters, cornice, coping, low-slope roof deck with standing seams,
// and the dock face (doors, seals, bumpers, apron, canopy).
'use strict';
const D = require('./warehouse-dims.cjs');
const { X0, X1, Z0, Z1, P, FLOOR, DOOR_W, DOOR_H, DOOR_X, OFF, CAN, roofY, OPEN_DOORS, NO_SEAL } = D;

function envelope(k) {
  const { boxMM, wall, prismX, withMat } = k;
  const NX = OFF.x1;                                   // x of the notch side wall
  const front = DOOR_X.map((c) => ({ a0: c - DOOR_W / 2, a1: c + DOOR_W / 2, y0: FLOOR, y1: FLOOR + DOOR_H }));
  withMat('wall', () => {
    wall('x', NX, X1, 0, P, Z1 - 0.6, Z1, front);       // dock wall
    wall('x', X0, NX, OFF.h - 0.3, P, OFF.z0 - 0.6, OFF.z0); // warehouse face above the office
    wall('z', OFF.z0, Z1, 0, P, NX, NX + 0.6);          // notch side wall
    wall('x', X0, X1, 0, P, Z0, Z0 + 0.6);               // back wall
    wall('z', Z0, Z1, 0, P, X1 - 0.6, X1);               // east end
    wall('z', Z0, OFF.z0, 0, P, X0, X0 + 0.6);           // west end behind the office
    // base band + cornice band: strong horizontal shadow lines at eye level and under the parapet
    for (const [x0, x1, z0, z1] of [[X0 - 0.3, X1 + 0.3, Z0 - 0.3, Z0], [X1, X1 + 0.3, Z0, Z1 + 0.3], [NX, X1 + 0.3, Z1, Z1 + 0.3], [X0 - 0.3, X0, Z0, OFF.z0], [X0, NX, OFF.z0, OFF.z0 + 0.3], [NX - 0.3, NX, OFF.z0, Z1]]) boxMM(x0, x1, P - 2.2, P - 1.4, z0, z1);
    // pilasters: tilt-wall panel joints every 7 m (back, ends) and over every dock pier (front)
    for (let x = X0 + 7; x < X1 - 1; x += 7) boxMM(x - 0.55, x + 0.55, 0, P - 2.2, Z0 - 0.6, Z0);
    for (let z = Z0 + 7; z < Z1 - 1; z += 7) boxMM(X1, X1 + 0.6, 0, P - 2.2, z - 0.55, z + 0.55);
    for (let z = Z0 + 7; z < OFF.z0 - 1; z += 7) boxMM(X0 - 0.6, X0, 0, P - 2.2, z - 0.55, z + 0.55);
    for (let x = X0 + 4; x < NX - 1; x += 7) boxMM(x - 0.5, x + 0.5, OFF.h, P - 2.2, OFF.z0, OFF.z0 + 0.4);
    for (let i = 0; i <= DOOR_X.length; i++) {
      const x = i === 0 ? DOOR_X[0] - D.DOOR_PITCH / 2 : DOOR_X[i - 1] + D.DOOR_PITCH / 2;
      boxMM(x - 0.4, x + 0.4, CAN.y + 0.3, P - 2.2, Z1, Z1 + 0.55);
    }
    boxMM(NX, NX + 0.9, 0, P - 2.2, Z1, Z1 + 0.5); boxMM(X1 - 0.9, X1, 0, P - 2.2, Z1, Z1 + 0.5); // front corner pilasters
    // wall-pack lights above the canopy
    for (let i = 1; i < DOOR_X.length; i += 3) boxMM(DOOR_X[i] - 0.45, DOOR_X[i] + 0.45, 9.3, 9.9, Z1, Z1 + 0.6);
  });
  // painted base band: a darker concrete skirt grounds the pale tilt-wall panels
  withMat('concrete', () => {
    boxMM(X0 - 0.15, X1 + 0.15, 0, 1.0, Z0 - 0.15, Z0); boxMM(X1, X1 + 0.15, 0, 1.0, Z0, Z1);
    boxMM(NX, X1, 0, FLOOR - 0.35, Z1, Z1 + 0.15);
  });
  // roof deck: two-sided falls from a central ridge, hidden behind the parapet at the eaves
  withMat('roof', () => {
    const prof = (zf) => [[Z0 + 0.4, 11.0], [zf, 11.0], [zf, roofY(zf)], [D.RIDGE_Z, D.RIDGE], [Z0 + 0.4, roofY(Z0 + 0.4)]];
    prismX(prof(Z1 - 0.4), NX, X1 - 0.4);
    prismX(prof(OFF.z0 - 0.4), X0 + 0.4, NX + 0.1);
    // standing seams every 3 m, 0.2 m proud, following the fall
    const seam = (x, zf) => {
      const a = Z0 + 0.7, b = zf - 0.3, up = 0.22;
      prismX([[a, roofY(a) - 0.05], [D.RIDGE_Z, D.RIDGE - 0.05], [b, roofY(b) - 0.05], [b, roofY(b) + up], [D.RIDGE_Z, D.RIDGE + up], [a, roofY(a) + up]], x - 0.09, x + 0.09);
    };
    for (let x = NX + 3; x < X1 - 1; x += 3) seam(x, Z1);
    for (let x = X0 + 3; x < NX - 1; x += 3) seam(x, OFF.z0);
  });
  // coping: pale cap on every parapet run
  withMat('coping', () => {
    const c = (x0, x1, z0, z1) => boxMM(x0, x1, P, P + 0.3, z0, z1);
    c(NX - 0.3, X1 + 0.25, Z1 - 0.75, Z1 + 0.25);
    c(X0 - 0.25, X1 + 0.25, Z0 - 0.25, Z0 + 0.75);
    c(X1 - 0.75, X1 + 0.25, Z0 - 0.25, Z1 + 0.25);
    c(X0 - 0.25, X0 + 0.75, Z0 - 0.25, OFF.z0 + 0.25);
    c(X0 - 0.25, NX, OFF.z0 - 0.75, OFF.z0 + 0.25);
    c(NX - 0.3, NX + 0.75, OFF.z0, Z1);
  });
}

/** conductor head + downspout down the wall; (nx,nz) = outward normal; spout pokes through the parapet above it */
function downspout(k, x, z, nx, nz) {
  const { boxMM } = k;
  const ax = Math.abs(nz), az = Math.abs(nx);             // half-width runs along the wall
  const hx = x + nx * 0.3, hz = z + nz * 0.3;
  k.withMat('pipe', () => {
    boxMM(hx - 0.3 * ax - 0.3 * az, hx + 0.3 * ax + 0.3 * az, P - 2.0, P - 0.7, hz - 0.3 * az - 0.3 * ax, hz + 0.3 * az + 0.3 * ax); // head
    boxMM(hx - 0.22, hx + 0.22, 0.3, P - 2.0, hz - 0.22, hz + 0.22);                    // pipe
    boxMM(hx - 0.32, hx + 0.32, 0, 0.55, hz - 0.32, hz + 0.32);                         // boot
  });
}

function scuppers(k) {
  const xs = [-44, -22, 0, 22, 40];
  for (const x of xs) downspout(k, x, Z0, 0, -1);
  for (const z of [-21, -7]) { downspout(k, X1, z, 1, 0); downspout(k, X0, z, -1, 0); }
  downspout(k, X1, 7, 1, 0);
}

function dockFace(k) {
  const { boxMM, cylX, rod, prismX, withMat } = k;
  DOOR_X.forEach((c, i) => {
    const open = OPEN_DOORS.has(i);
    const hw = DOOR_W / 2;
    if (!open) {
      // roll-up door leaf, recessed 0.3 m, with 0.4 m slat pitch standing 0.12 m proud
      withMat('door', () => boxMM(c - hw, c + hw, FLOOR, FLOOR + DOOR_H, Z1 - 0.5, Z1 - 0.3));
      withMat('slat', () => {
        for (let y = FLOOR + 0.2; y < FLOOR + DOOR_H - 0.05; y += 0.4) boxMM(c - hw, c + hw, y, y + 0.2, Z1 - 0.3, Z1 - 0.15);
      });
      if (i % 2 === 0) withMat('glass', () => boxMM(c - hw + 0.4, c + hw - 0.4, FLOOR + DOOR_H - 1.0, FLOOR + DOOR_H - 0.4, Z1 - 0.18, Z1 - 0.1)); // vision panel
    } else {
      // open door: dark interior, rolled-up curtain drum above, pit leveller plate and lip
      withMat('seal', () => boxMM(c - hw, c + hw, FLOOR, FLOOR + DOOR_H, Z1 - 5.5, Z1 - 0.6));
      withMat('concrete', () => boxMM(c - hw, c + hw, FLOOR - 0.15, FLOOR + 0.02, Z1 - 5.5, Z1));
      withMat('slat', () => { cylX(0.28, c - hw, c + hw, FLOOR + DOOR_H - 0.2, Z1 - 0.9, 12); boxMM(c - hw - 0.15, c - hw, FLOOR, FLOOR + DOOR_H, Z1 - 0.9, Z1 - 0.2); boxMM(c + hw, c + hw + 0.15, FLOOR, FLOOR + DOOR_H, Z1 - 0.9, Z1 - 0.2); });
    }
    // jamb frame
    withMat('slat', () => { for (const s of [-1, 1]) boxMM(c + s * (hw + 0.12) - 0.12, c + s * (hw + 0.12) + 0.12, FLOOR, FLOOR + DOOR_H + 0.2, Z1, Z1 + 0.15); boxMM(c - hw - 0.2, c + hw + 0.2, FLOOR + DOOR_H, FLOOR + DOOR_H + 0.25, Z1, Z1 + 0.15); });
    // leveller lip on idle doors
    if (!open) withMat('slat', () => boxMM(c - 1.1, c + 1.1, FLOOR - 0.35, FLOOR - 0.05, Z1, Z1 + 0.8));
    // dock bumpers: two laminated pads under the sill
    withMat('seal', () => { for (const s of [-1, 1]) boxMM(c + s * 1.25 - 0.3, c + s * 1.25 + 0.3, 0.45, FLOOR - 0.1, Z1, Z1 + 0.32); });
    // dock seal / shelter: padded side and head pads, 0.6 m proud
    if (!NO_SEAL.has(i)) {
      withMat('seal', () => {
        for (const s of [-1, 1]) boxMM(c + s * 1.93 - 0.3, c + s * 1.93 + 0.3, FLOOR + 0.35, FLOOR + DOOR_H + 0.35, Z1, Z1 + 0.62);
        boxMM(c - 2.23, c + 2.23, FLOOR + DOOR_H + 0.1, FLOOR + DOOR_H + 0.75, Z1, Z1 + 0.62);
      });
      withMat('slat', () => {
        for (const s of [-1, 1]) boxMM(c + s * 1.93 - 0.1, c + s * 1.93 + 0.1, FLOOR + 0.35, FLOOR + DOOR_H + 0.75, Z1 + 0.62, Z1 + 0.72); // retainer strips
      });
    } else {
      withMat('slat', () => { boxMM(c + 2.05, c + 2.3, FLOOR + DOOR_H + 0.4, FLOOR + DOOR_H + 0.7, Z1, Z1 + 0.7); boxMM(c + 2.05, c + 2.4, FLOOR + DOOR_H + 0.7, FLOOR + DOOR_H + 1.0, Z1 + 0.5, Z1 + 0.9); }); // dock light arm
    }
  });
  // raised loading apron: concrete strip 0.3 m above the court with a sloped nose
  withMat('concrete', () => {
    boxMM(DOOR_X[0] - 3.4, DOOR_X[DOOR_X.length - 1] + 3.4, 0, 0.3, Z1, Z1 + 3.2);
    prismX([[Z1 + 3.2, 0], [Z1 + 3.2, 0.3], [Z1 + 4.4, 0]], DOOR_X[0] - 3.4, DOOR_X[DOOR_X.length - 1] + 3.4);
  });
  // bay divider stripes running out across the court (painted lines)
  withMat('stripe', () => {
    for (let i = 0; i <= DOOR_X.length; i++) {
      const x = i === 0 ? DOOR_X[0] - D.DOOR_PITCH / 2 : DOOR_X[i - 1] + D.DOOR_PITCH / 2;
      boxMM(x - 0.15, x + 0.15, 0.12, 0.3 + 0.0, Z1 + 4.4, Z1 + 22);
    }
  });
  // canopy: deck, deep fascia, joists on every pier, tie rods
  withMat('coping', () => {
    boxMM(CAN.x0, CAN.x1, CAN.y, CAN.y + 0.3, Z1, Z1 + CAN.d);
    boxMM(CAN.x0, CAN.x1, CAN.y - 0.6, CAN.y + 0.7, Z1 + CAN.d - 0.3, Z1 + CAN.d);
  });
  withMat('rtu', () => {
    for (let i = 0; i <= DOOR_X.length; i++) {
      const x = i === 0 ? DOOR_X[0] - D.DOOR_PITCH / 2 : DOOR_X[i - 1] + D.DOOR_PITCH / 2;
      boxMM(x - 0.15, x + 0.15, CAN.y - 0.45, CAN.y, Z1, Z1 + CAN.d - 0.3);
      if (i % 2 === 0) rod(0.09, [x, CAN.y + 3.2, Z1 + 0.1], [x, CAN.y + 0.7, Z1 + CAN.d - 0.15]);
    }
  });
}

module.exports = { envelope, scuppers, dockFace };
