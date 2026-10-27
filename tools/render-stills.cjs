// Render each story model to a transparent PNG at its chapter pose, with the site's clay material and
// lighting. Phones show these instead of loading Three.js + GLBs.  Usage: node tools/render-stills.cjs
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..');
const POSES = { brain: [0.3, 0.5], truck: [0.2, 0.5], computer: [0.22, 0.4], warehouse: [0.42, 0.55], canada: [0.95, 0.12], pills: [0.12, -0.55], bot: [0.12, -0.4], handshake: [0.1, -0.8], ledger: [0.72, -0.35] };
const only = process.argv.slice(2); // optional: names to (re)render
const page = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/","three/examples/jsm/":"/node_modules/three/examples/jsm/"}}</script></head><body>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canadaPins } from '/src/scripts/models.js';
const q = new URLSearchParams(location.search); const url = q.get('model'); const rx = +q.get('rx'); const ry = +q.get('ry'); const S = 1000;
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(S, S); r.setClearColor(0x000000, 0);
r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.92; document.body.appendChild(r.domElement);
const scene = new THREE.Scene(); scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(2.5, 4, 3); scene.add(key);
const rim = new THREE.DirectionalLight(0xcfe2f3, 0.5); rim.position.set(-3, 1, -2); scene.add(rim); scene.add(new THREE.HemisphereLight(0xe3eaf2, 0x55606e, 0.5));
const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(0, 0, 6.4);
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync(url); const rootObj = gltf.scene;
if (url.includes('canada')) { const pins = canadaPins(); const pg = mergeGeometries(pins.parts.map((g) => (g.index ? g.toNonIndexed() : g)), false); const pm = new THREE.Mesh(pg); rootObj.add(pm); } // city pins + route, as the site draws them
rootObj.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.64, 0.7, 0.77), roughness: 0.58, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.4, sheen: 0.2, sheenColor: new THREE.Color(0.9, 0.95, 1) }); });
const box = new THREE.Box3().setFromObject(rootObj); const size = new THREE.Vector3(); box.getSize(size); const c = new THREE.Vector3(); box.getCenter(c);
const g = new THREE.Group(); g.add(rootObj); if (!url.includes('canada')) { rootObj.position.sub(c); g.scale.setScalar(2.8 / Math.max(size.x, size.y, size.z)); }
g.scale.multiplyScalar(0.95); g.rotation.set(rx, ry, 0); scene.add(g); r.render(scene, cam); g.updateMatrixWorld(true);
// Pin positions on the canvas, so the phone figure can label the cities in HTML
if (url.includes('canada')) window.__pins = canadaPins().labels.map((l) => { const v = new THREE.Vector3(...l.pos).applyMatrix4(g.matrixWorld).project(cam); return { text: l.text, x: (v.x + 1) / 2 * S, y: (1 - v.y) / 2 * S }; });
window.__done = true;
</script></body></html>`;
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0]; if (u === '/still.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(page); }
  const p = path.join(root, decodeURIComponent(u)); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
server.listen(0, async () => {
  const port = server.address().port; const b = await chromium.launch({ channel: 'chrome' }); const pg = await b.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 });
  for (const [name, [rx, ry]] of Object.entries(POSES)) {
    if (only.length && !only.includes(name)) continue;
    if (!fs.existsSync(path.join(root, 'public/models', `${name}.glb`))) { console.log('skip (no glb)', name); continue; }
    await pg.goto(`http://127.0.0.1:${port}/still.html?model=/public/models/${name}.glb&rx=${rx}&ry=${ry}`);
    await pg.waitForFunction(() => window.__done, null, { timeout: 60000 }); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(root, 'public/models/still', `${name}.png`), omitBackground: true }); // then: cwebp -q 82 -alpha_q 90 name.png -o name.webp
    const pins = await pg.evaluate(() => window.__pins || null); if (pins) fs.writeFileSync(path.join(root, 'public/models/still', `${name}-pins.json`), JSON.stringify({ canvas: 1000, pins }, null, 2)); // canvas px; tools/trim-stills.py converts to % of the trimmed image
    console.log('still', name);
  }
  await b.close(); server.close();
});
// Post-process (run after this script): trim transparent padding and encode WebP —
//   python3 -c "from PIL import Image;import pathlib,subprocess
//   for p in pathlib.Path('public/models/still').glob('*.png'):
//     im=Image.open(p).convert('RGBA');b=im.getchannel('A').getbbox();im.crop(b).save(p)
//     subprocess.run(['cwebp','-q','82','-alpha_q','90',str(p),'-o',str(p.with_suffix('.webp'))]);p.unlink()"
