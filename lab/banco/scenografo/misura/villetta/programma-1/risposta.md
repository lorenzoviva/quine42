## Richiesta 1

Building: villetta (a structure of size Large: 5 × 5 tiles, box 100 × 100 × 80 voxels, 20 voxels a tile; x left to right, y from the back to the front where the door is, z up).
A body needs a passage 11 voxels wide, a person is 30 tall, a step is 4. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.

Seed 1:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (3.9), z=33 (3.4)
- the door: x=49, y=99 (tile 2, 4), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 41 ceiling 33, z=1 side 41 ceiling 33, z=33 side 41 ceiling 31; doors 11 × 30, 11 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 3.9 tiles², ceiling 31, area house, 1.5,2,3.6,5
  1.1: storey 1 (z=33), hall, 3.4 tiles², ceiling 31, area house, 1.7,2,3.6,4.1
- areas of the ground (tiles of 20 × 20): garden 3 (0,1 1,1 0,2); house 11 (2,1 3,1 1,2 2,2 3,2 0,3 1,3 2,3 3,3 1,4 3,4); porch 1 (2,4)
- the animals stand on: no area of animals

Seed 2:
- storeys one reaches on foot (z of the floor, covered tiles²): z=1 (3.8), z=33 (3.4)
- the door: x=49, y=99 (tile 2, 4), open
- habitable parts (kernel): 2 storeys reached; rooms z=0 side 41 ceiling 33, z=1 side 41 ceiling 33, z=33 side 41 ceiling 31; doors 11 × 30, 11 × 30
- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):
  0.1: storey 0 (z=1), hall, 3.8 tiles², ceiling 31, area house, 1.7,2,3.6,5
  1.1: storey 1 (z=33), hall, 3.4 tiles², ceiling 31, area house, 1.7,2,3.6,4.1
- areas of the ground (tiles of 20 × 20): garden 5 (1,1 2,1 3,1 4,3 4,4); house 10 (4,1 1,2 2,2 3,2 4,2 1,3 2,3 3,3 1,4 3,4); porch 1 (2,4)
- the animals stand on: no area of animals

Furnish this building.

## Risposta 1

<!-- Villetta: ground floor hall = soggiorno/cucina: hearth/credenza and shelves against walls, a table in the middle
     with clearance, benches along walls. Upper hall = camera: beds and chests against walls, a wardrobe.
     Counts are small and placed at random matches, so each seed differs; growth always has steps. -->
<sequence values="BWFCPAMNHOTKDRSV" symmetry="(xy)">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="M" hidden="True"/>
  <color symbol="N" value="6b4a2e" name="armadio"/>
  <color symbol="H" value="8a6f30" name="cassapanca"/>
  <color symbol="O" value="ffa040" glow="True" name="focolare"/>
  <color symbol="T" value="7a5436" name="tavolo"/>
  <color symbol="K" value="b03a3a" name="letto"/>
  <color symbol="D" value="5f574f" name="camino"/>
  <color symbol="R" value="a07850" name="panca"/>
  <color symbol="S" value="9c8060" name="scaffale"/>
  <color symbol="V" hidden="True"/>
  <!-- hearth against a wall: base marker, then stone stack -->
  <one in="WFFFFFFFFFFFFFFF" out="*VVVF**********" steps="1"/>
  <all in="B V" out="V *" steps="10"/>
  <all in="V" out="D"/>
  <one in="WDFF" out="**O*" steps="1"/>
  <!-- shelves to the ceiling, a few -->
  <one in="WFFFFFFFFFFFFFFF" out="*SS*************" steps="3"/>
  <all in="B S" out="S *" steps="30"/>
  <!-- chests against walls -->
  <one in="WFFFFFFFFFFFFFFF" out="*HHHH***********" steps="3"/>
  <all in="B H" out="H *" steps="6"/>
  <!-- benches -->
  <one in="WFFFFFFFFFFFFFFF" out="*RRRR***********" steps="2"/>
  <all in="B R" out="R *" steps="4"/>
  <!-- beds: wide footprint on the floor, kept low -->
  <one in="WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF" out="*KKKKKKKKK********/*KKKKKKKKK********/*KKKKKKKKK********/*KKKKKKKKK********/*KKKKKKKKK********/*KKKKKKKKK********" steps="2"/>
  <all in="B K" out="K *" steps="4"/>
  <!-- wardrobe -->
  <one in="WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF" out="*NNN************/*NNN************/*NNN************" steps="1"/>
  <all in="B N" out="N *" steps="24"/>
  <!-- table in the middle: 5x5 FF ring of free floor around a 3x3 top marker -->
  <one steps="1">
    <in>FFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFF</in>
    <out>*************************/*************************/*************************/***********M*************/*************************/*************************/*************************</out>
  </one>
  <all in="B M" out="M *" steps="7"/>
  <all in="B M" out="T *" steps="1"/>
  <all in="M" out="T"/>
</sequence>
