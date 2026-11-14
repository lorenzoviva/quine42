# model.sculpt · gemini-4-carbon · 34 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

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
