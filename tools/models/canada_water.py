"""Water polygons for the Canada relief: Natural Earth lakes restricted to the Canadian side.

Lakes shared with the USA (Great Lakes, Lake of the Woods, ...) are cut along the median line between the two
shorelines (Voronoi of densified shore points), so the model only carries Canada's share of the water.
"""
import numpy as np, shapely
from shapely import STRtree
from shapely.geometry import MultiPoint, box

def canadian_side(lake, can, usa, spacing=0.004, near=0.02, pad=0.25):
    """lake ∩ (points nearer to Canada's shoreline than to the USA's)."""
    if usa.distance(lake) > near:
        return lake
    win = lake.buffer(pad)
    sites, owner = [], []
    for geom, tag in ((can, 1), (usa, 0)):
        b = shapely.segmentize(shapely.intersection(geom.boundary, win), spacing)
        c = shapely.get_coordinates(b)
        sites.append(c); owner.append(np.full(len(c), tag))
    pts = np.concatenate(sites); own = np.concatenate(owner)
    pts, ui = np.unique(np.round(pts, 6), axis=0, return_index=True); own = own[ui]
    cells = shapely.get_parts(shapely.voronoi_polygons(MultiPoint(pts), extend_to=win))
    tree = STRtree(cells)
    pi, ci = tree.query(shapely.points(pts), predicate="within")   # (point index, cell index)
    region = shapely.union_all(cells[ci[own[pi] == 1]])
    return lake.intersection(region)

def build_water(can, usa, lakes, min_lake, min_poly):
    out = []
    for lk in lakes:
        if lk.distance(can) > 1e-3: continue
        w = canadian_side(lk, can, usa)
        out.extend(p for p in shapely.get_parts(w) if p.geom_type == "Polygon" and p.area >= min_poly)
    return shapely.union_all(out) if out else shapely.Polygon()
