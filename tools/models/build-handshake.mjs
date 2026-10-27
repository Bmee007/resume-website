// Builds public/models/handshake.glb: a human right hand (MakeHuman CC0 base mesh, posed with the default rig,
// cut mid-forearm under a rolled shirt cuff) clasped with a procedurally generated industrial robot right hand
// (pin-jointed segmented fingers, split palm plates with vents, wrist actuator ring and bellows, forearm shell
// with cable channel and screws). Layout follows real handshake photographs (see public/models/CREDITS.md):
// clean side view, thumbs up, human arm from -X, robot arm from +X, forearms nearly level, each wrist bent about
// 30 degrees toward the little finger so the finger axes point down, palms only partly overlapping (webs
// together), and each hand's fingers lying across the other's heel and wrapping its lower (ulnar) edge.
// The camera-side (+Z) hand is the human; four materials carry the greys the site loader maps to shade
// (skin 0.85, sleeve 0.55, robot panels 0.40, robot joints 0.15).
//
// Units: decimetres (MakeHuman native). Y up, front = +Z. Exported via three's GLTFExporter, then
// quantized + meshopt-compressed with gltf-transform.
//
// Pose tuning hooks (used by the pose-fit search, not needed to rebuild): HS_PARAMS (JSON overrides of DEFAULTS),
// HS_FAST=1 (skip creases/nails/cuff), HS_SKIP_COMPRESS=1, KEEP_RAW=<path> (uncompressed copy for clip tests).
//
// Usage:  node tools/models/build-handshake.mjs <src-dir> [out.glb] [--human-only|--robot-only]
// <src-dir> (all CC0 — see public/models/CREDITS.md; same download as build-people.mjs):
//   base.obj, default.mhskel, default_weights.mhw   github.com/makehumancommunity/makehuman (makehuman/data/{3dobjs,rigs})
//   targets/*.target                                 same repo, makehuman/data/targets/macrodetails
//   sysassets/clothes/male_casualsuit01/             makehuman_system_assets_cc0.zip (shirt, for the sleeve cuff)
import * as THREE from '../../node_modules/three/build/three.module.js';
import { RoundedBoxGeometry } from '../../node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from '../../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from '../../node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2];
const OUT = process.argv[3] || path.resolve(HERE, '../../public/models/handshake.glb');
const ONLY = process.argv.find((a) => a.startsWith('--')) || '';
if (!SRC || !fs.existsSync(path.join(SRC, 'base.obj'))) { console.error('usage: node build-handshake.mjs <src-dir> [out.glb]'); process.exit(1); }

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};
const DEG = Math.PI / 180;
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// =============================================================================
// MakeHuman parsing / fitting / skinning (same approach as build-people.mjs)
// =============================================================================
function parseOBJ(file) {
  const V = [], faces = []; let group = '';
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (line.startsWith('v ')) { const p = line.trim().split(/\s+/); V.push([+p[1], +p[2], +p[3]]); }
    else if (line.startsWith('g ')) group = line.slice(2).trim();
    else if (line.startsWith('f ')) faces.push({ g: group, idx: line.trim().split(/\s+/).slice(1).map((t) => parseInt(t, 10) - 1) });
  }
  return { V, faces };
}
function parseTarget(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) { if (!line || line[0] === '#') continue; const p = line.trim().split(/\s+/); if (p.length >= 4) out.push([parseInt(p[0], 10), +p[1], +p[2], +p[3]]); }
  return out;
}
function parseMhclo(file) {
  const res = { objFile: null, scale: {}, verts: [] }; let mode = 'head';
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim(); if (!line || line[0] === '#') continue;
    if (mode === 'head') { const p = line.split(/\s+/); if (p[0] === 'obj_file') res.objFile = p[1]; else if (/^[xyz]_scale$/.test(p[0])) res.scale[p[0][0]] = [parseInt(p[1], 10), parseInt(p[2], 10), +p[3]]; else if (p[0] === 'verts') mode = 'verts'; continue; }
    if (line.startsWith('delete_verts')) break;
    const p = line.split(/\s+/).map(Number); if (p.length === 1 || p.length >= 9) res.verts.push(p);
  }
  return res;
}
function parseSkeleton(dir) {
  const skel = JSON.parse(fs.readFileSync(path.join(dir, 'default.mhskel'), 'utf8'));
  const mhw = JSON.parse(fs.readFileSync(path.join(dir, 'default_weights.mhw'), 'utf8'));
  const order = []; const seen = new Set();
  const visit = (n) => { if (seen.has(n)) return; const p = skel.bones[n].parent; if (p) visit(p); seen.add(n); order.push(n); };
  Object.keys(skel.bones).forEach(visit);
  const bones = order.map((name, i) => ({ name, i, parent: skel.bones[name].parent, headJ: skel.bones[name].head, tailJ: skel.bones[name].tail }));
  const byName = new Map(bones.map((b) => [b.name, b]));
  const vw = new Map();
  for (const [bone, list] of Object.entries(mhw.weights)) { const b = byName.get(bone); if (!b) continue; for (const [vi, w] of list) { if (!vw.has(vi)) vw.set(vi, []); vw.get(vi).push([b.i, w]); } }
  for (const list of vw.values()) { const s = list.reduce((a, [, w]) => a + w, 0); if (s > 0) for (const e of list) e[1] /= s; }
  return { bones, byName, joints: skel.joints, vw };
}
const base = parseOBJ(path.join(SRC, 'base.obj'));
const rig = parseSkeleton(SRC);
const bodyFaces = base.faces.filter((f) => f.g === 'body');

function morphBase(targets) {
  const V = base.V.map((v) => [v[0], v[1], v[2]]);
  for (const [name, w] of targets) for (const [i, dx, dy, dz] of parseTarget(path.join(SRC, 'targets', name + '.target'))) { V[i][0] += w * dx; V[i][1] += w * dy; V[i][2] += w * dz; }
  return V;
}
function fitProxy(mhcloPath, V) {
  const clo = parseMhclo(mhcloPath); const obj = parseOBJ(path.join(path.dirname(mhcloPath), clo.objFile));
  const sc = { x: 1, y: 1, z: 1 };
  for (const ax of ['x', 'y', 'z']) { const s = clo.scale[ax]; if (!s) continue; const k = 'xyz'.indexOf(ax); sc[ax] = Math.abs(V[s[0]][k] - V[s[1]][k]) / s[2]; }
  const P = [], W = [];
  for (let i = 0; i < obj.V.length; i++) {
    const m = clo.verts[i];
    if (!m) { P.push(obj.V[i]); W.push([]); continue; }
    if (m.length === 1) { P.push([...V[m[0]]]); W.push(rig.vw.get(m[0]) || []); continue; }
    const [a, b, c, wa, wb, wc, dx, dy, dz] = m;
    P.push([wa * V[a][0] + wb * V[b][0] + wc * V[c][0] + dx * sc.x, wa * V[a][1] + wb * V[b][1] + wc * V[c][1] + dy * sc.y, wa * V[a][2] + wb * V[b][2] + wc * V[c][2] + dz * sc.z]);
    const acc = new Map();
    for (const [vi, wv] of [[a, wa], [b, wb], [c, wc]]) for (const [bi, w] of rig.vw.get(vi) || []) acc.set(bi, (acc.get(bi) || 0) + wv * w);
    const list = [...acc.entries()]; const s = list.reduce((t, [, w]) => t + w, 0);
    W.push(s > 0 ? list.map(([bi, w]) => [bi, w / s]) : []);
  }
  return { P, W, faces: obj.faces };
}
/** Pose: bone -> { rot:[rx,ry,rz] deg in parent's posed frame, aim:[x,y,z] world dir, twist:deg }. */
function poseRig(V, pose) {
  const jointPos = (j) => { const ids = rig.joints[j]; const c = new THREE.Vector3(); for (const i of ids) c.add(V3(V[i])); return c.multiplyScalar(1 / ids.length); };
  const head = new Map(), tail = new Map();
  for (const b of rig.bones) { head.set(b.name, jointPos(b.headJ)); tail.set(b.name, jointPos(b.tailJ)); }
  const Rw = new Map(), pw = new Map(); const skin = [];
  for (const b of rig.bones) {
    const spec = pose[b.name] || {};
    const Rp = b.parent ? Rw.get(b.parent) : new THREE.Quaternion();
    const P = b.parent ? pw.get(b.parent).clone().add(head.get(b.name).clone().sub(head.get(b.parent)).applyQuaternion(Rp)) : head.get(b.name).clone();
    let R = Rp.clone();
    if (spec.rot) R.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(spec.rot[0] * DEG, spec.rot[1] * DEG, spec.rot[2] * DEG, 'XYZ')));
    if (spec.axisRot) for (const [axis, deg] of spec.axisRot) R.multiply(new THREE.Quaternion().setFromAxisAngle(V3(axis).normalize(), deg * DEG));
    if (spec.aim) { const d0 = tail.get(b.name).clone().sub(head.get(b.name)).normalize().applyQuaternion(R); R = new THREE.Quaternion().setFromUnitVectors(d0, V3(spec.aim).normalize()).multiply(R); }
    if (spec.twist) { const axis = tail.get(b.name).clone().sub(head.get(b.name)).normalize().applyQuaternion(R); R = new THREE.Quaternion().setFromAxisAngle(axis, spec.twist * DEG).multiply(R); }
    Rw.set(b.name, R); pw.set(b.name, P);
    skin.push(new THREE.Matrix4().compose(P, R, new THREE.Vector3(1, 1, 1)).multiply(new THREE.Matrix4().makeTranslation(-head.get(b.name).x, -head.get(b.name).y, -head.get(b.name).z)));
  }
  const tailPos = (n) => tail.get(n).clone().sub(head.get(n)).applyQuaternion(Rw.get(n)).add(pw.get(n));
  return { skin, pos: pw, tailPos, rot: Rw, head, tail };
}
function skinPoints(P, W, skin) {
  const out = new Array(P.length); const v = new THREE.Vector3(), acc = new THREE.Vector3();
  for (let i = 0; i < P.length; i++) {
    const list = W[i]; if (!list || !list.length) { out[i] = P[i]; continue; }
    acc.set(0, 0, 0); for (const [bi, w] of list) { v.set(P[i][0], P[i][1], P[i][2]).applyMatrix4(skin[bi]); acc.addScaledVector(v, w); }
    out[i] = [acc.x, acc.y, acc.z];
  }
  return out;
}
function facesToGeometry(P, faces, keepFace) {
  const pos = [], idx = [], map = new Map();
  const vid = (i) => { if (!map.has(i)) { map.set(i, pos.length / 3); pos.push(P[i][0], P[i][1], P[i][2]); } return map.get(i); };
  for (const f of faces) { if (!keepFace(f)) continue; const ids = f.idx.map(vid); for (let k = 1; k + 1 < ids.length; k++) idx.push(ids[0], ids[k], ids[k + 1]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}

/** Flip winding of a closed part whose signed volume is negative (mirrored/negative-scaled/lathed parts). */
function outward(g) {
  const pos = g.attributes.position; const idx = g.index ? g.index.array : null; if (!idx) return g;
  let vol = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) { a.fromBufferAttribute(pos, idx[i]); b.fromBufferAttribute(pos, idx[i + 1]); c.fromBufferAttribute(pos, idx[i + 2]); vol += a.dot(b.clone().cross(c)); }
  if (vol < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  return g;
}
/** One level of midpoint subdivision followed by Taubin smoothing (boundary vertices fixed): rounds the
 *  faceted MakeHuman mesh into a smoother surface with ~4x the triangles, without shrinking it. */
function subdivideSmooth(g, smoothIters = 3) {
  const P = []; const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) P.push(new THREE.Vector3().fromBufferAttribute(pos, i));
  const idx = g.index.array; const mid = new Map(); const tris = [];
  const edge = (a, b) => { const k = a < b ? a * 1e6 + b : b * 1e6 + a; let m = mid.get(k); if (m === undefined) { m = P.length; P.push(P[a].clone().add(P[b]).multiplyScalar(0.5)); mid.set(k, m); } return m; };
  const edgeUse = new Map(); const ek = (a, b) => (a < b ? a * 1e6 + b : b * 1e6 + a);
  for (let i = 0; i < idx.length; i += 3) for (let e = 0; e < 3; e++) { const k = ek(idx[i + e], idx[i + (e + 1) % 3]); edgeUse.set(k, (edgeUse.get(k) || 0) + 1); }
  const fixed = new Uint8Array(P.length * 4 + 8);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i], idx[i + 1], idx[i + 2]]; const ab = edge(a, b), bc = edge(b, c), ca = edge(c, a);
    tris.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
  }
  for (const [k, n] of edgeUse) if (n === 1) { const a = Math.floor(k / 1e6), b = k - a * 1e6; fixed[a] = 1; fixed[b] = 1; const m = mid.get(k); if (m !== undefined) fixed[m] = 1; }
  const nbr = P.map(() => new Set());
  for (const [a, b, c] of tris) { nbr[a].add(b).add(c); nbr[b].add(a).add(c); nbr[c].add(a).add(b); }
  const step = (lam) => {
    const next = P.map((p, i) => { if (fixed[i] || !nbr[i].size) return p; const avg = new THREE.Vector3(); for (const j of nbr[i]) avg.add(P[j]); avg.multiplyScalar(1 / nbr[i].size); return p.clone().addScaledVector(avg.sub(p), lam); });
    for (let i = 0; i < P.length; i++) P[i] = next[i];
  };
  for (let it = 0; it < smoothIters; it++) { step(0.5); step(-0.53); }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P.flatMap((p) => [p.x, p.y, p.z]), 3));
  out.setIndex(tris.flat()); return out;
}
/** Pull vertices behind the plane (point o, normal n pointing to the kept side) onto the plane: a clean planar cut. */
function clampToPlane(g, o, n) {
  const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const t = v.clone().sub(o).dot(n); if (t < 0) { v.addScaledVector(n, -t); p.setXYZ(i, v.x, v.y, v.z); } }
  return g;
}

/** Close the planar boundary loop of an open sleeve: flat cap (fan) + a rolled hem tube swept along the loop. */
function sleeveEnd(g, o, axis, hemR) {
  const pos = g.attributes.position; const idx = g.index.array; const cnt = new Map(); const key = (a, b) => (a < b ? a * 1e6 + b : b * 1e6 + a);
  for (let i = 0; i < idx.length; i += 3) for (let e = 0; e < 3; e++) { const k = key(idx[i + e], idx[i + (e + 1) % 3]); cnt.set(k, (cnt.get(k) || 0) + 1); }
  const onPlane = (i) => Math.abs(new THREE.Vector3().fromBufferAttribute(pos, i).sub(o).dot(axis)) < 1e-4;
  const adj = new Map();
  for (const [k, n] of cnt) if (n === 1) { const a = Math.floor(k / 1e6), b = k - a * 1e6; if (!onPlane(a) || !onPlane(b)) continue; if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push(b); adj.get(b).push(a); }
  // walk the longest loop
  let best = [];
  const seen = new Set();
  for (const start of adj.keys()) {
    if (seen.has(start)) continue; const loop = [start]; seen.add(start); let prev = -1, cur = start;
    for (;;) { const nxt = adj.get(cur).find((v) => v !== prev && !seen.has(v)); if (nxt === undefined) break; loop.push(nxt); seen.add(nxt); prev = cur; cur = nxt; }
    if (loop.length > best.length) best = loop;
  }
  const P = best.map((i) => new THREE.Vector3().fromBufferAttribute(pos, i)); const n = P.length;
  const c = P.reduce((t, p) => t.add(p), new THREE.Vector3()).multiplyScalar(1 / n);
  // cap: fan from the centroid, normal toward -axis (outward at the proximal end), nudged 0.01 into the sleeve
  const vp = [...P.map((p) => p.toArray()).flat(), ...c.clone().addScaledVector(axis, 0.0).toArray()]; const vi = [];
  const faceDir = (a, b, cc) => b.clone().sub(a).cross(cc.clone().sub(a)).dot(axis);
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; if (faceDir(a, b, c) > 0) vi.push(i, n, (i + 1) % n); else vi.push(i, (i + 1) % n, n); }
  const cap = new THREE.BufferGeometry(); cap.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); cap.setIndex(vi);
  // hem: tube of radius hemR swept along the loop, centred slightly inside the rim, bulging proximally
  const SEG = 10; const tp = []; const ti = [];
  for (let i = 0; i < n; i++) {
    const t = P[(i + 1) % n].clone().sub(P[(i + n - 1) % n]).normalize();
    const out = P[i].clone().sub(c); out.addScaledVector(axis, -out.dot(axis)).normalize(); // radial, in plane
    const ctr = P[i].clone().addScaledVector(out, -hemR * 0.6).addScaledVector(axis, -hemR * 0.15);
    for (let k = 0; k < SEG; k++) { const an = (k / SEG) * Math.PI * 2; const q = ctr.clone().addScaledVector(out, Math.cos(an) * hemR).addScaledVector(axis, Math.sin(an) * hemR); tp.push(q.x, q.y, q.z); }
    void t;
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < SEG; k++) { const a = i * SEG + k, b = i * SEG + (k + 1) % SEG, cc = ((i + 1) % n) * SEG + k, d = ((i + 1) % n) * SEG + (k + 1) % SEG; ti.push(a, cc, b, b, cc, d); }
  const hem = new THREE.BufferGeometry(); hem.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); hem.setIndex(ti);
  outward(hem);
  const merged = mergeGeometries([cap, hem], false); return merged;
}

/** First intersection of a ray with a geometry's surface (brute force); returns a Vector3 or null. */
function surfaceAlong(g, origin, dir) {
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); const rc = new THREE.Raycaster(origin, dir.clone().normalize(), 0, 1.0);
  const hit = rc.intersectObject(m, false)[0]; return hit ? hit.point.clone() : null;
}


// =============================================================================
// Scene layout (dm). Clean side view: contact plane z = 0, thumbs up (+Y), human arm enters from -X, robot arm
// from +X. The human hand is the near hand (its back faces the camera, +Z); the robot hand is behind it.
// Forearms come in nearly level, rising slightly toward the clasp; each wrist is bent ~26 degrees toward the
// little finger (ulnar deviation), so each hand's finger axis points a little DOWN toward the other hand's heel,
// exactly as in real handshake photographs.
// =============================================================================
// Tunable pose parameters (defaults are the shipped pose; the fit script overrides them through HS_PARAMS).
const DEFAULTS = {
  forearmDeg: 6, humanHandDeg: -33.6, robotHandDeg: -41.6,    // elbow->wrist rise / wrist->knuckles slope (deg from horizontal)
  humanPalm: [-0.265, -0.05, 0.15], robotPalm: [0.281, -0.03, -0.1], // palm centres (contact plane between them)
  humanCurl: [1.2, 76.5, 38.7], robotCurl: [15.9, 76.9, 44.9], // index-finger MCP/PIP/DIP flexion (deg); +[4,2,2] per finger
};
const PRM = { ...DEFAULTS, ...JSON.parse(process.env.HS_PARAMS || '{}') };
const FAST = !!process.env.HS_FAST; // skip creases, nails and cuff: used only by the pose-fit search
const LAYOUT = { forearmDeg: PRM.forearmDeg, handDeg: PRM.humanHandDeg, humanPalm: V3(PRM.humanPalm), robotPalm: V3(PRM.robotPalm) };
const dirAt = (deg, sx) => new THREE.Vector3(sx * Math.cos(deg * DEG), Math.sin(deg * DEG), 0);
const HUMAN_DIR = { forearm: dirAt(PRM.forearmDeg, 1), hand: dirAt(PRM.humanHandDeg, 1), palmSide: new THREE.Vector3(0, 0, -1) };
const ROBOT_DIR = { forearm: dirAt(PRM.forearmDeg, -1), hand: dirAt(PRM.robotHandDeg, -1), back: new THREE.Vector3(0, 0, -1) };
const CURLS = Object.fromEntries([2, 3, 4, 5].map((f, i) => [f, [PRM.humanCurl[0] + 4 * i, PRM.humanCurl[1] + 2 * i, PRM.humanCurl[2] + 2 * i]])); // index..pinky
const SPREAD = 4; // finger abduction per finger (deg)
const FOREARM_CUT = 0.78; // fraction of the way from elbow to wrist where the sleeve is cut
// human thumb bone directions (scene space): up from the web, then falling toward -Z onto the back of the robot hand
const HUMAN_THUMB = [new THREE.Vector3(0.5, 0.6, -0.3), new THREE.Vector3(0.7, 0.1, -0.7), new THREE.Vector3(0.7, -0.25, -0.65)];
// robot thumb segment directions (scene space): up from the web, then falling toward +Z across the human's index knuckles
const ROBOT_THUMB = [new THREE.Vector3(-0.35, 0.65, 0.35), new THREE.Vector3(-0.45, 0.2, 0.85), new THREE.Vector3(-0.4, -0.3, 0.85)];

// =============================================================================
// Human right hand: pose forearm + hand + fingers, extract hand + forearm (cut mid-forearm), add the shirt
// sleeve with a rolled cuff, subdivide/smooth, add finger creases + nails. Returns { skin, sleeve } geometries.
// =============================================================================
function buildHumanHand() {
  const V = morphBase([['caucasian-male-young', 1 / 3], ['african-male-young', 1 / 3], ['asian-male-young', 1 / 3]]);
  // rest-pose hand frame: f = wrist->middle MCP, h = index MCP -> pinky MCP (knuckle line), palm normal = f x h
  const restJ = (j) => { const ids = rig.joints[j]; const c = new THREE.Vector3(); for (const i of ids) c.add(V3(V[i])); return c.multiplyScalar(1 / ids.length); };
  const rW = restJ('wrist.R____head'), rM = restJ('finger3-1.R____head'), rI = restJ('finger2-1.R____head'), rP = restJ('finger5-1.R____head');
  const rf = rM.clone().sub(rW).normalize(); const rh = rP.clone().sub(rI).normalize(); const rn = rf.clone().cross(rh).normalize();
  const hinge = rh.clone().negate().toArray(); // rotating about (pinky -> index) by +deg curls the fingertips toward the palm
  const mkPose = (aimWrist, tw, thumbAims) => {
    const pose = {
      'lowerarm01.R': { aim: HUMAN_DIR.forearm.toArray(), twist: tw * 0.35 }, 'lowerarm02.R': { aim: HUMAN_DIR.forearm.toArray(), twist: tw * 0.3 },
      'wrist.R': { aim: aimWrist.toArray(), twist: tw * 0.35 },
    };
    for (const [f, [m, pp, d]] of Object.entries(CURLS)) { pose[`finger${f}-1.R`] = { axisRot: [[hinge, m], [rn.toArray(), (f - 3.5) * SPREAD]] }; pose[`finger${f}-2.R`] = { axisRot: [[hinge, pp]] }; pose[`finger${f}-3.R`] = { axisRot: [[hinge, d]] }; }
    if (thumbAims) thumbAims.forEach((d, k) => { pose[`finger1-${k + 1}.R`] = { aim: d.clone().normalize().toArray() }; });
    return pose;
  };
  // iterate the wrist aim + roll until the hand axis and palm normal match the target
  const aimWrist = HUMAN_DIR.hand.clone(); let tw = 0; let posed;
  for (let it = 0; it < 5; it++) {
    posed = poseRig(V, mkPose(aimWrist, tw, HUMAN_THUMB));
    const wrist = posed.pos.get('wrist.R'), mcp = posed.pos.get('finger3-1.R');
    const f = mcp.clone().sub(wrist).normalize();
    aimWrist.add(HUMAN_DIR.hand.clone().sub(f)).normalize();
    const hh = posed.pos.get('finger5-1.R').clone().sub(posed.pos.get('finger2-1.R'));
    const n = f.clone().cross(hh).normalize();
    tw += Math.atan2(n.clone().cross(HUMAN_DIR.palmSide).dot(f), n.dot(HUMAN_DIR.palmSide)) / DEG * 0.9;
  }
  const wristP = posed.pos.get('wrist.R'), mcpP = posed.pos.get('finger3-1.R');
  const M = new THREE.Matrix4().makeTranslation(...LAYOUT.humanPalm.clone().sub(wristP.clone().lerp(mcpP, 0.5)).toArray());
  const W = base.V.map((_, i) => rig.vw.get(i) || []);
  const body = skinPoints(V, W, posed.skin);
  const shirt = fitProxy(path.join(SRC, 'sysassets/clothes/male_casualsuit01/male_casualsuit01.mhclo'), V);
  const shirtP = skinPoints(shirt.P, shirt.W, posed.skin);
  const armBones = new Set(rig.bones.filter((b) => /\.R$/.test(b.name) && /^(wrist|metacarpal|finger|lowerarm)/.test(b.name)).map((b) => b.i));
  const inArm = (w) => w.length && w.reduce((t, [bi, ww]) => t + (armBones.has(bi) ? ww : 0), 0) > 0.5;
  // cut plane: part-way along the forearm, perpendicular to its axis; faces crossing it are clamped onto it
  const elbow = posed.pos.get('lowerarm01.R');
  const axis = wristP.clone().sub(elbow).normalize();
  const cutAt = elbow.clone().lerp(wristP, FOREARM_CUT);
  const beyond = (p) => V3(p).sub(cutAt).dot(axis) > 0;
  const keep = (P, Wl) => (f) => f.idx.every((i) => inArm(Wl[i])) && f.idx.some((i) => beyond(P[i]));
  let skinG = clampToPlane(mergeVertices(facesToGeometry(body, bodyFaces, keep(body, W)), 1e-5), cutAt, axis);
  let sleeveG = clampToPlane(mergeVertices(facesToGeometry(shirtP, shirt.faces, keep(shirtP, shirt.W)), 1e-5), cutAt, axis);
  skinG = subdivideSmooth(skinG, FAST ? 1 : 3); sleeveG = FAST ? sleeveG : subdivideSmooth(sleeveG, 2);
  skinG.computeVertexNormals();
  // ---- skin detail in posed space: finger creases on the inside of each joint, nail beds on the fingertips ----
  const palmDir = (bone) => rn.clone().applyQuaternion(posed.rot.get(bone));
  const sp0 = skinG.attributes.position, nrm = skinG.attributes.normal; const vtx = new THREE.Vector3(), nv = new THREE.Vector3();
  const creases = [];
  for (const n of [2, 3, 4, 5]) for (const k of [1, 2, 3]) creases.push({ bone: `finger${n}-${k}.R`, depth: k === 1 ? 0.016 : 0.022, sigma: 0.034, side: 1 });
  for (const k of [2, 3]) creases.push({ bone: `finger1-${k}.R`, depth: 0.02, sigma: 0.034, side: 1 });
  for (const n of [2, 3, 4, 5]) creases.push({ bone: `finger${n}-2.R`, depth: 0.011, sigma: 0.03, side: -1 }); // dorsal knuckle wrinkles
  for (const cr of FAST ? [] : creases) {
    const h = posed.pos.get(cr.bone); const t = posed.tailPos(cr.bone).sub(h).normalize(); const pd = palmDir(cr.bone);
    for (let i = 0; i < sp0.count; i++) {
      vtx.fromBufferAttribute(sp0, i); const d = vtx.clone().sub(h); const ax = d.dot(t); if (Math.abs(ax) > cr.sigma * 3) continue;
      const rad = d.clone().addScaledVector(t, -ax).length(); if (rad > 0.3) continue;
      nv.fromBufferAttribute(nrm, i); const facing = THREE.MathUtils.smoothstep(nv.dot(pd) * cr.side, 0.1, 0.55); if (facing <= 0) continue;
      const w = Math.exp(-((ax / cr.sigma) ** 2)) * facing; vtx.addScaledVector(nv, -cr.depth * w); sp0.setXYZ(i, vtx.x, vtx.y, vtx.z);
    }
  }
  const nails = [];
  for (const n of FAST ? [] : [1, 2, 3, 4, 5]) {
    const bone = `finger${n}-3.R`; const h = posed.pos.get(bone); const tl = posed.tailPos(bone); const L = tl.clone().sub(h); const t = L.clone().normalize();
    const dorsal = palmDir(bone).negate().sub(t.clone().multiplyScalar(palmDir(bone).negate().dot(t))).normalize();
    const w = n === 1 ? 0.115 : 0.088, len = n === 1 ? 0.14 : 0.115;
    const c0 = h.clone().addScaledVector(L, 0.58); const surf = surfaceAlong(skinG, c0.clone().addScaledVector(dorsal, 0.3), dorsal.clone().negate());
    const c = surf ?? c0.clone().addScaledVector(dorsal, 0.075);
    const plate = new THREE.CapsuleGeometry(w / 2, len - w, 4, 14); plate.rotateX(Math.PI / 2); plate.scale(1, 0.3, 1); plate.deleteAttribute('uv'); plate.deleteAttribute('normal');
    const x = t.clone().cross(dorsal).normalize(); const basis = new THREE.Matrix4().makeBasis(x, dorsal, t).setPosition(c.addScaledVector(dorsal, -0.002));
    plate.applyMatrix4(basis); nails.push(plate);
  }
  skinG.computeVertexNormals();
  const cuff = FAST ? new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3)).setIndex([0, 1, 2]) : sleeveEnd(sleeveG, cutAt, axis, 0.05);
  const fin = (g) => { g.deleteAttribute('uv'); g.deleteAttribute('normal'); g.applyMatrix4(M); return g.index ? g : mergeVertices(g, 1e-6); };
  const skinParts = [skinG, ...nails].map(fin); for (const pc of skinParts.slice(1)) outward(pc);
  const skin = mergeGeometries(skinParts, false); skin.computeVertexNormals();
  const sleeve = mergeGeometries([sleeveG, cuff].map(fin), false); sleeve.computeVertexNormals();
  const tip = (n) => posed.tailPos(n).applyMatrix4(M); const fmt = (v) => v.toArray().map((x) => x.toFixed(2)).join(',');
  console.log('human: tris', (skin.index.count + sleeve.index.count) / 3, 'index tip', fmt(tip('finger2-3.R')), 'pinky tip', fmt(tip('finger5-3.R')), 'thumb tip', fmt(tip('finger1-3.R')), 'wrist', fmt(wristP.clone().applyMatrix4(M)));
  return { skin, sleeve };
}

// =============================================================================
// Robot right hand, built in a glove frame: fingers +Z, thumb side +X, back of hand +Y, palm -Y. Parts are
// tagged panel (shell, mid grey) or joint (pins, knuckles, seams, cables, bellows: dark) and hand or arm. The
// hand is placed in the scene along the robot's finger axis; the arm is rotated about the wrist so the forearm
// comes in nearly level (ulnar deviation at the wrist), as in the photographs.
// =============================================================================
const rbox = (w, h, d, r, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, r);
const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const RX = (deg) => new THREE.Matrix4().makeRotationX(deg * DEG);
function buildRobotHand() {
  const groups = { panel: { hand: [], arm: [] }, joint: { hand: [], arm: [] } };
  let grp = 'hand';
  const add = (g, m, kind = 'panel') => { g.deleteAttribute('uv'); g.deleteAttribute('normal'); if (m) g.applyMatrix4(m); groups[kind][grp].push(g); };
  const PALM_W = 0.88, PALM_T = 0.24, PALM_L = 0.92, GAP = 0.015;
  // glove frame -> scene
  const fB = ROBOT_DIR.hand.clone(), bB = ROBOT_DIR.back.clone(); const aB = bB.clone().cross(fB).normalize(); // a = back x f
  const toBuild = (d) => new THREE.Vector3(d.dot(aB), d.dot(bB), d.dot(fB)).normalize();
  // ---- palm: back plate + palm plate with a seam, dark core in the gap, raised back panel with vents ----
  const plateH = (PALM_T - GAP) / 2;
  add(rbox(PALM_W, plateH, PALM_L, 0.05), T(0, GAP / 2 + plateH / 2, PALM_L / 2 + 0.04));
  add(rbox(PALM_W - 0.04, plateH, PALM_L - 0.02, 0.05), T(0, -GAP / 2 - plateH / 2, PALM_L / 2 + 0.05));
  add(rbox(PALM_W - 0.06, GAP + 0.02, PALM_L - 0.06, 0.005, 1), T(0, 0, PALM_L / 2 + 0.04), 'joint');
  add(rbox(0.5, 0.03, 0.46, 0.012, 2), T(-0.08, PALM_T / 2 + 0.005, 0.5));
  for (let i = 0; i < 5; i++) add(rbox(0.03, 0.02, 0.16, 0.006, 1), T(0.26 + i * 0.045 - 0.1, PALM_T / 2 + 0.01, 0.3), 'joint');
  for (const sx of [-1, 1]) add(rbox(0.06, 0.012, 0.12, 0.004, 1), T(sx * 0.3, PALM_T / 2 + 0.006, 0.82));
  add(rbox(PALM_W - 0.2, 0.03, PALM_L - 0.3, 0.012, 2), T(0, -PALM_T / 2 - 0.005, 0.55)); // grip pad
  // ---- phalanx chain along a local frame m: pin-jointed segments ----
  const pins = (m, w, r) => { for (const sx of [-1, 1]) { const pin = new THREE.CylinderGeometry(r, r, 0.025, 16); pin.rotateZ(Math.PI / 2); add(pin, m.clone().multiply(T(sx * (w / 2 + 0.02), 0, 0)), 'joint'); } };
  const finger = (x, zBase, lens, widths, angles, spread = 0) => {
    let m = T(x, 0, zBase).multiply(new THREE.Matrix4().makeRotationY(spread * DEG));
    for (let k = 0; k < lens.length; k++) {
      const L = lens[k], w = widths[k], h = w * 0.92;
      m = m.clone().multiply(RX(angles[k]));
      const knuckle = new THREE.CylinderGeometry(h * 0.52, h * 0.52, w + 0.02, 24); knuckle.rotateZ(Math.PI / 2); add(knuckle, m.clone(), 'joint');
      pins(m, w, 0.03);
      const body = rbox(w, h, L - 0.02, Math.min(0.04, w * 0.3)); body.translate(0, 0, L / 2 + 0.03);
      if (k === lens.length - 1) {
        const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const t = Math.max(0, (p.getZ(i) - 0.03) / L); const sc = 1 - 0.22 * t; p.setX(i, p.getX(i) * sc); p.setY(i, p.getY(i) * sc - 0.01 * t); }
        const pad = rbox(w * 0.7, 0.02, L * 0.55, 0.008, 2); pad.translate(0, -h / 2 + 0.002, L * 0.6); add(pad, m.clone(), 'joint');
      } else { const cap = rbox(w - 0.04, h + 0.012, 0.03, 0.005, 1); cap.translate(0, 0, L - 0.05); add(cap, m.clone(), 'joint'); }
      add(body, m.clone());
      m = m.clone().multiply(T(0, 0, L));
    }
  };
  const F = [
    { x: 0.32, z: 0.95, len: [0.42, 0.27, 0.22], w: [0.19, 0.17, 0.15], ang: ROBOT_CURL[0], spread: -3 },
    { x: 0.11, z: 0.98, len: [0.46, 0.30, 0.23], w: [0.19, 0.17, 0.15], ang: ROBOT_CURL[1], spread: -1 },
    { x: -0.11, z: 0.95, len: [0.42, 0.28, 0.22], w: [0.18, 0.16, 0.14], ang: ROBOT_CURL[2], spread: 1 },
    { x: -0.32, z: 0.86, len: [0.34, 0.22, 0.19], w: [0.16, 0.14, 0.13], ang: ROBOT_CURL[3], spread: 3 },
  ];
  for (const fd of F) finger(fd.x, fd.z, fd.len, fd.w, fd.ang, fd.spread);
  // ---- thumb: CMC block on the thumb-side edge, then two phalanges along explicit (scene-derived) directions ----
  {
    const segment = (p, d, L, w, h, { tip = false, cmc = false } = {}) => {
      const z = d.clone().normalize(); const x = new THREE.Vector3(0, 1, 0).cross(z).normalize(); const y = z.clone().cross(x).normalize();
      const m = new THREE.Matrix4().makeBasis(x, y, z).setPosition(p);
      if (!cmc) { const knuckle = new THREE.CylinderGeometry(h * 0.52, h * 0.52, w + 0.02, 24); knuckle.rotateZ(Math.PI / 2); add(knuckle, m.clone(), 'joint'); pins(m, w, 0.032); }
      const body = rbox(w, h, L - 0.02, Math.min(0.045, w * 0.3)); body.translate(0, 0, L / 2 + (cmc ? 0 : 0.03));
      if (tip) { const q = body.attributes.position; for (let i = 0; i < q.count; i++) { const t = Math.max(0, (q.getZ(i) - 0.03) / L); const sc = 1 - 0.2 * t; q.setX(i, q.getX(i) * sc); q.setY(i, q.getY(i) * sc); } }
      else { const cap = rbox(w - 0.04, h + 0.012, 0.03, 0.005, 1); cap.translate(0, 0, L - 0.05); add(cap, m.clone(), 'joint'); }
      add(body, m.clone());
      return p.clone().add(z.multiplyScalar(L));
    };
    let p = new THREE.Vector3(PALM_W / 2 - 0.1, -0.04, 0.2);
    p = segment(p, toBuild(ROBOT_THUMB[0]).lerp(new THREE.Vector3(0.1, -0.2, 0.95), 0.4), 0.38, 0.25, 0.22, { cmc: true });
    p = segment(p, toBuild(ROBOT_THUMB[1]), 0.3, 0.2, 0.18);
    p = segment(p, toBuild(ROBOT_THUMB[2]), 0.24, 0.17, 0.15, { tip: true });
  }
  // ---- wrist (arm group): actuator ring with bolt heads, then bellows ----
  grp = 'arm';
  const ell = (g, sy = 0.78) => { g.scale(1, sy, 1); return g; };
  add(ell(new THREE.CylinderGeometry(0.31, 0.31, 0.3, 48).rotateX(Math.PI / 2)), T(0, 0, -0.1));
  add(ell(new THREE.TorusGeometry(0.31, 0.03, 12, 48)), T(0, 0, -0.26), 'joint');
  for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2 + 0.3; const bolt = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12); bolt.rotateX(Math.PI / 2); bolt.translate(Math.cos(an) * 0.25, Math.sin(an) * 0.25 * 0.78, 0.06); add(bolt, null, 'joint'); }
  {
    const prof = []; const n = 5; const z0 = -0.28, z1 = -0.72;
    prof.push(new THREE.Vector2(0.28, 0));
    for (let i = 0; i <= n; i++) { const t = i / n; const z = z0 + (z1 - z0) * t; prof.push(new THREE.Vector2(i % 2 ? 0.245 : 0.30, -z)); }
    prof.push(new THREE.Vector2(0.28, -z1 + 0.02));
    const bel = new THREE.LatheGeometry(prof, 48); bel.rotateX(Math.PI / 2); bel.scale(1, 0.78, -1); add(bel, null, 'joint');
  }
  // ---- forearm shell: tapering elliptical shell with seams, cable channel, screw heads ----
  {
    const K = 0.22; // forearm length factor: short enough that the hands fill the frame at site size
    const prof = [[0, 0], [0.26, 0], [0.32, 0.03], [0.35, 0.12], [0.36, 0.3], [0.35, 0.33], [0.36, 0.36], [0.39, 0.7], [0.43, 1.0], [0.46, 1.2], [0.46, 1.25], [0.43, 1.29], [0.41, 1.34], [0.43, 1.37], [0.46, 1.41], [0.46, 1.45], [0.38, 1.48], [0, 1.48]].map(([r, y]) => [r, y * K]);
    const shell = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64); shell.rotateX(Math.PI / 2); shell.scale(1, 0.78, -1); shell.translate(0, 0, -0.72);
    add(shell);
    for (const sx of [-1, 1]) add(rbox(0.045, 0.07, 0.4, 0.012, 2), T(sx * 0.1, -0.78 * 0.44 - 0.02, -1.0));
    const cable = new THREE.CylinderGeometry(0.035, 0.035, 0.46, 16); cable.rotateX(Math.PI / 2); add(cable, T(0, -0.78 * 0.44 - 0.01, -1.0), 'joint');
    for (const z of [-0.85, -1.15]) add(rbox(0.3, 0.05, 0.08, 0.01, 2), T(0, -0.78 * 0.44 - 0.02, z));
    for (const z of [-0.9, -1.12]) { const sh = new THREE.CylinderGeometry(0.045, 0.045, 0.016, 16); sh.rotateZ(Math.PI / 2); sh.translate(0.4, 0.0, z); add(sh, null, 'joint'); const slot = rbox(0.012, 0.012, 0.06, 0.003, 1); slot.translate(0.409, 0, z); add(slot, null, 'panel'); }
    add(rbox(0.016, 0.26, 0.24, 0.004, 1), T(-0.4, 0.02, -1.0));
  }
  // glove frame -> scene: hand origin so the palm centre (local z = 0.5) sits at robotPalm; arm rotated about the wrist
  const origin = LAYOUT.robotPalm.clone().addScaledVector(fB, -0.5);
  const handM = new THREE.Matrix4().makeBasis(aB, bB, fB).setPosition(origin);
  const armNow = Math.atan2(-fB.y, -fB.x), armWant = Math.atan2(-ROBOT_DIR.forearm.y, -ROBOT_DIR.forearm.x);
  const bend = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z).multiply(new THREE.Matrix4().makeRotationZ(armWant - armNow)).multiply(new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z));
  const armM = bend.clone().multiply(handM);
  const build = (kind) => {
    const list = [...groups[kind].hand.map((g) => g.applyMatrix4(handM)), ...groups[kind].arm.map((g) => g.applyMatrix4(armM))];
    const g = mergeVertices(mergeGeometries(list.map((p) => outward(mergeVertices(p, 1e-5))), false), 1e-5); g.computeVertexNormals(); return g;
  };
  return { panel: build('panel'), joint: build('joint') };
}

// robot finger flexion (MCP, PIP, DIP in degrees) for index..pinky
const ROBOT_CURL = [0, 1, 2, 3].map((i) => [PRM.robotCurl[0] + 4 * i, PRM.robotCurl[1] + 2 * i, PRM.robotCurl[2] + 2 * i]);

// =============================================================================
// Export: four meshes (materials carry the grey the site loader maps to shade): skin 0.85, sleeve 0.55,
// robot panels 0.40, robot joints 0.15. Then weld/quantize/meshopt with gltf-transform.
// =============================================================================
const SCENE_YAW = (process.env.HS_YAW ? parseFloat(process.env.HS_YAW) : 0) * DEG; // optional small rotation of the whole clasp about Y
const scene = new THREE.Scene(); let tris = 0;
const mats = {};
const grey = (name, l, rough = 0.55) => { mats[name] = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(l, l, l, THREE.LinearSRGBColorSpace), roughness: rough, metalness: 0 }); mats[name].name = name; return mats[name]; };
grey('skin', 0.85); grey('sleeve', 0.55); grey('robot_panel', 0.40); grey('robot_joint', 0.15);
const addMesh = (name, mat, g) => { g.applyMatrix4(new THREE.Matrix4().makeRotationY(SCENE_YAW)); g.computeVertexNormals(); tris += g.index.count / 3; const m = new THREE.Mesh(g, mats[mat]); m.name = name; scene.add(m); };
if (ONLY !== '--robot-only') { const h = buildHumanHand(); addMesh('human_skin', 'skin', h.skin); addMesh('human_sleeve', 'sleeve', h.sleeve); }
if (ONLY !== '--human-only') { const r = buildRobotHand(); addMesh('robot_panel', 'robot_panel', r.panel); addMesh('robot_joint', 'robot_joint', r.joint); }
const buf = await new GLTFExporter().parseAsync(scene, { binary: true });
const tmp = OUT.replace(/\.glb$/, '.raw.glb'); fs.writeFileSync(tmp, Buffer.from(buf));
if (process.env.HS_SKIP_COMPRESS) { fs.renameSync(tmp, OUT); console.log(JSON.stringify({ tris, out: OUT })); process.exit(0); }
execFileSync('npx', ['-y', '@gltf-transform/cli', 'meshopt', tmp, OUT, '--level', 'high'], { stdio: ['ignore', 'ignore', 'inherit'] });
if (process.env.KEEP_RAW) fs.copyFileSync(tmp, process.env.KEEP_RAW); // uncompressed copy for analysis (identity node transforms)
fs.unlinkSync(tmp);
console.log(JSON.stringify({ tris, bytes: fs.statSync(OUT).size, out: OUT }));
