## Richiesta 1

Building: villetta (a structure of size Large: 6.25 × 6.25 tiles, box 100 × 100 × 80 voxels, 16 voxels a tile; x left to right, y from the back to the front where the door is, z up).
A body needs a passage 10 voxels wide, a person is 24 tall, a step is 3. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.

Seed 1:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (13.3), z=33 (13.4)
- the door: x=49, y=99 (tile 3, 6), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 29 ceiling 33, z=1 side 29 ceiling 33, z=33 side 55 ceiling 31; doors 15 × 30, 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 5.7 tiles², ceiling 31, area house, 0.9,2.7,5.4,4.9
  0.2: storey 0 (z=1), room, 5.2 tiles², ceiling 31, area house, 0.9,0.9,5.4,2.7
  0.3: storey 0 (z=1), room, 2.4 tiles², ceiling 33, area porch, 2.2,4.9,4.4,6.3
  1.1: storey 1 (z=33), hall, 13.4 tiles², ceiling 31, area house, 0.9,0.9,5.4,4.4
- areas of the ground (tiles of 16 × 16): house 30 (0,0 1,0 2,0 3,0 4,0 5,0 0,1 1,1 2,1 3,1 4,1 5,1 0,2 1,2 2,2 3,2 4,2 5,2 0,3 1,3 2,3 3,3 4,3 5,3 0,4 1,4 2,4 3,4 4,4 5,4); path 2 (3,5 3,6); porch 4 (2,5 4,5 2,6 4,6)
- the animals stand on: no area of animals

Seed 2:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (13.1), z=33 (13.2)
- the door: x=49, y=99 (tile 3, 6), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 29 ceiling 33, z=1 side 29 ceiling 33, z=33 side 55 ceiling 31; doors 15 × 30, 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 5.7 tiles², ceiling 31, area house, 1.2,2.7,5.7,4.9
  0.2: storey 0 (z=1), room, 5.1 tiles², ceiling 31, area house, 1.2,0.9,5.7,2.7
  0.3: storey 0 (z=1), room, 2.4 tiles², ceiling 33, area porch, 2.2,4.9,4.4,6.3
  1.1: storey 1 (z=33), hall, 13.2 tiles², ceiling 31, area house, 1.2,0.9,5.7,4.4
- areas of the ground (tiles of 16 × 16): house 30 (0,0 1,0 2,0 3,0 4,0 5,0 0,1 1,1 2,1 3,1 4,1 5,1 0,2 1,2 2,2 3,2 4,2 5,2 0,3 1,3 2,3 3,3 4,3 5,3 0,4 1,4 2,4 3,4 4,4 5,4); path 2 (3,5 3,6); porch 4 (2,5 4,5 2,6 4,6)
- the animals stand on: no area of animals

Furnish this building.

## Risposta 1

```json
{"rules": [
  {"storey": 0, "area": "porch", "furniture": ["barile", "furniture"], "count": 1},
  {"storey": 0, "room": "hall", "furniture": ["credenza", "banco", "barile"], "count": 3},
  {"storey": 0, "room": "room", "furniture": ["credenza", "banco", "furniture"], "count": 3},
  {"storey": 1, "room": "hall", "furniture": ["letto", "letto", "furniture", "credenza"], "count": 5},
  {"room": "small", "furniture": ["furniture"], "count": 1}
]}
```
