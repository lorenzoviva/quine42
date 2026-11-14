# model.sculpt · gemini-4-hydrogen · 20 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  Forte:
  - Mastio (h pavimento, s zona scala, w mura, d porta del mastio): al centro-retro del cortile, a due piani con tetto a padiglione e finestre.
  - Cortile (c) attorno al mastio, con lastricato (n) dall'ingresso al mastio; ospita un pozzo (Q).
  - Cinta muraria (W) spessa due celle attorno al cortile, con torri angolari (t) di 5x5, merli (M) e feritoie (U).
  - Corpo di guardia / portone (G) sul lato frontale della cinta, con strada (r) dritta fino al bordo.
  - Fossato (a) attorno alle mura e alberi (Y) all'esterno dove lo spazio lo consente (taglia gargantuan).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcnWtGQaYr" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio: nucleo attorno a H, almeno 7x7 celle (35x35 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="2" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="H" out="h" steps="1"/>
      <!-- Zona scala nel mastio: 2 celle di pianerottolo prima, 4x2 per la scala -->
      <one in="hhhhhhh/hhhhhhh" out="*******/**ssss*" symmetry="()" steps="1"/>
      <!-- Mura del mastio -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Cortile attorno al mastio -->
      <all in="wE" out="*c" steps="4"/><all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile dove c'è spazio -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- Cinta muraria spessa 2 celle attorno al cortile -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- Via d'uscita: dal mastio al fronte attraverso porta (d), lastricato (n), portone (G), strada (r) -->
      <one in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/w" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <!-- Pozzo nel cortile dove entra 5x5 di cortile libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fossato attorno alla cinta dove c'è spazio libero -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Alberi all'esterno dove c'è 5x5 di terreno libero -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**Y**/*****/*****" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdcnWtGQaYrPuRfFTKLqAyOoNMUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="Q" out="ccccc/cqqqc/cqAqc/cqqqc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Y" out="EEEEE/EEEEE/EEyEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <sequence symmetry="(xy)">
        <!-- B. Le altezze -->
        <!-- Porte a quota 0 (O) e passaggio a mura a quota 1 -->
        <all steps="1">
          <rule in="B d" out="d O"/>
          <rule in="B G" out="G O"/>
          <rule in="B w" out="w P"/>
          <rule in="B W" out="W P"/>
        </all>
        <prl>
          <rule in="d" out="w"/>
          <rule in="G" out="W"/>
        </prl>
        <!-- Mura del mastio: 2 piani (64 voxel) -->
        <all in="B w" out="w P" steps="5"/>
        <all in="B w" out="w u" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/>
        <all in="B w" out="w u" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <prl in="w" out="R"/>
        <!-- Pavimenti e solaio del mastio e striscia della scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- Cinta muraria (24 voxel) e torri (40 voxel) -->
        <all in="B W" out="W P" steps="22"/>
        <prl in="W" out="P"/>
        <all in="B t" out="t P" steps="39"/>
        <prl in="t" out="P"/>
        <!-- Pozzo e alberi -->
        <all in="B q" out="q P" steps="4"/><prl in="q" out="P"/>
        <all in="B y" out="y K" steps="10"/><prl in="y" out="L"/>
        <all in="LB" out="*L" steps="2"/>

        <!-- C. Scala reale: porte, parti incluse, finestre, tetti -->
        <union symbol="+" values="Puw"/>
        <union symbol="%" values="P"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <!-- Finestre nel mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="P"/>
        <!-- Tetto a padiglione del mastio -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="#6b7a4a" hidden="True"/>
  <color symbol="c" value="#9a8e7a" name="cortile" area="courtyard"/>
  <color symbol="n" value="#888074" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#9e8c6c" name="strada" area="road"/>
  <color symbol="a" value="#355d78" name="fossato" area="moat"/>
  <color symbol="A" value="#3d6a7a" name="acqua del pozzo"/>
  <color symbol="P" value="#7a7672" name="pietra delle mura"/>
  <color symbol="M" value="#686460" name="merli"/>
  <color symbol="U" value="#383430" name="feritoia"/>
  <color symbol="R" value="#8b4232" name="tegole del tetto"/>
  <color symbol="f" value="#b89868" name="pavimento" area="keep"/>
  <color symbol="F" value="#a08050" name="solaio"/>
  <color symbol="k" value="#947448" name="gradini"/>
  <color symbol="O" value="#5a3d28" name="porta"/>
  <color symbol="o" value="#3e2818" name="assi della porta"/>
  <color symbol="N" value="#504c48" name="stipite"/>
  <color symbol="L" value="#4a6a35" name="chioma"/>
  <color symbol="K" value="#5c422c" name="tronco"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2); porta: 15 × 24 voxel (0,75 × 1,20 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c cortile, n lastricato, r strada, P pietra delle mura, R tegole del tetto, f pavimento, F solaio, L chioma, A acqua del pozzo, O porta, o assi della porta, N stipite, M merli, U feritoia, k gradini
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEPPPPPPPccccccccccccccccccccccccccccccccccPPPPPPP
EEPPPPPPcccccccccccccccccccccccccccccccccccMPPPPPP
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPcccccccccRRRRRRRRRRRRRRRRRRccccccccPPPPEEE
EEEEEPPPcccccccccnnnnncccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccnnnnncccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccnnnnncccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccnnnnncccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccnnnnncccccccccccccccccccccPPPPEEE
EEEEEPPPcccccccccnnnnncccccccccccccccccccccPPPPEEE
EEPPPPPPcccccccccnnnnncccccccccccccccccccccMPPPPPP
EEPPPPPPPccccccccnnnnncccccccccccccccccccccPPPPPPP
EEPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
EEPPPPPPPPEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP
EEPPPPPPPPEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP
EEPPPPPPPPEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP
EEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
0ddddddddd0000000000000000000000000000000dddddbddd
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
0dbbbbbbbd7777777777777777777777777777777ddbbbbbbb
0dddddddd0000000000000000000000000000000000ddbdddd
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000330007777000
00000777700000000000000000000000000000330007777000
00000777700000000000000000000000000000000007777000
0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
0000077770000000jjkkllllllllllllkkjj00000007777000
0000077770000000jjkkllllllllllllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllllllllllllkkjj00000007777000
0000077770000000jjkkllllllllllllkkjj00000007777000
0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
0dddddddd0000000000000000000000000000000000ddbdddd
0dbbbbbbbd7777777777777777777777777777777ddbbbbbbb
0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0ddddddddd0000000000000000000000000000000dddddbddd
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................PPPPPPPPPPPPPPPPPP...............
.................PPPPPPPPPPPPPPPPPP...............
.................PPPPPPPPPPPPPPPPPP...............
.................PPPPPPPPPPPPPPPPPP...............
.................PPPPPPPPLLPPPPPPPP...............
.................PPPPPPPPLLPPPPPPPP...............
..M.MMMMMM.......PPPPPPPPLLPPPPPPPP.......MMMMMMMM
..MPMMMMMM.......PPPPPPPPPPPPPPPPPP.......MMMMMMMM
..PPPPPPPP.......PPPPPPPPPPPPPPPPPP.......PPPPPPPP
..PPPPPPPP.......PPPPPPPPPPPPPPPPPP.......PPPPPPPP
..PPPPPPPP.......PPPPPPPPPPPPPPPPPP.......PPPPPPPP
..PPPPPPPP.......oooooPPPPPPPPPPPPP.......PPPPPPPP
..PPPPPPPP.......oooooPPPPPPPPPPPPP.......PPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
.EPPPPPPPPPPPPPPEooooEPPPPPPPPPPPPPPPPPPPPPPPPPPPP
```
Right side (looking from the right):
```
......................RRRRRR......................
....................RRRRRRRRRR....................
..................RRRRRRRRRRRRRR..................
.................RRRRRRRRRRRRRRRR.................
.................PPPPPPPPPPPPPPPP.................
.................PPPPPPPPPPPPPPPP.................
.................PPPPPPPPPPPPPPPP.................
.................PPPPPPPPPPPPPPPP.................
.................PPPPPPPPPPPPPPPP.................
.................PPPPPLLPPPPPPPPP.................
..M.MMMMMM.......PPPPPLLPPPPPPPPP.......MMMMMM.M..
..MPMMMMMM.......PPPPPPPPPPPPPPPP.......MMMMMMPM..
..PPPPPPPP.......PPPPPPPPPPPPPPPP.......PPPPPPPP..
..PPPPPPPP.......PPPPPPPPPPPPPPPP.......PPPPPPPP..
..PPPPPPPP.......PPPPPPPPPPPPPPPP.......PPPPPPPP..
..PPPPPPPP.......PPPPPPPPPPPPPPPP.......PPPPPPPP..
..PPPPPPPP.......PPPPPPPPPPPPPPPP.......PPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
.PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..PPPPPPPP................................PPPPPPPP
..PPPPPPPP................................PPPPPPPP
..PPPPPPPP................................PPPPPPPP
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPP..................................PPPPPPP
..PPPPPP...................................PPPPPPP
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP.........PPPPPPPPPLLLLLPPPP........PPPP...
.....PPP.........PPP.............PP........PPPP...
.....PPP.........PPP.............PP........PPPP...
.....PPP.........PPP.....kkkk...PPP........PPPP...
.....PPP.........PPP.....kkk....PPP........PPPP...
.....PPP.........PPP............PPP........PPPP...
.....PPP.........PPP.............PP........PPPP...
.....PPP.........PPP.............PP........PPPP...
.....PPP.........PPP............PPP........PPPP...
.....PPP.........PPP............PPP........PPPP...
.....PPP.........PPP............PPP........PPPP...
.....PPP.........PPP.............LL........PPPP...
.....PPP.........PPP.............LL........PPPP...
.....PPP.........P...............LL........PPPP...
.....PPP.........Po..............PP........PPPP...
.....PPP.........oooooPPPPPPPPPPPPP........PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
.....PPP...................................PPPP...
..PPPPPP...................................PPPPPPP
..PPPPPPP..................................PPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPPPPPPP
..PPPPPPPP................................PPPPPPPP
..PPPPPPPP................................PPPPPPPP
..PPPPPPPP................................PPPPPPPP
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................PPPPPPPPLLPPPPPPPP...............
.................PPP.............PP...............
.................PPP.............PP...............
.................PPP............PPP...............
.................PPP............PPP...............
.................PPP............PPP...............
.................PPP.............PP...............
.................PPP.............PP...............
.................PPP............PPP...............
.................PPP............PPP...............
.................PPP............PPP...............
.................PPP.............PP...............
.................PPP.............PP...............
.................P...............PP...............
.................PP..............PP...............
.................PPPPPPPPLLPPPPPPPP...............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
### Seed 2: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000dddddbddd
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPccccccccccccccccccccccccccccccccccPPPPPPP   0dbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEPPPPPPcccccccccccccccccccccccccccccccccccMPPPPPP   0dddddddd0000000000000000000000000000000000ddbdddd
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccMcccccccccccccccPPPPEEE   00000777700000000000000000030000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPcccccccccRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPccccccccccccccccccccnnnnnccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccccccccnnnnnccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccccccccnnnnnccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccccccccnnnnnccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccccccccnnnnnccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccccccccnnnnnccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEPPPPPPccccccccccccccccccccnnnnnccccccccccMPPPPPP   0dddddddd0000000000000000000000000000000000ddbdddd
EEPPPPPPPcccccccccccccccccccnnnnnccccccccccPPPPPPP   0dbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPooooooPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPooooooPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPoooooNPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000dddddbddd
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000dddddbddd
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPccccccccccccccccccccccccccccccccccPPPPPPP   0dbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEPPPPPPcccccccccccccccccccccccccccccccccccMPPPPPP   0dddddddd0000000000000000000000000000000000ddbdddd
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPcccccccccccccccccccccccccccccccccccPPPPEEE   00000777700000000000000000000000000000330007777000
EEEEEPPPcccccccccRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00330007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEPPPccccccccRRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPcccccccccRRRRRRRRRRRRRRRRRRccccccccPPPPEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEPPPccccccccccccccnnnnnccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccnnnnnccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccnnnnnccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccnnnnnccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccnnnnnccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEEEEPPPccccccccccccccnnnnnccccccccccccccccPPPPEEE   00000777700000000000000000000000000000000007777000
EEPPPPPPccccccccccccccnnnnnccccccccccccccccMPPPPPP   0dddddddd0000000000000000000000000000000000ddbdddd
EEPPPPPPPcccccccccccccnnnnnccccccccccccccccPPPPPPP   0dbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEPPPPPPPPEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEPPPPPPPP   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEEEE   0ddddddddd0000000000000000000000000000000dddddbddd
EEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.08 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 138 nodi, 482 passi, finito in 696 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, s=slate, w=white, d=dead, dark, c=cortile, n=lastricato, W=White, t=teal, G=Green, Q=aQua, r=strada, P=pietra delle mura, u=blue, R=tegole del tetto, f=pavimento, F=solaio, T=Teal (marcatore), L=chioma, q=aqua, O=porta, o=assi della porta, N=stipite, M=merli, U=feritoia, k=gradini, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: P 251207, R 14780, c 7366, E 5825, o 5634, U 3504, L 1824, f 1525, F 1445, k 1360, M 1332, N 855, n 375, O 216, r 75, A 1.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-35 all×22, prl×2, one×3: 728 celle x1-29 y1-29 z0, passi 2-55
   #41 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 56
#43-44 all×1, prl×1: 10075 celle x15-139 y15-134 z0-1, passi 57-58
    #45 all . w → w P passi=5: ×5, 12250 celle x50-104 y50-99 z1-6, passi 59-63, w→P 6125, .→w 6125
    #46 all . w → w u passi=14: ×14, 34300 celle x50-104 y50-99 z6-20, passi 64-77, w→u 17150, .→w 17150
    #47 all . w → w P passi=12: ×12, 29400 celle x50-104 y50-99 z20-32, passi 78-89, w→P 14700, .→w 14700
    #48 all . w → w P passi=6: ×6, 14700 celle x50-104 y50-99 z32-38, passi 90-95, w→P 7350, .→w 7350
    #49 all . w → w u passi=14: ×14, 34300 celle x50-104 y50-99 z38-52, passi 96-109, w→u 17150, .→w 17150
    #50 all . w → w P passi=12: ×12, 29400 celle x50-104 y50-99 z52-64, passi 110-121, w→P 14700, .→w 14700
#51-53 prl×1, all×2: 4475 celle x50-104 y50-99 z0-64, passi 122-124
    #54 all . h → h . passi=31: ×31, 88350 celle x55-99 y55-94 z1-32, passi 125-155, h→. 44175, .→h 44175
#55-56 all×2: 9050 celle x55-99 y55-94 z2-33, passi 156-186
    #57 all . h → h . (+1) passi=31: ×31, 94550 celle x55-99 y55-94 z33-64, passi 187-217, h→. 44175, .→h 44175, s→. 3100, .→s 3100
      r1 . h → h . ×44175; r2 . s → s . ×3100
    #58 prl h → R (+1): ×1, 1525 celle x55-99 y55-94 z64, passi 218, h→R 1425, s→R 100
      r1 h → R ×1425; r2 s → R ×100
    #59 all . W → W P passi=22: ×22, 162800 celle x15-139 y15-134 z1-23, passi 219-240, W→P 81400, .→W 81400
    #60 prl W → P: ×1, 3700 celle x15-139 y15-134 z23, passi 241, W→P 3700
    #61 all . t → t P passi=39: ×39, 187200 celle x5-149 y5-144 z0-39, passi 242-280, t→P 93600, .→t 93600
#62-101 prl×4, all×10: 19736 celle x5-149 y5-144 z0-39, passi 281-367
#102-135 all×12, prl×4, one×1: 10875 celle x5-149 y5-144 z1-51, passi 368-470
    #136 prl u → P: ×1, 31286 celle x50-104 y50-99 z6-51, passi 471, u→P 31286
#137-138 all×2: 12030 celle x49-105 y49-100 z64-74, passi 472-482
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=2
#19 all cEEEEEEE → *ccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#20 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all d/w → */d: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all cWWEEEEE → ***aa*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#38 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#39 one EEEEE/EEEEE/EEEEE/EEEEE/EEEEE → *****/*****/**Y**/*****/***** passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
#65 all . y → y K passi=10: in quel momento nella griglia non c'erano celle "y"
#66 prl y → L: in quel momento nella griglia non c'erano celle "y"
#67 all L. → *L passi=2: in quel momento nella griglia non c'erano celle "L"
#69 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
… e altri 35
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcnWtGQaYr" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Spostamento casuale del centro del mastio per variare i semi -->
      <one in="HE" out="EH" steps="3"/>
      <!-- Mastio: nucleo attorno a H, almeno 7x7 celle (35x35 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="H" out="h" steps="1"/>
      <!-- Zona scala nel mastio: 2 celle di pianerottolo prima, 4x2 per la scala -->
      <one in="hhhhhhh/hhhhhhh" out="*******/**ssss*" symmetry="()" steps="1"/>
      <!-- Mura del mastio -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Cortile attorno al mastio -->
      <all in="wE" out="*c" steps="4"/><all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile dove c'è spazio -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- Cinta muraria spessa 2 celle attorno al cortile -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- Via d'uscita: dal mastio al fronte attraverso porta (d), lastricato (n), portone (G), strada (r) -->
      <one in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/w" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <!-- Pozzo nel cortile dove entra 5x5 di cortile libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fossato attorno alla cinta dove c'è spazio libero -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Alberi all'esterno dove c'è 5x5 di terreno libero -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**Y**/*****/*****" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdcnWtGQaYrPuRfFTKLqAyOoNMUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="Q" out="ccccc/cqqqc/cqAqc/cqqqc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Y" out="EEEEE/EEEEE/EEyEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <sequence symmetry="(xy)">
        <!-- B. Le altezze -->
        <!-- Porte a quota 0 (O) e passaggio a mura a quota 1 -->
        <all steps="1">
          <rule in="B d" out="d O"/>
          <rule in="B G" out="G O"/>
          <rule in="B w" out="w P"/>
          <rule in="B W" out="W P"/>
        </all>
        <prl>
          <rule in="d" out="w"/>
        </prl>
        <!-- Corpo di guardia (G): alto 36 voxel così la porta (30) ci sta tutta -->
        <all in="B G" out="G P" steps="35"/>
        <prl in="G" out="P"/>
        <!-- Mura del mastio: 2 piani (64 voxel) -->
        <all in="B w" out="w P" steps="5"/>
        <all in="B w" out="w u" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/>
        <all in="B w" out="w u" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <prl in="w" out="R"/>
        <!-- Pavimenti e solaio del mastio e striscia della scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- Cinta muraria (24 voxel) e torri (40 voxel) -->
        <all in="B W" out="W P" steps="22"/>
        <prl in="W" out="P"/>
        <all in="B t" out="t P" steps="39"/>
        <prl in="t" out="P"/>
        <!-- Pozzo e alberi -->
        <all in="B q" out="q P" steps="4"/><prl in="q" out="P"/>
        <all in="B y" out="y K" steps="10"/><prl in="y" out="L"/>
        <all in="LB" out="*L" steps="2"/>

        <!-- C. Scala reale: porte, parti incluse, finestre, tetti -->
        <union symbol="+" values="Puw"/>
        <union symbol="%" values="P"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <!-- Finestre nel mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="P"/>
        <!-- Tetto a padiglione del mastio -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="#6b7a4a" hidden="True"/>
  <color symbol="c" value="#9a8e7a" name="cortile" area="courtyard"/>
  <color symbol="n" value="#888074" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#9e8c6c" name="strada" area="road"/>
  <color symbol="a" value="#355d78" name="fossato" area="moat"/>
  <color symbol="A" value="#3d6a7a" name="acqua del pozzo"/>
  <color symbol="P" value="#7a7672" name="pietra delle mura"/>
  <color symbol="M" value="#686460" name="merli"/>
  <color symbol="U" value="#383430" name="feritoia"/>
  <color symbol="R" value="#8b4232" name="tegole del tetto"/>
  <color symbol="f" value="#b89868" name="pavimento" area="keep"/>
  <color symbol="F" value="#a08050" name="solaio"/>
  <color symbol="k" value="#947448" name="gradini"/>
  <color symbol="O" value="#5a3d28" name="porta"/>
  <color symbol="o" value="#3e2818" name="assi della porta"/>
  <color symbol="N" value="#504c48" name="stipite"/>
  <color symbol="L" value="#4a6a35" name="chioma"/>
  <color symbol="K" value="#5c422c" name="tronco"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
