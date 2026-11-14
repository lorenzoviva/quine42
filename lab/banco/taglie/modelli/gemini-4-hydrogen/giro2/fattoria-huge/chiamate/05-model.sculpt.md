# model.sculpt · gemini-4-hydrogen · 18 s · 1 immagini

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

Your program:
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdavcrfgQtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <all in="w/E" out="*/c" symmetry="()" steps="4"/>
      <all in="v/E" out="*/c" symmetry="()" steps="3"/>
      <all in="cE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>

      <all in="fEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*g" steps="2"/>

      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>

  <map scale="5 5 1" values="BEhwWsdaavfFRLUOoNkMTQgtcbKy#20#21#90#91#92#94" symmetry="()">
    <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
    <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
    <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
    <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
    <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
    <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
    <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
    <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
    <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
    <rule in="f" out="BBBBB/BBfBB/BBfBB/BBfBB/BBBBB"/>
    <rule in="Q" out="QQQQQ/QBBBQ/QBBBQ/QBBBQ/QQQQQ"/>
    <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
    <rule in="t" out="BBBBB/BBbBB/BbbbB/BBbBB/BBBBB"/>

    <sequence symmetry="(xy)">
      <union symbol="+" values="W"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="W"/>

      <!-- Mura casa (64) -->
      <all in="B w" out="w W" steps="6"/>
      <all in="B w" out="w U" steps="14"/>
      <all in="B w" out="w W" steps="12"/>
      <all in="B w" out="w W" steps="6"/>
      <all in="B w" out="w U" steps="14"/>
      <all in="B w" out="w W" steps="12"/>
      <prl in="w" out="R"/>

      <!-- Porta (seme O a z=0, muro W sopra) -->
      <all in="B d" out="d O" steps="1"/>
      <all in="B d" out="d W" steps="63"/>
      <prl in="d" out="R"/>

      <!-- Pavimenti, zona scala e solai casa -->
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

      <!-- Mura e pavimento stalla (40) -->
      <all in="B v" out="v W" steps="10"/>
      <all in="B v" out="v U" steps="12"/>
      <all in="B v" out="v W" steps="18"/>
      <prl in="v" out="R"/>
      <all in="B a" out="a f" steps="1"/>
      <all in="B a" out="a B" steps="39"/>
      <prl in="a" out="R"/>

      <!-- Recinto, pozzo e alberi -->
      <all in="B f" out="f *" steps="5"/>
      <all in="B Q" out="Q *" steps="7"/>
      <all in="B b" out="b *" steps="14"/>

      <!-- Parti del seme -->
      <import file="part-door"/>
      <import file="part-stair"/>

      <!-- Finestre -->
      <one steps="14">
        <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
      </one>
      <all in="LUUUUB" out="*LLLL*"/>
      <prl in="U" out="W"/>

      <!-- Tetto a falde e camino -->
      <all in="RB" out="*R" steps="1"/>
      <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
      <one in="B B R" out="* K *" steps="1" symmetry="()"/>
      <all in="B K" out="K *" steps="10"/>

      <!-- Chioma alberi -->
      <all in="Bb" out="yb" steps="1"/>
      <all in="By" out="yy" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="7A9A58" name="erba" hidden="True"/>
  <color symbol="c" value="C8B898" name="aia" area="yard"/>
  <color symbol="r" value="9E9484" name="strada" area="yard"/>
  <color symbol="g" value="8C7042" name="campo" area="field"/>
  <color symbol="W" value="D8CEBE" name="intonaco"/>
  <color symbol="f" value="8C6239" name="legno pavimento"/>
  <color symbol="F" value="7A5230" name="solaio"/>
  <color symbol="R" value="A84A32" name="tegole"/>
  <color symbol="L" value="88B2C8" name="vetro"/>
  <color symbol="O" value="6E4726" name="porta"/>
  <color symbol="o" value="4E3219" name="assi porta"/>
  <color symbol="#20" value="6E4726" hidden="True"/>
  <color symbol="#21" value="4E3219" hidden="True"/>
  <color symbol="N" value="5C564E" name="stipite"/>
  <color symbol="k" value="9C7248" name="gradini"/>
  <color symbol="T" value="9C7248" name="scala" hidden="True"/>
  <color symbol="Q" value="6E7278" name="pietra pozzo"/>
  <color symbol="K" value="784838" name="camino"/>
  <color symbol="b" value="5C4028" name="tronco"/>
  <color symbol="y" value="4A6E35" name="chioma" area="orchard"/>
  <color symbol="U" value="88B2C8" name="finestra" hidden="True"/>
  <color symbol="M" value="78726A" name="merli"/>

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
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: La struttura principale risulta troppo alta e verticale rispetto alle proporzioni tradizionali di una fattoria.; Il contrasto tra alcuni infissi e le pareti intonacate è poco accentuato.
Advice: Abbassare e allargare il blocco centrale per dare un aspetto più solido e rustico.; Scurire i contorni di finestre e porte per farli staccare meglio dalla facciata.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c aia, r strada, f legno pavimento, g campo, Q pietra pozzo, W intonaco, F solaio, R tegole, L vetro, O porta, o assi porta, N stipite, k gradini, b tronco, K camino, y chioma
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEyyyEEEEEEEEEyyEEEEEEEEEE
EEEEEEEEEEyEEEEEEEEyEEEEEEEyEEEEEEEEEEyyEEEEEEEEEE
EEEEEEEEEEyyEEEEEEyyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEyEEEEEEEEyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEyEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEyEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEgggggEEEEEEEEEEEEEEEEEEEEEEEEEEEEggggggggggggEEE
ggggggggEEEEEEEERRRRRRRRRRRRRRRRRRRgggggggggggggEE
ggggggggEEEEEEEERRRRRRRRRRRRRRRRRRRgggggggggggggEE
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg
gg....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...........gEE
gg....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...........gEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccQQccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccQccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE..cccccccccccccccccccrrrrrccccccccccccccccc..EEE
EE.....................rrrrr...................EEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000040000000000440000000000
00000000000000000000000000444000000003444000000000
00000000004300000043000000444000000000444000000000
00000000044440000044400000000000000000030000000000
00000000004400000044000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000004400000000000000000000
00000000000000000000000000014430000000000000000000
00000000000000000000000000004400000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
0000000000000000jjjjjjjjjjjjjjjjjjjj00000000000000
000000ccccccccccjjjjjjjjjjjjjjjjjjjj00000000000000
000000ccccccccccjjkkkkkkkkkkkkkkkkjj00000000000000
000000ccdddddddcjjkkkkkkkkkkkkkkkkjj00000000000000
000000ccdddddddcjjkkllllllllllllkkjj00000000000000
000000ccdddddddcjjkkllllllllllllkkjj00000000000000
000000ccdddedddcjjkkllmmmmmmmmllkkjj00000000000000
00....ccdddedddcjjkkllmmmmmmmmllkkjj...........000
00....ccdddedddcjjkkllmmmmmmmmllkkjj...........000
00.000ccdddedddcjjkklommmmmmmmllkkjj000000000..000
00.000ccdddedddcjjkkllmmmmmmmmllkkjj000000000..000
00.000ccdddedddcjjkkllmmmmmmmmllkkjj000000000..000
00.000ccdddedddcjjkkllllllllllllkkjj002200000..000
00.000ccdddddddcjjkkllllllllllllkkjj002200000..000
00.000ccdddddddcjjkkkkkkkkkkkkkkkkjj000000000..000
00.000ccdddddddcjjkkkkkkkkkkkkkkkkjj000000000..000
00.000ccccccccccjjjjjjjjjjjjjjjjjjjj000000000..000
00.000ccccccccccjjjjjjjjjjjjjjjjjjj0000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00.000000000000000000000000000000000000000000..000
00..00000000000000000000000000000000000000000..000
00.....................00000...................000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
........................RRR.......................
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
..........RRR....WWWWWWWWWWWWWWWWWW...............
........RRRRRRR..WWWWWWWWWWWWWWWWWW...............
.......RRRRRRRRRWWWWWWWWWWWWWWWWWWW...............
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWW...............
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWW...............
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWW...............
.......WWWWWWWWWWWWWWWWNooooOWWWWWW...............
.......WWWWWWWWWWWWWWWWNooooOWWWWWW...............
.......WWWWWWWWWWWWWWWWNooooOWWWWWW...............
.......WWWWWWWWWWWWWWLLOooooWWWWWWW...............
.......WWWWWWWWWWWWWWLLWooooWWWWWWW...............
.......WWWWWWWWWWWWWWLLWooooWWWWWWW...yb..........
.......WWWWWWWWWWWWWWWWWooooWWWWWWW...yy..........
.......WWWWWWWWWWWWWWWWWooooWWWWWWW...QQ..........
.......WWWWWWWWWWWWWWWWNooooOWWWWWW...QQy.........
..E.EEEWWWWWWWWWWWWWWWWrooooEWWWWWWE.EQQE.E.EE....
```
Right side (looking from the right):
```
..........................RR......................
........................RRRRR.....................
......................RRRRRRRRR...................
....................RRRRRRRRRRRRR.................
..................RRRRRRRRRRRRRRRRR...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWLLLLWWWWW...............
..................WWWWWWLLLLLLWWWWW...............
..................WWWLLWLLWWWWWWWWW...............
..................WWWLLWLLWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWWWWWWWWWWWWWWW...............
..................WWWLLWWWWWWWWWWWW...............
..................WWWLLWLLWLLWWWWWW...............
.....yyyy..yy.....WWWLLWLLLLLWWWWWW...............
.....yyyy..yyy....WWWWWWLLLLLWWWWWW...............
.....yyyy...yy....WWWWWWWWWWWWQWWWW...............
.....yyy...yyy....WWWWWWWfWfWffffWff.f.ff.f.ff.f..
....EyyEy..Eyy....WWWWWWWfWfWffEfWffEfEffEfEffEf..
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
...........................by.........yy..........
.......................................y..........
..........by.......b..............................
..................................................
..................................................
..................................................
..................................................
............................yb....................
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWWWWLLWWWWWWWWWWW...............
.................WWWWWLWWWWWWWWWWWW...............
.......WWWWWWWWWWW.....kkkk......WW...............
.......WWWWWWWWWWW.....kkkk......WW...............
.......W.........W.....kkkk......WW...............
.......W.........W...............WW...............
.......W.........W...............LL...............
.......W.........W...............LL...............
.......W.........L...............LL...............
.......W.........L...............LL...............
.......W.........W...............LL...............
.......W.........W...............WW...............
.......W.........W...............WW...............
.......W.........W...............WW...............
.......W.........W...............WW...............
.......WWWWWWWWWWWWWWWWoooooWWWWWWW...............
.......WWWWWWWWWWWWWWWWoooooWWWWWWW...............
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
..................................................
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................W...............WW...............
.................W...............LL...............
........RRRRRRR..W...............LL...............
........RRRRRRR..W...............WW...............
........RRRRRRR..W...............LL...............
........RRRRRRR..W...............LL...............
........RRRRRRR..L...............WW...............
........RRRRRRR..L...............WW...............
........RRRRRRR..W...............WW...............
........RRRRRRR..W...............WW...............
........RRRRRRR..L...............WW...............
........RRRRRRR..L...............WW...............
........RRRRRRR..W...............WW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
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
........................RRRR......................
........................RRRR......................
........................RRRR......................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEyEEEEEyEEEEEEEEEEEEEEEEEEEEEEEEEEyEEEEEEE   00000000440000044000000000000000000000000344000000
EEEEEEEEyyEEEEEyyEEEEEEEEEEEEEEEEEEEEEEEEybyEEEEEE   00000000444000444100000020000000000000000444000000
EEEEEEEEEyEEEEEyEEEEEEEyyEEEEEEEEEEEEEEEEEyEEEEEEE   00000000440000044000000443000000000000000342000000
EEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000443000000044000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEEEEEEEEE   00000000000000000000000440000000044400000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEEEEEEEEE   00000000000000000000000000000000044300000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000001000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEggggg   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEggggg   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggEEEEEEEEEEEEEEEEEEEEEEEEEEggggggg   00000000000000000000000000000000000000000000000000
EEEEggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggg   0000000000000000jjjjjjjjjjjjjjjjjjjjcccccccccc0000
EEEgggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggg   0000000000000000jjjjjjjjjjjjjjjjjjjjcccccccccc0000
EEggggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggg   0000000000000000jjkkkkkkkkkkkkkkkkjjcdddddddcc0000
EEggggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggg   0000000000000000jjkkkkkkkkkkkkkkkkjjcdddddddcc0000
EEggggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggg   0000000000000000jjkkllllllllllllkkjjcddeedddcc0000
EEggggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....   0000000000000000jjkklllllllollllkkjjcddeedddcc....
EEggggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....   0000000000000000jjkkllmmmmmmmmllkkjjcddeedddcc....
EEEgg...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000...........jjkkllmmmmmmmmllkkjjcddeedddcc00..
EEEEg...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000...........jjkkllmmmmmmmmllkkjjcddeedddcc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkllmmmmmmmmllkkjjcddeedddcc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkllmmmmmmmmllkkjjcddeedddcc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkllmmmmmmmmllkkjjcdddddddcc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkllllllllllllkkjjcdddddddcc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkllllllllllllkkjjcdddddddcc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkkkkkkkkkkkkkkkjjcccccccccc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccc..   00000..000000000jjkkkkkkkkkkkkkkkkjjcccccccccc00..
EEEEE..cccccccccRRRRRRRRRRRRRRRRRRRccccccccccccc..   00000..000000000jjjjjjjjjjjjjjjjjjjj000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..000000000jjjjjjjjjjjjjjjjjjj0000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrccccccccc.cccccccccc..   00000..000000000000000000000000000002.2000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccQcccccccccc..   00000..00000000000000000000000000000222000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..ccccccccccccccccrrrrrcccccccccccccccccccc..   00000..00000000000000000000000000000000000000000..
EEEEE..................rrrrr......................   00000..................00000......................
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000030000034000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEyyyEEEEyyEEEEEEEEEEEEEEE   00000000000000000000000000444000144400000000000000
EEEEEEEyEEEEEEEEEEEEEEEEEEEyEEEEEyyEEEEEEEEEEEEEEE   00000044300000000000000000444000044300000000000000
EEEEEEybyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000044400000020000000000030000003000002000000000
EEEEEEEyEEEEEEEyyEEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEE   00000014300000344000000000000000000000044400000000
EEEEEEEEEEEEEEEyyEEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEE   00000000000000344000000000000000000000044400000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000042000000000000000000000004100000000
EEEEEEEEEEEEEEEEEEEEEEEEyEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000440000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000444000000000000000000000000
EEggggEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000440000000000000000000000000
EEgggggEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
ggggggggEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
gggggggRRRRRRRRRREEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000000ccccccccccc000000000000000000000000000000000
ggggggRRRRRRRRRRREEEEEEEEEEEEEEEEEEggggggggggggEEE   000000ccccccccccc000000000000000000000000000000000
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggggggEE   000000ccdddddddcjjjjjjjjjjjjjjjjjjjj00000000000000
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggggggggEE   000000ccdddddddcjjjjjjjjjjjjjjjjjjjj00000000000000
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg   000000ccdddddddcjjkkkkkkkkkkkkkkkkjj00000000000000
ggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg   000000ccdddedddcjjkkkkkkkkkkkkkkkkjj00000000000000
gg....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg   00....ccdddedddcjjkkllllllllllllkkjj00000000000000
EE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg   00..00ccdddedddcjjkkllllllllllllkkjj00000000000000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggggggggg   00.000ccdddedddcjjkkllmmmmmmmmllkkjj00000000000000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...........gEE   00.000ccdddedddcjjkkllmmmmmmmmllkkjj...........000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...........gEE   00.000ccdddedddcjjkkllmmmmmmmmllkkjj...........000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE   00.000ccdddedddcjmkkllmmmmmmmmllkkjj000000000..000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE   00.000ccdddddddcjjkkllmmmmmmmmllkkjj000000000..000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE   00.000ccdddddddcjjkkllmmmmmmmmllkkjj000000000..000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE   00.000ccccccccccjjkkllllllllllllkkjj000000000..000
EE.cccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccccccccc..EEE   00.000ccccccccccjjkkllllllllllllkkjj000000000..000
EE.cccccccccccccRRRRRRRRRRRRRRRRRRRcccccccccc..EEE   00.0000000000000jjkkkkkkkkkkkkkkkkjj000000000..000
EE.cccccccccccccRRRRRRRRRRRRRRRRRRRccccQccccc..EEE   00.0000000000000jjkkkkkkkkkkkkkkkkjj002200000..000
EE.cccccccccccccRRRRRRRRRRRRRRRRRRRcccQQccccc..EEE   00.0000000000000jjjjjjjjjjjjjjjjjjjj002200000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.0000000000000jjjjjjjjjjjjjjjjjjj0000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE.ccccccccccccccccccccrrrrrccccccccccccccccc..EEE   00.000000000000000000000000000000000000000000..000
EE..cccccccccccccccccccrrrrrccccccccccccccccc..EEE   00..00000000000000000000000000000000000000000..000
EE.....................rrrrr...................EEE   00.....................00000...................000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.31 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 118 nodi, 579 passi, finito in 570 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba (marcatore), h=honey, w=white, s=slate, d=dead, dark, a=alive, gray, v=olive, c=aia, r=strada, f=legno pavimento, g=campo, Q=pietra pozzo, t=teal, m=magenta, W=intonaco, F=solaio, R=tegole, L=vetro, U=finestra (marcatore), O=porta, o=assi porta, N=stipite, k=gradini, T=scala (marcatore), b=tronco, K=camino, y=chioma, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 74259, R 20078, f 16094, E 9700, c 4825, L 3056, k 2720, o 2130, F 1640, g 1600, y 1137, r 675, b 375, N 235, Q 128, O 120, K 11.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-39 all×28, one×4, prl×1: 553 celle x0-29 y3-29 z0, passi 2-71
  #41 map scala 5 5 1: ×1, 21115 celle x0-149 y0-149 z0-119, passi 72
   #43 all . w → w W passi=6: ×6, 10500 celle x50-104 y55-104 z0-6, passi 73-78, w→W 5250, .→w 5250
   #44 all . w → w U passi=14: ×14, 24500 celle x50-104 y55-104 z6-20, passi 79-92, w→U 12250, .→w 12250
   #45 all . w → w W passi=12: ×12, 21000 celle x50-104 y55-104 z20-32, passi 93-104, w→W 10500, .→w 10500
   #46 all . w → w W passi=6: ×6, 10500 celle x50-104 y55-104 z32-38, passi 105-110, w→W 5250, .→w 5250
   #47 all . w → w U passi=14: ×14, 24500 celle x50-104 y55-104 z38-52, passi 111-124, w→U 12250, .→w 12250
   #48 all . w → w W passi=12: ×12, 21000 celle x50-104 y55-104 z52-64, passi 125-136, w→W 10500, .→w 10500
#49-54 prl×2, all×4: 14550 celle x50-104 y55-104 z0-64, passi 137-204
   #55 all . h → h . passi=31: ×31, 99200 celle x55-99 y60-99 z1-32, passi 205-235, h→. 49600, .→h 49600
#56-57 all×2: 15600 celle x55-99 y60-99 z2-33, passi 236-266
   #58 all . h → h . (+1) passi=31: ×31, 111600 celle x55-99 y60-99 z33-64, passi 267-297, h→. 49600, .→h 49600, s→. 6200, .→s 6200
     r1 . h → h . ×49600; r2 . s → s . ×6200
#59-60 prl×1, all×1: 11300 celle x20-99 y60-104 z0-64, passi 298-308
   #61 all . v → v U passi=12: ×12, 11400 celle x20-49 y60-104 z10-22, passi 309-320, v→U 5700, .→v 5700
#62-64 all×2, prl×1: 19325 celle x20-49 y60-104 z0-40, passi 321-340
   #65 all . a → a . passi=39: ×39, 68250 celle x25-49 y65-99 z1-40, passi 341-379, a→. 34125, .→a 34125
#66-67 prl×1, all×1: 14120 celle x7-137 y60-143 z1-40, passi 380-385
#68-111 all×16, prl×4, one×1: 21388 celle x20-119 y16-104 z0-51, passi 386-551
   #112 prl U → W: ×1, 27144 celle x20-104 y55-104 z6-51, passi 552, U→W 27144
#113-118 all×5, one×1: 17126 celle x19-121 y13-105 z0-82, passi 553-579
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#37 all gE/*g → *g/**: le celle cercate c'erano, ma mai disposte come nel pattern
#71 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#72 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#73 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#74 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#75 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#81 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#82 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#83 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#84 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#85 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 11
Improve it: answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdavcrfgQtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="6"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <all in="w/E" out="*/c" symmetry="()" steps="4"/>
      <all in="v/E" out="*/c" symmetry="()" steps="3"/>
      <all in="cE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>

      <all in="fEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*g" steps="2"/>

      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>

  <map scale="5 5 1" values="BEhwWsdaavfFRLUOoNkMTQgtcbKy#20#21#90#91#92#94" symmetry="()">
    <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
    <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
    <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
    <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
    <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
    <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
    <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
    <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
    <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
    <rule in="f" out="BBBBB/BBfBB/BBfBB/BBfBB/BBBBB"/>
    <rule in="Q" out="QQQQQ/QBBBQ/QBBBQ/QBBBQ/QQQQQ"/>
    <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
    <rule in="t" out="BBBBB/BBbBB/BbbbB/BBbBB/BBBBB"/>

    <sequence symmetry="(xy)">
      <union symbol="+" values="W"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="W"/>

      <!-- Mura casa (64) -->
      <all in="B w" out="w W" steps="6"/>
      <all in="B w" out="w U" steps="14"/>
      <all in="B w" out="w W" steps="12"/>
      <all in="B w" out="w W" steps="6"/>
      <all in="B w" out="w U" steps="14"/>
      <all in="B w" out="w W" steps="12"/>
      <prl in="w" out="R"/>

      <!-- Porta (seme O a z=0, muro W sopra) -->
      <all in="B d" out="d O" steps="1"/>
      <all in="B d" out="d W" steps="63"/>
      <prl in="d" out="R"/>

      <!-- Pavimenti, zona scala e solai casa -->
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

      <!-- Mura e pavimento stalla (40) -->
      <all in="B v" out="v W" steps="10"/>
      <all in="B v" out="v U" steps="12"/>
      <all in="B v" out="v W" steps="18"/>
      <prl in="v" out="R"/>
      <all in="B a" out="a f" steps="1"/>
      <all in="B a" out="a B" steps="39"/>
      <prl in="a" out="R"/>

      <!-- Recinto, pozzo e alberi -->
      <all in="B f" out="f *" steps="5"/>
      <all in="B Q" out="Q *" steps="7"/>
      <all in="B b" out="b *" steps="14"/>

      <!-- Parti del seme -->
      <import file="part-door"/>
      <import file="part-stair"/>

      <!-- Finestre e cornici scure -->
      <one steps="14">
        <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
      </one>
      <all in="LUUUUB" out="*LLLL*"/>
      <prl in="U" out="W"/>
      <prl in="WL" out="NL" symmetry="(xy)"/>
      <prl in="W L" out="N L"/>
      <prl in="L W" out="L N"/>

      <!-- Tetto a falde e camino -->
      <all in="RB" out="*R" steps="1"/>
      <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
      <one in="B B R" out="* K *" steps="1" symmetry="()"/>
      <all in="B K" out="K *" steps="10"/>

      <!-- Chioma alberi -->
      <all in="Bb" out="yb" steps="1"/>
      <all in="By" out="yy" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="7A9A58" name="erba" hidden="True"/>
  <color symbol="c" value="C8B898" name="aia" area="yard"/>
  <color symbol="r" value="9E9484" name="strada" area="yard"/>
  <color symbol="g" value="8C7042" name="campo" area="field"/>
  <color symbol="W" value="D8CEBE" name="intonaco"/>
  <color symbol="f" value="8C6239" name="legno pavimento"/>
  <color symbol="F" value="7A5230" name="solaio"/>
  <color symbol="R" value="A84A32" name="tegole"/>
  <color symbol="L" value="5B849E" name="vetro"/>
  <color symbol="O" value="6E4726" name="porta"/>
  <color symbol="o" value="4E3219" name="assi porta"/>
  <color symbol="#20" value="6E4726" hidden="True"/>
  <color symbol="#21" value="4E3219" hidden="True"/>
  <color symbol="N" value="3B2E25" name="stipite"/>
  <color symbol="k" value="9C7248" name="gradini"/>
  <color symbol="T" value="9C7248" name="scala" hidden="True"/>
  <color symbol="Q" value="6E7278" name="pietra pozzo"/>
  <color symbol="K" value="784838" name="camino"/>
  <color symbol="b" value="5C4028" name="tronco"/>
  <color symbol="y" value="4A6E35" name="chioma" area="orchard"/>
  <color symbol="U" value="5B849E" name="finestra" hidden="True"/>
  <color symbol="M" value="78726A" name="merli"/>

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
