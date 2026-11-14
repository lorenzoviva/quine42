# model.sculpt · gemini-4-hydrogen · 27 s

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
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2); stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c cortile, n lastricato, r strada, P pietra delle mura, R tegole del tetto, f pavimento, F solaio, L chioma, A acqua del pozzo, O porta, o assi della porta, N stipite, M merli, U feritoia, k gradini
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEPPPPPPMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPEPEPEEEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPPEEE
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEE
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEE
EEPPPPPPPMPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEE
EEPPPPPPccccccccccccccccccccccccccccccccPPPPPPPEEE
EEPPPPPPccccccccccccccccccccccccccccccccPPPPPPEEEE
EEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEEEE
EEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEEEE
EEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEEEE
EEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEEEE
EEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEEEE
EEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPcccccccccRRRRRRRRRRRRRRRccccccccPPPEEEEEEE
EEEEEPPPcccccccccccccccccccnnnnnccccccccPPPEEEEEEE
EEEEEPPPcccccccccccccccccccnnnnnccccccccPPPEEEEEEE
EEEEEPPPcccccccccccccccccccnnnnnccccccccPPPEEEEEEE
EEEEEPPPcccccccccccccccccccnnnnnccccccccPPPEEEEEEE
EEEEEPPPcccccccccccccccccccnnnnnccccccccPPPEEEEEEE
EEEEEPPPcccccccccccccccccccnnnnnccccccccPPPEEEEEEE
EEPPPPPPcccccccccccccccccccnnnnnccccccccMPPPPPMEEE
EEPPPPPPPccccccccccccccccccnnnnnccccccccPPPPPPPEEE
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEE
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEEE
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPMPPPPPPPPPPPPPPPEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEErrEEEEEEEEPPPPPPPPPEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEErrEEEEEEEEPPPPPPPPPEEE
EEPPPPPPPPEEEEEEEEEEEEEEEEEErrEEEEEEEEEPPPPPPPPEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEErrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0ddddddddd0000000000000000000000000000ddbdbdbdd000
0dbbbbbbbd0000000000000000000000000000dbbbbbbbd000
0bbbbbbbbb0000000000000000000000000000bbbbbbbbb000
0dbbbbbbbd7777777777777777777777777777dbbbbbbbd000
0bbbbbbbbd7777777777777777777777777777dbbbbbbbb000
0dbbbbbbbd7777777777777777777777777777dbbbbbbbd000
0bbbbbbbbd7777777777777777777777777777ddbbbbbbb000
0dbbbbbbd0000000000000000000000000000000dbbbbbd000
0dddddddd0000000000000000000000000000000ddddbdd000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
0000077770000000jjjjjjjjjjjjjjjj000000007777000000
0000077770000000jjjjjjjjjjjjjjjj000000007777000000
0000077770000000jjkkkkkkkkkkkkjj000000007777000000
0000077770000000jjkkkkkkkkkkkkjj000000007777000000
0000077770000000jjkkllllllllkkjj000000007777000000
0000077770000000jjkkllllllllkkjj000000007777000000
0000077770000000jjkkllmmmmllkkjj000000007777000000
0000077770000000jjkkllmmmmllkkjj000000007777000000
0000077770000000jjkkllmmmmllkkjj000000007777000000
0000077770000000jjkkllmmmmllkkjj000000007777000000
0000077770000000jjkkllllllllkkjj000000007777000000
0000077770000000jjkkllllllllkkjj000000007777000000
0000077770000000jjkkkkkkkkkkkkjj000000007777000000
0000077770000000jjkkkkkkkkkkkkjj000000007777000000
0000077770000000jjjjjjjjjjjjjjjj000000007777000000
0000077770000000jjjjjjjjjjjjjjjj000330007777000000
00000777700000000000000000000000000330007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
00000777700000000000000000000000000000007777000000
0dddddddd0000000000000000000000000000000ddddbdd000
0dbbbbbbbd7777777777777777cccbcc777777ddbbbbbbd000
0dbbbbbbbd7777777777777777cbbbbc777777dbbbbbbbd000
0dbbbbbbbd7777777777777777cbbbbc777777dbbbbbbbd000
0dbbbbbbbd7777777777777777cccccc777777dbbbbbbbd000
0dbbbbbbbd0000000000000000000000000000dbbbbbbbd000
0dbbbbbbbd0000000000000000000000000000dbbbbbbbd000
0dbbbbbbbd0000000000000000000000000000dbbbbbbbd000
0ddddddddd0000000000000000000000000000ddbdbdbdd000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRR........................
....................RRRRRRRR......................
..................RRRRRRRRRRRR....................
.................RRRRRRRRRRRRRRR..................
.................PPPPPPPPPPPPPPP..................
.................PPPPPPPPPPPPPPP..................
.................PPPPPPPPPPPPPPP..................
.................PPPPPPPPPPPPPPP..................
.................PPPPLLPPPPLLPPP..................
.................PPPPLLPPPPLLPPP..................
..M.MMMMMM.......PPPPLPPPPPPMPPM......MMMM.M.MM...
..MPMMMMMM.......PPPPPPPPPPMMMMM......MMMMPM.MM...
..PPPPPPPP.......PPPPPPPPPPMMPMM......PPPPPPPPP...
..PPPPPPPP.......PPPPPPPPPPPPPPP......PPPPPPPPP...
..PPPPPPPP.......PPPPPPPPPPPPPPP......PPPPPPPPP...
..PPPPPPPP.......PPPPPPPPPPooooo......PPPPPPPPP...
..PPPPPPPP.......PPPPPPPPPPooooo......PPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
.EPPPPPPPPPPPPPPPPPPPPPPPPEooooEPPPPPPPPPPPPPPP...
```
Right side (looking from the right):
```
........................RRRR......................
......................RRRRRRRR....................
....................RRRRRRRRRRRR..................
..................RRRRRRRRRRRRRRR.................
..................PPPPPPPPPPPPPPP.................
..................PPPPPPPPPPPPPPP.................
..................PPPPPPPPPPPPPPP.................
..................PPPPPPPPPPPPPPP.................
..................PPPPPPPPPPPPPLL.................
..................PPPPPPPPPPPPPLL.................
...MM.M.MMMM......PPPPPPPPPPPPPPL.......MMMMMM.M..
...MM.MPMMMM......PPPPPPPPPPPPPPP.......MMMMMMPM..
...PPPPPPPPP......PPPPPPPPPPPPPPP.......PPPPPPPP..
...PPPPPPPPP......PPPPPPPPPPPPPPP.......PPPPPPPP..
...PPPPPPPPP......PPPPPPPPPPPPPPP.......PPPPPPPP..
...PPPPPPPPP......PPPPPPPPPPPPPPo.......PPPPPPPP..
...PPPPPPPPP......PPPPPPPPPPPPPPo.......PPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..
...PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPE.
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..PPPPPPPP.............................PPPPPPP....
..PPPPPPPP............................PPPPPPPPP...
..PPPPPPPP............................PPPPPPPPP...
..PPPPPPPP............................PPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP...
..PPPPPP................................PPPPPPP...
..PPPPPP................................PPPPPP....
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP.........PPPLLPPPPLLPPP.........PPP.......
.....PPP.........PPPLLPPPPLLPPPP........PPP.......
.....PPP.........P............PP........PPP.......
.....PPP.........P............PP........PPP.......
.....PPP.........P.....kkkk...LL........PPP.......
.....PPP.........P............LL........PPP.......
.....PPP.........L............LL........PPP.......
.....PPP.........L............LL........PPP.......
.....PPP.........L............PP........PPP.......
.....PPP.........L............PP........PPP.......
.....PPP.........L............PP........PPP.......
.....PPP.........P............PP........PPP.......
.....PPP.........P............PP........PPP.......
.....PPP.........PP...........PP........PPP.......
.....PPP.........PPPPPLLLLPooooo........PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
.....PPP................................PPP.......
..PPPPPP................................PPPPPPP...
..PPPPPPP...............................PPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPPPPPPPPPPPPPPPPPPPoooooPPPPPPPPPPPPPPP...
..PPPPPPPP............................PPPPPPPPP...
..PPPPPPPP............................PPPPPPPPP...
..PPPPPPPP............................PPPPPPPPP...
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
.........M........................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................PPPPPPPPPPPPLL...................
.................PPPPPPPPPPPPLPP..................
.................P............PP..................
.................P............PP..................
.................P............PP..................
.................L............PP..................
.................L............PP..................
.................P............PP..................
.................P............PP..................
.................P............PP..................
.................P............PP..................
.................P............PP..................
.................P............PP..................
.................PP...........PP..................
.................PPPPLLPPPPPPPPP..................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
........................................M.........
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
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPP   0dbbbbbbbd000000000000000000000000000000000dbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPP   0dbbbbbbbd000000000000000000000000000000000dbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPP   0dbbbbbbbd000000000000000000000000000000000dbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0bbbbbbbbd777777777777777777777777777777777dbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbb777777777777777777777777777777777bbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd777777777777777777777777777777777dbbbbbb
EEPPPPPPPMPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd777777777777777777777777777777777ddbbbbb
EEPPPPPPcccccccccccccccccccccccccccccccccccccPPPPP   0dbbbbbbd000000000000000000000000000000000000dbbbb
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   0dddddddd000000000000000000000000000000000000ddddb
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccccccccccccccccccccccPPPEE   000007777000000000000jjjjjjjjjjjjjjjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjjjjjjjjjjjjjjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkkkkkkkkkkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkkkkkkkkkkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllllllllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllllllllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllmmmmllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllmmmmllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllmmmmllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllmmmmllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllmmmmllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllllllllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkllllllllkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkkkkkkkkkkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjkkkkkkkkkkkkjj0000000077770
EEEEEPPPcccccccccccccRRRRRRRRRRRRRRRRccccccccPPPEE   000007777000000000000jjjjjjjjjjjjjjjj0000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   000007777000000000000jjjjjjjjjjjjjjjj0000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   00000777700000000000000000000000033000000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   00000777700000000000000000000000033000000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   00000777700000000000000000000000000000000000077770
EEEEEPPPcccccccccccccccccnnnnncccccccccccccccPPPEE   0dddddddd000000000000000000000000000000000000ddddb
EEPPPPPPcccccccccccccccccnnnnncccccccccccccccPPPPP   0dbbbbbbd000000000000000000000000000000000000dbbbb
EEPPPPPPPMPPPPPPPPPPPPPPPMPPPMPPPPPPPPPPPPPcPPPPPP   0dbbbbbbbd777777777777777ccccc7777777777777ddbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbd777777777777777cbbbb7777777777777dbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP   0dbbbbbbbb777777777777777bbbbc7777777777777bbbbbbb
EEPPPPPPPPPPPPPPPPPPPPPPPMPPPMPPPPPPPPPPPPPPPPPPPP   0bbbbbbbbd777777777777777ccccc7777777777777dbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEPPPPPPP   0dbbbbbbbd000000000000000000000000000000000dbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEPPPPPPP   0dbbbbbbbd000000000000000000000000000000000dbbbbbb
EEPPPPPPPPEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEPPPPPPP   0dbbbbbbbd000000000000000000000000000000000dbbbbbb
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000ddbdbdbdd0000000000000000000000000000ddddddddd0
EEEEPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPEE   000dbbbbbbbd0000000000000000000000000000dbbbbbbbd0
EEEPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPEE   000dbbbbbbbd0000000000000000000000000000dbbbbbbbd0
EEEPPPPPPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPPPPPEE   000dbbbbbbbd0000000000000000000000000000dbbbbbbbd0
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEE   000dbbbbbbbd7777777777777777777777777777dbbbbbbbd0
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEE   000dbbbbbbbd7777777777777777777777777777dbbbbbbbd0
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEE   000dbbbbbbbd7777777777777777777777777777dbbbbbbbd0
EEEPPPPPPPcccccccccccccccccccccccccccccccPPPPPPPEE   000dbbbbbbdd7777777777777777777777777777dbbbbbbbd0
EEEMPPPPPMccccccccccccccccccccccccccccccccPPPPPPEE   000ddbdddd0000000000000000000000000000000dddddddd0
EEEEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPcccccccccccccccMccccccccccccccccPPPEEEEE   00000077770000000000000003300000000000000777700000
EEEEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPccccccccccccccccccccccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRcccccccccPPPEEEEE   000000777700000000jjjjjjjjjjjjjjjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjjjjjjjjjjjjjjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkkkkkkkkkkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkkkkkkkkkkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllllllllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllllllllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllmmmmllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllmmmmllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllmmmmllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllmmmmllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllllllllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkllllllllkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkkkkkkkkkkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjkkkkkkkkkkkkjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjjjjjjjjjjjjjjj0000000777700000
EEEEEEEPPPccccccccRRRRRRRRRRRRRRRRccccccccPPPEEEEE   000000777700000000jjjjjjjjjjjjjjjj0000000777700000
EEEEEEEPPPcccccccccccccccnnnnnccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPcccccccccccccccnnnnnccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPcccccccccccccccnnnnnccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPcccccccccccccccnnnnnccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPcccccccccccccccnnnnnccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEEEPPPcccccccccccccccnnnnnccccccccccccPPPEEEEE   00000077770000000000000000000000000000000777700000
EEEEEPPPPPcccccccccccccccnnnnnccccccccccccPPPPPEEE   000ddbdddd0000000000000000000000000000000dddddddd0
EEEEPPPPPPcccccccccccccccnnnnnccccccccccccPPPPPPEE   000dbbbbbd0000000000000000000000000000000dbbbbbbd0
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPMPPPPPPPPPPMPPPPPPPEE   000bbbbbbbdd7777777777777ccccc7777777777dbbbbbbbb0
EEEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEE   000dbbbbbbbd7777777777777cbbbc7777777777dbbbbbbbd0
EEEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPEE   000bbbbbbbbd7777777777777cbbbc7777777777dbbbbbbbb0
EEEEPPPPPPPPEEEEEEEEEEEEEEErEEEEEEEEEEEEPPPPPPPPEE   000dbbbbbbbd7777777777777ccccc7777777777dbbbbbbbd0
EEEPPPPPPPPPEEEEEEEEEEEEEEErEEEEEEEEEEEEPPPPPPPPEE   000bbbbbbbbb0000000000000000000000000000bbbbbbbbb0
EEEEPPPPPPPPEEEEEEEEEEEEEEErEEEEEEEEEEEEPPPPPPPPEE   000dbbbbbbbd0000000000000000000000000000dbbbbbbbd0
EEEEPPPPPPPEEEEEEEEEEEEEEEErEEEEEEEEEEEEMPPPPPPPEE   000ddbdbdbdd0000000000000000000000000000ddddddddd0
EEEEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.46 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 138 nodi, 509 passi, finito in 613 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, s=slate, w=white, d=dead, dark, c=cortile, n=lastricato, W=White, t=teal, G=Green, Q=aQua, r=strada, P=pietra delle mura, u=blue, R=tegole del tetto, f=pavimento, F=solaio, T=Teal (marcatore), L=chioma, q=aqua, O=porta, o=assi della porta, N=stipite, M=merli, U=feritoia, k=gradini, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: P 217059, R 9775, E 7600, c 6616, o 6510, U 3168, L 2808, M 1704, k 1360, f 1225, F 1145, N 1005, n 375, O 240, r 75, A 1.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-33 one×4, all×22: 663 celle x1-27 y2-29 z0, passi 2-49
   #39 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 50
#41-42 all×1, prl×1: 8475 celle x15-129 y20-134 z0-1, passi 51-52
#43-45 all×2, prl×1: 18650 celle x50-94 y55-134 z1-36, passi 53-93
    #46 all . w → w u passi=14: ×14, 22400 celle x50-94 y55-99 z6-20, passi 94-107, w→u 11200, .→w 11200
    #47 all . w → w P passi=12: ×12, 19200 celle x50-94 y55-99 z20-32, passi 108-119, w→P 9600, .→w 9600
    #48 all . w → w P passi=6: ×6, 9600 celle x50-94 y55-99 z32-38, passi 120-125, w→P 4800, .→w 4800
    #49 all . w → w u passi=14: ×14, 22400 celle x50-94 y55-99 z38-52, passi 126-139, w→u 11200, .→w 11200
#50-53 all×3, prl×1: 22650 celle x50-94 y55-99 z0-64, passi 140-154
    #54 all . h → h . passi=31: ×31, 69750 celle x55-89 y60-94 z1-32, passi 155-185, h→. 34875, .→h 34875
#55-56 all×2: 8450 celle x55-89 y60-94 z2-33, passi 186-216
    #57 all . h → h . (+1) passi=31: ×31, 75950 celle x55-89 y60-94 z33-64, passi 217-247, h→. 34875, .→h 34875, s→. 3100, .→s 3100
      r1 . h → h . ×34875; r2 . s → s . ×3100
    #58 prl h → R (+1): ×1, 1225 celle x55-89 y60-94 z64, passi 248, h→R 1125, s→R 100
      r1 h → R ×1125; r2 s → R ×100
    #59 all . W → W P passi=22: ×22, 143000 celle x15-129 y20-134 z1-23, passi 249-270, W→P 71500, .→W 71500
    #60 prl W → P: ×1, 3250 celle x15-129 y20-134 z23, passi 271, W→P 3250
    #61 all . t → t P passi=39: ×39, 187200 celle x5-139 y10-144 z0-39, passi 272-310, t→P 93600, .→t 93600
#62-74 prl×2, all×2: 8997 celle x5-139 y10-144 z0-39, passi 311-345
#75-135 all×20, prl×6, one×1: 24532 celle x5-139 y10-144 z0-51, passi 346-497
#136-138 prl×1, all×2: 26152 celle x49-95 y54-100 z6-74, passi 498-509
Senza effetto (non hanno mai cambiato una cella):
#17 all cEEEEEEE → *ccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#18 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#26 all d/w → */d: le celle cercate c'erano, ma mai disposte come nel pattern
#34 all cWWEEEEE → ***aa*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#36 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#37 one EEEEE/EEEEE/EEEEE/EEEEE/EEEEE → *****/*****/**Y**/*****/***** passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
#65 all . y → y K passi=10: in quel momento nella griglia non c'erano celle "y"
#66 prl y → L: in quel momento nella griglia non c'erano celle "y"
#67 all L. → *L passi=2: in quel momento nella griglia non c'erano celle "L"
#69 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#70 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
… e altri 34
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcnWtGQaYr" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Spostamento casuale del centro del mastio per variare i semi -->
      <one in="HE" out="EH" steps="3"/>
      <!-- Mastio: nucleo attorno a H, 9x9 celle (45x45 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="H" out="h" steps="1"/>
      <!-- Zona scala nel mastio: almeno 2 celle di pianerottolo prima e 2 dopo, 4x2 per la scala -->
      <one in="hhhhhhhhh/hhhhhhhhh" out="*********/**ssss***" symmetry="()" steps="1"/>
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
      <!-- Alberi all'esterno dove c'è 3x3 di terreno libero -->
      <one in="EEE/EEE/EEE" out="***/ *Y* /***" steps="4"/>
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
