"""Minimal GLB writer: one indexed triangle mesh with POSITION + NORMAL."""
import json, struct, numpy as np

def write_glb(path, pos, nrm, tri):
    pos = np.ascontiguousarray(pos, np.float32); nrm = np.ascontiguousarray(nrm, np.float32)
    idx = np.ascontiguousarray(tri, np.uint32).reshape(-1)
    pb, nb, ib = pos.tobytes(), nrm.tobytes(), idx.tobytes()
    blob = pb + nb + ib
    j = {"asset": {"version": "2.0", "generator": "build-canada.py"},
         "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
         "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1}, "indices": 2, "mode": 4}]}],
         "buffers": [{"byteLength": len(blob)}],
         "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": len(pb), "target": 34962},
                         {"buffer": 0, "byteOffset": len(pb), "byteLength": len(nb), "target": 34962},
                         {"buffer": 0, "byteOffset": len(pb) + len(nb), "byteLength": len(ib), "target": 34963}],
         "accessors": [{"bufferView": 0, "componentType": 5126, "count": len(pos), "type": "VEC3",
                        "min": pos.min(0).tolist(), "max": pos.max(0).tolist()},
                       {"bufferView": 1, "componentType": 5126, "count": len(nrm), "type": "VEC3"},
                       {"bufferView": 2, "componentType": 5125, "count": len(idx), "type": "SCALAR"}],
         "materials": [{"pbrMetallicRoughness": {"baseColorFactor": [0.8, 0.8, 0.8, 1], "metallicFactor": 0, "roughnessFactor": 0.9}}]}
    j["meshes"][0]["primitives"][0]["material"] = 0
    js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * (-len(js) % 4)
    blob += b"\0" * (-len(blob) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(blob), 0x004E4942) + blob)
    return total
