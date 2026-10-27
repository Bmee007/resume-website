// Builds public/models/handshake.glb: a human right hand (MakeHuman CC0 base mesh, posed with the default
// rig, cut at mid-forearm under a shirt cuff) clasped with a procedurally generated industrial robot right
// hand (segmented fingers with pin joints, split palm plates, wrist bellows, tapering forearm shell with a
// cable channel). Forearms enter from the lower left (human) and lower right (robot); hands meet at the
// centre with both thumbs on top; the human hand is the near (camera-side) hand, as in a handshake photo.
//
// Units: decimetres (MakeHuman native). Y up, front = +Z. Geometry only; exported via three's GLTFExporter,
// then quantized + meshopt-compressed with gltf-transform.
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
    if (spec.aim) { const d0 = tail.get(b.name).clone().sub(head.get(b.name)).normalize().applyQuaternion(R); R = new THREE.Quaternion().setFromUnitVectors(d0, V3(spec.aim).normalize()).multiply(R); }
    if (spec.twist) { const axis = tail.get(b.name).clone().sub(head.get(b.name)).normalize().applyQuaternion(R); R = new THREE.Quaternion().setFromAxisAngle(axis, spec.twist * DEG).multiply(R); }
    Rw.set(b.name, R); pw.set(b.name, P);
    skin.push(new THREE.Matrix4().compose(P, R, new THREE.Vector3(1, 1, 1)).multiply(new THREE.Matrix4().makeTranslation(-head.get(b.name).x, -head.get(b.name).y, -head.get(b.name).z)));
  }
  const tailPos = (n) => tail.get(n).clone().sub(head.get(n)).applyQuaternion(Rw.get(n)).add(pw.get(n));
  return { skin, pos: pw, tailPos };
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

// =============================================================================
// Scene frame. Palm axes rise at THETA from the horizontal; the human hand is the near hand (palm faces -Z).
// Frames are [thumbSide | backOfHand | fingers] as columns.
// =============================================================================
const THETA = 32 * DEG;
const c = Math.cos(THETA), s = Math.sin(THETA);
const HUMAN = { f: new THREE.Vector3(c, s, 0), a: new THREE.Vector3(-s, c, 0), back: new THREE.Vector3(0, 0, 1), centre: new THREE.Vector3(-0.42, -0.02, 0.19), pronate: -12 * DEG };
const ROBOT = { f: new THREE.Vector3(-c, s, 0), a: new THREE.Vector3(s, c, 0), back: new THREE.Vector3(0, 0, -1), centre: new THREE.Vector3(0.42, -0.02, -0.19), pronate: 10 * DEG };
const frameMatrix = (F) => {
  const tw = new THREE.Quaternion().setFromAxisAngle(F.f, F.pronate);
  const a = F.a.clone().applyQuaternion(tw), b = F.back.clone().applyQuaternion(tw);
  return new THREE.Matrix4().makeBasis(a, b, F.f).setPosition(F.centre);
};

// =============================================================================
// Human right hand: pose the fingers into a grip, extract hand + forearm (cut mid-forearm), add the shirt
// sleeve with its cuff, and a rounded ring to hide the cut.
// =============================================================================
function buildHumanHand() {
  const V = morphBase([['caucasian-male-young', 1 / 3], ['african-male-young', 1 / 3], ['asian-male-young', 1 / 3]]);
  const pose = {
    'wrist.R': { rot: [8, 0, 0] },
    'finger1-1.R': { rot: [22, 0, 40] }, 'finger1-2.R': { rot: [28, 0, 0] }, 'finger1-3.R': { rot: [30, 0, 0] }, // thumb across the top
  };
  const curls = { 2: [70, 62, 30], 3: [76, 68, 34], 4: [80, 72, 36], 5: [84, 76, 40] }; // index .. pinky: MCP, PIP, DIP
  for (const [f, [m, p, d]] of Object.entries(curls)) { pose[`finger${f}-1.R`] = { rot: [m, 0, (f - 3.5) * -3] }; pose[`finger${f}-2.R`] = { rot: [p, 0, 0] }; pose[`finger${f}-3.R`] = { rot: [d, 0, 0] }; }
  const posed = poseRig(V, pose);
  const W = base.V.map((_, i) => rig.vw.get(i) || []);
  const body = skinPoints(V, W, posed.skin);
  const shirt = fitProxy(path.join(SRC, 'sysassets/clothes/male_casualsuit01/male_casualsuit01.mhclo'), V);
  const shirtP = skinPoints(shirt.P, shirt.W, posed.skin);
  // bones belonging to the right hand / forearm
  const armBones = new Set(rig.bones.filter((b) => /\.R$/.test(b.name) && /^(wrist|metacarpal|finger|lowerarm)/.test(b.name)).map((b) => b.i));
  const inArm = (w) => w.length && w.reduce((t, [bi, ww]) => t + (armBones.has(bi) ? ww : 0), 0) > 0.5;
  // cut plane: mid-forearm, perpendicular to the forearm axis
  const elbow = posed.pos.get('lowerarm01.R'), wrist = posed.pos.get('wrist.R');
  const axis = wrist.clone().sub(elbow).normalize();
  const cutAt = elbow.clone().lerp(wrist, 0.42);
  const beyond = (p) => V3(p).sub(cutAt).dot(axis) > 0;
  const keep = (P, Wl) => (f) => f.idx.every((i) => inArm(Wl[i]) && beyond(P[i]));
  const skinG = facesToGeometry(body, bodyFaces, keep(body, W));
  const sleeveG = facesToGeometry(shirtP, shirt.faces, keep(shirtP, shirt.W));
  // hand frame from the posed joints (right hand: palm normal = a x f, back = f x a)
  const mcp = posed.tailPos('metacarpal2.R').add(posed.tailPos('metacarpal3.R')).multiplyScalar(0.5);
  const f = mcp.clone().sub(wrist).normalize();
  const aRaw = posed.tailPos('metacarpal1.R').sub(posed.tailPos('metacarpal4.R'));
  const a = aRaw.sub(f.clone().multiplyScalar(aRaw.dot(f))).normalize();
  // palm side = the side the curled fingers went to (robust to handedness/sign conventions)
  let back = f.clone().cross(a).normalize();
  const curlDir = posed.tailPos('finger3-3.R').sub(posed.tailPos('metacarpal2.R'));
  console.log('DBG curl.back', curlDir.dot(back).toFixed(3), 'curl.f', curlDir.dot(f).toFixed(3), 'curl.a', curlDir.dot(a).toFixed(3));
  if (curlDir.dot(back) > 0) back.negate();
  const palmCentre = wrist.clone().lerp(mcp, 0.5);
  const local = new THREE.Matrix4().makeBasis(a, back, f).setPosition(palmCentre);
  const M = frameMatrix(HUMAN).multiply(local.clone().invert());
  // cuff ring at the cut: lathe (rounded rim) around the forearm axis, sized from the sleeve cross-section there
  const cutLocal = cutAt.clone().applyMatrix4(M); const axisW = axis.clone().transformDirection(M);
  let rMax = 0; const sp = sleeveG.attributes.position;
  for (let i = 0; i < sp.count; i++) { const p = new THREE.Vector3().fromBufferAttribute(sp, i).applyMatrix4(M); const d = p.sub(cutLocal); const t = d.dot(axisW); if (t < 0.25) rMax = Math.max(rMax, d.sub(axisW.clone().multiplyScalar(t)).length()); }
  const R = rMax + 0.03;
  const prof = [[0, -0.02], [R - 0.12, -0.02], [R - 0.04, 0.0], [R, 0.05], [R + 0.02, 0.14], [R + 0.01, 0.26], [R - 0.03, 0.34], [R - 0.12, 0.36], [0, 0.36]];
  const cuff = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64);
  cuff.rotateX(Math.PI / 2); // lathe axis Y -> Z; then align +Z with -axis (ring extends proximally)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axisW.clone().negate());
  cuff.applyQuaternion(q); cuff.translate(cutLocal.x - axisW.x * -0.02, cutLocal.y - axisW.y * -0.02, cutLocal.z - axisW.z * -0.02);
  for (const g of [skinG, sleeveG]) g.applyMatrix4(M);
  cuff.deleteAttribute('uv'); cuff.deleteAttribute('normal');
  const g = mergeVertices(mergeGeometries([mergeVertices(skinG, 1e-5), mergeVertices(sleeveG, 1e-5), mergeVertices(cuff, 1e-5)], false), 1e-5);
  g.computeVertexNormals();
  const tip = (n) => posed.tailPos(n).applyMatrix4(M);
  console.log('DBG scene: wrist', wrist.clone().applyMatrix4(M).toArray().map((v)=>v.toFixed(2)).join(','), 'mcp', mcp.clone().applyMatrix4(M).toArray().map((v)=>v.toFixed(2)).join(','), 'index MCP', posed.tailPos('metacarpal1.R').applyMatrix4(M).toArray().map((v)=>v.toFixed(2)).join(','), 'index PIP', posed.tailPos('finger2-1.R').applyMatrix4(M).toArray().map((v)=>v.toFixed(2)).join(','), 'thumb CMC', posed.pos.get('finger1-1.R').clone().applyMatrix4(M).toArray().map((v)=>v.toFixed(2)).join(','));
  console.log('human: cuff R', R.toFixed(2), 'index tip', tip('finger2-3.R').toArray().map((v) => v.toFixed(2)).join(','), 'pinky tip', tip('finger5-3.R').toArray().map((v) => v.toFixed(2)).join(','), 'thumb tip', tip('finger1-3.R').toArray().map((v) => v.toFixed(2)).join(','));
  return g;
}

// =============================================================================
// Robot right hand, built in a glove frame: fingers +Z, thumb side +X, back of hand +Y, palm -Y. Then
// mapped into the scene with frameMatrix(ROBOT).
// =============================================================================
const rbox = (w, h, d, r, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, r);
const xform = (g, m) => { g.applyMatrix4(m); return g; };
const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const RX = (deg) => new THREE.Matrix4().makeRotationX(deg * DEG);
const THUMB_DIR = [new THREE.Vector3(0.28, -0.5, 0.8), new THREE.Vector3(0.05, -0.55, 0.83)];
function buildRobotHand() {
  const parts = [];
  const add = (g, m) => parts.push(m ? xform(g, m) : g);
  const PALM_W = 0.88, PALM_T = 0.30, PALM_L = 0.92, GAP = 0.015;
  // ---- palm: back plate + palm plate with a seam, dark core in the gap, raised back panel with vents ----
  const plateH = (PALM_T - GAP) / 2;
  add(rbox(PALM_W, plateH, PALM_L, 0.05), T(0, GAP / 2 + plateH / 2, PALM_L / 2 + 0.04));            // back plate
  add(rbox(PALM_W - 0.04, plateH, PALM_L - 0.02, 0.05), T(0, -GAP / 2 - plateH / 2, PALM_L / 2 + 0.05)); // palm plate
  add(rbox(PALM_W - 0.06, GAP + 0.02, PALM_L - 0.06, 0.005, 1), T(0, 0, PALM_L / 2 + 0.04));            // core (seam floor)
  add(rbox(0.5, 0.03, 0.46, 0.012, 2), T(-0.08, PALM_T / 2 + 0.005, 0.5));                               // raised back panel
  for (let i = 0; i < 5; i++) add(rbox(0.03, 0.02, 0.16, 0.006, 1), T(0.26 + i * 0.045 - 0.1, PALM_T / 2 + 0.01, 0.3)); // vent ribs
  for (const sx of [-1, 1]) add(rbox(0.06, 0.012, 0.12, 0.004, 1), T(sx * 0.3, PALM_T / 2 + 0.006, 0.82)); // knuckle plate tabs
  // palm-side pad (grip surface)
  add(rbox(PALM_W - 0.2, 0.03, PALM_L - 0.3, 0.012, 2), T(0, -PALM_T / 2 - 0.005, 0.55));
  // ---- fingers: chain of phalanges with pin joints ----
  const finger = (x, zBase, lens, widths, angles, spread = 0) => {
    let m = T(x, 0, zBase).multiply(new THREE.Matrix4().makeRotationY(spread * DEG));
    for (let k = 0; k < lens.length; k++) {
      const L = lens[k], w = widths[k], h = w * 0.92;
      m = m.clone().multiply(RX(angles[k]));
      // knuckle: cylinder across the joint (hinge axis X) + pin heads
      const knuckle = new THREE.CylinderGeometry(h * 0.52, h * 0.52, w + 0.02, 24); knuckle.rotateZ(Math.PI / 2);
      add(knuckle, m.clone());
      for (const sx of [-1, 1]) { const pin = new THREE.CylinderGeometry(0.03, 0.03, 0.025, 16); pin.rotateZ(Math.PI / 2); add(pin, m.clone().multiply(T(sx * (w / 2 + 0.02), 0, 0))); }
      // phalanx body: rounded box with a slight taper, split line near the joint
      const body = rbox(w, h, L - 0.02, Math.min(0.04, w * 0.3)); body.translate(0, 0, L / 2 + 0.03);
      if (k === lens.length - 1) { // fingertip: tapered shell + pad
        const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const t = Math.max(0, (p.getZ(i) - 0.03) / L); const sc = 1 - 0.22 * t; p.setX(i, p.getX(i) * sc); p.setY(i, p.getY(i) * sc - 0.01 * t); } body.computeVertexNormals();
        const pad = rbox(w * 0.7, 0.02, L * 0.55, 0.008, 2); pad.translate(0, -h / 2 + 0.002, L * 0.6); add(pad, m.clone());
      } else { const cap = rbox(w - 0.04, h + 0.012, 0.03, 0.005, 1); cap.translate(0, 0, L - 0.05); add(cap, m.clone()); }
      add(body, m.clone());
      m = m.clone().multiply(T(0, 0, L));
    }
    return m;
  };
  const F = [ // index, middle, ring, pinky (x from thumb side), knuckle z, lengths, widths, flexion angles
    { x: 0.32, z: 0.95, len: [0.42, 0.27, 0.22], w: [0.19, 0.17, 0.15], ang: [78, 62, 26], spread: -4 },
    { x: 0.11, z: 0.98, len: [0.46, 0.30, 0.23], w: [0.19, 0.17, 0.15], ang: [82, 66, 28], spread: -1 },
    { x: -0.11, z: 0.95, len: [0.42, 0.28, 0.22], w: [0.18, 0.16, 0.14], ang: [86, 70, 30], spread: 2 },
    { x: -0.32, z: 0.86, len: [0.34, 0.22, 0.19], w: [0.16, 0.14, 0.13], ang: [90, 74, 32], spread: 5 },
  ];
  for (const fd of F) finger(fd.x, fd.z, fd.len, fd.w, fd.ang, fd.spread);
  // ---- thumb: CMC block on the thumb-side edge, two phalanges following explicit directions so the thumb
  // lies across the back of the human hand (toward -Y = palm side, along +Z/+X) ----
  {
    const segment = (p, d, L, w, h, { tip = false, cmc = false } = {}) => {
      const z = d.clone().normalize(); const x = new THREE.Vector3(0, 1, 0).cross(z).normalize(); const y = z.clone().cross(x).normalize();
      const m = new THREE.Matrix4().makeBasis(x, y, z).setPosition(p);
      if (!cmc) {
        const knuckle = new THREE.CylinderGeometry(h * 0.52, h * 0.52, w + 0.02, 24); knuckle.rotateZ(Math.PI / 2); add(knuckle, m.clone());
        for (const sx of [-1, 1]) { const pin = new THREE.CylinderGeometry(0.032, 0.032, 0.025, 16); pin.rotateZ(Math.PI / 2); add(pin, m.clone().multiply(T(sx * (w / 2 + 0.02), 0, 0))); }
      }
      const body = rbox(w, h, L - 0.02, Math.min(0.045, w * 0.3)); body.translate(0, 0, L / 2 + (cmc ? 0 : 0.03));
      if (tip) { const q = body.attributes.position; for (let i = 0; i < q.count; i++) { const t = Math.max(0, (q.getZ(i) - 0.03) / L); const sc = 1 - 0.2 * t; q.setX(i, q.getX(i) * sc); q.setY(i, q.getY(i) * sc); } body.computeVertexNormals(); }
      else { const cap = rbox(w - 0.04, h + 0.012, 0.03, 0.005, 1); cap.translate(0, 0, L - 0.05); add(cap, m.clone()); }
      add(body, m.clone());
      return p.clone().add(z.multiplyScalar(L));
    };
    let p = new THREE.Vector3(PALM_W / 2 - 0.1, -0.04, 0.2);
    p = segment(p, new THREE.Vector3(0.5, -0.35, 0.72), 0.42, 0.26, 0.24, { cmc: true });
    p = segment(p, THUMB_DIR[0], 0.36, 0.21, 0.19);
    p = segment(p, THUMB_DIR[1], 0.3, 0.18, 0.16, { tip: true });
    console.log('robot thumb tip (build frame)', p.toArray().map((v) => v.toFixed(2)).join(','));
  }
  // ---- wrist: actuator ring with bolt heads, then bellows ----
  const ell = (g, sy = 0.78) => { g.scale(1, sy, 1); return g; };
  add(ell(new THREE.CylinderGeometry(0.37, 0.37, 0.3, 48).rotateX(Math.PI / 2)), T(0, 0, -0.1));
  add(ell(new THREE.TorusGeometry(0.37, 0.03, 12, 48)), T(0, 0, -0.26));
  for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2 + 0.3; const bolt = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12); bolt.rotateX(Math.PI / 2); bolt.translate(Math.cos(an) * 0.3, Math.sin(an) * 0.3 * 0.78, 0.06); add(bolt); }
  { // bellows: zigzag lathe profile
    const prof = []; const n = 5; const z0 = -0.28, z1 = -0.72;
    prof.push(new THREE.Vector2(0.33, 0));
    for (let i = 0; i <= n; i++) { const t = i / n; const z = z0 + (z1 - z0) * t; prof.push(new THREE.Vector2(i % 2 ? 0.29 : 0.355, -z)); }
    prof.push(new THREE.Vector2(0.33, -z1 + 0.02));
    const bel = new THREE.LatheGeometry(prof, 48); bel.rotateX(Math.PI / 2); bel.scale(1, 0.78, -1); add(bel);
  }
  // ---- forearm shell: tapering elliptical shell with seams, cable channel, screw heads, end rim ----
  {
    const prof = [[0, 0], [0.30, 0], [0.37, 0.03], [0.40, 0.12], [0.41, 0.3], [0.40, 0.33], [0.41, 0.36], [0.44, 0.9], [0.47, 1.5], [0.49, 1.85], [0.49, 1.9], [0.46, 1.94], [0.44, 2.0], [0.46, 2.02], [0.49, 2.06], [0.49, 2.1], [0.40, 2.13], [0, 2.13]];
    const shell = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64); shell.rotateX(Math.PI / 2); shell.scale(1, 0.78, -1); shell.translate(0, 0, -0.72);
    add(shell);
    // cable channel on the palm side (-Y): two rails and a cable between them, with clamps
    for (const sx of [-1, 1]) add(rbox(0.045, 0.07, 1.25, 0.012, 2), T(sx * 0.1, -0.78 * 0.44 - 0.02, -1.55));
    const cable = new THREE.CylinderGeometry(0.035, 0.035, 1.35, 16); cable.rotateX(Math.PI / 2); add(cable, T(0, -0.78 * 0.44 - 0.01, -1.55));
    for (const z of [-1.0, -2.1]) add(rbox(0.3, 0.05, 0.08, 0.01, 2), T(0, -0.78 * 0.44 - 0.02, z));
    // screw heads on the thumb-side flank (+X) and a small access panel on the other flank
    for (const z of [-1.1, -1.9]) { const sh = new THREE.CylinderGeometry(0.045, 0.045, 0.016, 16); sh.rotateZ(Math.PI / 2); sh.translate(0.455, 0.0, z); add(sh); const slot = rbox(0.012, 0.012, 0.06, 0.003, 1); slot.translate(0.464, 0, z); add(slot); }
    add(rbox(0.016, 0.3, 0.6, 0.004, 1), T(-0.45, 0.02, -1.5));
  }
  let g = mergeGeometries(parts.map((p) => { p.deleteAttribute('uv'); return mergeVertices(p, 1e-5); }), false);
  g = mergeVertices(g, 1e-5); g.computeVertexNormals();
  g.applyMatrix4(frameMatrix(ROBOT)); g.computeVertexNormals();
  return g;
}

// =============================================================================
const scene = new THREE.Scene(); let tris = 0;
const mat = new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.55, metalness: 0 });
const addMesh = (name, g) => { tris += g.index.count / 3; const m = new THREE.Mesh(g, mat); m.name = name; scene.add(m); };
if (ONLY !== '--robot-only') addMesh('human', buildHumanHand());
if (ONLY !== '--human-only') addMesh('robot', buildRobotHand());
const buf = await new GLTFExporter().parseAsync(scene, { binary: true });
const tmp = OUT.replace(/\.glb$/, '.raw.glb'); fs.writeFileSync(tmp, Buffer.from(buf));
execFileSync('npx', ['-y', '@gltf-transform/cli', 'meshopt', tmp, OUT, '--level', 'high'], { stdio: ['ignore', 'ignore', 'inherit'] });
fs.unlinkSync(tmp);
console.log(JSON.stringify({ tris, bytes: fs.statSync(OUT).size, out: OUT }));
