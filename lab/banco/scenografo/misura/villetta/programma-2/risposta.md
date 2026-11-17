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

<!-- Villetta: ground hall (living): sofa/bench and shelves against walls, chests, a table with chairs in the middle, a hearth with embers.
     Upper hall (bedrooms): beds against walls, wardrobes, chests. Placement is random per seed; counts are small. -->
<sequence values="BWFCPAMTNSLKOEbX">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="M" hidden="True"/>
  <color symbol="T" value="7a5230" name="tavolo"/>
  <color symbol="N" value="6b4a2e" name="armadio"/>
  <color symbol="S" value="8a6f50" name="scaffale"/>
  <color symbol="L" value="b8a888" name="letto"/>
  <color symbol="K" value="a03a3a" name="divano"/>
  <color symbol="O" value="ff8a30" glow="True" name="brace"/>
  <color symbol="E" value="5a5a5a" name="camino"/>
  <color symbol="b" value="4a3020" name="cassapanca"/>
  <color symbol="X" hidden="True"/>
  <!-- hearth against a wall: 6 wide, with passage in front -->
  <one steps="1">
    <rule in="WFFFFFF/WFFFFFF/WFFFFFF/WFFFFFF/WFFFFFF/WFFFFFF" out="*EE****/*OE****/*OE****/*OE****/*OE****/*EE****"/>
  </one>
  <all in="B E" out="E *" steps="14"/>
  <!-- shelves along walls -->
  <one steps="3">
    <rule in="WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF" out="*SS************/*SS************/*SS************/*SS************/*SS************/*SS************/*SS************/*SS************"/>
  </one>
  <all in="B S" out="S *" steps="24"/>
  <!-- beds / sofas against walls: 10 long, 6 deep -->
  <one steps="3">
    <rule in="WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF" out="*LLLLLLLLLL*******/*LLLLLLLLLL*******/*LLLLLLLLLL*******/*LLLLLLLLLL*******/*LLLLLLLLLL*******/*LLLLLLLLLL*******"/>
    <rule in="WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFF" out="*KKKKKKKKKK*******/*KKKKKKKKKK*******/*KKKKKKKKKK*******/*KKKKKKKKKK*******"/>
  </one>
  <all in="B L" out="L *" steps="4"/>
  <all in="B K" out="K *" steps="6"/>
  <!-- wardrobes and chests -->
  <one steps="4">
    <rule in="WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF" out="*NNNN***********/*NNNN***********/*NNNN***********/*NNNN***********/*NNNN***********"/>
    <rule in="WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF" out="*bbbb**********/*bbbb**********/*bbbb**********/*bbbb**********"/>
  </one>
  <all in="B N" out="N *" steps="22"/>
  <all in="B b" out="b *" steps="5"/>
  <!-- table in the middle: 8x8 with 11 free all around -->
  <one steps="2">
    <rule>
      <in>FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF</in>
      <out>******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/***********MMMMMMMM***********/***********MMMMMMMM***********/***********MMMMMMMM***********/***********MMMMMMMM***********/***********MMMMMMMM***********/***********MMMMMMMM***********/***********MMMMMMMM***********/***********MMMMMMMM***********/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************</out>
    </rule>
  </one>
  <all in="B M" out="X *" steps="1"/>
  <all in="B X" out="X *" steps="6"/>
  <all in="X X" out="* X" steps="1"/>
  <all in="X/X" out="T/*"/>
  <all in="X" out="T"/>
  <all in="M" out="F"/>
</sequence>
