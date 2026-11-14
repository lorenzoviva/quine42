# model.sculpt · gemini-4-carbon · 61 s

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
