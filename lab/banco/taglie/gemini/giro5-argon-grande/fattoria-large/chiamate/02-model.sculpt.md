# model.sculpt · gemini-4-argon · 53 s

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
  Concept: Fattoria (medieval farmstead).
  Parts and letters:
  - Main farmhouse: interior (h), stair zone (s), stone/plaster walls (w), front door (d). 2 storeys + hip roof.
  - Barn / stable wing: interior (a), timber-frame/brick walls (v), connected to one side of the farmhouse (1 storey + tall hayloft roof).
  - Lean-to porch (tettoia): (p), 4 cells (20 voxels) deep along the front or side, with wooden posts and a pitched lean-to roof at 34 voxels high.
  - Stone silo / dovecote tower: (t), attached to a rear corner of the farmhouse, crowned with battlements and slits.
  - Farmyard (aia): (c) paved/dirt yard around the buildings, enclosed by a low dry-stone wall / wooden fence (x), with a road (r) leading straight from the front door to the south edge.
  - Haystacks / hay area: (y) in the yard behind or beside the house.
  - At Huge / Gargantuan sizes (where more ground E is available around the yard): plowed crop fields (g), a stone well (Q), and orchard trees (z).
  Seeds vary: the depth of the farmhouse, which side the barn wing and silo tower attach to, placement of the haystack, well, fields, and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavptcxyrgQz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around centre H: 9x8 or 9x9 interior -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the farmhouse along the back wall: 2 cells landing before small-x, 4 cells strip, floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Silo / dovecote tower on one of the rear corners of the farmhouse -->
      <one in="EE/EE/Ew" out="tt/tt/*w" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" steps="1"/>
      <all in="tE/*t" out="*t/**"/>

      <!-- Barn wing on a side wall (if room, otherwise compact side annex) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/**aaa*/**aaa*/**aaa*/******" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Lean-to (tettoia) 4 cells deep (20 voxels) on the opposite side or front-side of the house -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the farmhouse, barn, lean-to and silo -->
      <all in="[wvtpx]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand the yard at Huge and Gargantuan sizes where at least 5 cells of E remain -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack in the rear or side yard -->
      <one in="ccc/ccc/ccc" out="***/**y/**y" steps="1"/>

      <!-- Well in the expanded yard (only matches when a 4x4 patch of yard is free, i.e., Huge+) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Fence / low courtyard wall around the yard -->
      <all in="cE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Cultivated fields outside the fence at Huge+ sizes where 5 cells of open soil remain -->
      <all in="xEEEEE" out="*gggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>

      <!-- Orchard trees in remaining open soil at Huge+ sizes -->
      <one in="EEEE/EEEE/EEEE/EEEE" out="****/*zz*/*zz*/****" steps="3"/>

      <!-- Way out from H straight to the front (south): door d (3 cells wide) and road r to the edge -->
      <all in="[Hh]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[cxE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxE]" out="*r" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="138,162,102" name="erba" area="field"/>
  <color symbol="H" value="210,180,140" name="centro" area="house"/>
  <color symbol="h" value="210,180,140" name=" pavimento casa" area="house"/>
  <color symbol="s" value="190,150,110" name="zona scala" area="house"/>
  <color symbol="w" value="230,220,200" name="muro casa" area="house"/>
  <color symbol="d" value="140,95,60" name="porta" area="house"/>
  <color symbol="a" value="195,165,120" name="fienile" area="barn"/>
  <color symbol="v" value="175,95,75" name="muro fienile" area="barn"/>
  <color symbol="p" value="165,135,95" name="tettoia" area="porch"/>
  <color symbol="t" value="160,155,145" name="colombaia" area="tower"/>
  <color symbol="c" value="185,170,135" name="aia" area="yard"/>
  <color symbol="x" value="130,115,95" name="muretto" area="yard"/>
  <color symbol="y" value="225,195,95" name="pagliaio" area="yard"/>
  <color symbol="r" value="170,155,125" name="sentiero" area="yard"/>
  <color symbol="g" value="125,105,75" name="campo arato" area="field"/>
  <color symbol="Q" value="120,135,145" name="pozzo" area="yard"/>
  <color symbol="z" value="95,135,75" name="frutteto" area="orchard"/>
</sequence>

## What the game made of it
It does not run: large, seed 1: riga 75, <color>: "value" è un colore esadecimale (rrggbb), non "138,162,102"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Concept: Fattoria (medieval farmstead).
  Parts and letters:
  - Main farmhouse: interior (h), stair zone (s), stone/plaster walls (w), front door (d). 2 storeys + hip roof.
  - Barn / stable wing: interior (a), brick/timber walls (v), attached to a side of the farmhouse (1 tall storey + pitched roof).
  - Lean-to porch (tettoia): (p), 4 cells (20 voxels) deep and 7 cells (35 voxels) wide along the opposite side of the house, with wooden posts and a roof at 34 voxels high.
  - Stone silo / dovecote tower: (t), attached to a rear corner of the farmhouse, crowned with battlements (M) and arrow slits (U).
  - Farmyard (aia): (c) dirt yard around the buildings, enclosed by a low dry-stone wall (x), with a road (r) leading straight from the front door to the south edge.
  - Haystacks: (y) in the yard.
  - At Huge / Gargantuan sizes (where more ground E is available around the yard): expanded yard, stone well (Q), plowed crop fields (g), and orchard trees (z).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavptcxyrgQz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around centre H: 9x8 or 9x9 interior -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the farmhouse along the back wall: 2 cells landing before small-x, 4 cells strip, floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Silo / dovecote tower on one of the rear corners of the farmhouse -->
      <one in="EE/EE/Ew" out="tt/tt/*w" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" steps="1"/>
      <all in="tE/*t" out="*t/**"/>

      <!-- Lean-to (tettoia) 4 cells deep (20 voxels) and 7 cells long (35 voxels) on one side of the farmhouse -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Barn wing on the other side wall (where E remains) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/**aaa*/**aaa*/**aaa*/**aaa*/******" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Farmyard around the farmhouse, barn, lean-to and silo -->
      <all in="[wvtp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand the yard at Huge and Gargantuan sizes where at least 6 cells of E remain -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack in the yard -->
      <one in="ccc/ccc/ccc" out="***/**y/**y" steps="1"/>

      <!-- Well in the expanded yard (matches when a 4x4 patch of yard is free, i.e., Huge+) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Low stone wall / fence around the yard -->
      <all in="cE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Cultivated fields outside the fence at Huge+ sizes where 4 cells of open soil remain -->
      <all in="xEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>

      <!-- Orchard trees in remaining open soil at Huge+ sizes -->
      <one in="EEEE/EEEE/EEEE/EEEE" out="****/*zz*/*zz*/****" steps="3"/>

      <!-- Way out from H straight to the front (south): door d (3 cells wide) and road r to the edge -->
      <all in="[Hh]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[cxpgE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxpgE]" out="*r" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavptcxyrgQzfFWVGKLJRPOoNTkMU#90#91#92#94#20#21ijmnqub" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="z" out="zzzzz/zmmmz/zmmmz/zmmmz/zzzzz"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <union symbol="+" values="WVG"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="WVG"/>

        <!-- B. Heights: grow columns from the bottom layer -->

        <!-- Main farmhouse walls (w) and front door column (d): 2 storeys = 64 high + roof R -->
        <all steps="1"><rule in="B d" out="d f"/></all>
        <all steps="1"><rule in="f d" out="d O"/></all>
        <all steps="4"><rule in="B w" out="w G"/><rule in="O d" out="d W"/><rule in="W d" out="d W"/></all>
        <all steps="2"><rule in="B w" out="w W"/><rule in="W d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w j"/><rule in="W d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="W d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="W d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w j"/><rule in="W d" out="d j"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="j d" out="d W"/><rule in="W d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Main farmhouse interior (h) and stair zone (s): floor at z=0, slab at z=32, roof R at z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Barn walls (v) and interior (a): 1 tall storey = 36 high + roof J -->
        <all in="B v" out="v G" steps="4"/>
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v j" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="J"/>

        <!-- Lean-to porch (p, b): corner/outer posts rise 33, roof J at z=34 -->
        <all in="b[pB]" out="p*" steps="2"/>
        <all in="B p" out="u *" steps="1"/>
        <all in="B b" out="b P" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B u" out="u B" steps="33"/>
        <prl in="u" out="J"/>

        <!-- Silo / dovecote tower (t): stone column 48 high, flat top for battlements & slits -->
        <all in="B t" out="t G" steps="48"/>
        <prl in="t" out="G"/>

        <!-- Low courtyard fence/wall (x): 7 high -->
        <all in="B x" out="x G" steps="6"/>

        <!-- Haystack (y): stepped mound of hay -->
        <all in="B y" out="y *" steps="10"/>
        <all in="yB" out="*B" steps="1"/>
        <all in="B y" out="y *" steps="6"/>

        <!-- Well (Q, q): stone curb and water -->
        <all in="B Q" out="Q G" steps="7"/>
        <all in="B q" out="q n" steps="3"/>

        <!-- Orchard trees (z, m): trunk P and canopy L -->
        <all in="B m" out="m P" steps="12"/>
        <all in="B m" out="m L" steps="10"/>
        <all in="LB" out="*L" steps="2"/>

        <!-- C. Full scale: doors, parts, windows, roofs, cleaning -->

        <!-- Internal doorway between farmhouse (f) and barn (f) through shared wall -->
        <one in="fWWWWWGf" out="*OOOOOO*" symmetry="(xy)" steps="1"/>
        <one in="fGGGGGGf" out="*OOOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/[WGV]" out="*/O" symmetry="()" steps="5"/>
        <all in="[WGV]/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Include parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window band (j) -->
        <one steps="18">
          <rule in="Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj Bj/Bj/Bj/Bj/Bj/Bj" out="*K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K *K/*K/*K/*K/*K/*K"/>
        </one>
        <all in="KjjjjB" out="*KKKK*"/>
        <prl in="j" out="W"/>

        <!-- Main farmhouse hip roof (R) with eaves and chimney -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* G *" steps="1" symmetry="()"/>
        <all in="B G" out="G *" steps="9"/>

        <!-- Barn and lean-to roof (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Clean up temporary markers -->
        <prl><rule in="q" out="B"/><rule in="m" out="z"/></prl>
      </sequence>
    </map>
  </map>

  <!-- Palette -->
  <color symbol="E" value="8a9a68" name="erba" area="field"/>
  <color symbol="c" value="b8a682" name="aia" area="yard"/>
  <color symbol="r" value="9e8c6c" name="sentiero" area="yard"/>
  <color symbol="x" value="857c70" name="muretto" area="yard"/>
  <color symbol="g" value="786048" name="campo arato" area="field"/>
  <color symbol="z" value="6e8c52" name="frutteto" area="orchard"/>
  <color symbol="L" value="4e7538" name="chioma" area="orchard"/>
  <color symbol="Q" value="7a7670" name="pozzo" area="yard"/>
  <color symbol="n" value="4a7a96" name="acqua" area="yard"/>
  <color symbol="y" value="d9b854" name="pagliaio" area="yard"/>
  <color symbol="p" value="a89674" name="pavimento tettoia" area="porch"/>
  <color symbol="P" value="6e4e32" name="legno" area="porch"/>
  <color symbol="f" value="b89060" name="tavolato" area="house"/>
  <color symbol="F" value="9c764c" name="solaio" area="house"/>
  <color symbol="W" value="dcd2be" name="intonaco" area="house"/>
  <color symbol="G" value="8c867c" name="pietra" area="tower"/>
  <color symbol="V" value="a85844" name="mattone" area="barn"/>
  <color symbol="R" value="b54d38" name="coppi" area="house"/>
  <color symbol="J" value="9c4230" name="tetto" area="barn"/>
  <color symbol="K" value="3b4d59" name="finestra" area="house"/>
  <color symbol="O" value="73482b" name="porta" area="house"/>
  <color symbol="o" value="4d2f1c" name="assi della porta" area="house"/>
  <color symbol="N" value="8c867c" name="stipite" area="house"/>
  <color symbol="k" value="8a6642" name="gradini" area="house"/>
  <color symbol="M" value="8c867c" name="merlo" area="tower"/>
  <color symbol="U" value="262422" name="feritoia" area="tower"/>
  <color symbol="#20" hidden="True" area="house"/>
  <color symbol="#21" hidden="True" area="house"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
