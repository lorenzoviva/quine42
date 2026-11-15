# model.sculpt · claude-opus-5-5 · 47 s · 1 immagini

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

Your program:
<!--
FATTORIA (farm). The front faces +y.
Plan letters: H centre, h house floor, w house walls (two storeys, hip roof), m trace to the door,
d door cells, r road, a lean-to/barn floor (a wing on a side wall), v barn walls, Y haystack behind,
s stair zone along the back wall, c farmyard ring, x fence, t orchard trees.
Seeds change: the house depth, the side and place of the wing, where the hay stands, the trees.
Large: house, lean-to, hay, road. Huge: adds yard, fence, trees. Gargantuan: more trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdravYcxts" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
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
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <one in="EEE/EEE/EEE/www" out="***/*Y*/***/***" symmetry="()" steps="1"/>

      <all in="[wv]EEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE/[wv]c" out="*c/**"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsqfFWULRTkONoavAVJYcxXzZCr" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EzzzE/EzzzE/EzzzE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B q" out="q O" steps="1"/>
        <all in="B q" out="q W" steps="63"/>
        <prl in="q" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="34"/>
        <prl in="a" out="J"/>
        <all in="B v" out="v V" steps="35"/>
        <prl in="v" out="J"/>

        <all in="B Y" out="Y Y" steps="20"/>
        <all in="B x" out="x X" steps="7"/>
        <prl in="x" out="X"/>
        <all in="B z" out="z Z" steps="20"/>
        <prl in="z" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>

        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <import file="part-stair"/>
        <import file="part-door"/>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="W"/>
  <union symbol="=" values="fF"/>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="f" rgb="#c8a878" name="assi del pavimento" area="house"/>
  <color symbol="F" rgb="#9a7a50" name="solaio"/>
  <color symbol="W" rgb="#e8dcc0" name="intonaco"/>
  <color symbol="L" rgb="#5a7a9a" name="finestra"/>
  <color symbol="R" rgb="#b04a30" name="tetto di coppi"/>
  <color symbol="T" hidden="True" name="striscia della scala"/>
  <color symbol="k" rgb="#7a5a3a" name="gradini"/>
  <color symbol="O" rgb="#6a3a20" name="porta"/>
  <color symbol="o" rgb="#3a2010" name="assi della porta"/>
  <color symbol="N" rgb="#8a8a80" name="stipite di pietra"/>
  <color symbol="A" rgb="#a08050" name="pavimento della tettoia" area="barn"/>
  <color symbol="V" rgb="#8a4a2a" name="tavole del fienile"/>
  <color symbol="J" rgb="#5a4030" name="tetto della tettoia"/>
  <color symbol="Y" rgb="#e0c050" name="fieno" area="barn"/>
  <color symbol="c" hidden="True" name="aia" area="yard"/>
  <color symbol="r" rgb="#b89a6a" name="strada battuta"/>
  <color symbol="X" rgb="#6a7a3a" name="siepe"/>
  <color symbol="Z" rgb="#5a3a20" name="tronco"/>
  <color symbol="C" rgb="#4a8a3a" name="chioma" area="orchard"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Il rosso del tetto e delle staccionate è troppo acceso e saturo rispetto alla palette diurna e smorzata del mondo; La rampa rossa davanti alla porta risulta innaturale e confonde l'ingresso
Advice: Smorza il rosso del tetto verso un tono mattone o tegola calda; Rendi la staccionata in legno naturale o pietra e definisci meglio la rampa d'ingresso con tonalità piatte e coerenti con il terreno
What the game made of it, in text:
### Seed 1: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, r strada battuta, Y fieno, c aia, f assi del pavimento, F solaio, W intonaco, L finestra, R tetto di coppi, k gradini, O porta, N stipite di pietra, o assi della porta, A pavimento della tettoia, V tavole del fienile, J tetto della tettoia, X siepe
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXEEEXXXXXEEEEEEE
EEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXEEEXXXXXEEEEEEE
EEEEEEEEEEXXXccccccccccccccccccccccYYYccXXXEEEEEEE
EEEEEEEEEEXXXccccccccccccccccccccccYYYccXXXEEEEEEE
EEEEEEEEEEXXXccccccccccccccccccccccYYcccXXXEEEEEEE
EEEEEEEEEEXXXccccccccccccccccccccccEEEccXXXEEEEEEE
EEEEEEEEEEXXXccccccccccccccccccccccEERccXXXEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJ
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEJJJJJJJJJJ
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEJJJJJJJJJJ
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000003333333333333333333333333003333330000000
00000000003333333333333333333333333003333330000000
00000000003333333333333333333333333003333330000000
00000000003330000000000000000000000999003330000000
00000000003330000000000000000000000999003330000000
00000000003330000000000000000000000999003330000000
00000000003330000000000000000000000000003330000000
000000000033ssssssssssssssssssssssssssss3330000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts333333333
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts333333333
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts333333333
000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
000000000000stttttttttttttttttttttttttttsggggggggg
000000000000stttttttttttttttttttttttttttsggggggggg
000000000000sssssssssssssssssssssssssssssggggggggg
0000000000000000000000000000000000000000gggggggggg
0000000000000000000000000000000000000000gggggggggg
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRRR....................
....................RRRRRRRRRRRR..................
..................RRRRRRRRRRRRRRRR................
................RRRRRRRRRRRRRRRRRRRR..............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLLLLWWWWWWWWWWWWWWWWWW..........
............WWWWLLLLLLWWWWWWWWWWWWWWWWWW..........
............WWWWLLLLLLWWWWWWWWWWWWWWWWWW..........
............WWWWWWWLLLWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWWNNNNNNNWWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
............WWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
..........XXXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
..........XXXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
..........XXXWWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.........................RRRRRRRR.................
.......................RRRRRRRRRRRR...............
.....................RRRRRRRRRRRRRRRR.............
...................RRRRRRRRRRRRRRRRRRRR...........
.................RRRRRRRRRRRRRRRRRRRRRRRR.........
...............RRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWLLLWWWWWWWWWWW.......
...............WWWWWWWWLLLWWWLLLWWWWWWWWWWW.......
...............WWWWWWWWLLLWWWLLLWWWWWWWWWWW.......
...............WWWWWWWWLLLWWWLLLWWWWWWWWWWW.......
...............WWWWWWWWLLLWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
...............WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YY...WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YYY..WWWLLLWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YYY..WWWLLLWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YYY..WWWLLLWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YYY..WWWLLLWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YYY..WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
..........YYY..WWWWWWWWWWWWWVVVVVVVVVVVVVVVVV.....
.......XXXXXXXXWWWWWXXXWWWWWVVVVVVVVVVVVVVVVV.....
.......XXXXXXXXWWWWWXXXWWWWWVVVVVVVVVVVVVVVVV.....
.......XXXXXXXXWWWWWXXXWWWWWVVVVVVVVVVVVVVVVV.....
EEEEEEEEEEEEEEEEEEEEXXXccccVVVVVVVVVVVVVVVVVVEEEEE
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
...................................YYY............
...................................YYY............
...................................YY.............
..................................................
..................................................
............WWWWWWWWWWWWWWWWWWLLLWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWLLLWWWWWWW..........
............WWW.......kkkkkk.........LLL..........
............WWW.......kkkkkk.........LLL..........
............WWW.......kkkkkk.........LLL..........
............LLL.......kkkkkk.........WWW..........
............LLL........kkkkk.........WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWWVVVVVVVVVV
............LLL......................WWWVVVVVVVVVV
............WWW......................WWWVVVVVVVVVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............LLL......................WWW.......VVV
............LLL......................WWW.......VVV
............LLL......................LLL.......VVV
............WWW......................LLL.......VVV
............WWW......................LLL.......VVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............WWW......................WWW.......VVV
............WWWWWWWWWWNoooooooNWWWWWWWWW.......VVV
............WWWWWWWWWWNoooooooNWWWWWWWWW.......VVV
.............WWWWWWWWWNoooooooNWWWWWWWWWVVVVVVVVVV
........................................VVVVVVVVVV
........................................VVVVVVVVVV
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
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWLLLWWWWWWWWWWWWWWWWWW..........
............WWWWWWWLLLWWWWWWWWWWWWWWWWWW..........
.............WWWWWWLLLWWWWWWWWWWWWWWWWWW..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000003333333333003333333333333333333330000000
EEEEEEEEEEXXXXXXXXXXEEEXXXXXXXXXXXXXXXXXXXXEEEEEEE   00000000003333333333003333333333333333333330000000
EEEEEEEEEEXXXXXXXXXXEEEXXXXXXXXXXXXXXXXXXXXEEEEEEE   00000000003333333333003333333333333333333330000000
EEEEEEEEEEXXXcccccccYYYcccccccccccccccccXXXEEEEEEE   00000000003330000000999000000000000000003330000000
EEEEEEEEEEXXXcccccccYYYcccccccccccccccccXXXEEEEEEE   00000000003330000000999000000000000000003330000000
EEEEEEEEEEXXXcccccccYYccccccccccccccccccXXXEEEEEEE   00000000003330000000999000000000000000003330000000
EEEEEEEEEEXXXcccccccEEEcccccccccccccccccXXXEEEEEEE   00000000003330000000000000000000000000003330000000
EEEEEEEEEEXXXcccccccEERcccccccccccccccccXXXEEEEEEE   000000000033ssssssssssssssssssssssssssss3330000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000stttttttttttttttttttttttttttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000stttttttttttttttttttttttttttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJ   000000000000sssssssssssssssssssssssssssssggggggggg
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEJJJJJJJJJJ   0000000000000000000000000000000000000000gggggggggg
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEJJJJJJJJJJ   0000000000000000000000000000000000000000gggggggggg
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000003333300333333333333333333333333330000000
EEEEEEEEEEXXXXXEEEXXXXXXXXXXXXXXXXXXXXXXXXXEEEEEEE   00000000003333300333333333333333333333333330000000
EEEEEEEEEEXXXXXEEEXXXXXXXXXXXXXXXXXXXXXXXXXEEEEEEE   00000000003333300333333333333333333333333330000000
EEEEEEEEEEXXXccYYYccccccccccccccccccccccXXXEEEEEEE   00000000003330099900000000000000000000003330000000
EEEEEEEEEEXXXccYYYccccccccccccccccccccccXXXEEEEEEE   00000000003330099900000000000000000000003330000000
EEEEEEEEEEXXXccYYcccccccccccccccccccccccXXXEEEEEEE   00000000003330099900000000000000000000003330000000
EEEEEEEEEEXXXccEEEccccccccccccccccccccccXXXEEEEEEE   00000000003330000000000000000000000000003330000000
EEEEEEEEEEXXXccEERccccccccccccccccccccccXXXEEEEEEE   000000000033ssssssssssssssssssssssssssss3330000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXXXXXXXX   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts333333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000stttttttttttttttttttttttttttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000stttttttttttttttttttttttttttsggggggggg
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRREJJJJJJJJJ   000000000000sssssssssssssssssssssssssssssggggggggg
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 108 nodi, 525 passi, finito in 425 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=terra (marcatore), h=honey, w=white, m=magenta, d=dead, dark, r=strada battuta, a=alive, gray, v=olive, Y=fieno, c=aia (marcatore), x=x, s=slate, q=aqua, f=assi del pavimento, F=solaio, W=intonaco, U=blUe, L=finestra, R=tetto di coppi, T=striscia della scala (marcatore), k=gradini, O=porta, N=stipite di pietra, o=assi della porta, A=pavimento della tettoia, V=tavole del fienile, J=tetto della tettoia, X=siepe, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 58135, R 16815, V 11375, E 4825, X 4000, L 3240, k 2720, o 2130, f 2025, F 1865, c 700, J 700, Y 525, A 375, N 375, r 225, O 120.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-30 all×19, one×3, prl×1: 228 celle x4-19 y3-19 z0, passi 2-41
   #33 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 42
    #35 all . w → w W passi=6: ×6, 11100 celle x25-79 y30-84 z0-6, passi 43-48, w→W 5550, .→w 5550
    #36 all . w → w U passi=14: ×14, 25900 celle x25-79 y30-84 z6-20, passi 49-62, w→U 12950, .→w 12950
    #37 all . w → w W passi=12: ×12, 22200 celle x25-79 y30-84 z20-32, passi 63-74, w→W 11100, .→w 11100
    #38 all . w → w W passi=6: ×6, 11100 celle x25-79 y30-84 z32-38, passi 75-80, w→W 5550, .→w 5550
    #39 all . w → w U passi=14: ×14, 25900 celle x25-79 y30-84 z38-52, passi 81-94, w→U 12950, .→w 12950
    #40 all . w → w W passi=12: ×12, 22200 celle x25-79 y30-84 z52-64, passi 95-106, w→W 11100, .→w 11100
#41-46 prl×2, all×4: 15050 celle x25-79 y30-84 z0-64, passi 107-174
    #47 all . h → h . passi=31: ×31, 113150 celle x30-74 y35-79 z1-32, passi 175-205, h→. 56575, .→h 56575
#48-49 all×2: 16050 celle x30-74 y35-79 z2-33, passi 206-236
    #50 all . h → h . (+1) passi=31: ×31, 125550 celle x30-74 y35-79 z33-64, passi 237-267, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#51-52 prl×1, all×1: 2775 celle x30-94 y35-84 z0-64, passi 268-269
    #53 all . a → a . passi=34: ×34, 25500 celle x80-94 y60-84 z1-35, passi 270-303, a→. 12750, .→a 12750
#54-55 prl×1, all×1: 23125 celle x80-99 y55-89 z0-35, passi 304-339
#56-65 prl×2, all×3, one×1: 11565 celle x20-99 y15-89 z0-51, passi 340-383
    #66 prl U → W: ×1, 22660 celle x25-79 y30-84 z6-51, passi 384, U→W 22660
#67-68 all×2: 13790 celle x24-80 y29-85 z64-74, passi 385-395
#86-108 all×13, prl×4: 18010 celle x40-60 y35-84 z0-32, passi 396-525
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#27 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all cE/[wv]c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#31 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#60 all . z → z Z passi=20: in quel momento nella griglia non c'erano celle "z"
#61 prl z → C: in quel momento nella griglia non c'erano celle "z"
#62 all C. → *C passi=4: in quel momento nella griglia non c'erano celle "C"
#63 all . C → C * passi=6: in quel momento nella griglia non c'erano celle "C"
#70 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#71 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#72 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#73 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
… e altri 17
Improve it: answer with the whole program.

## Risposta

```xml
<!--
FATTORIA (farm). The front faces +y.
Plan letters: H centre, h house floor, w house walls (two storeys, hip roof), m trace to the door,
d door cells, r road, a lean-to floor (a wing on a side wall), v lean-to walls, Y haystack behind,
s stair zone along the back wall, c farmyard ring, x fence, t trees, g kitchen garden.
Seeds change: the house depth, the side and place of the wing and its length, where the hay stands, the trees, the garden.
Large: house, lean-to, hay, road, a few trees. Huge: adds yard, fence, garden, more trees. Gargantuan: an orchard of trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdravYcxtsg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <one in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <one in="EEE/EEE/EEE/www" out="***/*Y*/***/***" symmetry="()" steps="1"/>

      <all in="[wv]EEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE/[wv]c" out="*c/**"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <one in="cccc/cccc/cccc" out="****/*gg*/****" steps="1"/>

      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="8"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsqfFWULRTkONoavAVJYcxXzZCrgG" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="g" out="gGgGg/gGgGg/gGgGg/gGgGg/gGgGg"/>
      <rule in="t" out="EEEEE/EzzzE/EzzzE/EzzzE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B q" out="q O" steps="1"/>
        <all in="B q" out="q W" steps="63"/>
        <prl in="q" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="34"/>
        <prl in="a" out="J"/>
        <all in="B v" out="v V" steps="35"/>
        <prl in="v" out="J"/>

        <all in="B Y" out="Y Y" steps="20"/>
        <all in="B x" out="x X" steps="7"/>
        <prl in="x" out="X"/>
        <all in="B G" out="G G" steps="3"/>
        <all in="B z" out="z Z" steps="20"/>
        <prl in="z" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>

        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <import file="part-stair"/>
        <import file="part-door"/>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="W"/>
  <union symbol="=" values="fF"/>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="f" rgb="#c8a878" name="assi del pavimento" area="house"/>
  <color symbol="F" rgb="#9a7a50" name="solaio"/>
  <color symbol="W" rgb="#e4dac4" name="intonaco"/>
  <color symbol="L" rgb="#4e6478" name="finestra"/>
  <color symbol="R" rgb="#9c5e46" name="tetto di coppi"/>
  <color symbol="T" hidden="True" name="striscia della scala"/>
  <color symbol="k" rgb="#7a5a3a" name="gradini"/>
  <color symbol="O" rgb="#6a4a30" name="porta"/>
  <color symbol="o" rgb="#3a2a1a" name="assi della porta"/>
  <color symbol="N" rgb="#8a8a80" name="stipite di pietra"/>
  <color symbol="A" rgb="#a89070" name="pavimento della tettoia" area="barn"/>
  <color symbol="V" rgb="#8a6a4a" name="tavole del fienile"/>
  <color symbol="J" rgb="#5e4a3a" name="tetto della tettoia"/>
  <color symbol="Y" rgb="#d8c070" name="fieno" area="barn"/>
  <color symbol="c" hidden="True" name="aia" area="yard"/>
  <color symbol="r" rgb="#a89a80" name="strada battuta"/>
  <color symbol="X" rgb="#9a7e5a" name="staccionata"/>
  <color symbol="g" rgb="#7a6040" name="terra dell'orto" area="garden"/>
  <color symbol="G" rgb="#7a9a50" name="ortaggi" area="garden"/>
  <color symbol="Z" rgb="#5a4030" name="tronco"/>
  <color symbol="C" rgb="#6a8a4a" name="chioma" area="orchard"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
```
