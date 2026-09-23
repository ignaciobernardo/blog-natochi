"""Lift the supplied raster into a 3D ink cloud, preserving its front projection.

Depth is inferred, not recovered original scientific data. Requires Pillow,
NumPy, SciPy and scikit-image. Binary records: little-endian float32
(x, y, z, ink opacity).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.spatial import ConvexHull
from scipy.ndimage import distance_transform_edt
from scipy.sparse import coo_matrix, diags
from scipy.sparse.linalg import spsolve
from skimage.morphology import skeletonize

root = Path(__file__).resolve().parents[1]
gray = np.array(Image.open(root / 'public/reference.png').convert('L'))
y, x = np.nonzero(gray < 255)
xy = np.column_stack((x + .5, y + .5))
# Vertices measured from the reference. The camera-facing coordinates remain
# untouched; depth creates a coherent volume when the user rotates the plot.
vertices = np.array([
    [53,233,120.5], [334,24,-120.5], [904,167,224.5], [717,444,465.5],
    [108,635,-224.5], [351,395,-465.5], [853,559,-120.5], [667,855,120.5],
], dtype=float)
edges = [(0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),
         (0,4),(1,5),(2,6),(3,7)]
nearest = np.full(len(x), np.inf)
frame_z = np.zeros(len(x))
for a,b in edges:
    start, delta = vertices[a], vertices[b] - vertices[a]
    t = np.clip((xy-start[:2]) @ delta[:2] / (delta[:2] @ delta[:2]), 0, 1)
    distance = np.linalg.norm(xy - (start[:2] + t[:,None]*delta[:2]), axis=1)
    closer = distance < nearest
    frame_z[closer] = (start[2] + t*delta[2])[closer]
    nearest = np.minimum(nearest, distance)

lower, upper = np.full(len(x), -1000.), np.full(len(x), 1000.)
for a,b,c,d in ConvexHull(vertices).equations:
    if abs(c) < 1e-8: continue
    bound = -(a*xy[:,0] + b*xy[:,1] + d)/c
    if c > 0: upper = np.minimum(upper, bound)
    else: lower = np.maximum(lower, bound)
inside = upper >= lower
# Infer depth along the connected ink skeleton, rather than across the image
# plane. A seeded, regularized graph field gives the trace smooth depth while
# allowing nearby, disconnected strands to occupy different parts of the box.
trace = np.zeros_like(gray, dtype=bool)
trace[y,x] = inside & (nearest > 2.5) & (gray[y,x] < 170)
skeleton = skeletonize(trace)
sy,sx = np.nonzero(skeleton)
indices = np.full(gray.shape, -1, dtype=int)
indices[sy,sx] = np.arange(len(sx))
rows, cols = [], []
for dy,dx in [(0,1),(1,-1),(1,0),(1,1)]:
    ny,nx = sy+dy,sx+dx
    valid = (ny>=0)&(ny<gray.shape[0])&(nx>=0)&(nx<gray.shape[1])
    start = np.flatnonzero(valid)
    end = indices[ny[valid],nx[valid]]
    connected = end>=0
    rows.extend(start[connected]); cols.extend(end[connected])
adjacency = coo_matrix((np.ones(len(rows)*2),
                       (rows+cols, cols+rows)), shape=(len(sx),len(sx))).tocsr()
laplacian = diags(np.asarray(adjacency.sum(axis=1)).ravel()+.002)-adjacency
field = spsolve(laplacian, np.random.default_rng(30).normal(size=len(sx)))
field = .5 + .42*np.tanh(field/np.std(field))
depth_map = np.zeros(gray.shape)
depth_map[sy,sx] = field
_, closest = distance_transform_edt(~skeleton, return_indices=True)
phase = depth_map[closest[0,y,x],closest[1,y,x]]
z = lower + np.clip(phase,.07,.93)*(upper-lower)
z = np.where(inside & (nearest > 1.6), z, frame_z)
# Outside the plot, the original type travels with the corresponding frame edge.
data = np.column_stack((xy[:,0]-452, 441.5-xy[:,1], z, (255-gray[y,x])/255))
data.astype('<f4').tofile(root / 'public/cloud.bin')
lookup = np.full(gray.shape, -1, dtype=int)
lookup[y,x] = np.arange(len(x))
node_data = data[lookup[sy,sx]]
segments = node_data[np.column_stack((rows,cols)).ravel()].copy()
segments[:,3] = .65
segments.astype('<f4').tofile(root / 'public/strands.bin')
print(f'{len(data):,} ink samples reconstructed.')
