# model.sculpt · claude-opus-5-5 · 103 s

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
  FATTORIA: the parts of this concept and where they go
  - h  the house: a body of 9 cells around H (casa), its walls w; the door d at the front (large y), on the axis of H
  - a  the barn: a lean-to wing against one side wall, 3 cells out and 5 deep (fienile), its walls v
       (the seed picks the side, left or right, and where along that side)
  - p  the porch: in front of the door, 2 cells deep and 5 wide, under a roof on posts (portico)
  - r  the road from the porch straight to the front edge (strada)
  - y  the hay: a stack behind the house, against the back wall (fieno)
  - g  the yard: a band of farmyard around the buildings, only where 8 cells of ground go on past it (aia); x the fence around it, with the road as gate (staccionata)
  - q  the orchard: grown beyond the fence only where 12 cells of ground go on; t the trees in it (frutteto, albero)
  What the seeds change: the length of the house (5 or 6 in front of H), the side and place of the barn, so the hay and the yard follow
  What fits: Large (20) is the house, the barn, the porch and the hay; Huge (30) adds the yard and the fence; Gargantuan (40) adds the orchard with trees
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpygxqtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn on one side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <!-- the way out: from H to the front wall (door), then the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the porch in front of the door -->
      <all in="d/r" out="*/p" symmetry="()"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- the hay behind, against the back wall -->
      <one in="EEE/EEE/www" out="***/*y*/***" symmetry="()" steps="1"/>
      <!-- the yard and its fence, only where the ground goes on -->
      <all in="[wvy]EEEEEEEE" out="*gg*******" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the orchard beyond the fence, only where much ground goes on -->
      <all in="xEEEEEEEEEEEE" out="*qqqqq*******" steps="1"/>
      <all in="qE/*q" out="*q/**"/>
      <all in="qE/*x" out="*q/**"/>
      <all in="qqq/qqq/qqq" out="***/*t*/***"/>
    </sequence>
  </map>
  <color symbol="h" name="pavimento della casa" value="C8A878" area="house"/>
  <color symbol="w" name="muro della casa" value="E8DCC0"/>
  <color symbol="a" name="pavimento del fienile" value="B89060" area="barn"/>
  <color symbol="v" name="muro del fienile" value="A0402C"/>
  <color symbol="d" name="porta" value="6A4020"/>
  <color symbol="r" name="strada" value="B8A888"/>
  <color symbol="p" name="portico" value="9A7048" area="porch"/>
  <color symbol="y" name="fieno" value="E0C060"/>
  <color symbol="g" name="aia" value="A8B070" area="yard"/>
  <color symbol="x" name="staccionata" value="806040"/>
  <color symbol="q" name="frutteto" value="88A860" area="orchard"/>
  <color symbol="t" name="albero" value="4A7838"/>
  <color symbol="m" name="segno" value="FF00FF"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento della casa, w muro della casa, a pavimento del fienile, v muro del fienile, d porta, r strada, p portico, y fieno, g aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEExxxExxxEEEEEEE
EEEEEExggyggxEEEEEEE
EEEEEwwwwwwwwwwwEEEE
EEEEEwhhhhhhhhhwEEEE
EEEEEwhhhhhhhhhwxxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEEEEEEpppppEEEvvvv
EEEEEEEEpppppEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento della casa, w muro della casa, a pavimento del fienile, v muro del fienile, d porta, r strada, p portico, y fieno, g aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEExxxEEEEEEE
EEEEEEEEEExggyEEEEEE
EEEEEwwwwwwwwwwwEEEE
EEEEEwhhhhhhhhhwEEEE
EEEEEwhhhhhhhhhwxxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEEEEEEpppppEEEvvvv
EEEEEEEEpppppEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento della casa, w muro della casa, a pavimento del fienile, v muro del fienile, d porta, r strada, p portico, y fieno, g aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEExxxEEEEEE
EEEEEEEEEEExggyEEEEE
EEEEEwwwwwwwwwwwEEEE
EEEEEwhhhhhhhhhwxxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwvvvv
EEEEEEEEpppppEEEEEEE
EEEEEEEEpppppEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento della casa, w muro della casa, a pavimento del fienile, v muro del fienile, d porta, r strada, p portico, y fieno, g aia, x staccionata, q frutteto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEExxxxxxxxxxxxxxxxxxxEEEE
EEEEEEExgggggggggggggggggxEEEE
EEEEEEExgggggggggggggggggxEEEE
EEEEEEExgggggygggggggggggxEEEE
EEEEEEExggwwwwwwwwwwwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwvvvvqEEEE
EEEEEEExggwhhhhhhhhhwaaavqEEEE
EEEEEEExggwhhhhhhhhhwaaavqEEEE
EEEEEEExggwhhhhhhhhhwaaavqEEEE
EEEEEEExggwhhhhhhhhhwaaavqEEEE
EEEEEEExggwwwwdddwwwwaaavEEEEE
EEEEEEExxxEEEpppppEEEvvvvEEEEE
EEEEEEEEEEEEEpppppEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.13 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  FATTORIA: the parts of this concept and where they go
  - h  the house: a body of 9 cells around H (casa), two storeys, hip roof; walls w; door d at the front on the axis of H
  - s  the stair zone, inside the house against the back wall, with two cells of landing
  - a  the barn: a lean-to wing against one side wall (fienile), walls v, one storey, flat roof with eaves
  - p  the porch: in front of the door, a deck under a roof attached to the facade (portico)
  - r  the road from the porch to the front edge (strada)
  - y  the hay: a stack behind the house (fieno)
  - g  the yard and x its fence, only where the ground goes on (aia, staccionata)
  - q  the orchard beyond the fence, t its trees (frutteto, albero)
  Seeds: the house length, the side and place of the barn, the hay; Large: house, barn, porch, hay; Huge: yard and fence; Gargantuan: orchard
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpygxqtms" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="d/r" out="*/p" symmetry="()"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <one in="EEE/EEE/www" out="***/*y*/***" symmetry="()" steps="1"/>
      <all in="[wvy]EEEEEEEE" out="*gg*******" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xEEEEEEEEEEEE" out="*qqqqq*******" steps="1"/>
      <all in="qE/*q" out="*q/**"/>
      <all in="qE/*x" out="*q/**"/>
      <all in="qqq/qqq/qqq" out="***/*t*/***"/>
    </sequence>
    <map scale="5 5 1" values="BEhfFwWULRsTadOAvVPpjJyYrgxXqZzQKoNk" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="t" out="qqqqq/qqqqq/qqZqq/qqqqq/qqqqq"/>
      <sequence symmetry="(xy)">
        <!-- house walls -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>
        <!-- house floors -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn -->
        <all in="B v" out="v V" steps="32"/><prl in="v" out="P"/>
        <all in="B a" out="a A" steps="1"/><all in="B a" out="a B" steps="31"/><prl in="a" out="P"/>
        <!-- porch -->
        <all in="B j" out="j p" steps="1"/><all in="B j" out="j B" steps="33"/><prl in="j" out="J"/>
        <!-- hay, fence, trees -->
        <all in="B y" out="y Y" steps="18"/><prl in="y" out="Y"/>
        <all in="B x" out="x X" steps="7"/><prl in="x" out="X"/>
        <all in="B Z" out="Z z" steps="14"/><prl in="Z" out="Q"/>
        <all in="QB" out="*Q" steps="2"/><all in="B Q" out="Q *" steps="3"/>
        <!-- windows -->
        <one steps="16"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="PB" out="*P" steps="1"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="5"/>
        <!-- parts -->
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="f" name="pavimento della casa" value="C8A878" area="house"/>
  <color symbol="F" name="solaio" value="A88858"/>
  <color symbol="W" name="intonaco" value="E8DCC0"/>
  <color symbol="L" name="vetro" value="7AA8C8"/>
  <color symbol="R" name="tetto di coppi" value="B04A30"/>
  <color symbol="K" name="camino" value="8A8078"/>
  <color symbol="A" name="pavimento del fienile" value="B89060" area="barn"/>
  <color symbol="V" name="tavole del fienile" value="A0402C"/>
  <color symbol="P" name="tetto del fienile" value="6A6460"/>
  <color symbol="p" name="assito del portico" value="9A7048" area="porch"/>
  <color symbol="J" name="tettoia" value="7A5030"/>
  <color symbol="Y" name="fieno" value="E0C060"/>
  <color symbol="r" name="strada" value="B8A888"/>
  <color symbol="g" name="aia" value="A8B070" area="yard"/>
  <color symbol="X" name="staccionata" value="806040"/>
  <color symbol="q" name="frutteto" value="88A860" area="orchard"/>
  <color symbol="z" name="tronco" value="5A3A20"/>
  <color symbol="Q" name="chioma" value="4A7838"/>
  <color symbol="O" name="porta" value="6A4020"/>
  <color symbol="o" name="assi della porta" value="402810"/>
  <color symbol="N" name="stipite" value="3A3028"/>
  <color symbol="k" name="gradini" value="8A6A48"/>
  <color symbol="T" name="segno" hidden="True"/>
  <color symbol="#20" name="porta aperta" hidden="True"/>
  <color symbol="#21" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
