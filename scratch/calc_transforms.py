import numpy as np

def compute_centroid(points):
    pts = np.array(points).reshape(-1, 2)
    x = np.mean(pts[:, 0])
    y = np.mean(pts[:, 1])
    return x, y

def center_points(points, cx, cy):
    pts = np.array(points).reshape(-1, 2)
    return pts - [cx, cy]

def find_transform(base_pts, target_pts):
    # base_pts and target_pts are centered
    # find rotation angle
    # We can use procrustes analysis or simply angle between first edges
    b = base_pts
    t = target_pts
    # find corresponding vertices (assuming same order or we can just try all cyclic permutations)
    best_angle = 0
    min_err = float('inf')
    
    for shift in range(len(b)):
        shifted_t = np.roll(t, shift, axis=0)
        # Calculate angle from first edge
        v_base = b[1] - b[0]
        v_t = shifted_t[1] - shifted_t[0]
        angle = np.arctan2(v_t[1], v_t[0]) - np.arctan2(v_base[1], v_base[0])
        
        # Test error
        rot_matrix = np.array([
            [np.cos(angle), -np.sin(angle)],
            [np.sin(angle),  np.cos(angle)]
        ])
        rotated_b = b.dot(rot_matrix.T)
        err = np.sum((rotated_b - shifted_t)**2)
        if err < min_err:
            min_err = err
            best_angle = angle
            
    return np.degrees(best_angle)

figs = {
    0: {
        'c1': [301,333, 555,587, 555,333],
        'c2': [243,654, 602,654, 423,475],
        'c3': [285,335, 286,589, 412,462],
        'c4': [697,458, 570,458, 570,585],
        'c5': [141,331, 141,458, 268,585, 268,458],
        'c6': [695,316, 568,442, 695,442],
        'c7': [357,193, 357,320, 484,320, 484,193]
    },
    1: {
        'c2': [0,799, 253,551, 0,551],
        'c7': [126,407, 126,534, 253,534, 253,407],
        'c5': [395,285, 268,412, 268,539, 395,412],
        'c6': [391,270, 264,270, 264,397],
        'c1': [662,149, 408,149, 408,403],
        'c4': [545,12, 545,138, 671,138],
        'c3': [545,12, 799,12, 671,138]
    },
    2: {
        'c7': [385,357, 385,484, 512,484, 512,358],
        'c1': [246,78, 246,332, 500,332],
        'c3': [532,231, 532,484, 658,358],
        'c2': [274,78, 512,316, 512,78],
        'c5': [96,353, 222,479, 350,479, 224,353],
        'c6': [243,357, 370,484, 370,357],
        'c4': [226,209, 99,336, 226,336]
    }
}

pieces = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']

print("--- SHAPES (Centered) ---")
base_shapes = {}
for p in pieces:
    cx, cy = compute_centroid(figs[0][p])
    centered = center_points(figs[0][p], cx, cy)
    base_shapes[p] = centered
    pts_str = ", ".join([f"{x:.1f},{y:.1f}" for x, y in centered])
    print(f"{p}: [{pts_str}]")

print("\\n--- TRANSFORMATIONS ---")
for f in [0, 1, 2]:
    print(f"Figure {f}:")
    for p in pieces:
        cx, cy = compute_centroid(figs[f][p])
        centered = center_points(figs[f][p], cx, cy)
        angle = find_transform(base_shapes[p], centered)
        # normalize angle
        angle = ((angle + 180) % 360) - 180
        # Round to nearest 45
        angle = round(angle / 45) * 45
        print(f"  {p}: x={cx:.1f}, y={cy:.1f}, rot={angle}")
