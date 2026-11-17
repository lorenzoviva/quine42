## Richiesta 1

Building: fattoria (a structure of size Large: 6.25 × 6.25 tiles, box 100 × 100 × 80 voxels, 16 voxels a tile; x left to right, y from the back to the front where the door is, z up).
A body needs a passage 10 voxels wide, a person is 24 tall, a step is 3. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.

Seed 1:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (4.7), z=33 (4.5)
- the door: x=49, y=85 (tile 3, 5), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 34 ceiling 63, z=1 side 34 ceiling 63, z=33 side 34 ceiling 31; doors 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 4.7 tiles², ceiling 31, area house, 2.1,2.4,4.4,5.4
  1.1: storey 1 (z=33), hall, 4.5 tiles², ceiling 31, area house, 2.1,2.4,4.4,4.8
- areas of the ground (tiles of 16 × 16): barn 3 (5,3 5,4 5,5); hay 5 (0,0 1,0 0,1 1,1 2,1); house 12 (1,2 2,2 3,2 4,2 1,3 2,3 3,3 4,3 1,4 2,4 3,4 4,4); road 4 (2,5 3,5 2,6 3,6)
- the animals stand on: barn, 3 tiles: keep their floor free

Seed 2:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (4.7), z=33 (4.5)
- the door: x=49, y=85 (tile 3, 5), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 34 ceiling 63, z=1 side 34 ceiling 63, z=33 side 34 ceiling 31; doors 15 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 4.7 tiles², ceiling 31, area house, 2.1,2.4,4.4,5.4
  1.1: storey 1 (z=33), hall, 4.5 tiles², ceiling 31, area house, 2.1,2.4,4.4,4.8
- areas of the ground (tiles of 16 × 16): barn 3 (5,3 5,4 5,5); hay 2 (0,1 2,1); house 12 (1,2 2,2 3,2 4,2 1,3 2,3 3,3 4,3 1,4 2,4 3,4 4,4); road 4 (2,5 3,5 2,6 3,6)
- the animals stand on: barn, 3 tiles: keep their floor free

Furnish this building.

## Risposta 1

```json
{"rules": [
  {"storey": 0, "area": "house", "room": "hall", "furniture": ["banco", "credenza", "barile", "furniture"], "count": 4},
  {"storey": 1, "area": "house", "room": "hall", "furniture": ["letto", "furniture", "credenza"], "count": 3},
  {"area": "house", "room": "room", "furniture": ["letto", "furniture"], "count": 2},
  {"area": "house", "room": "small", "furniture": ["barile", "furniture"], "count": 1}
]}
```
