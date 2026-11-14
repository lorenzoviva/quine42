# model.sculpt · gemini-4-carbon · 27 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
Concept: Fattoria (medieval cozy farmhouse complex).
Parts & plan letters:
- Main two-storey farmhouse (h: floor, s: stair zone, w: stone/plaster walls, d: front door) anchored slightly behind centre H, golden ratio ~8:5 against the barn.
- Barn / stable wing (a: barn floor, v: timber-stone walls, u: yard doorway) attached to one side of the farmhouse (chosen by seed).
- Lean-to porch / shed (p: post bays, l: covered floor) at least 4 cells deep (20 voxels) and 7+ wide (35+ clear) along the other side or front.
- Farmyard (c: beaten earth yard, q: stone well, y: haystack) enclosed by a low dry-stone fence (z) with a gate opening to the front path (r).
- Round stone silo / dovecote tower (t) with battlements & slits on an outer corner of the yard or barn (chosen by seed).
- At Gargantuan (40x40 plan), where extra ground extends beyond the yard fence: plowed vegetable fields (g) with irrigation/furrow strips, orchard plots with fruit trees (j: orchard grass, e: tree), and an outer boundary hedge/ditch.
Seeds vary: farmhouse depth (8 or 9 cells), side of the barn wing (left or right), side/position of the lean-to porch, which corner holds the dovecote silo, positions of well, haystacks, and orchard trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavulpcqyzrtgjei" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Shift anchor 3 cells toward back (-y) so yard & road fit nicely in front (+y) -->
      <all in="E/E/E/H" out="i/E/E/E" symmetry="()" steps="1"/>
      <prl in="H" out="E"/>

      <!-- Main farmhouse interior (h): 8 or 9 wide (x), 7 or 8 deep (y) -->
      <all in="E/[ih]" out="h/*" symmetry="()" steps="3"/>
      <all in="[ih]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[ih]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="i" out="h"/>

      <!-- Farmhouse walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): along back inner wall, 2 cells landing on small-x, 4 cells stair, 3 cells upper landing on large-x -->
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- Barn wing (a, walls v) on one side of the farmhouse (x-symmetry picks left or right): 6x6 interior (30x30 voxels) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="aaaaa*/aaaaa*/aaaaa*/aaaaa*/aaaaa*/aaaaa*" symmetry="(x)" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v" symmetry="()"/>
      <all in="E/a" out="v/*" symmetry="()"/>
      <all in="a/E" out="*/v" symmetry="()"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="vE/*w" out="*v/**"/>

      <!-- Lean-to shed / porch (l floor, p outer post row): 4 cells deep (20 voxels), 7-8 cells long (35-40 voxels) on the opposite side of farmhouse -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*lllp/*lllp/*lllp/*lllp/*lllp/*lllp/*lllp" symmetry="(x)" steps="1"/>

      <!-- Front farmyard (c) extending in front (+y) of farmhouse, barn, and lean-to -->
      <all in="[wvlp]/E" out="*/c" symmetry="()" steps="6"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>
      <all in="c/E" out="*/c" symmetry="()" steps="2"/>
      <!-- If plenty of room in front (Gargantuan), expand yard 2 more cells forward -->
      <all in="c/E/E/E/E/E/E/E" out="*/c/c/*/*/*/*/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Barn doorway (u) opening onto the farmyard (3 cells wide = 15 voxels) -->
      <one in="aaaaa/vvvvv/ccccc" out="*****/*uuu*/*****" symmetry="()" steps="1"/>

      <!-- Dry-stone yard fence (z) around the farmyard -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Dovecote / grain silo tower (t: 4x4 cells = 20x20 voxels) on one outer front corner of the yard or barn -->
      <one in="zzE/zzE/EEE" out="ttt/ttt/ttt" symmetry="(x)" steps="1"/>
      <all in="t[Ezc]" out="*t" steps="1"/>
      <all in="t*/*[Ezc]" out="**/*t" steps="1"/>

      <!-- Front door (d: 3 cells = 15 voxels) in middle of farmhouse front wall, path (r) across yard & through fence to front edge -->
      <one in="hhhhh/wwwww/ccccc" out="*****/*ddd*/**r**" symmetry="()" steps="1"/>
      <all in="r/[czE]" out="*/r" symmetry="()"/>
      <all in="r[czE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Haystack (y: 2x2 cells) in yard or behind barn -->
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>
      <!-- Stone well (q: 2x2 cells) in the farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Gargantuan outer farm features: only grown where at least 6 cells of empty soil E remain beyond the buildings/yard -->
      <!-- Plowed vegetable field (g) on sides/back where wide ground exists -->
      <all in="[zwvlp]EEEEEEE" out="*gggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>
      <!-- Orchard grass (j) on remaining wide ground -->
      <all in="[zwvlpg]EEEEEE" out="*jjjjj*" steps="1"/>
      <all in="jE/*j" out="*j/**" steps="4"/>
      <!-- Fruit trees (e) inside orchard plots -->
      <one in="jjj/jjj/jjj" out="***/*e*/***" steps="4"/>
      <!-- Second haystack in fields/orchard if space permits -->
      <one in="ggg/ggg/ggg" out="***/*y*/***" steps="1"/>
    </sequence>
  </map>

  <color symbol="h" value="215,185,140" name="pavimento di casa" area="house"/>
  <color symbol="s" value="195,160,115" name="vano scala" area="house"/>
  <color symbol="w" value="230,218,195" name="muro intonacato" area="house"/>
  <color symbol="d" value="135,85,50" name="porta di casa" area="house"/>
  <color symbol="a" value="185,155,110" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="165,125,85" name="parete del fienile" area="barn"/>
  <color symbol="u" value="125,80,45" name="portone del fienile" area="barn"/>
  <color symbol="l" value="195,175,140" name="tettoia" area="porch"/>
  <color symbol="p" value="140,95,55" name="pilastri della tettoia" area="porch"/>
  <color symbol="c" value="205,188,150" name="aia" area="yard"/>
  <color symbol="q" value="145,150,155" name="pozzo" area="yard"/>
  <color symbol="y" value="225,195,85" name="pagliaio" area="yard"/>
  <color symbol="z" value="155,150,140" name="muretto a secco" area="yard"/>
  <color symbol="r" value="180,165,135" name="sentiero" area="road"/>
  <color symbol="t" value="175,165,150" name="colombaia" area="tower"/>
  <color symbol="g" value="150,125,85" name="orto arato" area="field"/>
  <color symbol="j" value="145,175,95" name="frutteto" area="orchard"/>
  <color symbol="e" value="85,135,65" name="albero da frutto" area="orchard"/>
  <color symbol="i" value="200,200,200" name="centro"/>
</sequence>
