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

<!-- Fattoria: ground floor hall = kitchen/living (hearth, madia, panche, tavolo); upper hall = sleeping (letti, cassapanche, scaffali).
     Barn floor (A): only a few hay racks/troughs along walls. Cellar (C): barrels/shelves.
     Seed varies placement via random one/prl matches; counts scale with free wall length. -->
<sequence values="BWFCPAMNHOTDRhSKVLGEJXY" symmetry="(xy)">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="X" hidden="True"/>
  <color symbol="Y" hidden="True"/>
  <color symbol="M" value="6b4a2e" name="tavolo"/>
  <color symbol="N" value="7a5232" name="madia"/>
  <color symbol="H" value="b0302a" name="letto"/>
  <color symbol="O" value="ff9a3c" glow="True" name="fuoco del focolare"/>
  <color symbol="D" value="5f574f" name="focolare"/>
  <color symbol="T" value="5a3a22" name="cassapanca"/>
  <color symbol="R" value="8a5a34" name="botte"/>
  <color symbol="h" value="8a6f30" name="panca"/>
  <color symbol="S" value="4e3420" name="scaffale"/>
  <color symbol="V" value="c9b25a" name="rastrelliera del fieno"/>
  <color symbol="L" value="6e5a3a" name="mangiatoia"/>
  <color symbol="G" value="d8c070" name="balla di fieno"/>
  <color symbol="E" value="3f5a2a" name="cesta"/>
  <color symbol="J" value="9a7a50" name="sedia"/>
  <color symbol="K" value="ffd27a" glow="True" name="lanterna"/>

  <!-- hearth: one per seed, against a wall -->
  <one in="WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF/WFFFFFFFFFF" out="*DD*******/*DO*******/*DO*******/*DO*******/*DD*******/**********" steps="1"/>
  <all in="B D" out="D *" steps="14"/>
  <!-- beds against walls (markers X) -->
  <one in="WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF" out="*HHHHHHHHHH******/*HHHHHHHHHH******/*HHHHHHHHHH******/*HHHHHHHHHH******/*HHHHHHHHHH******/*HHHHHHHHHH******" steps="3"/>
  <all in="B H" out="H *" steps="4"/>
  <!-- chests and cupboards along walls -->
  <one steps="8">
    <rule in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*TTTT*********/*TTTT*********/*TTTT*********/*TTTT*********" p="1"/>
    <rule in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*NNN**********/*NNN**********/*NNN**********/*NNN**********/*NNN**********" p="1"/>
    <rule in="WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF" out="*SS**********/*SS**********/*SS**********/*SS**********/*SS**********/*SS**********" p="1"/>
    <rule in="WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF" out="*hh**********/*hh**********/*hh**********/*hh**********/*hh**********/*hh**********/*hh**********/*hh**********" p="1"/>
  </one>
  <all in="B T" out="T *" steps="7"/>
  <all in="B N" out="N *" steps="14"/>
  <all in="B S" out="S *" steps="22"/>
  <all in="B h" out="h *" steps="4"/>
  <!-- table in the middle with passage all around -->
  <one in="FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFF" out="****************************/****************************/****************************/****************************/****************************/****************************/****************************/**********YYYYYYYY**********/**********YYYYYYYY**********/**********YYYYYYYY**********/**********YYYYYYYY**********/**********YYYYYYYY**********/**********YYYYYYYY**********/****************************/****************************/****************************/****************************/****************************/****************************/****************************/****************************/****************************" steps="2"/>
  <all in="B Y" out="Y *" steps="7"/>
  <all in="B Y" out="M *" steps="1"/>
  <all in="Y" out="F"/>
  <!-- cellar barrels -->
  <prl in="WCCCCCCCCCCCC/WCCCCCCCCCCCC/WCCCCCCCCCCCC/WCCCCCCCCCCCC" out="*RRRR********/*RRRR********/*RRRR********/*RRRR********" p="0.05" steps="1"/>
  <all in="B R" out="R *" steps="8"/>
  <!-- barn: a few hay racks and troughs along walls -->
  <prl steps="1" p="0.04">
    <rule in="WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA" out="*LL*********/*LL*********/*LL*********/*LL*********/*LL*********"/>
    <rule in="WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA" out="*GG*********/*GG*********/*GG*********/*GG*********"/>
  </prl>
  <all in="B L" out="L *" steps="3"/>
  <all in="B G" out="G *" steps="6"/>
  <!-- a basket here and there -->
  <prl in="WFFFFFFFFFFF/WFFFFFFFFFFF/WFFFFFFFFFFF" out="*EE*********/*EE*********/*EE*********" p="0.01" steps="1"/>
  <all in="B E" out="E *" steps="3"/>
  <!-- a lantern on a table -->
  <one in="B M" out="K *" steps="1"/>
</sequence>
