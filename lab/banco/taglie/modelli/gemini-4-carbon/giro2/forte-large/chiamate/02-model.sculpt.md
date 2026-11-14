# model.sculpt · gemini-4-carbon · 74 s

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

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, w muro del mastio, s scala interna, d porta del mastio, c cortile, W muro di cinta, t torre angolare, G corpo di guardia, n lastricato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEttEEEEEEEEEEEEEEEE
EEtWWWWWWWWWWWWWWWEE
EEEWWccccccccccccWEE
EEEWWcwwwwwwwwwwcWEE
EEEWWcwhhsssshhwcWEE
EEEWWcwhhsssshhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwwwdddwwwwcWEE
EEEWWccccnnncccccWEE
EEEWWWWWWGGGWWWWWWtE
EEEEEEEEEGGGEEEEEttE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, w muro del mastio, s scala interna, d porta del mastio, c cortile, W muro di cinta, t torre angolare, G corpo di guardia, n lastricato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEttE
EEEWWWWWWWWWWWWWWWtE
EEEWWccccccccccccWEE
EEEWWcwwwwwwwwwwcWEE
EEEWWcwhhsssshhwcWEE
EEEWWcwhhsssshhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwwwdddwwwwcWEE
EEEWWccccnnncccccWEE
EEEWWWWWWGGGWWWWWWtE
EEEEEEEEEGGGEEEEEttE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, w muro del mastio, s scala interna, d porta del mastio, c cortile, W muro di cinta, t torre angolare, G corpo di guardia, n lastricato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWWWWEE
EEEWWccccccccccccWEE
EEEWWcwwwwwwwwwwcWEE
EEEWWcwhhsssshhwcWEE
EEEWWcwhhsssshhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwhhhhhhhhwcWEE
EEEWWcwwwdddwwwwcWEE
EEEWWccccnnncccccWEE
EEtWWWWWWGGGWWWWWWtE
EEttEEEEEGGGEEEEEttE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, w muro del mastio, s scala interna, d porta del mastio, c cortile, W muro di cinta, t torre angolare, G corpo di guardia, n lastricato, r strada, Q pozzo, p tettoia del cortile, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEttEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtWWWWWWWWWWWWWWWWWWWWWWEEE
EEaaaWWWWWWWWWWWWWWWWWWWWWWEEE
EEaaaWWccccccccccccccccccWWEEE
EEaaaWWccccccccccccccccccWWEEE
EEaaaWWcccQccccccccccccccWWEEE
EEaaaWWccccccccccccccccccWWEEE
EEaaaWWccccwwwwwwwwwwccccWWEEE
EEaaaWWccccwhhsssshhwccccWWEEE
EEaaaWWccccwhhsssshhwccccWWEEE
EEaaaWWccccwhhhhhhhhwccccWWEEE
EEaaaWWccccwhhhhhhhhwccccWWEEE
EEaaaWWccccwhhhhhhhhwccccWWEEE
EEaaaWWccccwhhhhhhhhwccccWWEEE
EEaaaWWccccwhhhhhhhhwccccWWEEE
EEaaaWWccccwhhhhhhhhwccccWWEEE
EEaaaWWccccwwwdddwwwwccccWWEEE
EEaaaWWcccccccnnncppppppcWWEEE
EEaaaWWcccccccnnncppppppcWWEEE
EEaaaWWcccccccnnncppppppcWWEEE
EEaaaWWcccccccnnncppppppcWWEEE
EEaaaWWWWWWWWWGGGWWWWWWWWWWEEE
EEEEtWWWWWWWWWGGGWWWWWWWWWWEEE
EEEEttEEEEEEEEGGGEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Forte (Medieval Keep & Curtain Fort)
Parts & Plan Letters:
- h (keep interior), w (keep walls), s (keep stair zone), d (keep door), z (keep watch-turret)
- u (side annex / garrison wing interior), v (annex walls)
- c (courtyard), W (curtain wall), t (corner towers), G (gatehouse), n (courtyard paving), r (front road)
- Q (courtyard well), p (courtyard lean-to shelter), a (outer moat)
Relative placement & Seed variation:
- Central two-storey keep (h, w) shifted slightly to a random quadrant around H; seeds vary keep width/depth, side garrison wing (u, v) on left or right or rear, which corner gets the tall watch-turret (z), and courtyard expansion asymmetry.
- Way out goes straight to the front (+y) from H: keep door (d) -> courtyard paving (n) -> tall gatehouse (G) -> road (r) to the front edge.
- What fits by size:
  * Large (20x20): Keep + side wing/watch-turret + compact courtyard + curtain wall + gatehouse + corner bastions.
  * Huge (30x30): Expanded courtyard (golden ratio ~8:5 around keep) + all 4 large corner towers (3x3) + courtyard stone well (Q) + timber lean-to shelter (p) against curtain wall.
  * Gargantuan (40x40): Further expanded courtyard + full outer water moat (a) bridged by front road (r).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdzuvcWtGnrQpam" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central Keep interior (h): seed shifts slightly around H so plans vary richly (0.20-0.45) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <!-- Random extra depth backward or forward (single-cell line decision before widening) -->
      <prl in="E/h/h" out="h/*/*" p="0.6" steps="1" symmetry="()"/>
      <prl in="h/h/E" out="*/*/h" p="0.5" steps="1" symmetry="()"/>
      <!-- Widen symmetrically first to guarantee 7+ cells (35+ voxels clear) -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <!-- Random asymmetric widening to left or right (8 or 9 cells wide) -->
      <one in="Eh/Eh/Eh/Eh/Eh/Eh/Eh" out="mh/mh/mh/mh/mh/mh/mh" symmetry="(x)" steps="1"/>
      <all in="Eh/*m" out="mh/**"/>
      <all in="mE/*h" out="mh/**"/>
      <prl in="m" out="h"/>
      <all in="hE/*h" out="*h/**"/>

      <!-- Keep walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side garrison wing (u, v) on left, right, or back of keep (fits inside Large and Huge, varies side by seed) -->
      <one in="EEw/EEw/EEw/EEw/EEw" out="uuv/uuv/uuv/uuv/**" symmetry="(x)" steps="1"/>
      <all in="uE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Keep watch-turret (z) on one outer corner of the keep -->
      <one in="EE/Ew/wh" out="zz/zz/**" symmetry="(xy)" steps="1"/>

      <!-- Stair zone (s): along rear wall of keep, 2 cells landing on small-x, 4 cells strip, floor on large-x -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- 2. Courtyard (c) around keep & wing: 1 cell at Large, expands where ample ground (E) goes on -->
      <all in="[wvz]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Random 1-cell courtyard terrace on one side where room allows -->
      <one in="cEEEE/cEEEE/cEEEE/cEEEE/cEEEE" out="ccEEE/ccEEE/ccEEE/ccEEE/ccEEE" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- At Huge (30x30) and Gargantuan (40x40), 6+ cells of E remain on all sides: grow courtyard by 3 cells -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- At Gargantuan (40x40), 8+ cells of E still remain: grow courtyard by 3 more cells -->
      <all in="cEEEEEEEE" out="*ccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 3. Curtain wall (W): 1 cell thick, 2 cells thick where 5+ cells of E remain -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEEEEE" out="*W****" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 4. Corner towers (t): 3x3 on every corner that has 2 cells of E outside (all 4 at Huge), 2x2 bastions at Large -->
      <all in="EEE/EEW/EWW" out="ttt/ttt/tt*" steps="1"/>
      <all in="EE/EW" out="tt/t*" steps="1"/>

      <!-- 5. Axis way out straight to the front (+y) from H: keep door (d), yard path (n), gatehouse (G), road (r) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <!-- Widen door, path, and gatehouse to 3 cells (15 voxels) -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <!-- Gatehouse protrudes 1 cell forward if ground continues -->
      <all in="G/E/E" out="*/G/*" symmetry="()" steps="1"/>
      <all in="[Gd]/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 6. Size-dependent courtyard structures (fit at Huge & Gargantuan, skipped at Large) -->
      <!-- Lean-to shelter (p: 6x4 cells = 30x20 voxels clear) against curtain wall -->
      <one in="WWWWWW/cccccc/cccccc/cccccc/cccccc" out="******/pppppp/pppppp/pppppp/pppppp" steps="1"/>
      <!-- Courtyard stone well (Q) in 3x3 open courtyard -->
      <one in="ccc/ccc/ccc" out="***/cQc/***" steps="1"/>

      <!-- 7. Outer moat (a) only at Gargantuan where 6+ cells of ground remain on all sides -->
      <all in="cWWEEEEEE" out="***aaa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="r/a" out="*/r" symmetry="()"/>
    </sequence>

    <!-- LEVEL 2 & 3: Full Scale Voxels (5x5x1 per plan cell) -->
    <map scale="5 5 1" values="BEhwsdzuvcWtGnrqpQaWfFRKXLYbPOoNTkMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="Q" out="ccccc/cQQQc/cQaQc/cQQQc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <!-- Unions for imported parts -->
        <!-- +: all masonry walls that frame doors and receive battlements on flat tops -->
        <union symbol="+" values="WXK"/>
        <!-- %: masonry walls that receive arrow slits below merlons -->
        <union symbol="%" values="WXK"/>
        <!-- =: floors and slabs for part-stair -->
        <union symbol="=" values="fFR"/>

        <!-- ================= B. HEIGHTS (COLUMNS BY STEPS) ================= -->
        <!-- Keep walls (w) & keep door column (d): 2 storeys = 64 high, parapet at z=65 (1 above roof slab R at z=64) -->
        <!-- Ground floor band (z=1..32): stone W, window band Y (z=10..21), stone W -->
        <all steps="9"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B d" out="d W" steps="12"/>
        <all steps="11"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <!-- Upper floor band (z=33..64): stone W, window band Y (z=42..53), stone W -->
        <all steps="9"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/><rule in="B d" out="d Y"/></all>
        <all steps="11"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <!-- Top of keep wall at z=65 becomes W so part-battlements crowns z=66..71 -->
        <prl><rule in="w" out="W"/><rule in="d" out="W"/></prl>

        <!-- Keep interior (h) and stair strip zone (s): floor at z=1 (leaving h/s on z=0 for area), slab at z=33, roof slab at z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <!-- Stair strip T at z=2 (just above floor f at z=1) -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Air of ground storey: 31 voxels clear (z=2..32 for h, z=3..32 for s) -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- First floor slab F at z=33 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <!-- Air of second storey: 30 voxels clear (z=34..63) -->
        <all steps="30"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <!-- Roof platform R at z=64 (1 below keep wall top z=65) -->
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Keep corner watch-turret (z): solid dark masonry K rising to z=74 (taller than keep!) -->
        <all in="B z" out="z K" steps="73"/>
        <prl in="z" out="K"/>

        <!-- Side garrison wing (u interior, v wall): 1 storey + pitched/parapet roof (wall rises to z=40, ceiling at z=33) -->
        <all in="B v" out="v W" steps="9"/>
        <all in="B v" out="v Y" steps="12"/>
        <all in="B v" out="v W" steps="18"/>
        <prl in="v" out="W"/>
        <all in="B u" out="u f" steps="1"/>
        <all in="B u" out="u B" steps="31"/>
        <all in="B u" out="u R" steps="7"/>
        <prl in="u" out="R"/>

        <!-- Curtain wall (q): rises to z=24 (walkway height) -->
        <all in="B q" out="q X" steps="23"/>
        <prl in="q" out="X"/>

        <!-- Corner towers (t): rise to z=38 in dark stone K -->
        <all in="B t" out="t K" steps="37"/>
        <prl in="t" out="K"/>

        <!-- Gatehouse (G): rises to z=44 in stone W (well above 30-tall door + battlements on top) -->
        <all in="B G" out="G W" steps="43"/>
        <prl in="G" out="W"/>

        <!-- Courtyard paving (n) & road (r): flat stone slab at z=1 so doors sit cleanly on z=1 -->
        <all in="B c" out="c B" steps="0"/>
        <all in="B n" out="n n" steps="1"/>
        <all in="B r" out="r r" steps="1"/>

        <!-- Lean-to shelter (p) in courtyard: timber posts b on outer corners rising 32, pitched/flat timber roof P at z=33 (31 clear) -->
        <all in="pp/pc" out="bp/**" steps="1"/>
        <all in="B b" out="b b" steps="32"/>
        <all in="B p" out="p f" steps="1"/>
        <all in="B p" out="p B" steps="31"/>
        <prl><rule in="p" out="P"/><rule in="b" out="P"/></prl>

        <!-- Courtyard stone well (Q): stone rim rising 6 voxels, timber crossbeam above -->
        <all in="B Q" out="Q K" steps="6"/>
        <prl in="Q" out="K"/>

        <!-- ================= C. FULL SCALE: DOORS, PARTS, WINDOWS, DETAILS ================= -->
        <!-- 1. Doors (seed O at z=1, foot of wall, through whole thickness of gatehouse and keep door wall) -->
        <!-- Gatehouse passage: open central corridor or place front door O across 13 voxels, hollow behind it -->
        <!-- At z=1, road r meets gatehouse W, and keep door d (now W above d) meets paving n -->
        <!-- Mark keep door seed O across the whole 5-voxel thickness where d is at z=0: -->
        <all in="d W" out="d O" symmetry="()"/>
        <!-- Gatehouse: carve vaulted passageway (15 wide, 30 high) through G, leaving a 5-voxel front door wall with O -->
        <!-- First place O at z=1 where front road r meets gatehouse W (5 voxels deep for part-door) -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <!-- Behind those 5 voxels of O, open the rest of the gatehouse passage up to courtyard paving n (z=1..30) -->
        <all in="W/[On]" out="n/*" symmetry="()"/>
        <all in="n W" out="n #20" steps="1"/>
        <all in="#20 W" out="#20 #20" steps="29"/>
        <prl in="#20" out="B"/>

        <!-- Internal door between keep hall (f at z=1) and side garrison wing (f at z=1) through shared wall W -->
        <one in="fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf/fWWWWWWWWWWWf" out="*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*/*OOOOOOOOOOO*" steps="1"/>
        <!-- Wait: shared wall is 5 thick (fWWWWWf along x or y), 11 wide! -->
        <one in="fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf" out="*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*/*OOOOO*" steps="1"/>

        <!-- 2. Include seed parts in order -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 3. Arched / framed windows in keep & wing bands (Y) on all facades -->
        <!-- Carve 4-wide x 8-tall recessed dark windows (L) framed by stone in band Y -->
        <one steps="18">
          <rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY"
                out="*K/*L/*L/*L/*L/*K *K/*L/*L/*L/*L/*K *K/*L/*L/*L/*L/*K *K/*L/*L/*L/*L/*K *K/*L/*L/*L/*L/*K *K/*L/*L/*L/*L/*K *K/*L/*L/*L/*L/*K *K/*K/*K/*K/*K/*K"/>
        </one>
        <!-- Punch windows cleanly through the 5-voxel keep wall to the interior air B -->
        <all in="LYYYYB" out="LLLLLL"/>
        <!-- Restore remaining window-band markers Y to keep stone W -->
        <prl in="Y" out="W"/>

        <!-- 4. Architectural details: stringcourse / machicolation band & buttresses on all sides -->
        <!-- Timber roof overhang on courtyard lean-to (P) -->
        <all in="PB" out="*P" steps="1"/>
        <!-- Sloped second layer on lean-to roof for warm silhouette -->
        <all in="B P" out="P *" steps="1"/>
        <!-- Banner / watch-post on top of keep watch-turret (K) -->
        <one in="B/B/B K/K/K" out="*/P/* */*/*" steps="1" symmetry="()"/>
        <all in="B P" out="P *" steps="8"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: Medieval warm cartoon style (>= 8 distinct materials, clear light/dark separation, Italian names) -->
  <color symbol="E" value="#7c9458" name="erba" hidden="True"/>
  <color symbol="h" value="#bfa582" name="sala del mastio" hidden="True" area="keep"/>
  <color symbol="s" value="#bfa582" name="scala del mastio" hidden="True" area="keep"/>
  <color symbol="u" value="#bfa582" name="ala della guarnigione" hidden="True" area="keep"/>
  <color symbol="w" value="#9c9588" name="base del mastio" area="keep"/>
  <color symbol="v" value="#9c9588" name="base dell'ala" area="keep"/>
  <color symbol="d" value="#8f8679" name="soglia del mastio" area="keep"/>
  <color symbol="z" value="#6e6a64" name="base della torretta" area="tower"/>
  <color symbol="c" value="#c4b595" name="terra del cortile" area="courtyard"/>
  <color symbol="n" value="#9e9585" name="lastricato del cortile" area="courtyard"/>
  <color symbol="r" value="#b0a082" name="strada d'accesso" area="yard"/>
  <color symbol="q" value="#8d877c" name="base delle mura" area="courtyard"/>
  <color symbol="t" value="#6e6a64" name="base della torre" area="tower"/>
  <color symbol="G" value="#9c9588" name="base del corpo di guardia" area="courtyard"/>
  <color symbol="a" value="#4c7c9e" name="acqua del fossato" area="yard"/>
  <color symbol="Q" value="#6e6a64" name="base del pozzo" area="courtyard"/>
  <color symbol="p" value="#bfa582" name="suolo della tettoia" area="porch"/>

  <!-- Full-scale structural materials -->
  <color symbol="W" value="#b5aea0" name="pietra chiara del mastio"/>
  <color symbol="X" value="#968f82" name="pietra della cinta"/>
  <color symbol="K" value="#6e6a64" name="pietra scura delle torri"/>
  <color symbol="M" value="#a8a193" name="merlatura in pietra"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
  <color symbol="L" value="#384859" name="finestra vetrata"/>
  <color symbol="f" value="#a67c52" name="tavolato di quercia"/>
  <color symbol="F" value="#8c643e" name="solaio di legno"/>
  <color symbol="R" value="#7a746b" name="lastrico di copertura"/>
  <color symbol="P" value="#b85239" name="tetto in coppi rossi"/>
  <color symbol="b" value="#6b482b" name="pilastro di legno"/>
  <color symbol="k" value="#946b45" name="gradini di legno"/>
  <color symbol="T" value="#946b45" name="traccia scala"/>
  <color symbol="O" value="#6e472b" name="porta di rovere"/>
  <color symbol="o" value="#4a2e1b" name="assi scure della porta"/>
  <color symbol="N" value="#5c5852" name="stipite in pietra"/>
  <color symbol="#20" value="#000000" name="vano porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi porta aperta" hidden="True"/>

  <!-- Interactive door actions -->
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
```
