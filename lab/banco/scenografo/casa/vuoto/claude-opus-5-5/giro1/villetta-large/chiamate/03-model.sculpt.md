# model.sculpt · claude-opus-5-5 · 43 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front
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
villetta: a two-storey house that fills most of the plot, a porch with posts in front, the garden walled round it at Huge.
Plan letters:
  h  inside of the house, 15 to 17 cells wide, 13 deep (8 behind H, 4 in front)
  w  outer walls; j inner wall (hall in front, room behind); e the inner door, 3 cells in j on the axis
  d  front door, 3 cells; s the stair zone in the hall, against the inner wall, landing on its left
  p  porch toward one corner (side by seed); P its posts on the front row; n path; r road to the edge
  g  garden, x garden wall with merlons, v lean-to, Q well, t trees (Huge only)
Seeds change: width, porch side, lean-to side, well and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdpqnrgxvQtesP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="8"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <all in="j/h/H" out="e/*/*" symmetry="()" steps="1"/>
      <all in="ej" out="*e" symmetry="(x)" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <one in="wjjjjjjj/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <one in="pE" out="*q" symmetry="(x)" steps="1"/>
      <all in="ww/qE" out="**/*q" symmetry="(x)"/>
      <prl in="q" out="p"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="[dn]/p" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>
      <all in="w/p/p/p/p" out="*/*/*/*/P" symmetry="()"/>
      <all in="PP" out="Pp" symmetry="()"/>
      <all in="wEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE/gE/*g" out="*g/*g/**"/>
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="wgggg/wgggg/wgggg/wgggg/wgggg" out="*vvvv/*vvvv/*vvvv/*vvvv/*vvvv" symmetry="(x)" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*Q*/***" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*t*/***" steps="4"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
    </sequence>
    <map scale="5 5 1" values="BEhwjdespPbnrgxvQGAtcfFTkWULRJOoNMZyYDCK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="ggggg/gGGGg/gGAGg/gGGGg/ggggg"/>
      <rule in="t" out="ggggg/gcccg/gcccg/gcccg/ggggg"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B j" out="j J" steps="64"/>
        <prl in="j" out="R"/>
        <all in="B d" out="D *" steps="1"/><all in="B D" out="D W" steps="63"/>
        <all in="B e" out="Y *" steps="1"/><all in="B Y" out="Y J" steps="63"/>
        <prl><rule in="D" out="R"/><rule in="Y" out="R"/><rule in="d" out="O"/><rule in="e" out="O"/></prl>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="4"/>
        <all steps="1"><rule in="B p" out="y *"/><rule in="B n" out="y *"/><rule in="B v" out="y *"/></all>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="Z"/>
        <all in="B b" out="b *" steps="34"/>
        <all in="B x" out="x *" steps="11"/>
        <all in="B G" out="G *" steps="4"/>
        <all in="B c" out="c *" steps="14"/>
        <all in="B c" out="C *" steps="1"/>
        <all in="B C" out="C *" steps="8"/>
        <all in="CB" out="*C" steps="3"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="WJx"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="x"/>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="h" value="c9a777" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="j" value="d8c8a4" name="parete interna"/>
  <color symbol="m" value="b08850" name="corridoio"/>
  <color symbol="d" value="6b4226" name="porta"/>
  <color symbol="e" value="6b4226" name="porta interna"/>
  <color symbol="s" value="b08850" name="scala" area="house"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="P" value="a07850" name="portico" area="porch"/>
  <color symbol="q" value="a07850" name="portico"/>
  <color symbol="b" value="5a3a22" name="pilastro"/>
  <color symbol="n" value="9a8f80" name="vialetto" area="path"/>
  <color symbol="r" value="b5a68c" name="strada" area="road"/>
  <color symbol="g" value="8fae5a" name="giardino" area="garden"/>
  <color symbol="x" value="a8a296" name="muro di cinta" area="wall"/>
  <color symbol="v" value="8a6a46" name="tettoia" area="shed"/>
  <color symbol="Q" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="G" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="A" value="4a7fa8" name="acqua" area="well"/>
  <color symbol="t" value="3f6b2a" name="albero" area="garden"/>
  <color symbol="c" value="6a4a2c" name="tronco" area="garden"/>
  <color symbol="C" value="5f9a3e" name="chioma"/>
  <color symbol="f" value="c9a777" name="pavimento" area="house"/>
  <color symbol="F" value="a8865a" name="solaio"/>
  <color symbol="T" value="b08850" name="scala"/>
  <color symbol="k" value="8a6440" name="gradini"/>
  <color symbol="W" value="e8dcc0" name="muro intonacato"/>
  <color symbol="U" value="2e2a26" name="feritoia"/>
  <color symbol="L" value="8fc3d8" name="finestra"/>
  <color symbol="R" value="b04a32" name="tetto di coppi"/>
  <color symbol="J" value="d8c8a4" name="parete interna"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="M" value="9a958a" name="merlo"/>
  <color symbol="Z" value="8a5a34" name="tetto del portico"/>
  <color symbol="y" value="8a5a34" name="tetto del portico"/>
  <color symbol="Y" value="d8c8a4" name="parete interna"/>
  <color symbol="D" value="e8dcc0" name="muro intonacato"/>
  <color symbol="K" value="7a3a2a" name="comignolo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: casa: pavimento coperto 14,4 · 5,4 caselle² per piano, un'abitazione ne vuole almeno 10 al piano terra e a un altro piano: dai alla casa più del lotto (un corpo più largo e più profondo), non un giardino più grande — a dwelling: the covered floor of each storey where the centre of a body stands (half a body off every wall), cut into rooms where a passage is narrower than 0.4 tiles (a door in a wall cuts), in tiles² (a tile is 16 × 16 voxels)
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, p portico, n vialetto, b pilastro, f pavimento, F solaio, k gradini, W muro intonacato, L finestra, R tetto di coppi, J parete interna, O porta, o assi della porta, N stipite, Z tetto del portico, K comignolo
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREE
EEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEbbZZZbbZZZbbZZZZZZbZZZZZZZZEEEEEEEEEEEEEEEEEEEE
EEEbZZZZbZZZZbZZZZZZZbZZZZZZZZEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00ssssssssssssssssssssssssssssssssssssssssssssss00
00stttttttttttttttttttttttttttttttttttttttttttts00
00stttttttttttttttttttttttttttttttttttttttttttts00
00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuuwts00
00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts00
00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts00
00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00
00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00
00stttttttttttttttttttttttttttttttttttttttttttts00
00stttttttttttttttttttttttttttttttttttttttttttts00
00ssssssssssssssssssssssssssssssssssssssssssssss00
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
00ffffffffffffffffffffffffffff00000000000000000000
```
Front (looking from the front; the sky at the top):
```
............RRRRRRRRRRRRRRRRRRRRRRRRRR............
..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR...K....
......RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.K....
....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR....
..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..ZZZZZZZZZZZZZZZZZZZZZZZZZZZZWWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbWNNNNNNNWWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbLWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbLWWWWWbNoooooooNWWLLLWWWWWWWWWWWW..
..WbbWWWbbWWWbbLWWWWWbNoooooooNWWLLLWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWLLLWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWLLLWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
..WbbWWWbbWWWbbWWWWWWbNoooooooNWWWWWWWWWWWWWWWWW..
EEEppppppppppppppppppppnnnnnnnEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
............RRRRRRRRRRRRRRRRRR....................
..........RRRRRRRRRRRRRRRRRRRRRR..................
........RKRRRRRRRRRRRRRRRRRRRRRRRR................
......RRRKRRRRRRRRRRRRRRRRRRRRRRRRRR..............
....RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR............
..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWLLLWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWLLLWWWWWWWWWWWWWW..........
..WWWWWWLLLWWWWWWWWWWWWLLLWLLLWWWWWWWWWW..........
..WWWWWWLLLWWWWWLLLWWWWLLLWLLLWWWWWWWWWW..........
..WWWWWWLLLWWWWWLLLWWWWWWWWLLLWWWWWWWWWW..........
..WWWWWWLLLWWWWWLLLWWWWWWWWLLLWWWWWWWWWW..........
..WWWWWWWWWWWWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZZZ
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWLLLLWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWLLLLWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWLLLLWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........bb
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
...WWWWWWWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWW...
..WWWWWWWWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWW..
..WWWWWWWWWWWLLLWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..LLL........................................WWW..
..LLL........................................WWW..
..LLL........................................WWW..
..WWW........................................WWW..
..WWWJJJJJJJJJJJJJJJJJNoooooooNJJJJJJJJJJJJJJWWW..
..WWWJJJJJJJJJJJJJJJJJNoooooooNJJJJJJJJJJJJJJWWW..
..WWWJJJJJJJJJJJJJJJJJNoooooooNJJJJJJJJJJJJJJWWW..
..WWW.......kkkkkk...........................WWW..
..WWW.......kkkkkk...........................WWW..
..WWW.......kkkkkk...........................WWW..
..WWW.......kkkkkk...........................WWW..
..WWW........kkkkk...........................WWW..
..WWW........................................WWW..
..WWW........................................LLL..
..LLL........................................LWL..
..LLL........................................LWL..
..LLL........................................LLL..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..LLLWWWWWWWWLLLWWWWWWNoooooooNWWLLLWWWWWWWWWWWW..
..LWWWWWWWWWWLLLWWWWWWNoooooooNWWLLLWWWWWWWWWWWW..
..LWWWWWWWWWWLLLWWWWWWNoooooooNWWLLLWWWWWWWWWWWW..
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
...bb...bb...bb.....bb............................
...b....b....b.......b............................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................LLL..
..WWW........................................LLL..
..WWW........................................LLL..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................LLL..
..WWW........................................LLL..
..WWW........................................LLL..
..WWW........................................WWW..
..WWWJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJWWW..
..WWWJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJWWW..
..WWWJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJWWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................LLL..
..WWW........................................LLL..
..WWW........................................LLL..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWW........................................WWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
..................................................
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
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000ssssssssssssssssssssssssssssssssssssssssssssss
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttttttttttttvttttttttttttttttttttttttttttttts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000stttttttttttttttttttttttttttttttttttttttttttts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000stttttttttttttttttttttttttttttttttttttttttttts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   0000stttttttttttttttttttttttttttttttttttttttttttts
EEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000sssssssssssssssssssssssssssssssssssssssssssss
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZZZZZZZZZZZZZZZZZZZZ   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZbZZZZbZZZZZZbbZZZbb   0000000000000000000000ffffffffffffffffffffffffffff
EEEEEEEEEEEEEEEEEEEEEEEZZZZZZZZbZZZZbZZZZZZbZZZZbZ   0000000000000000000000ffffffffffffffffffffffffffff
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00ssssssssssssssssssssssssssssssssssssssssssssssss
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00stttttttttttvtttttttttttttttttttttttttttttttttts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00stttttttttttttttttttttttttttttttttttttttttttttts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00stttttttttttttttttttttttttttttttttttttttttttttts
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00stttttttttttttttttttttttttttttttttttttttttttttts
EEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00ssssssssssssssssssssssssssssssssssssssssssssssss
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEZZZZZZZZZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEbbZZZbbZZZbbZZZbbZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
EEEbZZZZbZZZZbZZZZbZZZZZZZZZZZEEEEEEEEEEEEEEEEEEEE   00ffffffffffffffffffffffffffff00000000000000000000
```
How much the plans of the seeds differ: 0.47 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 145 nodi, 650 passi, finito in 1006 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey (marcatore), E=Emerald (marcatore), h=pavimento, w=muro intonacato, j=parete interna, m=corridoio, d=porta, p=portico, q=portico, n=vialetto, e=porta interna, s=scala, P=portico, b=pilastro, f=pavimento, F=solaio, T=scala, k=gradini, W=muro intonacato, U=feritoia, L=finestra, R=tetto di coppi, J=parete interna, O=porta, o=assi della porta, N=stipite, Z=tetto del portico, y=tetto del portico, Y=parete interna, D=muro intonacato, K=comignolo, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 93583, R 46900, J 22975, f 4800, F 4640, o 4260, L 2992, k 2720, E 2150, b 1260, Z 1064, p 764, N 750, n 300, O 240, K 5.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-38 all×18, prl×3, one×3: 384 celle x1-18 y1-19 z0, passi 2-63
   #40 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 64
    #42 all . w → w W passi=6: ×6, 17700 celle x5-94 y5-79 z0-6, passi 65-70, w→W 8850, .→w 8850
    #43 all . w → w U passi=14: ×14, 41300 celle x5-94 y5-79 z6-20, passi 71-84, w→U 20650, .→w 20650
#44-45 all×2: 53100 celle x5-94 y5-79 z20-38, passi 85-102
    #46 all . w → w U passi=14: ×14, 41300 celle x5-94 y5-79 z38-52, passi 103-116, w→U 20650, .→w 20650
#47-48 all×1, prl×1: 36875 celle x5-94 y5-79 z52-64, passi 117-129
    #49 all . j → j J passi=64: ×64, 41600 celle x10-89 y40-44 z0-64, passi 130-193, j→J 20800, .→j 20800
#50-57 prl×2, all×6: 29675 celle x10-89 y10-79 z0-64, passi 194-325
    #58 all . h → h . passi=31: ×31, 285200 celle x10-89 y10-74 z1-32, passi 326-356, h→. 142600, .→h 142600
#59-60 all×2: 21600 celle x10-89 y10-74 z2-33, passi 357-387
    #61 all . h → h . (+1) passi=31: ×31, 297600 celle x10-89 y10-74 z33-64, passi 388-418, h→. 142600, .→h 142600, s→. 6200, .→s 6200
      r1 . h → h . ×142600; r2 . s → s . ×6200
#62-66 prl×2, one×1, all×2: 46430 celle x4-95 y4-80 z6-64, passi 419-436
#67-70 all×3, one×1: 40889 celle x5-93 y6-99 z1-74, passi 437-452
    #71 all . y → y . passi=33: ×33, 70224 celle x5-59 y80-99 z1-34, passi 453-485, y→. 35112, .→y 35112
#72-145 prl×5, all×14: 24978 celle x5-60 y40-99 z0-34, passi 486-650
Senza effetto (non hanno mai cambiato una cella):
#6 prl hE → *h passi=1
#27 all [nr]/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all wEEEEEE → *gggg** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#31 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#32 all gE/gE/*g → *g/*g/**: in quel momento nella griglia non c'erano celle "g"
#33 all gE → *x: in quel momento nella griglia non c'erano celle "g"
#34 all xE/*x → *x/**: in quel momento nella griglia non c'erano celle "x"
#35 one wgggg/wgggg/wgggg/wgggg/wgggg → *vvvv/*vvvv/*vvvv/*vvvv/*vvvv passi=1: in quel momento nella griglia non c'erano celle "g"
#36 one ggg/ggg/ggg → ***/*Q*/*** passi=1: in quel momento nella griglia non c'erano celle "g"
#37 one ggg/ggg/ggg → ***/*t*/*** passi=4: in quel momento nella griglia non c'erano celle "g"
#74 all . x → x * passi=11: in quel momento nella griglia non c'erano celle "x"
#75 all . G → G * passi=4: in quel momento nella griglia non c'erano celle "G"
… e altri 49
Fix it and answer with the whole program.

## Risposta

```xml
<!--
villetta: a two-storey house that fills most of the plot, a porch with posts in front, the garden walled round it at Huge.
Plan letters:
  h  inside of the house, 15 to 17 cells wide, 13 deep (8 behind H, 4 in front)
  w  outer walls; j inner wall (hall in front, room behind), one storey high; e the inner door, 3 cells in j on the axis
  d  front door, 3 cells; s the stair zone in the hall, against the inner wall, landing on its left
  p  porch toward one corner (side by seed); P its posts on the front row; n path; r road to the edge
  g  garden, x garden wall with merlons, v lean-to, Q well, t trees (Huge only)
Seeds change: width, porch side, lean-to side, well and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdpqnrgxvQtesP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="8"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <all in="j/h/H" out="e/*/*" symmetry="()" steps="1"/>
      <all in="ej" out="*e" symmetry="(x)" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <one in="wjjjjjjj/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <one in="pE" out="*q" symmetry="(x)" steps="1"/>
      <all in="ww/qE" out="**/*q" symmetry="(x)"/>
      <prl in="q" out="p"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="[dn]/p" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>
      <all in="w/p/p/p/p" out="*/*/*/*/P" symmetry="()"/>
      <all in="PP" out="Pp" symmetry="()"/>
      <all in="wEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE/gE/*g" out="*g/*g/**"/>
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="wgggg/wgggg/wgggg/wgggg/wgggg" out="*vvvv/*vvvv/*vvvv/*vvvv/*vvvv" symmetry="(x)" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*Q*/***" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*t*/***" steps="4"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
    </sequence>
    <map scale="5 5 1" values="BEhwjdespPbnrgxvQGAtcfFTkWULRJOoNMZyYDCK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="ggggg/gGGGg/gGAGg/gGGGg/ggggg"/>
      <rule in="t" out="ggggg/gcccg/gcccg/gcccg/ggggg"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B j" out="j J" steps="32"/>
        <all in="B j" out="j F" steps="1"/>
        <all in="B j" out="j B" steps="31"/>
        <prl in="j" out="R"/>
        <all in="B d" out="D *" steps="1"/><all in="B D" out="D W" steps="63"/>
        <all in="B e" out="Y *" steps="1"/>
        <all in="B Y" out="Y J" steps="31"/>
        <all in="B Y" out="Y F" steps="1"/>
        <all in="B Y" out="Y B" steps="31"/>
        <prl><rule in="D" out="R"/><rule in="Y" out="R"/><rule in="d" out="O"/><rule in="e" out="O"/></prl>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="4"/>
        <all steps="1"><rule in="B p" out="y *"/><rule in="B n" out="y *"/><rule in="B v" out="y *"/></all>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="Z"/>
        <all in="B b" out="b *" steps="34"/>
        <all in="B x" out="x *" steps="11"/>
        <all in="B G" out="G *" steps="4"/>
        <all in="B c" out="c *" steps="14"/>
        <all in="B c" out="C *" steps="1"/>
        <all in="B C" out="C *" steps="8"/>
        <all in="CB" out="*C" steps="3"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="WJx"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="x"/>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="h" value="c9a777" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="j" value="d8c8a4" name="parete interna"/>
  <color symbol="m" value="b08850" name="corridoio"/>
  <color symbol="d" value="6b4226" name="porta"/>
  <color symbol="e" value="6b4226" name="porta interna"/>
  <color symbol="s" value="b08850" name="scala" area="house"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="P" value="a07850" name="portico" area="porch"/>
  <color symbol="q" value="a07850" name="portico"/>
  <color symbol="b" value="5a3a22" name="pilastro"/>
  <color symbol="n" value="9a8f80" name="vialetto" area="path"/>
  <color symbol="r" value="b5a68c" name="strada" area="road"/>
  <color symbol="g" value="8fae5a" name="giardino" area="garden"/>
  <color symbol="x" value="a8a296" name="muro di cinta" area="wall"/>
  <color symbol="v" value="8a6a46" name="tettoia" area="shed"/>
  <color symbol="Q" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="G" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="A" value="4a7fa8" name="acqua" area="well"/>
  <color symbol="t" value="3f6b2a" name="albero" area="garden"/>
  <color symbol="c" value="6a4a2c" name="tronco" area="garden"/>
  <color symbol="C" value="5f9a3e" name="chioma"/>
  <color symbol="f" value="c9a777" name="pavimento" area="house"/>
  <color symbol="F" value="a8865a" name="solaio"/>
  <color symbol="T" value="b08850" name="scala"/>
  <color symbol="k" value="8a6440" name="gradini"/>
  <color symbol="W" value="e8dcc0" name="muro intonacato"/>
  <color symbol="U" value="2e2a26" name="feritoia"/>
  <color symbol="L" value="8fc3d8" name="finestra"/>
  <color symbol="R" value="b04a32" name="tetto di coppi"/>
  <color symbol="J" value="d8c8a4" name="parete interna"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="M" value="9a958a" name="merlo"/>
  <color symbol="Z" value="8a5a34" name="tetto del portico"/>
  <color symbol="y" value="8a5a34" name="tetto del portico"/>
  <color symbol="Y" value="d8c8a4" name="parete interna"/>
  <color symbol="D" value="e8dcc0" name="muro intonacato"/>
  <color symbol="K" value="7a3a2a" name="comignolo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
