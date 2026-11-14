# model.sculpt · gemini-4-carbon · 72 s

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

## Your program so far
<!--
Concept: Fattoria (Italian medieval farmhouse estate)
Parts & Plan Letters:
- h, w, s, d: Two-storey farmhouse (h: room floor, w: stone/plaster walls, s: stair zone 4x2 along back wall, d: front door 3 cells wide). Centered near H, golden ratio ~9x7 interior.
- a, v, i: Attached barn / stalla wing on one side of the farmhouse (a: barn floor, v: barn wall, i: internal doorway).
- p: Front porch / lean-to (tettoia) 4 cells deep along the front door, open on sides.
- l: Side/back lean-to shed with hay on the opposite side or behind the barn.
- c, z, g: Farmyard (aia) in front and around the buildings (c: dirt/cobble yard), enclosed by a low dry-stone wall/fence (z) with an open farm gate (g) aligned with the road (r) to the front edge.
- q: Stone well (pozzo) placed in a 3x3 clear spot of the yard.
- j, u: Round brick silo / dovecote tower (colombaia, j: floor, u: wall) attached to a back corner of the barn or yard.
- f, y: Cultivated vegetable garden / ploughed field rows (orto, f) and fruit trees (frutteto, y) outside the yard wall where ground permits.
What seeds change: Depth/width of farmhouse by 1 cell, which side (left/right) the barn wing stands on, which side the hay lean-to stands on, position of the dovecote tower, position of the well in the yard, placement of orchard trees and fields.
What fits by size:
- Large (20x20): Farmhouse (h,w,s,d) + front porch (p) + small barn/hay lean-to + road (r).
- Huge (30x30): Farmhouse + full barn wing (a,v) + hay lean-to (l) + dovecote tower (j,u) + enclosed farmyard (c,z,g) + well (q).
- Gargantuan (40x40): All of Huge + expanded farmyard + ploughed field plots (f) + orchard trees (y) around the estate.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapvilczgqrjufym" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Main Farmhouse body around H: 9 or 10 wide, 7 or 8 deep inside -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- 2. Stair zone along the back interior wall: 2 cells landing on small-x, 4 cells stair, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- 3. Front door (3 cells wide) on the south (+y) wall, centered on H, and road straight to front edge -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 4. Front porch (tettoia, 4 cells deep = 20 voxels, 5 cells wide = 25 voxels) in front of door if space allows -->
      <all in="wdddw/EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/ppppp/ppppp/ppppp/ppppp/*****" symmetry="()" steps="1"/>

      <!-- 5. Road from front door / porch straight to the front edge (+y) -->
      <all in="[dp]/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="pE" out="*r" symmetry="()" steps="0"/>

      <!-- 6. Barn wing (stalla) attached to left or right wall where 8 cells of space exist (Huge & Gargantuan) -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="iaaaaaaav/vaaaaaaav/vaaaaaaav/vaaaaaaav/vaaaaaaav/vaaaaaaav/vvvvvvvvv" symmetry="(x)" steps="1"/>
      <!-- Close top wall of barn if open -->
      <all in="E/a" out="v/*" symmetry="()"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <!-- Widen internal passage i between house and barn to 3 cells -->
      <all in="iw" out="*i" symmetry="(xy)" steps="2"/>

      <!-- 7. Hay lean-to (fienile/tettoia, 4 cells deep = 20 voxels, 6 long = 30 voxels) on free house/barn wall -->
      <one in="wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE" out="wllll*/wllll*/wllll*/wllll*/wllll*/wllll*" symmetry="(xy)" steps="1"/>

      <!-- 8. Dovecote / Silo tower (colombaia, 3x3 interior, 5x5 outer) on an outer back corner of barn or house -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEvvv" out="uuuuu/ujjju/ujjju/ujjju/uujuu" symmetry="(x)" steps="1"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEwww" out="uuuuu/ujjju/ujjju/ujjju/uujuu" symmetry="(x)" steps="1"/>

      <!-- 9. Farmyard (aia, c) expanding in front and around buildings where room exists (Huge & Gargantuan) -->
      <all in="[wvpul]EEE" out="*c**" symmetry="(xy)" steps="1"/>
      <all in="cEEE" out="*c**" symmetry="(xy)" steps="4"/>
      <!-- Expand yard further if plenty of space remains (Gargantuan) -->
      <all in="cEEEEEEEE" out="*ccc*****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 10. Low stone/wood yard wall (z) around the yard, with gate (g) where road (r) crosses -->
      <all in="cEE" out="*z*" symmetry="(xy)"/>
      <all in="zE/*z" out="*z/**" symmetry="(xy)"/>
      <all in="zr" out="g*" symmetry="(xy)"/>
      <!-- Ensure road inside the yard becomes paved path / road up to porch/door -->
      <all in="r/c" out="*/r" symmetry="()"/>
      <all in="c/r" out="r/*" symmetry="()" steps="0"/>

      <!-- 11. Stone well (pozzo, q) in a 4x4 patch of open farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" symmetry="(xy)" steps="1"/>

      <!-- 12. Cultivated fields (orto, f) and fruit orchard trees (frutteto, y) outside the yard (Gargantuan) -->
      <one in="zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE" out="z*fffff*/z*fffff*/z*fffff*/z*fffff*/z*fffff*/z*fffff*" symmetry="(xy)" steps="3"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/*y***/*****/*****" symmetry="(xy)" steps="5"/>
    </sequence>
  </map>

  <color symbol="E" value="138,154,91" name="erba"/>
  <color symbol="H" value="200,80,80" name="centro"/>
  <color symbol="h" value="198,156,109" name="pavimento casa" area="house"/>
  <color symbol="w" value="226,214,192" name="muro intonacato" area="house"/>
  <color symbol="s" value="175,130,85" name="vano scala" area="house"/>
  <color symbol="d" value="120,75,45" name="porta ingresso" area="house"/>
  <color symbol="p" value="185,165,135" name="portico" area="porch"/>
  <color symbol="a" value="168,142,105" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="182,102,78" name="muro stalla in mattoni" area="barn"/>
  <color symbol="i" value="150,115,80" name="passaggio stalla" area="barn"/>
  <color symbol="l" value="218,188,98" name="tettoia fienile" area="barn"/>
  <color symbol="j" value="160,150,140" name="interno colombaia" area="tower"/>
  <color symbol="u" value="168,92,70" name="muro colombaia" area="tower"/>
  <color symbol="c" value="196,182,152" name="aia" area="yard"/>
  <color symbol="z" value="142,138,130" name="muretto a secco" area="yard"/>
  <color symbol="g" value="175,162,135" name="varco aia" area="yard"/>
  <color symbol="r" value="178,164,134" name="sentiero" area="yard"/>
  <color symbol="q" value="110,125,140" name="pozzo" area="yard"/>
  <color symbol="f" value="124,98,68" name="orto arato" area="field"/>
  <color symbol="y" value="88,128,68" name="albero da frutto" area="orchard"/>
  <color symbol="m" value="200,100,100" name="traccia"/>
</sequence>

## What the game made of it
It does not run: huge, seed 1: riga 89, <color>: "value" è un colore esadecimale (rrggbb), non "138,154,91"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Fattoria (Italian medieval farmhouse estate)
Parts & Plan Letters:
- h, w, s, d: Two-storey farmhouse (h: room floor, w: plastered stone walls, s: stair zone 4x2 along back wall, d: front door 3 cells wide). Centered near H, ~9x8 interior.
- a, v, i: Attached barn / stalla wing on left or right side of farmhouse (a: barn floor, v: brick barn wall, i: internal doorway).
- p: Front porch / lean-to (portico) 4 cells deep (20 voxels) and 7 cells wide (35 voxels clear) along the front door.
- l: Hay lean-to shed (tettoia del fieno, 4 cells deep = 20 voxels, 7 long = 35 voxels) on free house/barn wall.
- u, j: Dovecote / silo tower (colombaia, u: brick tower wall, j: tower floor) crowned with battlements & arrow slits on a back corner.
- c, z, g, r, q: Farmyard (aia, c) enclosed by a dry-stone wall (z) with open gate (g) on the road (r) to the front edge, plus stone well (q).
- n, y: Ploughed vegetable garden rows (orto, n) and fruit orchard trees (frutteto, y) outside the yard at Gargantuan size.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapvilczgqrjunym" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Main Farmhouse body around H: 9 or 10 wide, 7 or 8 deep inside -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- 2. Stair zone along the back interior wall: 2 cells landing on small-x, 4 cells stair, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- 3. Front door (3 cells wide) on the south (+y) wall, centered on H -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 4. Front porch (portico, 4 cells deep = 20 voxels, 7 cells wide = 35 voxels) in front of door -->
      <all in="wwdddww/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/ppppppp/ppppppp/ppppppp/ppppppp/*******" symmetry="()" steps="1"/>

      <!-- 5. Road from front door / porch straight to the front edge (+y) -->
      <all in="d/p" out="*/p" symmetry="()" steps="0"/>
      <all in="[dp]/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <one in="r/E" out="*/r" symmetry="()" steps="0"/>
      <!-- Trim road width to 3 cells centered under door -->
      <all in="w/p/r" out="*/*/E" symmetry="()"/>

      <!-- 6. Barn wing (stalla) attached to left or right wall where 8 cells of space exist -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="wvvvvvvv*/iaaaaaav*/iaaaaaav*/iaaaaaav*/waaaaaav*/waaaaaav*/wvvvvvvv*" symmetry="(x)" steps="1"/>

      <!-- 7. Hay lean-to (tettoia del fieno, 4 cells deep = 20 voxels, 7 long = 35 voxels) on free house or barn wall -->
      <one in="[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE" out="*llll*/*llll*/*llll*/*llll*/*llll*/*llll*/*llll*" symmetry="(xy)" steps="1"/>

      <!-- 8. Dovecote / Silo tower (colombaia, 3x3 interior, 5x5 outer) attached to back wall of barn or house -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/vvvEE" out="uuuuu/ujjju/ujjju/ujjju/uuj**" symmetry="(x)" steps="1"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/wwwEE" out="uuuuu/ujjju/ujjju/ujjju/uuj**" symmetry="(x)" steps="1"/>

      <!-- 9. Farmyard (aia, c) expanding around buildings where ground goes on past it -->
      <all in="[wvpul]EEE" out="*c**" symmetry="(xy)" steps="1"/>
      <all in="cEEE" out="*c**" symmetry="(xy)" steps="3"/>
      <!-- Expand yard further if plenty of space remains (Gargantuan) -->
      <all in="cEEEEEEEE" out="*cccc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 10. Low dry-stone yard wall (z) around the yard, with open gate (g) where road crosses -->
      <all in="cEE" out="*z*" symmetry="(xy)"/>
      <all in="zE/*z" out="*z/**" symmetry="(xy)"/>
      <all in="zr" out="g*" symmetry="(xy)"/>
      <all in="gr" out="*g" symmetry="(x)" steps="1"/>

      <!-- 11. Stone well (pozzo, q) in a 4x4 patch of open farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" symmetry="(xy)" steps="1"/>

      <!-- 12. Cultivated fields (orto, n) and fruit orchard trees (frutteto, y) outside the yard (Gargantuan) -->
      <one in="zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE" out="zcnnnnnc/zcnnnnnc/zcnnnnnc/zcnnnnnc/zcnnnnnc/zccccccc" symmetry="(xy)" steps="3"/>
      <one in="[zc]EEEEE/[zc]EEEEE/[zc]EEEEE/[zc]EEEEE/[zc]EEEEE" out="*ccccc/*ccccc/*ccycc/*ccccc/*ccccc" symmetry="(xy)" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdapvilczgqrjunyWVAfFRJKLbPQXYxDCZTkOoNMU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>

      <sequence symmetry="()">
        <!-- Unions for imported parts -->
        <union symbol="+" values="WVAZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- Prepare corner/edge posts on porch (p) and hay lean-to (l) before raising columns -->
        <!-- Front corners of porch become 3x3 wooden posts (b) -->
        <all in="pp/pr" out="*b/**" symmetry="(x)"/>
        <all in="pp/pE" out="*b/**" symmetry="(x)"/>
        <all in="pp/pc" out="*b/**" symmetry="(x)"/>
        <all in="pb" out="bb" symmetry="(xy)" steps="2"/>
        <!-- Outer corners of hay lean-to become 3x3 wooden posts (b) -->
        <all in="ll/l[Ec]" out="*b/**" symmetry="(xy)"/>
        <all in="lb" out="bb" symmetry="(xy)" steps="2"/>

        <!-- Prepare well rim vs water inside q -->
        <all in="qq/qq" out="QQ/QQ" symmetry="()" steps="0"/>
        <all in="q[cr]" out="Q*" symmetry="(xy)" steps="2"/>

        <!-- Prepare tree trunk (x) in center of y -->
        <one in="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy" out="*****/*****/*xxx*/*xxx*/*****" symmetry="(xy)" steps="8"/>

        <!-- Prepare ploughed rows inside n -->
        <all in="nnnnn/nnnnn" out="nnnnn/DDDDD" symmetry="()"/>

        <!-- B. THE HEIGHTS: columns by steps -->

        <!-- 1. Main Farmhouse walls (w, d, i): 2 storeys = 64 high, topped with roof R -->
        <!-- Front door seed O at z=1 (floor level): leave w at z=0, O at z=1, then W up to 64 -->
        <all steps="1">
          <rule in="B w" out="w *" symmetry="()"/>
          <rule in="B d" out="d w" symmetry="()"/>
          <rule in="B i" out="i w" symmetry="()"/>
        </all>
        <!-- At z=1: d and i leave door seed O, w leaves stone plinth Z -->
        <all steps="1">
          <rule in="B w" out="w A" symmetry="()"/>
          <rule in="B d" out="w O" symmetry="()"/>
          <rule in="B i" out="w O" symmetry="()"/>
        </all>
        <!-- z=2..5: stone plinth A (total 5 high) -->
        <all in="B w" out="w A" steps="4" symmetry="()"/>
        <!-- z=6..19: ground floor window band P (14 high) -->
        <all in="B w" out="w P" steps="14" symmetry="()"/>
        <!-- z=20..32: plaster W (13 high, reaches slab z=32) -->
        <all in="B w" out="w W" steps="13" symmetry="()"/>
        <!-- z=33..38: plaster W (6 high) -->
        <all in="B w" out="w W" steps="6" symmetry="()"/>
        <!-- z=39..52: upper floor window band P (14 high) -->
        <all in="B w" out="w P" steps="14" symmetry="()"/>
        <!-- z=53..64: plaster W (12 high) -->
        <all in="B w" out="w W" steps="12" symmetry="()"/>
        <!-- z=65: roof base R -->
        <prl in="w" out="R"/>

        <!-- 2. Main Farmhouse interior (h) and stair zone (s) -->
        <!-- Keep area letter at z=0, wood floor f at z=1 -->
        <all steps="1">
          <rule in="B h" out="h *" symmetry="()"/>
          <rule in="B s" out="s *" symmetry="()"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h f" symmetry="()"/>
          <rule in="B s" out="s f" symmetry="()"/>
        </all>
        <!-- z=2: stair strip T above s, air above h -->
        <all steps="1">
          <rule in="B h" out="h B" symmetry="()"/>
          <rule in="B s" out="s T" symmetry="()"/>
        </all>
        <!-- z=3..32: 30 layers of clear air (storey = 32: floor at 1, slab at 33) -->
        <all steps="30">
          <rule in="B h" out="h B" symmetry="()"/>
          <rule in="B s" out="s B" symmetry="()"/>
        </all>
        <!-- z=33: upper floor slab F -->
        <all steps="1">
          <rule in="B h" out="h F" symmetry="()"/>
          <rule in="B s" out="s F" symmetry="()"/>
        </all>
        <!-- z=34..64: 31 layers of clear air -->
        <all steps="31">
          <rule in="B h" out="h B" symmetry="()"/>
          <rule in="B s" out="s B" symmetry="()"/>
        </all>
        <!-- z=65: ceiling / roof base R -->
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- 3. Barn wing (v: brick wall, a: barn floor): 1 tall storey (38 high) + pitched roof J -->
        <!-- Open wide barn front doorway on +y wall of barn if facing yard/ground -->
        <one in="vvvvvvvvvvv/ccccccccccc" out="OOOOOOOOOOO/ccccccccccc" symmetry="()" steps="0"/>
        <all steps="1">
          <rule in="B v" out="v *" symmetry="()"/>
          <rule in="B a" out="a *" symmetry="()"/>
        </all>
        <!-- Create an exterior doorway seed on barn wall facing yard or ground -->
        <one in="vvvvvvvvvvv/[cE][cE][cE][cE][cE][cE][cE][cE][cE][cE][cE]" out="ddddddddddd/***********" symmetry="(xy)" steps="1"/>
        <all in="v/d" out="d/*" symmetry="(xy)" steps="4"/>
        <all steps="1">
          <rule in="B v" out="v A" symmetry="()"/>
          <rule in="B d" out="v O" symmetry="()"/>
          <rule in="B a" out="a f" symmetry="()"/>
        </all>
        <all in="B v" out="v A" steps="3" symmetry="()"/>
        <all in="B v" out="v X" steps="12" symmetry="()"/>
        <all in="B v" out="v V" steps="21" symmetry="()"/>
        <all in="B a" out="a B" steps="36" symmetry="()"/>
        <prl><rule in="v" out="J"/><rule in="a" out="J"/></prl>

        <!-- 4. Dovecote / Silo tower (u: wall, j: interior): rises 72 high, flat platform at 71, battlements & slits -->
        <!-- Doorway from barn/house or yard into tower -->
        <one in="uuuuuuuuuuu/[acE][acE][acE][acE][acE][acE][acE][acE][acE][acE][acE]" out="ddddddddddd/***********" symmetry="(xy)" steps="1"/>
        <all in="u/d" out="d/*" symmetry="(xy)" steps="4"/>
        <all steps="1">
          <rule in="B u" out="u *" symmetry="()"/>
          <rule in="B j" out="j *" symmetry="()"/>
        </all>
        <all steps="1">
          <rule in="B u" out="u Z" symmetry="()"/>
          <rule in="B d" out="u O" symmetry="()"/>
          <rule in="B j" out="j f" symmetry="()"/>
        </all>
        <all in="B u" out="u Z" steps="70" symmetry="()"/>
        <all in="B j" out="j B" steps="69" symmetry="()"/>
        <all in="B j" out="j F" steps="1" symmetry="()"/>
        <prl><rule in="u" out="Z"/><rule in="j" out="B"/></prl>

        <!-- 5. Porch (p) and Hay Lean-to (l) with posts (b): 33 clear air (z=2..34), roof J at z=35 -->
        <all steps="1">
          <rule in="B p" out="p *" symmetry="()"/>
          <rule in="B l" out="l *" symmetry="()"/>
          <rule in="B b" out="b p" symmetry="()"/>
        </all>
        <all steps="1">
          <rule in="B p" out="p C" symmetry="()"/>
          <rule in="B l" out="l C" symmetry="()"/>
          <rule in="B b" out="b N" symmetry="()"/>
        </all>
        <!-- Place hay bales (Y) along back/inner part of hay lean-to l -->
        <one in="lllll/lllll/lllll/lllll/lllll" out="YYYYY/YYYYY/YYYYY/*****/*****" symmetry="(xy)" steps="2"/>
        <all in="B Y" out="Y *" steps="10" symmetry="()"/>
        <all in="B Y" out="l B" steps="23" symmetry="()"/>
        <all in="B p" out="p B" steps="33" symmetry="()"/>
        <all in="B l" out="l B" steps="33" symmetry="()"/>
        <all in="B b" out="b N" steps="33" symmetry="()"/>
        <prl><rule in="p" out="J"/><rule in="l" out="J"/><rule in="b" out="J"/></prl>

        <!-- 6. Ground paving, low stone wall (z), gate posts, well (Q, q), fields (n, D), orchard trees (x, y) -->
        <all steps="1">
          <rule in="B c" out="c *" symmetry="()"/>
          <rule in="B r" out="r *" symmetry="()"/>
          <rule in="B g" out="g *" symmetry="()"/>
          <rule in="B z" out="z *" symmetry="()"/>
          <rule in="B Q" out="Q c" symmetry="()"/>
          <rule in="B q" out="q c" symmetry="()"/>
          <rule in="B n" out="n *" symmetry="()"/>
          <rule in="B D" out="D n" symmetry="()"/>
          <rule in="B y" out="y *" symmetry="()"/>
          <rule in="B x" out="x y" symmetry="()"/>
        </all>
        <!-- z=1: paving / grass / dirt surfaces -->
        <all steps="1">
          <rule in="B c" out="B C" symmetry="()"/>
          <rule in="B r" out="B C" symmetry="()"/>
          <rule in="B g" out="B C" symmetry="()"/>
          <rule in="B z" out="z A" symmetry="()"/>
          <rule in="B Q" out="Q A" symmetry="()"/>
          <rule in="B q" out="B K" symmetry="()"/>
          <rule in="B n" out="B n" symmetry="()"/>
          <rule in="B D" out="D D" symmetry="()"/>
          <rule in="B y" out="B y" symmetry="()"/>
          <rule in="B x" out="x N" symmetry="()"/>
        </all>
        <!-- Low dry-stone wall rises 9 voxels -->
        <all in="B z" out="z A" steps="8" symmetry="()"/>
        <prl in="z" out="A"/>
        <!-- Well stone rim rises 9 voxels -->
        <all in="B Q" out="Q A" steps="8" symmetry="()"/>
        <prl in="Q" out="A"/>
        <!-- Vegetable crop ridge rises 2 voxels -->
        <all in="B D" out="D y" steps="2" symmetry="()"/>
        <prl in="D" out="y"/>
        <!-- Fruit tree trunk rises 16 voxels, topped by rounded canopy -->
        <all in="B x" out="x N" steps="15" symmetry="()"/>
        <all in="B x" out="x y" steps="8" symmetry="()"/>
        <prl in="x" out="y"/>
        <!-- Expand tree canopy -->
        <all in="By" out="yy" steps="4" symmetry="(xy)"/>
        <all in="yB/*y" out="yy/**" symmetry="(xy)"/>

        <!-- C. THE FULL SCALE: imported parts, windows, roofs, details, cleaning -->

        <!-- 1. Imported architectural parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 2. Windows on Farmhouse (band P -> glass/shutter L, rest W) and Barn (band X -> L, rest V) -->
        <one steps="18">
          <rule in="BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP BP/BP/BP/BP/BP/BP" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L" symmetry="(xy)"/>
        </one>
        <all in="LPPPPB" out="*LLLL*" symmetry="(xy)"/>
        <prl in="P" out="W"/>

        <one steps="10">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L" symmetry="(xy)"/>
        </one>
        <all in="LXXXXB" out="*LLLL*" symmetry="(xy)"/>
        <prl in="X" out="V"/>

        <!-- 3. Roofs: Main Farmhouse hipped terracotta roof (R), Barn & Lean-to roofs (J), Chimney -->
        <!-- Eaves overhang by 2 voxels -->
        <all in="RB" out="*R" steps="2" symmetry="(xy)"/>
        <all in="JB" out="*J" steps="1" symmetry="(xy)"/>
        <!-- Farmhouse hipped roof rising up to 14 layers (1 in 2 slope) -->
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>
        <!-- Barn & lean-to sloped roofs rising up to 9 layers -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="9" symmetry="()"/>

        <!-- Brick chimney on Farmhouse roof -->
        <one in="RRR/RRR/RRR BBB/BBB/BBB" out="***/***/*** ***/***/*Z*" steps="1" symmetry="()"/>
        <all in="BZ" out="ZZ" steps="1" symmetry="(xy)"/>
        <all in="B Z" out="Z *" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon style, clear contrast, area tags on bottom layer -->
  <color symbol="E" value="8a9a5b" hidden="True"/>
  <color symbol="h" value="c69c6d" name="pavimento casa" area="house"/>
  <color symbol="w" value="e2d6c0" name="fondazione casa" area="house"/>
  <color symbol="s" value="af8255" name="vano scala" area="house"/>
  <color symbol="d" value="784b2d" name="soglia casa" area="house"/>
  <color symbol="i" value="967350" name="soglia interna" area="house"/>
  <color symbol="p" value="b9a587" name="portico" area="porch"/>
  <color symbol="a" value="a88e69" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="b6664e" name="fondazione stalla" area="barn"/>
  <color symbol="l" value="dabc62" name="tettoia fienile" area="barn"/>
  <color symbol="j" value="a0968c" name="interno colombaia" area="tower"/>
  <color symbol="u" value="a85c46" name="fondazione colombaia" area="tower"/>
  <color symbol="c" value="c4b698" name="aia" area="yard"/>
  <color symbol="z" value="8e8a82" name="base muretto" area="yard"/>
  <color symbol="g" value="afa287" name="varco aia" area="yard"/>
  <color symbol="r" value="b2a486" name="sentiero" area="yard"/>
  <color symbol="n" value="7c6244" name="terra arata" area="field"/>
  <color symbol="y" value="588044" name="fogliame e erba" area="orchard"/>

  <!-- Full-scale architectural materials -->
  <color symbol="W" value="e6dcc8" name="muro intonacato"/>
  <color symbol="A" value="8c877d" name="pietra grigia"/>
  <color symbol="V" value="b8684f" name="muro in mattoni"/>
  <color symbol="Z" value="9e5640" name="mattone antico"/>
  <color symbol="f" value="b5895a" name="tavolato in legno"/>
  <color symbol="F" value="9e7448" name="solaio in legno"/>
  <color symbol="C" value="cfc2a9" name="acciottolato"/>
  <color symbol="R" value="c45335" name="coppi in terracotta"/>
  <color symbol="J" value="ad4a30" name="tettoia in coppi"/>
  <color symbol="L" value="3b4d59" name="finestra"/>
  <color symbol="Y" value="dfb956" name="balle di fieno"/>
  <color symbol="K" value="4c7c96" name="acqua del pozzo"/>
  <color symbol="D" value="634c32" name="solco dell'orto"/>

  <!-- Colours for imported parts -->
  <color symbol="O" value="7a4e2d" name="porta in legno"/>
  <color symbol="o" value="52331c" name="assi della porta"/>
  <color symbol="N" value="634126" name="trave in legno scuro"/>
  <color symbol="k" value="a3784d" name="gradini in legno"/>
  <color symbol="T" value="a3784d" name="scala"/>
  <color symbol="M" value="9e5640" name="merlatura colombaia"/>
  <color symbol="U" value="2b2623" name="feritoia colombaia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>

  <!-- Door open / close actions -->
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
