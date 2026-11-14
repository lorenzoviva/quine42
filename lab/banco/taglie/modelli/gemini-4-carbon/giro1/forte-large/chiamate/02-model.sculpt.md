# model.sculpt · gemini-4-carbon · 78 s

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
  Parts & plan letters:
  - Keep (mastio): interior `h` (8 to 9 × 8 to 9 cells), stair zone `s` (4 × 2 along rear or front wall), keep walls `w`, keep doorway `d`, attached side watch-turret `u`/`v` (3×3 interior `u`, wall `v`).
  - Courtyard & Outer Ring: courtyard `c`, curtain wall `W` (1 cell thick at Large, 2 cells thick at Huge/Gargantuan), corner towers `t` (3×3 or 4×4 on outer corners when space allows), gatehouse `G` on the front axis, paved path `n` across yard, road `r` to the front edge, moat `a` and bridge `b` at Gargantuan.
  - Yard structures (when courtyard grows at Huge/Gargantuan): stone well `Q` (in 5×5 of free yard), timber lean-to / armory shed `p` (4×4 against curtain wall).
  What seeds change: keep depth/width (8 vs 9), side watch-turret position (left or right flank, front or back), stair along back vs front wall, which corners get towers or where well and lean-to settle in the yard.
  What fits by size:
  - Large (20×20): Keep (10–11 cells) + side turret + narrow courtyard + thin curtain wall `W` with front gatehouse `G` and road `r`.
  - Huge (30×30): Expanded courtyard (8:5 ratio around keep), thick 2-cell curtain wall `W`, corner towers `t`, courtyard well `Q`, lean-to `p`.
  - Gargantuan (40×40): Even broader bailey, 4 full corner towers, well `Q`, lean-to `p`, plus outer water moat `a` crossed by bridge `b`.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswduvcWtGnraQpbmi" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Keep interior around H (shifted slightly back if room allows, 8..9 wide x 8..9 deep) -->
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

      <!-- 2. Side watch-turret / annex on left or right wall of keep (if 5 cells of E exist) -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/**uuw/**uuw/**uuw/*****" symmetry="(x)" steps="1"/>
      <all in="u[Ew]" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 3. Stair zone s inside keep: along back wall (or side-back), 2 cells landing on small-x, 4 cells s, 2 cells landing on large-x -->
      <one in="wwwwwwwwww/whhhhhhhhw/whhhhhhhhw" out="**********/w**ssss**w/w**ssss**w" symmetry="()" steps="1"/>
      <one in="wwwwwwwww/whhhhhhhw/whhhhhhhw" out="*********/w**ssss*w/w**ssss*w" symmetry="()" steps="1"/>

      <!-- 4. Courtyard c around keep and turret: at least 2 cells at Large, expands at Huge/Gargantuan -->
      <all in="[wv]E" out="*c" steps="2"/>
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

      <!-- 6. Corner towers t on outer corners of curtain wall W (only where 2 cells of E exist outside corner, i.e. Huge/Gargantuan or open corners) -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>
      <!-- Also allow 1-2 corner bastions at Large if 1 cell of E exists at front/back corners -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all steps="2">
        <rule in="tW" out="*t"/>
        <rule in="t*/*W" out="**/*t"/>
      </all>

      <!-- 7. Way out: from H straight to the front (+y), 3 cells wide -->
      <all in="H/h" out="m/m" symmetry="()" steps="1"/>
      <all in="m/[hs]" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- Widen door d, yard path n, gatehouse G, road r to 3 cells wide -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Gatehouse bastions: thicken G one cell into c or E if available and widen G cheeks by 1 cell of G -->
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <!-- Restore interior markers m and H -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 8. Courtyard additions when space fits (Huge & Gargantuan): lean-to shed p against curtain wall, well Q in open yard -->
      <one in="WWWWWW/cccccc/cccccc/cccccc/cccccc" out="******/*pppp*/*pppp*/*pppp*/******" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 9. Outer moat a and bridge b where 4+ cells of E remain beyond curtain wall (Gargantuan) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[WtG]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Ensure road crosses moat as bridge b -->
      <all in="ra" out="*b" symmetry="(x)"/>
      <all in="[rG]/a" out="*/b" symmetry="()"/>
      <all in="b/a" out="*/b" symmetry="()"/>
      <all in="ba" out="*b" symmetry="(x)" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" value="126,148,92" name="erba"/>
  <color symbol="H" value="220,200,150" name="centro"/>
  <color symbol="h" value="210,190,155" name="sala del mastio" area="keep"/>
  <color symbol="s" value="185,150,105" name="scala del mastio" area="keep"/>
  <color symbol="w" value="135,132,126" name="muro del mastio" area="keep"/>
  <color symbol="d" value="140,90,55" name="porta del mastio" area="keep"/>
  <color symbol="u" value="195,178,148" name="torretta laterale" area="tower"/>
  <color symbol="v" value="122,118,114" name="muro della torretta" area="tower"/>
  <color symbol="c" value="178,168,136" name="cortile" area="courtyard"/>
  <color symbol="W" value="150,146,138" name="mura di cinta" area="courtyard"/>
  <color symbol="t" value="118,114,110" name="torre angolare" area="tower"/>
  <color symbol="G" value="164,156,144" name="corpo di guardia" area="courtyard"/>
  <color symbol="n" value="160,152,134" name="lastricato" area="courtyard"/>
  <color symbol="r" value="168,154,126" name="strada"/>
  <color symbol="Q" value="90,130,165" name="pozzo" area="courtyard"/>
  <color symbol="p" value="158,112,72" name="tettoia d'armi" area="porch"/>
  <color symbol="a" value="76,124,158" name="fossato"/>
  <color symbol="b" value="138,102,66" name="ponte"/>
  <color symbol="m" value="200,100,100" name="traccia"/>
  <color symbol="i" value="200,100,100" name="interno"/>
</sequence>

## What the game made of it
It does not run: large, seed 1: riga 106, <color>: "value" è un colore esadecimale (rrggbb), non "126,148,92"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

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
