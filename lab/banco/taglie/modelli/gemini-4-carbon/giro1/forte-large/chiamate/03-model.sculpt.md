# model.sculpt · gemini-4-carbon · 111 s

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
  Parts & plan letters:
  - Keep (mastio): interior `h` (8 to 9 × 8 to 9 cells = 40..45 voxels clear), stair zone `s` (4 × 2 along rear wall, 2 cells landing before & after), keep walls `w` (2 storeys + parapet), keep doorway `d`, attached side watch-turret `u`/`v` (when room allows, 2×3 interior `u` connected to keep, wall `v` rising higher as watchtower).
  - Courtyard & Outer Ring: courtyard `c`, curtain wall `W` (1 cell thick at Large, 2 cells thick at Huge/Gargantuan, walkable wall-walk), corner towers `t` (on outer corners when space allows), gatehouse `G` on the front axis with gate passage `g`, paved path `n` across yard, road `r` to the front edge, moat `a` and bridge `b` at Gargantuan.
  - Yard structures (when courtyard grows at Huge/Gargantuan): stone well `Q` (in 5×5 of free yard), timber lean-to / armory shed `p` (at least 6×4 cells = 30×20 voxels against curtain wall).
-->
<sequence values="BHEhucnpqrbafFPkwvWtGMRJoONULKDCXY#20#21" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="wvWtGD"/>
  <union symbol="=" values="fFP"/>
  <union symbol="%" values="wvWtG"/>

  <map scale="1/5 1/5 1" values="BHEhswduvcWtGgnraQpbm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Keep interior around H (8..9 wide x 8..9 deep, >= 40 voxels clear) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="4"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="3"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <!-- Rectangularize h -->
      <all in="hE/*h" out="*h/**"/>
      <all in="Eh/h*" out="h*/**"/>

      <!-- Keep walls w -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Side watch-turret / annex on left or right wall of keep (fits at Huge/Gargantuan, or if Keep shifted) -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/**uuw/**uuw/**uuw/*****" symmetry="(x)" steps="1"/>
      <all in="uE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 3. Stair zone s inside keep: along back wall (-y), 2 cells landing on small-x, 4 cells s, 2..3 cells landing on large-x -->
      <one in="wwwwwwwwww/whhhhhhhhw/whhhhhhhhw" out="**********/w**ssss**w/w**ssss**w" symmetry="()" steps="1"/>
      <one in="wwwwwwwww/whhhhhhhw/whhhhhhhw" out="*********/w**ssss*w/w**ssss*w" symmetry="()" steps="1"/>

      <!-- 4. Courtyard c around keep and turret: 1..2 cells at Large, expands at Huge/Gargantuan -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard where 6+ cells of ground remain (Huge & Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard further at Gargantuan where 8+ cells remain -->
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 5. Curtain wall W around courtyard: 1 cell thick at Large, 2 cells thick if 3+ cells of E remain -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEEE" out="*W**" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 6. Corner towers t on outer corners of curtain wall W -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all steps="1">
        <rule in="tW" out="*t"/>
        <rule in="t*/*W" out="**/*t"/>
      </all>

      <!-- 7. Way out: from H straight to the front (+y), 3 cells wide -->
      <all in="H/h" out="m/m" symmetry="()" steps="1"/>
      <all in="m/[hs]" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/[Wt]" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <!-- Widen door d, yard path n, gate passage g, road r to 3 cells wide -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="g[Wt]" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Gatehouse bastions G flanking the gate passage g -->
      <all in="g[Wt]" out="*G" symmetry="(x)" steps="2"/>
      <all in="G/W" out="*/G" symmetry="(x)" steps="1"/>
      <all in="W/G" out="G/*" symmetry="(x)" steps="1"/>
      <!-- Restore interior markers m and H -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 8. Courtyard additions when space fits (Huge & Gargantuan):
           lean-to shed p (7 wide x 4 deep = 35 x 20 voxels clear) against curtain wall, well Q in 5x5 of open yard -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/*pppppp*/*pppppp*/*pppppp*/*pppppp*/********" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 9. Outer moat a and bridge b where 5+ cells of E remain beyond curtain wall (Gargantuan) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[WtG]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Ensure road crosses moat as bridge b -->
      <all in="[rg]/a" out="*/b" symmetry="()"/>
      <all in="b/a" out="*/b" symmetry="()"/>
      <all in="ba" out="*b" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BHEhucnpqrbafFPkwvWtGMRJoONULKDCXYST#90#91#92#93#94#95#96#97" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="ccccc/cDDDc/cDADc/cDDDc/ccccc"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>

      <sequence symmetry="(xy)">
        <!-- B. THE HEIGHTS: columns by steps -->
        <!-- Mark corner posts Y in lean-to p before rising -->
        <all in="pc" out="Y*"/>
        <all in="p*/*c" out="Y*/**"/>

        <!-- 1. Keep walls `w` and door-wall `d`: 2 storeys + roof slab + parapet = 66 total -->
        <!-- Keep doorway `d`: z=0 gets `n` (floor) and seed `O` above? Wait: part-door wants `O` on the layer of the floor, with wall `+` above it! -->
        <!-- So at z=0: `h` leaves `h` (area) and `z=1` is floor? Let's check floor level! -->
        <!-- Ground E, c, n, r, a, b, h, u, p are at z=0! Walkers walk ON z=0 (standing in z=1..30) or ON z=1?
             Look at instructions:
             `soil="E" origin="bottom"` -> z=0 is the bottom layer!
             Example in prompt:
             <all in="B w" out="w W" steps="6"/> ... (so at z=0 w becomes W, head w moves to z=1, etc.)
             <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all> <!-- z=0: the floor -->
             <all in="B s" out="s T" steps="1"/> <!-- z=1: the strip of the stair in the air above its zone -->
             AND keep area letters on bottom layer? Wait: if `f` has `area="keep"`, then `f` at z=0 IS the floor and carries `area="keep"`!
             Let's check: `<color symbol="f" value="8c6239" name="pavimento di legno" area="keep"/>`! Yes! A visible floor block at z=0 with `area="keep"` satisfies both solid floor at z=0 AND area tagging on z=0! -->

        <!-- Keep walls `w`: z=0..65 (66 high: 65 + 1 parapet above roof slab at z=64)
             Include window bands `X` on storey 1 (z=10..19) and storey 2 (z=42..51) -->
        <all in="B w" out="w *" steps="10"/>
        <all in="B w" out="w X" steps="10"/>
        <all in="B w" out="w *" steps="22"/>
        <all in="B w" out="w X" steps="10"/>
        <all in="B w" out="w *" steps="13"/>
        <prl in="w" out="w"/>

        <!-- Keep doorway column `d`: z=0 is `O` (seed of door, on z=0, through whole thickness of wall!), z=1..65 is `w` (wall above it) -->
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w *" steps="64"/>

        <!-- Gatehouse passage `g`: z=0 is `O` (outer gate seed, 15 wide, through wall), z=1..45 is `G` (gatehouse wall above it, 46 high) -->
        <all in="B g" out="Z O" steps="1"/>
        <all in="B Z" out="Z G" steps="44"/>
        <prl in="Z" out="G"/>

        <!-- Gatehouse flanking bastions `G`: 46 high (z=0..45) with window band `C` at z=32..39 -->
        <all in="B G" out="G *" steps="32"/>
        <all in="B G" out="G C" steps="8"/>
        <all in="B G" out="G *" steps="5"/>

        <!-- Keep interior `h` & stair zone `s`:
             z=0: floor `f` (area="keep")
             z=1: `s` leaves `T` (stair strip, 20 long x 10 wide), `h` leaves `B`
             z=1..31: 31 layers of air `B`
             z=32: slab `F` + `T` on z=33 so a second stair climbs to the roof terrace!
             Wait: let's check if 2 stairs or 1 stair!
             "at least 2 covered storeys one reaches on foot from the front, through the door, on stairs of part-stair"
             Storey 1: floor at z=0, ceiling (slab `F`) at z=32 -> 31 air clear (covered storey #1!).
             Storey 2: floor at z=32, ceiling (roof slab `P`) at z=64 -> 31 air clear (covered storey #2!).
             With 1 stair from z=0 to z=32, a person walks in at z=0 (covered storey 1) and climbs `part-stair` to z=32 (covered storey 2)! That's already 2 covered storeys reached on foot! -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="P"/>
          <rule in="s" out="P"/>
        </prl>

        <!-- Side watch-turret `u` (interior) and `v` (wall):
             `v` rises to z=74 (taller than keep's 65, giving another distinct top height!).
             `u` has floor `f` at z=0, slab `F` at z=32, roof `P` at z=73 -->
        <all in="B v" out="v *" steps="12"/>
        <all in="B v" out="v C" steps="8"/>
        <all in="B v" out="v *" steps="24"/>
        <all in="B v" out="v C" steps="8"/>
        <all in="B v" out="v *" steps="22"/>

        <all in="B u" out="u q" steps="1"/>
        <all in="B u" out="u B" steps="31"/>
        <all in="B u" out="u F" steps="1"/>
        <all in="B u" out="u B" steps="40"/>
        <prl in="u" out="P"/>

        <!-- Connect keep `f`/`F` into side turret `q`/`F` through keep wall `w` on ground and 2nd floor! -->
        <!-- We will carve an arched/linteled doorway between `f` and `q` in C -->

        <!-- Curtain wall `W`: rises 24 high (z=0..23) -->
        <all in="B W" out="W *" steps="23"/>

        <!-- Corner towers `t`: solid base + upper watch platform at z=39 (40 high: z=0..39), pitched roof or battlements on top -->
        <all in="B t" out="t *" steps="28"/>
        <all in="B t" out="t C" steps="6"/>
        <all in="B t" out="t *" steps="5"/>

        <!-- Well `Q` -> stone rim `D` rises 7 voxels, water `A` stays at z=0..3 -->
        <all in="B D" out="D *" steps="6"/>
        <all in="B A" out="A a" steps="3"/>
        <prl in="A" out="a"/>

        <!-- Lean-to shed `p` and corner posts `Y`:
             Clear height must be >= 30! Floor `p` at z=0, posts `Y` rise 33 (z=0..32) as wood `K`, roof `J` at z=33..35 -->
        <all in="B Y" out="Y K" steps="33"/>
        <prl in="Y" out="J"/>
        <all in="B p" out="y p" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="J"/>
        <!-- Slope lean-to roof slightly up toward curtain wall `W` -->
        <all in="B J" out="J *" steps="1"/>

        <!-- C. THE FULL SCALE: doors, parts, windows, roofs, details -->

        <!-- Open internal doorway between keep floor `f` and turret floor `q` (11 wide, 25 high) on storey 1 and storey 2 -->
        <one in="fwwwwwq" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="5"/>

        <!-- 1. Doors (`part-door` reads `O` and `+`) -->
        <import file="part-door"/>

        <!-- 2. Stairs (`part-stair` reads `T` and `=`) -->
        <import file="part-stair"/>

        <!-- 3. Battlements (`part-battlements` reads `+`: puts merlons `M` on flat tops of `w`, `v`, `W`, `t`, `G`) -->
        <import file="part-battlements"/>

        <!-- 4. Arrow slits (`part-slits` reads `M` and `%`) -->
        <import file="part-slits"/>

        <!-- 5. Windows in Keep (`X` band) and Towers/Gatehouse (`C` band): at least 6 windows on 3+ sides -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <one steps="14">
          <rule in="BC/BC/BC BC/BC/BC BC/BC/BC BC/BC/BC BC/BC/BC BC/BC/BC"
                out="*L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L"/>
        </one>
        <all in="LCCCC" out="*LLLL"/>
        <prl>
          <rule in="C" out="t"/>
        </prl>

        <!-- 6. Pitched terracotta roof `R` over central portion of keep terrace `P` (leaving walk around parapet) or chimney/banner pole -->
        <!-- Let's raise a hip roof `R` over the inner core of keep roof `P` (inset by 4 voxels from parapet `w`), creating a warm red roof accent and 5th height tier! -->
        <prl in="P" out="R"/>
        <all in="R[wM]" out="P*" steps="4"/>
        <all in="RP" out="PP" steps="1"/>
        <!-- Raise hip roof on remaining `R` -->
        <all in="B R" out="R *" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- Banner pole `K` + banner `R` on turret or gatehouse if present -->
        <one in="B B P" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Bridge parapets on `b` where adjacent to moat `a` -->
        <all in="B/a b/a" out="*/* K/*" steps="3"/>

        <!-- Clean up any leftover markers -->
        <prl>
          <rule in="T" out="B"/>
        </prl>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm cartoon medieval voxel style (hex rrggbb) -->
  <color symbol="E" value="7e945c" name="erba"/>
  <color symbol="H" value="7e945c" name="centro" hidden="True"/>
  <color symbol="c" value="b8ad8e" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e9580" name="lastricato" area="courtyard"/>
  <color symbol="r" value="a89878" name="strada"/>
  <color symbol="a" value="4c7c9e" name="acqua del fossato"/>
  <color symbol="b" value="8a6440" name="ponte di legno"/>

  <color symbol="f" value="9c7044" name="pavimento del mastio" area="keep"/>
  <color symbol="q" value="9c7044" name="pavimento della torretta" area="tower"/>
  <color symbol="F" value="855e38" name="solaio di legno"/>
  <color symbol="P" value="8c8880" name="lastrico del terrazzo"/>
  <color symbol="k" value="a87c4f" name="gradini di legno"/>

  <color symbol="w" value="96928a" name="pietra del mastio" area="keep"/>
  <color symbol="v" value="87837b" name="pietra della torretta" area="tower"/>
  <color symbol="W" value="a4a096" name="mura di cinta" area="courtyard"/>
  <color symbol="t" value="7d7972" name="pietra delle torri" area="tower"/>
  <color symbol="G" value="8f8b83" name="corpo di guardia" area="courtyard"/>
  <color symbol="D" value="75716a" name="vera del pozzo" area="courtyard"/>
  <color symbol="M" value="aba69c" name="merlatura"/>

  <color symbol="R" value="b84a39" name="tetto in coppi"/>
  <color symbol="J" value="9e4233" name="tettoia in coppi"/>
  <color symbol="p" value="a69a7c" name="battuto della tettoia" area="porch"/>
  <color symbol="K" value="6e4c2e" name="trave di quercia"/>

  <color symbol="O" value="784d2a" name="porta di legno"/>
  <color symbol="o" value="54351c" name="assi scure della porta"/>
  <color symbol="N" value="69655e" name="stipite di pietra"/>
  <color symbol="U" value="2b2d30" name="feritoia"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>

  <color symbol="#20" value="784d2a" name="vano porta aperto" hidden="True"/>
  <color symbol="#21" value="54351c" name="vano assi aperto" hidden="True"/>

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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); porta: 11 × 10 voxel (0,55 × 0,50 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c cortile, n lastricato, q pavimento della torretta, r strada, f pavimento del mastio, F solaio di legno, P lastrico del terrazzo, w pietra del mastio, v pietra della torretta, W mura di cinta, t pietra delle torri, G corpo di guardia, M merlatura, R tetto in coppi, o assi scure della porta, O porta di legno, N stipite di pietra, U feritoia, L finestra, K trave di quercia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMttMEE
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttMEE
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWcMtttEEE
WWWcccccccccccccccccccccccccccccccccccccccccctttEE
WWWccccccccccccccccccccccccccccccccccccccccccMtMEE
WWWccccccccccccccccccccccccccccccccccccccccccWWWEE
WWWccccccccccccccccccccccccccccccccccccccccccWWWEE
WWWccccccccccccccccccccccccccccccccccccccccccWWWEE
WWWccccccccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccWWWEE
WWWccccccccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccWWWEE
WWWccMMvvMvvvwwPPPPPPPPPPPPPPPPPPPPPPPwwcccccWWWEE
WWWccMvvvvvvvwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccvvvvvvvwwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccvvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccMvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccvvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccvvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccMvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccvvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccvvvRRRRPwwPRRRRRRRRRRRRRRRRRRRRRwwwcccccWWWEE
WWWccMvvvvvvvwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccMvvvvvvvwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccMMcvMcvwwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccWWWEE
WWWccccccccccwwPPPPPPPPPPPPPPPPPPPPPPPwwcccccWWWEE
WWWccccccccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccWWWEE
WWWccccccccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccWWWEE
WWWccccccccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccWWWEE
WWWccccccccccccccccccccnnnnnnncccccccccccccccWWWEE
WWWccccccccccccccccccccnnnnnnncccccccccccccccWWWEE
WWWccccccccccccccccccccnnnnnnncccccccccccccccMMMEE
WWWccccccccccccccccccccnnnnnnncccccccccccccccttMEE
WWWcccccccccccccccccccGnnnnnnncccccccccccccccttEEE
WWWWWWWWWWWWWWWWWWWWMGGGGGGGGGGGMWWWWWWWWWWtttttEE
WWWWWWWWWWWWWWWWWWWWMGGGGGGGGGGGMWWWWWWWWWWttttMEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakkkhkk00
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhk00
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhk00
aaa000000000000000000000000000000000000000000khh00
aaa000000000000000000000000000000000000000000kkk00
aaa000000000000000000000000000000000000000000aaa00
aaa000000000000000000000000000000000000000000aaa00
aaa000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzz00000aaa00
aaa000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzz00000aaa00
aaa000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzz00000aaa00
aaa00zzzxzzxzzzsssssssssssssssssssssszzz00000aaa00
aaa00zxxxxxxzzzstttttttttttttttttttttzzz00000aaa00
aaa00zxxxxxxzzzstttttttttttttttttttttzzz00000aaa00
aaa00xxxxxxxzzzsttuuuuuuuuuuuuuuuuuttzzz00000aaa00
aaa00zxxxxxxzzzsttuuuuuuuuuuuuuuuuuttzzz00000aaa00
aaa00zxxxxxxzzzsttuuvvvvvvvvvvvvvuuttzzz00000aaa00
aaa00xxxxxxxzzzsttuuvvvvvvvvvvvvvuuttzzz00000aaa00
aaa00zxxxxxxzzzsttuuvvwwwwwwwwwvvuuttzzz00000aaa00
aaa00zxxxxxxzzzsttuuvvwwwwwwwwwvvuuttzzz00000aaa00
aaa00xxxxxxxzzzsttuuvvwwwwwwwwwvvuuttzzz00000aaa00
aaa00zxxxxxxzzzsttuuvvwwwwwwwwwvvuuttzzz00000aaa00
aaa00zxxxxxxzzzsttuuvvwwwwwwwwwvvuuttzzz00000aaa00
aaa00zzzxzzxzzzsttuuvvwwwwwwwwwvvuuttzzz00000aaa00
aaa000000000zzzsttuuvvvvvvvvvvvvvuuttzzz00000aaa00
aaa000000000zzzsttuuvvvvvvvvvvvvvuuttzzz00000aaa00
aaa000000000zzzsttuuuuuuuuuuuuuuuuuttzzz00000aaa00
aaa000000000zzzsttuuuuuuuuuuuuuuuuuttzzz00000aaa00
aaa000000000zzzstttttttttttttttttttttzzz00000aaa00
aaa000000000zzzstttttttttttttttttttttzzz00000aaa00
aaa000000000zzzsssssssssssssssssssssszzz00000aaa00
aaa000000000zzzzzzzzzzztttttttzzzzzzzzzz00000aaa00
aaa000000000zzzzzzzzzzztttttttzzzzzzzzzz00000aaa00
aaa000000000zzzzzzzzzzztttttttzzzzzzzzzz00000aaa00
aaa000000000000000000000000000000000000000000aaa00
aaa000000000000000000000000000000000000000000aaa00
aaa000000000000000000000000000000000000000000kkk00
aaa000000000000000000000000000000000000000000khk00
aaaaaaaaaaaaaaaaaaaannzzzzzzzzknnaaaaaaaaakkhhhk00
aaaaaaaaaaaaaaaaaaaankzzzzzzzzkknaaaaaaaaakhhhhh00
aaaaaaaaaaaaaaaaaaaannzzzzzzzzknnaaaaaaaaakkkhkk00
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.....MMM.MM.wwwwwwwwwwwtttttttwwwwwwwwww..........
.....MMM.MM.wwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvwwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vUvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vUvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....vvvvvvvvwwwwwwwwwwGGGGGGGwwwwwwwwww..........
.....ttttttttwwwwwwwMMwGGGGGGGwMMwwwwwww..........
.....ttttttttwwwwwwwMMwGGGGGGGwMMwwwwwww..........
.....ttttttttwwwwwwwMMwGGGGGGGwMMwwwwwww..........
.....ttLLLLttwwwwwwwGGGGGGGGGGGGGwwwwwww..MMMMMM..
.....vvvvvvvvwwwwwwwGGGGGGGGGGGGGwwwwwww..MMMMMM..
.....vvvvvvvvwwwwwwwGGGGGGGGGGGGGwwwwwww..MMMMMM..
.....vvvvvvvvwwwwwwwtttGGGGGGGtttwwwwwww..tttttt..
.....vvvvvvvvwwwwwwwtttGGGGGGGtttwwwwwww..tttttt..
.....vvvvvvvvwwwwwwwtttGGGGGGGtttwwwwwww..tttttt..
.....vvvvvvvvwwwwwwwtttGGGGGGGtttwwwwwww..tLLLLL..
.....vvvvvvvvwwwwwwwGGGNNNNNNNGGGwwwwwww..tLLLLL..
.....vvvvvvvvwwwwwwwGGNoooooooNGGwwwwwww..tLLLLL..
.....vvvvvvvvwwwwwwwGGNoooooooNGGwwwwwww..tttttt..
.....vvvvvvvvwwwwwwwGGNoooooooNGGwwwwwww..tttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
............wwwwwwwwwwwwwwwwwwwwwwwwww....ttt.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwwwwwwwwwwwwwwwwwwww....GGG.....
............wwwwwwwLLwwwwwwLLLwwwwwwww....MMM.....
............wwwwwwwLLwLLwwwLLLwwwwwwww....MMM.....
............wwwwwwwLLwLLwwwLLLwwwwwwww....MMM.....
.....MMMMM..wwwwwwwLLwLLwwwLLLwwwwwwww..MMMMM.....
.....MMMMM..wwwwwwwwwwLLwwwwwwwwwwwwww..MMMMM.....
.....MMMMM..wwwwwwwwwwwwwwwwwwwwwwwwww..MMMMM.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttttt.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttttt.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttttt.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttLLL.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttLLL.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttLLL.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttttt.....
.....ttttt..wwwwwwwwwwwwwwwwwwwwwwwwww..ttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
.....tttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt.....
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWttttt..
WWW..........................................ttt..
WWW..........................................ttt..
WWW..........................................WWW..
WWW..........................................WWW..
WWW..........wwwwwwwwwwwwwwwwwwwwwwwwwww.....WWW..
WWW.........wwwwwwwwwwwwwwwwwwwwwwwwwwww.....WWW..
WWW.........wwwwwwwwwwwwwwwwwwwwwwwwwwww.....WWW..
WWW..vvvvvvvvww......................www.....WWW..
WWW..vvvvvvvvww......................www.....WWW..
WWW..vvvvvvvvww......................www.....WWW..
WWW..vvv....LLL......................www.....WWW..
WWW..vvv....LLL......................www.....WWW..
WWW..vvv....www......................www.....WWW..
WWW..vvv....www......................www.....WWW..
WWW..vvv....www......................www.....WWW..
WWW..vvv....www......................www.....WWW..
WWW..vvv....www......................www.....WWW..
WWW..vvvvvvvvww......................LLL.....WWW..
WWW..vvvvvvvvww......................LLL.....WWW..
WWW..vvvvvvvwww......................LLL.....WWW..
WWW.........www......................www.....WWW..
WWW.........www......................LLL.....WWW..
WWW.........www......................LLL.....WWW..
WWW.........www......................www.....WWW..
WWW.........www......................www.....WWW..
WWW.........www......................www.....WWW..
WWW.........www......................www.....WWW..
WWW.........wwwLLLLLLLwooooooowLLLwwwwww.....WWW..
WWW.........wwwLwLLwLLwooooooowLLLwwwwww.....WWW..
WWW..........wLLLLLLLLwooooooowLLLwwwwww.....WWW..
WWW..........................................WWW..
WWW..........................................WWW..
WWW..........................................ttt..
WWW..........................................ttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
WWWWWWWWWWWWWWWWWWWWGGNoooooooNGGWWWWWWWWWWttttt..
..................................................
..................................................
..................................................
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
..........................................MMM..M..
..........................................M....M..
...........................................M......
..................................................
.............................................MMM..
..................................................
..................................................
.............wwwwwwwwwwwwwwwwwwwwwLLwwww..........
............wwwwwwwwwwwwwwwwwwwwwwLLwwww..........
............wwwwwwwwwwwwwwwwwwwwwwLLwwww..........
.....vvvvvvvvww......................www..........
.....vvvvvvvvww......................www..........
.....vvvvvvvwww......................www..........
.....vvv....www......................www..........
.....vvv....www......................LLL..........
.....vvv....www......................LLL..........
.....vvv....www......................www..........
.....vvv....www......................LLL..........
.....vvv....www......................LLL..........
.....vvv....www......................www..........
.....vvvvvvvvww......................www..........
.....vvvvvvvvww......................www..........
.....vvvvvvvwww......................www..........
............www......................LLL..........
............www......................LLL..........
............www......................www..........
............www......................www..........
............LLL......................www..........
............LLL......................www..........
............www......................www..........
............wwwwwwwwLLwwwwwwwwwwwwwwwwww..........
............wwwwwwwwLLwwwwwwwwwwwwwwwwww..........
.............wwwwwwwLLwwwwwwwwwwwwwwwwww..........
..................................................
..................................................
.............................................MMM..
...............................................M..
....................GGGGGGGGGGGG...........M......
....................GGGGGGGGGGGGG.........M.......
....................GGGGGGGGGGGGG.........MMM..M..
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
.............wwwwwwwwwwwwwwwwwwwwwwwwwww..........
............wwwwwwwwwwwwwwwwwwwwwwwwwwww..........
............wwwwwwwwwwwwwwwwwwwwwwwwwwww..........
.....MM..M..www......................www..........
.....M......www......................www..........
............www......................www..........
.........R..www......................www..........
.....M..RRR.www......................www..........
........RRR.www......................www..........
........RRR.www......................www..........
.....M..RRR.www......................www..........
........RRR.www......................www..........
............www......................www..........
.....M......www......................www..........
.....M......www......................www..........
.....MM..M..www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............www......................www..........
............wwwwwwwwwww.......wwwwwwwwww..........
............wwwwwwwwwww.......wwwwwwwwww..........
.............wwwwwwwww........wwwwwwwwww..........
..................................................
..................................................
..................................................
..................................................
.......................GGGGGGG....................
......................GGGGGGGG....................
......................GGGGGGGG....................
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
EEEEEMttMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00000khkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEMttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00000khhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEtttcMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00000khhkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEttccccccccccccccccccccccccccccccccccccccccccc   00000hhk000000000000000000000000000000000000000000
EEEEEMtMcccccccccccccccccccccccccccccccccccccccccc   00000kkk000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccccccccccccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccccccccccccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccccccccccccccccccccccccccccc   00000aaa0000zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEWWWcccccwwPPPPPPPPPPPPPPPPPPPPPPPwwcccccccccc   00000aaa0000zzzsssssssssssssssssssssszzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzstttttttttttttttttttttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzstttttttttttttttttttttzzzxxzzxzzz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvvcc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzzwxxxxxxx00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvccc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvMcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvvcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxx00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvccc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvMcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvvcc   00000aaa0000zzzxttuuvvwwwwwwwwwvvuuttzzzwxxxxxxx00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvccc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzzxxzzxzzz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzstttttttttttttttttttttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzstttttttttttttttttttttzzz0000000000
EEEEEWWWcccccwwPPPPPPPPPPPPPPPPPPPPPPPwwcccccccccc   00000aaa0000zzzsssssssssssssssssssssszzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzztttttttzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzztttttttzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzztttttttzzzzzzzzzz0000000000
EEEEEWWWcccccccccccccccnnnnnnncccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccnnnnnnncccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEMMMcccccccccccccccnnnnnnncccccccccccccccccccc   00000kkk000000000000000000000000000000000000000000
EEEEEMtccccccccccccccccnnnnnnncccccccccccccccccccc   00000khk000000000000000000000000000000000000000000
EEEEEtttccccccccccccccGnnnnnnncccccccccccccccccccc   00000khhkkaaaaaaaaaannzzzzzzzzknnaaaaaaaaaaaaaaaaa
EEEEEtttttWWWWWWWWWWMGGGGGGGGGGGMWWWWWWWWWWWWWWWWW   00000hhhhkaaaaaaaaaankzzzzzzzzkknaaaaaaaaaaaaaaaaa
EEEEEMtttMWWWWWWWWWWMGGGGGGGGGGGMWWWWWWWWWWWWWWWWW   00000kkkhkaaaaaaaaaannzzzzzzzzknnaaaaaaaaaaaaaaaaa
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEMttMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00000khkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEMttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00000khhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEtttcMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00000khhkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEEEttccccccccccccccccccccccccccccccccccccccccccc   00000hhk000000000000000000000000000000000000000000
EEEEEMtMcccccccccccccccccccccccccccccccccccccccccc   00000kkk000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccccccccccccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccccccccccccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccccccccccccccccccccccccccccc   00000aaa0000zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEWWWcccccwwPPPPPPPPPPPPPPPPPPPPPPPwwvvMvvMMMcc   00000aaa0000zzzsssssssssssssssssssssszzzxxzzxzzz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzstttttttttttttttttttttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvccc   00000aaa0000zzzstttttttttttttttttttttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvvcc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzzwxxxxxxx00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvMcc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvccc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvvcc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzzwxxxxxxx00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvMcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvccc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwPRRRRvvvcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzwxxxxxxx00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvvvvvvMcc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzxxxxxxxz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwvvMcvMMccc   00000aaa0000zzzsttuuvvwwwwwwwwwvvuuttzzzxxzzxzzz00
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzsttuuvvvvvvvvvvvvvuuttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzsttuuuuuuuuuuuuuuuuuttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzstttttttttttttttttttttzzz0000000000
EEEEEWWWcccccwwPRRRRRRRRRRRRRRRRRRRRRPwwcccccccccc   00000aaa0000zzzstttttttttttttttttttttzzz0000000000
EEEEEWWWcccccwwPPPPPPPPPPPPPPPPPPPPPPPwwcccccccccc   00000aaa0000zzzssssxssssssssssssssssszzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzztttttttzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzztttttttzzzzzzzzzz0000000000
EEEEEWWWcccccwwwwwwwwwwwwwwwwwwwwwwwwwwwcccccccccc   00000aaa0000zzzzzzzzzzztttttttzzzzzzzzzz0000000000
EEEEEWWWcccccccccccccccnnnnnnncccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEWWWcccccccccccccccnnnnnnncccccccccccccccccccc   00000aaa000000000000000000000000000000000000000000
EEEEEMMMcccccccccccccccnnnnnnncccccccccccccccccccc   00000kkk000000000000000000000000000000000000000000
EEEEEttccccccccccccccccnnnnnnncccccccccccccccccccc   00000hhk000000000000000000000000000000000000000000
EEEEEtttccccccccccccccGnnnnnnncccccccccccccccccccc   00000khhkkaaaaaaaaaannzzzzzzzzknnaaaaaaaaaaaaaaaaa
EEEEEMttttWWWWWWWWWWMGGGGGGGGGGGMWWWWWWWWWWWWWWWWW   00000khhhkaaaaaaaaaankzzzzzzzzkknaaaaaaaaaaaaaaaaa
EEEEEMtttMWWWWWWWWWWMGGGGGGGGGGGMWWWWWWWWWWWWWWWWW   00000khkkkaaaaaaaaaannzzzzzzzzknnaaaaaaaaaaaaaaaaa
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.23 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 190 nodi, 686 passi, finito in 421 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba, h=honey, u=blue, c=cortile, n=lastricato, q=pavimento della torretta, r=strada, f=pavimento del mastio, F=solaio di legno, P=lastrico del terrazzo, w=pietra del mastio, v=pietra della torretta, W=mura di cinta, t=pietra delle torri, G=corpo di guardia, M=merlatura, R=tetto in coppi, o=assi scure della porta, O=porta di legno, N=stipite di pietra, U=feritoia, L=finestra, K=trave di quercia, C=Cyan, X=X, d=dead, dark, g=green, m=magenta, #90=? (marcatore), #91=? (marcatore), Z=Z.
Alla fine: w 68335, W 33000, v 12917, R 7220, t 7126, L 5904, o 5270, G 5125, c 2675, E 2250, F 1950, f 1800, N 790, M 558, U 378, P 354, O 280, q 150, n 150, r 150, K 11.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-49 all×27, prl×2, one×2: 337 celle x0-18 y2-19 z0, passi 2-53
   #59 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 54
#64-65 all×2: 26250 celle x25-79 y25-74 z1-20, passi 55-74
    #66 all . w → w * passi=22: ×22, 19250 celle x25-79 y25-74 z21-42, passi 75-96, .→w 19250
    #67 all . w → w X passi=10: ×10, 17500 celle x25-79 y25-74 z42-52, passi 97-106, w→X 8750, .→w 8750
#68-70 all×2: 11525 celle x25-79 y25-74 z0-65, passi 107-120
    #71 all . w → w * passi=64: ×64, 17050 celle x25-79 y25-74 z2-79, passi 121-184, .→w 17050
#72-78 all×6, prl×1: 15775 celle x30-74 y30-89 z0-79, passi 185-276
    #80 all . h → h . passi=31: ×31, 111600 celle x30-74 y30-69 z1-32, passi 277-307, h→. 55800, .→h 55800
    #82 all . h → h F (+1) passi=1: ×1, 3600 celle x30-74 y30-69 z32-33, passi 308, h→F 1800, .→h 1800
      r1 . h → h F ×1800; r2 . s → s F ×0
    #83 all . h → h . (+1) passi=31: ×31, 111600 celle x30-74 y30-69 z33-64, passi 309-339, h→. 55800, .→h 55800
      r1 . h → h . ×55800; r2 . s → s . ×0
#84-87 prl×1, all×3: 13500 celle x10-74 y30-69 z1-64, passi 340-384
#88-92 all×5: 18450 celle x10-24 y30-54 z0-74, passi 385-447
#93-94 all×1, prl×1: 12150 celle x15-24 y35-49 z33-73, passi 448-488
    #95 all . W → W * passi=23: ×23, 31625 celle x0-94 y10-89 z1-23, passi 489-511, .→W 31625
#96-177 all×16, one×2, prl×2: 23882 celle x0-94 y10-89 z0-79, passi 512-639
    #178 prl X → w: ×1, 14620 celle x25-79 y25-74 z10-51, passi 640, X→w 14620
#179-188 one×2, all×6, prl×2: 12989 celle x10-94 y10-89 z12-78, passi 641-686
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#12 all Eh/h* → h*/**: le celle cercate c'erano, ma mai disposte come nel pattern
#18 one wwwwwwwwww/whhhhhhhhw/whhhhhhhhw → **********/w**ssss**w/w**ssss**w passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#19 one wwwwwwwww/whhhhhhhw/whhhhhhhw → *********/w**ssss*w/w**ssss*w passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#25 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#26 all cEEEEEEEE → *cccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#27 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all WEEE → *W** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#31 all WE/*W → *W/**: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all EEE/EEW/EWW → ***/**t/*tt: le celle cercate c'erano, ma mai disposte come nel pattern
#33 all t[EW] → *t (+1) passi=2: in quel momento nella griglia non c'erano celle "t"
… e altri 76
Fix it and answer with the whole program.

## Risposta

<!--
  Concept: Forte (medieval fort)
  Parts & plan letters:
  - Keep (mastio): interior `h` (8 to 9 × 8 to 9 cells = 40..45 voxels clear), stair zone `s` (4 × 2 along rear wall, 2 cells landing before & after), keep walls `w` (2 storeys + parapet), keep doorway `d`, attached side watch-turret `u`/`v` (2×3 interior `u` connected to keep, wall `v` rising higher as watchtower).
  - Courtyard & Outer Ring: courtyard `c`, curtain wall `W` (1 cell thick at Large, 2 cells thick at Huge/Gargantuan), corner towers `t` on outer corners, gatehouse `G` on the front axis with gate passage `g`, paved path `n` across yard, road `r` to the front edge, moat `a` and bridge `b` where ground allows.
  - Yard structures (when courtyard grows at Huge/Gargantuan): stone well `Q` (in 5×5 of free yard), timber lean-to / armory shed `p` (at least 6×4 cells = 30×20 voxels against curtain wall).
-->
<sequence values="BHEhucnpqrbafFPkwvWtGMRJoONULKDCXYZ#20#21" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="wvWtGD"/>
  <union symbol="=" values="fFPq"/>
  <union symbol="%" values="wvWtG"/>

  <map scale="1/5 1/5 1" values="BHEhswduvcWtGgnraQpbm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Keep interior around H (8..9 wide x 8..9 deep, >= 40 voxels clear) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="4"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="3"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <!-- Rectangularize h -->
      <all in="hE/*h" out="*h/**"/>
      <all in="Eh/h*" out="h*/**"/>

      <!-- Keep walls w -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Side watch-turret / annex on left or right wall of keep -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/**uuw/**uuw/**uuw/*****" symmetry="(x)" steps="1"/>
      <all in="uE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 3. Stair zone s inside keep: along rear wall (-y), 2 cells landing on small-x, 4 cells s, >=2 cells landing on large-x -->
      <one in="wwwwwwww/whhhhhhhh/whhhhhhhh" out="********/w**ssss**/w**ssss**" symmetry="()" steps="1"/>

      <!-- 4. Courtyard c around keep and turret: 1..2 cells at Large, expands at Huge/Gargantuan -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard where 6+ cells of ground remain (Huge & Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard further at Gargantuan where 8+ cells remain -->
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 5. Curtain wall W around courtyard: 1 cell thick at Large, 2 cells thick if 3+ cells of E remain -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEEE" out="*W**" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 6. Corner towers t on outer corners of curtain wall W (2 to 4 corners) -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>
      <one in="EE/EW" out="**/*t" steps="3"/>
      <all steps="1">
        <rule in="tW" out="*t"/>
        <rule in="t*/*W" out="**/*t"/>
      </all>

      <!-- 7. Way out: from H straight to the front (+y), 3 cells wide -->
      <all in="H/h" out="m/m" symmetry="()" steps="1"/>
      <all in="m/[hs]" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/[Wt]" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <!-- Widen door d, yard path n, gate passage g, road r to 3 cells wide -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="g[Wt]" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Gatehouse bastions G flanking the gate passage g -->
      <all in="g[Wt]" out="*G" symmetry="(x)" steps="2"/>
      <all in="G/W" out="*/G" symmetry="(x)" steps="1"/>
      <all in="W/G" out="G/*" symmetry="(x)" steps="1"/>
      <!-- Restore interior markers m and H -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 8. Courtyard additions when space fits (Huge & Gargantuan):
           lean-to shed p (6 wide x 4 deep = 30 x 20 voxels clear) against curtain wall, well Q in 5x5 of open yard -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/*pppppp*/*pppppp*/*pppppp*/*pppppp*/********" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 9. Outer moat a and bridge b where 5+ cells of E remain beyond curtain wall -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[WtG]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Ensure road crosses moat as bridge b -->
      <all in="[rg]/a" out="*/b" symmetry="()"/>
      <all in="b/a" out="*/b" symmetry="()"/>
      <all in="ba" out="*b" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BHEhucnpqrbafFPkwvWtGMRJoONULKDCXYZSTyI#90#91#92#93#94#95#96#97" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="ccccc/cDDDc/cDADc/cDDDc/ccccc"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>

      <sequence symmetry="(xy)">
        <!-- B. THE HEIGHTS: columns by steps -->
        <!-- Mark corner posts Y in lean-to p before rising -->
        <all in="pc" out="Y*"/>
        <all in="p*/*c" out="Y*/**"/>

        <!-- 1. Keep walls `w`: 66 high (z=0..65) with window bands `X` on storey 1 (z=10..19) and storey 2 (z=42..51) -->
        <all in="B w" out="w *" steps="10"/>
        <all in="B w" out="w X" steps="10"/>
        <all in="B w" out="w *" steps="22"/>
        <all in="B w" out="w X" steps="10"/>
        <all in="B w" out="w *" steps="13"/>

        <!-- Keep doorway column `d`: z=0 is floor `n`, z=1 is door seed `O` (15 wide x 5 thick, right above z=0 floor!), z=2..65 is `w` using head `I` -->
        <all in="B d" out="I n" steps="1"/>
        <all in="B I" out="I O" steps="1"/>
        <all in="B I" out="I w" steps="63"/>
        <prl in="I" out="w"/>

        <!-- Gatehouse passage `g`: z=0 is floor `n`, z=1 is door seed `O`, z=2..45 is `G` (46 high) using head `Z` -->
        <all in="B g" out="Z n" steps="1"/>
        <all in="B Z" out="Z O" steps="1"/>
        <all in="B Z" out="Z G" steps="43"/>
        <prl in="Z" out="G"/>

        <!-- Gatehouse flanking bastions `G`: 46 high (z=0..45) with window band `C` at z=32..39 -->
        <all in="B G" out="G *" steps="32"/>
        <all in="B G" out="G C" steps="8"/>
        <all in="B G" out="G *" steps="5"/>

        <!-- Keep interior `h` & stair zone `s`:
             z=0: floor `f` (area="keep")
             z=1: `s` leaves `T` (stair strip, 20 long x 10 wide), `h` leaves `B`
             z=1..31: 31 layers of air `B`
             z=32: slab `F`
             z=33..63: 31 layers of air `B`
             z=64: roof ceiling slab `P` -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="P"/>
          <rule in="s" out="P"/>
        </prl>

        <!-- Side watch-turret `u` (interior) and `v` (wall):
             `v` rises to z=72 (taller than keep's 65).
             `u` has floor `q` at z=0, slab `F` at z=32, roof `P` at z=71 -->
        <all in="B v" out="v *" steps="12"/>
        <all in="B v" out="v C" steps="8"/>
        <all in="B v" out="v *" steps="24"/>
        <all in="B v" out="v C" steps="8"/>
        <all in="B v" out="v *" steps="20"/>

        <all in="B u" out="u q" steps="1"/>
        <all in="B u" out="u B" steps="31"/>
        <all in="B u" out="u F" steps="1"/>
        <all in="B u" out="u B" steps="38"/>
        <prl in="u" out="P"/>

        <!-- Curtain wall `W`: rises 24 high (z=0..23) -->
        <all in="B W" out="W *" steps="23"/>

        <!-- Corner towers `t`: rises 40 high (z=0..39) with window band `C` -->
        <all in="B t" out="t *" steps="26"/>
        <all in="B t" out="t C" steps="6"/>
        <all in="B t" out="t *" steps="7"/>

        <!-- Well `Q` -> stone rim `D` rises 7 voxels, water `A` stays at z=0..3 -->
        <all in="B D" out="D *" steps="6"/>
        <all in="B A" out="A a" steps="3"/>
        <prl in="A" out="a"/>

        <!-- Lean-to shed `p` and corner posts `Y`:
             Floor `p` at z=0, posts `Y` rise 33 (z=0..32) as wood `K` (32 clear air above floor `p`), roof `J` at z=33..34 -->
        <all in="B Y" out="Y K" steps="33"/>
        <prl in="Y" out="J"/>
        <all in="B p" out="y p" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="J"/>
        <all in="B J" out="J *" steps="1"/>

        <!-- C. THE FULL SCALE: doors, parts, windows, roofs, details -->

        <!-- Open internal doorway between keep (`f`/`F`) and side turret (`q`/`F`):
             Put door seed `O` at z=1 (above z=0 floor `f` and `q`), widened to 11 wide x 5 thick! -->
        <one in="B/f w/w w/w w/w w/w w/w B/q" out="*/* O/* O/* O/* O/* O/* */*" symmetry="(xy)" steps="1"/>
        <all in="O/w w/w" out="*/* O/*" symmetry="(xy)" steps="10"/>

        <!-- 1. Doors (`part-door` reads `O` and `+`) -->
        <import file="part-door"/>

        <!-- 2. Stairs (`part-stair` reads `T` and `=`) -->
        <import file="part-stair"/>

        <!-- 3. Battlements (`part-battlements` reads `+`: puts merlons `M` on flat tops of `w`, `v`, `W`, `t`, `G`) -->
        <import file="part-battlements"/>

        <!-- 4. Arrow slits (`part-slits` reads `M` and `%`) -->
        <import file="part-slits"/>

        <!-- 5. Windows in Keep (`X` band) and Towers/Gatehouse (`C` band): at least 6 windows on 3+ sides -->
        <one steps="16">
          <rule in="BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <one steps="14">
          <rule in="BC/BC/BC BC/BC/BC BC/BC/BC BC/BC/BC BC/BC/BC BC/BC/BC"
                out="*L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L"/>
        </one>
        <all in="LCCCC" out="*LLLL"/>
        <prl in="C" out="t"/>

        <!-- 6. Pitched terracotta roof `R` over central core of keep terrace `P` (inset from parapet `w`) -->
        <prl in="P" out="R"/>
        <all in="R[wM]" out="P*" steps="4"/>
        <all in="RP" out="PP" steps="1"/>
        <all in="B R" out="R *" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Banner pole `K` on terrace `P` -->
        <one in="B B P" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="9"/>

        <!-- Bridge parapets on `b` where adjacent to moat `a` -->
        <all in="B/a b/a" out="*/* K/*" steps="3"/>

        <!-- Clean up any leftover markers -->
        <prl>
          <rule in="T" out="B"/>
        </prl>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm cartoon medieval voxel style (hex rrggbb) -->
  <color symbol="E" value="7e945c" name="erba"/>
  <color symbol="H" value="7e945c" name="centro" hidden="True"/>
  <color symbol="c" value="b8ad8e" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e9580" name="lastricato" area="courtyard"/>
  <color symbol="r" value="a89878" name="strada"/>
  <color symbol="a" value="4c7c9e" name="acqua del fossato"/>
  <color symbol="b" value="8a6440" name="ponte di legno"/>

  <color symbol="f" value="9c7044" name="pavimento del mastio" area="keep"/>
  <color symbol="q" value="9c7044" name="pavimento della torretta" area="tower"/>
  <color symbol="F" value="855e38" name="solaio di legno"/>
  <color symbol="P" value="8c8880" name="lastrico del terrazzo"/>
  <color symbol="k" value="a87c4f" name="gradini di legno"/>

  <color symbol="w" value="96928a" name="pietra del mastio" area="keep"/>
  <color symbol="v" value="87837b" name="pietra della torretta" area="tower"/>
  <color symbol="W" value="a4a096" name="mura di cinta" area="courtyard"/>
  <color symbol="t" value="7d7972" name="pietra delle torri" area="tower"/>
  <color symbol="G" value="8f8b83" name="corpo di guardia" area="courtyard"/>
  <color symbol="D" value="75716a" name="vera del pozzo" area="courtyard"/>
  <color symbol="M" value="aba69c" name="merlatura"/>

  <color symbol="R" value="b84a39" name="tetto in coppi"/>
  <color symbol="J" value="9e4233" name="tettoia in coppi"/>
  <color symbol="p" value="a69a7c" name="battuto della tettoia" area="porch"/>
  <color symbol="K" value="6e4c2e" name="trave di quercia"/>

  <color symbol="O" value="784d2a" name="porta di legno"/>
  <color symbol="o" value="54351c" name="assi scure della porta"/>
  <color symbol="N" value="69655e" name="stipite di pietra"/>
  <color symbol="U" value="2b2d30" name="feritoia"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>

  <color symbol="#20" value="784d2a" name="vano porta aperto" hidden="True"/>
  <color symbol="#21" value="54351c" name="vano assi aperto" hidden="True"/>

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
