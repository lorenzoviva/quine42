# model.sculpt · gemini-4-carbon · 37 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- Main farmhouse: h (house floor, 9 or 10 × 7 cells inside), s (stair zone along back wall, 4 × 2 cells), w (house walls), d (front door, 3 cells wide).
- Porch / lean-to: p (lean-to roofed area, at least 6 × 4 cells = 30 × 20 voxels, attached to a side of the house or in front).
- Haystacks: y (haystacks behind the house, 2 × 2 cells).
- Farmyard & access: c (farmyard around the house), r (front road straight from door to front edge), x (wooden fence enclosing the yard where ground remains).
- Huge / Gargantuan additions (only where ground fits):
  - Barn / annex: a (barn interior, 6 × 5 cells), v (barn walls), b (barn wide doorway facing the yard).
  - Silo / stone dovecote tower: t (3 × 3 tower on a corner of the house/yard, crowned with battlements & slits).
  - Well: q (well in a 5 × 5 open patch of yard).
  - Cultivated field / vegetable plots & trees: g (furrowed field alongside the yard), z (fruit tree in grassy orchard margin).
What seeds change:
- House width (9 or 10 interior cells, golden ratio ~9:6 or 10:6 against depth), which side the lean-to porch attaches to, whether a dovecote tower stands on the back-left or back-right, barn placement on the opposite side or across the yard, haystack & well & tree positions.
What fits at each size:
- Large (20 × 20): Farmhouse (11-12 × 9 with walls) + side lean-to porch (4 × 6) + front road + compact yard + haystacks behind.
- Huge (30 × 30): Expands the yard, encloses it with a wooden fence, adds the separate barn/stable, stone dovecote tower, well, and cultivated field plots.
- Gargantuan (40 × 40): Wider fenced farmyard, larger cultivated fields, and fruit trees in the orchard around the farmstead.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdpycrxavbtqgzm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse interior around H: 3 behind, 2 in front (6 deep = 30 voxels), 4 left & 4 right + 1 optional (9 or 10 wide = 45-50 voxels) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="4"/>
      <prl in="hE/EE" out="*h/**" p="0.5" steps="1" symmetry="()"/>
      <all in="hE/*h" out="*h/**" symmetry="(xy)"/>

      <!-- House walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside back wall: 2 cells landing on small-x, 4 cells stair, floor after on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Lean-to porch (4 wide × 6 deep = 20 × 30 voxels clear) on left or right wall of the house -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="pppp*/pppp*/pppp*/pppp*/pppp*/pppp*" symmetry="(x)" steps="1"/>

      <!-- Front door (3 cells = 15 voxels wide) on front wall and road straight to front edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Initial compact farmyard around house, porch, and road -->
      <all in="[wpr]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard where extra ground exists (Huge & Gargantuan) -->
      <all in="cEEEEEE" out="*ccccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystacks behind the house (fits at Large and up) -->
      <one in="cc/cc/ww" out="yy/yy/**" symmetry="()" steps="2"/>

      <!-- Dovecote / grain silo stone tower (3x3) attached to a back corner if yard space permits (Huge+) -->
      <one in="cccc/cccw/cccw/cwww" out="*ttt/*tt*/*tt*/****" symmetry="(x)" steps="1"/>

      <!-- Barn / annex in expanded yard (6x4 interior, walls v, doorway b facing yard; fits Huge+) -->
      <one in="cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vvvvvv**/vaaaav**/vaaaav**/vaaaav**/vaaaav**/vvbbvv**" symmetry="(xy)" steps="1"/>

      <!-- Well in open 5x5 patch of yard (Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Wooden fence around yard where at least 2 cells of ground remain outside, leaving road open -->
      <all in="cEE" out="*x*" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="r/x" out="*/r" symmetry="()"/>

      <!-- Cultivated field plot outside the fence (Huge & Gargantuan) -->
      <one in="xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE" out="*ggggg*/*ggggg*/*ggggg*/*ggggg*/*ggggg*/*ggggg*" symmetry="(xy)" steps="2"/>

      <!-- Orchard fruit trees in remaining open grass (mainly Gargantuan / outer Huge) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/*z***/*****/*****" steps="4"/>
    </sequence>

    <color symbol="E" value="124,148,92" name="prato"/>
    <color symbol="H" value="180,140,100" name="centro"/>
    <color symbol="h" value="196,158,112" name="pavimento casa" area="house"/>
    <color symbol="s" value="172,132,88" name="vano scala" area="house"/>
    <color symbol="w" value="224,212,190" name="muro intonacato" area="house"/>
    <color symbol="d" value="122,78,46" name="ingresso" area="house"/>
    <color symbol="p" value="168,136,98" name="tettoia" area="porch"/>
    <color symbol="y" value="218,186,84" name="covone di fieno" area="yard"/>
    <color symbol="c" value="188,168,132" name="aia" area="yard"/>
    <color symbol="r" value="164,146,116" name="sentiero" area="road"/>
    <color symbol="x" value="132,94,58" name="staccionata" area="yard"/>
    <color symbol="a" value="160,126,84" name="fienile" area="barn"/>
    <color symbol="v" value="178,94,72" name="muro del fienile" area="barn"/>
    <color symbol="b" value="140,108,72" name="portone fienile" area="barn"/>
    <color symbol="t" value="148,144,136" name="colombaia" area="tower"/>
    <color symbol="q" value="96,138,168" name="pozzo" area="yard"/>
    <color symbol="g" value="116,92,64" name="orto" area="field"/>
    <color symbol="z" value="84,126,68" name="albero da frutto" area="orchard"/>
    <color symbol="m" value="200,160,120" name="traccia"/>
  </map>
</sequence>
