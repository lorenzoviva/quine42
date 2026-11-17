# model.sculpt · claude-opus-5-5 · 235 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
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
  VILLETTA: a country house of two storeys with a lower wing and, where the ground allows it, a porch, a garden, a hedge and trees.
  Parts (plan letters):
    H  the centre (becomes floor h at the end)
    h  the floor of the main body (9 wide, 9-10 deep around H), w its wall, one cell thick
    s  the zone of the stair: against the back wall, two cells of landing from the side wall, 4 long and 2 wide
    a  the floor of the wing (3 out, 5 deep) on one side wall, v its wall
    d  the door: front wall, on the axis of H, 3 cells wide
    r  the path: from the door straight to the front edge, 3 cells wide
    p  the porch: in front of the front wall, only where 5 cells of ground go on (4 deep)
    g  the garden lawn: rings around the house only where 7 cells of ground go on
    x  the hedge around the garden, cut by the path
    t  the trees: on 5 x 5 of lawn
  Seeds change: the depth of the body (one more cell), the side and the place of the wing, where the trees fall.
  Large (5 x 5): the house, its wing and the path. Huge (7.5): also the porch, the garden, the hedge and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrpgxtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the main body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the wing on one side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the way in: from H to the front wall (door), then the path to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the porch: only where the ground goes on 5 cells in front of the front wall -->
      <all in="w/E/E/E/E/E" out="*/p/*/*/*/*" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <!-- the garden: rings only where 7 cells of ground go on past it -->
      <all in="[wvpg]EEEEEEE" out="*g******" steps="3"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- the hedge around the garden -->
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- trees on the lawn -->
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="ff00ff" name="centro"/>
  <color symbol="h" value="b08a5a" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="s" value="7a5230" name="scala"/>
  <color symbol="a" value="a07850" name="pavimento ala" area="house"/>
  <color symbol="v" value="d8c8a0" name="muro ala"/>
  <color symbol="d" value="5a3a20" name="porta"/>
  <color symbol="r" value="c8b890" name="vialetto" area="path"/>
  <color symbol="p" value="9a6a40" name="portico" area="porch"/>
  <color symbol="g" value="8ab060" name="prato" area="garden"/>
  <color symbol="x" value="4a7a3a" name="siepe"/>
  <color symbol="t" value="3a6a30" name="albero"/>
  <color symbol="m" value="ff8800" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, s scala, a pavimento ala, v muro ala, d porta, r vialetto, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEwwwwwwwwwwwEEEE
EEEEEwhhsssshhhwxxxx
EEEEEwhhsssshhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEEEEEEErrrEEEEvvvv
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, s scala, a pavimento ala, v muro ala, d porta, r vialetto, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEwwwwwwwwwwwEEEE
EEEEEwhhsssshhhwxxxx
EEEEEwhhsssshhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEEEEEEErrrEEEEvvvv
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, s scala, a pavimento ala, v muro ala, d porta, r vialetto, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEwwwwwwwwwwwxxxx
EEEEEwhhsssshhhwgggg
EEEEEwhhsssshhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwvvvv
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, s scala, a pavimento ala, v muro ala, d porta, r vialetto, p portico, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxxxxxxxxxxxxxxxxEEEE
EEEEEExggggggggggggggggggxEEEE
EEEEEExggggggggggggggggggxEEEE
EEEEEExggggggggggggggggggxEEEE
EEEEEExgggwwwwwwwwwwwggggxEEEE
EEEEEExgggwhhsssshhhwggggxEEEE
EEEEEExgggwhhsssshhhwggggxEEEE
EEEEEExgggwhhhhhhhhhwggggxEEEE
EEEEEExgggwhhhhhhhhhwggggxEEEE
EEEEEExgggwhhhhhhhhhwvvvvEEEEE
EEEEEExgggwhhhhhhhhhwaaavEEEEE
EEEEEExgggwhhhhhhhhhwaaavEEEEE
EEEEEExgggwhhhhhhhhhwaaavEEEEE
EEEEEExgggwhhhhhhhhhwaaavEEEEE
EEEEEExgggwwwwdddwwwwaaavEEEEE
EEEEEExgggpppprrrppppvvvvEEEEE
EEEEEExgggpppprrrppppggggxEEEE
EEEEEExgggpppprrrppppggggxEEEE
EEEEEExgggpppprrrppppggggxEEEE
EEEEEExxxxEEEErrrEEEExxxxxEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.08 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  VILLETTA: a country house of two storeys with a lower wing on one side. Where the ground allows, it also has a porch on the front, a garden, a hedge and trees.
  Plan letters:
    H centre (becomes h); h floor of the main body; w its wall; s stair zone (back wall, two cells of landing)
    a floor of the wing (one storey, on a side chosen by the seed); v its wall; i the inner door from the body to the wing
    d front door on the axis; r path to the front edge; p porch (only where 5 cells of ground go on); P its posts; n path under the porch
    g lawn; x hedge; t trees (only where the ground goes on)
    q chest below / bed above (front corners); u table (back corner on the right); z barrels in the wing
  Large: house, wing, path. Huge: also porch, garden, hedge, trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrpgxtmqPnuzi" symmetry="()">
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
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="wh/ww" out="*q/**" symmetry="(x)"/>
      <one in="ww/hw" out="**/u*" symmetry="()" steps="1"/>
      <all in="vv/av" out="**/z*" symmetry="(x)"/>
      <one in="hwa/hwa/hwa" out="*i*/*i*/*i*" symmetry="(x)" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="w/E/E/E/E/E" out="*/p/*/*/*/*" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="[wvpg]EEEEEEE" out="*g******" steps="3"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
      <all in="p/E" out="P/*" symmetry="()"/>
      <prl in="PPP" out="*p*" symmetry="(x)"/>
      <all in="[pPn]r" out="*n" symmetry="(x)"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsavdrpgxqPnuzifFWURLOoNkTVebyJKCQlcj#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ggggg/gQQQg/gQQQg/gQQQg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <sequence symmetry="(xy)">
        <!-- B: walls of the main body, 64 -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="63"/><prl in="d" out="R"/>
        <all in="B i" out="i O" steps="1"/><all in="B i" out="i W" steps="63"/><prl in="i" out="R"/>
        <!-- wing walls, 32 -->
        <all in="B v" out="v V" steps="32"/><prl in="v" out="R"/>
        <!-- floors -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B q" out="q f"/><rule in="B u" out="u f"/><rule in="B a" out="a f"/><rule in="B z" out="z f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B q" out="q e" steps="8"/>
        <all in="B u" out="u c" steps="6"/>
        <all in="B z" out="z j" steps="10"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all in="B q" out="q B" steps="23"/><all in="B u" out="u B" steps="25"/>
        <all in="B a" out="a B" steps="31"/><all in="B z" out="z B" steps="21"/>
        <prl><rule in="a" out="R"/><rule in="z" out="R"/></prl>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B q" out="q F"/><rule in="B u" out="u F"/></all>
        <all in="B q" out="q l" steps="6"/>
        <all steps="25"><rule in="B q" out="q B"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B u" out="u B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="q" out="R"/><rule in="u" out="R"/></prl>
        <!-- porch -->
        <all in="B b" out="b *" steps="33"/>
        <all steps="1"><rule in="B p" out="y *"/><rule in="B n" out="y *"/></all>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B b" out="J *" steps="1"/>
        <!-- hedge and trees -->
        <all in="B x" out="x *" steps="7"/>
        <all in="B Q" out="Q *" steps="14"/>
        <all in="B Q" out="C *" steps="1"/>
        <all in="B C" out="C *" steps="10"/>
        <all in="CB" out="*C" steps="4"/>
        <!-- C: parts -->
        <union symbol="+" values="WVR"/>
        <union symbol="=" values="fF"/>
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
        <all in="B K" out="K *" steps="6"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="T" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="f" value="b08a5a" name="pavimento in assi" area="house"/>
  <color symbol="F" value="8a6a44" name="solaio"/>
  <color symbol="W" value="e8dcc0" name="muro intonacato"/>
  <color symbol="V" value="9a7048" name="muro di tavole"/>
  <color symbol="R" value="b04a30" name="tetto di coppi"/>
  <color symbol="L" value="7aa6c8" name="vetro della finestra"/>
  <color symbol="O" value="6a4224" name="porta"/>
  <color symbol="o" value="3e2614" name="assi della porta"/>
  <color symbol="N" value="5a5650" name="stipite di pietra"/>
  <color symbol="k" value="7a5230" name="gradini"/>
  <color symbol="K" value="8a8478" name="camino"/>
  <color symbol="e" value="6e4a2a" name="arredo cassapanca"/>
  <color symbol="l" value="c8a070" name="arredo letto"/>
  <color symbol="c" value="94643a" name="arredo tavolo"/>
  <color symbol="j" value="5e3c20" name="arredo botte"/>
  <color symbol="p" value="a8805a" name="pavimento del portico" area="porch"/>
  <color symbol="n" value="b8a888" name="vialetto coperto" area="porch"/>
  <color symbol="b" value="4e3420" name="palo del portico"/>
  <color symbol="J" value="8a3a28" name="tettoia"/>
  <color symbol="r" value="c8b890" name="vialetto" area="path"/>
  <color symbol="g" value="8ab060" name="prato" area="garden"/>
  <color symbol="x" value="4a7a3a" name="siepe"/>
  <color symbol="Q" value="5a3a22" name="tronco"/>
  <color symbol="C" value="5a9040" name="chioma"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
