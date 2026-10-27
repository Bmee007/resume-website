// Roof plant: rooftop units in mixed sizes, skylight strips, the cold-chain chiller cluster, access hatch, drains.
'use strict';
const { roofY, X0, X1, Z0, Z1, OFF } = require('./warehouse-dims.cjs');

/** fan opening: shroud ring, spokes and a hub, standing >= 0.3 m proud */
function fan(k, x, y, z, r) {
  const { cylY, boxMM, withMat } = k;
  withMat('metal', () => {
    cylY(r, x, y, y + 0.35, z, 18);                       // shroud
    cylY(r * 0.82, x, y + 0.35, y + 0.4, z, 18);          // dished top
  });
  withMat('dark', () => {
    cylY(r * 0.74, x, y + 0.3, y + 0.46, z, 18);         // fan well
    for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
      const dx = Math.cos(a) * r * 0.74, dz = Math.sin(a) * r * 0.74;
      k.rod(0.045, [x - dx, y + 0.5, z - dz], [x + dx, y + 0.5, z + dz], 4);
    }
    cylY(r * 0.18, x, y + 0.44, y + 0.62, z, 10);
  });
}

/** packaged rooftop unit: curb, cabinet, lid, condenser fans, coil louvres, economiser hood, disconnect */
function rtu(k, x, z, w = 4.2, d = 2.6, h = 1.7, opts = {}) {
  const { boxMM, withMat, prismX } = k;
  const y = (opts.y ?? roofY(z)) - 0.3;
  withMat('metal', () => {
    boxMM(x - w / 2 + 0.3, x + w / 2 - 0.3, y, y + 0.65, z - d / 2 + 0.2, z + d / 2 - 0.2);   // curb
    boxMM(x - w / 2, x + w / 2, y + 0.65, y + 0.65 + h, z - d / 2, z + d / 2);                // cabinet
    boxMM(x - w / 2 - 0.08, x + w / 2 + 0.08, y + 0.65 + h, y + 0.65 + h + 0.22, z - d / 2 - 0.08, z + d / 2 + 0.08); // lid overhang
  });
  const top = y + 0.65 + h + 0.22;
  const nf = w > 5.5 ? 3 : 2;
  for (let i = 0; i < nf; i++) fan(k, x - w / 2 + ((i + 0.5) * w) / nf, top, z, Math.min(d * 0.34, w / nf * 0.38));
  withMat('dark', () => {
    for (let i = 0; i < 5; i++) boxMM(x + w / 2 + 0.0, x + w / 2 + 0.14, y + 0.9 + i * (h / 5.4), y + 0.9 + i * (h / 5.4) + 0.12, z - d * 0.4, z + d * 0.4); // louvres
    boxMM(x - w / 2 + 0.2, x - w / 2 + 1.0, y + 0.95, y + 1.65, z + d / 2, z + d / 2 + 0.06);
  });
  withMat('metal', () => {
    if (opts.hood !== false) {
      boxMM(x - w / 2 - 0.9, x - w / 2, y + 0.65 + h * 0.2, y + 0.65 + h * 0.85, z - d * 0.35, z + d * 0.35);         // economiser box
      prismX([[z - d * 0.35, y + 0.65 + h * 0.85], [z + d * 0.35, y + 0.65 + h * 0.85], [z, y + 0.65 + h * 1.1]], x - w / 2 - 0.9, x - w / 2); // roof hood
    }
    boxMM(x + w * 0.2, x + w * 0.2 + 0.5, y + 0.2, y + 1.3, z + d / 2, z + d / 2 + 0.35);                             // disconnect
  });
}

/** ridged skylight strip with curb and glazing bars */
function skylight(k, x, z, len = 16, wd = 2.4) {
  const { boxMM, prismX, withMat } = k;
  const y = roofY(z) - 0.2;
  withMat('metal', () => boxMM(x - len / 2, x + len / 2, y, y + 0.5, z - wd / 2, z + wd / 2));
  withMat('dark', () => {
    prismX([[z - wd / 2 + 0.1, y + 0.5], [z + wd / 2 - 0.1, y + 0.5], [z, y + 1.3]], x - len / 2 + 0.1, x + len / 2 - 0.1);
  });
  withMat('metal', () => {
    for (let xx = x - len / 2; xx <= x + len / 2 + 0.01; xx += len / 8) prismX([[z - wd / 2 + 0.05, y + 0.5], [z + wd / 2 - 0.05, y + 0.5], [z, y + 1.4]], xx - 0.07, xx + 0.07);
    boxMM(x - len / 2 + 0.1, x + len / 2 - 0.1, y + 1.2, y + 1.4, z - 0.07, z + 0.07);
  });
}

/** air-cooled chiller: frame, body, row of fan grilles, coil guards, control panel */
function chiller(k, x, z, y, len = 9.6, wd = 2.8) {
  const { boxMM, withMat } = k;
  withMat('metal', () => {
    boxMM(x - len / 2, x + len / 2, y, y + 2.5, z - wd / 2, z + wd / 2);
    boxMM(x - len / 2 - 0.1, x + len / 2 + 0.1, y + 2.5, y + 2.78, z - wd / 2 - 0.1, z + wd / 2 + 0.1);
  });
  const nf = 4;
  for (let i = 0; i < nf; i++) fan(k, x - len / 2 + ((i + 0.5) * len) / nf, y + 2.78, z, 0.98);
  withMat('dark', () => {
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) boxMM(x - len / 2 + 0.4, x + len / 2 - 0.4, y + 0.5 + i * 0.3, y + 0.5 + i * 0.3 + 0.14, z + s * (wd / 2), z + s * (wd / 2 + 0.14)); // coil louvres
  });
  withMat('metal', () => boxMM(x + len / 2, x + len / 2 + 0.55, y + 0.3, y + 2.0, z - 0.8, z + 0.8)); // control panel
}

function coldChain(k, cx, cz) {
  const { boxMM, withMat, rod, cylX, cylY } = k;
  const base = roofY(cz) - 0.2;
  const y = base + 1.3;
  // steel dunnage frame under both chillers
  withMat('metal', () => {
    boxMM(cx - 11.3, cx + 11.3, y - 0.3, y, cz - 1.8, cz + 1.8);
    for (const x of [-10.8, -5, 0, 5, 10.8]) for (const z of [-1.5, 1.5]) boxMM(cx + x - 0.2, cx + x + 0.2, base, y - 0.3, cz + z - 0.2, cz + z + 0.2);
  });
  chiller(k, cx - 5.3, cz, y);
  chiller(k, cx + 5.7, cz, y);
  // refrigerant lines to the building, service ladder + rail
  withMat('metal', () => {
    for (const dz of [-1.9, -2.5]) cylX(0.14, cx - 10.5, cx + 11, base + 0.5, cz + dz - 0.0, 8);
    for (const x of [cx - 8, cx, cx + 8]) boxMM(x - 0.15, x + 0.15, base, base + 0.5, cz - 2.65, cz - 1.75);
    for (const x of [-11.6, 11.6]) { rod(0.07, [cx + x, y, cz + 1.8], [cx + x, y + 1.1, cz + 1.8]); rod(0.07, [cx + x, y, cz - 1.8], [cx + x, y + 1.1, cz - 1.8]); }
    rod(0.07, [cx - 11.6, y + 1.1, cz + 1.8], [cx + 11.6, y + 1.1, cz + 1.8]);
    boxMM(cx - 12.5, cx - 11.3, base, y, cz - 0.5, cz + 0.5); // access stair block
  });
}

function hatch(k, x, z) {
  const { boxMM, prismX, withMat, rod } = k;
  const y = roofY(z) - 0.2;
  withMat('metal', () => {
    boxMM(x - 0.9, x + 0.9, y, y + 1.0, z - 0.7, z + 0.7);
    prismX([[z - 0.75, y + 1.0], [z + 0.75, y + 1.0], [z + 0.75, y + 1.18], [z - 0.75, y + 1.7]], x - 0.95, x + 0.95); // open lid on its hinge
    for (const [dx, dz] of [[-1.8, -1.4], [1.8, -1.4], [-1.8, 1.4], [1.8, 1.4]]) rod(0.07, [x + dx, y, z + dz], [x + dx, y + 1.1, z + dz], 5);
    for (const dz of [-1.4, 1.4]) rod(0.06, [x - 1.8, y + 1.1, z + dz], [x + 1.8, y + 1.1, z + dz], 5);
  });
}

function drains(k) {
  const { cylY, withMat } = k;
  for (const [x, z] of [[-40, 9], [-14, 9], [12, 9], [36, 9], [-40, -25], [-10, -25], [20, -25], [40, -25], [-46, -22], [-46, -6]]) {
    const y = roofY(z) - 0.05;
    withMat('dark', () => { cylY(0.65, x, y, y + 0.22, z, 14); });
    withMat('metal', () => { cylY(0.42, x, y + 0.22, y + 0.5, z, 12, 0.5); });
  }
}

function roofPlant(k) {
  // row A (back slope): varied RTUs
  const a = [[-44, 5.6, 3.3, 2.1], [-31, 9.0, 4.2, 2.6], [-16, 4.2, 2.8, 1.9], [-4, 6.8, 3.5, 2.2], [11, 9.6, 4.4, 2.7], [26, 4.4, 3.0, 2.0], [38, 6.4, 3.4, 2.2]];
  for (const [x, w, d, h] of a) rtu(k, x, -18, w, d, h);
  // row B (front slope): smaller units
  for (const [x, w, d, h] of [[-27, 4.2, 2.8, 1.8], [-14, 5.8, 3.0, 2.0], [-1, 3.8, 2.6, 1.7], [11, 6.4, 3.2, 2.1]]) rtu(k, x, 3, w, d, h);
  // skylight strips
  for (const x of [-38, -12, 14, 40]) skylight(k, x, -24.5);
  for (const x of [-38, -12, 14]) skylight(k, x, -11);
  for (const x of [-34, -6]) skylight(k, x, 8.0, 14, 2.0);
  coldChain(k, 30, 3);
  hatch(k, -22, -4);
  drains(k);
  // office wing roof: two small units + a lantern
  rtu(k, -47.5, 6.8, 2.8, 1.8, 1.2, { hood: false, y: OFF.h });
  rtu(k, -39.5, 5.0, 2.4, 1.6, 1.1, { hood: false, y: OFF.h });
}

module.exports = { roofPlant, rtu, fan };
