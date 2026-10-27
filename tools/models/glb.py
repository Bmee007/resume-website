"""Minimal GLB writer: one mesh, one primitive per (pos, nrm, tri[, rgb]) group, POSITION + NORMAL (+ COLOR_0), indexed."""
import json, struct, numpy as np

def write_glb(path, prims):
    """prims: list of (pos Nx3, nrm Nx3, tri Mx3). Returns bytes written."""
    blob = b""; views = []; accs = []; jprims = []
    def add(arr, target, **acc):
        nonlocal blob
        b = arr.tobytes(); pad = -len(blob) % 4; blob += b"\0" * pad
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(b), "target": target})
        blob += b
        accs.append({"bufferView": len(views) - 1, **acc}); return len(accs) - 1
    for pr in prims:
        pos, nrm, tri = pr[:3]
        pos = np.ascontiguousarray(pos, np.float32); nrm = np.ascontiguousarray(nrm, np.float32)
        idx = np.ascontiguousarray(tri, np.uint32).reshape(-1)
        ap = add(pos, 34962, componentType=5126, count=len(pos), type="VEC3", min=pos.min(0).tolist(), max=pos.max(0).tolist())
        an = add(nrm, 34962, componentType=5126, count=len(nrm), type="VEC3")
        ai = add(idx, 34963, componentType=5125, count=len(idx), type="SCALAR")
        attrs = {"POSITION": ap, "NORMAL": an}
        if len(pr) > 3:
            col = np.ascontiguousarray(pr[3], np.float32)
            attrs["COLOR_0"] = add(col, 34962, componentType=5126, count=len(col), type="VEC3")
        jprims.append({"attributes": attrs, "indices": ai, "mode": 4, "material": 0})
    j = {"asset": {"version": "2.0", "generator": "build-canada.py"},
         "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0, "name": "canada"}],
         "meshes": [{"primitives": jprims}], "buffers": [{"byteLength": len(blob)}],
         "bufferViews": views, "accessors": accs,
         "materials": [{"pbrMetallicRoughness": {"baseColorFactor": [0.8, 0.8, 0.8, 1], "metallicFactor": 0, "roughnessFactor": 0.9}}]}
    js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * (-len(js) % 4)
    blob += b"\0" * (-len(blob) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(blob), 0x004E4942) + blob)
    return total
