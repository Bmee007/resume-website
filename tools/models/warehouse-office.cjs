// Office wing: two storeys tucked into the front-west notch. The upper floor cantilevers over a recessed glazed
// lobby; ribbon windows with sunshades, entrance canopy, roof plant.
'use strict';
const { OFF, Z1, FLOOR } = require('./warehouse-dims.cjs');

function office(k) {
  const { boxMM, cylY, withMat, wall, prismX } = k;
  const { x0, x1, z0, h, p, lobbyZ } = OFF;
  const SL = 4.8;                                        // upper slab level
  withMat('wall', () => {
    boxMM(x0, x1, 0, SL, z0, lobbyZ);                    // ground floor behind the lobby glass
    boxMM(x0, x0 + 2.2, 0, SL, lobbyZ, Z1); boxMM(x1 - 2.2, x1, 0, SL, lobbyZ, Z1); // flank piers
    boxMM(x0, x1, SL, h, z0, Z1 - 0.7);                  // upper storey mass
    wall('x', x0, x1, SL, h, Z1 - 0.7, Z1, [{ a0: x0 + 1.3, a1: x1 - 1.3, y0: 5.7, y1: 7.95 }]);
    boxMM(x0 - 0.1, x1 + 0.1, SL - 0.5, SL, Z1 - 0.1, Z1 + 0.3); // slab edge beam: deep shadow line over the lobby
    boxMM(x0, x1, h, p, Z1 - 0.5, Z1); boxMM(x0, x0 + 0.5, h, p, z0, Z1);                // parapet
    boxMM(x0 - 0.15, x1, 0, 0.9, z0, Z1 + 0.15);                                           // base band
  });
  withMat('glass', () => {
    boxMM(x0 + 1.3, x1 - 1.3, 5.7, 7.95, Z1 - 0.85, Z1 - 0.7);                              // upper glazing, set back
    boxMM(x0 + 2.2, x1 - 2.2, 0.3, 4.5, lobbyZ, lobbyZ + 0.1);                             // lobby curtain wall
  });
  withMat('rtu', () => {
    for (let x = x0 + 1.3; x <= x1 - 1.3 + 0.01; x += 1.7) boxMM(x - 0.1, x + 0.1, 5.7, 7.95, Z1 - 0.7, Z1 + 0.05); // mullions
    boxMM(x0 + 1.3, x1 - 1.3, 6.7, 6.95, Z1 - 0.7, Z1 + 0.05);                                   // transom
    boxMM(x0 + 1.1, x1 - 1.1, 8.05, 8.3, Z1, Z1 + 0.75);                                         // sunshade
    for (let x = x0 + 2.2; x <= x1 - 2.2 + 0.01; x += 1.6) boxMM(x - 0.09, x + 0.09, 0.3, 4.5, lobbyZ, lobbyZ + 0.3); // lobby mullions
    boxMM(x0 + 2.2, x1 - 2.2, 2.4, 2.6, lobbyZ, lobbyZ + 0.3);
    boxMM(-45.0, -41.0, 0.3, 2.3, lobbyZ + 0.1, lobbyZ + 0.35);                              // entrance door leaves
    for (const x of [-46.5, -39.5]) cylY(0.3, x, 0, SL, Z1 - 0.3, 12);                      // columns carrying the overhang
  });
  // roof slab, coping, lantern
  withMat('roof', () => boxMM(x0 + 0.5, x1, h, h + 0.12, z0 + 0.6, Z1 - 0.5));
  withMat('coping', () => {
    boxMM(x0 - 0.2, x1, p, p + 0.28, Z1 - 0.7, Z1 + 0.2); boxMM(x0 - 0.2, x0 + 0.7, p, p + 0.28, z0, Z1 + 0.2);
  });
  withMat('glass', () => prismX([[2.5, h + 0.3], [8.5, h + 0.3], [5.5, h + 1.2]], -45, -41));
  withMat('rtu', () => boxMM(-45.1, -40.9, h, h + 0.3, 2.4, 8.6));
  // entrance canopy on two columns, with a deep fascia
  withMat('coping', () => {
    boxMM(-47, -39, 3.5, 3.85, Z1, Z1 + 4.6);
    boxMM(-47, -39, 3.1, 4.1, Z1 + 4.3, Z1 + 4.6);
  });
  withMat('rtu', () => { for (const x of [-46.4, -39.6]) cylY(0.2, x, 0, 3.5, Z1 + 4.0, 12); });
  // entry planters
  withMat('bed', () => { for (const [a, b] of [[-51.5, -48.5], [-37.5, -34.5]]) boxMM(a, b, 0, 0.7, Z1 + 1.0, Z1 + 3.2); });
}

module.exports = { office };
