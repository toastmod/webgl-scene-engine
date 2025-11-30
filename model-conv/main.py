import json
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
    texcoords = []
    indices = []

    with open(path, 'r') as f:
        for line in f:
            line = line.strip()

            # Vertex line: v x y z
            if line.startswith('v '):
                parts = line.split()
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                vertices.append((x, y, z))

            # Vertex line: vt u v 
            if line.startswith('vt '):
                parts = line.split()
                u, v = float(parts[1]), float(parts[2])
                texcoords.append((u, v))

            # Face line: f i j k...
            # Note: OBJ indices are 1-based
            elif line.startswith('f '):
                parts = line.split()[1:]
                face = []
                for p in parts:
                    # handle formats like "f v", "f v/t", "f v/t/n", etc.
                    face.append(int(p.split('/')[0]) - 1)
                indices.append(face)

    return vertices, texcoords, indices


def create_obj(obj):
    vertices, texcoords, indices = load_obj(obj)

    o = {
            "program": "simpletexture",
            "texture": "furphero/img/test.png",
            "attribArrays": {
                "aPosition": [],
                "aUV": []
            },
            "indices": []
    }

    # Loop through vertices
    for i, v in enumerate(vertices):
        o["attribArrays"]["aPosition"] += list(v)
        o["attribArrays"]["aUV"] += list(v)

    for i, t in enumerate(texcoords):
        o["attribArrays"]["aPosition"] += list(t)
        o["attribArrays"]["aUV"] += list(t)

    # Loop through faces/indices
    for i, face in enumerate(indices):
        o["indices"] += face
    

    o["attribArrays"]["aPosition"] = o["attribArrays"]["aPosition"]
    o["attribArrays"]["aUV"] = o["attribArrays"]["aUV"]

    return o


oo = {
    "furpModel": create_obj("furpv1.obj"),
    "stageModel": create_obj("stagev1.obj")
}

f = open("models.json", "w")
f.write(json.dumps(oo, indent=4))