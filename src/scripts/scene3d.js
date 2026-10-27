// src/scripts/scene3d.js
// The story object as real 3D: five solid models that shatter into fragments and
// reassemble as the chapter changes. Keeps the same state contract as the old
// wireframe (morph, cx, cy, scale, opacity, rotX, rotY, tilt, ink, glow) so the
// scene director in motion/chapters.js is unchanged.

import * as THREE from 'three';
import { MODELS, loadModel } from './models.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { STATES } from './states.js';

// Shatter displacement + fade, injected into Three's physical material so lighting stays PBR.
const SHATTER_PARS_V = /* glsl */`
attribute vec3 aCenter; attribute vec3 aDir; attribute float aPhase;
uniform float uProgress;
varying float vT;`;
const SHATTER_V = /* glsl */`
float t = smoothstep(aPhase * 0.65, aPhase * 0.65 + 0.35, uProgress);
transformed = mix(transformed, aCenter, t * 0.92) + aDir * t * 1.6;
vT = t;`;
const SHATTER_PARS_F = /* glsl */`
varying float vT; uniform float uGlow; uniform vec3 uRim;`;
const SHATTER_F = /* glsl */`
if (vT > 0.96) discard;
gl_FragColor.a *= 1.0 - smoothstep(0.6, 0.96, vT);
// cool fresnel rim: separates the object from the fog and gives the clay a lit edge
float fres = pow(1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0), 3.2);
gl_FragColor.rgb += uRim * fres;
gl_FragColor.rgb += uGlow * 0.25;`;

function makeMaterial(shadeAttr) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.82, 0.86, 0.9), roughness: 0.42, metalness: 0.03,
    clearcoat: 0.45, clearcoatRoughness: 0.25, sheen: 0.2, sheenColor: new THREE.Color(0.9, 0.95, 1.0),
    transparent: true, side: THREE.DoubleSide, vertexColors: !!shadeAttr,
  });
  mat.userData.uniforms = { uProgress: { value: 1 }, uGlow: { value: 0 }, uRim: { value: new THREE.Vector3(0.22, 0.28, 0.36) } };
  mat.envMapIntensity = 1.8;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + SHATTER_PARS_V)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + SHATTER_V);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + SHATTER_PARS_F)
      .replace('#include <dithering_fragment>', SHATTER_F + '\n#include <dithering_fragment>');
  };
  return mat;
}

export function createScene(canvas, labelLayer) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(2.5, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe2f3, 0.9); rim.position.set(-3, 1.5, -2.5); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xe3eaf2, 0x55606e, 0.5));
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);
  const group = new THREE.Group();
  scene.add(group);

  const meshes = {};
  const labels = {};
  const attach = (name, geo) => {
    const mat = makeMaterial(geo.attributes.color);
    // Partial opacity + DoubleSide would blend every wall of a shell (far walls show through the skin as flecks). A depth-only
    // pre-pass with the same shatter displacement lets the blended pass draw only the nearest surface.
    mat.depthWrite = false; mat.depthFunc = THREE.LessEqualDepth;
    const preMat = makeMaterial(geo.attributes.color);
    preMat.userData.uniforms = mat.userData.uniforms;          // one set of uniforms drives both passes
    preMat.colorWrite = false; preMat.transparent = false; preMat.depthWrite = true;
    const pre = new THREE.Mesh(geo, preMat); pre.visible = false; pre.frustumCulled = false; pre.renderOrder = -1;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.userData.pre = pre;
    if (meshes[name]) { group.remove(meshes[name]); group.remove(meshes[name].userData.pre); meshes[name].geometry.dispose(); }
    group.add(pre);
    group.add(mesh);
    meshes[name] = mesh;
    labels[name] = geo.userData.labels || [];
  };
  // Procedural stand-ins first (instant). Lifelike GLBs load on demand (see ensure) so the
  // first paint doesn't pay for models whose chapters are a long scroll away.
  for (const name of STATES) if (MODELS[name]) attach(name, MODELS[name]()); // models without a stand-in appear when their GLB lands
  const loaded = new Set();
  function ensure(name) {
    if (!STATES.includes(name) || loaded.has(name)) return;
    loaded.add(name);
    loadModel(name).then((geo) => { if (geo) attach(name, geo); }).catch((e) => { loaded.delete(name); console.warn('[scene3d] model', name, e); });
  }

  // DOM labels (city names on the map)
  const labelEls = {};
  if (labelLayer) {
    for (const name of STATES) {
      labelEls[name] = (labels[name] || []).map((lb) => {
        const el = document.createElement('span');
        el.className = 'lat-label';
        el.textContent = lb.text;
        labelLayer.appendChild(el);
        return el;
      });
    }
  }

  const state = {
    morph: 4, rotY: 0.6, rotX: 0.35, tiltX: 0, tiltY: 0,
    scale: 1, opacity: 1, cx: 0.5, cy: 0.5,
    ink: [36, 46, 62], glow: 0,
    intro: 1, // loader multiplier on scale, so the intro never fights a chapter's own scale
    userY: 0, userX: 0, spinY: 0, spinX: 0, // drag rotation + inertia
  };
  const smooth = { tiltX: 0, tiltY: 0, tint: [1, 1, 1] };
  let w = 1, h = 1;

  function resize() {
    w = canvas.clientWidth || 1; h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // visible world size at z = 0 for mapping cx/cy
  const visible = () => { const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z; return [vh * camera.aspect, vh]; };
  const tmp = new THREE.Vector3();

  function render(t) {
    if (state.opacity <= 0.001) { renderer.clear(); Object.values(labelEls).flat().forEach((el) => { el.style.opacity = '0'; }); return; }
    let si, sj, f;
    if (state.blend) { si = state.blend.a; sj = state.blend.b; f = Math.max(0, Math.min(1, state.blend.t)); if (si === sj) f = 0; }
    else { const m = Math.max(0, Math.min(STATES.length - 1, state.morph)); si = Math.floor(m); sj = Math.min(STATES.length - 1, si + 1); f = m - si; }
    const ease = f * f * (3 - 2 * f);
    const isDark = state.ink[0] > 128;

    const tt = state.tint || [1, 1, 1];
    for (let i = 0; i < 3; i++) smooth.tint[i] += (tt[i] - smooth.tint[i]) * 0.08;
    smooth.tiltX += (state.tiltX - smooth.tiltX) * 0.06;
    smooth.tiltY += (state.tiltY - smooth.tiltY) * 0.06;
    const [vw, vh] = visible();
    group.position.set((state.cx - 0.5) * vw, -(state.cy - 0.5) * vh + Math.sin(t * 0.7) * 0.02, 0);
    // drag inertia: spin decays, settles back toward the chapter's pose
    state.userY += state.spinY; state.userX += state.spinX;
    state.spinY *= 0.95; state.spinX *= 0.95;
    state.userY *= 0.985; state.userX *= 0.97;
    group.rotation.set(state.rotX + smooth.tiltY * 0.18 + state.userX, state.rotY + Math.sin(t * 0.14) * 0.2 + smooth.tiltX * 0.3 + state.userY, 0);
    const base = Math.min(vw, vh) * 0.3 * state.scale * state.intro;
    group.scale.setScalar(base);

    for (const name of STATES) {
      const mesh = meshes[name]; if (!mesh) continue;
      const u = mesh.material.userData.uniforms;
      let prog = 1; // 1 = fully dissolved (hidden)
      if (si === sj) { if (name === STATES[si]) prog = 1 - (state.assemble ?? 1); }   // assembling in place
      else if (name === STATES[si]) prog = ease;
      else if (name === STATES[sj]) prog = 1 - ease;
      mesh.visible = prog < 0.999;
      if (mesh.userData.pre) mesh.userData.pre.visible = mesh.visible;
      u.uProgress.value = prog;
      u.uGlow.value = state.glow;
      u.uRim.value.set(...(isDark ? [0.38, 0.48, 0.6] : [0.2, 0.26, 0.34]));
      mesh.material.opacity = state.opacity;
      const base = isDark ? [0.78, 0.84, 0.92] : [0.5, 0.56, 0.65];
      mesh.material.color.setRGB(base[0] * smooth.tint[0], base[1] * smooth.tint[1], base[2] * smooth.tint[2]); // a quiet per-chapter hue on the clay
    }
    renderer.render(scene, camera);

    // labels follow their pins; fade with the model
    group.updateMatrixWorld();
    for (const name of STATES) {
      const els = labelEls[name]; if (!els || !els.length) continue;
      const mesh = meshes[name]; if (!mesh) continue;
      const prog = mesh.visible ? mesh.material.userData.uniforms.uProgress.value : 1;
      // City labels only when the map is the subject, not a ghost in a corner
      const legible = state.scale * state.intro >= 0.55 && state.opacity >= 0.5 ? 1 : 0;
      const alpha = (1 - prog) * state.opacity * legible;
      els.forEach((el, i) => {
        if (alpha < 0.02) { el.style.opacity = '0'; return; }
        tmp.set(...labels[name][i].pos).applyMatrix4(group.matrixWorld).project(camera);
        el.style.opacity = String(alpha);
        el.style.transform = `translate(${((tmp.x + 1) / 2) * w + 8}px, ${((1 - tmp.y) / 2) * h - 6}px)`;
      });
    }
  }

  /** Screen-space circle (px) around the visible model, for pointer hit-testing. */
  function screenBounds() {
    if (state.opacity < 0.05) return null;
    const [vw, vh] = visible();
    const cx = state.cx * w, cy = state.cy * h;
    const r = Math.min(vw, vh) * 0.3 * state.scale * state.intro * 1.15; // world radius ≈ 1.15 units
    return { x: cx, y: cy, r: (r / vh) * h };
  }
  return { render, state, STATES, screenBounds, ensure };
}
