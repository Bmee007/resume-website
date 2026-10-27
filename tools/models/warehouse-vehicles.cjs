// Vehicles and loose site props: semi trailers, day-cab tractor, cars, shipping containers, pallet stacks, trees.
'use strict';

/** 53' dry van or reefer. Local: rear face at z=0, body runs +z, centred on x=0. */
function trailer(k, { reefer = false, gear = true } = {}) {
  const { boxMM, cylX, cylY, withMat } = k;
  const L = 16.1, W = 2.7, y0 = 1.3, y1 = 4.25;
  withMat('trailer', () => {
    boxMM(-W / 2, W / 2, y0, y1, 0.1, L);                                            // box
    boxMM(-W / 2 - 0.08, W / 2 + 0.08, y1 - 0.12, y1 + 0.06, 0, L);                  // roof rail
    boxMM(-W / 2 - 0.08, W / 2 + 0.08, y0, y0 + 0.16, 0, L);                         // bottom rail
    for (const s of [-1, 1]) for (let z = 0.6; z < L - 0.2; z += 1.45) boxMM(s > 0 ? W / 2 : -W / 2 - 0.12, s > 0 ? W / 2 + 0.12 : -W / 2, y0 + 0.16, y1 - 0.12, z, z + 0.14); // side posts
  });
  withMat('trailer', () => {
    // rear doors: two leaves, hinge columns, lock-rod ribs, handles
    boxMM(-W / 2 + 0.05, W / 2 - 0.05, y0 + 0.12, y1 - 0.18, -0.12, 0.1);
    for (const x of [-1.0, -0.55, 0.55, 1.0]) boxMM(x - 0.05, x + 0.05, y0 + 0.2, y1 - 0.25, -0.2, -0.1);
    boxMM(-0.04, 0.04, y0 + 0.12, y1 - 0.18, -0.2, -0.1);
  });
  withMat('under', () => {
    // bumper, slider bogie rails, landing gear, coupler plate, axles
    boxMM(-1.2, 1.2, 0.6, 0.9, -0.05, 0.3);                                          // ICC bumper
    for (const s of [-1, 1]) boxMM(s * 0.9 - 0.1, s * 0.9 + 0.1, 0.9, y0, -0.05, 0.2);
    // slider bogie rails + landing gear
    boxMM(-1.05, 1.05, 0.95, y0, 1.2, 4.9);
    if (gear) for (const s of [-1, 1]) { boxMM(s * 1.0 - 0.14, s * 1.0 + 0.14, 0.45, y0, 11.3, 11.6); boxMM(s * 1.0 - 0.35, s * 1.0 + 0.35, 0.25, 0.5, 11.1, 11.8); }
    if (gear) boxMM(-1.0, 1.0, 0.95, 1.1, 11.3, 11.6);
    boxMM(-1.15, 1.15, y0 - 0.16, y0, 13.2, L - 0.1);                                // upper coupler plate
    cylY(0.07, 0, y0 - 0.35, y0 - 0.16, 15.0, 8);
    for (const z of [2.2, 3.55]) cylX(0.1, -1.25, 1.25, 0.5, z, 8);                    // axles
  });
  withMat('tire', () => {
    for (const z of [2.2, 3.55]) for (const s of [-1, 1]) { cylX(0.52, s * 0.62 - 0.17, s * 0.62 + 0.17, 0.52, z, 14); cylX(0.52, s * 1.05 - 0.17, s * 1.05 + 0.17, 0.52, z, 14); }
  });
  withMat('trailer', () => {
    for (const s of [-1, 1]) boxMM(s * 1.34 - 0.04, s * 1.34 + 0.04, 0.55, y0, 5.4, 10.8);   // aero skirt
    for (const s of [-1, 1]) boxMM(s * 1.15 - 0.3, s * 1.15 + 0.3, 0.2, 0.95, 1.1, 1.2);       // mudflaps
  });
  if (reefer) {
    // fridge unit on the nose: housing, grille, evaporator vents
    withMat('rtu', () => boxMM(-1.2, 1.2, y1 - 2.2, y1 - 0.05, L, L + 0.7));
    withMat('glass', () => { for (let i = 0; i < 5; i++) boxMM(-0.9, 0.9, y1 - 1.9 + i * 0.28, y1 - 1.9 + i * 0.28 + 0.12, L + 0.7, L + 0.8); });
  }
}

/** day-cab tractor. Local: fifth wheel at origin, forward = +z. */
function tractor(k) {
  const { boxMM, cylX, cylY, cylZ, prismX, withMat } = k;
  withMat('under', () => {
    boxMM(-0.55, 0.55, 0.8, 1.05, -1.8, 5.0);                                        // frame rails
    boxMM(-1.0, 1.0, 1.05, 1.2, -0.6, 0.6);                                          // fifth wheel
    for (const s of [-1, 1]) boxMM(s * 1.25 - 0.3, s * 1.25 + 0.3, 1.0, 1.1, -1.7, 1.5); // rear fenders
  });
  withMat('rtu', () => {
    for (const s of [-1, 1]) cylZ(0.38, s * 1.0, 0.8, 1.4, 3.0, 12);                   // fuel tanks
    cylY(0.1, 1.15, 1.0, 4.4, 0.8, 8);                                              // exhaust stack
  });
  withMat('tractor', () => {
    boxMM(-1.25, 1.25, 1.1, 3.4, 0.9, 3.15);                                         // cab
    prismX([[0.9, 3.4], [0.9, 4.25], [3.15, 3.4]], -1.15, 1.15);                     // roof deflector
    boxMM(-1.0, 1.0, 1.1, 2.4, 3.15, 5.0);                                           // hood
    for (const s of [-1, 1]) boxMM(s * 1.15 - 0.22, s * 1.15 + 0.22, 1.1, 2.0, 3.15, 5.0); // front fenders
  });
  withMat('glass', () => {
    boxMM(-1.15, 1.15, 2.1, 3.3, 3.15, 3.25);                                        // windscreen
    for (const s of [-1, 1]) boxMM(s * 1.26 - 0.01, s * 1.26 + 0.05, 2.1, 3.2, 1.2, 2.6); // side glass
    boxMM(-1.0, 1.0, 1.4, 2.3, 5.0, 5.12);                                           // grille
  });
  withMat('tire', () => {
    for (const z of [-0.7, 0.7]) for (const s of [-1, 1]) { cylX(0.52, s * 0.8 - 0.17, s * 0.8 + 0.17, 0.52, z, 14); cylX(0.52, s * 1.15 - 0.17, s * 1.15 + 0.17, 0.52, z, 14); }
    for (const s of [-1, 1]) cylX(0.52, s * 1.1 - 0.17, s * 1.1 + 0.17, 0.52, 4.2, 14);
  });
  withMat('rtu', () => {
    boxMM(-1.3, 1.3, 0.55, 1.05, 5.0, 5.3);                                          // bumper
    for (const s of [-1, 1]) boxMM(s * 1.5 - 0.04, s * 1.5 + 0.04, 2.0, 3.1, 2.9, 3.0); // mirrors
  });
}

/** passenger car from a side-profile extrusion plus wheels. Local: centred, facing +z. */
function car(k, kind, tone = 1) {
  const { prismX, cylX, boxMM, withMat } = k;
  const sedan = [[-2.3, 0.35], [-2.3, 0.85], [-1.8, 1.0], [-0.9, 1.45], [0.5, 1.5], [1.2, 1.1], [2.2, 0.95], [2.3, 0.65], [2.3, 0.35]];
  const suv = [[-2.4, 0.4], [-2.4, 1.05], [-2.2, 1.65], [-1.9, 1.8], [0.9, 1.8], [1.5, 1.35], [2.4, 1.15], [2.45, 0.65], [2.45, 0.4]];
  const prof = kind === 'suv' ? suv : sedan; const w = kind === 'suv' ? 1.95 : 1.85;
  withMat('car' + tone, () => prismX(prof, -w / 2, w / 2));
  withMat('tire', () => {
    const r = kind === 'suv' ? 0.4 : 0.36;
    for (const z of [-1.45, 1.45]) for (const s of [-1, 1]) cylX(r, s * (w / 2 - 0.12) - 0.15, s * (w / 2 - 0.12) + 0.15, r, z, 10);
    boxMM(-w / 2 - 0.04, w / 2 + 0.04, 0.35, 0.55, -2.4, -2.1); boxMM(-w / 2 - 0.04, w / 2 + 0.04, 0.35, 0.55, 2.1, 2.4);
  });
}

/** ISO container, long axis z (local origin at the centre of its base) with corrugation ribs on both long sides */
function container(k, { len = 6.06, w = 2.44, h = 2.59, tone = 1 } = {}) {
  const { boxMM, withMat } = k;
  withMat('cont' + tone, () => {
    boxMM(-w / 2, w / 2, 0, h, -len / 2, len / 2);
    for (const s of [-1, 1]) for (let z = -len / 2 + 0.35; z < len / 2 - 0.3; z += 0.5) boxMM(s * w / 2 - (s < 0 ? 0.14 : 0), s * w / 2 + (s > 0 ? 0.14 : 0), 0.25, h - 0.25, z, z + 0.22);
    boxMM(-w / 2 - 0.05, w / 2 + 0.05, h - 0.18, h + 0.04, -len / 2, len / 2);       // top rail
  });
  withMat('cont' + tone, () => {
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) boxMM(sx * (w / 2) - 0.15, sx * (w / 2) + 0.15, 0, h, sz * (len / 2) - 0.15, sz * (len / 2) + 0.15); // corner posts
    for (const x of [-0.5, 0.5]) boxMM(x - 0.05, x + 0.05, 0.2, h - 0.2, len / 2, len / 2 + 0.1); // lock rods
  });
}

/** stack of wrapped pallet loads: deck, stringers, wrapped cube with stretch-film bands */
function pallets(k, levels = 2) {
  const { boxMM, withMat } = k;
  for (let i = 0; i < levels; i++) {
    const y = i * 1.45;
    withMat('pallet', () => {
      boxMM(-0.6, 0.6, y + 0.14, y + 0.28, -0.5, 0.5);
      for (const x of [-0.5, 0, 0.5]) boxMM(x - 0.09, x + 0.09, y, y + 0.14, -0.5, 0.5);
    });
    withMat('wrap', () => boxMM(-0.55, 0.55, y + 0.28, y + 1.4, -0.45, 0.45));
    withMat('band', () => { for (const yy of [0.5, 0.85, 1.2]) boxMM(-0.6, 0.6, y + yy, y + yy + 0.12, -0.5, 0.5); });
  }
}

/** crown of 3 overlapping jittered ellipsoids on a tapered trunk */
function tree(k, x, z, h = 7, r = 2.6, seed = 1) {
  const { cylY, blob, withMat } = k;
  withMat('trunk', () => cylY(0.4, x, 0, h * 0.5, z, 8, 0.24));
  withMat('canopy', () => {
    blob(x, h * 0.62, z, r, r * 0.8, r, seed, 0.16, 14);
    blob(x + r * 0.55, h * 0.55, z + r * 0.15, r * 0.72, r * 0.62, r * 0.7, seed + 2, 0.18, 12);
    blob(x - r * 0.4, h * 0.82, z - r * 0.3, r * 0.65, r * 0.58, r * 0.65, seed + 5, 0.18, 12);
  });
}

module.exports = { trailer, tractor, car, container, pallets, tree };
