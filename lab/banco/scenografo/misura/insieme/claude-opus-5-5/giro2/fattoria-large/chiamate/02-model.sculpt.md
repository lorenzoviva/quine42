# model.sculpt · claude-opus-5-5 · 215 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
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
  FATTORIA: the parts and where they go
  - Casa (h floor, w walls, H centre): the main body around the centre. It is 9 wide and 9-10 deep, the depth chosen by the seed. It holds 2 storeys, with the stair zone s along the back wall.
  - Stalla / fienile (a floor, v walls): a lower wing set against a side wall of the house. The seed picks the side and the position along it. It is 3 deep, which is the size of a lean-to.
  - Porta (d) and strada (r): the door is on the front axis and 3 cells wide. The road runs straight from it to the edge.
  - Aia (g): a ring of beaten earth one cell wide around house and stable.
  - Staccionata (x): a fence around the yard, only where the ground goes on past it (at Huge and larger).
  - Covone (Y): a haystack placed far from the road, behind the house, where 3 x 3 of free ground fits.
  - Campi (c): fields grown where 7 x 7 of free ground remains.
  - Alberi (t): trees grown where 7 x 7 of free ground remains.
  What the seeds change: the depth of the house, the side and position of the stable, and where the hay, trees and fields go.
  What fits at each size:
  - Large: the house with its lean-to stable, the yard and the hay behind.
  - Huge: adds the fence, the fields and the trees.
  - Gargantuan: adds many more fields and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrsgxYct" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- house body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- stable wing against a side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- yard ring, then a fence only where the ground goes on past it -->
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- door on the front axis, then the road straight to the edge -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="d/d" symmetry="()"/>
      <all in="d/w" out="*/r" symmetry="()" steps="1"/>
      <prl in="d" out="h"/>
      <all in="h/r" out="*/d" symmetry="()"/>
      <all in="[dr]/[Egx]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Egx]" out="*r" symmetry="(x)" steps="1"/>
      <!-- haystack far from the road -->
      <one in="EEE/EEE/EEE" out="***/*Y*/***" steps="1"><field for="Y" from="r" on="Egrx"/></one>
      <!-- fields, then trees, in free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terreno"/>
  <color symbol="H" value="C8A060" name="centro casa" area="house"/>
  <color symbol="h" value="B08850" name="pavimento casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro casa" area="house"/>
  <color symbol="s" value="8A6038" name="zona scala" area="house"/>
  <color symbol="a" value="A07A48" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="9C5A3C" name="muro stalla" area="barn"/>
  <color symbol="d" value="5A3820" name="porta" area="house"/>
  <color symbol="r" value="BFA678" name="strada" area="road"/>
  <color symbol="g" value="CDB98A" name="aia" area="yard"/>
  <color symbol="x" value="7A5A38" name="staccionata" area="yard"/>
  <color symbol="Y" value="E0C050" name="covone" area="yard"/>
  <color symbol="c" value="9AB060" name="campo" area="field"/>
  <color symbol="t" value="5E8A40" name="albero" area="orchard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro casa, E terreno, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, d porta, r strada, s zona scala, g aia, x staccionata, Y covone
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEYE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxx
EEEEgggggggggggggggg
EEEEgwwwwwwwwwwwgggg
EEEEgwhhsssshhhwgggg
EEEEgwhhsssshhhwgggg
EEEEgwhhhhhhhhhwgggg
EEEEgwhhhhHhhhhwgggg
EEEEgwhhhhhhhhhwvvvv
EEEEgwhhhhhhhhhwaaav
EEEEgwhhhhhhhhhwaaav
EEEEgwhhhhhhhhhwaaav
EEEEgwhhhhhhhhhwaaav
EEEEgwwwwdddwwwwaaav
EEEEgggggrrrggggvvvv
EEEEgggggrrrgggggggg
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro casa, E terreno, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, d porta, r strada, s zona scala, g aia, x staccionata, Y covone
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEYE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxx
EEEEgggggggggggggggg
EEEEgwwwwwwwwwwwvvvv
EEEEgwhhsssshhhwaaav
EEEEgwhhsssshhhwaaav
EEEEgwhhhhhhhhhwaaav
EEEEgwhhhhHhhhhwaaav
EEEEgwhhhhhhhhhwaaav
EEEEgwhhhhhhhhhwvvvv
EEEEgwhhhhhhhhhwgggg
EEEEgwhhhhhhhhhwgggg
EEEEgwhhhhhhhhhwgggg
EEEEgwwwwdddwwwwgggg
EEEEgggggrrrgggggggg
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro casa, E terreno, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, d porta, r strada, s zona scala, g aia, Y covone
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEYEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
gggggggggggggggggEEE
gvvvvggggggggggggEEE
gvaaawwwwwwwwwwwgEEE
gvaaawhhsssshhhwgEEE
gvaaawhhsssshhhwgEEE
gvaaawhhhhhhhhhwgEEE
gvaaawhhhhHhhhhwgEEE
gvvvvwhhhhhhhhhwgEEE
gggggwhhhhhhhhhwgEEE
gggggwhhhhhhhhhwgEEE
gggggwhhhhhhhhhwgEEE
gggggwhhhhhhhhhwgEEE
gggggwwwwdddwwwwgEEE
gggggggggrrrgggggEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro casa, E terreno, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, d porta, r strada, s zona scala, g aia, x staccionata, Y covone, c campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEcccccEEEEEEEYEEEEEEEEEE
EEEEEEEcccccEcccccEEEEEEEEEEEE
EcccccEcccccEcccccEcccccEEEEEE
EcccccEcccccEcccccEcccccEEEEEE
EcccccEcccccEcccccEcccccEEEEEE
EcccccEEEEEEEcccccEcccccEEEEEE
EcccccEEEEEEEEEEEEEcccccEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEExxxxxxxxxxxxxxxxxxEEEE
EEEEEEEExgggggggggggggggggEEEE
EEEEEEEExgwwwwwwwwwwwgggggEEEE
EEEEEEEExgwhhsssshhhwgggggEEEE
EcccccEExgwhhsssshhhwgggggEEEE
EcccccEExgwhhhhhhhhhwgggggEEEE
EcccccEExgwhhhhHhhhhwgggggEEEE
EcccccEExgwhhhhhhhhhwvvvvgEEEE
EcccccEExgwhhhhhhhhhwaaavgEEEE
EEEEEEEExgwhhhhhhhhhwaaavgEEEE
EEEEEEEExgwhhhhhhhhhwaaavgEEEE
EEcccccExgwhhhhhhhhhwaaavgEEEE
EEcccccExgwwwwdddwwwwaaavgEEEE
EEcccccExgggggrrrggggvvvvgEEEE
EEcccccExgggggrrrgggggggggEEEE
EEcccccExxxxxxrrrxxxxxxxxxEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.38 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  FATTORIA: the parts and where they go
  - Casa (h floor, w walls, H centre): the main body around the centre.
    It is 9 wide and 9-10 deep, the depth chosen by the seed.
    It has two storeys, with the stair zone s against the back wall.
  - Furniture, placed on the plan against the walls:
    - z, in the front-left corner: the hearth, with a bed above it.
    - b, in the front-right corner: barrels, with a chest above them.
    - m, on the right wall at the centre: a table, with shelves above it.
    - n, on the left wall at the centre: a bench, with a bed above it.
  - Stalla (a floor, v walls): a lower wing set against one side wall of the house.
    The seed picks the side and the position.
    Mangers (p) with hay stand against its outer end wall.
  - Porta (d) and strada (r): the door is on the front axis and 3 cells wide.
    The road runs straight from it to the edge.
  - Aia (g): a ring of beaten earth around the house and the stable.
  - Staccionata (x): a fence around the yard, only where the ground goes on past it.
  - Covone (Y): a haystack, placed far from the road.
  - Campi (c) and alberi (t): placed where the free ground allows.
  - Large: house, stable, yard and haystack.
  - Huge: adds the fence, the fields and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="=" values="fF"/>
  <union symbol="+" values="WU"/>
  <map scale="1/5 1/5 1" values="BHEhwavdrsgxYctzbmnp" symmetry="()">
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
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="d/d" symmetry="()"/>
      <all in="d/w" out="*/r" symmetry="()" steps="1"/>
      <prl in="d" out="h"/>
      <all in="h/r" out="*/d" symmetry="()"/>
      <all in="[dr]/[Egx]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Egx]" out="*r" symmetry="(x)" steps="1"/>
      <all in="wh/ww" out="*z/**" symmetry="()"/>
      <all in="hw/ww" out="b*/**" symmetry="()"/>
      <all in="whhhhH" out="*n****" symmetry="()"/>
      <all in="Hhhhhw" out="****m*" symmetry="()"/>
      <all in="av" out="p*" symmetry="(x)"/>
      <one in="EEE/EEE/EEE" out="***/*Y*/***" steps="1"><field for="Y" from="r" on="Egrx"/></one>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEfFWULROoNTkKAVJIyQPGjlieGgrcCXDZYhswqzbmnavpxt#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="ggggg/ggggg/ggxgg/ggggg/ggggg"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="c" out="ccccc/CCCCC/ccccc/CCCCC/ccccc"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- house walls, door seed -->
        <all steps="1" symmetry="()"><rule in="B w" out="w W"/><rule in="B q" out="q O"/></all>
        <prl in="q" out="w"/>
        <all in="B w" out="w W" steps="5" symmetry="()"/><all in="B w" out="w U" steps="14" symmetry="()"/><all in="B w" out="w W" steps="12" symmetry="()"/>
        <all in="B w" out="w W" steps="6" symmetry="()"/><all in="B w" out="w U" steps="14" symmetry="()"/><all in="B w" out="w W" steps="12" symmetry="()"/>
        <prl in="w" out="R"/>
        <!-- house floors, stair strip, slab -->
        <all steps="1" symmetry="()"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B z" out="z f"/><rule in="B b" out="b f"/><rule in="B m" out="m f"/><rule in="B n" out="n f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31" symmetry="()"/><all in="B s" out="s B" steps="30" symmetry="()"/>
        <all in="B z" out="z Q" steps="10" symmetry="()"/><all in="B z" out="z B" steps="21" symmetry="()"/>
        <all in="B b" out="b P" steps="8" symmetry="()"/><all in="B b" out="b B" steps="23" symmetry="()"/>
        <all in="B m" out="m G" steps="7" symmetry="()"/><all in="B m" out="m B" steps="24" symmetry="()"/>
        <all in="B n" out="n j" steps="5" symmetry="()"/><all in="B n" out="n B" steps="26" symmetry="()"/>
        <all steps="1" symmetry="()"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B z" out="z F"/><rule in="B b" out="b F"/><rule in="B m" out="m F"/><rule in="B n" out="n F"/></all>
        <all steps="31" symmetry="()"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all in="B z" out="z l" steps="6" symmetry="()"/><all in="B z" out="z B" steps="25" symmetry="()"/>
        <all in="B b" out="b i" steps="7" symmetry="()"/><all in="B b" out="b B" steps="24" symmetry="()"/>
        <all in="B m" out="m e" steps="14" symmetry="()"/><all in="B m" out="m B" steps="17" symmetry="()"/>
        <all in="B n" out="n l" steps="6" symmetry="()"/><all in="B n" out="n B" steps="25" symmetry="()"/>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="z" out="R"/><rule in="b" out="R"/><rule in="m" out="R"/><rule in="n" out="R"/></prl>
        <!-- stable -->
        <all in="B v" out="v V" steps="36" symmetry="()"/>
        <all steps="1" symmetry="()"><rule in="B a" out="a A"/><rule in="B p" out="p A"/></all>
        <all in="B a" out="a B" steps="35" symmetry="()"/>
        <all in="B p" out="p I" steps="6" symmetry="()"/><all in="B p" out="p y" steps="3" symmetry="()"/><all in="B p" out="p B" steps="26" symmetry="()"/>
        <prl><rule in="v" out="J"/><rule in="a" out="J"/><rule in="p" out="J"/></prl>
        <!-- yard things -->
        <all in="B x" out="x X" steps="10" symmetry="()"/><prl in="x" out="X"/>
        <all in="XBBBBX" out="*XXXX*"/>
        <all in="B Y" out="Y *" steps="9" symmetry="()"/>
        <all in="B C" out="C *" steps="3" symmetry="()"/>
        <all in="B t" out="t D" steps="14" symmetry="()"/><prl in="t" out="Z"/>
        <all in="ZB" out="*Z" steps="3"/>
        <all in="B Z" out="Z *" steps="4" symmetry="()"/>
        <!-- parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terreno"/>
  <color symbol="H" hidden="True" name="centro casa"/>
  <color symbol="h" hidden="True" name="segno casa"/>
  <color symbol="s" hidden="True" name="segno scala"/>
  <color symbol="w" hidden="True" name="segno muro"/>
  <color symbol="q" hidden="True" name="segno porta"/>
  <color symbol="z" hidden="True" name="segno focolare"/>
  <color symbol="b" hidden="True" name="segno botti"/>
  <color symbol="m" hidden="True" name="segno tavolo"/>
  <color symbol="n" hidden="True" name="segno panca"/>
  <color symbol="a" hidden="True" name="segno stalla"/>
  <color symbol="v" hidden="True" name="segno muro stalla"/>
  <color symbol="p" hidden="True" name="segno mangiatoia"/>
  <color symbol="x" hidden="True" name="segno palo"/>
  <color symbol="t" hidden="True" name="segno albero"/>
  <color symbol="d" value="5A3820" name="porta"/>
  <color symbol="f" value="B08850" name="pavimento casa" area="house"/>
  <color symbol="F" value="8A6A44" name="solaio"/>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="U" value="E8DCC0" name="intonaco"/>
  <color symbol="L" value="6A90B0" name="finestra"/>
  <color symbol="R" value="B04A30" name="tegole"/>
  <color symbol="K" value="7A7068" name="comignolo"/>
  <color symbol="O" value="6A4426" name="porta"/>
  <color symbol="o" value="3E2614" name="assi porta"/>
  <color symbol="N" value="4A4038" name="stipiti"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>
  <color symbol="T" value="8A6038" name="scala"/>
  <color symbol="k" value="9A7048" name="gradini"/>
  <color symbol="A" value="A07A48" name="pavimento stalla" area="barn"/>
  <color symbol="V" value="8C5034" name="tavole stalla"/>
  <color symbol="J" value="C8A850" name="tetto di paglia"/>
  <color symbol="I" value="6E4E2E" name="arredo mangiatoia"/>
  <color symbol="y" value="E6CC6A" name="arredo fieno"/>
  <color symbol="Q" value="8E8A84" name="arredo focolare"/>
  <color symbol="P" value="7A4A28" name="arredo botti"/>
  <color symbol="G" value="9A6A3A" name="arredo tavolo"/>
  <color symbol="j" value="7E5A36" name="arredo panca"/>
  <color symbol="l" value="C05050" name="arredo letto"/>
  <color symbol="i" value="5E3A20" name="arredo cassapanca"/>
  <color symbol="e" value="A88058" name="arredo scaffale"/>
  <color symbol="g" value="CDB98A" name="aia" area="yard"/>
  <color symbol="r" value="BFA678" name="strada" area="road"/>
  <color symbol="c" value="8A7040" name="campo" area="field"/>
  <color symbol="C" value="A8B858" name="grano" area="field"/>
  <color symbol="X" value="6E5030" name="staccionata"/>
  <color symbol="D" value="5A3A22" name="tronco"/>
  <color symbol="Z" value="5E8A40" name="chioma"/>
  <color symbol="Y" value="E0C050" name="covone" area="yard"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
