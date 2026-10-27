// Shared dimensions (metres) for the warehouse generator. Dock face is +Z, long axis X, Y up.
'use strict';

const X0 = -52, X1 = 44, Z0 = -28, Z1 = 12;           // main footprint (96 x 40 m)
const EAVE = 11.8, RIDGE = 12.5, RIDGE_Z = -8;         // low-slope roof: ridge down the middle, falls to both long walls
const P = 13.4;                                        // parapet top (under the coping)
const FLOOR = 1.3;                                     // dock floor height
const DOOR_W = 3.4, DOOR_H = 3.8, DOOR_N = 14, DOOR_PITCH = 5.2, DOOR_X0 = -27.2;
const DOOR_X = Array.from({ length: DOOR_N }, (_, k) => DOOR_X0 + DOOR_PITCH * k);
const OFF = { x0: -52, x1: -34, z0: 0, h: 8.8, p: 9.5, lobbyZ: 8.5 }; // recessed office wing in the front-west notch
const CAN = { x0: -30, x1: 43.6, d: 3.2, y: 6.5 };     // dock canopy
const PLINTH = { x0: -60, x1: 60, z0: -34, z1: 54, th: 1.0, bevel: 0.6 };
const COURT = { x0: -32, x1: 45, z1: 51.5 };           // truck court (concrete) inside the security fence
const YARD = { x0: 47.5, x1: 59, z0: -31.5, z1: 50 };    // fenced container / pallet yard, east of the building

/** roof surface height at depth z (sloping from the ridge to both long walls) */
function roofY(z) {
  return z <= RIDGE_Z
    ? EAVE + (RIDGE - EAVE) * (z - Z0) / (RIDGE_Z - Z0)
    : EAVE + (RIDGE - EAVE) * (Z1 - z) / (Z1 - RIDGE_Z);
}

/** door indices: 0..13 left to right */
const TRAILER_DOORS = [1, 4, 8, 12];
const OPEN_DOORS = new Set([...TRAILER_DOORS, 6]);
const NO_SEAL = new Set([5, 6, 10]);                    // plain doors without a dock seal (bumpers + light only)

module.exports = { X0, X1, Z0, Z1, EAVE, RIDGE, RIDGE_Z, P, FLOOR, DOOR_W, DOOR_H, DOOR_N, DOOR_PITCH, DOOR_X0, DOOR_X, OFF, CAN, PLINTH, COURT, YARD, roofY, TRAILER_DOORS, OPEN_DOORS, NO_SEAL };
