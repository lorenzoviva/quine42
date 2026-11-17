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

<?xml version="1.0"?>
<!--
Farmhouse (fattoria): two storeys of house plus a barn where the animals stand.
Ground floor (hall): hearth against a wall, a farm table in the middle, chests, shelves (madia), benches.
Upper floor (hall): beds against the walls, chests, a wardrobe.
Barn floor (A) stays free; a few troughs and hay bales only along its walls.
Seeds vary through random placement (one/prl) of markers against the walls.
-->
<sequence values="BWFCPAMTHLNSOGYRDK" symmetry="(xy)">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="M" hidden="True"/>
  <color symbol="T" hidden="True"/>
  <color symbol="H" value="6e6a66" name="focolare"/>
  <color symbol="O" value="ff8a2a" glow="True" name="brace"/>
  <color symbol="L" value="7a5230" name="letto"/>
  <color symbol="N" value="6b4a2e" name="cassapanca"/>
  <color symbol="S" value="8a6440" name="madia"/>
  <color symbol="G" value="5c3d22" name="tavolo"/>
  <color symbol="Y" value="d8c060" name="balla di fieno"/>
  <color symbol="R" value="7d6a50" name="mangiatoia"/>
  <color symbol="D" value="9a7a52" name="panca"/>
  <color symbol="K" value="584030" name="armadio"/>

  <!-- hearth: one per building, against a wall, wide passage in front -->
  <one steps="1">
    <rule in="WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF/WFFFFFFFFFFFF" out="*HHHH********/*HHHH********/*HHHH********/*HHHH********/*HHHH********/*HHHH********"/>
  </one>
  <all in="B H" out="H *" steps="14"/>
  <one in="H F" out="* O" steps="2"/>

  <!-- table in the middle: a 6x10 marker with free floor all around -->
  <one steps="1">
    <rule>
      <in>FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF</in>
      <out>******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/**********GGGGGGGGGG**********/**********GGGGGGGGGG**********/**********GGGGGGGGGG**********/**********GGGGGGGGGG**********/**********GGGGGGGGGG**********/**********GGGGGGGGGG**********/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************</out>
    </rule>
  </one>
  <all in="B G" out="G *" steps="7"/>

  <!-- beds against walls (only where a ceiling is near: both storeys; keep it modest) -->
  <one steps="2">
    <rule in="WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFF" out="*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********/*LLLLLL**********"/>
  </one>
  <all in="B L" out="L *" steps="4"/>

  <!-- chests, cupboards, wardrobes, benches along walls: random kind per spot -->
  <prl steps="1" p="0.25">
    <rule in="WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF" out="**************/*NNNN*********/*NNNN*********/*NNNN*********/*NNNN*********/*NNNN*********/*NNNN*********/**************"/>
  </prl>
  <one steps="4">
    <rule in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*SSS**********/*SSS**********/*SSS**********/*SSS**********/*SSS**********/*SSS**********" p="1"/>
    <rule in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*KKKK*********/*KKKK*********/*KKKK*********/*KKKK*********/*KKKK*********/*KKKK*********/*KKKK*********/*KKKK*********" p="0.6"/>
    <rule in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*DDD**********/*DDD**********/*DDD**********/*DDD**********/*DDD**********/*DDD**********/*DDD**********/*DDD**********/*DDD**********/*DDD**********" p="0.8"/>
  </one>
  <all in="B N" out="N *" steps="6"/>
  <all in="B D" out="D *" steps="4"/>
  <all in="B K" out="K *" steps="24"/>
  <all in="B S" out="S *" steps="22"/>

  <!-- barn: a trough and hay bales on the edge of the animals' floor -->
  <one steps="1">
    <rule in="WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA" out="*RRR********/*RRR********/*RRR********/*RRR********/*RRR********/*RRR********/*RRR********/*RRR********"/>
  </one>
  <all in="B R" out="R *" steps="4"/>
  <one steps="2">
    <rule in="WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA/WAAAAAAAAAAA" out="*YYYY*******/*YYYY*******/*YYYY*******/*YYYY*******/*YYYY*******"/>
  </one>
  <all in="B Y" out="Y *" steps="5"/>
</sequence>
