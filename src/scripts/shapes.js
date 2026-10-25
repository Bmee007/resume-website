// src/scripts/shapes.js
import { MAINLAND, ISLANDS } from './canada-outline.js';
// Wireframe drawings for the lattice story object, as 3D polylines.
// Conventions: x = left→right, y = up, z = toward the viewer. Units roughly ±1.4.
// Each shape returns an array of { pts: [[x,y,z],...], closed: boolean }.

const seg = (a, b) => ({ pts: [a, b], closed: false });
const poly = (pts, closed = false) => ({ pts, closed });

/** Axis-aligned box as 12 edge segments. */
function box(x0, x1, y0, y1, z0, z1) {
  const c = (x, y, z) => [x, y, z];
  const out = [];
  for (const y of [y0, y1]) {
    out.push(poly([c(x0, y, z0), c(x1, y, z0), c(x1, y, z1), c(x0, y, z1)], true));
  }
  for (const x of [x0, x1]) for (const z of [z0, z1]) out.push(seg(c(x, y0, z), c(x, y1, z)));
  return out;
}

/** Ellipse in a plane. axis = 'z' (XY plane), 'y' (XZ plane), 'x' (YZ plane). */
function ellipse(cx, cy, cz, r1, r2, axis, n = 12) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const u = Math.cos(a) * r1, v = Math.sin(a) * r2;
    if (axis === 'z') pts.push([cx + u, cy + v, cz]);
    else if (axis === 'y') pts.push([cx + u, cy, cz + v]);
    else pts.push([cx, cy + u, cz + v]);
  }
  return poly(pts, true);
}

/** Articulated truck: cab + hood, trailer, wind deflector, eight wheels, side ribs. */
export function truck() {
  const s = [];
  s.push(...box(-1.35, 0.3, -0.05, 0.8, -0.42, 0.42));          // trailer
  s.push(...box(0.42, 1.0, -0.05, 0.55, -0.38, 0.38));          // cab
  s.push(...box(1.0, 1.35, -0.05, 0.22, -0.36, 0.36));          // hood
  for (const z of [-0.38, 0.38]) s.push(seg([0.42, 0.55, z], [0.3, 0.8, z * 1.1])); // deflector
  s.push(seg([0.42, 0.55, -0.38], [0.42, 0.55, 0.38]));
  // windshield + door lines
  s.push(seg([1.0, 0.22, -0.36], [1.0, 0.55, -0.38]), seg([1.0, 0.22, 0.36], [1.0, 0.55, 0.38]));
  s.push(seg([0.72, -0.05, 0.38], [0.72, 0.5, 0.38]), seg([0.72, -0.05, -0.38], [0.72, 0.5, -0.38]));
  // trailer ribs + rear doors
  for (const y of [0.22, 0.5]) for (const z of [-0.42, 0.42]) s.push(seg([-1.35, y, z], [0.3, y, z]));
  s.push(seg([-1.35, -0.05, 0], [-1.35, 0.8, 0]));
  // wheels (both sides)
  for (const z of [-0.42, 0.42]) for (const x of [-1.08, -0.74, 0.76, 1.18]) s.push(ellipse(x, -0.22, z, 0.17, 0.17, 'z', 10));
  // axles
  for (const x of [-1.08, -0.74, 0.76, 1.18]) s.push(seg([x, -0.22, -0.42], [x, -0.22, 0.42]));
  return s;
}

/** Desktop workstation: monitor with a rising chart, stand, keyboard, mouse. */
export function computer() {
  const s = [];
  s.push(...box(-0.95, 0.95, 0.05, 1.15, -0.05, 0.05));          // monitor body
  s.push(poly([[-0.85, 0.15, 0.052], [0.85, 0.15, 0.052], [0.85, 1.05, 0.052], [-0.85, 1.05, 0.052]], true)); // screen
  s.push(poly([[-0.72, 0.3, 0.055], [-0.48, 0.47, 0.055], [-0.22, 0.4, 0.055], [0.04, 0.64, 0.055], [0.3, 0.57, 0.055], [0.55, 0.86, 0.055], [0.72, 0.96, 0.055]])); // chart
  for (const y of [0.45, 0.75]) s.push(seg([-0.8, y, 0.054], [0.8, y, 0.054]));   // grid lines
  s.push(seg([-0.8, 0.98, 0.054], [-0.35, 0.98, 0.054]));                          // title bar
  s.push(...box(-0.1, 0.1, -0.3, 0.05, -0.04, 0.04));                              // neck
  s.push(ellipse(0, -0.3, 0.08, 0.42, 0.2, 'y', 14));                              // base
  s.push(...box(-0.75, 0.75, -0.62, -0.56, 0.25, 0.7));                            // keyboard
  for (const z of [0.36, 0.47, 0.58]) s.push(seg([-0.68, -0.56, z], [0.68, -0.56, z]));
  for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) s.push(seg([x, -0.56, 0.3], [x, -0.56, 0.65]));
  s.push(ellipse(1.05, -0.59, 0.5, 0.1, 0.15, 'y', 8));                            // mouse
  s.push(seg([0.95, -0.59, 0.45], [0.75, -0.59, 0.4]));                            // mouse cable
  return s;
}

/** Distribution centre: long shed, pitched roof with purlins, five dock doors, canopy, apron. */
export function warehouse() {
  const s = [];
  s.push(...box(-1.4, 1.4, -0.55, 0.25, -0.65, 0.65));                            // walls
  s.push(seg([-1.4, 0.62, 0], [1.4, 0.62, 0]));                                    // ridge
  for (const x of [-1.4, 1.4]) s.push(poly([[x, 0.25, -0.65], [x, 0.62, 0], [x, 0.25, 0.65]]));   // gables
  for (const x of [-0.7, 0, 0.7]) s.push(poly([[x, 0.25, 0.65], [x, 0.62, 0], [x, 0.25, -0.65]])); // purlins
  for (const cx of [-1.0, -0.5, 0, 0.5, 1.0]) {                                     // dock doors
    const w = 0.16;
    s.push(poly([[cx - w, -0.55, 0.652], [cx + w, -0.55, 0.652], [cx + w, 0.0, 0.652], [cx - w, 0.0, 0.652]], true));
    s.push(seg([cx - w, -0.27, 0.653], [cx + w, -0.27, 0.653]));
  }
  s.push(seg([-1.3, 0.12, 0.85], [1.3, 0.12, 0.85]));                              // canopy edge
  for (const x of [-1.3, 0, 1.3]) s.push(seg([x, 0.12, 0.65], [x, 0.12, 0.85]), seg([x, -0.55, 0.85], [x, 0.12, 0.85])); // canopy struts
  s.push(poly([[-1.4, -0.55, 0.65], [-1.4, -0.55, 1.15], [1.4, -0.55, 1.15], [1.4, -0.55, 0.65]]));   // apron
  s.push(seg([-1.4, 0.05, -0.65], [1.4, 0.05, -0.65]));                            // rear band
  return s;
}

/** Brain: two hemispheres of gyri on an ellipsoid, central fissure, cerebellum, brain stem. */
export function brain() {
  const s = [];
  const rx = 1.0, ry = 0.78, rz = 0.66, cy = 0.08;
  const bands = [-0.62, -0.3, 0.02, 0.34, 0.68, 1.0];
  for (const side of [-1, 1]) {
    bands.forEach((phi0, k) => {
      const pts = [];
      const n = 15;
      for (let i = 0; i < n; i++) {
        const a = 0.1 + (i / (n - 1)) * (Math.PI - 0.2);          // front → back
        const phi = phi0 + Math.sin(a * 4.2 + k * 1.9 + side) * 0.13; // gyri wobble
        const x = side * (0.08 + rx * Math.cos(phi) * Math.sin(a) * 0.93);
        const y = cy + ry * Math.sin(phi);
        const z = rz * Math.cos(phi) * Math.cos(a);
        pts.push([x, y, z]);
      }
      s.push(poly(pts));
    });
    // fissure wall: front-bottom over the crown to back-bottom
    const wall = [];
    for (let i = 0; i <= 12; i++) {
      const u = (i / 12) * Math.PI;
      wall.push([side * 0.08, cy + ry * Math.sin(u) * 0.98 - 0.02, rz * Math.cos(u)]);
    }
    s.push(poly(wall));
  }
  // cerebellum
  s.push(ellipse(0, -0.48, -0.32, 0.46, 0.3, 'y', 12));
  s.push(ellipse(0, -0.48, -0.32, 0.22, 0.3, 'x', 10));
  // brain stem
  for (const x of [-0.08, 0.08]) s.push(seg([x, -0.5, -0.1], [x, -0.98, -0.16]));
  s.push(seg([-0.08, -0.98, -0.16], [0.08, -0.98, -0.16]));
  return s;
}

export const SHAPES = { truck, computer, warehouse, brain };

/* ── Canada ─────────────────────────────────────────────────────────────────
   A 3D plate map: Lambert conformal conic projection (the one Canadian maps use),
   mainland extruded into a thin slab, major islands, seven DC pins chained
   west → east as a supply route. Map lies in the XZ plane; north is −z. */

const DEG = Math.PI / 180;
export function lccProjector() {
  const φ0 = 49 * DEG, φ1 = 49 * DEG, φ2 = 77 * DEG, λ0 = -96 * DEG;
  const n = Math.log(Math.cos(φ1) / Math.cos(φ2)) / Math.log(Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2));
  const F = (Math.cos(φ1) * Math.pow(Math.tan(Math.PI / 4 + φ1 / 2), n)) / n;
  const ρ0 = F / Math.pow(Math.tan(Math.PI / 4 + φ0 / 2), n);
  return (lon, lat) => {
    const ρ = F / Math.pow(Math.tan(Math.PI / 4 + (lat * DEG) / 2), n);
    const θ = n * (lon * DEG - λ0);
    return [ρ * Math.sin(θ), ρ0 - ρ * Math.cos(θ)];
  };
}

export const DCS = [
  { city: 'Delta',    region: 'BC', lon: -123.08, lat: 49.08 },
  { city: 'Calgary',  region: 'AB', lon: -114.07, lat: 51.05 },
  { city: 'Regina',   region: 'SK', lon: -104.62, lat: 50.45 },
  { city: 'Winnipeg', region: 'MB', lon: -97.14,  lat: 49.90 },
  { city: 'Toronto',  region: 'ON', lon: -79.38,  lat: 43.65 },
  { city: 'Montreal', region: 'QC', lon: -73.57,  lat: 45.50 },
  { city: 'Moncton',  region: 'NB', lon: -64.78,  lat: 46.09 },
];

export function canada() {
  const proj = lccProjector();
  // Fit the mainland bounding box to x ∈ [-1.4, 1.4]
  const raw = MAINLAND.map(([lo, la]) => proj(lo, la));
  const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = 2.8 / (maxX - minX);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const toXZ = (lon, lat) => { const [x, y] = proj(lon, lat); return [(x - cx) * k, -(y - cy) * k]; }; // north → −z

  const s = [];
  const top = MAINLAND.map(([lo, la]) => { const [x, z] = toXZ(lo, la); return [x, 0, z]; });
  const bottom = top.filter((_, i) => i % 2 === 0).map(([x, , z]) => [x, -0.07, z]);
  s.push(poly(top, true));
  s.push(poly(bottom, true));
  for (let i = 0; i < top.length; i += 10) s.push(seg(top[i], [top[i][0], -0.07, top[i][2]])); // slab ticks
  for (const isl of ISLANDS) s.push(poly(isl.map(([lo, la]) => { const [x, z] = toXZ(lo, la); return [x, 0, z]; }), true));

  // DC pins + a west→east route chained over the pin tops
  const pins = DCS.map((d) => { const [x, z] = toXZ(d.lon, d.lat); return [x, z]; });
  const H = 0.22;
  pins.forEach(([x, z]) => {
    s.push(seg([x, 0, z], [x, H, z]));
    s.push(poly([[x - 0.035, H, z], [x, H + 0.035, z], [x + 0.035, H, z], [x, H - 0.035, z]], true));
  });
  for (let i = 0; i < pins.length - 1; i++) {
    const [ax, az] = pins[i], [bx, bz] = pins[i + 1];
    const pts = [];
    for (let j = 0; j <= 6; j++) {
      const t = j / 6;
      pts.push([ax + (bx - ax) * t, H + Math.sin(t * Math.PI) * 0.14, az + (bz - az) * t]);
    }
    s.push(poly(pts));
  }
  s.labels = DCS.map((d, i) => ({ pos: [pins[i][0], H + 0.12, pins[i][1]], text: d.city.toUpperCase() }));
  return s;
}

SHAPES.canada = canada;
