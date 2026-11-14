# model.sculpt · gemini-4-carbon · 64 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
  Concept: Forte (medieval fort)
  Parts & letters:
  - Keep (mastio): interior floor 'h', stair zone 's', stone walls 'w', keep door 'd', watch turret 'q' on one roof corner of the keep.
  - Courtyard (cortile): 'c' around the keep, paved walk 'n' from keep door to gate, wooden lean-to 'p' against the keep wall, well 'u' in open courtyard space.
  - Curtain wall & Gatehouse: curtain wall 'W' ringing the courtyard, corner towers 't' (3x3 cells) on outer corners, tall gatehouse 'G' on the front axis, road 'r' to the front edge, moat 'a' outside when ground remains.
  What seeds change:
  - Keep width/depth slightly (8 or 9 cells interior), which corner of the keep gets the watch turret 'q', whether the stair is against the back or side wall, which side of the keep gets the lean-to 'p', which outer corners get towers 't' at smaller sizes or where the well 'u' sits in the courtyard.
  What fits at each size:
  - Large (20x20 cells, 100x100): stout keep (9x8 interior + walls = 11x10) with watch turret 'q', tight courtyard 'c', curtain wall 'W' with front gatehouse 'G' and 2 corner towers 't', road 'r' to the front.
  - Huge (30x30 cells, 150x150): courtyard expands where ground permits, curtain wall surrounds the wide yard with all 4 corner towers 't', wooden lean-to 'p' against the keep, courtyard well 'u', and outer moat 'a' crossed by a bridge 'b' on the road.
  - Gargantuan (40x40 cells, 200x200): even wider courtyard, full moat 'a' around the towers, extra courtyard structures/trees 'v'.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhscwdqWtnGrpuabvmiy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Keep interior 'h' around H: shifted slightly toward back so front has room for gatehouse & road -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="5"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>

      <!-- Mark front axis 'm' from back of keep straight forward -->
      <one in="Eh/hh" out="*y/**" symmetry="(x)" steps="1"/>
      <all in="yh" out="*y" symmetry="(x)"/>
      <one in="yyy/hhh" out="*m*/***" symmetry="()" steps="1"/>
      <prl in="y" out="h"/>
      <all in="m/h" out="*/m" symmetry="()"/>

      <!-- Keep walls 'w' around 'h' and 'm' -->
      <all in="[hm]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Keep stair 's': 4 long in x, 2 wide in y, 2 cells landing on small-x, 1+ cell on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Watch turret 'q' (3x3) on one back corner of the keep -->
      <one in="EE/Ew/wh" out="qq/qq/*q" symmetry="(x)" steps="1"/>
      <all in="q[whE]/*q" out="qq/**" symmetry="(xy)" steps="1"/>

      <!-- 2. Initial tight courtyard 'c' around keep (1 cell on sides/back, 2 cells in front) -->
      <all in="[wq]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E" out="*/c" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(x)"/>

      <!-- Expand courtyard 'c' where wide free ground 'E' exists (Huge & Gargantuan) -->
      <all in="cEEEEEEE" out="*cccc***" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEEEEEEE" out="*cccc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 3. Lean-to 'p' (4x5 cells = 20x25 voxels, >30 clear if 6x4) against side of keep in courtyard if space allows -->
      <one in="wcccc/wcccc/wcccc/wcccc/wcccc/wcccc" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- 4. Curtain wall 'W' around courtyard (1 cell thick, or 2 where space allows) -->
      <all in="[cp]E" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers 't' (3x3) on outer corners of curtain wall where room exists -->
      <one in="EEE/EEW/EWW" out="ttt/ttt/ttt" symmetry="(xy)" steps="2"/>
      <all in="EEE/EEW/EWW" out="ttt/ttt/ttt" symmetry="(xy)"/>

      <!-- 5. Way out along front axis: keep door 'd', yard paving 'n', gatehouse 'G', road 'r' -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <!-- Widen door 'd' to 3 cells, paving 'n' to 3 cells, gatehouse 'G' to 5 cells wide & 2 deep -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="c/G" out="G/*" symmetry="()" steps="1"/>
      <all in="G/E" out="*/G" symmetry="()" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="G/r" out="*/r" symmetry="()" steps="0"/>

      <!-- 6. Courtyard well 'u' (2x2) where 6x6 open courtyard 'c' exists -->
      <one in="cccccc/cccccc/cccccc/cccccc/cccccc/cccccc" out="******/**uu**/**uu**/******/******/******" symmetry="(xy)" steps="1"/>

      <!-- 7. Outer moat 'a' where at least 4 cells of E remain beyond curtain wall / towers -->
      <all in="WEEEE" out="*aa**" symmetry="(xy)" steps="1"/>
      <all in="[WtG]E/*a" out="**/*a" symmetry="(xy)"/>
      <all in="aE/*a" out="*a/**" symmetry="(xy)"/>
      <!-- Bridge 'b' where road crosses moat area -->
      <all in="ar" out="*b" symmetry="(x)" steps="1"/>
      <all in="br" out="*b" symmetry="(x)" steps="2"/>

      <!-- 8. Courtyard tree 'v' in Gargantuan if another 6x6 of 'c' remains -->
      <one in="cccccc/cccccc/cccccc/cccccc/cccccc/cccccc" out="******/**vv**/**vv**/******/******/******" symmetry="(xy)" steps="1"/>
    </sequence>
  </map>

  <color symbol="E" value="138,154,104" name="erba" hidden="True"/>
  <color symbol="H" value="200,200,200" name="centro"/>
  <color symbol="h" value="196,178,148" name="sala del mastio" area="keep"/>
  <color symbol="s" value="170,140,105" name="scala interna" area="keep"/>
  <color symbol="w" value="142,138,132" name="muro del mastio" area="keep"/>
  <color symbol="q" value="118,114,108" name="torretta di guardia" area="tower"/>
  <color symbol="d" value="122,82,52" name="porta del mastio" area="keep"/>
  <color symbol="c" value="182,168,136" name="cortile" area="courtyard"/>
  <color symbol="n" value="160,154,144" name="lastricato" area="courtyard"/>
  <color symbol="p" value="156,112,72" name="tettoia" area="porch"/>
  <color symbol="W" value="152,148,140" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="128,124,118" name="torre angolare" area="tower"/>
  <color symbol="G" value="136,130,122" name=" corpo di guardia" area="gatehouse"/>
  <color symbol="r" value="168,156,132" name="strada" area="road"/>
  <color symbol="b" value="134,96,62" name="ponte" area="road"/>
  <color symbol="u" value="92,132,156" name="pozzo" area="courtyard"/>
  <color symbol="a" value="84,128,154" name="fossato" area="moat"/>
  <color symbol="v" value="96,136,78" name="albero" area="courtyard"/>
  <color symbol="m" value="220,100,100" name="asse"/>
  <color symbol="y" value="220,180,100" name="segno"/>
</sequence>

## What the game made of it
It does not run: large, seed 1: riga 99, <color>: "value" è un colore esadecimale (rrggbb), non "138,154,104"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Concept: Forte (medieval fort)
  Parts & letters:
  - Keep (mastio): interior floor 'h', stair zone 's', stone walls 'w', keep door 'd', watch turret 'q' on one corner of the keep.
  - Courtyard (cortile): 'c' around the keep, paved walk 'n' from keep door to gate, wooden lean-to 'p' against the keep wall, well 'u' in open courtyard space.
  - Curtain wall & Gatehouse: curtain wall 'W' ringing the courtyard, corner towers 't' (3x3 cells) on outer corners, tall gatehouse 'G' with gateway passage 'g' on the front axis, road 'r' to the front edge, moat 'a' crossed by bridge 'b' outside when ground remains.
  What seeds change:
  - Keep depth (8 or 9 cells interior), which corner of the keep gets the watch turret 'q', stair placement, which side gets the lean-to 'p', which corners get towers 't' when tight, well 'u' and tree 'v' placement.
  What fits at each size:
  - Large (20x20 cells): stout 2-storey keep + roof battlement platform with watch turret 'q', tight courtyard 'c', curtain wall 'W' with front gatehouse 'G' and corner towers 't', road 'r' to the front.
  - Huge (30x30 cells): expanded courtyard 'c', all 4 corner towers 't' with conical roofs, wooden lean-to 'p' against the keep, courtyard well 'u', outer moat 'a' with wooden bridge 'b'.
-->
<sequence values="BHEhscnrbaWwqtGqpdguvfFIJKLPRVXYZCDTkOoNMU#20#21#90#91#92#94" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="KJLV"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="KJL"/>

  <map scale="1/5 1/5 1" values="BHEhscwdqWtnGgrmy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Keep interior 'h' around H: shifted slightly toward back so front has room for gatehouse & road -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="5"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>

      <!-- Mark central front axis 'm' through keep -->
      <all in="E/h" out="*/y" symmetry="()" steps="1"/>
      <one in="yyyyyyyyy" out="****m****" symmetry="()" steps="1"/>
      <prl in="y" out="h"/>
      <all in="m/h" out="*/m" symmetry="()"/>

      <!-- Keep walls 'w' around 'h' and 'm' (keep is 11 wide x 10-11 deep) -->
      <all in="[hm]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Keep stair 's': 4 long in x (20 voxels >= 16), 2 wide in y (10 voxels), 2 cells landing on small-x, 3 cells landing on large-x -->
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- Watch turret 'q' (2x2 solid tower) on one back corner of the keep -->
      <one in="EE/Ew/wh" out="qq/qq/*w" symmetry="(x)" steps="1"/>

      <!-- 2. Initial tight courtyard 'c' around keep (1 cell on sides/back, 2 cells in front) -->
      <all in="[wq]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E" out="*/c" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(x)"/>

      <!-- Expand courtyard 'c' where wide free ground 'E' exists (Huge & Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEEEEEE" out="*cccc***" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 3. Curtain wall 'W' around courtyard (1 cell thick) -->
      <all in="cE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers 't' (3x3) on outer corners of curtain wall where room exists -->
      <one in="EE/EW" out="tt/tt" symmetry="()" steps="0"/>
      <all in="EE/EW" out="tt/*t" symmetry="(xy)"/>
      <all steps="1">
        <rule in="t[EW]" out="*t" symmetry="(xy)"/>
        <rule in="t*/*[EW]" out="**/*t" symmetry="(xy)"/>
      </all>

      <!-- 4. Way out along front axis: keep door 'd', yard paving 'n', gatehouse passage 'g', road 'r' -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <!-- Widen keep door 'd' to 3 cells, paving 'n' to 3 cells, gate passage 'g' to 3 cells, flanked by gatehouse towers 'G' -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="gW" out="*G" symmetry="(x)" steps="2"/>
      <all in="c/G" out="G/*" symmetry="()" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BHEhscnrbaWwqtGqpdguvfFIJKLPRVXYZCDTkOoNMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="()">
        <!-- Extra courtyard & exterior parts at full scale where space exists (Huge size) -->
        <!-- Lean-to 'p' (25x30 voxels) against keep wall 'w' in courtyard 'c' -->
        <one in="wccccc/wccccc" out="*ppppp/*ppppp" symmetry="(x)" steps="0"/>
        <!-- Place well 'u' (8x8) in open courtyard 'c' (needs 20x20 of c) -->
        <one in="cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc/cccccccccccccccccccc"
             out="********************/********************/********************/********************/********************/********************/******uuuuuuuu******/******uuuuuuuu******/******uuuuuuuu******/******uuuuuuuu******/******uuuuuuuu******/******uuuuuuuu******/******uuuuuuuu******/******uuuuuuuu******/********************/********************/********************/********************/********************/********************" symmetry="(xy)" steps="1"/>
        <!-- Hollow well center -->
        <all in="uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu"
             out="uuuuuuuu/uuuuuuuu/uuccccuu/uuccccuu/uuccccuu/uuccccuu/uuuuuuuu/uuuuuuuu" symmetry="()" steps="1"/>

        <!-- Wooden lean-to 'p' (20 deep x 32 wide, clear >= 30) against side of keep wall 'w' in wide courtyard -->
        <one in="wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc/wcccccccccccccccccccc"
             out="*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp/*pppppppppppppppppppp" symmetry="(x)" steps="1"/>
        <!-- Corner posts 'Y' at outer corners of lean-to 'p' -->
        <all in="pc/pp" out="Y*/**" symmetry="(xy)"/>
        <all in="Yp" out="YY" symmetry="(xy)" steps="2"/>
        <all in="Y*/*p" out="**/*Y" symmetry="(xy)" steps="2"/>

        <!-- Outer moat 'a' around fort where 18+ voxels of E exist outside W -->
        <all in="WEEEEEEEEEEEEEEEEEE" out="*aaaaaaaaaa********" symmetry="(xy)" steps="1"/>
        <all in="[WtG]E/*a" out="**/*a" symmetry="(xy)"/>
        <all in="aE/*a" out="*a/**" symmetry="(xy)"/>
        <!-- Wooden bridge 'b' where road 'r' meets moat 'a' -->
        <all in="ar" out="*b" symmetry="(x)" steps="15"/>

        <!-- B. THE HEIGHTS -->
        <!-- Ground / area layer z=0 preserved; raise columns from z=0 -->
        <!-- Paving, road, bridge, moat surface -->
        <all steps="1">
          <rule in="B n" out="C n"/>
          <rule in="B r" out="C r"/>
          <rule in="B b" out="I b"/>
          <rule in="B a" out="Z a"/>
        </all>

        <!-- Keep walls 'w': 2 storeys (64) + 1 parapet lip (65 total: z=1..65) with window bands X -->
        <!-- Base plinth 4 layers of dark stone L, then stone K and window band X -->
        <all in="B w" out="w L" steps="4"/>
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w K" steps="10"/>
        <!-- Second storey -->
        <all in="B w" out="w K" steps="8"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w K" steps="12"/>
        <prl in="w" out="K"/>

        <!-- Keep doorway column 'd': floor at z=1, seed 'O' at z=2, wall above z=3..65 -->
        <all in="B d" out="d f" steps="1"/>
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="36"/>
        <all in="B d" out="d X" steps="12"/>
        <all in="B d" out="d K" steps="14"/>
        <prl in="d" out="K"/>

        <!-- Keep interior 'h' and stair 's': 2 covered storeys + roof platform -->
        <!-- z=1: ground floor planks 'f' (area 'h'/'s' stays at z=0) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- z=2: stair strip 'T' above 's', air above 'h' -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="1"/>
        <!-- z=3..32: 30 layers of air (total clear = 31 voxels on ground floor) -->
        <all steps="30">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=33: first upper floor slab 'F' -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- z=34: second stair strip 'T' to reach the roof terrace! (Or keep 2nd storey covered with roof slab at z=64) -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="1"/>
        <!-- z=35..63: 29 layers of air (total clear = 30 voxels on 2nd storey!) -->
        <all steps="29">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=64: roof slab 'F' (1 below wall top z=65, so battlements crown the keep!) -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Watch turret 'q' on keep corner: rises to z=74 with dark stone 'L' and red roof 'R' -->
        <all in="B q" out="q L" steps="73"/>
        <prl in="q" out="R"/>

        <!-- Curtain wall 'W': rises 24 steps of stone 'J' -->
        <all in="B W" out="W J" steps="23"/>
        <prl in="W" out="J"/>

        <!-- Corner towers 't': rise 38 steps of dark stone 'L' -->
        <all in="B t" out="t L" steps="37"/>
        <prl in="t" out="L"/>

        <!-- Gatehouse towers 'G': rise 46 steps of stone 'J' -->
        <all in="B G" out="G J" steps="45"/>
        <prl in="G" out="J"/>

        <!-- Gatehouse passage 'g': paving 'C' at z=1, door seed 'O' in middle row, arch/wall 'J' above to z=42 -->
        <all in="B g" out="g C" steps="1"/>
        <!-- Put door seed 'O' across full width of 'g' where 'g' meets road 'r' (5 deep) -->
        <all in="g/r" out="D/*" symmetry="()" steps="1"/>
        <all in="g/D" out="D/*" symmetry="()" steps="4"/>
        <all in="B D" out="D O" steps="1"/>
        <all in="B D" out="D J" steps="40"/>
        <prl in="D" out="J"/>
        <!-- Remaining 'g' behind door: air for 32 voxels, then gatehouse vault 'J' from z=34..42 -->
        <all in="B g" out="g B" steps="32"/>
        <all in="B g" out="g J" steps="8"/>
        <prl in="g" out="J"/>

        <!-- Courtyard well 'u': stone rim 7 high -->
        <all in="B u" out="u L" steps="6"/>
        <prl in="u" out="L"/>
        <!-- Water inside well -->
        <all in="L/c" out="*/v" symmetry="(xy)" steps="0"/>

        <!-- Wooden lean-to 'p' & posts 'Y': clear height 31, sloped wooden/tile roof above -->
        <all in="B Y" out="Y I" steps="32"/>
        <prl in="Y" out="R"/>
        <all in="B p" out="p C" steps="1"/>
        <all in="B p" out="p B" steps="31"/>
        <prl in="p" out="R"/>

        <!-- C. FULL SCALE PARTS & DETAILS -->
        <!-- 1. Doors (opens keep door and gatehouse door) -->
        <import file="part-door"/>

        <!-- 2. Stairs inside keep (ground -> 2nd storey -> roof terrace) -->
        <import file="part-stair"/>

        <!-- 3. Windows in keep window bands 'X' (on all 4 sides, avoiding interior slabs) -->
        <one steps="18">
          <rule in="BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX"
                out="*P/*P/*P/*P *P/*P/*P/*P *P/*P/*P/*P *P/*P/*P/*P *P/*P/*P/*P *P/*P/*P/*P" symmetry="(xy)"/>
        </one>
        <all in="PXXXXB" out="*PPPP*" symmetry="(xy)"/>
        <prl in="X" out="K"/>
        <prl in="P" out="B"/>

        <!-- 4. Battlements & Arrow Slits on Keep (K), Gatehouse & Curtain Wall (J), Corner Towers (L) -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Pitched / pyramidal red tile roof 'R' on Watch Turret and Lean-to slope -->
        <all in="RB" out="*R" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Banner pole 'I' with red banner 'V' on watch turret peak or gatehouse -->
        <one in="B B R" out="* I *" symmetry="()" steps="1"/>
        <all in="B I" out="I *" steps="8"/>
        <all in="IB" out="*V" symmetry="()" steps="3"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: cozy medieval cartoon voxel style, warm stone, terracotta accents, dark wood -->
  <color symbol="E" value="8a9a68" name="erba" hidden="True"/>
  <color symbol="H" value="8a9a68" name="centro" hidden="True"/>
  <color symbol="h" value="b8a484" name=" pavimento mastio" area="keep" hidden="True"/>
  <color symbol="s" value="b8a484" name="vano scala" area="keep" hidden="True"/>
  <color symbol="c" value="b6a888" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e988e" name="lastricato" area="courtyard" hidden="True"/>
  <color symbol="r" value="a89c84" name="strada" area="road" hidden="True"/>
  <color symbol="b" value="86603e" name="ponte" area="road" hidden="True"/>
  <color symbol="a" value="54809a" name="fossato" area="moat" hidden="True"/>

  <!-- Built materials (>= 8 distinct materials, clear light/dark contrast) -->
  <color symbol="K" value="9c968c" name="pietra del mastio" area="keep"/>
  <color symbol="J" value="aba498" name="pietra della cinta" area="courtyard"/>
  <color symbol="L" value="7c766e" name="pietra scura" area="tower"/>
  <color symbol="M" value="aba498" name="merlatura"/>
  <color symbol="U" value="383430" name="feritoia"/>
  <color symbol="f" value="9e744c" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="8c6440" name="solaio in legno" area="keep"/>
  <color symbol="k" value="a87c52" name="gradini in legno" area="keep"/>
  <color symbol="C" value="8e887e" name="ciottolato" area="courtyard"/>
  <color symbol="I" value="6e4c30" name="trave di quercia" area="porch"/>
  <color symbol="R" value="b44c38" name="coppi rossi"/>
  <color symbol="V" value="c83e32" name="stendardo"/>
  <color symbol="Z" value="4c7ea0" name="acqua del fossato" area="moat"/>

  <!-- Door part colors & open/close hidden states -->
  <color symbol="O" value="785032" name="porta di legno"/>
  <color symbol="o" value="583820" name="pannello della porta"/>
  <color symbol="N" value="68625a" name="stipite in pietra"/>
  <color symbol="#20" value="785032" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="583820" name="pannello aperto" hidden="True"/>

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
```
