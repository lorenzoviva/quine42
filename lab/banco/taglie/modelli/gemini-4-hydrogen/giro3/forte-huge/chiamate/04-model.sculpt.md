# model.sculpt · gemini-4-hydrogen · 16 s

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
  <map scale="1/5 1/5 1" values="BHEKhsdcWtGnrQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Il mastio attorno a H: dimensioni variabili per seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Variazione per seme: estensione casuale del mastio su un lato -->
      <one in="hE" out="*h" steps="1"/>
      <all in="hE/*h" out="*h/**" steps="2"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- 2. Zona della scala nel mastio: 2 celle di pianerottolo, 4x2 di scala -->
      <one in="Khhhhhh/Khhhhhh" out="***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Corte attorno al mastio, poi espansione dove c'è terreno libero -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Cinta muraria spessa 2 celle attorno alla corte -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Via d'uscita dritta da H al bordo anteriore: porta d, lastricato n, corpo di guardia G, strada r (larga 3) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 7. Pozzo nella corte dove c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Fossato oltre la cinta dove il terreno prosegue -->
      <all in="cWWEEEE" out="***aa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>

    <map scale="5 5 1" values="BEKhsdcWtGnrQawuLfFRVZTMOoNUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wVuZ"/>
        <union symbol="%" values="VZ"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze -->
        <!-- Mura del mastio (K -> w, u, R) alte 64 -->
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <prl in="K" out="R"/>

        <!-- Porta del mastio (d -> O alla base, w sopra fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Interno del mastio (h) e zona scala (s): 2 piani coperti -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Cinta muraria (W -> V) alta 24 -->
        <all in="B W" out="W V" steps="23"/>
        <prl in="W" out="V"/>

        <!-- Corpo di guardia (G -> O alla base, V sopra fino a 36) -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G V" steps="35"/>
        <prl in="G" out="V"/>

        <!-- Torri angolari (t -> Z) alte 40 -->
        <all in="B t" out="t Z" steps="39"/>
        <prl in="t" out="Z"/>

        <!-- Pozzo (Q) alto 4 -->
        <all in="B Q" out="Q V" steps="4"/>
        <prl in="Q" out="V"/>

        <!-- C. Scala reale: parti incluse, finestre, tetto, pulizia -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre del mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="w"/>

        <!-- Tetto a padiglione del mastio (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A7F4E" hidden="True"/>
  <color symbol="H" value="E6C229" hidden="True"/>
  <color symbol="w" value="7A7672" name="pietra del mastio" area="keep"/>
  <color symbol="V" value="8C8881" name="pietra della cinta" area="wall"/>
  <color symbol="Z" value="6E6A66" name="pietra della torre" area="tower"/>
  <color symbol="M" value="96918A" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="L" value="8AB4C9" name="vetro"/>
  <color symbol="f" value="A67C52" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="8F6843" name="solaio in legno" area="keep"/>
  <color symbol="k" value="B88E62" name="gradino"/>
  <color symbol="R" value="9E4738" name="tetto in tegole"/>
  <color symbol="O" value="5C3A21" name="porta" area="gatehouse"/>
  <color symbol="o" value="472C18" name="assi della porta" area="gatehouse"/>
  <color symbol="N" value="4A4642" name="stipite"/>
  <color symbol="c" value="B8A990" name="corte" area="courtyard"/>
  <color symbol="n" value="9E9589" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8F816B" name="strada" area="road"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="moat"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="472C18" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
It does not pass: taglia Enorme, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c corte, n lastricato, r strada, a fossato, w pietra del mastio, L vetro, f pavimento in legno, F solaio in legno, R tetto in tegole, V pietra della cinta, Z pietra della torre, M merlo, O porta, o assi della porta, N stipite, U feritoia, k gradino
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZ
EEZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZ
EEZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZ
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZccccccccccccccccccccccccccccccccccZZZZZZZ
EEZZZZZZcccccccccccccccccccccccccccccccccccMZZZZZZ
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVcccccccccRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccnnnnncccccccccccMcccVVVVEEE
EEEEEVVVcccccccccccccccnnnnnccccccccccMMcccVVVVEEE
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE
EEZZZZZZcccccccccccccccnnnnncccccccccccccccZZZZZZZ
EEZZZZZZZMVVVVVVVVVVVVVMnVnVcVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZZVVVVVVVVVVVVVNVVVVMVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZZVVVVVVVVVVVVVMVVVVMVVVVVVVVVVVVVZZZZZZZZ
EEZZZZZZZZEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEZZZZZZZZ
EEZZZZZZZZEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEZZZZZZZZ
EEZZZZZZZZEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEZZZZZZZZ
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
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
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
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
0000077770000000jjkkllllllllllllkkjj00000007777000
0000077770000000jjkkllllllllllllkkjj00000007777000
0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
0000077770000000jjjjjjjjjjjjjjjjjjj000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000000007777000
00000777700000000000000000000000000000330007777000
00000777700000000000000000000000000000330007777000
00000777700000000000000000000000000000000007777000
0dddddddd0000000000000000000000000000000000ddbdddd
0dbbbbbbd0000000000000000000000000000000000dbbbbbb
0dbbbbbbbd7777777777777ccbccc777777777777ddbbbbbbb
0dbbbbbbbd7777777777777bbbbbb777777777777dbbbbbbbb
0dbbbbbbbb7777777777777cbbbbc777777777777bbbbbbbbb
0bbbbbbbbd7777777777777cccccc777777777777dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
..M.MMMMMM.......wwwwwwwwwwwwwwwwww.......MMMMMMMM
..MZMMMMMM.......wwwwwwMMMMMwwwwwww.......MMMMMMMM
..ZZZZZZZZ.......wwwwwwMMMMMwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwVVVVVwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwVVVVVwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwNooooOwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwNooooOwwwwww.......ZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVNooooOVVVVVVVVVVVVVZZZZZZZZ
.ZZZZZZZZZVVVVVVVVVVVVVrooooEVVVVVVVVVVVVVZZZZZZZZ
```
Right side (looking from the right):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwwwwwwwwwwwwwww...............
.................wwwwLwwwwwwwwwwwww...............
..M.MMMMMM.......wwwwLLLLwwwwwwwwLL.......MMMMMMMM
..MZMMMMMM.......wwwwLLLLwwwwwwwwLL.......MMMMMMMM
..ZZZZZZZZ.......wwwwwwwwwwwwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwwwwwwwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwwwwwwwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwwwwwwwwwwwww.......ZZZZZZZZ
..ZZZZZZZZ.......wwwwwwwwwwwwwwwwww.......ZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
.ZZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZ..................................ZZZZZZZ
..ZZZZZZ...................................ZZZZZZZ
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV.........wwwwwwwwwwwwwwwwww........VVVV...
.....VVV.........www........wwwwwww........VVVV...
.....VVV.........www........wwwwwww........VVVV...
.....VVV.........w...............LL........VVVV...
.....VVV.........w...............LL........VVVV...
.....VVV.........L.....kkkk......ww........VVVV...
.....VVV.........L.....kkkk......ww........VVVV...
.....VVV.........L.....kkkk......ww........VVVV...
.....VVV.........L...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........w...............ww........VVVV...
.....VVV.........wwwwwwoooooNwwwwww........VVVV...
.....VVV.........wwwwwwoooooNwwwwww........VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
.....VVV...................................VVVV...
..ZZZZZZ...................................ZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVoooooNVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVooooooVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVooooooVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZVVVVVVVVVVVVVoooooNVVVVVVVVVVVVVZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
..ZZZZZZZZ................................ZZZZZZZZ
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
.................wwwLwwwwLLwwwwwwww...............
.................www........wwwwwww...............
.................www........wwwwwww...............
.................w...............ww...............
.................L...............LL...............
.................L...............LL...............
.................L...............LL...............
.................L...............LL...............
.................w...............ww...............
.................w...............ww...............
.................w...............ww...............
.................w...............ww...............
.................w...............ww...............
.................w...............ww...............
.................L...............ww...............
.................L...............ww...............
.................wwwwwwwwwwwwwwwwwL...............
.................wwwwwwwwwwwwwwwwww...............
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEZZZZZZMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEZZEZEZZ   0ddddddddd0000000000000000000000000000000dddddbddd
EEZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZZ   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZZ   0bbbbbbbbb0000000000000000000000000000000bbbbbbbbb
EEZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0bbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0bbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEZZZZZZcccccccccccccccccccccccccccccccccccZZZZZZZ   0dbbbbbbd0000000000000000000000000000000000dbbbbbb
EEZZZZZZcccccccccccccccccccccccccccccccccccMZZZZZZ   0dddddddd0000000000000000000000000000000000ddbdddd
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRcccMMcccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00330007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccMcccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00330007777000
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccnnnnncccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEZZZZVcccccccccccccccnnnnnccccccccccccccccVZMZZZ   0dddddddd0000000000000000000000000000000000ddbdddd
EEZZZZZZcccccccccccccccnnnnncccccccccccccccZZZZZZZ   0dbbbbbbd0000000000000000000000000000000000dbbbbbb
EEZZZZZZZMVVVVVVVVVVVVVMVVVVVVVVVVVVVVVVVVZZZZZZZZ   0bbbbbbbbd7777777777777cccccc777777777777ddbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0dbbbbbbbd7777777777777cbbbbc777777777777dbbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVNVVVVMVVVVVVVVVVVVVZZZZZZZZ   0dbbbbbbbd7777777777777cbbbbc777777777777dbbbbbbbb
EEZZZZZZZZEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEZZZZZZZZ   0dbbbbbbbd7777777777777ccbccc777777777777dbbbbbbbb
EEZZZZZZZZEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEZZZZZZZZ   0dbbbbbbbb0000000000000000000000000000000bbbbbbbbb
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEZZZZZZMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaEZZEZEZZ   0ddddddddd0000000000000000000000000000000dddddbddd
EEZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZZ   0dbbbbbbbd0000000000000000000000000000000dbbbbbbbb
EEZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZZ   0bbbbbbbbb0000000000000000000000000000000bbbbbbbbb
EEZZZZZZZZaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0bbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0bbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEZZZZZZcccccccccccccccccccccccccccccccccccZZZZZZZ   0dbbbbbbd0000000000000000000000000000000000dbbbbbb
EEZZZZZZcccccccccccccccccccccccccccccccccccMZZZZZZ   0dddddddd0000000000000000000000000000000000ddbdddd
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVccccccccccccccccccccccccccMccccccccVVVVEEE   00000777700000000000000000000000033000000007777000
EEEEEVVVcccccccccccccccccccccccccMMccccccccVVVVEEE   00000777700000000000000000000000033000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllmmmmmmmmllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkllllllllllllkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjkkkkkkkkkkkkkkkkjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEVVVccccccccRRRRRRRRRRRRRRRRRRRccccccccVVVVEEE   0000077770000000jjjjjjjjjjjjjjjjjjjj00000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEEEVVVcccccccccccccccccccccccccccccccccccVVVVEEE   00000777700000000000000000000000000000000007777000
EEEZZZZVccccccccccccccccccccccccccccccccccccVZMZZZ   0dddddddd0000000000000000000000000000000000ddbdddd
EEZZZZZZcccccccccccccccccccccccccccccccccccZZZZZZZ   0dbbbbbbd0000000000000000000000000000000000dbbbbbb
EEZZZZZZZMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0bbbbbbbbd7777777777777777777777777777777ddbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZ   0dbbbbbbbd7777777777777777777777777777777dbbbbbbbb
EEZZZZZZZZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZ   0dbbbbbbbb0000000000000000000000000000000bbbbbbbbb
```
How much the plans of the seeds differ: 0.18 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 139 nodi, 587 passi, finito in 855 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey (marcatore), E=Emerald (marcatore), K=pinK, h=honey, s=slate, d=dead, dark, c=corte, W=White, t=teal, G=Green, n=lastricato, r=strada, Q=aQua, m=magenta, w=pietra del mastio, u=blue, L=vetro, f=pavimento in legno, F=solaio in legno, R=tetto in tegole, V=pietra della cinta, Z=pietra della torre, T=Teal (marcatore), M=merlo, O=porta, o=assi della porta, N=stipite, U=feritoia, k=gradino, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: Z 92712, V 88100, w 64799, R 16815, c 7600, o 6510, E 5125, U 3288, L 2976, k 2720, f 1925, F 1765, M 1386, N 1005, n 375, O 240, r 150, a 9.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-36 all×26, one×3, prl×1: 768 celle x1-29 y1-29 z0, passi 2-58
   #41 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 59
    #43 all . K → K w passi=6: ×6, 12300 celle x50-104 y50-104 z0-6, passi 60-65, K→w 6150, .→K 6150
    #44 all . K → K u passi=14: ×14, 28700 celle x50-104 y50-104 z6-20, passi 66-79, K→u 14350, .→K 14350
#45-46 all×2: 36900 celle x50-104 y50-104 z20-38, passi 80-97
    #47 all . K → K u passi=14: ×14, 28700 celle x50-104 y50-104 z38-52, passi 98-111, K→u 14350, .→K 14350
#48-54 all×5, prl×2: 39550 celle x50-104 y50-104 z0-64, passi 112-191
    #55 all . h → h . passi=31: ×31, 106950 celle x55-99 y55-99 z1-32, passi 192-222, h→. 53475, .→h 53475
#56-57 all×2: 15850 celle x55-99 y55-99 z2-33, passi 223-253
    #58 all . h → h . (+1) passi=31: ×31, 119350 celle x55-99 y55-99 z33-64, passi 254-284, h→. 53475, .→h 53475, s→. 6200, .→s 6200
      r1 . h → h . ×53475; r2 . s → s . ×6200
    #59 prl h → R (+1): ×1, 1925 celle x55-99 y55-99 z64, passi 285, h→R 1725, s→R 200
      r1 h → R ×1725; r2 s → R ×200
    #60 all . W → W V passi=23: ×23, 167900 celle x15-139 y15-139 z0-23, passi 286-308, W→V 83950, .→W 83950
#61-64 prl×2, all×2: 14600 celle x15-139 y15-139 z0-36, passi 309-346
    #65 all . t → t Z passi=39: ×39, 187200 celle x5-149 y5-149 z0-39, passi 347-385, t→Z 93600, .→t 93600
#66-125 prl×5, all×15: 24561 celle x5-149 y5-149 z0-45, passi 386-480
#126-136 all×7, prl×3, one×1: 15766 celle x50-104 y50-104 z1-51, passi 481-575
#137-139 prl×1, all×2: 39374 celle x49-105 y49-105 z6-74, passi 576-587
Senza effetto (non hanno mai cambiato una cella):
#17 all cEEEEEEE → *ccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#18 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all cWWEEEE → ***aa** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#38 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#39 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#70 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#71 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#72 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#73 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#74 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#80 all S#93 → *S passi=14: in quel momento nella griglia non c'erano celle "S", ""
#81 all S/#93 → */S passi=14: in quel momento nella griglia non c'erano celle "S", ""
… e altri 29
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKhsdcWtGnrQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Il mastio attorno a H: dimensioni variabili per seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Variazione per seme: estensione casuale del mastio su un lato -->
      <one in="hE" out="*h" steps="1"/>
      <all in="hE/*h" out="*h/**" steps="2"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- 2. Zona della scala nel mastio: addossata al muro di fondo, 2 celle di pianerottolo, 4x2 di scala -->
      <one in="KKKKKKK/Khhhhhh/Khhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Corte attorno al mastio, poi espansione dove c'è terreno libero -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Cinta muraria spessa 2 celle attorno alla corte -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Via d'uscita dritta da H al bordo anteriore: porta d, lastricato n, corpo di guardia G, strada r (larga 3) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 7. Pozzo nella corte dove c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Fossato oltre la cinta dove il terreno prosegue -->
      <all in="cWWEEEE" out="***aa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>

    <map scale="5 5 1" values="BEKhsdcWtGnrQawuLfFRVZTMOoNUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wVuZ"/>
        <union symbol="%" values="VZ"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze -->
        <!-- Mura del mastio (K -> w, u, R) alte 64 -->
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <prl in="K" out="R"/>

        <!-- Porta del mastio (d -> O alla base, w sopra fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Interno del mastio (h) e zona scala (s): 2 piani coperti -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Cinta muraria (W -> V) alta 24 -->
        <all in="B W" out="W V" steps="23"/>
        <prl in="W" out="V"/>

        <!-- Corpo di guardia (G -> O alla base, V sopra fino a 36) -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G V" steps="35"/>
        <prl in="G" out="V"/>

        <!-- Torri angolari (t -> Z) alte 40 -->
        <all in="B t" out="t Z" steps="39"/>
        <prl in="t" out="Z"/>

        <!-- Pozzo (Q) alto 4 -->
        <all in="B Q" out="Q V" steps="4"/>
        <prl in="Q" out="V"/>

        <!-- C. Scala reale: parti incluse, finestre, tetto, pulizia -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre del mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="w"/>

        <!-- Tetto a padiglione del mastio (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A7F4E" hidden="True"/>
  <color symbol="H" value="E6C229" hidden="True"/>
  <color symbol="w" value="7A7672" name="pietra del mastio" area="keep"/>
  <color symbol="V" value="8C8881" name="pietra della cinta" area="wall"/>
  <color symbol="Z" value="6E6A66" name="pietra della torre" area="tower"/>
  <color symbol="M" value="96918A" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="L" value="8AB4C9" name="vetro"/>
  <color symbol="f" value="A67C52" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="8F6843" name="solaio in legno" area="keep"/>
  <color symbol="k" value="B88E62" name="gradino"/>
  <color symbol="R" value="9E4738" name="tetto in tegole"/>
  <color symbol="O" value="5C3A21" name="porta" area="gatehouse"/>
  <color symbol="o" value="472C18" name="assi della porta" area="gatehouse"/>
  <color symbol="N" value="4A4642" name="stipite"/>
  <color symbol="c" value="B8A990" name="corte" area="courtyard"/>
  <color symbol="n" value="9E9589" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8F816B" name="strada" area="road"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="moat"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="472C18" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
