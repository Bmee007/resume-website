"""Build the Canada relief model: land clipped grid + DEM displacement + walls + bottom + province grooves.
usage: python3 build.py <outline.js> <admin0.geojson> <lakes.geojson> <admin1_lines.geojson> <dem.nc> <out.glb> [key=value ...]
"""
import os, sys, json, time, numpy as np, shapely
from shapely.geometry import shape, box
from shapely import STRtree
from scipy.io import netcdf_file
from scipy.ndimage import gaussian_filter, map_coordinates
import frame, glb, canada_water

T0 = time.time()
def log(*a): print("[%6.1fs]" % (time.time() - T0), *a, flush=True)

args = sys.argv[1:]
outline_js, admin0_p, lakes_p, adm1_p, dem_p, out_p = args[:6]
P = dict(cell=0.005, exag_c=0.0196, exag_pow=0.9, slab=0.03, simp=0.0012, min_island=3e-5,
         min_lake=2.5e-4, groove_w=0.006, groove_d=0.005, dem_sigma=2.2, dem_detail=0.3, wall_angle=70, chaikin=2,
         wall_relax=6, post_simp=0.0003, bottom_simp=0.0015, lake_inset=0.004, lake_gap=0.0015, lake_margin=0.012)
for kv in args[6:]:
    k, v = kv.split("="); P[k] = float(v)
log("params", P)

# ── frame (identical to canadaPlan()) ───────────────────────────────────────
ml = frame.mainland_from_site(outline_js); K, CX, CY = frame.fit(ml)
def proj_geom(g):
    return shapely.transform(g, lambda c: np.column_stack(frame.to_model(c[:, 0], c[:, 1], K, CX, CY)))

# ── DEM sampler (smoothed + a little retained detail) ───────────────────────
nc = netcdf_file(dem_p, "r", mmap=False)
lat = nc.variables["latitude"].data.astype(float); lon = nc.variables["longitude"].data.astype(float)
alt = nc.variables["altitude"].data.astype(float)
alt = np.where(alt > 30000, 0, alt); alt = np.maximum(alt, 0)
if P["dem_sigma"] > 0:
    base = gaussian_filter(alt, P["dem_sigma"])
    alt = base + P["dem_detail"] * (gaussian_filter(alt, 1.0) - base)
dlat = (lat[-1] - lat[0]) / (len(lat) - 1); dlon = (lon[-1] - lon[0]) / (len(lon) - 1)
def elev_km(X, Z):
    lo, la = frame.from_model(X, Z, K, CX, CY)
    r = (la - lat[0]) / dlat; q = (lo - lon[0]) / dlon
    return map_coordinates(alt, [r, q], order=1, mode="nearest") / 1000.0
def height(X, Z):
    e = elev_km(X, Z)
    return P["exag_c"] * np.power(np.maximum(e, 0), P["exag_pow"])
log("dem", alt.shape, "max m", alt.max())

# ── polygons: land (with lake holes), water (Canadian share of the lakes), footprint ──
fc = json.load(open(admin0_p))
def country(name):
    f = next(f for f in fc["features"] if f["properties"].get("ADMIN") == name)
    return proj_geom(shape(f["geometry"])).buffer(0)
can, usa = country("Canada"), country("United States of America")
lk = json.load(open(lakes_p))
lakes = []
for f in lk["features"]:
    g = shape(f["geometry"])
    if not g.intersects(shapely.box(-142, 41, -52, 84)): continue
    pg = proj_geom(g)
    if pg.area >= P["min_lake"]: lakes.append(pg.buffer(0))
water_raw = canada_water.build_water(can, usa, lakes, P["min_lake"], 0.6 * P["min_lake"])
log("lakes kept", len(lakes), "water area", water_raw.area)

def chaikin(coords, iters):
    pts = np.asarray(coords, float)[:-1]
    for _ in range(iters):
        nxt = np.roll(pts, -1, axis=0)
        q = 0.75 * pts + 0.25 * nxt; r = 0.25 * pts + 0.75 * nxt
        pts = np.empty((2 * len(pts), 2)); pts[0::2] = q; pts[1::2] = r
    return np.vstack([pts, pts[:1]])
def refine(g):
    """simplify, round corners (Chaikin), drop small parts/holes."""
    g = g.simplify(P["simp"], preserve_topology=True).buffer(0)
    polys = []
    for pg in shapely.get_parts(g):
        if pg.area < P["min_island"]: continue
        it = int(P["chaikin"])
        rp = shapely.Polygon(chaikin(pg.exterior.coords, it), [chaikin(h.coords, it) for h in pg.interiors if shapely.Polygon(h).area >= P["min_island"]])
        polys.extend([q for q in shapely.get_parts(shapely.make_valid(rp)) if q.geom_type == "Polygon"])
    return shapely.union_all(polys).simplify(P["post_simp"], preserve_topology=True).buffer(0)
can_filled = shapely.MultiPolygon([shapely.Polygon(p.exterior) for p in shapely.get_parts(can)])
C_s, W_s = refine(can_filled), refine(water_raw)
gap = W_s.buffer(P["lake_gap"]).intersection(C_s.buffer(P["lake_gap"]))   # closes slivers between lake and shore
F = shapely.union_all([C_s, W_s, gap]).buffer(0)
land = F.difference(W_s)
parts = [p for p in shapely.get_parts(land) if p.geom_type == "Polygon" and p.area >= P["min_island"]]
land = shapely.MultiPolygon(parts)
wparts = [p for p in shapely.get_parts(W_s) if p.geom_type == "Polygon" and p.area >= P["min_lake"] * 0.5]
nverts = sum(len(p.exterior.coords) + sum(len(r.coords) for r in p.interiors) for p in parts)
log("land polygons", len(parts), "verts", nverts, "area", land.area, "water parts", len(wparts), "bounds", land.bounds)

# ── tiles → pieces for fast cell clipping (land) ────────────────────────────
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

# ── assemble top surface (land): weld by rounded coords ─────────────────────
def key(xy): return np.round(xy / 1e-7).astype(np.int64)
hA, hB, hC, hD = height(A[:, 0], A[:, 1]), height(B[:, 0], B[:, 1]), height(Cc[:, 0], Cc[:, 1]), height(D[:, 0], D[:, 1])
useAC = np.abs(hA - hC) <= np.abs(hB - hD)
t1 = np.where(useAC[:, None, None], np.stack([A, B, Cc], 1), np.stack([A, B, D], 1))
t2 = np.where(useAC[:, None, None], np.stack([A, Cc, D], 1), np.stack([B, Cc, D], 1))
all_tris = np.concatenate([t1, t2, tc], 0)            # (M,3,2) in (x,z)
def orient_up(tr):
    """force +y normals: clockwise in (x,z)."""
    sa = (tr[:, 1, 0] - tr[:, 0, 0]) * (tr[:, 2, 1] - tr[:, 0, 1]) - (tr[:, 2, 0] - tr[:, 0, 0]) * (tr[:, 1, 1] - tr[:, 0, 1])
    tr = tr.copy(); f = sa > 0; tr[f] = tr[f][:, [0, 2, 1], :]
    return tr
def weld(tr):
    uk, inv = np.unique(key(tr.reshape(-1, 2)), axis=0, return_inverse=True)
    ti = inv.reshape(-1, 3)
    deg = (ti[:, 0] == ti[:, 1]) | (ti[:, 1] == ti[:, 2]) | (ti[:, 0] == ti[:, 2])
    return uk.astype(np.float64) * 1e-7, ti[~deg]
V, tri_idx = weld(orient_up(all_tris))
log("land verts", len(V), "land tris", len(tri_idx))

# land heights + province grooves
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

# ── lakes: flat inset water surfaces, one level per water body ──────────────
wtree = STRtree(np.array(wparts))
levels = np.zeros(len(wparts))
for j, wp in enumerate(wparts):
    ring = shapely.segmentize(wp.buffer(P["lake_margin"]).exterior, 0.004)
    rc = shapely.get_coordinates(ring)
    on_land = shapely.contains(land, shapely.points(rc))
    rc = rc[on_land] if on_land.sum() >= 3 else shapely.get_coordinates(wp.exterior)
    levels[j] = np.percentile(height(rc[:, 0], rc[:, 1]), 10) - P["lake_inset"]
# keep the shore above the water: land vertices near a lake never sit below level + inset (ramped)
nv, nd = wtree.query_nearest(shapely.points(V), max_distance=P["lake_margin"], return_distance=True, all_matches=False)
floor = levels[nv[1]] + P["lake_inset"] * (1 - np.clip(nd / P["lake_margin"], 0, 1))
H[nv[0]] = np.maximum(H[nv[0]], floor)
log("lake levels min/max %.4f %.4f" % (levels.min(), levels.max()), "shore-lifted verts", len(nv[0]))

# water triangulation (flat, no grid needed)
wt, wlev = [], []
for j, wp in enumerate(wparts):
    tp = shapely.get_parts(shapely.constrained_delaunay_triangles(wp))
    c3 = shapely.get_coordinates(tp).reshape(-1, 4, 2)[:, :3, :]
    wt.append(c3)
wV_list, wT_list, wH_list, off = [], [], [], len(V)
for j, c3 in enumerate(wt):
    v, t = weld(orient_up(c3))
    wV_list.append(v); wT_list.append(t + off); wH_list.append(np.full(len(v), levels[j])); off += len(v)
wV = np.concatenate(wV_list); wT = np.concatenate(wT_list); wH = np.concatenate(wH_list)
log("water verts", len(wV), "water tris", len(wT))

VA = np.concatenate([V, wV]); HA = np.concatenate([H, wH]); tri_all = np.concatenate([tri_idx, wT])
pos_top = np.column_stack([VA[:, 0], HA, VA[:, 1]])

def smooth_normals(pos, tri):
    p0, p1, p2 = pos[tri[:, 0]], pos[tri[:, 1]], pos[tri[:, 2]]
    fn = np.cross(p1 - p0, p2 - p0)
    n = np.zeros_like(pos)
    for k in range(3): np.add.at(n, tri[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return n / l
n_top = smooth_normals(pos_top, tri_all)
log("top normals: mean y %.3f, frac y<0 %.5f" % (n_top[:, 1].mean(), (n_top[:, 1] < 0).mean())); assert (n_top[:, 1] < 0).mean() < 0.01

# ── boundary edges → walls ───────────────────────────────────────────────────
E = np.concatenate([tri_all[:, [0, 1]], tri_all[:, [1, 2]], tri_all[:, [2, 0]]], 0)
third = np.concatenate([tri_all[:, 2], tri_all[:, 0], tri_all[:, 1]], 0)
NV = len(VA)
ekey = E[:, 0].astype(np.int64) * NV + E[:, 1]; rkey = E[:, 1].astype(np.int64) * NV + E[:, 0]
is_b = ~np.isin(ekey, rkey)
BE, BT = E[is_b], third[is_b]
log("boundary edges", len(BE))
mid = shapely.points((VA[BE[:, 0]] + VA[BE[:, 1]]) / 2)
def segs_of(g):
    out = []
    for ln in shapely.get_parts(g.boundary):
        cc = np.asarray(ln.coords); out.extend(shapely.linestrings(np.stack([cc[:-1], cc[1:]], 1)))
    return np.array(out)
ltree, wbtree = STRtree(segs_of(land)), STRtree(segs_of(W_s))
_, d_land = ltree.query_nearest(mid, return_distance=True, all_matches=False)
wi, d_w = wbtree.query_nearest(mid, return_distance=True, all_matches=False)
# lake level for every edge (nearest water body)
_, wpart = wtree.query_nearest(mid, return_distance=False, all_matches=False)
SHARED = 2e-4                       # land/lake shoreline: edge lies on both land and water boundaries
is_water_edge = BE[:, 0] >= len(V)
shared = (d_land < SHARED) & (d_w < SHARED)
log("boundary edges: coast %d, lake shore (land side) %d, lake shore (water side, dropped) %d" % ((~shared).sum(), (shared & ~is_water_edge).sum(), (shared & is_water_edge).sum()))
keep = ~(shared & is_water_edge)
ybot = np.where(shared, levels[wpart], -P["slab"])
BE, BT, ybot = BE[keep], BT[keep], ybot[keep]
a, b = BE[:, 0], BE[:, 1]
ed = VA[b] - VA[a]
out = np.column_stack([ed[:, 1], -ed[:, 0]])
tov = VA[BT] - VA[a]
s = np.sign(np.sum(out * tov, 1)); s[s == 0] = 1
out = -out * s[:, None]
ol = np.linalg.norm(out, axis=1, keepdims=True); ol[ol == 0] = 1; out /= ol
elen = np.linalg.norm(ed, axis=1)
in_edge = np.full(NV, -1); out_edge = np.full(NV, -1)
in_edge[b] = np.arange(len(BE)); out_edge[a] = np.arange(len(BE))
cos_thr = np.cos(np.radians(P["wall_angle"]))
# Wall normals: edge normals are relaxed along the coast chain (several neighbour passes), but never across a
# corner sharper than wall_angle, so straight faces read as smooth coast walls instead of corrugated strips.
all_e = np.arange(len(BE))
prev_v = np.where(in_edge >= 0, BE[:, 0][np.maximum(in_edge, 0)], -1)      # previous boundary vertex along the chain
next_v = np.where(out_edge >= 0, BE[:, 1][np.maximum(out_edge, 0)], -1)
has_both = (in_edge >= 0) & (out_edge >= 0)
n_in = np.where((in_edge >= 0)[:, None], out[np.maximum(in_edge, 0)], 0.0)
n_out = np.where((out_edge >= 0)[:, None], out[np.maximum(out_edge, 0)], 0.0)
sharp = ~has_both | (np.sum(n_in * n_out, 1) <= cos_thr)
vn0 = n_in + n_out
vl = np.linalg.norm(vn0, axis=1, keepdims=True); vl[vl == 0] = 1; vn0 = vn0 / vl
vn = vn0.copy()
def pick(nbr):
    ok = (nbr >= 0)
    nn = np.where(ok[:, None], vn[np.maximum(nbr, 0)], 0.0)
    comp = np.where(ok[:, None], vn0[np.maximum(nbr, 0)], 0.0)
    good = ok & (np.sum(comp * vn0, 1) > cos_thr) & ~sharp & ~np.where(ok, sharp[np.maximum(nbr, 0)], True)
    return np.where(good[:, None], nn, 0.0)
for _ in range(int(P["wall_relax"])):
    t = vn + pick(prev_v) + pick(next_v)
    tl = np.linalg.norm(t, axis=1, keepdims=True); tl[tl == 0] = 1
    vn = np.where(sharp[:, None], vn0, t / tl)
def end_normal(vid, eid):
    return np.where(sharp[vid][:, None], out[eid], vn[vid])
na, nbn = end_normal(a, np.arange(len(BE))), end_normal(b, np.arange(len(BE)))
def wv(vid, n2, y):
    return np.column_stack([VA[vid, 0], y, VA[vid, 1], n2[:, 0], np.zeros(len(vid)), n2[:, 1]])
rows = np.concatenate([wv(a, na, pos_top[a, 1]), wv(b, nbn, pos_top[b, 1]), wv(a, na, ybot), wv(b, nbn, ybot)], 0)
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
tri_wall = tri_wall[(np.linalg.norm(np.cross(pos_wall[tri_wall[:, 1]] - pos_wall[tri_wall[:, 0]], pos_wall[tri_wall[:, 2]] - pos_wall[tri_wall[:, 0]]), axis=1) > 1e-14)]
log("wall verts", len(pos_wall), "wall tris", len(tri_wall))

# ── bottom cap ───────────────────────────────────────────────────────────────
bt = np.concatenate([shapely.get_coordinates(t).reshape(-1, 4, 2)[:, :3, :] for t in
                     [shapely.constrained_delaunay_triangles(p) for p in shapely.get_parts(shapely.union_all([land, W_s]))]])
bV, bT = weld(orient_up(bt))
pos_bot = np.column_stack([bV[:, 0], np.full(len(bV), -P["slab"]), bV[:, 1]])
n_bot = np.tile([0, -1, 0], (len(bV), 1)).astype(float)
tri_bot = bT[:, [0, 2, 1]]

# ── write: three primitives (top, walls, bottom) so post-processing can treat them differently ──
prims = [(pos_top, n_top, tri_all), (pos_wall, n_wall, tri_wall), (pos_bot, n_bot, tri_bot)]
if os.environ.get("CANADA_DEBUG"):   # hypsometric tint + blue water, for judging the lakes (render the raw GLB directly)
    t = np.clip(HA / 0.05, 0, 1)[:, None]
    ramp = (1 - t) * np.array([0.55, 0.72, 0.45]) + t * np.array([0.85, 0.75, 0.65])
    col = np.where((np.arange(len(HA)) >= len(V))[:, None], np.array([0.2, 0.45, 0.85]), ramp)
    prims = [prims[0] + (col,), prims[1] + (np.full((len(pos_wall), 3), 0.5),), prims[2] + (np.full((len(pos_bot), 3), 0.5),)]
bytes_ = glb.write_glb(out_p, prims)
log("wrote", out_p, "verts", len(pos_top) + len(pos_wall) + len(pos_bot), "tris", len(tri_all) + len(tri_wall) + len(tri_bot), "bytes", bytes_,
    "height max", HA.max(), "bbox", np.minimum(pos_top.min(0), pos_bot.min(0)), np.maximum(pos_top.max(0), pos_wall.max(0)))
