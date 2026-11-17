## Richiesta 1

Building: fattoria (a structure of size Large: 5 × 5 tiles, box 100 × 100 × 80 voxels, 20 voxels a tile; x left to right, y from the back to the front where the door is, z up).
A body needs a passage 11 voxels wide, a person is 30 tall, a step is 4. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.

Seed 1:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (3.7), z=33 (2.9)
- the door: x=49, y=85 (tile 2, 4), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 36 ceiling 63, z=1 side 36 ceiling 63, z=33 side 36 ceiling 31; doors 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 3.1 tiles², ceiling 31, area house, 1.7,2,3.6,4.3
  1.1: storey 1 (z=33), hall, 2.9 tiles², ceiling 31, area house, 1.7,2,3.6,3.8
- areas of the ground (tiles of 20 × 20): barn 2 (4,3 4,4); house 6 (1,2 2,2 3,2 1,3 2,3 3,3); yard 16 (0,0 1,0 2,0 3,0 4,0 0,1 1,1 2,1 3,1 4,1 0,2 4,2 0,3 0,4 1,4 3,4)
- the animals stand on: barn, 2 tiles: keep their floor free

Seed 2:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (3.7), z=33 (2.9)
- the door: x=49, y=85 (tile 2, 4), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 36 ceiling 63, z=1 side 36 ceiling 63, z=33 side 36 ceiling 31; doors 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 3.1 tiles², ceiling 31, area house, 1.7,2,3.6,4.3
  1.1: storey 1 (z=33), hall, 2.9 tiles², ceiling 31, area house, 1.7,2,3.6,3.8
- areas of the ground (tiles of 20 × 20): barn 2 (4,3 4,4); house 6 (1,2 2,2 3,2 1,3 2,3 3,3); yard 16 (0,0 1,0 2,0 3,0 4,0 0,1 1,1 2,1 3,1 4,1 0,2 4,2 0,3 0,4 1,4 3,4)
- the animals stand on: barn, 2 tiles: keep their floor free

Furnish this building.

## Risposta 1

```json
{"rules": [
  {"storey": 0, "area": "house", "room": "hall", "furniture": ["banco", "credenza", "barile", "furniture"], "count": 3},
  {"storey": 1, "area": "house", "room": "hall", "furniture": ["letto", "furniture"], "count": 2},
  {"area": "house", "room": "room", "furniture": ["letto", "furniture", "credenza"], "count": 2},
  {"area": "house", "room": "small", "furniture": ["barile", "furniture"], "count": 1}
]}
```
