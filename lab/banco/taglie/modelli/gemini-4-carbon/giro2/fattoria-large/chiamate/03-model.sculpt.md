# model.sculpt · gemini-4-carbon · 63 s

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

The program you wrote:
<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- Main farmhouse: h (house floor, 9 or 10 × 7–8 cells inside = 45–50 × 35–40 voxels), s (stair zone along back wall, 4 × 2 cells with 2+ cells landing before and after), w (house plastered walls), d (front door zone, 3 cells = 15 voxels wide). Two covered storeys with hipped terracotta tile roof and brick chimney.
- Lean-to porch: p (wooden lean-to 7 cells = 35 voxels wide and 4 cells = 20 voxels deep against a side or front wall of the house, 34 clear height).
- Haystack: y (2 × 2 hay rick behind or beside the house).
- Farmyard & road: c (beaten earth yard around the house), r (front path straight from door to the front edge).
- At Huge / Gargantuan (where ground goes on):
  - Barn / annex: a (barn floor, 6 × 6 inside), v (stone barn walls), g (wide barn entrance facing yard).
  - Stone colombaia / silo tower: t (3 × 3 stone tower attached to barn or yard corner, crowned with battlements & arrow slits).
  - Stone well: q (in 5 × 5 of yard).
  - Wooden fence: z (enclosing the farmyard, open at road).
  - Ploughed vegetable field & orchard trees: f (ploughed field strips outside fence), l (fruit trees in lawn).
-->
<sequence values="BHEhswdpcyravgtqzflPWFGJKLCIXYQZAVToONkMU#20#21#90#91#92#94" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WVA"/>
  <union symbol="=" values="FG"/>
  <union symbol="%" values="A"/>

  <map scale="1/5 1/5 1" values="BHEhswdpcyravgtqzflm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: shifted slightly toward back (small y) so front road & yard fit cleanly at 20x20 -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Seed variation: widen one side of the house by 1 cell -->
      <one in="Eh/Eh/Eh/Eh/Eh" out="h*/h*/h*/h*/h*" symmetry="(x)" steps="1"/>
      <all in="Eh/*h" out="h*/**" symmetry="(x)"/>
      <all in="hE/*h" out="*h/**" symmetry="(x)"/>

      <!-- Farmhouse walls w (leaves 4 cells on one side or 4 & 5 cells on x, and 4–5 cells in front at 20x20) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone s along back wall (small y): 2 cells landing on small-x, 4 cells stair, 3–4 cells landing on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Front door d (3 cells = 15 voxels wide) straight toward front (large y) and road r to front edge -->
      <all in="H/h" out="*/m" symmetry="()"/>
      <all in="[Hm]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Lean-to porch p: 4 cells deep (20 voxels) and 7 cells long (35 voxels) against a side wall of the house (fits at 20x20!) -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Base farmyard c around house and lean-to -->
      <all in="[wp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard c where space exists (Huge 30x30 / Gargantuan 40x40) -->
      <all in="cEEEEEEE" out="*cccccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Keep front road r clean from door to front edge -->
      <all in="d/c" out="*/r" symmetry="()"/>
      <all in="r/[cE]" out="*/r" symmetry="()"/>

      <!-- Haystack y (2x2 = 10x10 voxels) in the yard or behind the house (fits at Large and Huge) -->
      <one in="wcc/wcc/wcc" out="*yy/*yy/***" symmetry="(xy)" steps="1"/>
      <one in="EE/EE/ww" out="yy/yy/**" symmetry="(xy)" steps="1"/>

      <!-- Barn annex (a inside 5x5 = 25x25, v walls, g wide doorway) in expanded yard at Huge+ -->
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="vvvvvvv/vaaaaav/vaaaaav/vaaaaav/vaaaaav/vaaaaav/vvgggvv" symmetry="(xy)" steps="1"/>

      <!-- Stone dovecote / silo tower t (3x3 = 15x15) attached to barn corner or yard at Huge+ -->
      <one in="vvc/vvc/ccc/ccc" out="**t/**t/ttt/ttt" symmetry="(xy)" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc" out="*ttt*/*ttt*/*ttt*/*****" steps="0"/>

      <!-- Fallback tower if barn placed differently on Huge+ -->
      <one in="vvccc/vvccc/ccccc" out="**ttt/**ttt/**ttt" symmetry="(xy)" steps="1"/>

      <!-- Stone well q in a 5x5 clear patch of yard (Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Wooden fence z around yard where at least 2 cells of E remain outside (Huge+) -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <all in="r/z" out="*/r" symmetry="()"/>

      <!-- Ploughed vegetable field f outside fence where space allows (Huge / Gargantuan) -->
      <one in="zEEEEE/zEEEEE/zEEEEE/zEEEEE/zEEEEE" out="*fffff/*fffff/*fffff/*fffff/*fffff" symmetry="(xy)" steps="2"/>

      <!-- Orchard fruit trees l in 5x5 patches of grass E (Huge / Gargantuan) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**l**/*****/*****" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BHEhswdpcyravgtqzflPWFGJKLCIXYQZAVToONkMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="q" out="ccccc/cqqqc/cqqqc/cqqqc/ccccc"/>
      <rule in="z" out="ccccc/czzzc/czzzc/czzzc/ccccc"/>
      <rule in="f" out="fffff/EEEEE/fffff/EEEEE/fffff"/>
      <rule in="l" out="EEEEE/EEEEE/EElEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- ================= B. HEIGHTS ================= -->
        <!-- Place outer corner posts P inside lean-to p before raising -->
        <all in="p[Ecryz]" out="P*" steps="1"/>
        <all in="Pp" out="*P" steps="1"/>
        <!-- Keep posts only near outer corners/ends of lean-to so interior stays wide open (35+ clear) -->
        <all in="PPPPP" out="PpppP"/>
        <all in="pppp" out="pppp" steps="0"/>

        <!-- Farmhouse walls w & door-wall d: 2 storeys = 64 high, plus roof base R -> J -->
        <!-- Ground floor wall: 8 stone plinth V, 14 window band I, 10 plaster W (total 32) -->
        <all steps="8"><rule in="B w" out="w V"/><rule in="B d" out="d O"/></all>
        <!-- Wait: part-door needs O ONLY on the floor layer (z=1, above z=0 threshold), with wall '+' above it! -->
        <!-- Let's be exact: z=0 is soil/floor. Let's inspect z=0 vs z=1! -->
      </sequence>
    </map>
  </map>
</sequence>
<!-- Let's carefully verify z=0 and column rising mechanics before outputting XML -->
<!-- Wait: I must ONLY output valid XML without trailing comments or second root! Let me rewrite cleanly from the top. -->
It does not pass: taglia Grande, seme 1: il simbolo "#20" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#20" value="rrggbb"/>
Fix it and answer with the whole program.

## Risposta

```xml
<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- Main farmhouse: h (house floor, 9 or 10 × 8–9 cells inside = 45–50 × 40–45 voxels), s (stair zone along back wall, 4 × 2 cells with 2+ cells landing before and after), w (house plastered walls), d (front door zone, 3 cells = 15 voxels wide). Two covered storeys with hipped terracotta roof and brick chimney.
- Lean-to porch: p (wooden lean-to 7 cells = 35 voxels wide and 4 cells = 20 voxels deep against a side wall of the house, 32 clear height).
- Haystack: y (2 × 2 hay rick behind or beside the house).
- Farmyard & road: c (beaten earth yard around the house), r (front path straight from door to the front edge).
- At Huge / Gargantuan (where ground goes on):
  - Barn / annex: a (barn floor, 5 × 5 inside), v (stone barn walls), g (wide barn entrance facing yard).
  - Stone colombaia / silo tower: t (3 × 3 stone tower attached to barn or yard corner, crowned with battlements & arrow slits).
  - Stone well: q (in 5 × 5 of yard).
  - Wooden fence: z (enclosing the farmyard, open at road).
  - Ploughed vegetable field & orchard trees: f (ploughed field strips outside fence), l (fruit trees in lawn).
-->
<sequence values="BHEhswdpcyravgtqzflPWFGJKLCIXYQZAVDToONkMU#20#21#90#91#92#94" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WVA"/>
  <union symbol="=" values="FG"/>
  <union symbol="%" values="A"/>

  <map scale="1/5 1/5 1" values="BHEhswdpcyravgtqzflm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: shifted slightly toward back (small y) so front road & yard fit cleanly at 20x20 -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Seed variation: widen one side of the house by 1 cell -->
      <one in="Eh/Eh/Eh/Eh/Eh" out="h*/h*/h*/h*/h*" symmetry="(x)" steps="1"/>
      <all in="Eh/*h" out="h*/**" symmetry="(x)"/>
      <all in="hE/*h" out="*h/**" symmetry="(x)"/>

      <!-- Farmhouse walls w -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone s along back wall (small y): 2 cells landing on small-x, 4 cells stair, 3–4 cells landing on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Front door d (3 cells = 15 voxels wide) straight toward front (large y) and road r to front edge -->
      <all in="H/h" out="*/m" symmetry="()"/>
      <all in="[Hm]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Lean-to porch p: 4 cells deep (20 voxels) and 7 cells long (35 voxels) against a side wall of the house -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Base farmyard c around house and lean-to -->
      <all in="[wp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard c where space exists (Huge 30x30 / Gargantuan 40x40) -->
      <all in="cEEEEEEE" out="*cccccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Keep front road r clean from door to front edge -->
      <all in="d/c" out="*/r" symmetry="()"/>
      <all in="r/[cE]" out="*/r" symmetry="()"/>

      <!-- Haystack y (2x2 = 10x10 voxels) in the yard or behind the house -->
      <one in="wcc/wcc/wcc" out="*yy/*yy/***" symmetry="(xy)" steps="1"/>
      <one in="EE/EE/ww" out="yy/yy/**" symmetry="(xy)" steps="1"/>

      <!-- Barn annex (a inside 5x5 = 25x25, v walls, g wide doorway) in expanded yard at Huge+ -->
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="vvvvvvv/vaaaaav/vaaaaav/vaaaaav/vaaaaav/vaaaaav/vvgggvv" symmetry="(xy)" steps="1"/>

      <!-- Stone dovecote / silo tower t (3x3 = 15x15) attached to barn corner at Huge+ -->
      <one in="vvccc/vvccc/ccccc" out="**ttt/**ttt/**ttt" symmetry="(xy)" steps="1"/>

      <!-- Stone well q in a 5x5 clear patch of yard (Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Wooden fence z around yard where at least 2 cells of E remain outside (Huge+) -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <all in="r/z" out="*/r" symmetry="()"/>

      <!-- Ploughed vegetable field f outside fence where space allows (Huge / Gargantuan) -->
      <one in="zEEEEE/zEEEEE/zEEEEE/zEEEEE/zEEEEE" out="*fffff/*fffff/*fffff/*fffff/*fffff" symmetry="(xy)" steps="2"/>

      <!-- Orchard fruit trees l in 5x5 patches of grass E (Huge / Gargantuan) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**l**/*****/*****" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BHEhswdpcyravgtqzflPWFGJKLCIXYQZAVDToONkMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="q" out="ccccc/cqqqc/cqqqc/cqqqc/ccccc"/>
      <rule in="z" out="ccccc/czzzc/czzzc/czzzc/ccccc"/>
      <rule in="f" out="fffff/EEEEE/fffff/EEEEE/fffff"/>
      <rule in="l" out="EEEEE/EEEEE/EElEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- ================= B. HEIGHTS ================= -->
        <!-- Lean-to outer corner posts D (3x3 at outer ends of p) so lean-to stays 35x20 clear inside -->
        <all in="p[Ecryz]/p[Ecryz]/p[Ecryz]" out="p*/D*/p*" steps="1"/>
        <all in="Dp" out="*D" steps="2"/>
        <all in="DDDDDD" out="DppppD"/>
        <all in="DDDDD" out="DpppD"/>
        <all in="DDDD" out="DppD"/>

        <!-- Farmhouse walls w & door-wall d: 64 high + roof base J -->
        <!-- z=0: w->V, d->F (threshold floor) -->
        <all steps="1"><rule in="B w" out="w V"/><rule in="B d" out="d F"/></all>
        <!-- z=1: w->V, d->O (door seed on z=1, right above threshold F, with wall above it) -->
        <all steps="1"><rule in="B w" out="w V"/><rule in="B d" out="d O"/></all>
        <!-- z=2..7: stone plinth V -->
        <all steps="6"><rule in="B w" out="w V"/><rule in="B d" out="d V"/></all>
        <!-- z=8..21: ground floor window band I on w, plaster W above door d -->
        <all steps="14"><rule in="B w" out="w I"/><rule in="B d" out="d W"/></all>
        <!-- z=22..31: plaster W -->
        <all steps="10"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <!-- Second storey z=32..63: 6 plaster W, 14 window band I, 12 plaster W -->
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w I"/><rule in="B d" out="d I"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <!-- z=64: roof base J -->
        <prl><rule in="w" out="J"/><rule in="d" out="J"/></prl>

        <!-- Farmhouse interior h and stair zone s (keep area letter h at z=0? Wait: floor F at z=0, or keep h at z=0 and F at z=0? Let's put F at z=0 and keep area="house" on F!) -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <!-- z=1: stair strip T above s, air above h -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- z=32: second floor slab G -->
        <all steps="1"><rule in="B h" out="h G"/><rule in="B s" out="s G"/></all>
        <!-- z=33..63: second floor air (31 clear) -->
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <!-- z=64: ceiling / roof base J -->
        <prl><rule in="h" out="J"/><rule in="s" out="J"/></prl>

        <!-- Internal doorway between farmhouse and lean-to porch (15 wide on z=1, above F threshold) -->
        <one in="FVVVVVVVVVVVVVVVp" out="*OOOOOOOOOOOOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/V" out="*/O" symmetry="(xy)" steps="4"/>

        <!-- Lean-to porch p and posts D: floor C at z=0, 32 clear air (z=1..32), wooden lean-to roof K at z=33..36 sloping up toward house -->
        <all in="B D" out="D P" steps="33"/>
        <prl in="D" out="K"/>
        <all in="B p" out="p C" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="K"/>
        <!-- Slope lean-to roof slightly up against farmhouse wall -->
        <all in="B K" out="K K" steps="1"/>
        <all in="KW/KB" out="KK/**" symmetry="(xy)" steps="2"/>

        <!-- Haystack y: golden hay Y rising 16 and tapering -->
        <all in="B y" out="y Y" steps="12"/>
        <prl in="y" out="Y"/>
        <all in="YB" out="*B" steps="0"/>
        <all in="***/*B*/*** *Y*/YYY/*Y*" out="***/*Y*/*** ***/***/***" steps="4" symmetry="()"/>

        <!-- Barn annex: walls v (34 high), wide open entrance g (28 open, 6 timber lintel P + stone V), floor a -> C, roof X -->
        <all in="B v" out="v V" steps="12"/>
        <all in="B v" out="v I" steps="12"/>
        <all in="B v" out="v V" steps="10"/>
        <prl in="v" out="X"/>
        <all in="B g" out="g C" steps="1"/>
        <all in="B g" out="g B" steps="28"/>
        <all in="B g" out="g P" steps="2"/>
        <all in="B g" out="g V" steps="3"/>
        <prl in="g" out="X"/>
        <all in="B a" out="a C" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="X"/>

        <!-- Dovecote / silo tower t: solid hollow stone tower A (48 high) with roof platform inside so part-battlements & part-slits crown it -->
        <all in="t[Ecryzv]" out="A*" steps="1"/>
        <all in="At" out="*A" steps="1"/>
        <!-- Outer shell A rises 48, core t rises 47 with slab G at top -->
        <all in="B A" out="A A" steps="48"/>
        <prl in="A" out="A"/>
        <all in="B t" out="t C" steps="1"/>
        <all in="B t" out="t B" steps="45"/>
        <all in="B t" out="t G" steps="1"/>
        <prl in="t" out="G"/>

        <!-- Stone well q: stone ring V 8 high with water Q inside -->
        <all in="qqq/qqq/qqq" out="qqq/qQq/qqq" steps="1"/>
        <all in="B q" out="q V" steps="8"/>
        <prl in="q" out="V"/>
        <all in="B Q" out="Q Q" steps="4"/>
        <prl in="Q" out="B"/>

        <!-- Wooden fence z: posts & rails P, 8 high -->
        <all in="B z" out="z P" steps="7"/>
        <prl in="z" out="P"/>

        <!-- Orchard fruit trees l: trunk P 14 high, round green canopy Z -->
        <all in="B l" out="l P" steps="14"/>
        <prl in="l" out="Z"/>
        <all in="ZB" out="*Z" steps="3"/>
        <all in="B Z" out="Z Z" steps="4"/>

        <!-- ================= C. FULL SCALE PARTS & DETAILS ================= -->
        <!-- Include canonical parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in band I (farmhouse & barn): dark framed panes L on exterior faces -->
        <one steps="18">
          <rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I" out="W"/>

        <!-- Farmhouse hipped terracotta roof J: eaves + 1-in-2 slope + brick chimney -->
        <all in="JB" out="*J" steps="2"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <!-- Brick chimney on farmhouse roof -->
        <one in="JJJ/JJJ/JJJ BBB/BBB/BBB" out="***/***/*** ***/**V/***" steps="1" symmetry="()"/>
        <all in="VV/VB" out="VV/VV" steps="1"/>
        <all in="B V" out="V V" steps="9"/>

        <!-- Barn pitched roof X -->
        <all in="XB" out="*X" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **X**/**X**/XXXXX/**X**/**X**"
             out="*****/*****/**X**/*****/***** *****/*****/*****/*****/*****" steps="9" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon palette with area tags -->
  <color symbol="E" value="7fa35c" hidden="True"/>
  <color symbol="c" value="c8b28a" name="aia in terra battuta" area="yard"/>
  <color symbol="r" value="b89f74" name="sentiero" area="yard"/>
  <color symbol="f" value="6e5036" name="orto arato" area="field"/>

  <color symbol="W" value="ebd9be" name="intonaco di calce"/>
  <color symbol="V" value="8c877e" name="pietra grezza"/>
  <color symbol="A" value="827d74" name="pietra della colombaia" area="tower"/>
  <color symbol="M" value="827d74" name="merlo in pietra"/>
  <color symbol="U" value="2b2927" name="feritoia"/>

  <color symbol="F" value="9c6b43" name="pavimento in assi" area="house"/>
  <color symbol="G" value="875a36" name="solaio in legno"/>
  <color symbol="C" value="a89574" name="lastricato rustico" area="barn"/>
  <color symbol="P" value="6b482b" name="trave di quercia"/>
  <color symbol="K" value="9e5234" name="tettoia in legno" area="porch"/>

  <color symbol="J" value="b84a32" name="coppi di terracotta"/>
  <color symbol="X" value="a3422c" name="tetto del fienile"/>
  <color symbol="Y" value="d9b44a" name="covone di fieno"/>
  <color symbol="Q" value="4a89aa" name="acqua del pozzo"/>
  <color symbol="Z" value="568543" name="chioma d'albero" area="orchard"/>
  <color symbol="L" value="36454f" name="finestra"/>

  <color symbol="O" value="734b2c" name="porta di legno"/>
  <color symbol="o" value="4d311b" name="assi della porta"/>
  <color symbol="N" value="5c5750" name="stipite in pietra"/>
  <color symbol="k" value="7d5332" name="gradino di legno"/>
  <color symbol="T" value="7d5332" hidden="True"/>
  <color symbol="#20" value="734b2c" hidden="True"/>
  <color symbol="#21" value="4d311b" hidden="True"/>

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
