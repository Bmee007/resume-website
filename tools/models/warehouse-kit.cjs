// Geometry kit for gen-warehouse.cjs: collector with material groups, box/cylinder/prism helpers, GLB writer.
// Metres, Y up. Each add() lands in the current material group; groups become glTF primitives whose base-colour
// luminance the site loader turns into per-vertex greys (so tonal separation survives the single mono material).
'use strict';
const fs = require('fs');
const path = require('path');
const THREE = require(path.resolve(__dirname, '../../node_modules/three/build/three.cjs'));

/** linear luminance per material group (loader maps lum -> grey 0.4 + 0.36 * clamp(lum, 0.35, 1)) */
const MATERIALS = {
  wall: 0.95, roof: 0.46, ground: 0.35, court: 0.36, concrete: 0.9, dark: 0.35,
  trailer: 1.0, metal: 0.72, green: 0.55, container: 0.6, bed: 0.42,
};

function createKit() {
  const parts = [];
  let xform = new THREE.Matrix4();
  let mat = 'wall';

  function add(geom, m) {
    if (m) geom.applyMatrix4(m);
    geom.applyMatrix4(xform);
    parts.push({ geom, mat });
  }
  function withTransform(m, fn) { const prev = xform; xform = prev.clone().multiply(m); try { fn(); } finally { xform = prev; } }
  function withMat(name, fn) { const prev = mat; mat = name; try { fn(); } finally { mat = prev; } }
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

  function boxMM(x0, x1, y0, y1, z0, z1) {
    if (x1 - x0 < 1e-6 || y1 - y0 < 1e-6 || z1 - z0 < 1e-6) return;
    add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), T((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
  }
  function cylY(r, x, y0, y1, z, seg = 14, r1 = r) {
    add(new THREE.CylinderGeometry(r1, r, y1 - y0, seg), T(x, (y0 + y1) / 2, z));
  }
  function cylX(r, x0, x1, y, z, seg = 14) {
    add(new THREE.CylinderGeometry(r, r, x1 - x0, seg), T((x0 + x1) / 2, y, z).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)));
  }
  function cylZ(r, x, y, z0, z1, seg = 14) {
    add(new THREE.CylinderGeometry(r, r, z1 - z0, seg), T(x, y, (z0 + z1) / 2).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  }
  function rod(r, a, b, seg = 6) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    add(new THREE.CylinderGeometry(r, r, dir.length(), seg), new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  }
  /** prism from polygon in (z,y) extruded over x range */
  function prismX(ptsZY, x0, x1) {
    const shape = new THREE.Shape(ptsZY.map(([u, v]) => new THREE.Vector2(u, v)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false });
    add(g, T(x1, 0, 0).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)));
  }
  /** prism from polygon in (x,y) extruded over z range */
  function prismZ(ptsXY, z0, z1) {
    const shape = new THREE.Shape(ptsXY.map(([u, v]) => new THREE.Vector2(u, v)));
    add(new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false }), T(0, 0, z0));
  }
  /** box whose side faces lean inward going from yTop down to yBot by `inset` (the plinth under-chamfer) */
  function frustum(x0, x1, z0, z1, yTop, yBot, inset) {
    const t = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const b = [[x0 + inset, z0 + inset], [x1 - inset, z0 + inset], [x1 - inset, z1 - inset], [x0 + inset, z1 - inset]];
    const P = []; for (const [x, z] of t) P.push([x, yTop, z]); for (const [x, z] of b) P.push([x, yBot, z]);
    const quads = [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]];
    const pos = [];
    for (const [a, c, d, e] of quads) for (const i of [a, c, d, a, d, e]) pos.push(...P[i]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    add(g);
  }
  /** lumpy ellipsoid: direction-hashed jitter so the seam stays closed (tree crowns, shrubs) */
  function blob(cx, cy, cz, rx, ry, rz, seed = 1, jit = 0.14, seg = 14) {
    const g = new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7)));
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = (Math.sin(x * 3.1 + seed) + Math.sin(y * 4.3 + seed * 1.7) + Math.sin(z * 3.7 + seed * 0.6) + Math.sin((x + y + z) * 5.1 + seed * 2.3)) / 4;
      const k = 1 + jit * n;
      p.setXYZ(i, x * rx * k, y * ry * k, z * rz * k);
    }
    g.computeVertexNormals();
    add(g, T(cx, cy, cz));
  }

  /**
   * Wall with rectangular openings. axis 'x': runs along x (a = x), thickness along z (n0..n1).
   * axis 'z': runs along z, thickness along x. openings: {a0,a1,y0,y1}
   */
  function wall(axis, a0, a1, y0, y1, n0, n1, openings = []) {
    const bps = new Set([a0, a1]);
    for (const o of openings) { if (o.a0 > a0 && o.a0 < a1) bps.add(o.a0); if (o.a1 > a0 && o.a1 < a1) bps.add(o.a1); }
    const xs = [...bps].sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const sa = xs[i], sb = xs[i + 1]; if (sb - sa < 1e-6) continue;
      const mid = (sa + sb) / 2;
      const cuts = openings.filter((o) => o.a0 <= mid && o.a1 >= mid).map((o) => [Math.max(o.y0, y0), Math.min(o.y1, y1)]).sort((p, q) => p[0] - q[0]);
      let cur = y0; const segs = [];
      for (const [c0, c1] of cuts) { if (c0 > cur + 1e-6) segs.push([cur, c0]); cur = Math.max(cur, c1); }
      if (cur < y1 - 1e-6) segs.push([cur, y1]);
      for (const [s0, s1] of segs) axis === 'x' ? boxMM(sa, sb, s0, s1, n0, n1) : boxMM(n0, n1, s0, s1, sa, sb);
    }
  }

  function writeGLB(file) {
    const groups = new Map();
    for (const { geom, mat: m } of parts) { if (!groups.has(m)) groups.set(m, []); groups.get(m).push(geom); }
    const names = [...groups.keys()];
    const chunks = []; const bufferViews = []; const accessors = []; const primitives = []; const materials = [];
    let offset = 0, tris = 0, verts = 0;
    const pad4 = (n) => (4 - (n % 4)) % 4;
    const push = (buf, target) => {
      const b = Buffer.concat([buf, Buffer.alloc(pad4(buf.length))]);
      bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target });
      chunks.push(b); offset += b.length; return bufferViews.length - 1;
    };
    const gmin = [Infinity, Infinity, Infinity], gmax = [-Infinity, -Infinity, -Infinity];
    names.forEach((name, mi) => {
      const geoms = groups.get(name);
      let nv = 0, ni = 0;
      for (const g of geoms) { if (!g.attributes.normal) g.computeVertexNormals(); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
      let vo = 0, io = 0;
      for (const g of geoms) {
        const c = g.attributes.position.count;
        pos.set(g.attributes.position.array.subarray(0, c * 3), vo * 3); nor.set(g.attributes.normal.array.subarray(0, c * 3), vo * 3);
        if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo; io += ia.length; }
        else for (let i = 0; i < c; i++) idx[io++] = vo + i;
        vo += c;
      }
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const v = pos[i * 3 + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
      for (let k = 0; k < 3; k++) { gmin[k] = Math.min(gmin[k], min[k]); gmax[k] = Math.max(gmax[k], max[k]); }
      const bp = push(Buffer.from(pos.buffer), 34962), bn = push(Buffer.from(nor.buffer), 34962), bi = push(Buffer.from(idx.buffer), 34963);
      const a0 = accessors.push({ bufferView: bp, componentType: 5126, count: nv, type: 'VEC3', min, max }) - 1;
      const a1 = accessors.push({ bufferView: bn, componentType: 5126, count: nv, type: 'VEC3' }) - 1;
      const a2 = accessors.push({ bufferView: bi, componentType: 5125, count: ni, type: 'SCALAR' }) - 1;
      const lum = MATERIALS[name] ?? 0.8;
      materials.push({ name, pbrMetallicRoughness: { baseColorFactor: [lum, lum, lum, 1], metallicFactor: 0, roughnessFactor: 0.6 } });
      primitives.push({ attributes: { POSITION: a0, NORMAL: a1 }, indices: a2, material: mi, mode: 4 });
      tris += ni / 3; verts += nv;
    });
    const bin = Buffer.concat(chunks);
    const json = {
      asset: { version: '2.0', generator: 'resume-website warehouse generator (three.js geometry)' },
      scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'warehouse' }],
      materials, meshes: [{ name: 'warehouse', primitives }], accessors, bufferViews, buffers: [{ byteLength: bin.length }],
    };
    let jsonB = Buffer.from(JSON.stringify(json), 'utf8');
    jsonB = Buffer.concat([jsonB, Buffer.alloc(pad4(jsonB.length), 0x20)]);
    const header = Buffer.alloc(12); header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonB.length + 8 + bin.length, 8);
    const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonB.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
    const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.concat([header, jh, jsonB, bh, bin]));
    return { parts: parts.length, verts, tris, bytes: 12 + 16 + jsonB.length + bin.length, min: gmin, max: gmax };
  }

  return { THREE, T, add, withTransform, withMat, boxMM, cylY, cylX, cylZ, rod, prismX, prismZ, frustum, blob, wall, writeGLB };
}

module.exports = { createKit, MATERIALS };
