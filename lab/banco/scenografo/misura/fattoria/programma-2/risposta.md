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

<!-- Fattoria: ground hall (z=1) gets a hearth, chests, benches and a central table; upper hall (z=33) gets beds, chests and shelves.
     Barn (A) only gets troughs and hay along its edges. Placement is random per seed (one/prl), so every seed differs. -->
<sequence values="BWFCPAHTLSKMNOQRYmtlh">
  <color symbol="W" hidden="True"/>
  <color symbol="F" hidden="True"/>
  <color symbol="C" hidden="True"/>
  <color symbol="P" hidden="True"/>
  <color symbol="A" hidden="True"/>
  <color symbol="m" hidden="True"/>
  <color symbol="t" hidden="True"/>
  <color symbol="l" hidden="True"/>
  <color symbol="h" hidden="True"/>
  <color symbol="H" value="7a4a2a" name="camino"/>
  <color symbol="O" value="ffa040" glow="True" name="fuoco"/>
  <color symbol="T" value="8a5a34" name="tavolo"/>
  <color symbol="L" value="6b4a2e" name="letto"/>
  <color symbol="S" value="5a3a22" name="scaffale"/>
  <color symbol="K" value="7b5232" name="cassapanca"/>
  <color symbol="M" value="9a6a3c" name="panca"/>
  <color symbol="N" value="5b4a3a" name="mangiatoia"/>
  <color symbol="Q" value="d8c060" name="fieno"/>
  <color symbol="R" value="b8b0a0" name="lenzuolo"/>
  <color symbol="Y" value="c09050" name="botte"/>

  <!-- hearth: one, against a wall -->
  <one in="WFFFFFFFFFFFF" out="*HHH*********" steps="1"/>
  <all in="B H" out="H *" steps="14"/>
  <one in="H/F" out="*/O" steps="1"/>

  <!-- beds against walls (few) -->
  <one in="WFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFFFFFFF" out="*LLLLLLLLLL**********/*LLLLLLLLLL**********/*LLLLLLLLLL**********/*LLLLLLLLLL**********/*LLLLLLLLLL**********/*LLLLLLLLLL**********" steps="2"/>
  <all in="B L" out="l *" steps="1"/>
  <all in="B l" out="l *" steps="3"/>
  <all in="l" out="L"/>
  <one in="L B" out="* R" steps="40"/>

  <!-- chests and barrels against walls -->
  <one in="WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF/WFFFFFFFFFFFFFFF" out="*KKKKK**********/*KKKKK**********/*KKKKK**********/*KKKKK**********" steps="3"/>
  <all in="B K" out="m *" steps="1"/>
  <all in="B m" out="m *" steps="5"/>
  <all in="m" out="K"/>
  <one in="WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF/WFFFFFFFFFFFFFF" out="*YYYY**********/*YYYY**********/*YYYY**********/*YYYY**********" steps="2"/>
  <all in="B Y" out="t *" steps="1"/>
  <all in="B t" out="t *" steps="8"/>
  <all in="t" out="Y"/>

  <!-- shelves: thin, tall -->
  <one in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*SS***********/*SS***********/*SS***********/*SS***********/*SS***********/*SS***********" steps="2"/>
  <all in="B S" out="h *" steps="1"/>
  <all in="B h" out="h *" steps="22"/>
  <all in="h" out="S"/>

  <!-- table in the middle, with free ring of 11 around -->
  <one steps="1">
    <in>FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF</in>
    <out>******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/***********TTTTTTTT***********/***********TTTTTTTT***********/***********TTTTTTTT***********/***********TTTTTTTT***********/***********TTTTTTTT***********/***********TTTTTTTT***********/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************/******************************</out>
  </one>
  <all in="B T" out="T *" steps="7"/>

  <!-- benches against walls, low -->
  <one in="WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF/WFFFFFFFFFFFFF" out="*MMM**********/*MMM**********/*MMM**********/*MMM**********/*MMM**********/*MMM**********/*MMM**********/*MMM**********" steps="2"/>
  <all in="B M" out="M *" steps="3"/>

  <!-- barn: troughs and hay along walls only -->
  <one in="WAAAAAAAAAAAAA/WAAAAAAAAAAAAA/WAAAAAAAAAAAAA/WAAAAAAAAAAAAA/WAAAAAAAAAAAAA/WAAAAAAAAAAAAA" out="*NN***********/*NN***********/*NN***********/*NN***********/*NN***********/*NN***********" steps="2"/>
  <all in="B N" out="N *" steps="4"/>
  <one in="WAAAAAAAAAAAAA/WAAAAAAAAAAAAA/WAAAAAAAAAAAAA/WAAAAAAAAAAAAA" out="*QQ***********/*QQ***********/*QQ***********/*QQ***********" steps="2"/>
  <all in="B Q" out="Q *" steps="5"/>
</sequence>
