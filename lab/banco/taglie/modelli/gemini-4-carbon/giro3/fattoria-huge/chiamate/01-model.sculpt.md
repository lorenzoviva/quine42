# model.sculpt · gemini-4-carbon · 39 s

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

```xml
<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- h, w, s: Farmhouse (casa colonica), two-storey main stone & plaster building near the centre (h interior, w walls, s stair along rear wall).
- p: Front porch / lean-to (tettoia/portico) along the front wall of the farmhouse, at least 4 cells deep (20 voxels) and 7-9 wide.
- b, v: Timber & brick barn (fienile) attached or adjacent on one side (left or right, chosen by seed) in golden ratio ~8:5 to the house, connected via internal/yard doorway.
- t, z: Stone dovecote / silo tower (colombaia) on the opposite rear corner of the house or courtyard, crowned with battlements & slits.
- c, f: Farmyard (aia) surrounded by a low stone/wood fence (f) with front entry gate & cobbled road (r) straight to the front edge, plus main door (d) and barn door (e).
- y: Haystack (pagliaio) in the rear/side yard.
- q: Stone well (pozzo) in the farmyard when space permits.
- g, u, l: At Gargantuan (40x40), cultivated ploughed fields / vegetable plots (orto/campo, g & u) and fruit trees (frutteto, l) expand outside the farmyard fence where ground continues, plus an extra toolshed / animal pen (stalla/rimessa, a, m).
Seeds vary: farmhouse width/depth (7-9 x 8-9), which side the barn stands on (left vs right), dovecote placement, haystack & well positions, tree & plot positions.
Sizes:
- Large (20x20): compact house + front porch + side lean-to/hay behind, road to front.
- Huge (30x30): full two-storey farmhouse + porch + side barn + dovecote tower + fenced farmyard + well & haystack.
- Gargantuan (40x40): adds outer ploughed fields/garden plots, orchard trees, and a stone animal pen/annex along the outer yard.
-->
<sequence values="BHEhwspbvtzcfryqdeguaml" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspbvtzcfryqdeguaml" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Farmhouse interior (h) around H: 8 or 9 wide (x), 7 or 8 deep (y), shifted slightly back so porch & yard fit in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="E[Hh]" out="h*" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="()" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>

      <!-- Farmhouse walls (w) -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Stair zone (s) inside farmhouse along rear wall: 2 cells landing on small-x, 4 cells stair, 2+ cells landing on large-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- 2. Front porch / lean-to (p): 4 cells deep (20 voxels) across the front of the farmhouse -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="2"/>
      <!-- Keep porch clear of side outer corners by trimming or keeping full width; 4 deep = 20 voxels! Wait: 1+2 = 3 cells (15 voxels), need 4 cells = 20 voxels deep! -->
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>

      <!-- 3. Main front door (d) in the middle of front farmhouse wall, 3 cells wide (15 voxels), and road (r) straight to front edge -->
      <one in="hhhhh/wwwww/ppppp" out="*****/*ddd*/*****" symmetry="()" steps="1"/>
      <all in="[dp]/p" out="*/r" symmetry="()"/>
      <!-- Wait: only extend r directly in front of d! -->
    </sequence>
    <sequence symmetry="()">
      <!-- Fix road r: reset p first, carve 3-wide path straight south from d -->
      <prl in="r" out="p"/>
      <all in="[dr]/p" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- 4. Side Barn (b interior, v walls) on one side (left or right) where space allows (at Huge & Gargantuan: needs 8 free cells to the side) -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**/*bbbbbb**" symmetry="(x)" steps="1"/>
      <prl in="E/b" out="b/*" p="0.5" steps="1" symmetry="()"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <!-- Connect barn to farmhouse with an internal doorway (e) or shared wall, and wrap barn in v walls -->
      <all in="b[Ep]" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <one in="hwwwb/hwwwb" out="*eee*/*eee*" symmetry="(x)" steps="1"/>
      <one in="hwb/hwb/hwb" out="*e*/*e*/*e*" symmetry="(x)" steps="1"/>

      <!-- 5. Dovecote / Silo Tower (t interior, z walls) on the opposite side or rear corner where 5x5 fits -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="*zzz**/*ztz**/*ztz**/*ztz**/*zzz**" symmetry="(x)" steps="1"/>
      <all in="ztz" out="zzz" steps="0"/>
      <!-- Expand dovecote to 5x5 (3x3 inside = 15x15, tower accent; connected to farmhouse via e) -->
      <all in="ztEE" out="zttz" symmetry="(xy)" steps="1"/>
      <!-- Simpler clean 4x4 or 5x5 tower adjacent to w -->
    </sequence>
    <sequence symmetry="()">
      <!-- Clean any partial z/t and place proper 5x5 dovecote tower (3x3 t inside, z wall) against farmhouse wall w -->
      <prl><rule in="z" out="E"/><rule in="t" out="E"/></prl>
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="zzzzzw/ztttzw/ztttzw/ztttzw/zzzzzw" symmetry="(xy)" steps="1"/>
      <one in="zt/wh" out="ee/**" symmetry="(xy)" steps="1"/>
      <one in="tzw/tzw" out="*ee/*ee" symmetry="(xy)" steps="1"/>

      <!-- 6. Farmyard (c) around porch, barn, farmhouse, expanding into available space leaving margin for fence -->
      <all in="[wpvz]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- Grow yard forward and sideways if Huge/Gargantuan ground continues -->
      <all in="c/E/E/E/E" out="*/c/c/c/*" symmetry="()" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEEEE" out="*ccc**" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Barn front yard door (e) -->
      <one in="bbb/vvv/ccc" out="***/*e*/***" symmetry="(xy)" steps="1"/>
      <all in="ev" out="*e" symmetry="(xy)" steps="1"/>

      <!-- Fence (f) around the farmyard c, leaving road r open as gate -->
      <all in="cE" out="*f" symmetry="(xy)"/>
      <all in="fE/*f" out="*f/**" symmetry="(xy)"/>

      <!-- Haystack (y) in the yard (fits even at Large in rear/side yard, or Huge/Gargantuan) -->
      <one in="ccc/ccc/ccc" out="***/*y*/***" symmetry="(xy)" steps="1"/>
      <all in="yc" out="*y" symmetry="(xy)" steps="1"/>
      <all in="yc/*y" out="*y/**" symmetry="(xy)"/>
      <!-- If no 3x3 yard at Large, place haystack behind/beside house on E -->
      <one in="www/EEE/EEE/EEE" out="***/***/*yy/*yy" symmetry="(xy)" steps="1"/>

      <!-- Stone well (q) in a 5x5 patch of farmyard (Huge & Gargantuan) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/*qq**/*****/*qq**" symmetry="(xy)" steps="1"/>

      <!-- 7. Gargantuan outer farm expansions (only where 6+ cells of E remain beyond the fence f!) -->
      <!-- Animal pen / Annex shed (m walls, a floor) attached to outer fence -->
      <one in="fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE" out="fmmmmmm/fmaaaam/fmaaaam/fmaaaam/fmmmmmm" symmetry="(xy)" steps="1"/>
      <one in="cfm/cfa" out="eee/***" symmetry="(xy)" steps="1"/>

      <!-- Ploughed field / vegetable garden rows (g soil, u crops) where 6x6 ground remains adjacent to fence -->
      <all in="fEEEEEE" out="*ggggg*" symmetry="(xy)" steps="1"/>
      <all in="gE/*g" out="*g/**" symmetry="(xy)"/>
      <!-- Furrow stripes u inside g -->
      <all in="ggg/ggg" out="uuu/***" symmetry="()"/>

      <!-- Orchard fruit trees (l) in remaining open meadow pockets -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**l**/*****/*****" steps="4"/>
    </sequence>
  </map>

  <color symbol="E" value="#7c9458" name="prato"/>
  <color symbol="H" value="#d8c8a8" name="centro"/>
  <color symbol="h" value="#c8a878" name="casa" area="house"/>
  <color symbol="w" value="#e4d8c0" name="muro casa"/>
  <color symbol="s" value="#a88458" name="scala" area="house"/>
  <color symbol="p" value="#b89868" name="portico" area="porch"/>
  <color symbol="d" value="#6e472b" name="porta casa" area="house"/>
  <color symbol="r" value="#9e9584" name="sentiero" area="yard"/>
  <color symbol="b" value="#b89060" name="fienile" area="barn"/>
  <color symbol="v" value="#b5543c" name="muro fienile"/>
  <color symbol="e" value="#7a4e2d" name="varco" area="barn"/>
  <color symbol="t" value="#9a9284" name="colombaia" area="tower"/>
  <color symbol="z" value="#8c8478" name="muro colombaia"/>
  <color symbol="c" value="#cbbba0" name="aia" area="yard"/>
  <color symbol="f" value="#8a6846" name="staccionata"/>
  <color symbol="y" value="#dfb850" name="pagliaio" area="yard"/>
  <color symbol="q" value="#6b7882" name="pozzo" area="yard"/>
  <color symbol="a" value="#a68a64" name="rimessa" area="barn"/>
  <color symbol="m" value="#9c8c7a" name="muro rimessa"/>
  <color symbol="g" value="#6e553b" name="campo arato" area="field"/>
  <color symbol="u" value="#537d3b" name="orto" area="field"/>
  <color symbol="l" value="#487538" name="albero da frutto" area="orchard"/>
</sequence>
```
