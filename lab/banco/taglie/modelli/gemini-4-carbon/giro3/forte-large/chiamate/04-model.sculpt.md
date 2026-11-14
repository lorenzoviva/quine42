# model.sculpt · gemini-4-carbon · 58 s

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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c cortile, a fossato, f assi del pavimento, F solaio in legno, I trave di quercia, J pietra della cinta, K pietra del mastio, L pietra scura, P acqua, R coppi rossi, V stendardo, C ciottolato, M merlatura, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMEEEEE
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEEEE
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEEEE
EEEJJccccccccccccccccccccccccccccccccccccccJJEEEEE
EEEJJccccccccccccccccccccccccccccccccccccccJJEEEEE
EEEJJccccccccccMMKKMMKKMMKKMKKMMKKMMKKMMcccJJEEEEE
EEEJJccccccccccMKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE
EEEJJccccccccccKKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccKKKFMFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKFFFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKFFFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccKKKKMFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJcccMMMMMccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJcccMPPPMccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJcccLPPPMccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJcccMPPPMccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJcccMMMMMccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE
EEEJJccccccccccMKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE
EEEJJccccccccccMKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE
EEEJJccccccccccMMcKMMcKMMcKMKcMMKcMMKcMMcccJJEEEEE
EEEJJccccccccccccccccccccccccccccccccccccccJJEEEEE
EEEJJccccccccccccccccccccccccccccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJcccccccRRRRRRRRRRRRRRRRRRRccccccccccccJJEEEEE
EEEJJJJJJJJJJRRRRRRRRRRRRRRRRRJJJJJJJJJJJJJJJEEEEE
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEEEE
EEEMMJEMMJEMMJEMMJEMMJEMMJEMMJEMMJEMMJEMMJEMMEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00dddadddadddadddadddadddadddadddadddadddaddd00000
00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
00aaa0000000000000000000000000000000000000aaa00000
00daa0000000000000000000000000000000000000aad00000
00daa0000000000wwwtwwwtwwwtwtwwwtwwwtwww00aad00000
00daa0000000000wtttttttttttttttttttttttw00aad00000
00aaa0000000000wtttwtttttttttttttttttttw00aaa00000
00daa0000000000ttttwsssssssssssssssssttt00aad00000
00daa0000000000wttttsssssssssssssssssttw00aad00000
00daa0000000000wtttwsssssssssssssssssttw00aad00000
00aaa0000000000wtttwsssssssssssssssssttw00aaa00000
00daa0000000000tttwwsssssssssssssssssttt00aad00000
00daa0000000000wttsssssssssssssssssssttw00aad00000
00daa0000000000wttsssssssssssssssssssttw00aad00000
00aaa0000000000wttwwsssssssssssssssssttw00aaa00000
00daa0000000000ttttwsssssssssssssssssttt00aad00000
00daa0000000000wtttwsssssssssssssssssttw00aad00000
00daa0000000000wttttsssssssssssssssssttw00aad00000
00aaa0000000000wtttwsssssssssssssssssttw00aaa00000
00daa0055555500ttttwsssssssssssssssssttt00aad00000
00daa0055005500wtttwsssssssssssssssssttw00aad00000
00daa0052002500wttttsssssssssssssssssttw00aad00000
00aaa0055005500wtttwsssssssssssssssssttw00aaa00000
00daa0055555500ttttwsssssssssssssssssttt00aad00000
00daa0000000000wtttttttttttttttttttttttw00aad00000
00daa0000000000wtttttttttttttttttttttttw00aad00000
00aaa0000000000wwwtwwwtwwwtwtwwwtwwwtwww00aaa00000
00daa0000000000000000000000000000000000000aad00000
00daa0000000eeeeeeeeeeeeeeeeee000000000000aad00000
00daa0000000efffffffffffffffffe00000000000aad00000
00aaa0000000efffffffffffffffffe00000000000aaa00000
00daa0000000effgggggggggggggffe00000000000aad00000
00daa0000000effgggggggggggggffe00000000000aad00000
00daa0000000effgggggggggggggffe00000000000aad00000
00aaa0000000effgggggggggggggffe00000000000aaa00000
00daa0000000effgjgggggggggggffe00000000000aad00000
00daa0000000effgggggggggggggffe00000000000aad00000
00daa0000000efffffffffffffffffe00000000000aad00000
00aaa0000000efffffffffffffffffe00000000000aaa00000
00daaaaaaaaaeeeeeeeeeeeeeeeeeeaaaaaaaaaaaaaad00000
00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
00dddadddadddadddadddadddadddadddadddadddaddd00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...............MMMMMMM.MMM.M.MMM.MMM.MMM..........
...............MMMMMMM.MMM.M.MMM.MMM.MMM..........
...............MMMMMMM.MMM.M.MMM.MMM.MMM..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KUKKKUKKKUKKKKKKKKKKKKKKK..........
...............KUKKKUKKKUKKKKKKKKKKKKKKK..........
...............KUKKKUKKKUKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
...............KIKKKKKKKKKKKKKKKKKKKKKKK..........
...............KIKKKKKKKKKKKKKKKKKKKKKKK..........
...............KIRRRRRRRRRKKKKKKKKKKKKKK..........
..............RRRRRRRRRRRRRRKKKKKKKKKKKK..........
............RRRRRRRRRRRRRRRRRRKKKKKKKKKK..........
...............KKKKKKKKKKKKKKKKKKKKKKKKK..........
..MMM.MMM.MMM.MMMKKMMKKMMKKMMKKMMKKMMKKMM.MMM.....
..MMM.MMM.MMM.MMMKKMMKKMMKKMMKKMMKKMMKKMM.MMM.....
..MMM.MMM.MMM.MMMKKMMKKMMKKMMKKMMKKMMKKMM.MMM.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
..........MMMMMMMMMMMMMMMMMMMMMMM.................
..........MMMMMMMMMMMMMMMMMMMMMMM.................
..........MMMMMMMMMMMMMMMMMMMMMMM.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KUKKKUKKKUKKKUKKKUKKKUK.................
..........KUKKKUKKKUKKKUKKKUKKKUK.................
..........KUKKKUKKKUKKKUKKKUKKKUK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK.................
..........KKKKKKKKKKKKKKKKKKKKKKK........V........
..........KKKKKKKKKKKKKKKKKKKKKKK........V........
..........KKKKKKKKKKKKKKKKKKKKKKK......RRV........
..........KKKKKKKKKKKKKKKKKKKKKKK....RRRRRR.......
..........KKKKKKKKKKKKKKKKKKKKKKK..RRRRRRRRRR.....
..........KKKKKKKKKKKKKKKKKKKKKKK.................
.....MMM.MMMKMMMKMMMKMMMKMMMKMMMKMMM.MMM.MMM.MMM..
.....MMM.MMMKMMMKMMMKMMMKMMMKMMMKMMM.MMM.MMM.MMM..
.....MMM.MMMKMMMKMMMKMMMKMMMKMMMKMMM.MMM.MMM.MMM..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJ..
.....JUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJ..
.....JUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJJJUJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
.....JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ..
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
..JJJ..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
..JJJ..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKK...................KKK..JJJ.....
..JJJ..........KKK...................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..........KKKKK.................KKK..JJJ.....
..JJJ..MMMMMM..KKKKK.................KKK..JJJ.....
..JJJ..MM..MM..KKKKK.................KKK..JJJ.....
..JJJ..M....M..KKKKK.................KKK..JJJ.....
..JJJ..MM..MM..KKKKK.................KKK..JJJ.....
..JJJ..MMMMMM..KKKKK.................KKK..JJJ.....
..JJJ..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
..JJJ..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
..JJJ..........KKKKKKKKKKKKKKKKKKKKKKKKK..JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJ.....................................JJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
...JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.....
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
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
...............KKKKKKKKKKKKKKKKK..KKKKKK..........
...............KKKKKKKKKKKKKKKKK..KKKKKK..........
...............KKKKKKKKKKKKKKKKK..KKKKKK..........
...............KKKKK.................KKK..........
...............KKKKK.................KKK..........
...............KKKKK.................KKK..........
...............KKKKK..............................
...............KKK................................
...............KKK...................KKK..........
...............KKK...................KKK..........
...............KKKKK.................KKK..........
...............KKKKK.................KKK..........
...............KKKKK.................KKK..........
...............KKKKK.................KKK..........
...............KKKKK.................KKK..........
...............KKKKK..................KK..........
...............KKKKK..............................
...............KKKKK..............................
...............KKKKK..............................
...............KKKKK..................KK..........
...............KKKKKKKKKKKKK..K.KKKKKKKK..........
...............KKKKKKKKKKKKK..K.KKKKKKKK..........
...............K..KKKKKKKKKK.....KKKKKKK..........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEMMJJMMJJMMJJMMJJMMJJMMJJJJMMJJMMJJMMJJMMJJMMMEE   00dddadddadddadddadddadddaddadddadddadddadddaddd00
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJMEE   00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEE   00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00
EEEJJccccccccccccccccccccccccccccccccccccccccJJJEE   00aaa0000000000000000000000000000000000000000aaa00
EEEJJccccccccccccccccccccccccccccccccccccccccJJMEE   00daa00fffffffffff000000000000000000000000000aad00
EEEJJccRRRRRRRRRRRMMKKMMKKMMKKKKMMKKMMKKMMMccJJMEE   00daa00ffffffffffwwwtwwwtwwwtwwtwwwtwwwtwww00aad00
EEEJJccRRRRRRRRRRRKKKKKKKKKKKKKKKKKKKKKKKKMccJJEEE   00daa00ffgggggggfwttttttttttttttttttttttttw00aad00
EEEJJccRRRRRRRRRRRKKKKKKKKKKKKKKKKKKKKKKKKcccJJJEE   00aaa00ffgggggggfwttttttttttttttttttttttttw00aaa00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFFFKKKccJJMEE   00daa00ffgggggggftttssssssssssssssssssssttt00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFFFKKMccJJMEE   00daa00ffggghgggfwttssssssssssssssssssssttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFMKKKMccJJEEE   00daa00ffggghgggfwttssssssssssssssssswwtttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKcccJJJEE   00aaa00ffggghgggfwttssssssssssssssssswttttw00aaa00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKKccJJMEE   00daa00ffggghgggftttssssssssssssssssswttttt00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKMccJJMEE   00daa00ffggghgggfwttssssssssssssssssstttttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKMccJJEEE   00daa00ffggghgggfwttssssssssssssssssswttttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKcccJJJEE   00aaa00ffggghgggfwttssssssssssssssssswttttw00aaa00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKKccJJMEE   00daa00ffggghgggftttssssssssssssssssswttttt00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKMccJJMEE   00daa00ffggghgggfwttssssssssssssssssstttttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKMccJJEEE   00daa00ffggghgggfwttssssssssssssssssswttttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKcccJJJEE   00aaa00ffggghgggfwttssssssssssssssssswttttw00aaa00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKKccJJMEE   00daa00ffggghgggftttssssssssssssssssswttttt00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKMccJJMEE   00daa00ffgggggggfwttssssssssssssssssstttttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKMccJJEEE   00daa00ffgggggggfwttssssssssssssssssswttttw00aad00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKcccJJJEE   00aaa00ffgggggggfwttssssssssssssssssswttttw00aaa00
EEEJJccRRRRRRRRRRRKKFFFFFFFFFFFFFFFFFFKKKKKccJJMEE   00daa00fffffffffftttssssssssssssssssstttttt00aad00
EEEJJcccRRRRRRRRRMKKKKKKKKKKKKKKKKKKKKKKKKMccJJMEE   00daa00ffffffffffwttttttttttttttttttttttttw00aad00
EEEJJcccccccccccccKKKKKKKKKKKKKKKKKKKKKKKKMccJJEEE   00daa000000000000wttttttttttttttttttttttttw00aad00
EEEJJcccccccccccccMMKcMMKcMMKccKMMcKMMcKMMcccJJJEE   00aaa000000000000wwwtwwwtwwwtwwtwwwtwwwtwww00aaa00
EEEJJccccccccccccccccccccccccccccccccccccccccJJMEE   00daa0000000000000000000000000000000000000000aad00
EEEJJccccccccccccccccccccccccccccccccccccccccJJMEE   00daa000000000000eeeheeeeeeeeeeeeee0000000000aad00
EEEJJccccccccccccRRRRRRRRRRRRRRRRRRRcccccccccJJEEE   00daa000000000000efffffffffffffffffe000000000aad00
EEEJJccccccccccccRRRRRRRRRRRRRRRRRRRcccccccccJJJEE   00aaa000000000000efffffffffffffffffe000000000aaa00
EEEJJccccccccccccRRRRRRRRRRRRRRRRRRRcccccccccJJMEE   00daa000005555500effgggggggggggggffe000000000aad00
EEEJJcccccMMLMMccRRRRRRRRRRRRRRRRRRRcccccccccJJMEE   00daa000005525500effgggggggggggggffe000000000aad00
EEEJJcccccMPPPMccRRRRRRRRRRRRRRRRRRRcccccccccJJEEE   00daa000005000500effgggggggggggggffe000000000aad00
EEEJJcccccMPPPMccRRRRRRRRRRRRRRRRRRRcccccccccJJJEE   00aaa000005000500effgggggggggggggffe000000000aaa00
EEEJJcccccMPPPMccRRRRRRRRRRRRRRRRRRRcccccccccJJMEE   00daa000005525500effgggggggggggggffe000000000aad00
EEEJJcccccMMMMMccRRRRRRRRRRRRRRRRRRRcccccccccJJMEE   00daa000005555500effgggggggggggggffe000000000aad00
EEEJJccccccccccccRRRRRRRRRRRRRRRRRRRcccccccccJJEEE   00daa000000000000efffffffffffffffffe000000000aad00
EEEJJccccccccccccRRRRRRRRRRRRRRRRRRRcccccccccJJJEE   00aaa000000000000efffffffffffffffffe000000000aaa00
EEEJJJJJJJJJJJJJJJRRRRRRRRRRRRRRRRRJJJJJJJJJJJJMEE   00daaaaaaaaaaaaaaeeeeeeeeeeeeeeeeeeaaaaaaaaaaaad00
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJMEE   00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00
EEEMMJEMMJEMMJEMMJEMMJEMMJEEJMMEJMMEJMMEJMMEJMMEEE   00dddadddadddadddadddadddaddadddadddadddadddaddd00
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMJJMMEEEEE   00dddadddadddadddadddadddadddadddadddadddaddd00000
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEEEE   00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
EEEJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJEEEEE   00daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad00000
EEEJJccccccccccccccccccccccccccccccccccccccJJEEEEE   00aaa0000000000000000000000000000000000000aaa00000
EEEJJccccccccccccccccccccccccccccccccccccccJJEEEEE   00daa0000000000000000000000000000000000000aad00000
EEEJJccccccccccMMKKMMKKMMKKMKKMMKKMMKKMMcccJJEEEEE   00daa0000000000wwwtwwwtwwwtwtwwwtwwwtwww00aad00000
EEEJJccccccccccMKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE   00daa0000000000wtttttttttttttttttttttttw00aad00000
EEEJJccccccccccKKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE   00aaa0000000000wtttwtttttttttttttttttttw00aaa00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000ttttwsssssssssssssssssttt00aad00000
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wttttsssssssssssssssssttw00aad00000
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wtttwsssssssssssssssssttw00aad00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00aaa0000000000wtttwsssssssssssssssssttw00aaa00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000ttttwsssssssssssssssssttt00aad00000
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wttttsssssssssssssssssttw00aad00000
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wtttwsssssssssssssssssttw00aad00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00aaa0000000000wtttwsssssssssssssssssttw00aaa00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000ttttwsssssssssssssssssttt00aad00000
EEEJJccccccccccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wttttsssssssssssssssssttw00aad00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00aaa0000000000ttttwsssssssssssssssssttt00aad00000
EEEJJccccccccccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wtttwsssssssssssssssssttw00aaa00000
EEEJJcccMMMMMccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0055555500wtttwsssssssssssssssssttw00aad00000
EEEJJcccMPPPMccMKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0055005500wttttsssssssssssssssssttw00aad00000
EEEJJcccLPPPMccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00aaa0052002500ttttwsssssssssssssssssttt00aaa00000
EEEJJcccMPPPMccKKKKKFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0055005500wtttwsssssssssssssssssttw00aad00000
EEEJJcccMMMMMccMKKKMFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0055555500wttwwsssssssssssssssssttw00aad00000
EEEJJccccccccccMKKFFFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00daa0000000000wttsssssssssssssssssssttw00aad00000
EEEJJccccccccccKKKFFFFFFFFFFFFFFFFFFFFKKcccJJEEEEE   00aaa0000000000tttsssssssssssssssssssttt00aaa00000
EEEJJccccccccccKKKFFFFFFFFFFFFFFFFFFFKKKcccJJEEEEE   00daa0000000000wtttttttttttttttttttttttw00aad00000
EEEJJccccccccccMKKKKKKKKKKKKKKKKKKKKKKKKcccJJEEEEE   00daa0000000000wtttttttttttttttttttttttw00aad00000
EEEJJccccccccccMKKKKKKKKKKKKKKKKKKKKKKKMcccJJEEEEE   00daa0000000000wwwtwwwtwwwtwtwwwtwwwtwww00aad00000
EEEJJccccccccccccccccccCCCCCCCcccccccccccccJJEEEEE   00aaa0000000000000000000000000000000000000aaa00000
EEEJJccccccccccccccccccCCCCCCCcccccccccccccJJEEEEE   00daa0000000000000000000000000000000000000aad00000
EEEJJcccccccccccccccccCCCCCCCCcccccccccccccJJEEEEE   00daa000000000000000nnn0000000nnn000000000aad00000
EEEJJcccccccccccccccMJCCCCCCCCJJcccccccccccJJEEEEE   00daa000000000000000nkn0000000nkn000000000aad00000
EEEJJcccccccccccccccMJJCCCCCCCJJJccccccccccJJEEEEE   00aaa000000000000000nkk0000000kkk000000000aaa00000
EEEJJJJJJJJJJJJJJJJJJJMJJJJJJJMJMJJJJJJJJJJJJEEEEE   00daaaaaaaaaaaaaaaaakkniiiiiiinknaaaaaaaaaaad00000
EEEJJJJJJJJJJJJJJJJJJJMUUUUUUUMJMJJJJJJJJJJJJEEEEE   00daaaaaaaaaaaaaaaaankniiiiiiinknaaaaaaaaaaad00000
EEEMMJPMMJPMMJPMMJPMMMMJJJJJJJMMMJPMMJPMMJPMMEEEEE   00dddadddadddadddaddnnniiiiiiinnnadddadddaddd00000
EEEPPPPPPPPPPPPPPPPPEEECCCCCCCEEEPPPPPPPPPPPPEEEEE   00000000000000000000000000000000000000000000000000
EEEPPPPPPPPPPPPPPPPPEEECCCCCCCEEEPPPPPPPPPPPPEEEEE   00000000000000000000000000000000000000000000000000
EEEPPPPPPPPPPPPPPPPPEEECCCCCCCEEEPPPPPPPPPPPPEEEEE   00000000000000000000000000000000000000000000000000
EEEPPPPPPPPPPPPPPPPPEEECCCCCCCEEEPPPPPPPPPPPPEEEEE   00000000000000000000000000000000000000000000000000
EEEPPPPPPPPPPPPPPPPPEEECCCCCCCEEEPPPPPPPPPPPPEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEECCCCCCCEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.40 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 199 nodi, 331 passi, finito in 321 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), h=sala del mastio (marcatore), c=cortile, p=tettoia (marcatore), a=fossato (marcatore), u=blue, W=White, w=white, f=assi del pavimento, F=solaio in legno, I=trave di quercia, J=pietra della cinta, K=pietra del mastio, L=pietra scura, P=acqua, R=coppi rossi, V=stendardo, X=X, C=ciottolato, M=merlatura, U=feritoia, #90=? (marcatore), #91=? (marcatore), z=z, m=magenta, x=x.
Alla fine: K 57592, J 35520, L 5384, U 4632, E 2775, c 2575, F 2500, M 2472, R 2220, f 1250, C 700, a 36, P 36, I 7, V 7.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-57 one×5, prl×5, all×16: 358 celle x1-17 y2-18 z0, passi 2-43
   #63 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 44
#66-74 all×4: 24072 celle x17-79 y20-64 z0-12, passi 45-58
    #75 all . w → w X passi=10: ×10, 20000 celle x30-79 y20-64 z12-22, passi 59-68, w→X 10000, .→w 10000
    #76 all . w → w K passi=11: ×11, 22000 celle x30-79 y20-64 z22-33, passi 69-79, w→K 11000, .→w 11000
    #77 all . w → w K passi=8: ×8, 16000 celle x30-79 y20-64 z33-41, passi 80-87, w→K 8000, .→w 8000
    #78 all . w → w X passi=10: ×10, 20000 celle x30-79 y20-64 z41-51, passi 88-97, w→X 10000, .→w 10000
    #79 all . w → w K passi=14: ×14, 28000 celle x30-79 y20-64 z51-65, passi 98-111, w→K 14000, .→w 14000
#80-90 prl×1, all×2: 6000 celle x30-79 y20-64 z0-65, passi 112-114
    #91 all . h → h . (+1) passi=30: ×30, 75000 celle x35-74 y25-59 z2-32, passi 115-144, h→. 37500, .→h 37500
      r1 . h → h . ×37500; r2 . s → s . ×0
    #92 all . h → h F (+1) passi=1: ×1, 2500 celle x35-74 y25-59 z32-33, passi 145, h→F 1250, .→h 1250
      r1 . h → h F ×1250; r2 . s → s F ×0
    #93 all . h → h . (+1) passi=31: ×31, 77500 celle x35-74 y25-59 z33-64, passi 146-176, h→. 38750, .→h 38750
      r1 . h → h . ×38750; r2 . s → s . ×0
    #94 prl h → F (+1): ×1, 1250 celle x35-74 y25-59 z64, passi 177, h→F 1250
      r1 h → F ×1250; r2 s → F ×0
    #105 all . W → W J passi=23: ×23, 73600 celle x5-89 y10-94 z0-23, passi 178-200, W→J 36800, .→W 36800
#106-122 prl×2, all×2: 3704 celle x5-89 y10-94 z0-23, passi 201-208
    #123 all . p → p . passi=31: ×31, 43400 celle x25-59 y70-89 z1-32, passi 209-239, p→. 21700, .→p 21700
#124-199 prl×5, one×2, all×12: 33665 celle x5-89 y10-94 z6-71, passi 240-331
Senza effetto (non hanno mai cambiato una cella):
#10 prl x → h
#16 all Eh/*x → x*/**: le celle cercate c'erano, ma mai disposte come nel pattern
#19 one hhhhhhhh/hhhhhhhh → **ssss**/**ssss** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#20 prl s → h: in quel momento nella griglia non c'erano celle "s"
#21 one EEEEEEEE/hhhhhhhh/hhhhhhhh → ********/**ssss**/**ssss** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 one mmmmmmmm → ***x**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 one EEEEEEEw/EEEEEEEw/EEEEEEEw/EEEEEEEw/EEEEEEEw/EE… → ****iiiw/****iiiw/****iiiw/****iiiw/****iiiw/**… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all iE → *v: in quel momento nella griglia non c'erano celle "i"
#29 all vE/*v → *v/**: in quel momento nella griglia non c'erano celle "v"
#30 one EE/Ew/w[hs] → qq/qq/** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#34 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all cEEEEEE → *ccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 109
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Forte (medieval fort)
  Parts & letters:
  - Keep (mastio): interior floor 'h', stair zone 's', stone walls 'w', keep door 'd', watch turret 'q' on a random corner of the keep, side annex/armory 'i' with walls 'v' when space permits.
  - Courtyard (cortile): 'c' around the keep, paved walk 'n' from keep door to gate, wooden lean-to 'p' against a courtyard wall, well 'u' in open courtyard space.
  - Curtain wall & Gatehouse: curtain wall 'W' ringing the courtyard, corner towers 't' (2x2 cells) on chosen outer corners, tall gatehouse 'G' with gateway passage 'g' on the front axis, road 'r' to the front edge, moat 'a' crossed by bridge 'b' outside when ground remains.
  What seeds change:
  - Keep width & depth (8-9 wide x 6-7 deep interior), which side gets a side annex or lean-to, which keep corner gets the tall watch turret 'q', which outer corners of the curtain wall get towers 't' (2 to 4 towers), well 'u' placement in courtyard.
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
      <!-- 1. Keep seed shifted slightly back from H, keeping H/z axis mark -->
      <one in="EE/EH" out="z*/**" symmetry="(x)" steps="1"/>
      <prl in="H" out="E"/>

      <!-- Grow keep vertical axis 'z': 3 back, 2 front (6 deep = 30 voxels >= 28), plus optional 1 front when room allows -->
      <all in="E/z" out="z/*" symmetry="()" steps="3"/>
      <all in="z/E" out="*/z" symmetry="()" steps="2"/>
      <one in="z/E/E/E/E/E/E" out="*/x/*/*/*/*/*" symmetry="()" steps="1"/>
      <prl in="x" out="z" p="0.5"/>
      <prl in="x" out="E"/>

      <!-- Save front center 'm' on the front-most cell of 'z' BEFORE growing width! -->
      <all in="z/E" out="m/*" symmetry="()" steps="1"/>

      <!-- Grow keep width from 'z' and 'm': 4 left, 3 right = 8 cells wide guaranteed (40 voxels >= 28) -->
      <all in="E[zm]" out="h*" symmetry="()" steps="4"/>
      <all in="[zm]E" out="*h" symmetry="()" steps="3"/>
      <all in="Eh" out="h*" symmetry="()" steps="3"/>
      <all in="hE" out="*h" symmetry="()" steps="2"/>
      <!-- Optional 9th column on left or right by seed when 5+ ground cells exist -->
      <one in="EEEEEh" out="****xh" symmetry="(x)" steps="1"/>
      <all in="Eh/*x" out="x*/**" symmetry="(x)"/>
      <all in="x*/Eh" out="**/*x" symmetry="(x)"/>
      <prl in="x" out="h"/>
      <prl in="z" out="h"/>

      <!-- Keep stair 's' along back wall (8+ wide guaranteed: 2 landing left, 4 stair, 2+ landing right) -->
      <one in="EEEEEEEE/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>

      <!-- Keep stone walls 'w' around 'h', 's', 'm' -->
      <all in="[hsm]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Optional side annex / armory 'i' against side keep wall ONLY when wide ground exists (Huge size) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw"
           out="***iiiw/***iiiw/***iiiw/***iiiw/***iiiw" symmetry="(x)" steps="1"/>
      <all in="iE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>

      <!-- Watch turret 'q' (2x2 cells = 10x10) on one random corner of the keep -->
      <one in="EE/Ew" out="*q/qq" symmetry="(xy)" steps="1"/>
      <all in="EE/qq" out="*q/**" symmetry="(xy)" steps="1"/>

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

      <!-- Corner towers 't' (2x2 cells = 10x10) on outer corners of curtain wall (2 to 4 corners by seed) -->
      <one in="EW/Wc" out="tt/*t" symmetry="(xy)" steps="2"/>
      <one in="EW/Wc" out="tt/*t" symmetry="(xy)" steps="1"/>
      <all in="Et/tt" out="tt/**" symmetry="(xy)"/>

      <!-- 4. Guaranteed way out along front axis from 'm': keep door 'd', yard paving 'n', gate passage 'g', road 'r' -->
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="m" out="h"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/[Wt]" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>

      <!-- Widen keep door 'd' to 3 cells (15 voxels), paving 'n' to 3 cells, gate passage 'g' to 3 cells, road 'r' to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="g[Wt]" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Gatehouse towers 'G' flanking the gate passage 'g' -->
      <all in="g[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="c/G" out="G/*" symmetry="()" steps="1"/>
      <all in="c/g" out="g/*" symmetry="()" steps="1"/>

      <!-- 5. Extra parts in spacious courtyard & exterior (Huge size) -->
      <!-- Wooden lean-to 'p' (4x7 cells = 20x35 voxels, >= 30 clear & 20 deep) against curtain wall in wide courtyard -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc"
           out="Wppppc/Wppppc/Wppppc/Wppppc/Wppppc/Wppppc/Wppppc" symmetry="(xy)" steps="1"/>

      <!-- Courtyard well 'u' (2x2 cells = 10x10) in open 4x4 courtyard area -->
      <one in="cccc/cccc/cccc/cccc" out="****/*uu*/*uu*/****" symmetry="(xy)" steps="1"/>

      <!-- Outer moat 'a' (2 cells = 10 voxels wide) where 3+ cells of E remain outside curtain wall -->
      <all in="WEEE" out="*aa*" symmetry="(xy)" steps="1"/>
      <all in="[WtG]E/*a" out="**/*a" symmetry="(xy)"/>
      <all in="aE/*a" out="*a/**" symmetry="(xy)"/>
      <!-- Wooden bridge 'b' across moat along road 'r' -->
      <all in="ar" out="*b" symmetry="(xy)" steps="3"/>
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

        <!-- Gatehouse front door strip 'Z' (5 voxels deep at front of 'g' meeting road 'r' or bridge 'b') -->
        <all in="g/[rb]" out="Z/*" symmetry="()" steps="1"/>
        <all in="g/Z" out="Z/*" symmetry="()" steps="4"/>

        <!-- B. THE HEIGHTS -->
        <!-- Paving, road, bridge, moat water, courtyard at z=1 (leaving area letters at z=0, flush z=1 ground level!) -->
        <all steps="1">
          <rule in="B c" out="C c"/>
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
        <!-- z=34..64: 31 layers of clear air on 2nd covered storey -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=65: roof terrace slab 'F' -->
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

        <!-- Watch turret 'q' on keep corner: rises to z=70 in dark stone 'L' + pyramidal tile roof 'R' -->
        <all in="B q" out="q L" steps="69"/>
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

        <!-- Gatehouse passage 'Z' (doorway) & 'g' (vault): paving 'C' at z=1 (matching road & courtyard 'C' at z=1) -->
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
        <all in="B I" out="I *" steps="5"/>
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
  <color symbol="c" value="b6a888" name="cortile" area="courtyard" hidden="True"/>
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
  <color symbol="C" value="b8aa90" name="ciottolato" area="courtyard"/>
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
