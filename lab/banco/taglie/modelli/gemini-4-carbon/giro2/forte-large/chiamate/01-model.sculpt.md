# model.sculpt · gemini-4-carbon · 31 s

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
Concept: Forte (Medieval Keep & Curtain Fort)
Parts & Plan Letters:
- h (keep interior), w (keep walls), s (keep stair zone), d (keep door), z (keep turret)
- c (courtyard), W (curtain wall), t (corner towers), G (gatehouse), n (courtyard paving), r (front road)
- Q (courtyard well), p (courtyard lean-to shelter), a (outer moat)
Relative placement & Seed variation:
- Central two-storey keep (h, w) anchored on H; seeds vary keep depth (8 or 9 cells), keep width (8 or 9 cells), stair side (rear wall), and which rear/side corner gets a tall watch-turret (z).
- Way out goes straight to the front (+y): keep door (d) -> courtyard paving (n) -> tall gatehouse (G) -> road (r) to the front edge.
- What fits by size:
  * Large (20x20): Keep with corner watch-turret + narrow courtyard + curtain wall + gatehouse + 1-2 corner towers where room allows.
  * Huge (30x30): Expanded courtyard (golden ratio ~8:5 around keep) + thicker curtain wall + all 4 corner towers (3x3) + courtyard well (Q) + lean-to porch (p) against curtain wall.
  * Gargantuan (40x40): Further expanded courtyard + outer water moat (a) spanned by bridge on road (r) + extra watchtowers/trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdzcWtGnrQpam" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central Keep interior (h): 8 or 9 cells wide, 8 or 9 deep (40-45 voxels clear, well above 28) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="h/h/h/h" out="m/m/m/m" steps="1" symmetry="()"/>
      <all in="[hm]E" out="*h" steps="1" symmetry="()"/>
      <prl in="m" out="h"/>
      <all in="hE/*h" out="*h/**"/>

      <!-- Keep walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): along rear wall, 2 cells landing on small-x, 4 cells strip, floor on large-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Keep watch-turret (z) on one rear corner of the keep -->
      <one in="EE/Ew/wh" out="zz/zz/**" symmetry="(x)" steps="1"/>

      <!-- 2. Courtyard (c) around keep: 1 cell at Large, expands where ample ground (E) goes on -->
      <all in="[wz]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- At Huge (30x30) and Gargantuan (40x40), at least 6 cells of E remain outside c: grow courtyard by 3 cells -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- At Gargantuan (40x40), still 8+ cells of E remain: grow courtyard by 2 more cells -->
      <all in="cEEEEEEEE" out="*cc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 3. Curtain wall (W): 1 cell thick at Large, 2 cells thick when 4+ cells of E remain -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEEEE" out="*W***" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 4. Corner towers (t) on outer corners of curtain wall where 2 cells of E exist -->
      <all in="EEE/EEW/EWW" out="ttt/ttt/tt*" steps="1"/>
      <!-- At Large, if curtain wall is 1 cell thick with 1 cell of E outside, place compact corner bastions -->
      <one in="EE/EW" out="tt/t*" steps="2"/>

      <!-- 5. Axis way out to the front (+y): keep door (d), yard path (n), gatehouse (G), road (r) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <!-- Widen door, path, and gatehouse to 3 cells (15 voxels); gatehouse protrudes 1 cell forward if space -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="G/E" out="*/G" symmetry="()" steps="1"/>
      <all in="[Gd]/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 6. Size-dependent courtyard structures (fit at Huge & Gargantuan, skipped at Large) -->
      <!-- Lean-to shelter (p: 4x5 cells = 20x25 voxels, >30x20 required if 6x4) -> make 6x4 cells (30x20 voxels) against curtain wall -->
      <one in="WWWWWW/cccccc/cccccc/cccccc/cccccc" out="******/pppppp/pppppp/pppppp/pppppp" steps="1"/>
      <!-- Courtyard stone well (Q) in 3x3 open courtyard -->
      <one in="ccc/ccc/ccc" out="***/cQc/***" steps="1"/>

      <!-- 7. Outer moat (a) at Gargantuan where 5+ cells of ground remain past curtain wall -->
      <all in="WEEEEE" out="*aaa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Ensure front road bridges cleanly across moat -->
      <all in="r/a" out="*/r" symmetry="()"/>
    </sequence>
  </map>

  <color symbol="E" value="#7c9458" name="erba"/>
  <color symbol="H" value="#c8b898" name="centro"/>
  <color symbol="h" value="#bfa582" name="sala del mastio" area="keep"/>
  <color symbol="s" value="#a38358" name="scala interna" area="keep"/>
  <color symbol="w" value="#8c8881" name="muro del mastio" area="keep"/>
  <color symbol="z" value="#6e6a64" name="torretta di guardia" area="tower"/>
  <color symbol="d" value="#6b442a" name="porta del mastio" area="keep"/>
  <color symbol="c" value="#c7ba9d" name="cortile" area="courtyard"/>
  <color symbol="n" value="#9e9585" name="lastricato" area="courtyard"/>
  <color symbol="W" value="#9c978e" name="muro di cinta" area="courtyard"/>
  <color symbol="t" value="#78746d" name="torre angolare" area="tower"/>
  <color symbol="G" value="#857f75" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#b0a184" name="strada" area="yard"/>
  <color symbol="p" value="#a86438" name="tettoia del cortile" area="porch"/>
  <color symbol="Q" value="#547a99" name="pozzo" area="courtyard"/>
  <color symbol="a" value="#4f7ca1" name="fossato" area="yard"/>
  <color symbol="m" value="#d9534f" name="segno"/>
</sequence>
