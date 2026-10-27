// Post-process the raw 3-primitive canada GLB from build-canada.py:
//   top surface  -> meshopt simplify (absolute error, border locked), then smooth normals recomputed on the result
//   walls/bottom -> kept (walls) / lightly simplified (bottom), then quantize + meshopt compress.
// usage: node post-canada.mjs raw.glb out.glb [topError=0.0004] [bottomError=0.002]
// needs @gltf-transform/{core,functions,extensions} + meshoptimizer resolvable (e.g. NODE_PATH or a local install).
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const [inp, out, topErr = '0.0004', botErr = '0.002'] = process.argv.slice(2);
await Promise.all([MeshoptSimplifier.ready, MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
const prims = doc.getRoot().listMeshes()[0].listPrimitives();

function compact(prim, pos, nrm, idx) {
  const map = new Int32Array(pos.length / 3).fill(-1); let n = 0;
  for (const i of idx) if (map[i] < 0) map[i] = n++;
  const p = new Float32Array(n * 3), q = new Float32Array(n * 3);
  for (let i = 0; i < map.length; i++) if (map[i] >= 0) { const o = map[i] * 3; p.set(pos.subarray(i * 3, i * 3 + 3), o); q.set(nrm.subarray(i * 3, i * 3 + 3), o); }
  const ni = new Uint32Array(idx.length); for (let i = 0; i < idx.length; i++) ni[i] = map[idx[i]];
  return [p, q, ni];
}
function smoothNormals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += fx; n[k + 1] += fy; n[k + 2] += fz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
const stats = [];
prims.forEach((prim, k) => {
  const pa = prim.getAttribute('POSITION'), na = prim.getAttribute('NORMAL'), ia = prim.getIndices();
  let pos = pa.getArray(), nrm = na.getArray(), idx = Uint32Array.from(ia.getArray());
  const before = idx.length / 3;
  if (k === 0 || k === 2) {
    const err = k === 0 ? +topErr : +botErr;
    const [ni] = MeshoptSimplifier.simplify(idx, pos, 3, 0, err, ['LockBorder', 'ErrorAbsolute']);
    idx = Uint32Array.from(ni);
  }
  [pos, nrm, idx] = compact(prim, pos, nrm, idx);
  if (k === 0) nrm = smoothNormals(pos, idx);
  pa.setArray(pos); na.setArray(nrm); ia.setArray(idx);
  stats.push([k === 0 ? 'top' : k === 1 ? 'walls' : 'bottom', before, idx.length / 3]);
});
await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 10 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(out, doc);
console.log(JSON.stringify(stats));
