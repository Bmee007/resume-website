// Order-preserving GLB compression: quantise (default 14-bit positions, 10-bit normals) and EXT_meshopt_compress WITHOUT
// the vertex-cache reorder that `gltf-transform meshopt` always applies. The bot's triangles are depth-sorted on
// purpose (see renormal.mjs); a reorder would scramble that draw order and bring the flecks back.
//
//   node tools/models/pack-glb.mjs in.glb out.glb [positionBits=14] [normalBits=10]
//
// Needs (not in package.json, install without saving):
//   npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const [inp, out, posBits = '14', nrmBits = '10'] = process.argv.slice(2);
if (!inp || !out) { console.error('usage: node tools/models/pack-glb.mjs in.glb out.glb [positionBits] [normalBits]'); process.exit(1); }
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inp);
// 14-bit positions over the mesh bounds (~0.03 mm here) and 10-bit normals (~0.1 deg, stored as int16) keep the
// glossy clearcoat highlights clean. One shared 'scene' grid so vertices on the border between two material meshes
// quantise to the identical position (no hairline cracks). `gltf-transform meshopt`'s default 'high' level stores normals as 8-bit octahedral (~0.5 deg
// steps), which bands and speckles smooth, shiny surfaces.
await doc.transform(quantize({ quantizePosition: Number(posBits), quantizeNormal: Number(nrmBits), quantizationVolume: 'scene' }));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(out, doc);
console.log(JSON.stringify({ out }));
