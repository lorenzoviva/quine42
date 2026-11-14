# model.sculpt · gemini-4-carbon · 33 s

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

The program you wrote:
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
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2); porta: 11 × 1 voxel (0,55 × 0,05 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, d soglia casa, c aia, g varco aia, r sentiero, W muro intonacato, V muro in mattoni, A pietra grigia, f tavolato in legno, F solaio in legno, R coppi in terracotta, J tettoia in coppi, K acqua del pozzo, L finestra, C acciottolato, Z mattone antico, k gradini in legno, O porta in legno, o assi della porta, N trave in legno scuro, M merlatura colombaia, U feritoia colombaia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
EEEEACCCCCCCZZZZZZZMCCCCCCCCCCJJJJJJJJJJJJZZZZZZZZ
EEEAACCCCCCZZZZZZZZZCCCCCCCCCCJJJJJJJJJJJZZZZZZZZZ
EEEAACCCCCCZZFFFFFZZCCCCCCCCCCJJJJJJJJJJJZZZFFFFZZ
EEEEACCCCCCCZFFFFFZZCCCCCCCCCCJJJJJJJJJJJZZZFFFFZZ
EEEAACCCCCCZZFFFFFZZCCCCCCCCCCJJJJJJJJJJJZZZFFFFZZ
EEEEACCCCCCZZMFFFFZZCCCCCCCCCCJJJJJJJJJJJZZZFFFFZZ
EEEAACCCCCCCZZFFFZZZRRRRRRRRRRRRRRRJJJJJJZZZFFFFZZ
EEEAACCCCCCCCCCFFZZZRRRRRRRRRRRRRRRRJJJJJJZZZFFECC
EEEEACCCCCCCCCRRRZZRRRRRRRRRRRRRRRRRJJJJJJMZZJJECC
EEEAACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEAACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEEACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEAACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEAACCAAMCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEAACCAAACCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEEACCMKMCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEAACCMMMCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEAACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC
EEEEACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRJJCCCJJCCCJECC
EEEAACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCCECC
EEEEACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCCAAA
EEEAACCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEEACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEEACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEEACCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA
EEEEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA
EEEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA
EEEAAAAAACAACACAACCCCCCCCCCCCCCCCCCACAACAACACAAAAA
EEEMAAAAAAAAAAAAAACCCCCCCCCCCCCCCMAAAAAAAAAAAAAAAA
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00055355555553555555535555555355555553555555535555
00053333333333333333333333333333333333333333333333
00053333333333333333333333333333333333333333333333
00053000000000000000000000000000000000000000000000
00053000000000000000000000000000000000000000000000
00033000000000000000000000000000000000000000000000
00053000000000000000000000000000000000000000000000
00053000000000000000000000000000000000000000000000
00053000000ooooooooo0000000000aaaaaaaaaaaooooooooo
00053000000oooooooooo00000000abbbbbbbbbbbooooooooo
00053000000oooooooooo00000000abbbbbbbbdbbooooooooo
00053000000ooollllooo00000000abbbbbbbdedbooolllloo
00053000000ooollllooo00000000abbbccccdedbooolllloo
00033000000ooollllooo00000000abbbbbbdeebbooolllloo
00053000000ooollllooo00000000abbbbbbdddbbooolllloo
00053000000ooollooooojjjjjjjjjjjjjjjbbbbboooollloo
000530000000000loooookkkkkkkkkkkkkkjcccccoooool000
00053000000000jloooookkkkkkkkkkkkkkjcccccoooool000
00053000000000jkkkkkkllllllllllllkkjccdddcccccb000
00053000000000jkkkkklllllllllllllkkjccdddcccccb000
00053000000000jkkllllmmmmmmmmmmllkkjccddddddccb000
00033000000000jkklllmmmmmmmmmmmllkkjccddddddccb000
00053055550000jkkllmmmmmmmmmmmmllkkjccddddddccb000
00053055350000jkkllmmmnnnnnnmmmllkkjccddddddccb000
00053055550000jkkllmmmmmmmmmmmmllkkjcccccddcccb000
00053055550000jkkllmmmmmmmmmmmmllkkjccccccccccb000
00053000000000jkkllllllllllllllllkkjccbbbccbbbb000
00053000000000jkkllllllllllllllllkkjbbbbbbbbbbb000
00033000000000jkkkkkkkkkkkkkkkkkkkkj00000000000000
00053000000000jkkkkkkkkkkkkkkkkkkkkj00000000005555
00053000000000jjjjjjjjjjjjjjjjjjjjjj00000000005333
000530000000000jjjjjjjjjjjjjjjjjjjj000000000005333
0005300000000000000abbbbbbbbbbbb000000000000005333
0005300000000000000abbbbbbbbbbbb000000000000005333
0005300000000000000abbbccccccbbb000000000000005333
0005300000000000000abbbbbbbbbbbb000000000000005333
0003300000000000000abbbbbbbbbbbb000000000000003333
0005300000000000000aaaaaaaaaaaaa000000000000005333
00053000000000000000000000000000000000000000005333
00053000000000000000000000000000000000000000005333
00053000000000000000000000000000000000000000005333
00053000000000000000000000000000000000000000003333
00053355555553555550000000000000055355555553533333
00055355555553555550000000000000055355555553555555
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
............ZZZZZZZZ......................ZZZZZZZZ
...........ZZZZZZZZZ.....................ZZZZZZZZZ
...........ZZZZZZZZZ..RRRRRR.............ZZZZZZZZZ
...........ZZZZZZZZRRRRRRRRRRR...........ZZZZZZZZZ
...........ZZZZZZZRRRRRRRRRRRRRR.........ZZZZZZZZZ
...........ZZZZZRRRRRRRRRRRRRRRRRR.......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWW......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWW......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWW......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWW......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWWWWWWWLWWW......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWLLWWWWLLWW......ZZZZZZZZZ
...........ZZZZWWWWWWWWWWLLWWWWLLWW..JJ.JJZZZZZZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWW..JJJJJJJZZZZZZ
...........ZZZZWWWWWWWWJJJJJJWWWWWWJJJJJJJJJJJZZZZ
...........ZZZZWWWWWWJJJJJJJJJJWWWWVVVVVVVVVVVVZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWWVVVVVVVVVVVVZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWWVVVVVVVVVVVVZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWWVVVVVVVVVVVVZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWWVVVVVVVVVVVVZZZ
...........ZZZZWWWWWWWWWWWWWWWWWWWWVVVVVVVVVVVVZZZ
...........ZZZZWWWWWWWWWLWWWWWWWWWWVVVVVVVVVVVVZZZ
....M.MMMM.MMZMWWMWWWLLLLLWWWWWLLWMVMVVMVVMVMVVMZZ
...MM.MMMM.MMZMMLMWLLLLLLLWWWWWLLMMVMMVMVMMVMMLMZM
...AAAAAAAAAAAAAAAWLLWLLLLWWWWWLLAAAAAAAAAAAAAAAAA
...AAAAAAAAAAAAAAAWLLWWWWWWWWWWWWAAAAAAAAAAAAAAAAA
...AAAAAAAAAAAAAAAAAAAANooooOAAAAAAAAAAAAAAAAAAAAA
...AAAAAAAAAAAAAAAAErrrrrrrrrrrCEAAAAAAAAAAAAAAAAA
```
Right side (looking from the right):
```
..........ZZZZZZZZ................................
..........ZZZZZZZZZ...............................
..........ZZZZZZZZZ....RR.........................
..........ZZZZZZZZZ..RRRRRR.......................
..........ZZZZZZZZZRRRRRRRRRR.....................
..........ZZZZZZZZZRRRRRRRRRRRR...................
..........ZZZZZZZZZWWWWWWWWWWWWW..................
..........ZZZZZZZZZWWWWWWWWWWWWW..................
..........ZZZZZZZZZWWWWWWWWWWWWW..................
..........ZZZZZZZZZWWWWWWWWWWWWW..................
..........ZZZZZZZZZWWWWWWWWWWWWW..................
..........ZZZZZZZZZWWWWWWWWWWWWW..................
..........ZZZZZZZZZWWWJJLLWLLWWW..................
..........ZZZZZZZZZWJJJJJJWLLWWW..................
..........ZZZZZZZZZJJJJJJJJJLWWW..................
..........ZZZZZZZZVVVVVVVVVVWWWW.JJJJ.............
..........ZZZZZZZZVVVVVVVVVVWWWW..................
..........ZZZZZZZZVVVVVVVVVVWWWW..................
..........ZZZZZZZZVVVVVVVVVVWWWW..................
..........ZZZZZZZZVVVVVVVVVVWWWW..................
..........ZZZZZZZZVVVVVVVVVVWWWW..................
..........ZZZZZZZZVVVVVVVVVVWWWW..................
..M..M.M..ZZZZZZZZVVVVVVVVVVWWMM.M..M.M..M..M.....
..M.MM.MM.ZZZZZZZZVLLVVVVVVLWWMM.M.MM.MM.M.MM.....
..AAAAAAAAZZZZZZZZVLLVVLLVLLWWAAAAAAAAAAAAAAA.....
..AAAAAAAAZZZZZZZZVVVVVLLVVVWWAAAAAAAAAAAAAAA.....
..AAAAAAAAZZZZZZZZAAAAAAAAAAAAAAAAAAAAAAAAAAA.....
.AAAccccccZZZZZZZcccccccccccccAAAAAAAAAAAAAAAEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
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
............oZZZZZZZ.....................ZZZZZZZZZ
............oZZZZZZZ.....................ZZZZZZZZZ
............o.....ZZ.....................ZZZ....ZZ
............o.....ZZ.....................ZZZ....ZZ
............o.....ZZ.....................ZZZ....ZZ
............NZ....ZZ.....................ZZZ....ZZ
............ZZ...ZZZW....................ZZZZ...ZZ
................ZZZZWWWWWWWWWWWLLWWVLLLVLLZZZ.....
...............WWZZZ.kkkkW.......WW.......ZZZV....
...............WW....kkkk........WW..........LL...
...............WW....kkkk........WW..........LL...
...............WW.....kkk........WW..........VV...
...............WWW...............WW..........VV...
...............WWW...............LL..........LL...
...............WWW...............LL..........LL...
.......M.M.....WWW...............WW..........VV...
.......MMM.....WWW...............WW..........VV...
...............WWW...............WWVVLVVVVVVVVL...
...............WWW...............WW...............
...............WWW...............WW...............
...............WWWWLLLLLLLWWWWWLLWW...............
...............WWWWLLLLLLLWWWWWLLWW...............
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
...........ZZZZZZZZZ.....................ZZZZZZZZZ
...........ZZZZZZZZZ.....................ZZZZZZZZZ
...........ZZZ....ZZ.....................ZZZ....ZZ
...........ZZZ....ZZ.....................ZZZ....ZZ
...........ZZZ....ZZ.....................ZZZ....ZZ
...........ZZZ....ZZ.....................ZZZ....ZZ
...........ZZZ...ZZZZ....................ZZZZ...ZZ
................ZZZZLLWWWWWWWWWWWWW......ZZZZ.....
...............WWZZZ.............WW.......ZZZ.....
...............WW................WW...............
...............WW................WW...JJJ.........
...............WW................WW...JJJJ........
...............WWW...............WW...JJJJJJ......
...............WWW...............WW...JJJJJJ......
...............WWW...............LL...JJJJJJ......
...............WWW...............LL...............
...............WWW...............WW...............
...............WWW...............LL...............
...............WWW...............LL...............
...............WWW...............WW...............
...............WWWWWWWWWWWWWWWWWWWW...............
...............WWWWWWWWWWWWWWWWWWWW...............
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
...........ZZZZZZZZM.....................ZZZZZZZZZ
...........ZZZZZZZZZ.....................ZZZZZZZZZ
...........ZZ.....ZZ.....................ZZZ....ZZ
...........ZZ.....ZZ.....................ZZZ....ZZ
...........ZZ.....ZZ.....................ZZZ....ZZ
...........ZZM....ZZ.....................ZZZ....ZZ
...........ZZZ...ZZZ.....................ZZZZ...ZZ
................ZZZZ.....................ZZZZ.....
.................ZZM......................MZZ.....
..................................................
..................................................
..................................................
..................................................
.....................RRRRRRRR.....................
.....................RRRRRRRR.....................
.....................RRRRRRRR.....................
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   35555355555553555555535555555355555553555555500000
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEEEE   33333333333333333333333333333333333333333333500000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   33333333333333333333333333333333333333333333500000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000000000000000000000000000000000003500000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000000000000000000000000000000000003500000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000000000000000000000000000000000003300000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000000000000000000000000000000000003500000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000000000000000000000000000000000003500000
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000ooooooooo000000000000000000000003500000
CCCCCCCCCCCCZZZZZZZMCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000oooooooooo00000000000000000000003500000
CCCCCCCCCCCZZZZZZZZZCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000oooooooooo00000000000000000000003500000
CCCCCCCCCCCZZZFFFFZZCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   00000000000ooollllooo00000000000000000000003500000
ZZZZZZZZCCCCZMFFFFZZCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   ooooooooo00ooollllooo00000000000000000000003500000
ZZZZZZZZMCCZZZFFFFZZCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   ooooooooo00ooollllooo00000000000000000000003300000
ZZFFFFZZZCCCZMFFFFZZCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   ooooooooo00ooollllooo00000000000000000000003500000
ZZFFFFZZMCCCZZFFFZZZRRRRRRRRRRRRRRRCCCCCCCCAAEEEEE   oollllooo00ooollooooojjjjjjjjjjjjjjj00000003500000
ZZFFFFZZZCCCAEEFFZZZRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   oollllooo005350loooookkkkkkkkkkkkkkj00000003500000
ZZFFFFZZMCCCEERRRZZMRRRRRRRRRRRRRRRRCMMMCCCAAEEEEE   oollllooo00555jloooonkkkkkkkkkkkkkkj55550003500000
ZZFFFFZZZCCCECRRRRRRRRRRRRRRRRRRRRRRCMMMCCCAAEEEEE   oollloooobbbbbjkkkkkkllllllllllllkkj55550003500000
CCEFFMZZMJJJJJRRRRRRRRRRRRRRRRRRRRRRCMAMCCCAAEEEEE   oo0looooobbbbbjkkkkklllllllllllllkkj55550003500000
CCEFFZZZJJJJJJRRRRRRRRRRRRRRRRRRRRRRCMAMCCCAAEEEEE   000looooocccccjkkllllmmmmmmmmmmllkkj55550003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bcbbbccccccjkklllmmmmmmmmmmmllkkj00000003300000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bcccccdddccjkkllmmmmmmmmmmmmllkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccccddddccjkkllmmmnnnnnnmmmllkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccddddddccjkkllmmmmmmmmmmmmllkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccddddddccjkkllmmmmmmmmmmmmllkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccddddddccjkkllllllllllllllllkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccddddddccjkkllllllllllllllllkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccccccccccjkkkkkkkkkkkkkkkkkkkkj00000003300000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bccccccccccjkkkkkkkkkkkkkkkkkkkkj00000003500000
CCEJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCAAEEEEE   000bbbbbbbbbbbjjjjjjjjjjjjjjjjjjjjjj00000003500000
CCECCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   0000abbbbbbbbbbjjjjjjjjjjjjjjjjjjjj000000003500000
AAECCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   5555abbbbbbbbbbbb00abbbbbbbbbbbb000000000003500000
AAACCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   3335abbbbbbbbbbbb00abbbbbbbbbbbb000000000003500000
AAACCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   3333abbbccccccbbb00abbbccccccbbb000000000003500000
AAACCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   3335abbbbbbbbeedb00abbbbbbbbbbbb000000000003500000
AAACCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   3335abbbbbbbbdddb00abbbbbbbbbbbb000000000003300000
AAACCJJJJJJJJJJJJCCCJJJJJJJJJJJJCCCCCCCCCCCAAEEEEE   3335aaaaaaaaaaaaa00aaaaaaaaaaaaa000000000003500000
AAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   33350000000000000000000000000000000000000003500000
AAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   33350000000000000000000000000000000000000003500000
AAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   33350000000000000000000000000000000000000003500000
AAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAEEEEE   33350000000000000000000000000000000000000003500000
AAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCACAACAAAAAEEEEE   33330000000000000000000000000000055355555553500000
AAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCMAAAAAAAAAAMEEEEE   33350000000000000000000000000000055355555555500000
AAAAAAAAAAAAAAAAAACCCCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   33335355555553555550000000000000000000000000000000
AAAAAAAAAAAAAAAAAACCCCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   35555355555553555550000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   05555535555555355555553555555535555555355555553555
EEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA   05333333333333333333333333333333333333333333333333
EEAACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC   05333333333333333333333333333333333333333333333333
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC   05330000000000000000000000000000000000000000000000
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC   05330000000000000000000000000000000000000000000000
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC   03330000000000000000000000000000000000000000000000
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC   05330000000000000000000000000000000000000000000000
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCMMMCCCCCCCCCCCCCCC   05330000000000000000000000000005555000000000000000
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCMKMCCCCCCCCCCCCCCC   05330000000noooooooo000000000005555000000moooooooo
EEACCCCCCCCCZZZZZZZMCCCCCCCCCCCCMMMCCCCCCCZZZZZZZZ   05330000000oooooooooo00000000005555000000ooooooooo
EEACCCCCCCCZZZZZZZZZCCCCCCCCCCCCMMMCCCCCCZZZZZZZZZ   05330000000oooooooooo00000000005555000000ooooooooo
EEACCCCCCCCZZFFFFFZZCCCCCCCCCCCCCCCCCCCCCZZZFFFFZZ   05330000000ooollllooo00000000000000000000ooolllloo
EEACCCCCCCCCZFFFFFZZCCCCCCCCCCCCCCCCCCCCCZZZFFFFZZ   05330000000ooollllooo00000000000000000000ooolllloo
EEACCCCCCCCZZFFFFFZZCCCCCCCCCCCCCCCCCCCCCZZZFFFFZZ   03330000000ooollllooo00000000000000000000ooolllloo
EEACCCCCCCCCZFFFFFZZCCCCCCCCCCCCCCCCCCCCCZZZFFFFZZ   05330000000ooollllooo00000000000000000000ooolllloo
EEACCCCCCCCCZZFFFZZZRRRRRRRRRRRRRRRCJJJJJZZZFFFFZZ   05330000000ooollooooojjjjjjjjjjjjjjjbbbbbooooolloo
EEACCCCCCCCCAEEFFZZZRRRRRRRRRRRRRRRRJJJJJJZZZFFECC   053300000005350loooookkkkkkkkkkkkkkjcccccoooool000
EEACCCCCJJJJJJRRRZZMRRRRRRRRRRRRRRRRJJJJJJMZZJJECC   05330000bbbbbdjloooookkkkkkkkkkkkkkjcccccoooool000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbbbdjkkkkkkllllllllllllkkjccdddcccccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbbbdjkkkkklllllllllllllkkjccdddcccccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbcbbjkkllllmmmmmmmmmmllkkjccddddddccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   03330000bbbcbbjkklllmmmmmmmmmmmllkkjccddddddccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbcbbjkkllmmmmmmmmmmmmllkkjccddddddccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbcbbjkkllmmmnnnnnnmmmllkkjccddddddccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbcbbjkkllmmmmmmmmmmmmllkkjccccdcccccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbcbbjkkllmmmmmmmmmmmmllkkjccccccccccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJJJECC   05330000bbbbbbjkkllllllllllllllllkkjbbbbcbbbccb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCJCCCCJJECC   05330000bbbbbbjkkllllllllllllllllkkjbbbbbbbbbbb000
EEACCCCCJJJJJJRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCCECC   03330000bbbbbbjkkkkkkkkkkkkkkkkkkkkj00000000000000
EEACCCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCCAAA   05330000aaaaaajkkkkkkkkkkkkkkkkkkkkj00000000005555
EEACCCCCCCCCCCRRRRRRRRRRRRRRRRRRRRRRCCCCCCCCCCCAAA   05330000000000jjjjjjjjjjjjjjjjjjjjjj00000000005333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   053300000000000jjjjjjjjjjjjjjjjjjjj000000000005333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   0533000000000000000abbbbbbbbbbbb000000000000005333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   0533000000000000000abbbbbbbbbbbb000000000000005333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   0533000000000000000abbbccccccbbb000000000000005333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   0533000000000000000abbbbbbbbbbbb000000000000005333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   0333000000000000000abbbbbbbbbbbb000000000000003333
EEACCCCCCCCCCCCCCCCCJJJJJJJJJJJJCCCCCCCCCCCCCCCAAA   0533000000000000000aaaaaaaaaaaaa000000000000005333
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA   05330000000000000000000000000000000000000000005333
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA   05330000000000000000000000000000000000000000005333
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA   05330000000000000000000000000000000000000000005333
EEACCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCAAA   05330000000000000000000000000000000000000000003333
EEAACACAACAACACAACCCCCCCCCCCCCCCCCCACAACAACACAAAAA   05335355555553555550000000000000055355555553533333
EEAAAAAAAAAAAAAAAACCCCCCCCCCCCCCCMAAAAAAAAAAAAAAAA   05555535555553555550000000000000055355555553555555
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEECCCCCCCCCCCCEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.40 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 185 nodi, 793 passi, finito in 827 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=pavimento casa, w=fondazione casa, s=vano scala, d=soglia casa, a=pavimento stalla, p=portico, v=fondazione stalla, i=soglia interna, l=tettoia fienile, c=aia, z=base muretto, g=varco aia, q=aqua, r=sentiero, j=interno colombaia, u=fondazione colombaia, m=magenta, W=muro intonacato, V=muro in mattoni, A=pietra grigia, f=tavolato in legno, F=solaio in legno, R=coppi in terracotta, J=tettoia in coppi, K=acqua del pozzo, L=finestra, P=Purple, Q=aQua, X=X, Y=balle di fieno, C=acciottolato, Z=mattone antico, T=scala, k=gradini in legno, O=porta in legno, o=assi della porta, N=trave in legno scuro, M=merlatura colombaia, U=feritoia colombaia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: Z 67859, W 55784, A 30447, R 17847, V 11346, C 11325, J 11286, c 8750, L 4344, E 3975, M 2970, f 2875, k 2720, o 2648, F 1965, r 1175, U 962, N 474, O 344, g 100, d 75, K 14.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-35 all×19, prl×2, one×6: 773 celle x2-29 y1-29 z0, passi 2-66
   #39 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 67
#47-56 all×8: 77236 celle x20-104 y50-94 z0-39, passi 68-108
#57-62 all×5, prl×1: 62125 celle x45-104 y50-94 z0-65, passi 109-138
#63-64 all×2: 100750 celle x50-99 y55-89 z3-34, passi 139-169
    #65 all . h → h . (+1) passi=31: ×31, 100750 celle x50-99 y55-89 z34-65, passi 170-200, h→. 44175, .→h 44175, s→. 6200, .→s 6200
      r1 . h → h . ×44175; r2 . s → s . ×6200
#66-80 prl×2, one×3, all×10: 93578 celle x35-149 y30-89 z0-65, passi 201-290
    #81 all . u → u Z passi=70: ×70, 91000 celle x35-149 y30-54 z1-72, passi 291-360, u→Z 45500, .→u 45500
    #82 all . j → j . passi=69: ×69, 69000 celle x40-144 y35-54 z2-71, passi 361-429, j→. 34500, .→j 34500
#83-90 all×6, prl×1, one×1: 54616 celle x35-149 y30-114 z0-72, passi 430-489
    #91 all . l → l . passi=33: ×33, 62700 celle x90-124 y30-49 z2-46, passi 490-522, l→. 31350, .→l 31350
#93-96 prl×1, all×3: 64661 celle x10-149 y5-149 z0-46, passi 523-533
#97-175 prl×9, all×22, one×1: 59123 celle x10-149 y5-134 z0-78, passi 534-746
#176-185 one×2, all×7, prl×1: 47177 celle x34-149 y29-115 z0-82, passi 747-793
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#18 all d/p → */p: le celle cercate c'erano, ma mai disposte come nel pattern
#21 one r/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all w/p/r → */*/E: le celle cercate c'erano, ma mai disposte come nel pattern
#36 one zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zE… → zcnnnnnc/zcnnnnnc/zcnnnnnc/zcnnnnnc/zcnnnnnc/zc… passi=3: le celle cercate c'erano, ma mai disposte come nel pattern
#37 one [zc]EEEEE/[zc]EEEEE/[zc]EEEEE/[zc]EEEEE/[zc]EEE… → *ccccc/*ccccc/*ccycc/*ccccc/*ccccc passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all pp/pr → *b/**: le celle cercate c'erano, ma mai disposte come nel pattern
#42 all pp/pE → *b/**: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all pp/pc → *b/**: le celle cercate c'erano, ma mai disposte come nel pattern
#44 all pb → bb passi=2: in quel momento nella griglia non c'erano celle "b"
#45 all ll/l[Ec] → *b/**: le celle cercate c'erano, ma mai disposte come nel pattern
#46 all lb → bb passi=2: in quel momento nella griglia non c'erano celle "b"
… e altri 46
Fix it and answer with the whole program.

## Risposta

<!--
Concept: Fattoria (Italian medieval farmhouse estate)
Parts & Plan Letters:
- h, w, s, d: Two-storey farmhouse (h: room floor, w: plastered stone walls, s: stair zone 4x2 along back wall, d: front door 3 cells wide). Centered near H, ~9x8 interior.
- a, v, i, e: Attached barn / stalla wing on left or right side of farmhouse (a: barn floor, v: brick barn wall, i: internal doorway, e: wide exterior barn doorway).
- p, b: Front porch / lean-to (portico) 4 cells deep (20 voxels) and 7 cells wide (35 voxels clear) along the front door, with corner posts b.
- l, t: Hay lean-to shed (tettoia del fieno, 4 cells deep = 20 voxels, 7 long = 35 voxels) on free house/barn wall, with corner posts t.
- u, j, x: Dovecote / silo tower (colombaia, u: brick tower wall, j: tower floor, x: tower doorway) crowned with battlements & arrow slits on a back corner.
- c, z, g, r, q: Farmyard (aia, c) enclosed by a dry-stone wall (z) with open gate (g) on the road (r) to the front edge, plus stone well (q).
- n, y: Ploughed vegetable garden rows (orto, n) and fruit orchard trees (frutteto, y) outside the yard at Gargantuan size.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapbtvilczgqrjuxenym" symmetry="()">
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

      <!-- 3. Front door (3 cells wide = 15 voxels) on the south (+y) wall, centered on H -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 4. Front porch (portico, 4 cells deep = 20 voxels, 7 cells wide = 35 voxels) in front of door, with corner posts b -->
      <all in="wwdddww/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/ppppppp/ppppppp/ppppppp/bpppbpp" symmetry="()" steps="1"/>
      <all in="bpppbpp" out="bpppppb" symmetry="()"/>

      <!-- 5. Road (3 cells wide = 15 voxels) from front door / porch straight to the front edge (+y) -->
      <all in="ddd/ppp/ppp/ppp/ppp/EEE" out="***/***/***/***/***/rrr" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- 6. Barn wing (stalla) attached to left or right wall where 8 cells of space exist -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="wvvvvvvv*/iaaaaaav*/iaaaaaav*/iaaaaaav*/waaaaaav*/waaaaaav*/wvveeevv*" symmetry="(x)" steps="1"/>

      <!-- 7. Dovecote / Silo tower (colombaia, 3x3 interior, 5x5 outer) attached to back wall of barn or house -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/vvvvv" out="uuuuu/ujjju/ujjju/ujjju/uxxxu" symmetry="()" steps="1"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/wwwww" out="uuuuu/ujjju/ujjju/ujjju/uxxxu" symmetry="()" steps="0"/>

      <!-- 8. Hay lean-to (tettoia del fieno, 4 cells deep = 20 voxels, 7 long = 35 voxels) on free house or barn wall -->
      <one in="[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE/[wv]EEEEE" out="*lllt*/*llll*/*llll*/*llll*/*llll*/*llll*/*lllt*" symmetry="(xy)" steps="1"/>

      <!-- 9. Farmyard (aia, c) expanding around buildings where ground goes on past it -->
      <all in="[wvpbulted]EEE" out="*c**" symmetry="(xy)" steps="1"/>
      <all in="cEEEE" out="*c***" symmetry="(xy)" steps="2"/>
      <!-- Expand yard further only if plenty of space remains (Gargantuan) -->
      <all in="cEEEEEEEEEE" out="*ccc*******" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 10. Low dry-stone yard wall (z) around the yard, with open gate (g) where road crosses -->
      <all in="cEE" out="*z*" symmetry="(xy)"/>
      <all in="zE/*z" out="*z/**" symmetry="(xy)"/>
      <all in="zr" out="g*" symmetry="(xy)"/>
      <all in="gr" out="*g" symmetry="(x)" steps="1"/>

      <!-- 11. Stone well (pozzo, q) in a 4x4 patch of open farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" symmetry="(xy)" steps="1"/>

      <!-- 12. Cultivated fields (orto, n) and fruit orchard trees (frutteto, y) outside the yard (Gargantuan) -->
      <one in="zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE" out="zcnnnnc/zcnnnnc/zcnnnnc/zcnnnnc/zcccccc" symmetry="(xy)" steps="3"/>
      <one in="[zc]EEEE/[zc]EEEE/[zc]EEEE/[zc]EEEE" out="*cccc/*ccyc/*cccc/*cccc" symmetry="(xy)" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdapbtvilczgqrjuxenyWVAfFRJKLPSXYDCZTkOoNMU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="t" out="lllll/lbbbl/lbbbl/lbbbl/lllll"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="q" out="qqqqq/qKKKq/qKKKq/qKKKq/qqqqq"/>
      <rule in="n" out="nnnnn/DDDDD/nnnnn/DDDDD/nnnnn"/>
      <rule in="y" out="yyyyy/yySyy/ySSSy/yySyy/yyyyy"/>

      <sequence symmetry="()">
        <!-- Unions for imported parts (avoid S: reserved by part-battlements!) -->
        <union symbol="+" values="WVAZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- Fix tree trunk marker from S (avoiding reserved S) to P temporarily -> use D/K/X/Q -->
      </sequence>
    </map>
  </map>
</sequence>
<!-- Wait: let's replace S in map values & y rule so S is NEVER used! -->
<!-- Rewriting cleanly below -->

