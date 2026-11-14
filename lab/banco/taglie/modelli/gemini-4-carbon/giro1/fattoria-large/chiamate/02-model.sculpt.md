# model.sculpt · gemini-4-carbon · 60 s

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

## Your program so far
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

## What the game made of it
It does not run: large, seed 1: riga 86, <color>: "value" è un colore esadecimale (rrggbb), non "124,148,92"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- Main farmhouse: h (house floor, 9 or 10 × 6 cells = 45-50 × 30 voxels inside), s (stair zone along back wall, 4 × 2 cells), w (house walls), d (front door, 3 cells = 15 voxels wide).
- Porch / lean-to: p (lean-to area, 4 × 6 cells = 20 × 30 voxels clear, attached to a side of the house), j (corner posts of the lean-to).
- Haystacks: y (haystacks behind the house, 2 × 2 cells).
- Farmyard & access: c (farmyard around the house), r (front road straight from door to front edge), x (wooden fence enclosing the yard where ground remains).
- Huge / Gargantuan additions (only where ground fits):
  - Barn / annex: a (barn interior, 6 × 4 cells), v (barn walls), b (barn wide doorway facing the yard).
  - Stone dovecote / silo tower: t (3 × 3 tower at a back corner of the house, crowned with battlements & slits).
  - Well: q (well in a 5 × 5 open patch of yard).
  - Cultivated vegetable plots & fruit trees: g (furrowed field alongside the fence), z (fruit tree in orchard grass).
-->
<sequence values="BHEhswdpycrxavbtqgzfFWRLJVKGQPIA#10#11#12#13#14#15#20#21Tk#90#91#92#94OoNMU" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WVQ"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="Q"/>

  <map scale="1/5 1/5 1" values="BHEhswdpjycrxavbtqgzm" symmetry="()">
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

      <!-- Lean-to porch (4 wide × 6 deep = 20 × 30 voxels clear) on left or right wall of the house, outer corners marked j for posts -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="jppp*/pppp*/pppp*/pppp*/pppp*/jppp*" symmetry="(x)" steps="1"/>

      <!-- Front door (3 cells = 15 voxels wide) on front wall and road straight to front edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Initial compact farmyard around house, porch, and road -->
      <all in="[wpjr]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard where extra ground exists (Huge & Gargantuan) -->
      <all in="cEEEEEE" out="*ccccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystacks behind the house (fits at Large and up) -->
      <one in="cc/cc/ww" out="yy/yy/**" symmetry="()" steps="2"/>

      <!-- Stone dovecote tower (3x3) attached to a back corner if yard space permits (Huge+) -->
      <one in="cccc/cccw/cccw/cwww" out="*ttt/*tt*/*tt*/****" symmetry="(x)" steps="1"/>
      <all in="tE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Barn / annex in expanded yard (6x4 interior, walls v, doorway b facing yard; fits Huge+) -->
      <one in="cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vvvvvv**/vaaaav**/vaaaav**/vaaaav**/vaaaav**/vvbbvv**" symmetry="(xy)" steps="1"/>

      <!-- Well in open 5x5 patch of yard (Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Wooden fence around yard where at least 2 cells of ground remain outside, leaving road open -->
      <all in="cEE" out="*x*" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="r/x" out="*/r" symmetry="()"/>
      <all in="rx" out="r*" symmetry="(x)" steps="1"/>

      <!-- Cultivated field plot outside the fence (Huge & Gargantuan) -->
      <one in="xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE/xEEEEEE" out="*ggggg*/*ggggg*/*ggggg*/*ggggg*/*ggggg*/*ggggg*" symmetry="(xy)" steps="2"/>

      <!-- Orchard fruit trees in remaining open grass (mainly Gargantuan / outer Huge) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/*z***/*****/*****" steps="4"/>
    </sequence>

    <map scale="5 5 1" values="BHEhswdpjycrxavbtqgzfFWRLJVKGQPIA#10#11#12#13#14#15#20#21Tk#90#91#92#94OoNMU" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="j" out="ppppp/p#10#10#10p/p#10#10#10p/p#10#10#10p/ppppp"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="ccccc/c#11#11#11c/c#11#11#11c/c#11#11#11c/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="q" out="qqqqq/q#12#12#12q/q#12I#12q/q#12#12#12q/qqqqq"/>
      <rule in="g" out="ggggg/AAAAA/ggggg/AAAAA/ggggg"/>
      <rule in="z" out="EEEEE/EEEEE/EE#13EE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. THE HEIGHTS -->
        <!-- Main farmhouse walls (w) & door column (d): 2 storeys = 64 high, topped with R -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all in="B w" out="w #14" steps="12"/>
        <all in="B d" out="d W" steps="12"/>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w #14"/><rule in="B d" out="d #14"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Main farmhouse floors (h) and stair zone (s): z=1 floor f, z=2 stair strip T, z=33 slab F, z=65 roof R -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Front doorway floor seed O at z=1 through the full 5-voxel thickness of wall d -->
        <all in="B r" out="#15 r" steps="1"/>
        <all in="W/#15" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <prl in="#15" out="B"/>

        <!-- Lean-to porch: posts (#10) rise 33, floor p stays on bottom, roof J at z=34 sloping up toward house wall -->
        <all in="B p" out="#15 p" steps="1"/>
        <all in="B #10" out="#10 P" steps="33"/>
        <prl in="#10" out="J"/>
        <all in="B #15" out="#15 B" steps="32"/>
        <prl in="#15" out="J"/>

        <!-- Haystacks (y): rise 14 and taper -->
        <all in="B y" out="y *" steps="10"/>
        <all in="*****/*****/**B**/*****/***** **y**/**y**/yyyyy/**y**/**y**" out="*****/*****/**y**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>

        <!-- Barn / annex: walls (v) & doorway (b) rise 36, floor (a) gets f at z=1 and roof J at z=37 -->
        <all steps="8"><rule in="B v" out="v V"/><rule in="B b" out="b V"/></all>
        <all in="B v" out="v #14" steps="10"/>
        <all in="B b" out="b V" steps="10"/>
        <all steps="18"><rule in="B v" out="v V"/><rule in="B b" out="b V"/></all>
        <prl><rule in="v" out="J"/><rule in="b" out="J"/></prl>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="J"/>

        <!-- Barn door seed O at z=1 where yard c meets barn doorway b -->
        <all in="B c" out="#15 c" steps="1"/>
        <all in="V#15" out="O*" symmetry="(xy)" steps="1"/>
        <all in="VO" out="OO" symmetry="(xy)" steps="4"/>
        <prl in="#15" out="B"/>

        <!-- Stone dovecote tower (t): rises 52 as stone Q, flat roof platform F inside and Q 1 higher on rim for battlements & slits -->
        <all in="B t" out="t Q" steps="50"/>
        <all in="*****/*****/**t**/*****/***** **Q**/**Q**/QQQQQ/**Q**/**Q**" out="*****/*****/**F**/*****/***** *****/*****/*****/*****/*****" symmetry="()"/>
        <all in="B t" out="t Q" steps="1"/>
        <prl in="t" out="Q"/>

        <!-- Wooden fence (#11): rises 7 -->
        <all in="B #11" out="#11 P" steps="6"/>
        <prl in="#11" out="P"/>

        <!-- Well: rim (#12) rises 8, water (I) rises 5 -->
        <all in="B #12" out="#12 Q" steps="7"/>
        <prl in="#12" out="Q"/>
        <all in="B I" out="I *" steps="4"/>

        <!-- Fruit trees (#13): trunk P rises 14, leafy crown G -->
        <all in="B #13" out="#13 P" steps="14"/>
        <prl in="#13" out="G"/>
        <all in="GB" out="*G" steps="3"/>
        <all in="B G" out="G *" steps="4"/>

        <!-- C. FULL SCALE PARTS & DETAILS -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the #14 bands of farmhouse and barn -->
        <one steps="20">
          <rule in="B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14 B#14/B#14/B#14/B#14/B#14/B#14" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="L#14#14#14#14B" out="*LLLL*"/>
        <all in="V/#14" out="*/V" symmetry="(xy)"/>
        <prl in="#14" out="W"/>

        <!-- Farmhouse hip roof (R) with eaves and gentle pitch -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

        <!-- Brick chimney K on farmhouse roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="KB" out="*K" steps="1" symmetry="(xy)"/>
        <all in="K*/*B" out="**/*K" steps="1" symmetry="(xy)"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Barn & porch roofs (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon style -->
  <color symbol="E" value="7c945c" hidden="True"/>
  <color symbol="h" value="c49e70" name="pavimento casa" area="house"/>
  <color symbol="s" value="b89062" name="vano scala" area="house"/>
  <color symbol="w" value="e0d4be" name="basamento casa" area="house"/>
  <color symbol="d" value="8e5a36" name="soglia" area="house"/>
  <color symbol="p" value="b89c78" name="acciottolato tettoia" area="porch"/>
  <color symbol="y" value="daba54" name="covone di fieno" area="yard"/>
  <color symbol="c" value="bca884" name="aia" area="yard"/>
  <color symbol="r" value="a49274" name="sentiero" area="road"/>
  <color symbol="a" value="a07e54" name="pavimento fienile" area="barn"/>
  <color symbol="v" value="b25e48" name="zoccolo fienile" area="barn"/>
  <color symbol="b" value="8c6c48" name="soglia fienile" area="barn"/>
  <color symbol="t" value="949088" name="base colombaia" area="tower"/>
  <color symbol="q" value="8a867e" name="base pozzo" area="yard"/>
  <color symbol="g" value="745c40" name="terra arata" area="field"/>
  <color symbol="A" value="688c48" name="ortaggi" area="field"/>

  <color symbol="f" value="b88c58" name="assi del pavimento"/>
  <color symbol="F" value="9e7446" name="solaio di legno"/>
  <color symbol="W" value="e4d8c4" name="intonaco chiaro"/>
  <color symbol="V" value="b8624a" name="legno rosso del fienile"/>
  <color symbol="Q" value="96928a" name="pietra grigia"/>
  <color symbol="R" value="b84c38" name="coppi rossi"/>
  <color symbol="J" value="9c523c" name="tetto di scandole"/>
  <color symbol="K" value="9e4838" name="camino di mattoni"/>
  <color symbol="P" value="785032" name="trave di quercia"/>
  <color symbol="L" value="6ca0bc" name="finestra"/>
  <color symbol="I" value="4c8cb8" name="acqua del pozzo"/>
  <color symbol="G" value="588644" name="chioma d'albero"/>

  <!-- Part colours -->
  <color symbol="O" value="845230" name="porta di legno"/>
  <color symbol="o" value="5c361e" name="doghe scure"/>
  <color symbol="N" value="6e482c" name="stipite"/>
  <color symbol="k" value="a67c4e" name="gradini di legno"/>
  <color symbol="T" value="a67c4e" name="scala"/>
  <color symbol="M" value="96928a" name="merli di pietra"/>
  <color symbol="U" value="32302e" name="feritoia"/>

  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>

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
