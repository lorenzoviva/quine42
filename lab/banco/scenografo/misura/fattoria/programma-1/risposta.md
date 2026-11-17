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

<!-- Fattoria: ground-floor hall (kitchen/living): hearth against a wall, chests, benches, shelves, a central table.
     Upper hall: beds against walls, chests, a shelf. Barn edge: a few troughs/hay bales against walls next to A.
     Placement is random per seed (one/prl), counts bounded by steps. -->
<sequence values="BWFCPAMNTHLRYOKDhG" symmetry="(xy)">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="M" hidden="True"/>
  <color symbol="N" value="6b4a2e" name="cassapanca"/>
  <color symbol="T" value="8a6440" name="tavolo"/>
  <color symbol="H" value="7a5a3a" name="scaffale"/>
  <color symbol="L" value="c9b28a" name="letto"/>
  <color symbol="R" value="a03a2a" name="coperta"/>
  <color symbol="Y" value="d8c060" name="balla di fieno"/>
  <color symbol="O" value="ff8a30" glow="True" name="focolare"/>
  <color symbol="K" value="5a5a5a" name="camino"/>
  <color symbol="D" value="5a4030" name="mangiatoia"/>
  <color symbol="h" value="7a5a3a" name="panca"/>
  <color symbol="G" hidden="True"/>
  <!-- hearth: one per building, on a wall of the lower storey -->
  <one in="WFFFFF/WFFFFF/WFFFFF/WFFFFF/WFFFFF/WFFFFF/WFFFFF" out="*KKKK*/*KOOK*/*KOOK*/*KKKK*/******/******/******" steps="1"/>
  <all in="B K" out="K *" steps="12"/>
  <!-- beds against walls -->
  <one in="WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF" out="******************/******************/*LLLLLL***********/*LRRRRL***********/*LRRRRL***********/*LRRRRL***********/*LRRRRL***********/*LRRRRL***********/*LRRRRL***********/*LRRRRL***********/*LLLLLL***********/******************/******************" steps="2"/>
  <all in="B L" out="L *" steps="4"/>
  <all in="B R" out="R *" steps="5"/>
  <!-- chests and shelves against walls -->
  <one in="WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF" out="*****************/*****************/*NNNN************/*NNNN************/*NNNN************/*NNNN************/*****************/*****************" steps="3"/>
  <all in="B N" out="N *" steps="7"/>
  <one in="WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF" out="***************/***************/*HHH***********/*HHH***********/*HHH***********/*HHH***********/*HHH***********/*HHH***********/***************/***************" steps="2"/>
  <all in="B H" out="H *" steps="26"/>
  <!-- central table: needs a wide free square around it -->
  <one in="FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" out="******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/***********MMMMMMMM***********/***********MTTTTTTM***********/***********MTTTTTTM***********/***********MTTTTTTM***********/***********MTTTTTTM***********/***********MMMMMMMM***********/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************" steps="1"/>
  <all in="B T" out="T *" steps="7"/>
  <all in="B M" out="M *" steps="4"/>
  <all in="M" out="F"/>
  <all in="T B" out="* T" steps="0"/>
  <!-- barn edge: hay bales and a trough next to the animals, against walls -->
  <one in="WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF" out="*************/*************/*YYYY********/*YYYY********/*************/*************" steps="2"/>
  <one in="WAAAA/WAAAA/WAAAA/WAAAA/WAAAA/WAAAA/WAAAA/WAAAA" out="*****/*DDD*/*DDD*/*DDD*/*DDD*/*DDD*/*DDD*/*****" steps="1"/>
  <all in="B Y" out="Y *" steps="5"/>
  <all in="B D" out="D *" steps="4"/>
</sequence>
