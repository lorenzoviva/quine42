# model.sculpt · claude-opus-5-5 · 44 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  FATTORIA: a farmhouse that fills most of the area. It has a lean-to on one short side, the hay behind, and at Huge a yard with a dry-stone wall, fields and trees.
  The plan, one cell = 5 voxels:
    h  floor of the house, 13 x 13 cells inside the walls, two storeys.
       An inner wall i cuts the ground floor into a hall at the front and a room at the back.
    s  the stair zone, in the back room against the back wall, with 2 cells of landing before it.
    w  outer walls; d the front door, 3 cells wide; r the road to the edge.
    l  the lean-to on one side; p its posts at its front and back ends.
    y  the hay behind the house; g the yard; x the dry-stone wall; c the fields; t the trees.
  Seeds change the side of the lean-to, and where the hay, the fields and the trees fall.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdrlygxctisap" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="6"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="hhhhhwE" out="******l" symmetry="(x)" steps="1"/>
      <all><rule in="wE/wl" out="*l/**"/><rule in="wl/wE" out="**/*l"/></all>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*yyy*/*yyy*/*****" symmetry="()" steps="1"/>
      <!-- the rooms: 6 rows behind, the inner wall, the hall in front -->
      <all in="w/h" out="*/a" symmetry="()" steps="1"/>
      <all in="a/h" out="*/a" symmetry="()" steps="5"/>
      <all in="a/h" out="*/i" symmetry="()" steps="1"/>
      <one in="wwwwwww/waaaaaa/waaaaaa" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl in="a" out="h"/>
      <!-- the yard, the wall, the fields, the trees -->
      <all in="[wlyr]EEEEE" out="*g****" steps="1"/>
      <all in="gEEEE" out="*g***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEE" out="*x**" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <!-- the posts of the lean-to at its two ends -->
      <all in="l/[Eg]" out="p/*" symmetry="()"/>
      <all in="[Eg]/l" out="*/p" symmetry="()"/>
    </sequence>
    <map scale="5 5 1" values="BEhfFRwWuzViDOoNsTkLPmJYGXAZbnvrKMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="l" out="LLLLL/LLLLL/LLLLL/LLLLL/LLLLL"/>
      <rule in="p" out="LLLLL/LPPPL/LPPPL/LPPPL/LLLLL"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="g" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="x" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="c" out="AAAAA/ZZZZZ/AAAAA/ZZZZZ/AAAAA"/>
      <rule in="t" out="GGGGG/GnnnG/GnnnG/GnnnG/GGGGG"/>
      <sequence symmetry="(xy)">
        <all steps="1"><rule in="B w" out="w W"/><rule in="B D" out="D O"/></all>
        <all steps="5"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B D" out="D u"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B D" out="D u"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B i" out="i V"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B i" out="i V"/></all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B i" out="i F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B i" out="i B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="i" out="R"/><rule in="w" out="R"/><rule in="D" out="R"/></prl>
        <all in="B P" out="P P" steps="33"/>
        <all in="B L" out="m *" steps="1"/>
        <all in="B m" out="m B" steps="33"/>
        <prl in="m" out="J"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="B Y" out="Y Y" steps="14"/>
        <all in="B X" out="X X" steps="5"/>
        <all in="B A" out="A A" steps="3"/>
        <all in="B n" out="n b" steps="14"/>
        <prl in="n" out="v"/>
        <all in="vB" out="*v" steps="3"/>
        <all in="B v" out="v v" steps="5"/>
        <one in="fffffffffff/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/fffffffffff" out="***********/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <one steps="14"><rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z"/></one>
        <all in="zuuuuB" out="*zzzz*"/>
        <prl in="u" out="W"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="X"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="4"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="f" value="#a8814f" name="assito"/>
  <color symbol="F" value="#8a6a44" name="solaio"/>
  <color symbol="R" value="#b5452e" name="tetto di coppi"/>
  <color symbol="W" value="#e6dcc4" name="muro intonacato"/>
  <color symbol="V" value="#d8c9a8" name="tramezzo"/>
  <color symbol="z" value="#4a6a8a" name="finestra"/>
  <color symbol="O" value="#6b4426" name="porta"/>
  <color symbol="o" value="#3e2716" name="assi della porta"/>
  <color symbol="N" value="#5a5048" name="stipite"/>
  <color symbol="T" hidden="True"/>
  <color symbol="k" value="#7a5634" name="gradino"/>
  <color symbol="L" value="#9a8466" name="suolo della tettoia" area="barn"/>
  <color symbol="P" value="#5e4128" name="palo"/>
  <color symbol="J" value="#6f5a3a" name="tetto della tettoia"/>
  <color symbol="Y" value="#e3c75a" name="fieno" area="barn"/>
  <color symbol="G" value="#9fb86a" name="aia" area="yard"/>
  <color symbol="X" value="#9a9488" name="muretto a secco"/>
  <color symbol="A" value="#d6b84e" name="grano" area="field"/>
  <color symbol="Z" value="#8a6a4a" name="terra arata" area="field"/>
  <color symbol="b" value="#5a3e26" name="tronco"/>
  <color symbol="v" value="#5f8a3e" name="chioma"/>
  <color symbol="r" value="#bfae8a" name="strada sterrata"/>
  <color symbol="K" value="#7c4a3a" name="comignolo"/>
  <color symbol="M" value="#a8a296" name="merlo"/>
  <color symbol="U" value="#2e2a26" name="feritoia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: casa: pavimento coperto 9,2 · 11,9 caselle² per piano, un'abitazione ne vuole almeno 10 al piano terra e a un altro piano: dai alla casa più del lotto (un corpo più largo e più profondo), non un giardino più grande — a dwelling: the covered floor of each storey where the centre of a body stands (half a body off every wall), cut into rooms where a passage is narrower than 0.4 tiles (a door in a wall cuts), in tiles² (a tile is 16 × 16 voxels)
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, r strada sterrata, f assito, F solaio, R tetto di coppi, W muro intonacato, z finestra, V tramezzo, O porta, o assi della porta, N stipite, k gradino, L suolo della tettoia, P palo, J tetto della tettoia, Y fieno, G aia, X muretto a secco, A grano, Z terra arata, K comignolo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEXXGGGGGYYYYYYYYGGGGGXXZZZZZEEEEEEEEEEEEEEE
EEEEEEEEXXGGGGGYYYYYYYYGGGGGXXZZZZZEEEEEEEEEEEEEEE
EEEEEEEEXXGGGGGYYYYYYYYGGGGGXXAAAAAEEEEEEEEEEEEEEE
EEEEEEEEXXGGGGGYYYYYYYYGGGGGXXAAAAAEEEEEEEEEEEEEEE
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ
EEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJ
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAEEEEEEEE
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAAEEEEEEE
EEEEEEEEEEZZZZZXXXGGGGGrrrrrrrGGGGGXXXZZZZEEEEEEEE
EEEEEEEEEEZZZZZXXXGGGGGrrrrrrrGGGGGXXXZZZZEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000002220000066666666000022211111000000000000000
00000002220000066666666000022211111000000000000000
00000002220000066666666000022211111000000000000000
00000002220000066666666000022211111000000000000000
00000002220000066666666000022211111000000000000000
0000000sssssssssssssssssssssssssssssssssssssssffff
0000000stttttttttttttttttttttttttttttttttttttsffff
0000000stttttttttttttttttttttttttttttttttttttsffff
0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
0000000sttuuvvvvvvvvvvxvvvvvvvvvvvvvvvvvvuuttsffff
0000000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuuttsffff
0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
0000000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuuttsffff
0000000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuuttsffff
0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
0000000stttttttttttttttttttttttttttttttttttttsffff
0000000stttttttttttttttttttttttttttttttttttttsffff
0000000ssssssssssssssssssssssssssssssssssssssfffff
00000000001111122200000000000000000222111110000000
00000000001111122200000000000000000222111110000000
00000000001111122200000000000000000222111110000000
00000000001111122200000000000000000222111110000000
```
Front (looking from the front; the sky at the top):
```
.................RRRRRRRRRRRRRRRRRR...............
...............RRRRRRRRRRRRRRRRRRRRRR.............
.............RRRRRRRRRRRRRRRRRRRRRRRRRR...........
...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
.........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
.......RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJ
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWNNNNNWWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWOooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWOooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWOooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWOooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWOooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWOooooNWWWWWWzzzWWWWWPP.PP
.......WWWWWWWWWWWWWWWzzzOooooNWWWWWWzzzWWWWWPP.PP
.......WWWWWWWWWWWWWWWzzzOooooNWWWWWWzzzWWWWWPP.PP
.......WWWWWWWWWWWWWWWzzzOooooNWWWWWWzzzWWWWWPP.PP
.......WWWWWWWWWWWWWWWzzzOooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWzoooooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWNoooooooNWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWXXXWWWWNoooooooNWWWWXXXWWWWWWWPP.PP
.......WWWAAAAAXXXWWWWNoooooooNWWWWXXXAAAAAWWPP.PP
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAAEEEEEEE
```
Right side (looking from the right):
```
.................RRRRRRRRRRRRRRRRRR...............
............K..RRRRRRRRRRRRRRRRRRRRRR.............
............KRRRRRRRRRRRRRRRRRRRRRRRRRR...........
...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
.........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
.......RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWzzzWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWzzzWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWzzzWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWzzzWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
.......WPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
...YYYYWPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.....
..YYYYYYPPWWWWWWWWWWWWWWWWWWWWWWWWWWWzzzWWWPP.....
..YYYYYYPPWWWWWWWWWWWWWWWWWWWWWWWWWWWzzzWWWPP.....
..YYYYYYPPWWWWWWWWWWWWWWWWWWWWWWWWWWWzzzWWWPP.....
..YYYYYYPPWWWWWWWWWWWWWWWWWWWWWWWWWWWzzzWWWPP.....
..XXXXXXPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPPXXXXX
..AXXAAAPPWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPPAAAXX
EEEEEEEELLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
...............YYYYYYY............................
...............YYYYYYYY...........................
...............YYYYYYYY...........................
...............YYYYYYYY...........................
...............YYYYYYYY...........................
........WWWWWWWYYYYYYYWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWPP.PP
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.P.P.
.......WWW.......kkkkkk...................WWW.....
.......WWW.......kkkkkk...................WWW.....
.......WWW.......kkkkkk...................WWW.....
.......WWW.......kkkkkk...................WWW.....
.......WWW.......kkkkkk...................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWWVVVVVVVVVVVVVVVVVVNoooooNVVVVVVVVWW.....
.......WWWVVVVVVVVVVVVVVVVVVNoooooNVVVVVVVVWW.....
.......WWWVVVVVVVVVVVVVVVVVVNoooooNVVVVVVVWWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......zzz................................WWW.....
.......zzz................................zzz.....
.......zzz................................zzz.....
.......zzz................................zzz.....
.......zzz................................WWW.....
.......zzz................................WWW.....
.......WWWWWWWWWWWWWWWzzzOooooNWWWWWWzzzWWWWW.....
.......WWWWWWWWWWWWWWWzzzoooooNWWWWWWzzzWWWWWPP.PP
.......WWWWWWWWWWWWWWWzzzoooooNWWWWWWzzzWWWWW.P.P.
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
........WWWWWWWWWWWWWWWWWWWWWWWWWzzzzzzWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWzzzzzzWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWzzzzzzWWWWWW.....
.......WWW................................WWW.....
.......zzz................................WWW.....
.......zzz................................WWW.....
.......zWz................................WWW.....
.......zzz................................WWW.....
.......zzz................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......zzz................................WWW.....
.......zzz................................zzz.....
.......zzz................................zzz.....
.......WWW................................zzz.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......zzz................................WWW.....
.......zzz................................WWW.....
.......zzz................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWW................................WWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWzzzWWWWWWWWWWWW.....
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000111112220000666666660000022211111000000000000
EEEEEZZZZZXXXGGGGGYYYYYYYGGGGGXXXZZZZEEEEEEEEEEEEE   00000111112220000666666660000022211111000000000000
EEEEEZZZZZXXXGGGGGYYYYYYYGGGGGXXXZZZZEEEEEEEEEEEEE   00000111112220000666666660000022211111000000000000
EEEEEAAAAAXXXGGGGGYYYYYYYGGGGGXXXAAAAEEEEEEEEEEEEE   00000111112220000666666660000022211111000000000000
EEEEEAAAAAXXXGGGGGYYYYYYYGGGGGXXXAAAAEEEEEEEEEEEEE   00000111112220000666666660000022211111000000000000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEE   fffffffsssssssssssssssssssssssssssssssssssssss0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttttttttttttttttttttttttttttttttttttts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttttttttttttttttttttttttttttttttttttts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuvts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttttttttttttttttttttttttttttttttttttts0000
JJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEE   fffffffsttttttttttttttttttttttttttttttttttttts0000
JJJJJJJERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEE   fffffffssssssssssssssssssssssssssssssssssssss00000
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAEEEEEEEE   00000000001111122200000000000000000222111110000000
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAAEEEEEEE   00000000001111122200000000000000000222111110000000
EEEEEEEEEEZZZZZXXXGGGGGrrrrrrrGGGGGXXXZZZZEEEEEEEE   00000000001111122200000000000000000222111110000000
EEEEEEEEEEZZZZZXXXGGGGGrrrrrrrGGGGGXXXZZZZEEEEEEEE   00000000001111122200000000000000000222111110000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000111112220000066666666000022200000
EEEEEEEEEEEEEEEEEEZZZZXXXGGGGGYYYYYYYYGGGGGXXEEEEE   00000000000000000111112220000066666666000022200000
EEEEEEEEEEEEEEEEEEZZZZXXXGGGGGYYYYYYYYGGGGGXXEEEEE   00000000000000000111112220000066666666000022200000
EEEEEEEEEEEEEEEEEEAAAAXXXGGGGGYYYYYYYYGGGGGXXEEEEE   00000000000000000111112220000066666666000022200000
EEEEEEEEEEEEEEEEEEAAAAXXXGGGGGYYYYYYYYGGGGGXXEEEEE   00000000000000000111112220000066666666000022200000
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJ   0000000sssssssssssssssssssssssssssssssssssssssffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000stttttttttttttttttttttttttttttttttttttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000stttttttttttttttttttttttttttttttttttttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwxxxxxxxxxxxxxxxxxxxwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvvvvvxvvvvvvvvvvvvvvvvvvvvvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000stttttttttttttttttttttttttttttttttttttsffff
EEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJ   0000000stttttttttttttttttttttttttttttttttttttsffff
EEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJ   0000000ssssssssssssssssssssssssssssssssssssssfffff
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAEEEEEEEE   00000000001111122200000000000000000222111110000000
EEEEEEEEEEAAAAAXXXGGGGGrrrrrrrGGGGGXXXAAAAAEEEEEEE   00000000001111122200000000000000000222111110000000
EEEEEEEEEEZZZZZXXXGGGGGrrrrrrrGGGGGXXXZZZZEEEEEEEE   00000000001111122200000000000000000222111110000000
EEEEEEEEEEZZZZZXXXGGGGGrrrrrrrGGGGGXXXZZZZEEEEEEEE   00000000001111122200000000000000000222111110000000
```
How much the plans of the seeds differ: 0.42 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 138 nodi, 473 passi, finito in 671 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, w=white, m=magenta, d=dead, dark, r=strada sterrata, l=light, y=yellow, g=green, x=x, c=cyan, i=indigo, s=slate, a=alive, gray, p=purple, f=assito, F=solaio, R=tetto di coppi, W=muro intonacato, u=blue, z=finestra, V=tramezzo, D=Dead, Dark, O=porta, o=assi della porta, N=stipite, T=Teal (marcatore), k=gradino, P=palo, J=tetto della tettoia, Y=fieno, X=muretto a secco, A=grano, K=comignolo, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 84285, R 37495, V 8395, F 4065, f 3900, z 3280, o 3135, k 2720, E 2425, Y 2250, P 1224, X 1200, J 766, A 720, L 714, N 665, G 400, O 240, r 150, Z 120, K 5.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-35 all×22, prl×2, one×3: 491 celle x3-19 y1-19 z0, passi 2-58
   #37 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 59
#39-40 all×2: 16800 celle x15-89 y15-89 z0-6, passi 60-65
    #41 all . w → w u (+1) passi=14: ×14, 39200 celle x15-89 y15-89 z6-20, passi 66-79, w→u 18550, .→w 18550, D→u 1050, .→D 1050
      r1 . w → w u ×18550; r2 . D → D u ×1050
#42-43 all×2: 50400 celle x15-89 y15-89 z20-38, passi 80-97
    #44 all . w → w u (+1) passi=14: ×14, 39200 celle x15-89 y15-89 z38-52, passi 98-111, w→u 18550, .→w 18550, D→u 1050, .→D 1050
      r1 . w → w u ×18550; r2 . D → D u ×1050
#45-47 all×3: 42450 celle x15-89 y15-89 z0-64, passi 112-125
    #48 all . h → h . (+1) passi=31: ×31, 249550 celle x20-84 y20-84 z1-32, passi 126-156, h→. 114700, .→h 114700, i→V 10075, .→i 10075
      r1 . h → h . ×114700; r2 . i → i V ×10075
#49-50 all×2: 20450 celle x20-84 y20-84 z2-33, passi 157-187
    #51 all . h → h . (+2) passi=31: ×31, 261950 celle x20-84 y20-84 z33-64, passi 188-218, h→. 114700, .→h 114700, i→. 10075, .→i 10075, +2
      r1 . h → h . ×114700; r2 . s → s . ×6200; r3 . i → i . ×10075
#52-55 prl×1, all×3: 54651 celle x15-99 y15-89 z1-64, passi 219-286
#56-68 prl×2, all×5, one×2: 43661 celle x15-99 y5-99 z0-51, passi 287-327
#75-138 all×16, prl×4, one×1: 52250 celle x14-90 y14-90 z0-74, passi 328-473
Senza effetto (non hanno mai cambiato una cella):
#28 all gE/*g → *g/**: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all xE/*x → *x/**: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#61 all . n → n b passi=14: in quel momento nella griglia non c'erano celle "n"
#62 prl n → v: in quel momento nella griglia non c'erano celle "n"
#63 all v. → *v passi=3: in quel momento nella griglia non c'erano celle "v"
#64 all . v → v v passi=5: in quel momento nella griglia non c'erano celle "v"
#70 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#71 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#72 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#73 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
… e altri 41
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  FATTORIA: a farmhouse that fills most of the area. It has a lean-to on one short side, the hay behind, and at Huge a yard with a dry-stone wall, fields and trees.
  The plan, one cell = 5 voxels:
    h  floor of the house, 15 x 13 cells inside the walls, two storeys.
       An inner wall i cuts the ground floor into a hall at the front and a room at the back.
    s  the stair zone, in the back room against the back wall, with 2 cells of landing before it.
    w  outer walls; d the front door, 3 cells wide; r the road to the edge.
    l  the lean-to on one side; p its posts at its front and back ends.
    y  the hay behind the house; g the yard; x the dry-stone wall; c the fields; t the trees.
  Seeds change the side of the lean-to, and where the hay, the fields and the trees fall.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdrlygxctisap" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="hhhhhwE" out="******l" symmetry="(x)" steps="1"/>
      <all><rule in="wE/wl" out="*l/**"/><rule in="wl/wE" out="**/*l"/></all>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*yyy*/*yyy*/*****" symmetry="()" steps="1"/>
      <all in="w/h" out="*/a" symmetry="()" steps="1"/>
      <all in="a/h" out="*/a" symmetry="()" steps="5"/>
      <all in="a/h" out="*/i" symmetry="()" steps="1"/>
      <one in="wwwwwww/waaaaaa/waaaaaa" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl in="a" out="h"/>
      <all in="[wlyr]EEEEE" out="*g****" steps="1"/>
      <all in="gEEEE" out="*g***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEE" out="*x**" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <all in="l/[Eg]" out="p/*" symmetry="()"/>
      <all in="[Eg]/l" out="*/p" symmetry="()"/>
    </sequence>
    <map scale="5 5 1" values="BEhfFRwWuzViDOoNsTkLPmJYGXAZbnvrKMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="l" out="LLLLL/LLLLL/LLLLL/LLLLL/LLLLL"/>
      <rule in="p" out="LLLLL/LPPPL/LPPPL/LPPPL/LLLLL"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="g" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="x" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="c" out="AAAAA/ZZZZZ/AAAAA/ZZZZZ/AAAAA"/>
      <rule in="t" out="GGGGG/GnnnG/GnnnG/GnnnG/GGGGG"/>
      <sequence symmetry="(xy)">
        <all steps="1"><rule in="B w" out="w W"/><rule in="B D" out="D O"/></all>
        <all steps="5"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B D" out="D u"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B D" out="D u"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B i" out="i V"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B i" out="i V"/></all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B i" out="i F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B i" out="i B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="i" out="R"/><rule in="w" out="R"/><rule in="D" out="R"/></prl>
        <all in="B P" out="P P" steps="33"/>
        <all in="B L" out="m *" steps="1"/>
        <all in="B m" out="m B" steps="33"/>
        <prl in="m" out="J"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="B Y" out="Y Y" steps="14"/>
        <all in="B X" out="X X" steps="5"/>
        <all in="B A" out="A A" steps="3"/>
        <all in="B n" out="n b" steps="14"/>
        <prl in="n" out="v"/>
        <all in="vB" out="*v" steps="3"/>
        <all in="B v" out="v v" steps="5"/>
        <one in="fffffffffff/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/fffffffffff" out="***********/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <one steps="14"><rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z"/></one>
        <all in="zuuuuB" out="*zzzz*"/>
        <prl in="u" out="W"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="X"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="4"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="f" value="#a8814f" name="assito"/>
  <color symbol="F" value="#8a6a44" name="solaio"/>
  <color symbol="R" value="#b5452e" name="tetto di coppi"/>
  <color symbol="W" value="#e6dcc4" name="muro intonacato"/>
  <color symbol="V" value="#d8c9a8" name="tramezzo"/>
  <color symbol="z" value="#4a6a8a" name="finestra"/>
  <color symbol="O" value="#6b4426" name="porta"/>
  <color symbol="o" value="#3e2716" name="assi della porta"/>
  <color symbol="N" value="#5a5048" name="stipite"/>
  <color symbol="T" hidden="True"/>
  <color symbol="k" value="#7a5634" name="gradino"/>
  <color symbol="L" value="#9a8466" name="suolo della tettoia" area="barn"/>
  <color symbol="P" value="#5e4128" name="palo"/>
  <color symbol="J" value="#6f5a3a" name="tetto della tettoia"/>
  <color symbol="Y" value="#e3c75a" name="fieno" area="barn"/>
  <color symbol="G" value="#9fb86a" name="aia" area="yard"/>
  <color symbol="X" value="#9a9488" name="muretto a secco"/>
  <color symbol="A" value="#d6b84e" name="grano" area="field"/>
  <color symbol="Z" value="#8a6a4a" name="terra arata" area="field"/>
  <color symbol="b" value="#5a3e26" name="tronco"/>
  <color symbol="v" value="#5f8a3e" name="chioma"/>
  <color symbol="r" value="#bfae8a" name="strada sterrata"/>
  <color symbol="K" value="#7c4a3a" name="comignolo"/>
  <color symbol="M" value="#a8a296" name="merlo"/>
  <color symbol="U" value="#2e2a26" name="feritoia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
