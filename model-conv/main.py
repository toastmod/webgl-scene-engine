import json
import copy

def uv_neg1_to_pos1_to_0_1(uv):
    """
    Convert UV coordinates from [-1.0, 1.0] range to [0.0, 1.0].

    Parameters:
        uv (tuple or list): (u, v) in range [-1.0, 1.0]

    Returns:
        tuple: (u, v) converted to range [0.0, 1.0]
    """
    u, v = uv
    return ((u + 1) * 0.5, (v + 1) * 0.5)


def normalize_01(values):
    if not values:
        return values

    min_v = min(values)
    max_v = max(values)
    span = max_v - min_v

    if span == 0:
        return [0.0 for _ in values]  # all values are identical

    return [(v - min_v) / span for v in values]


def normalize_minus1_1(values):
    if not values:
        return values

    min_v = min(values)
    max_v = max(values)
    span = max_v - min_v

    if span == 0:
        return [0.0 for _ in values]

    return [((v - min_v) / span) * 2 - 1 for v in values]


def load_obj(path):
    vertices = []
    vertices_final = []
    texcoords = []
    texcoords_final = []
    normals = []
    normals_final = []
    indices = []
    face_map = {}
    map_i = 0

    with open(path, "r") as f:
        for line in f:
            line = line.strip()

            # Vertex line: v x y z
            if line.startswith("v "):
                parts = line.split()
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                vertices.append((x, y, z))
                continue

            # Vertex line: vt u v
            if line.startswith("vt "):
                parts = line.split()
                u, v = float(parts[1]), float(parts[2])
                texcoords.append((u, v))
                continue

            # Vertex line: vn n 
            if line.startswith('vn '):
                parts = line.split()
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                normals.append((x, y, z))
                continue

            # Face line: f i j k...
            # Note: OBJ indices are 1-based
            elif line.startswith("f "):
                parts = line.split()[1:]
                face = []
                for p in parts:
                    # handle formats like "f v", "f v/t", "f v/t/n", etc.
                    if p not in face_map.keys():
                        face_map[p] = map_i
                        map_i += 1
                        pp = p.split('/')
                        vid = int(pp[0]) - 1 
                        tid = int(pp[1]) - 1 
                        nid = int(pp[2]) - 1 
                        vertices_final.append(vertices[vid])
                        texcoords_final.append(texcoords[tid])
                        normals_final.append(normals[nid])

                    face.append(face_map[p])
                        
                indices.append(face)

    return vertices_final, texcoords_final, normals_final, indices


def create_obj(obj):
    vertices, texcoords, normals, indices = load_obj(obj)

    o = {
            "program": "simpletexture",
            "texture": "furphero/img/test.png",
            "attribArrays": {
                "aPosition": [],
                "aUV": [],
                "aNormal": []
            },
            "indices": []

    }

    # Loop through vertices
    for i, v in enumerate(vertices):
        o["attribArrays"]["aPosition"] += list(v)

    for i, t in enumerate(texcoords):
        o["attribArrays"]["aUV"] += list(t)

    for i, n in enumerate(normals):
        o["attribArrays"]["aNormal"] += list(n)

    # Loop through faces/indices
    for i, face in enumerate(indices):
        o["indices"] += face

    # o["attribArrays"]["aPosition"] = o["attribArrays"]["aPosition"]
    # o["attribArrays"]["aUV"] = o["attribArrays"]["aUV"]

    return o


oo = {
    "furpModel": create_obj("furpv1.obj"),
    "stageModel": create_obj("stagev1.obj"),
    "arrowModel": create_obj("arrow.obj"),
    "trackModel": create_obj("track.obj"),
}

f = open("../furphero/models.json", "w")
f.write(json.dumps(oo, indent=4))
