# model.sculpt · claude-opus-5-5 · 67 s · 1 immagini

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
<!-- FATTORIA: the parts and their letters, on the plan (a cell is 5 voxels)
     h  the house: a body around H, 3 cells behind and 5-6 in front, 4 to each side; w its walls
     s  the stair zone, inside the house along the back wall
     a  the barn, a wing against one side wall of the house; v its walls
     p  the lean-to with the hay, along the back of the house and beside the barn
     d  the door in the front wall, 3 cells wide, on the axis; r the road straight to the front edge
     c  the farmyard around everything; x the fence around the yard, only where the ground goes on
     Q  the well, in the yard; t fruit trees of the orchard outside the fence where 7 x 7 of ground is free
     Seeds: house depth, barn side and length, lean-to depth, the well, the trees.
     Large: house, barn, lean-to, thin yard. Huge: yard, fence, well. Gargantuan: orchard too. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrcxQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <one in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="E/[wv]" out="p/*" symmetry="()" steps="1"/>
      <all in="E/p" out="p/*" symmetry="()" steps="3"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wvpc]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/*c" out="*x/**"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEWURLfFTkONohswavpPJxQtYugGcrK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="t" out="GGGGG/GGGGG/GGuGG/GGGGG/GGGGG"/>
      <sequence symmetry="(xy)">
        <!-- house walls: 64 with two window bands -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- house floors, stair strip, slab -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn: brick walls 44, earth floor, open inside -->
        <all in="B v" out="v V" steps="44"/>
        <prl in="v" out="K"/>
        <all in="B a" out="a P" steps="1"/>
        <all in="B a" out="a B" steps="43"/>
        <prl in="a" out="K"/>
        <!-- lean-to: hay floor, roof at 34 -->
        <all in="B p" out="p P" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- fence, well, trees -->
        <all in="B x" out="x x" steps="7"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <all in="B u" out="u Y" steps="16"/>
        <prl in="u" out="g"/>
        <all in="gB" out="*g" steps="3"/>
        <all in="B g" out="g *" steps="5"/>
        <!-- the door -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WUV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **K**/**K**/KKKKK/**K**/**K**" out="*****/*****/**K**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* Z *" steps="1" symmetry="()"/>
        <all in="B Z" out="Z *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="W" rgb="#E6DCC2" name="intonaco"/>
  <color symbol="U" rgb="#E6DCC2" name="intonaco"/>
  <color symbol="V" rgb="#A0442E" name="mattoni del fienile"/>
  <color symbol="R" rgb="#B5502F" name="tegole di casa"/>
  <color symbol="K" rgb="#6E4A2C" name="tetto del fienile"/>
  <color symbol="J" rgb="#8C6A3E" name="tettoia di assi"/>
  <color symbol="L" rgb="#3E5F7A" name="finestra"/>
  <color symbol="f" rgb="#C9A877" name="pavimento di casa" area="house"/>
  <color symbol="F" rgb="#9C7A50" name="solaio"/>
  <color symbol="P" rgb="#D8C068" name="fieno" area="barn"/>
  <color symbol="k" rgb="#7A5634" name="gradini"/>
  <color symbol="O" rgb="#5A3A22" name="porta"/>
  <color symbol="o" rgb="#3A2414" name="assi della porta"/>
  <color symbol="N" rgb="#4A4038" name="stipiti"/>
  <color symbol="T" hidden="True"/>
  <color symbol="r" rgb="#B8A27E" name="strada"/>
  <color symbol="c" hidden="True" area="yard"/>
  <color symbol="G" hidden="True" area="orchard"/>
  <color symbol="x" rgb="#7A5A38" name="steccato"/>
  <color symbol="Q" rgb="#8A8A86" name="pozzo di pietra"/>
  <color symbol="Y" rgb="#5C3E24" name="tronco"/>
  <color symbol="g" rgb="#6E9A48" name="chioma"/>
  <color symbol="Z" rgb="#6A6460" name="comignolo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: La recinzione e l'ingresso sono disallineati rispetto al corpo principale.; I piccoli blocchi sulle pareti risultano poco definiti.
Advice: Semplificare i dettagli scuri sulle pareti rendendoli piu regolari.; Riconnettere la recinzione in modo coerente attorno all'edificio.
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, r strada, c marker, x steccato, Q pozzo di pietra, W intonaco, R tegole di casa, L finestra, f pavimento di casa, F solaio, k gradini, O porta, N stipiti, o assi della porta, P fieno, J tettoia di assi, K tetto del fienile, V mattoni del fienile, Z comignolo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRccccccccccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRccccccccccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE
EEEEEEEEEExxxxxxxxxxxxxrrrrrcccccccccccccccccccEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrccccccccccccccccccEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000002222222222222222222222222222222222222000
00000000002222222222222222222222222222222222222000
00000000002200000000000000000000000000000000000000
00000000002200000000000220000000000000000000000000
00000000002200000000000220000000000000000000000000
00000000002200000000000000000000000000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
0000000000220000jjjjjjjjjjjjjjjjjjjj00000000000000
0000000000220000jjjjjjjjjjjjjjjjjjjj00000000000000
0000000000220000jjkkkkkkkkkkkkkkkkjjaaaaaa00000000
0000000000220000jjkkkkkkkkkkkkkkkkjjaaaaaa00000000
0000000000220000jjkkllllllllllllkkjjaaaaaa00000000
0000000000220000jjkkllllllllllllkkjjaaaaaa00000000
0000000000220000jjkkllmmmmmmmmllkkjjaaaaaa00000000
0000000000220000jjkkllmmmmmmmmllkkjjaaaaaa00000000
0000000000220000jjkkllmmmmmmmmllkkjjdddddd00000000
0000000000220000jjkkllmmmmmmmmllkkjjdddddd00000000
0000000000220000jjkkolmmmmmmmmllkkjjdeeedd00000000
0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
0000000000220000jjkkllllllllllllkkjjdeeedd00000000
0000000000220000jjkkllllllllllllkkjjdeeedd00000000
0000000000220000jjkkkkkkkkkkkkkkkkjjdeeedd00000000
0000000000220000jjkkkkkkkkkkkkkkkkjjdeeedd00000000
0000000000220000jjjjjjjjjjjjjjjjjjjjdeeedd00000000
0000000000220000jjjjjjjjjjjjjjjjjjjjeeeedd00000000
000000000022000000000000000000000ddeefeedd00000000
000000000022000000000000000000000ddeeeeedd00000000
000000000022000000000000000000000ddeeeeedd00000000
000000000022000000000000000000000ddddddddd00000000
000000000022222222222222000000000ddddddddd00000000
00000000002222222222222200000000000000000000000000
00000000002222222222222200000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW.KKK...........
.................WWWWWWWWWWLWWWWWWKKKKKKK.........
.................WWWWWWWWWLLLLWWWVVVVVVVVV........
.................WWWWWWWWWLLLLWWWVVVVVVVVV........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWWWWNooooOWWWWVVVVVVVVV........
.................WWWWWWNooooOWWWWVVVVVVVVV........
.................WWWWWWNooooOWWWWVVVVVVVVV........
.................WWWWWWNooooOWWWWVVVVVVVVV........
.................WWWWWWNooooOWWWWVVVVVVVVV........
.................WWWWWWNooooOWLLWVVVVVVVVV........
.................WWWWWWNooooOWLLWVVVVVVVVV........
..........xxxxxxxxxxxxxOooooOWWWWVVVVVVVVVxxxx....
..........xxxxxxxxxxxxxxooooOWWWWVVVVVVVVVxxxxx...
..........xxxxxxxxxxxxxrooooEWWWWVVVVVVVVVxxxxx...
```
Right side (looking from the right):
```
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWLLWWWWKKKKKKKKK...........
..................WWWWWWLLWWKKKKKKKKKKKKK.........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
..................WWWWWWWWWVVVVVVVVVVVVVVV........
.....xxxxQxxxxxxxxWWWWWWWWWVVVVVVVVVVVVVVVx.......
.....xxxxQxxxxxxxxWWWWWWWWWVVVVVVVVVVVVVVVx.......
.....xxxxQxxxxxxxxWWWWWWWWWVVVVVVVVVVVVVVVxE......
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
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
.................W.....kkkk......WW...............
.................W.....kkkk......WW...............
.................W.....kkkk......WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WWVVVVVVV........
.................W...............WW.....VV........
.................W...............LL.....VV........
.................W...............LL.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................L...............WW.....VV........
.................L...............WW.....VV........
.................WWWWWWoooooNWLLWWW.....VV........
.................WWWWWWoooooNWLLWWW.....VV........
.................................VV.....VV........
.................................VVVVV..VV........
.................................VVVVV..VV........
.................................VVVVVVVVV........
..................................VVVVVVV.........
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
.................WWWWWWWWWWWWLLWWWW...............
.................WWWWWWWWWWWWLLWWWW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
.................L...............WW...............
.................L...............WW...............
.................L...............WWVVVVVVV........
.................L...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................L...............WW.....VV........
.................L...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................WWWWWWWWWLLLLWWWWW.....VV........
.................WWWWWWWWWLLLLWWWWW.....VV........
.................................VV.....VV........
.................................VVVVV..VV........
.................................VVVVV..VV........
.................................VVVVVVVVV........
..................................VVVVVVV.........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE   00000000002222222222222222222222222222222222222000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE   00000000002222222222222222222222222222222222222000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000000000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000200000000000000000
EEEEEEEEEExxccccccccccccccccccccQccccccccccccccEEE   00000000002200000000000000000000200000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000000000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRccccccccccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRccccccccccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjj00000000000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkkkkkkkkkkkknkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllllllllllllkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllllllllllllkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdddddd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdddddd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllllllllllllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllllllllllllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjeeeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddeefeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddeeeeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddeeeeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddddddddd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022222222222222000000000ddddddddd00000000
EEEEEEEEEExxxxxxxxxxxxxrrrrrcccccccccccccccccccEEE   00000000002222222222222200000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE   00000000002222222222222200000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrccccccccccccccccccEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE   00000000002222222222222222222222222222222222222000
EEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE   00000000002222222222222222222222222222222222222000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000000000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000000000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000000000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   00000000002200000000000000000000000000000000000000
EEEEEEEEEExxcccccccccccccccccccccccccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxcccccJJJJJJJJJJJJJJJJJJccccccccccccEEE   0000000000220000aaaaaaaaaaaaaaaaaaa000000000000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJccccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllllllllllllkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllllllllllllkkjjaaaaaa00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRJJJJJJJcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjmdddddd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdddddd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllmmmmmmmmllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllllllllllllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkllllllllllllkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjkkkkkkkkkkkkkkkkjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjdeeedd00000000
EEEEEEEEEExxccccRRRRRRRRRRRRRRRRRRRKKKKKKKcccccEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjeeeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddeeeeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddeeeeedd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccKKKKKKKKKcccccEEE   000000000022000000000000000000000ddddddddd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccccccccccccccccEEE   000000000022000000000000000000000ddddddddd00000000
EEEEEEEEEExxcccccccccccrrrrrcccccccccccccccccccEEE   00000000002222222222222200000000000000000000000000
EEEEEEEEEExxxxxxxxxxxxxrrrrrcccccccccQcccccccccEEE   00000000002222222222222200000000000002000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE   00000000002222222222222200000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrcccccccccccccccccccEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 117 nodi, 546 passi, finito in 640 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, w=white, s=slate, a=alive, gray, v=olive, p=purple, d=dead, dark, r=strada, c=cyan (marcatore), x=steccato, Q=pozzo di pietra, m=magenta, W=intonaco, U=intonaco, R=tegole di casa, L=finestra, f=pavimento di casa, F=solaio, T=Teal (marcatore), k=gradini, O=porta, N=stipiti, o=assi della porta, P=fieno, J=tettoia di assi, K=tetto del fienile, V=mattoni del fienile, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), Z=comignolo.
Alla fine: W 58191, V 22000, R 16815, x 10200, E 9000, c 6117, L 3184, K 3061, k 2720, o 2130, f 2025, P 1975, F 1865, J 1500, r 600, N 375, O 120, Q 72, Z 11.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-34 all×23, one×4, prl×1: 562 celle x6-27 y3-29 z0, passi 2-64
   #37 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 65
    #39 all . w → w W passi=6: ×6, 12000 celle x50-104 y55-109 z0-6, passi 66-71, w→W 6000, .→w 6000
    #40 all . w → w U passi=14: ×14, 28000 celle x50-104 y55-109 z6-20, passi 72-85, w→U 14000, .→w 14000
#41-42 all×2: 36000 celle x50-104 y55-109 z20-38, passi 86-103
    #43 all . w → w U passi=14: ×14, 28000 celle x50-104 y55-109 z38-52, passi 104-117, w→U 14000, .→w 14000
#44-47 all×3, prl×1: 29450 celle x50-104 y55-109 z0-64, passi 118-132
    #48 all . h → h . passi=31: ×31, 113150 celle x55-99 y60-104 z1-32, passi 133-163, h→. 56575, .→h 56575
#49-50 all×2: 16050 celle x55-99 y60-104 z2-33, passi 164-194
    #51 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 195-225, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
    #52 prl h → R (+1): ×1, 2025 celle x55-99 y60-104 z64, passi 226, h→R 1825, s→R 200
      r1 h → R ×1825; r2 s → R ×200
    #53 all . v → v V passi=44: ×44, 44000 celle x100-124 y80-124 z0-44, passi 227-270, v→V 22000, .→v 22000
#54-55 prl×1, all×1: 1450 celle x100-124 y80-124 z0-44, passi 271-272
    #56 all . a → a . passi=43: ×43, 40850 celle x105-119 y85-119 z1-44, passi 273-315, a→. 20425, .→a 20425
#57-58 prl×1, all×1: 3475 celle x50-124 y35-119 z0-44, passi 316-317
    #59 all . p → p . passi=33: ×33, 99000 celle x50-124 y35-79 z1-34, passi 318-350, p→. 49500, .→p 49500
#60-110 prl×5, all×18, one×1: 31758 celle x30-139 y15-129 z0-51, passi 351-516
#111-117 prl×1, all×5, one×1: 39513 celle x49-125 y54-125 z6-81, passi 517-546
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#33 all xE/*c → *x/**: le celle cercate c'erano, ma mai disposte come nel pattern
#35 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#63 all . u → u Y passi=16: in quel momento nella griglia non c'erano celle "u"
#64 prl u → g: in quel momento nella griglia non c'erano celle "u"
#65 all g. → *g passi=3: in quel momento nella griglia non c'erano celle "g"
#66 all . g → g * passi=5: in quel momento nella griglia non c'erano celle "g"
#70 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#71 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#72 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#73 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#74 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 16
Improve it: answer with the whole program.

## Risposta

```xml
<!-- FATTORIA: the parts and their letters, on the plan (a cell is 5 voxels)
     h  the house: a body around H, 3 cells behind and 5-6 in front, 4 to each side; w its walls, i its windows (regular, every few cells)
     s  the stair zone, inside the house along the back wall
     a  the barn, a wing against one side wall of the house; v its walls, j its windows
     p  the lean-to with the hay, along the back of the house and of the barn
     d  the door in the front wall, 3 cells wide, on the axis; r the road straight to the front edge
     c  the farmyard, a band around everything; x the fence all around the yard, open only at the road
     Q  the well and q the silo, in the yard where 3 x 3 is free; t fruit trees outside the fence where 7 x 7 is free
     Seeds: house depth, barn side and length, where the well and the silo stand, the trees.
     Large: house, barn, lean-to. Huge: yard, fence, well, silo. Gargantuan: orchard too. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrcxQtmijq" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <one in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="E/[wv]" out="p/*" symmetry="()" steps="1"/>
      <all in="E/p" out="p/*" symmetry="()" steps="3"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="whhw" out="*hh*" steps="1"/>
      <all in="wwhwwwh" out="**h*i**" steps="2"/>
      <all in="hwwwh" out="**i**"/>
      <all in="avvva" out="**j**"/>
      <all in="[wvpcij]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*q*/***" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEWURLfFTkONohswavpPJxQtYugGcrKZiIjXq" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="q" out="cqqqc/qqqqq/qqqqq/qqqqq/cqqqc"/>
      <rule in="t" out="GGGGG/GGGGG/GGuGG/GGGGG/GGGGG"/>
      <sequence symmetry="(xy)">
        <!-- house walls: 64, windows in regular columns -->
        <all in="B w" out="w W" steps="64"/>
        <prl in="w" out="R"/>
        <all in="B i" out="i W" steps="8"/><all in="B i" out="i L" steps="14"/><all in="B i" out="i W" steps="18"/>
        <all in="B i" out="i L" steps="14"/><all in="B i" out="i W" steps="10"/>
        <prl in="i" out="R"/>
        <!-- house floors, stair strip, slab -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn: brick walls 44 with windows, hay floor -->
        <all in="B v" out="v V" steps="44"/>
        <prl in="v" out="K"/>
        <all in="B j" out="j V" steps="14"/><all in="B j" out="j L" steps="12"/><all in="B j" out="j V" steps="18"/>
        <prl in="j" out="K"/>
        <all in="B a" out="a P" steps="1"/>
        <all in="B a" out="a B" steps="43"/>
        <prl in="a" out="K"/>
        <!-- lean-to -->
        <all in="B p" out="p P" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- fence, well, silo, trees -->
        <all in="B x" out="x x" steps="7"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <all in="B q" out="q X" steps="56"/>
        <prl in="q" out="I"/>
        <all in="B u" out="u Y" steps="16"/>
        <prl in="u" out="g"/>
        <all in="gB" out="*g" steps="3"/>
        <all in="B g" out="g *" steps="5"/>
        <!-- the door -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **K**/**K**/KKKKK/**K**/**K**" out="*****/*****/**K**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <all in="***/*B*/*** *I*/IIIII/*I*" out="***/*I*/*** ***/*****/***" steps="3" symmetry="()"/>
        <one in="B B R" out="* Z *" steps="1" symmetry="()"/>
        <all in="B Z" out="Z *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="W" rgb="#E6DCC2" name="intonaco"/>
  <color symbol="V" rgb="#A0442E" name="mattoni del fienile"/>
  <color symbol="R" rgb="#B5502F" name="tegole di casa"/>
  <color symbol="K" rgb="#6E4A2C" name="tetto del fienile"/>
  <color symbol="J" rgb="#8C6A3E" name="tettoia di assi"/>
  <color symbol="L" rgb="#2E4A62" name="finestra"/>
  <color symbol="f" rgb="#C9A877" name="pavimento di casa" area="house"/>
  <color symbol="F" rgb="#9C7A50" name="solaio"/>
  <color symbol="P" rgb="#D8C068" name="fieno" area="barn"/>
  <color symbol="k" rgb="#7A5634" name="gradini"/>
  <color symbol="O" rgb="#5A3A22" name="porta"/>
  <color symbol="o" rgb="#3A2414" name="assi della porta"/>
  <color symbol="N" rgb="#4A4038" name="stipiti"/>
  <color symbol="T" hidden="True"/>
  <color symbol="r" rgb="#B8A27E" name="strada"/>
  <color symbol="c" hidden="True" area="yard"/>
  <color symbol="G" hidden="True" area="orchard"/>
  <color symbol="x" rgb="#7A5A38" name="steccato"/>
  <color symbol="Q" rgb="#8A8A86" name="pozzo di pietra"/>
  <color symbol="X" rgb="#9FA6A8" name="silo di pietra"/>
  <color symbol="I" rgb="#5E6E78" name="cupola del silo"/>
  <color symbol="Y" rgb="#5C3E24" name="tronco"/>
  <color symbol="g" rgb="#6E9A48" name="chioma"/>
  <color symbol="Z" rgb="#6A6460" name="comignolo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
