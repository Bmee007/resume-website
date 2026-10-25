// Render a GLB from three angles with the site's lighting and print stats.
// Usage: node tools/render-model.cjs public/models/brain.glb out-prefix
// Serves the repo root on a throwaway port so the lab page can import three from node_modules.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const [, , glb, outPrefix = 'model'] = process.argv;
if (!glb) { console.error('usage: node tools/render-model.cjs <file.glb> [out-prefix]'); process.exit(1); }
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
server.listen(0, async () => {
  const port = server.address().port;
  const b = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist'] });
  const page = await b.newPage({ viewport: { width: 900, height: 700 } });
  const rel = '/' + path.relative(root, path.resolve(glb)).split(path.sep).join('/');
  const views = [['a', 0.6, 0.3], ['b', -0.9, 0.25], ['c', 0.0, 1.2]];
  let stats = null;
  for (const [tag, yaw, pitch] of views) {
    await page.goto(`http://127.0.0.1:${port}/tools/model-lab.html?model=${encodeURIComponent(rel)}&yaw=${yaw}&pitch=${pitch}`);
    await page.waitForFunction(() => window.__stats, null, { timeout: 60000 });
    stats = await page.evaluate(() => window.__stats);
    if (!stats.ok) break;
    await page.screenshot({ path: `${outPrefix}-${tag}.png` });
  }
  console.log(JSON.stringify(stats));
  await b.close(); server.close();
});
