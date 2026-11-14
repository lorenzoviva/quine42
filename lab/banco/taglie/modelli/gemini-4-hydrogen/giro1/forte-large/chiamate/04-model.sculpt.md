# model.sculpt · gemini-4-hydrogen · 15 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdsGWrnctQAm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio: spina dorsale 1 cella attorno a H, poi allargata -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala nel mastio: lungo la parete interna, 4x2 celle -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Cortile attorno al mastio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile se c'è spazio (Huge/Gargantuan) -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- Torri d'angolo 3x3 sugli spigoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>
      <!-- Via d'accesso dal centro verso il fronte (3 celle di larghezza) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- Pozzo nel cortile se c'è spazio 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fossato attorno alla cinta dove c'è spazio -->
      <all in="cWEEE" out="**A**" steps="1"/>
      <all in="[Wt]E/*A" out="**/*A"/>
      <all in="AE/*A" out="*A/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhwdsGWrnctQAfFyVuLOoNMUk#20#21#90#91#92#94T" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="A" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="yV"/>
        <union symbol="%" values="yV"/>
        <union symbol="=" values="fF"/>
        <!-- B. Altezze: mura del mastio (2 piani da 32 + parapetto 4) -->
        <all steps="1"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="5"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B d" out="d y"/></all>
        <all steps="12"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="6"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B d" out="d u"/></all>
        <all steps="12"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="4"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <prl><rule in="w" out="y"/><rule in="d" out="O"/></prl>
        <!-- Pavimenti, scala e solai del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <!-- Cinta muraria (24), corpo di guardia (36), torri (40), pozzo (5) -->
        <all in="B W" out="W V" steps="23"/><prl in="W" out="V"/>
        <all in="B G" out="G V" steps="35"/><prl in="G" out="O"/>
        <all in="B t" out="t V" steps="39"/><prl in="t" out="V"/>
        <all in="B Q" out="Q V" steps="4"/><prl in="Q" out="V"/>
        <!-- C. Parti e dettagli -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <!-- Finestre nelle fasce u del mastio -->
        <one steps="12">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="y"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="y" value="7A7A7A" name="muro del mastio" area="keep"/>
  <color symbol="V" value="606060" name="cinta muraria" area="wall"/>
  <color symbol="f" value="C8A878" name="pavimento del mastio" area="keep"/>
  <color symbol="F" value="B09060" name="solaio del mastio" area="keep"/>
  <color symbol="c" value="988868" name="cortile" area="courtyard"/>
  <color symbol="n" value="B8A888" name="lastricato" area="courtyard"/>
  <color symbol="r" value="B09870" name="strada" area="road"/>
  <color symbol="A" value="306080" name="fossato" area="moat"/>
  <color symbol="O" value="5A3A1A" name="porta" area="keep"/>
  <color symbol="o" value="4A2E14" name="asse della porta" area="keep"/>
  <color symbol="N" value="505050" name="stipite" area="keep"/>
  <color symbol="M" value="707070" name="merlo" area="wall"/>
  <color symbol="U" value="282828" name="feritoia" area="wall"/>
  <color symbol="k" value="A88858" name="gradino" area="keep"/>
  <color symbol="L" value="384858" name="finestra" area="keep"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c cortile, A fossato, f pavimento del mastio, F solaio del mastio, y muro del mastio, V cinta muraria, L finestra, M merlo, U feritoia, k gradino
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEMMVVMVMMAAAAAAAAAAAAAAAAAAAAAAAAAAAMVMVVMMMEE
EEEEEVVVVVVVVAAAAAAAAAAAAAAAAAAAAAAAAAAAVVVVVVVMEE
EEEEEMVVVVVVVAAAAAAAAAAAAAAAAAAAAAAAAAAAVVVVVVVEEE
EEEEEVVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVEE
EEEEEVVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVMEE
EEEEEMVVVVcccccccccccccccccccccccccccccccccVVVVEEE
EEEEEMVVVVcccccccccccccccccccccccccccccccccVVVVMEE
EEEEEMMVVMcccccccccccccccccccccccccccccccccMMVEEEE
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFyyycccVVEEEEE
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyMcccVVEEEEE
EEEEEMMVVMcccccccccccccccccccccccccccccccccVVMMMEE
EEEEEMVVVVcccccccccccccccccccccccccccccccccVVVVEEE
EEEEEVVVVVccccccccccccccccccccccccccccccccVVVVVMEE
EEEEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEEE
EEEEEMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEE
EEEEEVVVVVVVMEEEEEEEEEEEEEEEEEEEEEEEEEEEMVVVVVVMEE
EEEEEMVVVVVVMEEEEEEEEEEEEEEEEEEEEEEEEEEEMVVVVVVMEE
EEEEEMMEVMEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEMEMEVMMEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000kkkhkkkk000000000000000000000000000kkkkhkkk00
00000khhhhhhh000000000000000000000000000hhhhhhhk00
00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00
00000hhhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
00000khhhh00000000000000000000000000000000hhhhhk00
00000khhhk00000000000000000000000000000000khhhhk00
00000kkkhk00xxxuxxxuxxxuxxxxuxxxuxxxuxxx00kkkhkk00
0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00xuussssssssssssssssssssssuux00aaa00000
0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
0000000aaa00xxxuxxxuxxxuxxxxuxxxuxxxuxxx00aaa00000
00000kkkhk00000000000000000000000000000000kkhkkk00
00000khhhk00000000000000000000000000000000khhhhk00
00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
00000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
00000khhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00
00000khhhhhhk000000000000000000000000000khhhhhhk00
00000khhhhhhk000000000000000000000000000khhhhhhk00
00000kkkhkkkk000000000000000000000000000kkkkhkkk00
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.............MM..MM..MM..M.M..MM..MM..MM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyLLLyyyy..........
............yyyyyyyyyyyyyyyyyyyyyLLLyyyy..........
............yyyyyyyLLyyyyyyyyyyyyLLLyyyy..........
.....MMM.MMMMyyyyyyLLLyyyyyyyyyyyLLLyyyyMMMMMMMM..
.....MMM.MMMMyyyyyyLLLyyyyyyyyyyyyyyyyyyMMMMMMMM..
.....MMM.MMMMyyyyyyLLLyyyyyyyyyyyyyyyyyyMMMMMMMM..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VUVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVUV..
.....VUVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVUV..
.....VUVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVUV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.............MM..MM..MM..M.M..MM..MM..MM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyyyyyyyyyyyyyy..........
............yyyyyyyyyyyyyyyLLLyyyyyyyyyy..........
............yyyyyyyyyyyyyyyLLLyyyyyyyyyy..........
.....MMMMMMMMyyyyyyyyyyyyyyLLLyyyyyyyyyyMMMMMMMM..
.....MMMMMMMMyyyyyyyyyyyyyyLLLyyyyyyyyyyMMMMMMMM..
.....MMMMMMMMyyyyyyyyyyyyyyyyyyyyyyyyyyyMMMMMMMM..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VUVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVUV..
.....VUVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVUV..
.....VUVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVUV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVyyyyyyyyyyyyyyyyyyyyyyyyyyyVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.....VVVVVVVV...........................VVVVVVVV..
.....VVVVVVVV...........................VVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVV...yyyyyyyyyyyyyyyyyyyyyyyyyyy..VVVVV...
.......VVV..yyyyyyyyyyyyyyyyyyyyyyyyyyyy..VVV.....
.......VVV..yyyyyyyyyyyyyyyyyyyyyyyyyyyy..VVV.....
.......VVV..yyy.......kkkkkk.........LLL..VVV.....
.......VVV..yyy.......kkkkkk.........LLL..VVV.....
.......VVV..yyy.......kkkkkk.........LLL..VVV.....
.......VVV..yyy.......kkkkkk.........yyy..VVV.....
.......VVV..yyy.......kkkkkk.........yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..LLL......................yyy..VVV.....
.......VVV..LLL......................yyy..VVV.....
.......VVV..LLL......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..yyy......................yyy..VVV.....
.......VVV..LLL......................yyy..VVV.....
.......VVV..LLL......................yyy..VVV.....
.......VVV..LLL......................yyy..VVV.....
.......VVV..yyyyyyyyyyyyyyyyyyyyyyyyLyyy..VVV.....
.......VVV..yyyyyyyyyyyyyyyyyyyyyyyyLLyy..VVV.....
.......VVV..yyyyyyyyyyyyyyyyyyyyyyyyLLyy..VVV.....
.....VVVVV................................VVVVVV..
.....VVVVV................................VVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..
.....VVVVVVVV...........................VVVVVVVV..
.....VVVVVVVV...........................VVVVVVVV..
.....VVVVVVV............................VVVVVVV...
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
.....MM..M.MM...........................M.M..MMM..
...............................................M..
.....M............................................
............M...........................M.........
...........MM...........................M......M..
.....M............................................
.....M...M................................M....M..
.....MM..M...yyyyyyyyyLLLyyLLLyyyyyyyyyy...MM.....
............yyyyyyyyyyLLLyyLLLyyyyyyyyyy..........
............yyyyyyyyyyLLLyyLLLyyyyyyyyyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............LLL......................yyy..........
............LLL......................yyy..........
............Lyy......................yyy..........
............LLL......................yyy..........
............LLL......................LLL..........
............yyy......................LLL..........
............yyy......................LLL..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyy......................yyy..........
............yyyyyyyLLLyyyyyyyyyyyyyyyyyy..........
............yyyyyyyLLLyyyyyyyyyyyyyyyyyy..........
............yyyyyyyLLLyyyyyyyyyyyyyyyyyy..........
.....MM..M................................M..MMM..
.....M............................................
...........M............................M......M..
..................................................
.....M............................................
............M...........................M......M..
.....M......M...........................M......M..
.....MM..M.M............................M.M..MM...
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEMVMVVMMMAAAAAAAAAAAAAAAAAAAAAAAAAAAMVMVVMMMEE   00000kkkkhkkk000000000000000000000000000kkkkhkkk00
EEEEEVVVVVVVVAAAAAAAAAAAAAAAAAAAAAAAAAAAVVVVVVVMEE   00000khhhhhhh000000000000000000000000000hhhhhhhk00
EEEEEMVVVVVVVAAAAAAAAAAAAAAAAAAAAAAAAAAAVVVVVVVEEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
EEEEEVVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00
EEEEEVVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVMEE   00000hhhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
EEEEEMVVVVcccccccccccccccccccccccccccccccccVVVVEEE   00000khhhh00000000000000000000000000000000hhhhhk00
EEEEEMVVVVcccccccccccccccccccccccccccccccccVVVVMEE   00000khhhk00000000000000000000000000000000khhhhk00
EEEEEMVVMMcccccccccccccccccccccccccccccccccMMVEEEE   00000khkkk00xxxuxxxuxxxuxxxxuxxxuxxxuxxx00kkkhkk00
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyMcccVVEEEEE   0000000aaa00xxxuxxxuxxxuxxxxuxxxuxxxuxxx00aaa00000
EEEEEMVVMMcccccccccccccccccccccccccccccccccVVMMMEE   00000khkkk00000000000000000000000000000000kkhkkk00
EEEEEVVVVVcccccccccccccccccccccccccccccccccVVVVMEE   00000khhhk00000000000000000000000000000000khhhhk00
EEEEEMVVVVccccccccccccccccccccccccccccccccVVVVVEEE   00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
EEEEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00
EEEEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVMEE   00000hhhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
EEEEEMVVVVVVMEEEEEEEEEEEEEEEEEEEEEEEEEEEVVVVVVVEEE   00000khhhhhhk000000000000000000000000000hhhhhhhk00
EEEEEMVVVVVVMEEEEEEEEEEEEEEEEEEEEEEEEEEEVVVVVVVMEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEMMEVMEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEMEMEVMMEEE   00000kkkhkkkk000000000000000000000000000kkkkhkkk00
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEMVMVVMMMAAAAAAAAAAAAAAAAAAAAAAAAAAAMMVVMVMMEE   00000kkkkhkkk000000000000000000000000000kkkhkkkk00
EEEEEMVVVVVVMAAAAAAAAAAAAAAAAAAAAAAAAAAAMVVVVVVEEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEVVVVVVVVAAAAAAAAAAAAAAAAAAAAAAAAAAAVVVVVVVMEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
EEEEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEEE   00000hhhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhk00
EEEEEMVVVVVVMVVVVVVVVVVVVVVVVVVVVVVVVVVVMVVVVVVVEE   00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhh00
EEEEEVVVVVcccccccccccccccccccccccccccccccccVVVVMEE   00000khhhh00000000000000000000000000000000hhhhhk00
EEEEEMVVVVcccccccccccccccccccccccccccccccccVVVVMEE   00000khhhk00000000000000000000000000000000khhhhk00
EEEEEMVVMMcccccccccccccccccccccccccccccccccVVMMEEE   00000khkkk00xxxuxxxuxxxuxxxxuxxxuxxxuxxx00kkhkkk00
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00xuussssssssssssssssssssssuux00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFFyycccVVEEEEE   0000000aaa00uuussssssssssssssssssssssuuu00aaa00000
EEEEEAAAVVcccyyFFFFFFFFFFFFFFFFFFFFFFyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyycccVVEEEEE   0000000aaa00xuuuuuuuuuuuuuuuuuuuuuuuuuux00aaa00000
EEEEEAAAVVcccyyyyyyyyyyyyyyyyyyyyyyyyyyMcccVVEEEEE   0000000aaa00xxxuxxxuxxxuxxxxuxxxuxxxuxxx00aaa00000
EEEEEMMVVMcccccccccccccccccccccccccccccccccVVMMMEE   00000kkkhk00000000000000000000000000000000kkhkkk00
EEEEEVVVVVcccccccccccccccccccccccccccccccccVVVVMEE   00000khhhk00000000000000000000000000000000khhhhk00
EEEEEMVVVVccccccccccccccccccccccccccccccccVVVVVEEE   00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
EEEEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00
EEEEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMEE   00000hhhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhk00
EEEEEMVVVVVVMEEEEEEEEEEEEEEEEEEEEEEEEEEEMVVVVVVEEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEMVVVVVVMEEEEEEEEEEEEEEEEEEEEEEEEEEEMVVVVVVMEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEMMEVMEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEMEMEVMMEEE   00000kkkhkkkk000000000000000000000000000kkkkhkkk00
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.01 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 132 nodi, 406 passi, finito in 371 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey (marcatore), E=Emerald (marcatore), h=honey, w=white, s=slate, W=White, c=cortile, t=teal, A=fossato, f=pavimento del mastio, F=solaio del mastio, y=muro del mastio, V=cinta muraria, u=blue, L=finestra, M=merlo, U=feritoia, k=gradino, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), T=Teal (marcatore).
Alla fine: y 64664, V 57434, F 3890, E 3325, k 2720, L 2656, U 2646, f 2025, M 1728, c 1200, A 550.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-34 all×12, prl×2, one×1: 287 celle x2-18 y2-18 z0, passi 2-24
   #38 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 25
#40-41 all×2: 12000 celle x25-79 y25-79 z0-6, passi 26-31
    #42 all . w → w u (+1) passi=14: ×14, 28000 celle x25-79 y25-79 z6-20, passi 32-45, w→u 14000, .→w 14000
      r1 . w → w u ×14000; r2 . d → d y ×0
    #43 all . w → w y (+1) passi=12: ×12, 24000 celle x25-79 y25-79 z20-32, passi 46-57, w→y 12000, .→w 12000
      r1 . w → w y ×12000; r2 . d → d y ×0
    #44 all . w → w y (+1) passi=6: ×6, 12000 celle x25-79 y25-79 z32-38, passi 58-63, w→y 6000, .→w 6000
      r1 . w → w y ×6000; r2 . d → d y ×0
    #45 all . w → w u (+1) passi=14: ×14, 28000 celle x25-79 y25-79 z38-52, passi 64-77, w→u 14000, .→w 14000
      r1 . w → w u ×14000; r2 . d → d u ×0
    #46 all . w → w y (+1) passi=12: ×12, 24000 celle x25-79 y25-79 z52-64, passi 78-89, w→y 12000, .→w 12000
      r1 . w → w y ×12000; r2 . d → d y ×0
#47-50 all×3, prl×1: 13450 celle x25-79 y25-79 z0-68, passi 90-96
    #51 all . h → h . passi=31: ×31, 113150 celle x30-74 y30-74 z1-32, passi 97-127, h→. 56575, .→h 56575
#52-53 all×2: 16050 celle x30-74 y30-74 z2-33, passi 128-158
    #54 all . h → h . (+1) passi=31: ×31, 125550 celle x30-74 y30-74 z33-64, passi 159-189, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
    #55 prl h → F (+1): ×1, 2025 celle x30-74 y30-74 z64, passi 190, h→F 1825, s→F 200
      r1 h → F ×1825; r2 s → F ×200
    #56 all . W → W V passi=23: ×23, 50600 celle x15-89 y15-89 z0-23, passi 191-213, W→V 25300, .→W 25300
    #57 prl W → V: ×1, 1100 celle x15-89 y15-89 z23, passi 214, W→V 1100
    #60 all . t → t V passi=39: ×39, 62400 celle x10-94 y10-94 z0-39, passi 215-253, t→V 31200, .→t 31200
#61-131 prl×7, all×17, one×1: 23752 celle x10-94 y10-94 z1-74, passi 254-405
    #132 prl u → y: ×1, 25344 celle x25-79 y25-79 z6-51, passi 406, u→y 25344
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#16 all cEEEEEE → *ccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#17 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all H/h → */m passi=1: in quel momento nella griglia non c'erano celle "H"
#23 all m/h → */m: in quel momento nella griglia non c'erano celle "m"
#24 all m/w → */d passi=1: in quel momento nella griglia non c'erano celle "m"
#25 all [dn]/c → */n: in quel momento nella griglia non c'erano celle "dn"
#26 all [nG]/W → */G: in quel momento nella griglia non c'erano celle "nG"
#27 all [Gr]/E → */r: in quel momento nella griglia non c'erano celle "Gr"
#28 all dw → *d passi=1: in quel momento nella griglia non c'erano celle "d"
#29 all nc → *n passi=1: in quel momento nella griglia non c'erano celle "n"
#30 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
… e altri 49
Fix it and answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdsGWrnctQAm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio: spina dorsale attorno a H, poi allargata -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Mura del mastio -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Ala laterale casuale del mastio per variare i semi -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/h*/**/**" symmetry="(x)" steps="1"/>
      <all in="hE" out="*h" symmetry="(x)" steps="2"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala nel mastio: lungo la parete interna, 4x2 celle -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Cortile attorno al mastio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile se c'è spazio (Huge/Gargantuan) -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- Torri d'angolo 3x3 sugli spigoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>
      <!-- Via d'accesso dal centro verso il fronte (3 celle di larghezza) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- Pozzo nel cortile se c'è spazio 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fossato attorno alla cinta dove c'è spazio -->
      <all in="cWEEE" out="**A**" steps="1"/>
      <all in="[Wt]E/*A" out="**/*A"/>
      <all in="AE/*A" out="*A/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhwdsGWrnctQAfFyVuLOoNMUk#20#21#90#91#92#94T" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="A" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="yV"/>
        <union symbol="%" values="yV"/>
        <union symbol="=" values="fF"/>
        <!-- B. Altezze: mura del mastio (2 piani da 32 + parapetto 4) e porta d alla base -->
        <all steps="1"><rule in="B w" out="w y"/><rule in="B d" out="d O"/></all>
        <all steps="5"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B d" out="d y"/></all>
        <all steps="12"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="6"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B d" out="d u"/></all>
        <all steps="12"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <all steps="4"><rule in="B w" out="w y"/><rule in="B d" out="d y"/></all>
        <prl><rule in="w" out="y"/><rule in="d" out="y"/></prl>
        <!-- Pavimenti, scala e solai del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <!-- Cinta muraria (24), corpo di guardia (36) con porta O alla base, torri (40), pozzo (5) -->
        <all in="B W" out="W V" steps="23"/><prl in="W" out="V"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G V" steps="34"/><prl in="G" out="V"/>
        <all in="B t" out="t V" steps="39"/><prl in="t" out="V"/>
        <all in="B Q" out="Q V" steps="4"/><prl in="Q" out="V"/>
        <!-- C. Parti e dettagli -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <!-- Finestre nelle fasce u del mastio -->
        <one steps="12">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="y"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="y" value="7A7A7A" name="muro del mastio" area="keep"/>
  <color symbol="V" value="606060" name="cinta muraria" area="wall"/>
  <color symbol="f" value="C8A878" name="pavimento del mastio" area="keep"/>
  <color symbol="F" value="B09060" name="solaio del mastio" area="keep"/>
  <color symbol="c" value="988868" name="cortile" area="courtyard"/>
  <color symbol="n" value="B8A888" name="lastricato" area="courtyard"/>
  <color symbol="r" value="B09870" name="strada" area="road"/>
  <color symbol="A" value="306080" name="fossato" area="moat"/>
  <color symbol="O" value="5A3A1A" name="porta" area="keep"/>
  <color symbol="o" value="4A2E14" name="asse della porta" area="keep"/>
  <color symbol="N" value="505050" name="stipite" area="keep"/>
  <color symbol="M" value="707070" name="merlo" area="wall"/>
  <color symbol="U" value="282828" name="feritoia" area="wall"/>
  <color symbol="k" value="A88858" name="gradino" area="keep"/>
  <color symbol="L" value="384858" name="finestra" area="keep"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
