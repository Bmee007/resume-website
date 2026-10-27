// Generates public/models/warehouse.glb: a pharmaceutical distribution centre as a 1 m-thick diorama.
// Metres, Y up, long axis X, dock face +Z. All geometry is authored here (no external assets).
// Modules: warehouse-kit (primitives + GLB writer), -dims, -shell (walls, roof deck, dock face), -roof (plant),
// -office, -vehicles, -site. Output is meshopt-compressed afterwards (see tools/models/README.md):
//   node gen-warehouse.cjs /tmp/warehouse.raw.glb && npx -y @gltf-transform/cli meshopt /tmp/warehouse.raw.glb ../../public/models/warehouse.glb
'use strict';
const path = require('path');
const { createKit } = require('./warehouse-kit.cjs');
const D = require('./warehouse-dims.cjs');
const { envelope, scuppers, dockFace } = require('./warehouse-shell.cjs');
const { roofPlant } = require('./warehouse-roof.cjs');
const { office } = require('./warehouse-office.cjs');
const V = require('./warehouse-vehicles.cjs');
const { site } = require('./warehouse-site.cjs');

const OUT = process.argv[2] || path.resolve(__dirname, '../../public/models/warehouse.glb');
const k = createKit();

envelope(k);
scuppers(k);
dockFace(k);
roofPlant(k);
office(k);
site(k);

// trailers backed onto the docks (rear at the seal face); two with day-cab tractors, two reefer drops on landing gear
const TZ = D.Z1 + 0.7;
D.TRAILER_DOORS.forEach((door, i) => {
  const reefer = i === 1 || i === 3;
  k.withTransform(k.T(D.DOOR_X[door], 0, TZ), () => {
    V.trailer(k, { reefer });
    if (!reefer) k.withTransform(k.T(0, 0, 15.0), () => V.tractor(k));
  });
});
// a drop trailer in the yard bay and a bobtail tractor in the court
k.withTransform(k.T(28, 0, 50.5).multiply(new k.THREE.Matrix4().makeRotationY(Math.PI)), () => V.trailer(k, { reefer: true }));
k.withTransform(k.T(-12, 0, 41).multiply(new k.THREE.Matrix4().makeRotationY(Math.PI / 2)), () => V.tractor(k));

const stats = k.writeGLB(OUT);
console.log(JSON.stringify(stats));
