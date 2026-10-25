"""Build the Canada relief model: land clipped grid + DEM displacement + walls + bottom + province grooves.
usage: python3 build.py <outline.js> <admin0.geojson> <lakes.geojson> <admin1_lines.geojson> <dem.nc> <out.glb> [key=value ...]
"""
import sys, json, time, numpy as np, shapely
from shapely.geometry import shape, box
from shapely import STRtree
from scipy.io import netcdf_file
from scipy.ndimage import gaussian_filter, map_coordinates
import frame, glb

T0 = time.time()
def log(*a): print("[%6.1fs]" % (time.time() - T0), *a, flush=True)

args = sys.argv[1:]
outline_js, admin0_p, lakes_p, adm1_p, dem_p, out_p = args[:6]
P = dict(cell=0.005, exag_c=0.0196, exag_pow=0.75, slab=0.06, simp=0.0012, min_island=1.6e-5,
         min_lake=2.5e-4, groove_w=0.006, groove_d=0.005, dem_sigma=1.0, wall_angle=40, chaikin=2)
for kv in args[6:]:
    k, v = kv.split("="); P[k] = float(v)
log("params", P)

# ── frame (identical to canadaPlan()) ───────────────────────────────────────
ml = frame.mainland_from_site(outline_js); K, CX, CY = frame.fit(ml)
def proj_geom(g):
    return shapely.transform(g, lambda c: np.column_stack(frame.to_model(c[:, 0], c[:, 1], K, CX, CY)))

# ── land polygon ─────────────────────────────────────────────────────────────
fc = json.load(open(admin0_p))
can = next(f for f in fc["features"] if f["properties"].get("ADMIN") == "Canada")
land = proj_geom(shape(can["geometry"])).buffer(0)
lk = json.load(open(lakes_p))
lakes = []
for f in lk["features"]:
    g = shape(f["geometry"])
    if not g.intersects(shapely.box(-142, 41, -52, 84)): continue
    pg = proj_geom(g)
    if pg.area >= P["min_lake"]: lakes.append(pg.buffer(0))
log("lakes kept", len(lakes))
if lakes: land = land.difference(shapely.union_all(lakes))
land = land.simplify(P["simp"], preserve_topology=True).buffer(0)
def chaikin(coords, iters):
    pts = np.asarray(coords, float)[:-1]
    for _ in range(iters):
        nxt = np.roll(pts, -1, axis=0)
        q = 0.75 * pts + 0.25 * nxt; r = 0.25 * pts + 0.75 * nxt
        pts = np.empty((2 * len(pts), 2)); pts[0::2] = q; pts[1::2] = r
    return np.vstack([pts, pts[:1]])
if P["chaikin"] > 0:
    polys = []
    for pg in shapely.get_parts(land):
        if pg.area < P["min_island"]: continue
        rp = shapely.Polygon(chaikin(pg.exterior.coords, int(P["chaikin"])), [chaikin(h.coords, int(P["chaikin"])) for h in pg.interiors if shapely.Polygon(h).area >= P["min_island"]])
        polys.extend([q for q in shapely.get_parts(shapely.make_valid(rp)) if q.geom_type == "Polygon"])
    land = shapely.union_all(polys).buffer(0)
parts = [p for p in shapely.get_parts(land) if p.area >= P["min_island"]]
land = shapely.MultiPolygon(parts)
nverts = sum(len(p.exterior.coords) + sum(len(r.coords) for r in p.interiors) for p in parts)
log("land polygons", len(parts), "verts", nverts, "area", land.area, "bounds", land.bounds)

# ── tiles → pieces for fast cell clipping ───────────────────────────────────
minx, minz, maxx, maxz = land.bounds
TS = 0.2
tx = np.arange(np.floor(minx / TS) * TS, maxx + TS, TS); tz = np.arange(np.floor(minz / TS) * TS, maxz + TS, TS)
tiles = np.array([box(a, b, a + TS, b + TS) for a in tx for b in tz])
pieces = shapely.get_parts(shapely.intersection(tiles, land))
pieces = np.array([p for p in pieces if p.geom_type == "Polygon" and p.area > 0])
tree = STRtree(pieces)
log("pieces", len(pieces))

# ── grid cells ───────────────────────────────────────────────────────────────
c = P["cell"]
i0, i1 = int(np.floor(minx / c)) - 1, int(np.ceil(maxx / c)) + 1
j0, j1 = int(np.floor(minz / c)) - 1, int(np.ceil(maxz / c)) + 1
ii, jj = np.meshgrid(np.arange(i0, i1), np.arange(j0, j1), indexing="ij")
ii, jj = ii.ravel(), jj.ravel()
cells = shapely.box(ii * c, jj * c, (ii + 1) * c, (jj + 1) * c)
ci, pi = tree.query(cells, predicate="intersects")
cont = shapely.contains_properly(pieces[pi], cells[ci])
interior = np.zeros(len(cells), bool); interior[ci[cont]] = True
touched = np.zeros(len(cells), bool); touched[ci] = True
bnd = touched & ~interior
log("cells", len(cells), "interior", interior.sum(), "boundary", bnd.sum())

# interior cell triangles (as coordinate triples)
I, J = ii[interior], jj[interior]
A = np.column_stack([I * c, J * c]); B = np.column_stack([(I + 1) * c, J * c])
Cc = np.column_stack([(I + 1) * c, (J + 1) * c]); D = np.column_stack([I * c, (J + 1) * c])

# boundary cell clipping
sel = bnd[ci]
bci, bpi = ci[sel], pi[sel]
inter = shapely.intersection(cells[bci], pieces[bpi])
order = np.argsort(bci, kind="stable"); bci, inter = bci[order], inter[order]
uniq, start = np.unique(bci, return_index=True)
ends = np.append(start[1:], len(bci))
clipped = []
for s, e in zip(start, ends):
    g = inter[s] if e - s == 1 else shapely.union_all(inter[s:e])
    g = shapely.get_parts(g)
    clipped.extend([p for p in g if p.geom_type == "Polygon" and p.area > 1e-12])
clipped = np.array(clipped)
tris_gc = shapely.constrained_delaunay_triangles(clipped)
tri_polys = shapely.get_parts(tris_gc)
tc = shapely.get_coordinates(tri_polys).reshape(-1, 4, 2)[:, :3, :]
log("boundary tris", len(tc))

# ── DEM sampler ──────────────────────────────────────────────────────────────
nc = netcdf_file(dem_p, "r", mmap=False)
lat = nc.variables["latitude"].data.astype(float); lon = nc.variables["longitude"].data.astype(float)
alt = nc.variables["altitude"].data.astype(float)
alt = np.where(alt > 30000, 0, alt); alt = np.maximum(alt, 0)
if P["dem_sigma"] > 0: alt = gaussian_filter(alt, P["dem_sigma"])
dlat = (lat[-1] - lat[0]) / (len(lat) - 1); dlon = (lon[-1] - lon[0]) / (len(lon) - 1)
def elev_km(X, Z):
    lo, la = frame.from_model(X, Z, K, CX, CY)
    r = (la - lat[0]) / dlat; q = (lo - lon[0]) / dlon
    return map_coordinates(alt, [r, q], order=1, mode="nearest") / 1000.0
def height(X, Z):
    e = elev_km(X, Z)
    return P["exag_c"] * np.power(np.maximum(e, 0), P["exag_pow"])
log("dem", alt.shape, "max m", alt.max())

# ── assemble top surface: weld by rounded coords ─────────────────────────────
def key(xy): return np.round(xy / 1e-7).astype(np.int64)
# interior: choose diagonal with smaller height difference
hA, hB, hC, hD = height(A[:, 0], A[:, 1]), height(B[:, 0], B[:, 1]), height(Cc[:, 0], Cc[:, 1]), height(D[:, 0], D[:, 1])
useAC = np.abs(hA - hC) <= np.abs(hB - hD)
t1 = np.where(useAC[:, None, None], np.stack([A, B, Cc], 1), np.stack([A, B, D], 1))
t2 = np.where(useAC[:, None, None], np.stack([A, Cc, D], 1), np.stack([B, Cc, D], 1))
all_tris = np.concatenate([t1, t2, tc], 0)            # (M,3,2) in (x,z)
# orientation: force +y normal → clockwise in (x,z) (negative signed area)
sa = (all_tris[:, 1, 0] - all_tris[:, 0, 0]) * (all_tris[:, 2, 1] - all_tris[:, 0, 1]) - (all_tris[:, 2, 0] - all_tris[:, 0, 0]) * (all_tris[:, 1, 1] - all_tris[:, 0, 1])
flip = sa > 0
all_tris[flip] = all_tris[flip][:, [0, 2, 1], :]
keys = key(all_tris.reshape(-1, 2))
uk, inv = np.unique(keys, axis=0, return_inverse=True)
tri_idx = inv.reshape(-1, 3)
V = uk.astype(np.float64) * 1e-7                           # (N,2) x,z
deg = (tri_idx[:, 0] == tri_idx[:, 1]) | (tri_idx[:, 1] == tri_idx[:, 2]) | (tri_idx[:, 0] == tri_idx[:, 2])
tri_idx = tri_idx[~deg]
log("top verts", len(V), "top tris", len(tri_idx))

# heights + province grooves
H = height(V[:, 0], V[:, 1])
if P["groove_d"] > 0:
    a1 = json.load(open(adm1_p))
    lines = [proj_geom(shape(f["geometry"])) for f in a1["features"] if f["properties"].get("ADM0_A3") == "CAN"]
    ml_lines = shapely.union_all(lines).simplify(0.0008)
    segs = []
    for ln in shapely.get_parts(ml_lines):
        cc = np.asarray(ln.coords)
        segs.extend(shapely.linestrings(np.stack([cc[:-1], cc[1:]], 1)))
    stree = STRtree(np.array(segs))
    pts = shapely.points(V)
    near, dist = stree.query_nearest(pts, max_distance=P["groove_w"] * 1.01, return_distance=True, all_matches=False)
    dmap = np.full(len(V), np.inf); dmap[near[0]] = dist
    u = np.clip(dmap / P["groove_w"], 0, 1)
    H = H - P["groove_d"] * (1 - u * u)
    log("groove vertices", int((u < 1).sum()))

pos_top = np.column_stack([V[:, 0], H, V[:, 1]])

# smooth normals (area weighted)
def smooth_normals(pos, tri):
    p0, p1, p2 = pos[tri[:, 0]], pos[tri[:, 1]], pos[tri[:, 2]]
    fn = np.cross(p1 - p0, p2 - p0)
    n = np.zeros_like(pos)
    for k in range(3): np.add.at(n, tri[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return n / l
n_top = smooth_normals(pos_top, tri_idx)
log("top normals: mean y %.3f, frac y<0 %.5f" % (n_top[:, 1].mean(), (n_top[:, 1] < 0).mean())); assert (n_top[:, 1] < 0).mean() < 0.01

# ── boundary edges → walls ───────────────────────────────────────────────────
E = np.concatenate([tri_idx[:, [0, 1]], tri_idx[:, [1, 2]], tri_idx[:, [2, 0]]], 0)
third = np.concatenate([tri_idx[:, 2], tri_idx[:, 0], tri_idx[:, 1]], 0)
ekey = E[:, 0].astype(np.int64) * len(V) + E[:, 1]; rkey = E[:, 1].astype(np.int64) * len(V) + E[:, 0]
is_b = ~np.isin(ekey, rkey)
BE, BT = E[is_b], third[is_b]
log("boundary edges", len(BE))
# diagnostic: boundary edges that are not on the coastline = welding failures (interior fins)
_bsegs = []
for _ln in shapely.get_parts(land.boundary):
    _cc = np.asarray(_ln.coords); _bsegs.extend(shapely.linestrings(np.stack([_cc[:-1], _cc[1:]], 1)))
_mid = shapely.points((V[BE[:, 0]] + V[BE[:, 1]]) / 2)
_, _d = STRtree(np.array(_bsegs)).query_nearest(_mid, return_distance=True, all_matches=False)
log("boundary edges off-coast (>1e-6): %d, max dist %.2e" % ((_d > 1e-6).sum(), _d.max()))
a, b = BE[:, 0], BE[:, 1]
ed = V[b] - V[a]                                         # (x,z)
out = np.column_stack([ed[:, 1], -ed[:, 0]])             # perpendicular
tov = V[BT] - V[a]
s = np.sign(np.sum(out * tov, 1)); s[s == 0] = 1
out = -out * s[:, None]                                  # points away from the interior
ol = np.linalg.norm(out, axis=1, keepdims=True); ol[ol == 0] = 1; out /= ol
# wall vertices: one per edge end; normal smoothed with the neighbouring edge unless the coast turns sharply
elen = np.linalg.norm(ed, axis=1)
in_edge = np.full(len(V), -1); out_edge = np.full(len(V), -1)
in_edge[b] = np.arange(len(BE)); out_edge[a] = np.arange(len(BE))
cos_thr = np.cos(np.radians(P["wall_angle"]))
def end_normal(vid, eid):
    other = np.where(in_edge[vid] == eid, out_edge[vid], in_edge[vid])
    ok = other >= 0
    n_other = np.where(ok[:, None], out[np.maximum(other, 0)], out[eid])
    smooth = ok & (np.sum(out[eid] * n_other, 1) > cos_thr)
    w_self = elen[eid][:, None]; w_oth = np.where(ok, elen[np.maximum(other, 0)], 0)[:, None]
    n = np.where(smooth[:, None], out[eid] * w_self + n_other * w_oth, out[eid])
    return n / np.linalg.norm(n, axis=1, keepdims=True)
na, nbn = end_normal(a, np.arange(len(BE))), end_normal(b, np.arange(len(BE)))
slab = P["slab"]
def wv(vid, n2, y):
    return np.column_stack([V[vid, 0], y, V[vid, 1], n2[:, 0], np.zeros(len(vid)), n2[:, 1]])
rows = np.concatenate([wv(a, na, pos_top[a, 1]), wv(b, nbn, pos_top[b, 1]), wv(a, na, np.full(len(a), -slab)), wv(b, nbn, np.full(len(b), -slab))], 0)
rk = np.round(rows / 1e-7).astype(np.int64)
urows, winv = np.unique(rk, axis=0, return_inverse=True)
urows = urows.astype(np.float64) * 1e-7
pos_wall, n_wall = urows[:, :3], urows[:, 3:]
m = len(BE)
ra_t, rb_t, ra_b, rb_b = winv[:m], winv[m:2*m], winv[2*m:3*m], winv[3*m:]
q1 = np.column_stack([ra_t, rb_t, rb_b]); q2 = np.column_stack([ra_t, rb_b, ra_b])
def fix_wind(tri, pos, want):
    p0, p1, p2 = pos[tri[:, 0]], pos[tri[:, 1]], pos[tri[:, 2]]
    fn = np.cross(p1 - p0, p2 - p0)
    bad = np.sum(fn[:, [0, 2]] * want, 1) < 0
    tri = tri.copy(); tri[bad] = tri[bad][:, [0, 2, 1]]
    return tri
tri_wall = np.concatenate([fix_wind(q1, pos_wall, out), fix_wind(q2, pos_wall, out)], 0)
log("wall verts", len(pos_wall), "wall tris", len(tri_wall))

# ── bottom cap ───────────────────────────────────────────────────────────────
pos_bot = np.column_stack([V[:, 0], np.full(len(V), -slab), V[:, 1]])
n_bot = np.tile([0, -1, 0], (len(V), 1)).astype(float)
tri_bot = tri_idx[:, [0, 2, 1]]

# ── merge & write ────────────────────────────────────────────────────────────
o1, o2 = len(pos_top), len(pos_top) + len(pos_wall)
pos = np.concatenate([pos_top, pos_wall, pos_bot], 0)
nrm = np.concatenate([n_top, n_wall, n_bot], 0)
tri = np.concatenate([tri_idx, tri_wall + o1, tri_bot + o2], 0)
bytes_ = glb.write_glb(out_p, pos, nrm, tri)
log("wrote", out_p, "verts", len(pos), "tris", len(tri), "bytes", bytes_, "height max", H.max(), "bbox", pos.min(0), pos.max(0))
