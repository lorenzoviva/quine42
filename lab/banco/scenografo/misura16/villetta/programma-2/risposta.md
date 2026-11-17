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

<!-- Villetta: a small two-storey house, one hall per storey (about 6 tiles², ceiling 31).
     Ground floor: hearth/credenza against walls, a few chests and shelves, a table in the middle.
     Upper floor: beds against walls, chests, a small wardrobe.
     Markers are scattered randomly along walls, so every seed varies; the counts are small for a small house. -->
<sequence values="BWFCPAXYZQNOHhRrDdTL" symmetry="(xy)">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="X" hidden="True"/>
  <color symbol="Y" hidden="True"/>
  <color symbol="Z" hidden="True"/>
  <color symbol="Q" hidden="True"/>
  <color symbol="N" value="6b4a2e" name="cassapanca"/>
  <color symbol="O" value="ff8a2a" glow="True" name="brace del focolare"/>
  <color symbol="H" value="8a8070" name="focolare"/>
  <color symbol="h" value="7a5a36" name="scaffale"/>
  <color symbol="R" value="a83a3a" name="letto"/>
  <color symbol="r" value="e8dcc8" name="cuscino"/>
  <color symbol="D" value="5a3e26" name="armadio"/>
  <color symbol="d" value="8a6440" name="credenza"/>
  <color symbol="T" value="9a7048" name="tavolo"/>
  <color symbol="L" value="6a4a30" name="sedia"/>

  <!-- hearth: a single one on ground floor, against a wall, with passage in front -->
  <one in="WFFFFFFFFFFFF B B B B B B B B B B B B/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF" out="*************" steps="0"/>
  <one steps="1">
    <rule in="WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF" out="*HHHH******/*HOOH******/*HOOH******/*HHHH******/*HHHH******/*HHHH******"/>
  </one>
  <all in="B H" out="H *" steps="9"/>

  <!-- chests and shelves along walls, few -->
  <prl in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*XXXX*********/*XXXX*********/*XXXX*********/*XXXX*********/*XXXX*********/*XXXX*********" p="0.004" steps="1"/>
  <prl in="WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF" out="*YYY*********/*YYY*********/*YYY*********/*YYY*********/*YYY*********/*YYY*********/*YYY*********/*YYY*********" p="0.003" steps="1"/>
  <!-- beds: 6 wide, 10 long, needing space -->
  <prl in="WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFFF" out="*ZZZZZZZZZZ***********/*ZZZZZZZZZZ***********/*ZZZZZZZZZZ***********/*ZZZZZZZZZZ***********/*ZZZZZZZZZZ***********/*ZZZZZZZZZZ***********/**********************/**********************" p="0.002" steps="1"/>

  <!-- grow -->
  <all in="B X" out="X *" steps="6"/>
  <all in="B Y" out="Y *" steps="22"/>
  <all in="B Z" out="Z *" steps="4"/>
  <all in="X" out="N"/>
  <all in="Y" out="h"/>
  <all in="Z B" out="r *"/>
  <all in="Z" out="R"/>
  <all in="r" out="R"/>
  <one in="WRR B B" out="*rr * *" steps="0"/>

  <!-- table in the middle: needs wide F all around -->
  <one in="FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFF" out="**************************/**************************/**************************/**************************/**************************/**************************/**************************/**************************/**********QQQQQQ**********/**********QQQQQQ**********/**********QQQQQQ**********/**********QQQQQQ**********/**************************/**************************/**************************/**************************/**************************/**************************/**************************/**************************/**************************/**************************" steps="1"/>
  <all in="B Q" out="Q *" steps="7"/>
  <all in="Q B" out="T *"/>
  <all in="Q" out="B"/>
  <all in="T Q" out="T T"/>
  <all in="T B" out="* Q"/>
  <all in="Q" out="F"/>
  <all in="B T" out="T *" steps="0"/>
</sequence>
