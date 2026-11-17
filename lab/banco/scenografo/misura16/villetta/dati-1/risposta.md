## Richiesta 1

Building: villetta (a structure of size Large: 6.25 × 6.25 tiles, box 100 × 100 × 80 voxels, 16 voxels a tile; x left to right, y from the back to the front where the door is, z up).
A body needs a passage 10 voxels wide, a person is 24 tall, a step is 3. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.

Seed 1:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (6.2), z=33 (6.0)
- the door: x=49, y=80 (tile 3, 5), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 44 ceiling 63, z=1 side 44 ceiling 63, z=33 side 44 ceiling 31; doors 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 6.2 tiles², ceiling 31, area house, 2.1,1.5,4.4,5.1
  1.1: storey 1 (z=33), hall, 6.0 tiles², ceiling 31, area house, 2.1,1.5,4.4,4.4
- areas of the ground (tiles of 16 × 16): garden 33 (0,0 1,0 2,0 3,0 4,0 5,0 6,0 0,1 1,1 5,1 6,1 0,2 1,2 5,2 6,2 0,3 1,3 0,4 1,4 6,4 0,5 1,5 3,5 4,5 5,5 6,5 0,6 1,6 2,6 3,6 4,6 5,6 6,6); house 14 (2,1 3,1 4,1 2,2 3,2 4,2 2,3 3,3 4,3 5,3 2,4 3,4 4,4 5,4); porch 1 (2,5)
- the animals stand on: no area of animals

Seed 2:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (6.2), z=33 (6.0)
- the door: x=49, y=80 (tile 3, 5), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 44 ceiling 63, z=1 side 44 ceiling 63, z=33 side 44 ceiling 31; doors 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 6.2 tiles², ceiling 31, area house, 2.1,1.5,4.4,5.1
  1.1: storey 1 (z=33), hall, 6.0 tiles², ceiling 31, area house, 2.1,1.5,4.4,4.4
- areas of the ground (tiles of 16 × 16): garden 26 (0,0 1,0 2,0 3,0 4,0 5,0 0,1 1,1 5,1 5,2 0,3 5,3 0,4 1,4 5,4 0,5 1,5 3,5 4,5 5,5 0,6 1,6 2,6 3,6 4,6 5,6); house 15 (2,1 3,1 4,1 0,2 1,2 2,2 3,2 4,2 1,3 2,3 3,3 4,3 2,4 3,4 4,4); porch 1 (2,5)
- the animals stand on: no area of animals

Furnish this building.

## Risposta 1

```json
{"rules": [
  {"storey": 0, "area": "house", "room": "hall", "furniture": ["credenza", "banco", "barile", "furniture"], "count": 4},
  {"storey": 1, "area": "house", "room": "hall", "furniture": ["letto", "letto", "furniture", "credenza"], "count": 3},
  {"room": "small", "furniture": ["furniture", "barile"], "count": 1},
  {"furniture": ["credenza", "furniture"], "count": 2}
]}
```
