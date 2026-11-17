## Richiesta 1

Building: fattoria (a structure of size Large: 6.25 × 6.25 tiles, box 100 × 100 × 80 voxels, 16 voxels a tile; x left to right, y from the back to the front where the door is, z up).
A body needs a passage 10 voxels wide, a person is 24 tall, a step is 3. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.

Seed 1:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (12.4), z=33 (14.1)
- the door: x=49, y=90 (tile 3, 5), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 29 ceiling 63, z=1 side 29 ceiling 63, z=33 side 54 ceiling 31; doors 11 × 30, 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 6.1 tiles², ceiling 31, area yard, 1.2,3.3,5.4,5.7
  0.2: storey 0 (z=1), room, 5.0 tiles², ceiling 31, area —, 1.2,1.5,5.4,3.3
  1.1: storey 1 (z=33), hall, 14.1 tiles², ceiling 31, area yard, 1.2,1.5,5.4,5.1
- areas of the ground (tiles of 16 × 16): barn 7 (0,0 1,0 0,1 0,2 0,3 0,4 0,5); field 5 (3,0 1,5 5,5 1,6 5,6); yard 7 (2,0 2,5 3,5 4,5 2,6 3,6 4,6)
- the animals stand on: barn, 7 tiles: keep their floor free

Seed 2:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (11.3), z=33 (14.1)
- the door: x=49, y=90 (tile 3, 5), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 29 ceiling 63, z=1 side 29 ceiling 63, z=33 side 54 ceiling 31; doors 11 × 30, 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 6.1 tiles², ceiling 31, area barn, 1.2,3.3,5.4,5.7
  0.2: storey 0 (z=1), room, 5.0 tiles², ceiling 31, area barn, 1.2,1.5,5.4,3.3
  1.1: storey 1 (z=33), hall, 14.1 tiles², ceiling 31, area barn, 1.2,1.5,5.4,5.1
- areas of the ground (tiles of 16 × 16): barn 12 (4,0 5,0 6,0 5,1 6,1 5,2 6,2 5,3 6,3 5,4 6,4 6,5); field 6 (2,0 3,0 1,5 5,5 1,6 5,6); yard 6 (2,5 3,5 4,5 2,6 3,6 4,6)
- the animals stand on: barn, 12 tiles: keep their floor free

Furnish this building.

## Risposta 1

```json
{"rules": [
  {"storey": 0, "room": "hall", "furniture": ["banco", "barile", "furniture"], "count": 4},
  {"storey": 0, "room": "room", "furniture": ["credenza", "barile", "banco"], "count": 3},
  {"storey": 0, "room": "small", "furniture": ["barile", "furniture"], "count": 1},
  {"storey": 1, "room": "hall", "furniture": ["letto", "letto", "furniture", "credenza"], "count": 6},
  {"storey": 1, "room": "room", "furniture": ["letto", "furniture"], "count": 3},
  {"room": "small", "furniture": ["furniture", "barile"], "count": 1}
]}
```
