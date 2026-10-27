"""Site frame for the Canada relief: identical to canadaPlan() in src/scripts/models.js
(spherical Lambert conformal conic, mainland bbox fit to x in [-1.4, 1.4], north = -z)."""
import re, json, numpy as np

D = np.pi / 180
_p0, _p1, _p2, _l0 = 49 * D, 49 * D, 77 * D, -96 * D
_n = np.log(np.cos(_p1) / np.cos(_p2)) / np.log(np.tan(np.pi / 4 + _p2 / 2) / np.tan(np.pi / 4 + _p1 / 2))
_F = np.cos(_p1) * np.tan(np.pi / 4 + _p1 / 2) ** _n / _n
_r0 = _F / np.tan(np.pi / 4 + _p0 / 2) ** _n

def lcc(lon, lat):
    lon = np.asarray(lon, float); lat = np.asarray(lat, float)
    rho = _F / np.tan(np.pi / 4 + lat * D / 2) ** _n
    th = _n * (lon * D - _l0)
    return rho * np.sin(th), _r0 - rho * np.cos(th)

def lcc_inv(x, y):
    x = np.asarray(x, float); y = np.asarray(y, float)
    rho = np.sign(_n) * np.hypot(x, _r0 - y)
    th = np.arctan2(x, _r0 - y)
    return (_l0 + th / _n) / D, (2 * np.arctan((_F / rho) ** (1 / _n)) - np.pi / 2) / D

def mainland_from_site(path):
    s = open(path).read()
    m = re.search(r"export const MAINLAND = (\[.*?\]\]);", s, re.S)
    return np.array(json.loads(m.group(1)), float)

def fit(ml):
    x, y = lcc(ml[:, 0], ml[:, 1])
    K = 2.8 / (x.max() - x.min())
    return K, (x.min() + x.max()) / 2, (y.min() + y.max()) / 2

def to_model(lon, lat, K, CX, CY):
    x, y = lcc(lon, lat)
    return (x - CX) * K, -(y - CY) * K

def from_model(X, Z, K, CX, CY):
    return lcc_inv(np.asarray(X) / K + CX, -np.asarray(Z) / K + CY)
