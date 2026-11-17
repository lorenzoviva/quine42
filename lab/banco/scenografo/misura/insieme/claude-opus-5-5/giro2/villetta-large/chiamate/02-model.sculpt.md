# model.sculpt · claude-opus-5-5 · 201 s

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
villetta: una casa di campagna piccola.
Parti: corpo principale h (stanze, due piani) con muri w; ala laterale a con muri v, contro un fianco scelto a caso;
porta d al centro della facciata davanti (y grande); portico p davanti alla porta; vialetto r fino al bordo;
zona della scala s lungo un muro interno del corpo; giardino g attorno alla casa; siepe x dove il terreno continua;
alberi t sul prato libero.
I semi cambiano: profondità del corpo (5 o 6 davanti), lato e posizione dell'ala, posto della scala, alberi.
Large (5x5): casa, ala, portico, giardino stretto. Huge (7.5): in più la siepe attorno al giardino e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdprsgxt" symmetry="()">
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
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="p/E" out="*/r" symmetry="()"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="[wvpg]E" out="*g" steps="2"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/gx" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="h" rgb="#C8A878" name="pavimento casa" area="house"/>
  <color symbol="w" rgb="#E8DCC0" name="muro casa"/>
  <color symbol="a" rgb="#B89868" name="pavimento ala" area="house"/>
  <color symbol="v" rgb="#D8C8A0" name="muro ala"/>
  <color symbol="d" rgb="#6B4528" name="porta"/>
  <color symbol="p" rgb="#A07850" name="portico" area="porch"/>
  <color symbol="r" rgb="#B8A890" name="vialetto"/>
  <color symbol="s" rgb="#806040" name="scala"/>
  <color symbol="g" rgb="#8FB060" name="giardino" area="garden"/>
  <color symbol="x" rgb="#4F7A38" name="siepe"/>
  <color symbol="t" rgb="#3F6A30" name="albero"/>
  <color symbol="m" rgb="#FF00FF" name="segno" hidden="True"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento casa, w muro casa, a pavimento ala, v muro ala, d porta, p portico, r vialetto, s scala, g giardino, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxgggggggggggxxEE
EEExgggggggggggggxEE
EEEggwwwwwwwwwwwggEE
EEEggwhhsssshhhwggEE
EEEggwhhsssshhhwggxx
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwvvvv
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwwwwdddwwwwaaav
EEEEgggpppppppggvvvv
EEEExggrrrrrrrgggggg
EEEEEEEEEEEEEEExgggg
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento casa, w muro casa, a pavimento ala, v muro ala, d porta, p portico, r vialetto, s scala, g giardino, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxgggggggggggxxEE
EEExgggggggggggggxEE
EEEggwwwwwwwwwwwggEE
EEEggwhhsssshhhwggEE
EEEggwhhsssshhhwggxx
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwvvvv
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwwwwdddwwwwaaav
EEEEgggpppppppggvvvv
EEEExggrrrrrrrgggggg
EEEEEEEEEEEEEEExgggg
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento casa, w muro casa, a pavimento ala, v muro ala, d porta, p portico, r vialetto, s scala, g giardino, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxgggggggggggxxEE
EEExgggggggggggggxEE
EEEggwwwwwwwwwwwggEE
EEEggwhhsssshhhwggxx
EEEggwhhsssshhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwvvvv
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwwwwdddwwwwvvvv
EEEEgggpppppppgggggg
EEEExggrrrrrrrgggggg
EEEEEEEEEEEEEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento casa, w muro casa, a pavimento ala, v muro ala, d porta, p portico, r vialetto, s scala, g giardino, x siepe, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtEEEEtEEEEtEEEEEEEEEtEEEE
EEEEEEEEEEEEEEEEEEEEEtEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEExxxxxxxxxxxxxxxxxxxxEEE
EEEEEEExxxgggggggggggxxxxxxEEE
EEEEEEExxgggggggggggggxxxxxEEE
EEEEEEExggwwwwwwwwwwwggxxxxEEE
EEEtEEExggwhhsssshhhwggxxxxEEE
EEEEEEExggwhhsssshhhwggxxxxEEE
EEEEEEExggwhhhhhhhhhwggggxxEEE
EEEEEEExggwhhhhhhhhhwgggggxEEE
EEEtEEExggwhhhhhhhhhwvvvvggEEE
EEEEEEExggwhhhhhhhhhwaaavggEEE
EEEEEEExggwhhhhhhhhhwaaavggEEE
EEEEEEExggwhhhhhhhhhwaaavggEEE
EEEtEEExggwhhhhhhhhhwaaavggEEE
EEEEEEExggwwwwdddwwwwaaavggEEE
EEEEEEExxgggpppppppggvvvvggEEE
EEEEEEExxxggrrrrrrrgggggggxEEE
EEEEEEExxxxxEEEEEEExxggggxxEEE
EEEtEEEEEEEEEEEEEEExxxxxxxxEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.06 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
villetta: una casa di campagna a due piani con un'ala bassa, un portico e il giardino.
Parti: corpo principale h (due piani, muri w) attorno al centro; ala a (un piano, muri v) contro un fianco scelto a caso,
in un punto a caso; porta d al centro della facciata davanti; portico p con due pali j davanti alla porta; vialetto r fino al bordo;
zona della scala s lungo il muro di fondo, a due celle dal muro sinistro; arredi u i l (casa) e o (ala) contro i muri,
fuori dalla via dritta porta-scala; giardino g attorno; siepe x dove il terreno continua; alberi t sul prato libero.
I semi cambiano: profondita' del corpo, lato, posto e lunghezza dell'ala, posto degli arredi, alberi.
Large: casa, ala, portico, giardino. Huge: in piu' la siepe chiusa e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdprsgxtmjuilo" symmetry="()">
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
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dp]/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="[pr]/E" out="*/r" symmetry="()"/>
      <all in="p[E]" out="j*" symmetry="(x)"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="wh/ww" out="*u/**" symmetry="()" steps="1"/>
      <one in="hw/ww" out="i*/**" symmetry="()" steps="1"/>
      <one in="hw/hw/hw/hw/hw" out="**/**/l*/**/**" symmetry="()" steps="1"/>
      <one in="a/v" out="o/*" symmetry="()" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="[wvpgj]E" out="*g" steps="2"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/gx" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEHhwecnlyOWURfFTkLvVaPQzJjrgxqCADZXYbKNo" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="j" out="PPPPP/PQQQP/PQQQP/PQQQP/PPPPP"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EqqqE/EqqqE/EqqqE/EEEEE"/>
      <rule in="u" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="i" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="o" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="1"/>
        <all in="B O" out="e *"/>
        <all in="B v" out="v V" steps="1"/>
        <all steps="5"><rule in="B w" out="w W"/><rule in="B e" out="e W"/><rule in="B v" out="v V"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B e" out="e W"/><rule in="B v" out="v U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B e" out="e W"/><rule in="B v" out="v V"/></all>
        <all in="B v" out="v V" steps="1"/>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B e" out="e W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B e" out="e W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B e" out="e W"/></all>
        <prl><rule in="w" out="R"/><rule in="e" out="R"/><rule in="v" out="R"/></prl>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B c" out="c f"/><rule in="B n" out="n f"/><rule in="B l" out="l f"/><rule in="B a" out="a f"/><rule in="B y" out="y f"/></all>
        <all steps="1"><rule in="B h" out="h B"/><rule in="B s" out="s T"/><rule in="B c" out="c A"/><rule in="B n" out="n Z"/><rule in="B l" out="l Y"/><rule in="B a" out="a B"/><rule in="B y" out="y K"/></all>
        <all steps="30"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B c" out="c B"/><rule in="B n" out="n B"/><rule in="B l" out="l B"/><rule in="B a" out="a B"/><rule in="B y" out="y B"/></all>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B c" out="c F"/><rule in="B n" out="n F"/><rule in="B l" out="l F"/><rule in="B a" out="a B"/><rule in="B y" out="y B"/></all>
        <prl><rule in="a" out="R"/><rule in="y" out="R"/></prl>
        <all steps="1"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B c" out="c D"/><rule in="B n" out="n X"/><rule in="B l" out="l b"/></all>
        <all steps="30"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B c" out="c B"/><rule in="B n" out="n B"/><rule in="B l" out="l B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="c" out="R"/><rule in="n" out="R"/><rule in="l" out="R"/></prl>
        <all in="B Q" out="z *" steps="1"/>
        <all in="B z" out="z Q" steps="33"/>
        <all in="B P" out="j *" steps="1"/>
        <all in="B j" out="j B" steps="33"/>
        <prl><rule in="j" out="J"/><rule in="z" out="J"/></prl>
        <all in="B x" out="x *" steps="8"/>
        <all in="B q" out="q *" steps="14"/>
        <all in="B q" out="C *" steps="1"/>
        <all in="BC" out="*C" steps="3"/>
        <all in="B C" out="C *" steps="6"/>
        <all steps="7"><rule in="B A" out="A *"/><rule in="B Z" out="Z *"/><rule in="B Y" out="Y *"/><rule in="B K" out="K *"/><rule in="B D" out="D *"/><rule in="B X" out="X *"/><rule in="B b" out="b *"/></all>
        <import file="part-stair"/>
        <import file="part-door"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="WUVR"/>
  <union symbol="=" values="fF"/>
  <color symbol="E" rgb="#7FA050" name="prato" hidden="True"/>
  <color symbol="h" rgb="#C8A878" name="pavimento casa" area="house"/>
  <color symbol="w" rgb="#E8DCC0" name="muro casa"/>
  <color symbol="a" rgb="#B89868" name="pavimento ala" area="house"/>
  <color symbol="v" rgb="#D8C8A0" name="muro ala"/>
  <color symbol="d" rgb="#6B4528" name="porta"/>
  <color symbol="p" rgb="#A07850" name="portico" area="porch"/>
  <color symbol="j" rgb="#5A3A20" name="palo portico"/>
  <color symbol="s" rgb="#806040" name="scala"/>
  <color symbol="t" rgb="#3F6A30" name="albero"/>
  <color symbol="m" rgb="#FF00FF" name="segno" hidden="True"/>
  <color symbol="u" rgb="#9A6A3A" name="arredo tavolo"/>
  <color symbol="i" rgb="#A04A3A" name="arredo cassapanca"/>
  <color symbol="o" rgb="#7A5530" name="arredo botte"/>
  <color symbol="e" rgb="#E8DCC0" name="muro casa"/>
  <color symbol="c" rgb="#C8A878" name="pavimento casa"/>
  <color symbol="n" rgb="#C8A878" name="pavimento casa"/>
  <color symbol="l" rgb="#8A3020" name="arredo focolare segno"/>
  <color symbol="y" rgb="#B89868" name="pavimento ala"/>
  <color symbol="O" rgb="#6B4528" name="porta"/>
  <color symbol="o" rgb="#4A2E18" name="assi porta"/>
  <color symbol="N" rgb="#3A2410" name="stipite"/>
  <color symbol="W" rgb="#EDE2C8" name="intonaco"/>
  <color symbol="V" rgb="#D8C8A0" name="intonaco ala"/>
  <color symbol="U" rgb="#EDE2C8" name="intonaco"/>
  <color symbol="L" rgb="#7FB0D0" name="vetro finestra"/>
  <color symbol="R" rgb="#B0442C" name="tetto di coppi"/>
  <color symbol="f" rgb="#A8885A" name="assito" area="house"/>
  <color symbol="F" rgb="#8C6E48" name="solaio"/>
  <color symbol="T" rgb="#806040" name="scala" hidden="True"/>
  <color symbol="k" rgb="#704C2C" name="gradini"/>
  <color symbol="P" rgb="#B08A60" name="pedana portico" area="porch"/>
  <color symbol="Q" rgb="#5A3A20" name="palo portico"/>
  <color symbol="J" rgb="#8E3A24" name="tettoia portico"/>
  <color symbol="r" rgb="#C8B898" name="vialetto"/>
  <color symbol="g" rgb="#8FB060" name="giardino" area="garden"/>
  <color symbol="x" rgb="#4F7A38" name="siepe"/>
  <color symbol="q" rgb="#6A4A2A" name="tronco"/>
  <color symbol="C" rgb="#5E8E40" name="chioma"/>
  <color symbol="A" rgb="#9A6A3A" name="arredo tavolo"/>
  <color symbol="D" rgb="#C8C0E0" name="arredo letto"/>
  <color symbol="Z" rgb="#A04A3A" name="arredo cassapanca"/>
  <color symbol="X" rgb="#6E5034" name="arredo armadio"/>
  <color symbol="Y" rgb="#707070" name="arredo focolare"/>
  <color symbol="b" rgb="#B07840" name="arredo scaffale"/>
  <color symbol="K" rgb="#7A5530" name="arredo botte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
