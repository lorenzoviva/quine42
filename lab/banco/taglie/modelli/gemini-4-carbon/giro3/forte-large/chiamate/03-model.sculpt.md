# model.sculpt · gemini-4-carbon · 70 s

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

The program you wrote:
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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c cortile, n lastricato, r strada, v olive, f assi del pavimento, F solaio in legno, I trave di quercia, J pietra della cinta, K pietra del mastio, L pietra scura, R coppi rossi, V stendardo, C ciottolato, O porta di legno, o pannello della porta, N stipite in pietra, M merlatura, U feritoia
Plan (the letter on top of every column):
```
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL
EEELLLLLLLLLMEEEEEEEEEEEEEEEEEEEEEEEEEEEMLLLLLLLLL
EEELLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJJJJJJJJJJJMLLLLLLLLL
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJJJJJJJJJJJMLLLLLLLLL
EEELLLLLLLLMMJJJJJJJJJJJJJJJJJJJJJJJJJJJMvLLLLLLLL
EEELLLLLLLvcccccccccccccccccccccccccccccccvLLLLEEE
EEELLLLLLMRcccccccccccccccccccccccccccccccvLLLLMEE
EEEEEEEEJJRRRMMKKMMKKMMKKMKMKKMMKKMMKKMMRRRJJEEEEE
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFKKKRRRJJEEEEE
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKMRRRJJEEEEE
EEEEEEEEJJcccvvvvvvvvvCCCCCCCCvvvvvvvvvvRRJJJEEEEE
EEEEEEEEJJcccccccccccccCCCCCCCcccccccccccccJJEEEEE
EEEEEEEEJJccccccccccccCCCCCCCCcccccccccccccJJEEEEE
EEEEEMLLLLvcccccccccJJMCCCCCCCMJMcccccccccvLLLLMEE
EEEEELLLLLvcccccccccJJMCCCCCCCMJMcccccccccvLLLLLEE
EEEMLLLLLLLMMJJJJJJJMJJJJJJJJJJJJJJJJJJJMLLLLLLLLL
EEELLLLLLLLLMJJJJJJJMJJUUUUUUUJJJJJJJJJJLLLLLLLLLL
EEELLLLLLLLLMJJJJJJJMMMJJJJJJJMMEJJJJJJJMLLLLLLLLL
EEELLLLLLLLLLEEEEEEEEEECCCCCCCEEEEEEEEEELLLLLLLLLL
EEELLLLLLLLLMEEEEEEEEEECCCCCCCEEEEEEEEEELLLLLLLLLL
EEELLLLLLLLLEEEEEEEEEEECCCCCCCEEEEEEEEEEMLLLLLLLLL
EEELLLLLLLLLMEEEEEEEEEECCCCCCCEEEEEEEEEEMLLLLLLLLL
EEEMMLEMELMMEEEEEEEEEEECCCCCCCEEEEEEEEEEMMELMMELME
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00jgggggggggg000000000000000000000000000gggggggggg
00jgggggggggg000000000000000000000000000gggggggggg
00ggggggggggj000000000000000000000000000jggggggggg
00jgggggggggj000000000000000000000000000jggggggggg
00jgggggggggg000000000000000000000000000gggggggggg
00jgggggggggjaaaaaaaaaaaaaaaaaaaaaaaaaaajggggggggg
00ggggggggggjaaaaaaaaaaaaaaaaaaaaaaaaaaajggggggggg
00jggggggggjjaaaaaaaaaaaaaaaaaaaaaaaaaaajjgggggggg
00jggggggj00000000000000000000000000000000jggggj00
00jjjgjjjjeee00000000000000000000000000000jjjgjj00
0000000aaeffvvvsvvvsvvvsvvvvsvvvsvvvsvvveeeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffssssssssssssssssssssssssssssefeaa00000
0000000aaiifvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffssssssssssssssssssssssssssssefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffssssssssssssssssssssssssssssefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffssssssssssssssssssssssssssssefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffssssssssssssssssssssssssssssefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffssssssssssssssssssssssssssssefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeffvssssssssssssssssssssssssssvefeaa00000
0000000aaeeevvvsvvvsvvvsvvvvsvvvsvvvsvvvefeaa00000
0000000aaa000000000000000000000000000000eeeaa00000
0000000aaa00000000000000000000000000000000aaa00000
00000jgjjj0000000000nnn0000000nnn000000000jjgjjj00
00000jgggj0000000000nkn0000000nkn000000000jggggj00
00000ggggg0000000000kkn0000000nkn000000000gggggg00
00jjgggggggjjaaaaaaankkiiiiiiikkkaaaaaaajjgggggggg
00jgggggggggjaaaaaaankniiiiiiinknaaaaaaajggggggggg
00jgggggggggjaaaaaaannniiiiiiinnnaaaaaaajggggggggg
00ggggggggggg000000000000000000000000000jggggggggg
00jgggggggggj000000000000000000000000000gggggggggg
00jgggggggggj000000000000000000000000000jggggggggg
00jgggggggggj000000000000000000000000000jggggggggg
00jjjgjjjgjjj000000000000000000000000000jjjgjjjgjj
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.............MM..MM..MM..M.M..MM..MM..MM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKKKKKKKKKKKKKKKKKKKKK..........
............KKKKKKKKMMMKKKKKKKMMMKKKKKKK..........
............KKKKKKKKMMMKKKKKKKMMMKKKKKKK..........
............KKKKKKKKMMMKKKKKKKMMMKKKKKKK..........
............KKKKK.KKJJJKKKKKKKJJJKKKKKKK..........
..MMMMMMMMMMMKKKK.KKJUJKKKKKKKJUJKKKKKKKMMMMMMMMMM
..MMMMMMMMMMMKKKKKKKJUJJJJJJJJJUJKKKKKKKMMMMMMMMMM
..MMMMMMMMMMMKKKKKKKJUJJJJJJJJJUJKKKKKKKMMMMMMMMMM
..LLLLLLLLLLLKKKKKKKJJJJJJJJJJJJJKKKKKKKLLLLLLLLLL
..LLLLLLLLLULKKKKKKKJJJJJJJJJJJJJKKKKKKKLULLLUULLL
..LLLLLLLLLULKKKKKKKJJJKKKKKKKJJJKKKKKKKLULLLUULLL
..LLLLLLLLLULKKKKKKKJJJooooooNJJJKKKKKKKLULLLUULLL
..LLLLLLLLLLLKKKKKKKJJJoooooooJJJKKKKKKKLLLLLLLLLL
..LLLLLLLLLLLKKKKKKKJJJoooooooJJJKKKKKKKLLLLLLLLLL
..LLLLLLLLLLLKKKKKKKJJJoooooooJJJKKKKKKKLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJoooooooJJJJJJJJJJLLLLLLLLLL
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
..........MM..MM..MM..M..MM..MM..MM...............
..........MMM.MMM.MMM.M.MMM.MMM.MMM...............
..........MMM.MMM.MMM.M.MMM.MMM.MMM...............
..........KKKKKKKKKKKKKKKKKKKKKKKKK...............
..........KKKKKKKKKKKKKKKKKKKKKKKKK...............
..........KUKKKUKKKUKKKKKKKKKKKKKKK...............
..........KUKKKUKKKUKKKKKKKKKKKKKKK...............
..........KKKKKKKKKKKKKKKKKKKKKKKKK...............
..........KKKKKKKKKKKKKKKKKKKKKKKKK...............
..........KKKKKKKKKKKKKKKKKKKKKKKKK...............
..........KKKKKKKKKKKKKKKKKKKKKKKKK..MMMMMM.......
..........KKKKKKKKKKKKKKKKKKKKKKKKK..MMMMMM.......
..........KKKKKKKKKKKKKKKKKKKKKKKKK..MMMMMM.......
..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJJJJ.......
MMMMMMMMMMKKKKKKKKKKKKKKKKKKKKKKKKK..MMJMMMMMMMM..
MMMMMMMMMMKKKKKKKKKKKKKKKKKKKKKKKKK..MMJMMMMMMMM..
MMMMMMMMMMKKKKKKKKKKKKKKKKKKKKKKKKK..MMJMMMMMMMM..
LLLLLLLLLLKKKKKKKKKKKKKKKKKKKKKKKKK..LLLLLLLLLLL..
LLLLLLULLLKKKKKKKKKKKKKKKKKKKKKKKKK..LLLLLLLLLUL..
LLLLLLULLLRRRRRRRRRRRRRRRRRRRRRRRRR..LLLLLLLLLUL..
LLLLLLULLLKKKKKKKKKKKKKKKKKKKKKKKKK..LLLLLLLLLUL..
LLLLLLLLLLKKKKKKKKKKKKKKKKKKKKKKKKK..LLLLLLLLLLL..
LLLLLLLLLLKKKKKKKKKKKKKKKKKKKKKKKKK..LLLLLLLLLLL..
LLLLLLLLLLKKKKKKKKKKKKKKKKKKKKKKKKK..LLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL..
LLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJJJJJJJJJJJJJJJJJJLLLLLLLLLL
..LLLLLLLL................................LLLLLL..
..LLLLLLLL................................LLLLLL..
.......JJJ..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
.......JJJ..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
.......JJJ..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK...........................JJJ.....
.......JJJ..KKK...........................JJJ.....
.......JJJ...........................KKK..JJJ.....
.......JJJ...........................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKK......................KKK..JJJ.....
.......JJJ..KKKKKKKKKKKoooooooKKKKKKKKKK..JJJ.....
.......JJJ..KKKKKKKKKKKoooooooKKKKKKKKKK..JJJ.....
.......JJJ..KKKKKKKKKKKoooooooKKKKKKKKKK..JJJ.....
.......JJJ................................JJJ.....
.......JJJ................................JJJ.....
.....LLLJJ..........JJ........JJ..........JJJLL...
.....LLLLL..........JJJ.......JJJ.........LLLLLL..
.....LLLLL..........JJJ.......JJJ.........LLLLLL..
..LLLLLLLLLLLJJJJJJJJJJ.......JJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJJ.......JJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLLJJJJJJJJJ........JJJJJJJJJJLLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
..LLLLLLLLLLL...........................LLLLLLLLLL
...LLLLLLLLL............................LLLLLLLLLL
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..M...............................................
............M...........................M.........
..................................................
..M...............................................
..M.........M...........................M.........
............M...........................M.........
...........M............................M.........
..M...............................................
..MMM..M.M................................MMM..M..
............KKKK..KKKKKKK..KKKKKK..KKKKK..........
............KKKK..KKKKKKK..KKKKKK..KKKKK..........
............KKKK..KKKKKKK..KKKKKK..KKKKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
............KKK......................KKK..........
.....................................KKK..........
.............KKK...KKKKKKK...KKKKKKKKKKK..........
.............KKKK.KKKKKKKKK.KKKKKKKKKKKK..........
.............KKKK.KKKKKKKKK.KKKKKKKKKKKK..........
..................................................
..................................................
.....M..MM..........JU........JU.............MM...
.....M...M..........JUJ.......JUJ.........M....M..
....................JUJ.......JUJ.................
..MM.......MM.......JUJ.......JUJ.......M.........
..M.........M.......UUU.......JUJ.................
....................JU........JU........M.........
..................................................
..M.........M.....................................
........................................M.........
..M.........M...........................M.........
...MM..M..MM............................MM..MM..M.
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
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLMEEEEEEEEEEEEEEEEEEEEEEEEEEEMLLLLLLLLL   00ggggggggggj000000000000000000000000000jggggggggg
EEELLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggj000000000000000000000000000jggggggggg
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJJJJJJJJJJJMLLLLLLLLL   00jgggggggggjaaaaaaaaaaaaaaaaaaaaaaaaaaajggggggggg
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJJJJJJJJJJJMLLLLLLLLL   00ggggggggggjaaaaaaaaaaaaaaaaaaaaaaaaaaajggggggggg
EEELLLLLLLLMMJJJJJJJJJJJJJJJJJJJJJJJJJJJMvLLLLLLLL   00jggggggggjjaaaaaaaaaaaaaaaaaaaaaaaaaaajjgggggggg
EEELLLLLLLvcccccccccccccccccccccccccccccccvLLLLEEE   00jggggggj00000000000000000000000000000000jggggj00
EEELLLLLLMvcccccccccccccccccccccccccccccccvLLLLMEE   00jjjgjjjj00000000000000000000000000000000jjgjjj00
EEEEEEEEJJRRRMMKKMMKKMMKKMKMKKMMKKMMKKMMRRRJJEEEEE   0000000aaeeevvvsvvvsvvvsvvvvsvvvsvvvsvvveeeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvejjaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKMRRRJJEEEEE   0000000aaeffvvvsvvvsvvvsvvvvsvvvsvvvsvvvefeaa00000
EEEEEEEEJJRRcvvvvvvvvvCCCCCCCCvvvvvvvvvvRRJJJEEEEE   0000000aaaeee000000000000000000000000000eeeaa00000
EEEEEEEEJJcccccccccccccCCCCCCCcccccccccccccJJEEEEE   0000000aaa00000000000000000000000000000000aaa00000
EEEEEEEEJJccccccccccccCCCCCCCCcccccccccccccJJEEEEE   00jjjjgjjj0000000000nnn0000000nnn000000000jjjgjjgg
EEELLLLLLLvcccccccccJJMCCCCCCCJJMcccccccccvLLLLLLL   00jggggggj0000000000nkn0000000nkn000000000jggggggg
EEELLLLLLLvcccccccccJJMCCCCCCCJJMcccccccccvLLLLLLL   00jggggggg0000000000kkn0000000kkn000000000gggggggg
EEELLLLLLLLMMJJJJJJJMJJJJJJJJJMJJJJJJJJJMLLLLLLLLL   00gggggggggjjaaaaaaankkiiiiiiinkkaaaaaaajjgggggggg
EEELLLLLLLLLMJJJJJJJMJJUUUUUUUMJJJJJJJJJMLLLLLLLLL   00jgggggggggjaaaaaaankniiiiiiinknaaaaaaajggggggggg
EEELLLLLLLLLMJJJJJJJMMMJJJJJJJMMEJJJJJJJLLLLLLLLLL   00jgggggggggjaaaaaaannniiiiiiinnnaaaaaaajggggggggg
EEELLLLLLLLLLEEEEEEEEEECCCCCCCEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLMEEEEEEEEEECCCCCCCEEEEEEEEEEMLLLLLLLLL   00gggggggggjj000000000000000000000000000jjgggggggg
EEELLLLLLLEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEELLLLLLL   00jggggggg00000000000000000000000000000000gggggggg
EEELLLLLLLEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEELLLLLLL   00jggggggj00000000000000000000000000000000jggggggg
EEEMMLEMEMEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEMMLEMLL   00jjjgjjjj00000000000000000000000000000000jjjgjjgg
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLMEEEEEEEEEEEEEEEEEEEEEEEEEEEMLLLLLLLLL   00ggggggggggj000000000000000000000000000jggggggggg
EEELLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggj000000000000000000000000000jggggggggg
EEELLLLLLLLLLEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLL   00jgggggggggg000000000000000000000000000gggggggggg
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJJJJJJJJJJJMLLLLLLLLL   00jgggggggggjaaaaaaaaaaaaaaaaaaaaaaaaaaajggggggggg
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJJJJJJJJJJJMLLLLLLLLL   00ggggggggggjaaaaaaaaaaaaaaaaaaaaaaaaaaajggggggggg
EEELLLLLLLLMMJJJJJJJJJJJJJJJJJJJJJJJJJJJMvLLLLLLLL   00jggggggggjjaaaaaaaaaaaaaaaaaaaaaaaaaaajjgggggggg
EEELLLLLLLvcccccccccccccccccccccccccccccccvLLLLEEE   00jggggggj00000000000000000000000000000000jggggj00
EEELLLLLLMRcccccccccccccccccccccccccccccccMLLLLMEE   00jjjjgjjjeee000000000000000000000000000eejjjgjj00
EEEEEEEEJJRRRMMKKMMKKMMKKMKMKKMMKKMMKKMMRRRJJEEEEE   0000000aaeffvvvsvvvsvvvsvvvvsvvvsvvvsvvvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeifvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFFKKRRRJJEEEEE   0000000aaeffssssssssssssssssssssssssssssefeaa00000
EEEEEEEEJJRRRKKFFFFFFFFFFFFFFFFFFFFFFKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKKRRRJJEEEEE   0000000aaeffvssssssssssssssssssssssssssvefeaa00000
EEEEEEEEJJRRRKKKKKKKKKKKKKKKKKKKKKKKKKKMRRRJJEEEEE   0000000aaeffvvvsvvvsvvvsvvvvsvvvsvvvsvvveeeaa00000
EEEEEEEEJJRRcvvvvvvvvvCCCCCCCCvvvvvvvvvvcccJJEEEEE   0000000aaaeee00000000000000000000000000000aaa00000
EEEEEEEEJJcccccccccccccCCCCCCCcccccccccccccJJEEEEE   0000000aaa00000000000000000000000000000000aaa00000
EEEEEEEEJJccccccccccccCCCCCCCCcccccccccccccJJEEEEE   00000jjjgj0000000000nnn0000000nnn000000000jjjgjjgg
EEEEEMLLLLvcccccccccMJMCCCCCCCJJMcccccccccvLLLLLLL   00000jgggj0000000000nkn0000000nkn000000000jggggggg
EEEEELLLLLvcccccccccMJMCCCCCCCJJMcccccccccvLLLLLLL   00000ggggg0000000000nkn0000000kkn000000000gggggggg
EEEMLLLLLLLMMJJJJJJJJJJJJJJJJJMJJJJJJJJJMLLLLLLLLL   00jjgggggggjjaaaaaaakkkiiiiiiinkkaaaaaaajjgggggggg
EEELLLLLLLLLMJJJJJJJJJJJJJJJJJMJJJJJJJJJLLLLLLLLLL   00jgggggggggjaaaaaaankniiiiiiinknaaaaaaagggggggggg
EEELLLLLLLLLMJJJJJJJMMMJJJJJJJMMEJJJJJJJLLLLLLLLLL   00jgggggggggjaaaaaaannniiiiiiinnnaaaaaaajggggggggg
EEELLLLLLLLLLEEEEEEEEEECCCCCCCEEEEEEEEEEMLLLLLLLLL   00ggggggggggg000000000000000000000000000jggggggggg
EEELLLLLLLLLMEEEEEEEEEECCCCCCCEEEEEEEEEEMLLLLLLLLL   00jgggggggggj000000000000000000000000000jjgggggggg
EEELLLLLLLLLEEEEEEEEEEECCCCCCCEEEEEEEEEEEEELLLLLLL   00jgggggggggj00000000000000000000000000000gggggggg
EEELLLLLLLLLMEEEEEEEEEECCCCCCCEEEEEEEEEEEEELLLLLLL   00jgggggggggj00000000000000000000000000000jggggggg
EEEMMLEMELMMEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEMMLEMLL   00jjjgjjjgjjj00000000000000000000000000000jjjgjjgg
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.02 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 179 nodi, 574 passi, finito in 405 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), h= pavimento mastio (marcatore), c=cortile, n=lastricato (marcatore), r=strada (marcatore), W=White, w=white, t=teal, G=Green, p=purple, d=dead, dark, g=green, v=olive, f=assi del pavimento, F=solaio in legno, I=trave di quercia, J=pietra della cinta, K=pietra del mastio, L=pietra scura, P=Purple, R=coppi rossi, V=stendardo, X=X, C=ciottolato, O=porta di legno, o=pannello della porta, N=stipite in pietra, M=merlatura, U=feritoia, #90=? (marcatore), #91=? (marcatore), m=magenta, y=yellow.
Alla fine: L 56120, K 52136, J 28407, F 3600, U 3388, E 3025, o 2130, M 1906, f 1875, C 870, R 768, c 708, N 255, r 225, n 150, v 147, O 120, I 9, V 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-41 all×24, prl×3, one×2: 340 celle x1-19 y0-19 z0, passi 2-47
   #43 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 48
#45-58 one×1, all×3: 18295 celle x20-84 y20-99 z0-10, passi 49-101
    #59 all . w → w X passi=12: ×12, 21000 celle x25-79 y20-69 z10-22, passi 102-113, w→X 10500, .→w 10500
#60-61 all×2: 31500 celle x25-79 y20-69 z22-40, passi 114-131
    #62 all . w → w X passi=12: ×12, 21000 celle x25-79 y20-69 z40-52, passi 132-143, w→X 10500, .→w 10500
#63-73 all×8, prl×2: 38750 celle x25-79 y20-69 z0-64, passi 144-223
    #74 all . h → h . (+1) passi=30: ×30, 108000 celle x30-74 y25-64 z2-32, passi 224-253, h→. 54000, .→h 54000
      r1 . h → h . ×54000; r2 . s → s . ×0
#75-77 all×2: 7200 celle x30-74 y25-64 z32-34, passi 254-255
    #78 all . h → h . (+1) passi=29: ×29, 104400 celle x30-74 y25-64 z34-63, passi 256-284, h→. 52200, .→h 52200
      r1 . h → h . ×52200; r2 . s → s . ×0
    #79 prl h → F (+1): ×1, 1800 celle x30-74 y25-64 z63, passi 285, h→F 1800
      r1 h → F ×1800; r2 s → F ×0
    #82 all . W → W J passi=23: ×23, 44850 celle x15-89 y10-84 z0-23, passi 286-308, W→J 22425, .→W 22425
    #83 prl W → J: ×1, 975 celle x15-89 y10-84 z23, passi 309, W→J 975
    #84 all . t → t L passi=37: ×37, 105450 celle x5-99 y0-94 z0-37, passi 310-346, t→L 52725, .→t 52725
#85-102 prl×3, all×6: 17737 celle x5-99 y0-94 z0-45, passi 347-437
    #103 all . p → p . passi=31: ×31, 26040 celle x20-84 y20-69 z1-32, passi 438-468, p→. 13020, .→p 13020
#104-179 prl×5, all×16, one×2: 37513 celle x5-99 y0-94 z1-70, passi 469-574
Senza effetto (non hanno mai cambiato una cella):
#7 prl E/h → h/* passi=1
#16 one wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw → ***********/***ssss****/***ssss**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#17 one EE/Ew/wh → qq/qq/*w passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all cEEEEEEE → *cccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#25 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#46 one cccccccccccccccccccc/cccccccccccccccccccc/ccccc… → ********************/********************/*****… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#47 all uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu/uuuuuuuu/uu… → uuuuuuuu/uuuuuuuu/uuccccuu/uuccccuu/uuccccuu/uu… passi=1: in quel momento nella griglia non c'erano celle "u"
#48 one wcccccccccccccccccccc/wcccccccccccccccccccc/wcc… → *pppppppppppppppppppp/*pppppppppppppppppppp/*pp… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#49 all pc/pp → Y*/**: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 68
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Forte (medieval fort)
  Parts & letters:
  - Keep (mastio): interior floor 'h', stair zone 's', stone walls 'w', keep door 'd', watch turret 'q' on a random corner of the keep, side annex/armory 'i' with walls 'v' when space permits.
  - Courtyard (cortile): 'c' around the keep, paved walk 'n' from keep door to gate, wooden lean-to 'p' against a courtyard wall, well 'u' in open courtyard space.
  - Curtain wall & Gatehouse: curtain wall 'W' ringing the courtyard, corner towers 't' (2x2 or 3x3 cells) on chosen outer corners, tall gatehouse 'G' with gateway passage 'g' on the front axis, road 'r' to the front edge, moat 'a' crossed by bridge 'b' outside when ground remains.
  What seeds change:
  - Keep width & depth (8-9 wide x 7-8 deep interior) and left/right shift, which side gets a side annex or lean-to, which keep corner gets the tall watch turret 'q', which outer corners of the curtain wall get towers 't' (2 to 4 towers), stair placement inside the keep, well 'u' placement in courtyard.
  What fits at each size:
  - Large (20x20 cells): stout 2-storey keep + roof battlement platform with corner watch turret 'q', compact courtyard 'c', curtain wall 'W' with front gatehouse 'G' and 2-4 corner towers 't', road 'r' to the front.
  - Huge (30x30 cells): expanded courtyard 'c', wooden lean-to 'p' on posts, courtyard well 'u', side annex 'i' on the keep, outer moat 'a' with wooden bridge 'b'.
-->
<sequence values="BHEhscinprbauWwvtGqdgfFIJKLPRVXYZCDTkOoNMU#20#21#90#91#92#94" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="KJLV"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="KJL"/>

  <map scale="1/5 1/5 1" values="BHEhscwdqivWtnGgprbauzmx" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Keep seed shifted slightly back from H, with random left/right offset for seed variety -->
      <one in="EE/EE/EH" out="z*/**/**" symmetry="(x)" steps="1"/>
      <prl in="H" out="E"/>

      <!-- Grow keep interior 'h': 3 back, 3-4 front (total 7-8 deep = 35-40 voxels >= 28) -->
      <all in="E/[zh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[zh]/E" out="*/h" symmetry="()" steps="3"/>
      <one in="h/E/E/E/E/E/E/E" out="*/x/*/*/*/*/*/*" symmetry="()" steps="1"/>
      <prl in="x" out="h" p="0.5"/>
      <prl in="x" out="E"/>
      <prl in="z" out="h"/>

      <!-- Grow keep width: 4 left, 3-4 right (total 8-9 wide = 40-45 voxels >= 28) -->
      <all in="Eh" out="h*" symmetry="()" steps="3"/>
      <all in="hE" out="*h" symmetry="()" steps="3"/>
      <one in="EEh" out="*xh" symmetry="(x)" steps="1"/>
      <all in="Eh/*x" out="x*/**" symmetry="()"/>
      <all in="x*/Eh" out="**/*x" symmetry="()"/>
      <prl in="x" out="h"/>

      <!-- Keep stair 's' along back wall (guaranteed 8+ wide, so 2 landing left, 4 stair, 2+ landing right) -->
      <one in="hhhhhhhh/hhhhhhhh" out="**ssss**/**ssss**" symmetry="()" steps="1"/>
      <!-- Push 's' to only match at the back row of 'h': let's place stair explicitly against back E! -->
      <prl in="s" out="h"/>
      <one in="EEEEEEEE/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>

      <!-- Mark central front axis 'm' from front row of keep 'h' -->
      <all in="h/E" out="m/*" symmetry="()" steps="1"/>
      <one in="mmmmmmmm" out="***x****" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- Keep stone walls 'w' around 'h', 's', 'x' -->
      <all in="[hsx]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Optional side annex / armory 'i' against side keep wall ONLY when wide ground exists (Huge size) -->
      <one in="EEEEEEEw/EEEEEEEw/EEEEEEEw/EEEEEEEw/EEEEEEEw/EEEEEEEw"
           out="****iiiw/****iiiw/****iiiw/****iiiw/****iiiw/****iiiw" symmetry="(x)" steps="1"/>
      <all in="iE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>

      <!-- Watch turret 'q' (2x2 cells = 10x10) on one random corner of the keep -->
      <one in="EE/Ew/w[hs]" out="qq/qq/**" symmetry="(xy)" steps="1"/>

      <!-- 2. Courtyard 'c' around keep (1 cell on sides/back, 2 cells in front) -->
      <all in="[wqv]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E" out="*/c" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(x)"/>

      <!-- Expand courtyard 'c' where 5+ cells of ground 'E' exist outside (Huge size) -->
      <all in="cEEEEE" out="*ccc**" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEEEEE" out="*ccc***" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 3. Curtain wall 'W' around courtyard 'c' -->
      <all in="cE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers 't' (2x2 cells = 10x10): guarantee at least 2 corners, plus 1-2 extra by seed for strong silhouette variety -->
      <one in="EE/EW/Wc" out="tt/tt/**" symmetry="(xy)" steps="2"/>
      <one in="EE/EW/Wc" out="tt/tt/**" symmetry="(xy)" steps="1"/>

      <!-- 4. Way out along front axis from 'x': keep door 'd', yard paving 'n', gate passage 'g', road 'r' -->
      <all in="x/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="x" out="h"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>

      <!-- Widen keep door 'd' to 3 cells (15 voxels), paving 'n' to 3 cells, gate passage 'g' to 3 cells, road 'r' to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Gatehouse towers 'G' flanking the gate passage 'g' -->
      <all in="gW" out="*G" symmetry="(x)" steps="1"/>
      <all in="c/G" out="G/*" symmetry="()" steps="1"/>
      <all in="c/g" out="g/*" symmetry="()" steps="1"/>

      <!-- 5. Extra parts in spacious courtyard & exterior (Huge size) -->
      <!-- Wooden lean-to 'p' (4x7 cells = 20x35 voxels, >= 30 clear & 20 deep) against curtain wall in wide courtyard -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc"
           out="Wppppp/Wppppp/Wppppp/Wppppp/Wppppp/Wppppp/Wppppp" symmetry="(xy)" steps="1"/>
      <!-- Trim p to 4 cells deep (20 voxels) so courtyard path stays clear -->
      <all in="Wppppp" out="Wppppc" symmetry="(xy)"/>

      <!-- Courtyard well 'u' (2x2 cells = 10x10) in open 4x4 courtyard area -->
      <one in="cccc/cccc/cccc/cccc" out="****/*uu*/*uu*/****" symmetry="(xy)" steps="1"/>

      <!-- Outer moat 'a' (2 cells = 10 voxels wide) where 3+ cells of E remain outside curtain wall -->
      <all in="WEEE" out="*aa*" symmetry="(xy)" steps="1"/>
      <all in="[WtG]E/*a" out="**/*a" symmetry="(xy)"/>
      <all in="aE/*a" out="*a/**" symmetry="(xy)"/>
      <!-- Wooden bridge 'b' across moat along road 'r' -->
      <all in="ar" out="*b" symmetry="(x)" steps="3"/>
    </sequence>

    <map scale="5 5 1" values="BHEhscinprbauWwvtGqdgfFIJKLPRVXYZCDTkOoNMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>

      <sequence symmetry="()">
        <!-- Prepare full-scale details on plan before rising -->
        <!-- Connect side annex 'i' to keep interior 'h' through keep wall 'w' with interior doorway 'D' (11 wide) -->
        <one in="iwwwww/iwwwww/iwwwww/iwwwww/iwwwww/iwwwww/iwwwww/iwwwww/iwwwww/iwwwww/iwwwww"
             out="iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD/iDDDDD" symmetry="(x)" steps="1"/>

        <!-- Hollow well center 'u' (10x10 -> 6x6 water center 'a') -->
        <all in="uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu/uuuuuuuuuu"
             out="uuuuuuuuuu/uuuuuuuuuu/uuaaaaaauu/uuaaaaaauu/uuaaaaaauu/uuaaaaaauu/uuaaaaaauu/uuaaaaaauu/uuuuuuuuuu/uuuuuuuuuu" symmetry="()" steps="1"/>

        <!-- Wooden posts 'Y' at outer corners of lean-to 'p' -->
        <all in="pc/pp" out="Y*/**" symmetry="(xy)"/>
        <all in="Yp" out="YY" symmetry="(xy)" steps="1"/>
        <all in="Y*/*p" out="**/*Y" symmetry="(xy)" steps="1"/>

        <!-- Gatehouse front door strip 'Z' (5 voxels deep at front of 'g' meeting road 'r') -->
        <all in="g/r" out="Z/*" symmetry="()" steps="1"/>
        <all in="g/Z" out="Z/*" symmetry="()" steps="4"/>

        <!-- B. THE HEIGHTS -->
        <!-- Paving, road, bridge, moat water at z=1 (leaving area letters at z=0) -->
        <all steps="1">
          <rule in="B n" out="C n"/>
          <rule in="B r" out="C r"/>
          <rule in="B b" out="I b"/>
          <rule in="B a" out="P a"/>
        </all>

        <!-- Keep walls 'w': 2 storeys + parapet lip (z=1..66), dark stone base L, warm stone K, window bands X -->
        <all in="B w" out="w L" steps="5"/>
        <all in="B w" out="w K" steps="7"/>
        <all in="B w" out="w X" steps="10"/>
        <all in="B w" out="w K" steps="11"/>
        <!-- Second storey wall -->
        <all in="B w" out="w K" steps="8"/>
        <all in="B w" out="w X" steps="10"/>
        <all in="B w" out="w K" steps="14"/>
        <prl in="w" out="K"/>

        <!-- Keep front doorway 'd' & annex doorway 'D': floor 'f' at z=1, door seed 'O' at z=2, wall above -->
        <all steps="1">
          <rule in="B d" out="d f"/>
          <rule in="B D" out="D f"/>
        </all>
        <all steps="1">
          <rule in="B d" out="d O"/>
          <rule in="B D" out="D O"/>
        </all>
        <all steps="38">
          <rule in="B d" out="d K"/>
          <rule in="B D" out="D K"/>
        </all>
        <all in="B d" out="d X" steps="10"/>
        <all in="B D" out="D K" steps="10"/>
        <all steps="15">
          <rule in="B d" out="d K"/>
          <rule in="B D" out="D K"/>
        </all>
        <prl>
          <rule in="d" out="K"/>
          <rule in="D" out="K"/>
        </prl>

        <!-- Keep interior 'h' and stair 's': 2 covered storeys (ground floor z=1..32, 2nd storey z=33..65) -->
        <!-- z=1: ground floor planks 'f' -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- z=2: stair strip 'T' above 's', air above 'h' -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="1"/>
        <!-- z=3..32: 30 layers of air (total clear height = 31 voxels on 1st storey) -->
        <all steps="30">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=33: second storey floor slab 'F' -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- z=34..64: 31 layers of clear air on 2nd covered storey (no second stair cutting it, full spacious upper hall!) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=65: roof terrace slab 'F' (1 voxel below wall top z=66, so battlements crown the keep) -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Side annex 'i' and walls 'v' (1 covered storey, pitched tile roof R) -->
        <all in="B v" out="v L" steps="4"/>
        <all in="B v" out="v K" steps="8"/>
        <all in="B v" out="v X" steps="8"/>
        <all in="B v" out="v K" steps="13"/>
        <prl in="v" out="R"/>
        <all in="B i" out="i f" steps="1"/>
        <all in="B i" out="i B" steps="32"/>
        <prl in="i" out="R"/>

        <!-- Watch turret 'q' on keep corner: rises to z=72 in dark stone 'L' + pyramidal tile roof 'R' -->
        <all in="B q" out="q L" steps="71"/>
        <prl in="q" out="R"/>

        <!-- Curtain wall 'W': rises 24 steps of stone 'J' -->
        <all in="B W" out="W J" steps="23"/>
        <prl in="W" out="J"/>

        <!-- Corner towers 't': rise 38 steps of dark stone 'L' -->
        <all in="B t" out="t L" steps="37"/>
        <prl in="t" out="L"/>

        <!-- Gatehouse flanking towers 'G': rise 46 steps of stone 'J' -->
        <all in="B G" out="G J" steps="45"/>
        <prl in="G" out="J"/>

        <!-- Gatehouse passage 'Z' (doorway) & 'g' (vault): paving 'C' at z=1 (matching road 'C' at z=1!) -->
        <all steps="1">
          <rule in="B Z" out="Z C"/>
          <rule in="B g" out="g C"/>
        </all>
        <!-- Door seed 'O' at z=2 across 'Z', stone wall 'J' above to z=42 -->
        <all in="B Z" out="Z O" steps="1"/>
        <all in="B Z" out="Z J" steps="39"/>
        <prl in="Z" out="J"/>
        <!-- Inner gate passage 'g': 31 voxels clear air (z=2..32), stone vault 'J' z=33..42 -->
        <all in="B g" out="g B" steps="31"/>
        <all in="B g" out="g J" steps="9"/>
        <prl in="g" out="J"/>

        <!-- Courtyard well 'u': stone rim 6 high -->
        <all in="B u" out="u L" steps="5"/>
        <prl in="u" out="L"/>

        <!-- Wooden lean-to 'p' & posts 'Y': paving 'C' at z=1, 31 clear air (z=2..32), red tile roof 'R' at z=33 -->
        <all in="B Y" out="Y I" steps="32"/>
        <prl in="Y" out="R"/>
        <all in="B p" out="p C" steps="1"/>
        <all in="B p" out="p B" steps="31"/>
        <prl in="p" out="R"/>

        <!-- C. FULL SCALE PARTS & FACADES -->
        <!-- 1. Doors: raises gatehouse door, keep door, and annex door -->
        <import file="part-door"/>

        <!-- 2. Stair: builds wooden stair inside keep from 1st storey to 2nd storey -->
        <import file="part-stair"/>

        <!-- 3. Windows in keep & annex window bands 'X' (clean openings on all 4 facades) -->
        <one steps="20">
          <rule in="BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX BX/BX/BX/BX"
                out="*V/*V/*V/*V *V/*V/*V/*V *V/*V/*V/*V *V/*V/*V/*V *V/*V/*V/*V *V/*V/*V/*V" symmetry="(xy)"/>
        </one>
        <all in="VXXXXB" out="*VVVV*" symmetry="(xy)"/>
        <prl in="X" out="K"/>
        <prl in="V" out="B"/>

        <!-- 4. Battlements & Arrow Slits on Keep (K), Gatehouse & Curtain Wall (J), Corner Towers (L) -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Pyramidal / pitched red tile roofs 'R' on Watch Turret, Annex, and Lean-to -->
        <all in="RB" out="*R" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Wooden flagpole 'I' with red banner 'V' on turret peak -->
        <one in="B B R" out="* I *" symmetry="()" steps="1"/>
        <all in="B I" out="I *" steps="6"/>
        <all in="IB" out="*V" symmetry="()" steps="3"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: cozy medieval cartoon voxel style, warm stone, terracotta accents, dark wood -->
  <color symbol="E" value="8a9a68" name="erba" hidden="True"/>
  <color symbol="H" value="8a9a68" name="centro" hidden="True"/>
  <color symbol="h" value="b8a484" name="sala del mastio" area="keep" hidden="True"/>
  <color symbol="s" value="b8a484" name="vano scala" area="keep" hidden="True"/>
  <color symbol="i" value="b8a484" name="armeria" area="keep" hidden="True"/>
  <color symbol="c" value="b6a888" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e988e" name="lastricato" area="courtyard" hidden="True"/>
  <color symbol="p" value="9e988e" name="tettoia" area="porch" hidden="True"/>
  <color symbol="r" value="a89c84" name="strada" area="road" hidden="True"/>
  <color symbol="b" value="86603e" name="ponte" area="road" hidden="True"/>
  <color symbol="a" value="54809a" name="fossato" area="moat" hidden="True"/>

  <!-- Built materials (distinct clear/dark contrast, <= 50% per material) -->
  <color symbol="K" value="9e968a" name="pietra del mastio" area="keep"/>
  <color symbol="J" value="b2aa9c" name="pietra della cinta" area="courtyard"/>
  <color symbol="L" value="767068" name="pietra scura" area="tower"/>
  <color symbol="M" value="b2aa9c" name="merlatura"/>
  <color symbol="U" value="36322e" name="feritoia"/>
  <color symbol="f" value="9e744c" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="88603c" name="solaio in legno" area="keep"/>
  <color symbol="k" value="aa7e54" name="gradini in legno" area="keep"/>
  <color symbol="C" value="8c867c" name="ciottolato" area="courtyard"/>
  <color symbol="I" value="68482c" name="trave di quercia" area="porch"/>
  <color symbol="R" value="b64c38" name="coppi rossi"/>
  <color symbol="V" value="cc3e30" name="stendardo"/>
  <color symbol="P" value="4c7ea0" name="acqua" area="moat"/>

  <!-- Door part colors & open/close hidden states -->
  <color symbol="O" value="785032" name="porta di legno"/>
  <color symbol="o" value="56361e" name="pannello della porta"/>
  <color symbol="N" value="666058" name="stipite in pietra"/>
  <color symbol="#20" value="785032" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="56361e" name="pannello aperto" hidden="True"/>

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
