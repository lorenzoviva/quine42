# model.sculpt · claude-sonnet-5-5 · 326 s

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

## Your program so far
<!--
FATTORIA, block 1: the composition on the plan (a cell is 5 voxels).
PARTS AND LETTERS
  house (h floor, w wall, H centre): 9 x 8-9 cells inside, around H, 4 behind, 3 in front plus one by chance.
  door d at the middle of the front wall, 3 cells wide; the road r runs straight from it to the edge.
  stair zone s: inside, at the back corner (left or right by chance), two cells of landing before it.
  lean-to (a floor, p posts): 4 cells deep, 7 along one SIDE wall of the house, left or right by chance.
  haystack y: 4 x 2 against the BACK wall, anywhere along it.
  yard c: a one-cell ring around the house, so every part is joined to the road by it.
  garden g: 4 x 3 in front of the house, beside the road, on the yard.
  well Q: 2 x 2 on the edge of the yard, wherever two cells of free ground go on past it.
  barn (v wall, b floor, u door): ONLY where the ground allows it (huge): 8 x 9 cells, flush with the yard
      on the side of the house OPPOSITE the lean-to (the lean-to breaks the yard on its side), door toward the yard.
  orchard t: trees spaced 7 apart wherever 7 x 7 of free lawn exist (huge only).
WHAT THE SEEDS CHANGE
  the depth of the house, the side of the lean-to and where along the wall, the side of the stair,
  the place of the hay, of the garden, of the well, of the barn along the yard, and the orchard.
WHAT FITS
  large (20 x 20): house, lean-to, hay behind, yard, garden, well. Less, not smaller.
  huge (30 x 30): the same, plus the barn on the free side and the orchard.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwapmdrycgQtvbus" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">

      <!-- the house: a line through H, then 4 cells to each side, then its walls -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair, in a back corner of the house, landing at the small-x end -->
      <one steps="1">
        <rule in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()"/>
        <rule in="wwwwwww/hhhhhhw/hhhhhhw" out="*******/**ssss*/**ssss*" symmetry="()"/>
      </one>

      <!-- the lean-to: 7 along a side wall, 4 deep, posts at both ends and in the middle of the outer edge -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/**/a*/**/**/**" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="aE" out="*p" symmetry="(x)" steps="1"/>
      <all in="p/p/p/p/p/p/p" out="*/a/a/*/a/a/*" symmetry="()"/>

      <!-- the hay behind, against the back wall -->
      <one in="EEEE/EEEE/wwww" out="yyyy/yyyy/****" symmetry="()" steps="1"/>

      <!-- the way out: from H through the house to the front, the door, the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- the yard: a ring around the house, corners filled -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the barn: only where nine cells of yard side and eight of free ground go on past it; flush with the yard -->
      <one in="cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE"
           out="*vvvvvvvv/*vbbbbbbv/*vbbbbbbv/*ubbbbbbv/*ubbbbbbv/*ubbbbbbv/*vbbbbbbv/*vbbbbbbv/*vvvvvvvv"
           symmetry="(x)" steps="1"/>

      <!-- the garden in front of the house, on the yard, beside the road -->
      <one in="cccc/EEEE/EEEE/EEEE" out="****/gggg/gggg/gggg" symmetry="()" steps="1"/>

      <!-- the well on the edge of the yard -->
      <one in="cc/EE/EE" out="**/QQ/QQ" symmetry="(xy)" steps="1"/>

      <!-- the orchard: a tree in every 7 x 7 of free lawn -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE"
           out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>

      <!-- the markers go back to the floor -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

    </sequence>
  </map>

  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7FA05A" name="terreno" hidden="True"/>
  <color symbol="H" value="C9A96E" name="centro della casa" hidden="True" area="house"/>
  <color symbol="h" value="C9A96E" name="pavimento della casa" area="house"/>
  <color symbol="w" value="E7D9B4" name="muro della casa"/>
  <color symbol="a" value="B58B5A" name="pavimento della tettoia" area="porch"/>
  <color symbol="p" value="6B4A2F" name="palo della tettoia" area="porch"/>
  <color symbol="m" value="D9C08A" name="passaggio interno" hidden="True" area="house"/>
  <color symbol="d" value="8B3A2A" name="porta della casa"/>
  <color symbol="r" value="D2BC8C" name="strada"/>
  <color symbol="s" value="9A7B5C" name="zona della scala"/>
  <color symbol="y" value="E3C14B" name="fieno" area="hay"/>
  <color symbol="c" value="B9A27A" name="aia" area="yard"/>
  <color symbol="g" value="5E8C3A" name="orto" area="garden"/>
  <color symbol="Q" value="7C7C84" name="pozzo" area="yard"/>
  <color symbol="t" value="3E7A3A" name="albero" area="orchard"/>
  <color symbol="v" value="A3472E" name="muro del fienile"/>
  <color symbol="b" value="B08A5A" name="pavimento del fienile" area="barn"/>
  <color symbol="u" value="5A2B1D" name="porta del fienile"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, a pavimento della tettoia, p palo della tettoia, d porta della casa, r strada, y fieno, c aia, g orto, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEyyyyEEEEEEEEEEE
EEEEEyyyyccccccccEEE
EEEEcwwwwwwwwwwwcEEE
EEEEcwhhsssshhhwcEEE
EpaaawhhsssshhhwcEEE
EaaaawhhhhhhhhhwcEEE
EaaaawhhhhhhhhhwcEEE
EpaaawhhhhhhhhhwcEEE
EaaaawhhhhhhhhhwcQQE
EaaaawhhhhhhhhhwcQQE
EpaaawhhhhhhhhhwcEEE
EEEEcwwwwdddwwwwcEEE
EEEEcccccrrrcccccEEE
EEEEEEEEErrrggggEEEE
EEEEEEEEErrrggggEEEE
EEEEEEEEErrrggggEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, a pavimento della tettoia, p palo della tettoia, d porta della casa, r strada, y fieno, c aia, g orto, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEyyyyEEEEEEEE
EEEEccccyyyycccccEEE
EEEEcwwwwwwwwwwwcEEE
EEEEcwhhsssshhhwaaap
EEEEcwhhsssshhhwaaaa
EEEEcwhhhhhhhhhwaaaa
EEEEcwhhhhhhhhhwaaap
EEEEcwhhhhhhhhhwaaaa
EEEEcwhhhhhhhhhwaaaa
EEQQcwhhhhhhhhhwaaap
EEQQcwhhhhhhhhhwcEEE
EEEEcwwwwdddwwwwcEEE
EEEEcccccrrrcccccEEE
EEEEEggggrrrEEEEEEEE
EEEEEggggrrrEEEEEEEE
EEEEEggggrrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, a pavimento della tettoia, p palo della tettoia, d porta della casa, r strada, y fieno, c aia, g orto, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEyyyyEEEEEE
EEEEccccccyyyycccEEE
EEEEcwwwwwwwwwwwcEEE
EpaaawhhhhhsssswcEEE
EaaaawhhhhhsssswcEEE
EaaaawhhhhhhhhhwcEEE
EpaaawhhhhhhhhhwcEEE
EaaaawhhhhhhhhhwcEEE
EaaaawhhhhhhhhhwcEEE
EpaaawhhhhhhhhhwcEEE
EEEEcwhhhhhhhhhwcEEE
EEEEcwwwwdddwwwwcEEE
EEEEcccccrrrcccccEEE
EEEEggggErrrEEEQQEEE
EEEEggggErrrEEEQQEEE
EEEEggggErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, a pavimento della tettoia, p palo della tettoia, d porta della casa, r strada, y fieno, c aia, g orto, Q pozzo, t albero, v muro del fienile, b pavimento del fienile, u porta del fienile, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEEEtEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEtEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEQQEEEEEEEEEEEEE
EEEEEEEEEEyyyyEQQEEEEEEEEEEEEE
EEEEEEEEEEyyyyccccccccEEEEEEEE
EEEEEEEEEcwwwwwwwwwwwcEEEEEEEE
EEEEEEEEEcwhhsssshhhwcEEEEEEEE
EEEEEEpaaawhhsssshhhwcvvvvvvvv
EEEEEEaaaawhhhhhhhhhwcvbbbbbbv
EEEEEEaaaawhhhhhhhhhwcvbbbbbbv
EEEEEEpaaawhhhhhhhhhwcubbbbbbv
EEEEEEaaaawhhhhhhhhhwcubbbbbbv
EEEEEEaaaawhhhhhhhhhwcubbbbbbv
EEEEEEpaaawhhhhhhhhhwcvbbbbbbv
EEEEEEEEEcwwwwdddwwwwcvbbbbbbv
EEEEEEEEEcccccrrrcccccvvvvvvvv
EEEEEEEEEEEEEErrrggggEEEEEEEEE
EEEEEEEEEEEEEErrrggggEEEEEEEEE
EEEEEEEEEEEEEErrrggggEEEEEEEEE
EEEtEEEEEEEEEErrrEEEEEEEtEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEtEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.36 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <!--
  FATTORIA. Parts: house with two storeys (h floor, w wall, H centre) 9 cells wide inside; door d in the middle of the
  front wall, road r straight to the edge; stair zone s in a back corner (side by chance), two cells of landing before it;
  lean-to a with posts p against a SIDE wall (side and place by chance); hay y against the BACK wall;
  yard c around the house; garden g and well Q beside; barn v/b/u on the side opposite the lean-to and orchard t (huge only).
  -->
  <union symbol="+" values="WGV"/>
  <union symbol="=" values="hsF"/>
  <map scale="1/5 1/5 1" values="BHEhwapmdrycgQtvbus" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">

      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one steps="1">
        <rule in="wwwwwwwwww/whhhhhhhhh/whhhhhhhhh" out="**********/***ssssss*/***ssssss*" symmetry="()"/>
        <rule in="wwwwwwwwww/hhhhhhhhhw/hhhhhhhhhw" out="**********/**ssssss**/**ssssss**" symmetry="()"/>
      </one>

      <one in="Ew/Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/**/a*/**/**/**" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="aE" out="*p" symmetry="(x)" steps="1"/>
      <all in="p/p/p/p/p/p/p" out="*/a/a/*/a/a/*" symmetry="()"/>

      <one in="EEEE/EEEE/wwww" out="yyyy/yyyy/****" symmetry="()" steps="1"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <one in="cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE"
           out="*vvvvvvvv/*vbbbbbbv/*vbbbbbbv/*ubbbbbbv/*ubbbbbbv/*ubbbbbbv/*vbbbbbbv/*vbbbbbbv/*vvvvvvvv"
           symmetry="(x)" steps="1"/>

      <one in="cccc/EEEE/EEEE/EEEE" out="****/gggg/gggg/gggg" symmetry="()" steps="1"/>

      <one in="cc/EE/EE" out="**/QQ/QQ" symmetry="(xy)" steps="1"/>

      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE"
           out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>

      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

    </sequence>

    <map scale="5 5 1" values="BEhwsaprycgQtvbuODWGLFRxjTYJenzqlZVKkoN" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="p" out="aaaaa/apppa/apppa/apppa/aaaaa"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="t" out="EEEEE/EtttE/EtttE/EtttE/EEEEE"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="u" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <sequence symmetry="(xy)">

        <!-- B. the house walls: two storeys, plaster / wooden band / plaster -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w G" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w G" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- floors, strip of the stair, slab, ceiling -->
        <all in="B h" out="x *" steps="1"/>
        <all in="B s" out="j *" steps="1"/>
        <all in="B j" out="j T" steps="1" symmetry="()"/>
        <all in="B x" out="x B" steps="31"/>
        <all in="B j" out="j B" steps="30"/>
        <prl in="j" out="x"/>
        <all in="B x" out="x F" steps="1"/>
        <all in="B x" out="x B" steps="31"/>
        <prl in="x" out="R"/>

        <!-- the lean-to: roof at 34 on posts -->
        <all in="B [ap]" out="Y *" steps="1"/>
        <all in="B Y" out="Y B" steps="33"/>
        <prl in="Y" out="J"/>
        <all in="B p" out="p e" steps="33"/>
        <prl in="p" out="e"/>

        <!-- the hay -->
        <all in="B y" out="y y" steps="10"/>

        <!-- the well -->
        <all in="B Q" out="n *" steps="1"/>
        <all in="B n" out="n z" steps="5"/>
        <prl in="n" out="Q"/>

        <!-- the trees -->
        <all in="B t" out="q *" steps="1"/>
        <all in="B q" out="q e" steps="8"/>
        <prl in="q" out="l"/>
        <all in="B l" out="l l" steps="4"/>
        <all in="lB" out="*l" steps="2"/>

        <!-- the barn: walls 40, wall above the door, roof marker from the floor -->
        <all in="B O" out="D *" steps="1"/>
        <all in="B v" out="v V" steps="40"/>
        <all in="B D" out="D V" steps="39"/>
        <all in="B b" out="Z *" steps="1"/>
        <all in="B Z" out="Z B" steps="39"/>
        <prl>
          <rule in="v" out="R"/>
          <rule in="D" out="R"/>
          <rule in="Z" out="R"/>
        </prl>

        <!-- C. windows through the whole wall, in the band -->
        <one steps="12">
          <rule in="BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB/BGGGGGB"
                out="*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL* *LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*/*LLLLL*"/>
        </one>

        <!-- roofs: eaves, then a hip roof -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- a chimney -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- the door of the house: from the road through the whole wall -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <import file="part-door"/>
        <import file="part-stair"/>

      </sequence>
    </map>
  </map>

  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7FA05A" name="terreno" hidden="True"/>
  <color symbol="H" value="C9A96E" name="centro della casa" hidden="True" area="house"/>
  <color symbol="h" value="C9A96E" name="pavimento della casa" area="house"/>
  <color symbol="w" value="E7D9B4" name="muro della casa" hidden="True"/>
  <color symbol="a" value="B58B5A" name="pavimento della tettoia" area="porch"/>
  <color symbol="p" value="6B4A2F" name="palo della tettoia" hidden="True"/>
  <color symbol="m" value="D9C08A" name="passaggio interno" hidden="True" area="house"/>
  <color symbol="d" value="8B3A2A" name="porta della casa" hidden="True"/>
  <color symbol="r" value="D2BC8C" name="strada"/>
  <color symbol="s" value="C2A068" name="pavimento della scala" area="house"/>
  <color symbol="y" value="E3C14B" name="fieno" area="hay"/>
  <color symbol="c" value="B9A27A" name="aia" area="yard"/>
  <color symbol="g" value="5E8C3A" name="orto" area="garden"/>
  <color symbol="Q" value="7C7C84" name="pozzo" area="yard"/>
  <color symbol="t" value="4A6B34" name="terra del frutteto" area="orchard"/>
  <color symbol="v" value="A3472E" name="muro del fienile" hidden="True"/>
  <color symbol="b" value="B08A5A" name="pavimento del fienile" area="barn"/>
  <color symbol="u" value="5A2B1D" name="porta del fienile" hidden="True"/>
  <color symbol="O" value="8B3A2A" name="porta"/>
  <color symbol="o" value="5A2B1D" name="assi della porta"/>
  <color symbol="N" value="4A3524" name="stipite"/>
  <color symbol="W" value="E7D9B4" name="intonaco"/>
  <color symbol="G" value="8A6A44" name="fascia di legno"/>
  <color symbol="L" value="2F4A5C" name="vetro della finestra"/>
  <color symbol="F" value="A88B62" name="solaio"/>
  <color symbol="R" value="B0432E" name="tetto"/>
  <color symbol="J" value="9C5A36" name="tetto della tettoia"/>
  <color symbol="e" value="6B4A2F" name="legno scuro"/>
  <color symbol="z" value="8E8E94" name="pietra del pozzo"/>
  <color symbol="l" value="4F8F45" name="chioma"/>
  <color symbol="V" value="C58F58" name="assi del fienile"/>
  <color symbol="K" value="7B5B4B" name="camino"/>
  <color symbol="k" value="8C6A43" name="gradini"/>
  <color symbol="T" value="000000" name="striscia della scala" hidden="True"/>
  <color symbol="x" value="000000" name="segno" hidden="True"/>
  <color symbol="j" value="000000" name="segno scala" hidden="True"/>
  <color symbol="Y" value="000000" name="segno tettoia" hidden="True"/>
  <color symbol="n" value="000000" name="segno pozzo" hidden="True"/>
  <color symbol="q" value="000000" name="segno albero" hidden="True"/>
  <color symbol="D" value="000000" name="segno fienile" hidden="True"/>
  <color symbol="Z" value="000000" name="segno tetto fienile" hidden="True"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>

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
